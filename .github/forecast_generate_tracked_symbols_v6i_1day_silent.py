
# -*- coding: utf-8 -*-
"""
forecast_generate_tracked_symbols_v6i_1day_silent.py
----------------------------------------------------
- يقرأ الرموز من جدول stocks بحيث is_tracked=True فقط.
- يولّد توقع يوم واحد (D+1) لكل رمز بنفس منطق v6i_fix2a (KNN+GBR + ترجيح حداثة + معايرة هيوبر + Conformal + حارس).
- مخرجات الشاشة: عدد الرموز فقط، ثم نسبة التقدم المئوية، وفي النهاية ملخص سريع بعدد الرموز المتوقعة والمتخطّاة.
- الكتابة إلى forecasts تتم بأسلوب upsert على (stock_symbol, forecast_date).

يعتمد فقط على جداولك:
  stocks(symbol, is_tracked), historical_data, technical_indicators (اختياري), candles_results (اختياري), forecasts.
"""

import os, sys, warnings, logging, contextlib, traceback, math, time
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client
from sklearn.neighbors import KNeighborsRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import HuberRegressor

# ========== إعدادات ==========
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

HORIZON = 1
MODEL_VERSION = "forecast_tracked_v6i_1day_silent_guard20"
COVERAGE_TARGET = 0.80

MIN_TRAIN_FLOOR = 80
MIN_TRAIN_CAP   = 140
TAIL_WF = 60
MIN_BAND_PCT = 0.010
MAX_LAG = 10
MIN_EXTRA_NONNULL = 30
MIN_EXTRA_DENSITY = 0.30  # 30%

PAGE = 1000  # حجم الصفحة في جلب الرموز

logging.basicConfig(level=logging.CRITICAL, format="%(message)s")
warnings.filterwarnings("ignore")

@contextlib.contextmanager
def silence():
    devnull = open(os.devnull, 'w')
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = devnull, devnull
        yield
    finally:
        sys.stdout, sys.stderr = old_out, old_err
        devnull.close()

# ========== Supabase I/O ==========
def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        raise RuntimeError("بيئة .env لا تحتوي SUPABASE_URL أو SUPABASE_SERVICE_ROLE")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

def list_tracked_symbols(sb):
    symbols = []
    start = 0
    while True:
        q = sb.table("stocks").select("symbol, is_tracked").eq("is_tracked", True).range(start, start + PAGE - 1)
        res = q.execute()
        rows = res.data or []
        if not rows:
            break
        for r in rows:
            sym = str(r.get("symbol","")).strip().upper()
            if sym:
                symbols.append(sym)
        if len(rows) < PAGE:
            break
        start += PAGE
    symbols = sorted(list({s for s in symbols if s}))
    return symbols

def fetch_hist(sb, sym):
    res = (sb.table("historical_data")
             .select("date, high, low, close, volume")
             .eq("stock_symbol", sym)
             .order("date", desc=False).execute())
    df = pd.DataFrame(res.data or [])
    if df.empty: 
        return pd.DataFrame()
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
    for c in ["high","low","close","volume"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["close"]).drop_duplicates("date").sort_values("date").reset_index(drop=True)
    return df

def fetch_indicators(sb, sym):
    try:
        res = (sb.table("technical_indicators")
                 .select("*")
                 .eq("stock_symbol", sym)
                 .order("date", desc=False).execute())
        di = pd.DataFrame(res.data or [])
        if di.empty or "date" not in di.columns: return pd.DataFrame()
        di["date"] = pd.to_datetime(di["date"]).dt.tz_localize(None)
        drop = {"stock_symbol","id","created_at","updated_at","pattern_name","notes"}
        keep = [c for c in di.columns if c not in drop]
        di = di[keep].drop_duplicates("date").reset_index(drop=True)
        return di
    except Exception:
        return pd.DataFrame()

def fetch_candles(sb, sym):
    try:
        res = (sb.table("candles_results")
                 .select("*")
                 .eq("stock_symbol", sym)
                 .order("date", desc=False).execute())
        dc = pd.DataFrame(res.data or [])
        if dc.empty or "date" not in dc.columns: return pd.DataFrame()
        dc["date"] = pd.to_datetime(dc["date"]).dt.tz_localize(None)
        drop = {"stock_symbol","id","created_at","updated_at","pattern_name","notes"}
        keep = [c for c in dc.columns if c not in drop]
        dc = dc[keep].drop_duplicates("date").reset_index(drop=True)
        return dc
    except Exception:
        return pd.DataFrame()

def upsert_forecasts(sb, rows):
    if rows:
        sb.table("forecasts").upsert(rows, on_conflict="stock_symbol,forecast_date").execute()

# ========== ميزات عامة (Robust) ==========
def robust_feature_frame(df_merge):
    df = df_merge.copy().sort_values("date").reset_index(drop=True)
    # أساسيات
    df["ret1"] = df["close"].pct_change()
    for win in (3,5,10,20,60):
        df[f"ret{win}"] = df["close"].pct_change(win)
        df[f"vol{win}"] = df["close"].pct_change().rolling(win).std()

    essential = ["date","close","volume","ret1","ret3","ret5","ret10","ret20","ret60",
                 "vol3","vol5","vol10","vol20","vol60"]
    cols = [c for c in df.columns if c in essential]

    # ضم الأعمدة الإضافية (التي تحتوي قيماً كافية)
    extras = [c for c in df.columns if c not in set(essential + ["high","low","stock_symbol"])]
    kept_extras = []
    n = len(df)
    for c in extras:
        nonnull = df[c].notna().sum()
        density = nonnull / max(1, n)
        if nonnull >= MIN_EXTRA_NONNULL or density >= MIN_EXTRA_DENSITY:
            kept_extras.append(c)
    cols = list(dict.fromkeys(cols + kept_extras))

    work = df[cols].copy()

    # تقويم القيم: ffill/bfill ثم إبدال الباقي بميديان العمود أو صفر
    for c in kept_extras:
        ser = work[c]
        if ser.dtype.kind in "biufc":
            med = float(np.nanmedian(ser.values)) if np.isfinite(np.nanmedian(ser.values)) else 0.0
            work[c] = ser.fillna(method="ffill").fillna(method="bfill").fillna(med)
        else:
            work[c] = ser.fillna(method="ffill").fillna(method="bfill").fillna(0)

    # لواحق حتى 10
    for c in [x for x in work.columns if x not in ["date"]]:
        for L in range(1, 11):
            work[f"{c}_lag{L}"] = work[c].shift(L)

    # يوم الأسبوع
    work["dow"] = pd.to_datetime(work["date"]).dt.dayofweek
    for d in range(5): work[f"dow_{d}"] = (work["dow"]==d).astype(int)

    # إزالة الصفوف الأولى فقط بسبب اللواحق
    work = work.iloc[10:].reset_index(drop=True)

    # تنظيف أخير
    work = work.replace([np.inf,-np.inf], np.nan)
    feature_cols = [c for c in work.columns if c != "date"]
    work[feature_cols] = work[feature_cols].fillna(0.0)

    return work, kept_extras

# ========== إعداد XY للنماذج المباشرة ==========
def prepare_xy(df_feat, df_hist, horizon):
    hist = df_hist.copy().sort_values("date").reset_index(drop=True)
    if df_feat.empty or hist.empty:
        return np.zeros((0,1)), np.zeros((0,))
    start_dt = df_feat["date"].iloc[0]
    hist = hist[hist["date"] >= start_dt].reset_index(drop=True)

    close = hist["close"].astype(float).values
    r_h = (pd.Series(close).shift(-horizon)/close - 1.0).values
    y = pd.Series(r_h).iloc[:-horizon].astype(float)

    X = df_feat.iloc[:-horizon, :].copy()
    Y = pd.DataFrame({"date": hist["date"].iloc[:len(y)].values, "y": y.values})
    Z = pd.merge(X, Y, on="date", how="inner")
    y_final = Z["y"].values
    X_final = Z.drop(columns=["date","y"]).values
    return X_final, y_final

def wf_tail_weights(y_true, pred_knn, pred_gbr, tail=TAIL_WF):
    a = np.array(y_true[-tail:]) if len(y_true)>tail else np.array(y_true)
    p1= np.array(pred_knn[-len(a):]); p2 = np.array(pred_gbr[-len(a):])
    denom = np.clip(np.abs(a), 1e-6, None)
    m1 = float(np.mean(np.abs(a - p1)/denom))
    m2 = float(np.mean(np.abs(a - p2)/denom))
    if not np.isfinite(m1): m1 = 1.0
    if not np.isfinite(m2): m2 = 1.0
    w_knn = np.clip(m2/(m1+m2), 0.20, 0.80)
    w_gbr = 1.0 - w_knn
    return float(w_knn), float(w_gbr)

def fit_predict_direct(df_feat, df_hist, horizon):
    X, y = prepare_xy(df_feat, df_hist, horizon)
    if len(X) > MIN_TRAIN_CAP:
        X = X[-MIN_TRAIN_CAP:]; y = y[-MIN_TRAIN_CAP:]
    if len(X) < MIN_TRAIN_FLOOR:
        return None, None, None, None, None, None

    # KNN محلي
    knn = Pipeline([("sc", RobustScaler()),
                    ("knn", KNeighborsRegressor(n_neighbors=12, weights="distance"))])

    # GBR مع ترجيح حداثة (أسي)
    t = np.arange(len(X))
    rec = (t - t.min()) / max(1, (t.max() - t.min()))
    w_rec = np.exp(2.0 * rec)
    gbr = GradientBoostingRegressor(
        loss="huber", alpha=0.9,
        n_estimators=800, learning_rate=0.05, max_depth=3, subsample=0.9, random_state=42
    )

    knn.fit(X, y)
    gbr.fit(X, y, sample_weight=w_rec)

    p1 = knn.predict(X)
    p2 = gbr.predict(X)
    w1, w2 = wf_tail_weights(y, p1, p2, TAIL_WF)
    pred_hist = (w1*p1 + w2*p2)

    # معايرة هيوبر على الذيل
    tail = min(TAIL_WF, len(y))
    if tail >= 20:
        try:
            hub = HuberRegressor(epsilon=1.35, alpha=1e-4, max_iter=2000)
            hub.fit(pred_hist[-tail:].reshape(-1,1), y[-tail:])
            a_lin = float(hub.coef_[0]); b_lin = float(hub.intercept_)
        except Exception:
            a_lin, b_lin = 1.0, 0.0
    else:
        a_lin, b_lin = 1.0, 0.0

    x_last = df_feat.drop(columns=["date"]).iloc[[-1]].values
    r_hat_raw = float(w1 * knn.predict(x_last)[0] + w2 * gbr.predict(x_last)[0])
    r_hat = float(a_lin * r_hat_raw + b_lin)

    return r_hat, w1, w2, y, pred_hist, (a_lin, b_lin)

# ========== حارس ونطاقات ==========
def conformal_width_from_resid(actual_price, pred_price, last_price, floor_pct):
    resid = np.abs(np.array(actual_price) - np.array(pred_price))
    if len(resid) >= 20:
        w = float(np.quantile(resid, 0.80))
    elif len(resid) >= 8:
        w = float(1.25 * np.median(resid))
    else:
        w = float("nan")
    floor = float(floor_pct) * float(last_price)
    if not np.isfinite(w) or w < floor: w = floor
    return w

def cap1_empirical(df_hist):
    rets = df_hist["close"].pct_change().dropna()
    if len(rets) >= 30:
        tail = rets.iloc[-120:] if len(rets) > 120 else rets
        cap = float(np.quantile(np.abs(tail.values), 0.90))
        cap = max(cap, 0.20)
        cap = float(np.clip(cap, 0.10, 0.35))
    else:
        cap = 0.20
    return cap

def guard_price(last_price, yhat, cap):
    lo_cap = last_price*(1.0 - cap)
    hi_cap = last_price*(1.0 + cap)
    return float(np.clip(yhat, lo_cap, hi_cap)), float(lo_cap), float(hi_cap)

def apply_min_band(y, lo, hi, last_price):
    min_band = max(MIN_BAND_PCT * last_price, 1e-4)
    if hi - lo < min_band:
        half = min_band / 2
        lo = min(y - half, lo); hi = max(y + half, hi)
    lo = min(lo, y); hi = max(hi, y)
    return lo, hi

# ========== تنبؤ رمز واحد ==========
def forecast_one_symbol(sb, sym):
    dfh = fetch_hist(sb, sym)
    if dfh is None or dfh.empty or len(dfh) < (MIN_TRAIN_FLOOR + HORIZON + MAX_LAG):
        return False  # SKIP

    dfi = fetch_indicators(sb, sym)
    dfc = fetch_candles(sb, sym)

    dfm = dfh.copy()
    for extra in [dfi, dfc]:
        if not extra.empty:
            dfm = pd.merge(dfm, extra, on="date", how="left")
    dfm = dfm.sort_values("date").reset_index(drop=True)

    df_feat, kept_extras = robust_feature_frame(dfm)
    nrows = df_feat.shape[0]
    if nrows < (MIN_TRAIN_FLOOR + HORIZON):
        return False  # SKIP

    last_price = float(dfh["close"].iloc[-1])
    last_date  = pd.to_datetime(dfh["date"]).max().date()
    future_date = pd.bdate_range(pd.Timestamp(last_date) + pd.offsets.BDay(1), periods=HORIZON).date[0]

    # توقع مباشر + معايرة (D+1)
    base_hist = dfh[dfh["date"]>=df_feat["date"].iloc[0]]
    r1, w1_knn, w1_gbr, y1_hist, y1_pred_hist, calib1 = fit_predict_direct(df_feat, base_hist, 1)
    if r1 is None:
        return False  # SKIP

    # سعر خام
    mid1_raw = float(last_price * (1.0 + r1))

    # حارس D+1
    cap1 = cap1_empirical(dfh)
    y1, lo1_cap, hi1_cap = guard_price(last_price, mid1_raw, cap1)

    # Conformal من بواقي الذيل
    actual1 = last_price*(1.0 + np.array(y1_hist))
    pred1   = last_price*(1.0 + np.array(y1_pred_hist))
    wabs1 = conformal_width_from_resid(actual1, pred1, last_price, 0.03)

    lo1 = max(lo1_cap, y1 - wabs1); hi1 = min(hi1_cap, y1 + wabs1)
    lo1, hi1 = apply_min_band(y1, lo1, hi1, last_price)

    rows = [{
        "stock_symbol": sym,
        "forecast_date": pd.Timestamp(future_date).date().isoformat(),
        "predicted_price": round(float(y1), 4),
        "confidence": round(float(np.clip(1.0 - (hi1 - lo1)/(max(1e-4, last_price*0.2)), 0.50, 0.95)), 2),
        "predicted_lo": round(float(lo1), 4),
        "predicted_hi": round(float(hi1), 4),
        "coverage_target": float(COVERAGE_TARGET),
        "model_version": MODEL_VERSION,
    }]

    upsert_forecasts(sb, rows)
    return True  # OK

# ========== التنفيذ الصامت مع نسبة تقدم ==========
def main():
    try:
        sb = get_client()
        syms = list_tracked_symbols(sb)
        total = len(syms)
        print(f"Symbols to process (is_tracked=True): {total}")
        if total == 0:
            print("Done. Symbols predicted: 0, Skipped: 0")
            return

        ok, skipped = 0, 0
        for i, sym in enumerate(syms, 1):
            try:
                ok_flag = forecast_one_symbol(sb, sym)
                if ok_flag:
                    ok += 1
                else:
                    skipped += 1
            except Exception:
                skipped += 1
            # نسبة التقدم
            pct = int((i / total) * 100)
            sys.stdout.write(f"\rProgress: {pct}%")
            sys.stdout.flush()

        print()  # سطر جديد بعد شريط التقدم
        print(f"Done. Symbols predicted: {ok}, Skipped: {skipped}")
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()

if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
import os, math, traceback
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")
SYMBOLS_FILTER = [s.strip().upper() for s in os.getenv("SYMBOLS_FILTER","").split(",") if s.strip()]

def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        print("[WARN] Missing Supabase env vars."); return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    except Exception as e:
        print(f"[WARN] Cannot connect Supabase: {e}"); return None

sb = get_client()

# -------- helpers: indicators --------
def sma(series, n): return series.rolling(n, min_periods=n).mean()
def ema(series, n): return series.ewm(span=n, adjust=False, min_periods=n).mean()

def rsi(close, period=14):
    delta = close.diff()
    gain = (delta.clip(lower=0)).rolling(period, min_periods=period).mean()
    loss = (-delta.clip(upper=0)).rolling(period, min_periods=period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

def bollinger(close, n=20, k=2):
    ma = sma(close, n); sd = close.rolling(n, min_periods=n).std()
    return ma + k*sd, ma, ma - k*sd

def stoch_kd(high, low, close, k_period=14, d_period=3):
    lowest = low.rolling(k_period, min_periods=k_period).min()
    highest = high.rolling(k_period, min_periods=k_period).max()
    denom = (highest - lowest).replace(0, np.nan)
    k = (close - lowest) * 100 / denom
    d = k.rolling(d_period, min_periods=d_period).mean()
    return k, d

def williams_r(high, low, close, period=14):
    highest = high.rolling(period, min_periods=period).max()
    lowest  = low .rolling(period, min_periods=period).min()
    denom = (highest - lowest).replace(0, np.nan)
    return -100 * (highest - close) / denom

def atr(high, low, close, period=14):
    prev_close = close.shift(1)
    tr = pd.DataFrame({
        "hl": (high - low).abs(),
        "hc": (high - prev_close).abs(),
        "lc": (low  - prev_close).abs()
    }).max(axis=1)
    return tr.rolling(period, min_periods=period).mean()

# -------- candles (قواعد مختصرة، أبقِ ما لديك إن رغبت) --------
def detect_candles(df):
    out = []
    for i in range(1, len(df)):
        try:
            row = df.iloc[i]; prev = df.iloc[i-1]
            o,h,l,c = row['open'],row['high'],row['low'],row['close']
            po,ph,pl,pc = prev['open'],prev['high'],prev['low'],prev['close']
            body = abs(c-o); rng = (h-l) if (h is not None and l is not None) else None
            if rng and body < (0.1*rng): out.append((row['date'], "Doji", None, None))
            if pc < po and c > o and c >= po and o <= pc: out.append((row['date'], "Bullish Engulfing", True, 0.9))
            if pc > po and c < o and c <= po and o >= pc: out.append((row['date'], "Bearish Engulfing", False, 0.9))
            lw = min(o,c) - l; uw = h - max(o,c)
            if lw > 2*body and uw < body: out.append((row['date'], "Hammer", True, 0.8))
            if uw > 2*body and lw < body: out.append((row['date'], "Shooting Star", False, 0.8))
        except Exception: continue
    return out

# -------- DB helpers --------
def fetch_indicator_defs():
    if sb is None: return []
    try:
        res = sb.table("indicator_definitions").select("*").execute()
        return res.data or []
    except Exception as e:
        print(f"[WARN] fetch_indicator_defs failed: {e}"); return []

def load_symbols():
    if sb is None: return SYMBOLS_FILTER
    try:
        q = sb.table("stocks").select("symbol").eq("is_tracked", True).execute()
        syms = [r["symbol"] for r in (q.data or []) if r.get("symbol")]
        if SYMBOLS_FILTER: syms = [s for s in syms if s in SYMBOLS_FILTER]
        return syms
    except Exception as e:
        print(f"[WARN] load_symbols failed: {e}"); return SYMBOLS_FILTER

def fetch_history(sym):
    if sb is None: return pd.DataFrame()
    try:
        res = (sb.table("historical_data")
               .select("date,open,high,low,close,volume")
               .eq("stock_symbol", sym).order("date")).execute()
        return pd.DataFrame(res.data or [])
    except Exception as e:
        print(f"[WARN] fetch_history failed for {sym}: {e}"); return pd.DataFrame()

def upsert_indicators(rows):
    if sb is None or not rows: return
    try:
        sb.table("technical_indicators").upsert(rows, on_conflict="stock_symbol,date").execute()
    except Exception as e:
        print(f"[WARN] upsert technical_indicators failed: {e}")

def upsert_candles(rows):
    if sb is None or not rows: return
    try:
        sb.table("candle_patterns").upsert(rows, on_conflict="stock_symbol,date,pattern_name").execute()
    except Exception as e:
        print(f"[WARN] upsert candle_patterns failed: {e}")

# -------- compute indicators --------
def compute_technical_set(df, defs):
    close = df['close'].astype(float); high = df['high'].astype(float); low = df['low'].astype(float)
    out = pd.DataFrame(index=df.index)

    # 1) حسب indicator_definitions (مطابقة لأعمدتك الحالية)
    for d in defs:
        if d["type"] != "technical": continue
        name = d["name"]; period = d.get("period")
        try:
            if name == "RSI": out["rsi"] = rsi(close, int(period or 14))
            elif name == "EMA12": out["ema12"] = ema(close, int(period or 12))
            elif name == "EMA26": out["ema26"] = ema(close, int(period or 26))
            elif name == "SMA20": out["sma20"] = sma(close, int(period or 20))
            elif name == "SMA50": out["sma50"] = sma(close, int(period or 50))
            elif name == "SMA200": out["sma200"] = sma(close, int(period or 200))
            elif name == "MACD": out["macd"] = ema(close,12) - ema(close,26)
            elif name == "MACD_signal":
                if "macd" not in out: out["macd"] = ema(close,12) - ema(close,26)
                out["macd_signal"] = out["macd"].ewm(span=9, adjust=False, min_periods=9).mean()
            elif name == "MACD_histogram":
                if "macd" not in out: out["macd"] = ema(close,12) - ema(close,26)
                if "macd_signal" not in out: out["macd_signal"] = out["macd"].ewm(span=9, adjust=False, min_periods=9).mean()
                out["macd_histogram"] = out["macd"] - out["macd_signal"]  # <-- اسم عمودك
            elif name in ["Bollinger_upper","Bollinger_middle","Bollinger_lower"]:
                upper, mid, lower = bollinger(close, int(period or 20), 2)
                out["boll_upper"], out["boll_middle"], out["boll_lower"] = upper, mid, lower
            elif name == "Stochastic_K":
                k, d_ = stoch_kd(high, low, close, int(period or 14), 3)
                out["stochastic_k"], out["stochastic_d"] = k, d_
            elif name == "Stochastic_D":
                if "stochastic_d" not in out:
                    k, d_ = stoch_kd(high, low, close, 14, int(period or 3))
                    out["stochastic_k"], out["stochastic_d"] = k, d_
            elif name == "Williams_%R":
                out["williams_r"] = williams_r(high, low, close, int(period or 14))
        except Exception: continue

    # 2) إضافات ثابتة (جديدة) — ستحتاج أعمدة في الجدول
    out["volatility_20"] = close.pct_change().rolling(20, min_periods=20).std()
    out["atr14"] = atr(high, low, close, 14)

    if "macd" in out.columns and "macd_signal" in out.columns:
        cross = np.sign((out["macd"] - out["macd_signal"]).diff()).fillna(0.0)
        out["macd_cross"] = cross.replace({-1.0:-1, 0.0:0, 1.0:1}).astype("Int8")

    if "rsi" in out.columns:
        z = pd.Series(1, index=out.index); z = z.mask(out["rsi"] < 30, 0).mask(out["rsi"] > 70, 2)
        out["rsi_zone"] = z.astype("Int8")

    out = out.replace([np.inf, -np.inf], np.nan)
    all_nan_cols = [c for c in out.columns if out[c].isna().all()]
    if all_nan_cols: out = out.drop(columns=all_nan_cols)
    return out

def main():
    defs = fetch_indicator_defs(); syms = load_symbols()
    print(f"[INFO] Computing indicators & candles for {len(syms)} symbols...")
    total_t = 0; total_c = 0
    with tqdm(total=len(syms), desc="Indicators/Candles", unit="sym") as bar:
        for sym in syms:
            try:
                hist = fetch_history(sym)
                if hist.empty: bar.update(1); continue
                hist = hist.sort_values("date").reset_index(drop=True)
                for col in ["open","high","low","close","volume"]:
                    if col in hist.columns: hist[col] = pd.to_numeric(hist[col], errors="coerce")
                hist = hist.dropna(subset=["open","high","low","close"])

                tech = compute_technical_set(hist, defs)
                rows_t = []
                idx_map = {i: hist.loc[i, "date"] for i in tech.index}
                for i, row in tech.iterrows():
                    values = {k: float(v) for k, v in row.items() if isinstance(v, (int,float,np.floating)) and not pd.isna(v)}
                    if "macd_cross" in row and not pd.isna(row["macd_cross"]): values["macd_cross"] = int(row["macd_cross"])
                    if "rsi_zone" in row and not pd.isna(row["rsi_zone"]):   values["rsi_zone"] = int(row["rsi_zone"])
                    if not values: continue
                    payload = {"stock_symbol": sym, "date": idx_map[i]}; payload.update(values)
                    rows_t.append(payload)
                upsert_indicators(rows_t); total_t += len(rows_t)

                patts = detect_candles(hist)
                rows_c = [{"stock_symbol": sym, "date": d, "pattern_name": name,
                           "description": None, "bullish": bull, "confidence": conf}
                          for d, name, bull, conf in patts]
                upsert_candles(rows_c); total_c += len(rows_c)
            except Exception as e:
                print(f"[WARN] compute failed for {sym}: {e}"); traceback.print_exc()
            finally:
                bar.set_postfix({"last": sym, "tech_rows": total_t, "candle_rows": total_c}); bar.update(1)
    print(f"[INFO] Done. Technical rows upserted: {total_t}, Candle rows upserted: {total_c}")

if __name__ == "__main__":
    main()

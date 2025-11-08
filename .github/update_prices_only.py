import os, time, traceback
from datetime import datetime, timedelta, timezone
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# نخزّن في القاعدة دوماً بتوقيت UTC (العرض يتحكم به فلتر fmt في الواجهة)
UTC = timezone.utc

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")
SYMBOLS_FILTER = [s.strip().upper() for s in os.getenv("SYMBOLS_FILTER","").split(",") if s.strip()]

def now_ts_utc():
    return datetime.now(UTC).isoformat()

def get_client():
    try:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
            print("[WARN] Missing SUPABASE env; will run read-only.")
            return None
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    except Exception as e:
        print(f"[WARN] Supabase client error: {e}")
        return None

sb = get_client()

def load_symbols():
    if sb is None:
        return SYMBOLS_FILTER
    try:
        q = sb.table("stocks").select("symbol,name").execute()
        symbols = []
        for r in (q.data or []):
            s = r.get("symbol")
            if s:
                symbols.append(s)
        if SYMBOLS_FILTER:
            symbols = [s for s in symbols if s in SYMBOLS_FILTER]
        return symbols
    except Exception as e:
        print(f"[WARN] load_symbols failed: {e}")
        return SYMBOLS_FILTER

def load_existing_names(symbols):
    if sb is None or not symbols:
        return {}
    try:
        names = {}
        chunk = 1000
        for i in range(0, len(symbols), chunk):
            sub = symbols[i:i+chunk]
            res = sb.table("stocks").select("symbol,name").in_("symbol", sub).execute()
            for r in (res.data or []):
                if r.get("symbol"):
                    names[r["symbol"]] = r.get("name")
        return names
    except Exception as e:
        print(f"[WARN] load_existing_names failed: {e}")
        return {}

def yahoo_symbol(sym: str) -> str:
    # Yahoo uses '-' instead of '.' for share classes (e.g., BRK.B -> BRK-B)
    return sym.replace('.', '-')

def resolve_name(sym, existing_name, ticker):
    if existing_name and str(existing_name).strip():
        return existing_name
    try:
        info = {}
        try:
            info = ticker.get_info()
        except Exception:
            info = getattr(ticker, "info", {}) or {}
        for key in ("shortName","longName","displayName","symbol"):
            val = info.get(key)
            if val:
                return str(val)
    except Exception:
        pass
    return sym  # fallback to symbol to satisfy NOT NULL

def to_utc_iso_floor_minute(ts) -> str:
    """
    يحوّل أي طابع زمني إلى UTC ويزيل الثواني والميكرو، ثم يعيده كـ ISO-8601.
    يدعم pandas.Timestamp أو datetime.
    """
    if isinstance(ts, pd.Timestamp):
        t = ts
        if t.tzinfo is None:
            t = t.tz_localize("UTC")
        else:
            t = t.tz_convert("UTC")
        t = t.to_pydatetime()
    elif isinstance(ts, datetime):
        t = ts
        if t.tzinfo is None:
            t = t.replace(tzinfo=UTC)
        else:
            t = t.astimezone(UTC)
    else:
        # fallback: اعتبره datetime بدون tz
        t = datetime.fromisoformat(str(ts)).replace(tzinfo=UTC)
    return t.replace(second=0, microsecond=0).isoformat()

def upsert_stock(symbol, row):
    if sb is None:
        return
    try:
        sb.table("stocks").upsert([row], on_conflict="symbol").execute()
    except Exception as e:
        print(f"[WARN] upsert_stock failed for {symbol}: {e}")

def main():
    symbols = load_symbols()
    print(f"[INFO] Symbols to update: {len(symbols)}")
    existing_names = load_existing_names(symbols)

    for sym in symbols:
        try:
            ysym = yahoo_symbol(sym)
            t = yf.Ticker(ysym)
            # آخر شهر يكفي لاستخراج آخر إغلاق
            df = t.history(period="1mo", auto_adjust=False)
            if df is None or df.empty:
                # mark as not tracked but keep a non-null name
                nm = existing_names.get(sym) or sym
                upsert_stock(sym, {"symbol": sym, "name": nm, "is_tracked": False})
                continue

            df = df[['Close','Volume']].dropna()
            last_idx = df.index[-1]
            prev_idx = df.index[-2] if len(df) > 1 else None

            last_close = float(df.loc[last_idx, 'Close'])
            prev_close = float(df.loc[prev_idx, 'Close']) if prev_idx is not None else None
            change = None if prev_close is None else last_close - prev_close
            change_pct = None if prev_close is None else (change / prev_close) * 100.0

            # market cap (best-effort)
            mcap = None
            try:
                fi = t.fast_info
                mcap = getattr(fi, "market_cap", None)
                if mcap is not None:
                    mcap = int(mcap)
            except Exception:
                pass

            name_val = resolve_name(sym, existing_names.get(sym), t)

            # <-- التعديل المهم: last_updated بوقت الإغلاق الفعلي على UTC وليس تاريخ فقط -->
            last_updated_iso = to_utc_iso_floor_minute(last_idx)

            row = {
                "symbol": sym,
                "name": name_val,
                "price": last_close,
                "change": change,
                "change_percent": change_pct,
                "volume": int(df.loc[last_idx, 'Volume']) if pd.notna(df.loc[last_idx, 'Volume']) else None,
                "market_cap": mcap,
                "last_updated": last_updated_iso,  # UTC ISO بدون ثواني/ميكرو
                "is_tracked": True
            }
            upsert_stock(sym, row)
        except Exception as e:
            print(f"[WARN] update failed for {sym}: {e}")
            traceback.print_exc()
            # ensure we do not violate NOT NULL for name even on failure
            nm = existing_names.get(sym) or sym
            upsert_stock(sym, {"symbol": sym, "name": nm, "is_tracked": False})
        time.sleep(0.05)
    print("[INFO] Prices update completed.")

if __name__ == "__main__":
    main()

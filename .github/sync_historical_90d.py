import os, time, traceback
from datetime import datetime, timedelta, timezone
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

load_dotenv()
TZ = timezone(timedelta(hours=3))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")
SYMBOLS_FILTER = [s.strip().upper() for s in os.getenv("SYMBOLS_FILTER","").split(",") if s.strip()]

def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        print("[WARN] Missing Supabase env vars.")
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    except Exception as e:
        print(f"[WARN] Cannot connect Supabase: {e}")
        return None

sb = get_client()

def load_symbols():
    """Load only symbols marked is_tracked=True (i.e., passed prices update)."""
    if sb is None:
        return SYMBOLS_FILTER
    try:
        q = sb.table("stocks").select("symbol").eq("is_tracked", True).execute()
        syms = [r["symbol"] for r in (q.data or []) if r.get("symbol")]
        if SYMBOLS_FILTER:
            syms = [s for s in syms if s in SYMBOLS_FILTER]
        return syms
    except Exception as e:
        print(f"[WARN] load_symbols failed: {e}")
        return SYMBOLS_FILTER

def yahoo_symbol(sym: str) -> str:
    """Yahoo uses '-' instead of '.' for share classes (e.g., BRK.B -> BRK-B)."""
    return sym.replace(".", "-")

def upsert_rows(rows):
    if sb is None or not rows:
        return
    try:
        sb.table("historical_data").upsert(rows, on_conflict="stock_symbol,date").execute()
    except Exception as e:
        print(f"[WARN] upsert_rows failed: {e}")

def sync_symbol(sym: str) -> int:
    """Fetch ~last 90 trading days and upsert. Returns number of rows upserted."""
    try:
        t = yf.Ticker(yahoo_symbol(sym))
        # 6 months window usually > 90 trading days; we then trim to ~130 rows to be safe
        df = t.history(period="6mo", auto_adjust=False)
        if df is None or df.empty:
            return 0
        # Ensure columns exist and numeric
        df = df[['Open','High','Low','Close','Volume']].apply(pd.to_numeric, errors='coerce').dropna()
        df = df.tail(130).reset_index()  # ~90 business days safeguard
        rows = []
        for _, r in df.iterrows():
            rows.append({
                "stock_symbol": sym,
                "date": r["Date"].date().isoformat(),
                "open": float(r["Open"]) if pd.notna(r["Open"]) else None,
                "high": float(r["High"]) if pd.notna(r["High"]) else None,
                "low": float(r["Low"]) if pd.notna(r["Low"]) else None,
                "close": float(r["Close"]) if pd.notna(r["Close"]) else None,
                "volume": int(r["Volume"]) if pd.notna(r["Volume"]) else None,
            })
        upsert_rows(rows)
        return len(rows)
    except Exception as e:
        print(f"[WARN] sync_symbol failed for {sym}: {e}")
        traceback.print_exc()
        return 0

def main():
    symbols = load_symbols()
    total = len(symbols)
    print(f"[INFO] Syncing historical ~90d for {total} tracked symbols...")
    total_rows = 0
    with tqdm(total=total, desc="Historical 90d", unit="sym") as bar:
        for idx, sym in enumerate(symbols, 1):
            cnt = sync_symbol(sym)
            total_rows += cnt
            bar.set_postfix({"last": sym, "rows": cnt, "total_rows": total_rows, "done": f"{idx}/{total}"})
            bar.update(1)
            time.sleep(0.05)
    print(f"[INFO] Done. Total rows upserted: {total_rows}")

if __name__ == "__main__":
    main()

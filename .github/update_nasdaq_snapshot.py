import os
import time
import json
import traceback
from datetime import datetime, timezone
from urllib import request, error

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

YAHOO_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EIXIC"
YAHOO_NEWS_ENDPOINT = "https://query1.finance.yahoo.com/v2/finance/news?category=generalnews&symbol=%5EIXIC&region=US"
YAHOO_SECTOR_ENDPOINT = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=sector_etf&count=25"
YAHOO_HEATMAP_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbols}"
NASDAQ_ADVANCERS_ENDPOINT = "https://api.nasdaq.com/api/marketmovers?type=advancers&exchange=nasdaq"
NASDAQ_DECLINERS_ENDPOINT = "https://api.nasdaq.com/api/marketmovers?type=decliners&exchange=nasdaq"

BIG_TECH_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "NFLX", "ADBE"]

NASDAQ_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, مثل Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.nasdaq.com",
    "Referer": "https://www.nasdaq.com/",
}

YAHOO_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": NASDAQ_HEADERS["User-Agent"],
    "Connection": "keep-alive",
    "Accept-Language": "en-US,en;q=0.9",
}


def log(message: str):
    print(f"[update_nasdaq] {message}")


def fetch_json(url: str, headers: dict | None = None, max_retries: int = 4, backoff: float = 1.5):
    attempt = 0
    hdrs = headers or {}
    if not hdrs:
        hdrs = YAHOO_HEADERS
    else:
        # ensure user agent exists to avoid 429s
        hdrs = {**YAHOO_HEADERS, **headers}

    while True:
        try:
            req = request.Request(url, headers=hdrs)
            with request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw)
        except error.HTTPError as http_err:
            status = getattr(http_err, 'code', None)
            if status in (429, 503) and attempt < max_retries:
                delay = backoff ** attempt
                log(f"HTTP {status} from {url}; retrying in {delay:.1f}s")
                time.sleep(delay)
                attempt += 1
                continue
            raise
        except error.URLError as url_err:
            if attempt < max_retries:
                delay = backoff ** attempt
                log(f"URL error {url_err.reason} for {url}; retrying in {delay:.1f}s")
                time.sleep(delay)
                attempt += 1
                continue
            raise


def parse_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        cleaned = str(value).replace(",", "").strip()
        if not cleaned:
            return None
        return float(cleaned)
    except Exception:
        return None


def fetch_quote():
    data = fetch_json(YAHOO_QUOTE_ENDPOINT)
    quote = (data.get("quoteResponse", {}).get("result") or [None])[0]
    if not quote:
        raise RuntimeError("Yahoo Finance quote response empty")
    ts = quote.get("regularMarketTime")
    trading_dt = datetime.fromtimestamp(ts, timezone.utc) if ts else datetime.now(timezone.utc)
    return {
        "trading_date": trading_dt.date().isoformat(),
        "close": parse_number(quote.get("regularMarketPrice", quote.get("regularMarketPreviousClose"))),
        "change": parse_number(quote.get("regularMarketChange")),
        "change_percent": parse_number(quote.get("regularMarketChangePercent")),
        "open": parse_number(quote.get("regularMarketOpen")),
        "high": parse_number(quote.get("regularMarketDayHigh")),
        "low": parse_number(quote.get("regularMarketDayLow")),
        "volume": parse_number(quote.get("regularMarketVolume")),
    }


def fetch_advancers_decliners():
    try:
        adv_data = fetch_json(NASDAQ_ADVANCERS_ENDPOINT, NASDAQ_HEADERS)
        dec_data = fetch_json(NASDAQ_DECLINERS_ENDPOINT, NASDAQ_HEADERS)
        return {
            "advancers": parse_number(adv_data.get("data", {}).get("totalRecords")) or parse_number(adv_data.get("data", {}).get("count")) or None,
            "decliners": parse_number(dec_data.get("data", {}).get("totalRecords")) or parse_number(dec_data.get("data", {}).get("count")) or None,
        }
    except Exception as exc:
        log(f"warn: advancers/decliners unavailable -> {exc}")
        return {"advancers": None, "decliners": None}


def fetch_sector_performance():
    try:
        data = fetch_json(YAHOO_SECTOR_ENDPOINT, {"User-Agent": NASDAQ_HEADERS["User-Agent"]})
        quotes = data.get("finance", {}).get("result", [{}])[0].get("quotes", [])
        sectors = []
        for item in quotes:
            perf = parse_number(item.get("regularMarketChangePercent") or item.get("ytdReturn"))
            sectors.append({
                "symbol": item.get("symbol"),
                "name": item.get("shortName") or item.get("longName"),
                "change_percent": perf,
            })
        ranked = [s for s in sectors if s.get("change_percent") is not None]
        ranked.sort(key=lambda r: r["change_percent"], reverse=True)
        leading = ranked[0]["name"] if ranked else None
        lagging = ranked[-1]["name"] if ranked else None
        return sectors, leading, lagging
    except Exception as exc:
        log(f"warn: sector performance unavailable -> {exc}")
        return [], None, None


def fetch_heatmap():
    try:
        symbols_param = "%2C".join(BIG_TECH_SYMBOLS)
        endpoint = YAHOO_HEATMAP_ENDPOINT.format(symbols=symbols_param)
        data = fetch_json(endpoint)
        items = data.get("quoteResponse", {}).get("result", [])
        heatmap = []
        for item in items:
            heatmap.append({
                "symbol": item.get("symbol"),
                "name": item.get("longName") or item.get("shortName"),
                "change_percent": parse_number(item.get("regularMarketChangePercent")),
                "market_cap": parse_number(item.get("marketCap")),
            })
        return heatmap
    except Exception as exc:
        log(f"warn: heatmap unavailable -> {exc}")
        return []


def fetch_headline():
    try:
        data = fetch_json(YAHOO_NEWS_ENDPOINT)
        stream = data.get("data", {}).get("main", {}).get("stream", [])
        for item in stream:
            title = item.get("title")
            link = item.get("link")
            if title and link:
                return title, link
    except Exception as exc:
        log(f"warn: headline unavailable -> {exc}")
    return None, None


def call_supabase(payload: dict):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE")

    url = f"{SUPABASE_URL}/rest/v1/rpc/upsert_nasdaq_daily_snapshot"
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
    }
    req = request.Request(url, data=body, headers=headers, method="POST")
    with request.urlopen(req, timeout=30) as resp:
        resp_body = resp.read().decode("utf-8")
        if resp.status >= 400:
            raise RuntimeError(f"Supabase error {resp.status}: {resp_body}")
        try:
            return json.loads(resp_body)
        except json.JSONDecodeError:
            return None


def main():
    log("Collecting Nasdaq snapshot...")
    quote = fetch_quote()
    adv_decl = fetch_advancers_decliners()
    sectors, leading, lagging = fetch_sector_performance()
    heatmap = fetch_heatmap()
    headline, headline_source = fetch_headline()

    metadata = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance / Nasdaq API",
        "notices": [],
    }
    if adv_decl["advancers"] is None or adv_decl["decliners"] is None:
        metadata["notices"].append("advancers_decliners_unavailable")
    if not sectors:
        metadata["notices"].append("sector_performance_unavailable")
    if not heatmap:
        metadata["notices"].append("heatmap_unavailable")
    if not headline:
        metadata["notices"].append("headline_unavailable")

    payload = {
        "p_trading_date": quote["trading_date"],
        "p_close_price": quote["close"],
        "p_change_points": quote["change"],
        "p_change_percent": quote["change_percent"],
        "p_open_price": quote["open"],
        "p_high_price": quote["high"],
        "p_low_price": quote["low"],
        "p_volume": quote["volume"],
        "p_advancers_count": adv_decl["advancers"],
        "p_decliners_count": adv_decl["decliners"],
        "p_leading_sector": leading,
        "p_lagging_sector": lagging,
        "p_headline": headline,
        "p_headline_source": headline_source,
        "p_heatmap_json": heatmap,
        "p_sectors_json": sectors,
        "p_metadata_json": metadata,
    }

    log(f"Upserting snapshot for {quote['trading_date']}...")
    call_supabase(payload)
    log("Done.")


if __name__ == "__main__":
    try:
        main()
    except error.HTTPError as http_err:
        log(f"HTTP error: {http_err.code} {http_err.reason}")
        raise
    except Exception as exc:
        log(f"Failed: {exc}")
        traceback.print_exc()
        raise

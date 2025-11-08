import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SUPABASE_ENV_PATHS = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', 'api-server', '.env'),
  path.resolve(__dirname, '..', 'api-server', 'env'),
  path.resolve(__dirname, '..', 'env'),
];

const BIG_TECH_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO', 'NFLX', 'ADBE'];
const YAHOO_QUOTE_ENDPOINT = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_NEWS_ENDPOINT = 'https://query1.finance.yahoo.com/v2/finance/news';
const YAHOO_SECTOR_ENDPOINT = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=sector_etf&count=25';
const NASDAQ_ADVANCERS_ENDPOINT = 'https://api.nasdaq.com/api/marketmovers?type=advancers&exchange=nasdaq';
const NASDAQ_DECLINERS_ENDPOINT = 'https://api.nasdaq.com/api/marketmovers?type=decliners&exchange=nasdaq';

const NASDAQ_REQUEST_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://www.nasdaq.com',
  'Referer': 'https://www.nasdaq.com/'
};

function parseNumber(value) {
  if (value === null || typeof value === 'undefined') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[,\s]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readSupabaseEnv() {
  const result = {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (result.supabaseUrl && result.serviceRole) {
    return result;
  }

  for (const candidate of DEFAULT_SUPABASE_ENV_PATHS) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      if (!result.supabaseUrl) {
        const urlMatch = raw.match(/SUPABASE_URL\s*=\s*"?([^"\n]+)"?/i);
        if (urlMatch) {
          result.supabaseUrl = urlMatch[1].trim();
        }
      }
      if (!result.serviceRole) {
        const keyMatch = raw.match(/SUPABASE_SERVICE_ROLE\s*=\s*"?([^"\n]+)"?/i);
        if (keyMatch) {
          result.serviceRole = keyMatch[1].trim();
        }
      }
      if (result.supabaseUrl && result.serviceRole) {
        break;
      }
    } catch (error) {
      // ignore missing files
    }
  }

  if (!result.supabaseUrl || !result.serviceRole) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE. Please set them in environment variables or .env files.');
  }

  return result;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) ${response.statusText}`);
  }
  return response.json();
}

async function fetchNasdaqQuote() {
  const data = await fetchJson(`${YAHOO_QUOTE_ENDPOINT}?symbols=%5EIXIC`);
  const quote = data?.quoteResponse?.result?.[0];
  if (!quote) {
    throw new Error('Nasdaq quote not found from Yahoo Finance');
  }
  return {
    tradingDate: quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000) : new Date(),
    close: parseNumber(quote.regularMarketPrice ?? quote.regularMarketPreviousClose),
    change: parseNumber(quote.regularMarketChange),
    changePercent: parseNumber(quote.regularMarketChangePercent),
    open: parseNumber(quote.regularMarketOpen),
    high: parseNumber(quote.regularMarketDayHigh),
    low: parseNumber(quote.regularMarketDayLow),
    volume: parseNumber(quote.regularMarketVolume),
  };
}

async function fetchAdvancersDecliners() {
  try {
    const [advancersData, declinersData] = await Promise.all([
      fetchJson(NASDAQ_ADVANCERS_ENDPOINT, { headers: NASDAQ_REQUEST_HEADERS }),
      fetchJson(NASDAQ_DECLINERS_ENDPOINT, { headers: NASDAQ_REQUEST_HEADERS }),
    ]);

    const extractTotal = (payload) => {
      const total = payload?.data?.totalRecords ?? payload?.data?.count ?? payload?.data?.rows?.length;
      return total ? Number(total) : null;
    };

    return {
      advancers: extractTotal(advancersData),
      decliners: extractTotal(declinersData),
    };
  } catch (error) {
    console.warn('⚠️  Failed to fetch advancers/decliners from Nasdaq API:', error.message);
    return { advancers: null, decliners: null };
  }
}

async function fetchSectorPerformance() {
  try {
    const data = await fetchJson(YAHOO_SECTOR_ENDPOINT, {
      headers: { 'User-Agent': NASDAQ_REQUEST_HEADERS['User-Agent'] },
    });
    const sectors = data?.finance?.result?.[0]?.quotes ?? [];
    const simplified = sectors.map((item) => ({
      symbol: item.symbol,
      shortName: item.shortName || item.longName,
      oneDayChange: parseNumber(item.regularMarketChangePercent ?? item.trailingAnnualDividendYield),
    }));

    const sorted = simplified
      .filter((item) => item.oneDayChange !== null && Number.isFinite(item.oneDayChange))
      .sort((a, b) => b.oneDayChange - a.oneDayChange);

    return {
      sectors: simplified,
      leading: sorted[0]?.shortName || null,
      lagging: sorted[sorted.length - 1]?.shortName || null,
    };
  } catch (error) {
    console.warn('⚠️  Failed to fetch sector performance:', error.message);
    return { sectors: [], leading: null, lagging: null };
  }
}

async function fetchHeatmap() {
  try {
    const symbols = BIG_TECH_SYMBOLS.join(',');
    const data = await fetchJson(`${YAHOO_QUOTE_ENDPOINT}?symbols=${encodeURIComponent(symbols)}`);
    const result = data?.quoteResponse?.result ?? [];
    return result.map((item) => ({
      symbol: item.symbol,
      longName: item.longName || item.shortName,
      weightPercent: parseNumber(item.marketCap),
      changePercent: parseNumber(item.regularMarketChangePercent),
    }));
  } catch (error) {
    console.warn('⚠️  Failed to fetch heatmap data:', error.message);
    return [];
  }
}

async function fetchHeadline() {
  try {
    const params = new URLSearchParams({
      category: 'generalnews',
      symbol: '%5EIXIC',
      region: 'US',
    });
    const data = await fetchJson(`${YAHOO_NEWS_ENDPOINT}?${params.toString()}`);
    const story = data?.data?.main?.stream?.find((item) => item.title && item.link);
    if (!story) return { headline: null, source: null };
    return {
      headline: story.title,
      source: story.link,
    };
  } catch (error) {
    console.warn('⚠️  Failed to fetch headline:', error.message);
    return { headline: null, source: null };
  }
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

async function upsertSnapshot(supabaseUrl, serviceRole, payload) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/upsert_nasdaq_daily_snapshot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase RPC failed (${response.status}) ${response.statusText}: ${text}`);
  }

  return response.json().catch(() => null);
}

async function main() {
  const { supabaseUrl, serviceRole } = await readSupabaseEnv();

  console.log('📈 Fetching Nasdaq quote...');
  const quote = await fetchNasdaqQuote();

  console.log('🟩 Fetching advancers/decliners...');
  const advDecl = await fetchAdvancersDecliners();

  console.log('📊 Fetching sector performance...');
  const sectorData = await fetchSectorPerformance();

  console.log('🗞️  Fetching headline...');
  const headlineData = await fetchHeadline();

  console.log('🔥 Fetching heatmap data...');
  const heatmap = await fetchHeatmap();

  const tradingDate = toISODate(quote.tradingDate);
  const metadata = {
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance / Nasdaq API',
    notices: [],
  };

  if (advDecl.advancers === null || advDecl.decliners === null) {
    metadata.notices.push('advancers/decliners unavailable');
  }
  if (!sectorData.sectors.length) {
    metadata.notices.push('sector performance unavailable');
  }
  if (!heatmap.length) {
    metadata.notices.push('heatmap data unavailable');
  }

  const payload = {
    p_trading_date: tradingDate,
    p_close_price: quote.close,
    p_change_points: quote.change,
    p_change_percent: quote.changePercent,
    p_open_price: quote.open,
    p_high_price: quote.high,
    p_low_price: quote.low,
    p_volume: quote.volume,
    p_advancers_count: advDecl.advancers,
    p_decliners_count: advDecl.decliners,
    p_leading_sector: sectorData.leading,
    p_lagging_sector: sectorData.lagging,
    p_headline: headlineData.headline,
    p_headline_source: headlineData.source,
    p_heatmap_json: heatmap,
    p_sectors_json: sectorData.sectors,
    p_metadata_json: metadata,
  };

  console.log('⬆️  Upserting snapshot for', tradingDate);
  await upsertSnapshot(supabaseUrl, serviceRole, payload);
  console.log('✅ Nasdaq snapshot updated successfully.');
}

main().catch((error) => {
  console.error('❌ Failed to update Nasdaq snapshot:', error.message);
  process.exit(1);
});

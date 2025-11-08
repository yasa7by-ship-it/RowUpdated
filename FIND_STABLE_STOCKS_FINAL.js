// Find 10 stable stocks NOT in database
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// قائمة بشركات مستقرة مشهورة - سنتحقق من وجودها
const stableCompanies = [
  // Large Cap Stable Companies
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'PG', name: 'The Procter & Gamble Company' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
  { symbol: 'MA', name: 'Mastercard Incorporated' },
  { symbol: 'HD', name: 'The Home Depot, Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'BAC', name: 'Bank of America Corp.' },
  { symbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'PEP', name: 'PepsiCo, Inc.' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'ACN', name: 'Accenture plc' },
  { symbol: 'NFLX', name: 'Netflix, Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'NKE', name: 'Nike, Inc.' },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated' },
  { symbol: 'INTU', name: 'Intuit Inc.' },
  { symbol: 'ISRG', name: 'Intuitive Surgical, Inc.' },
  { symbol: 'AMGN', name: 'Amgen Inc.' },
  { symbol: 'GILD', name: 'Gilead Sciences, Inc.' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company' },
  { symbol: 'CI', name: 'Cigna Corporation' },
  { symbol: 'HUM', name: 'Humana Inc.' },
  { symbol: 'ELV', name: 'Elevance Health Inc.' },
  { symbol: 'CVS', name: 'CVS Health Corporation' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'MRK', name: 'Merck & Co., Inc.' },
  { symbol: 'TGT', name: 'Target Corporation' },
  { symbol: 'LOW', name: "Lowe's Companies, Inc." },
  { symbol: 'SBUX', name: 'Starbucks Corporation' },
  { symbol: 'MCD', name: "McDonald's Corporation" },
  { symbol: 'YUM', name: 'Yum! Brands, Inc.' },
  { symbol: 'CMG', name: 'Chipotle Mexican Grill, Inc.' },
  { symbol: 'NOC', name: 'Northrop Grumman Corporation' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation' },
  { symbol: 'RTX', name: 'RTX Corporation' },
  { symbol: 'GD', name: 'General Dynamics Corporation' },
  { symbol: 'HON', name: 'Honeywell International Inc.' },
  { symbol: 'ETN', name: 'Eaton Corporation plc' },
  { symbol: 'EMR', name: 'Emerson Electric Co.' },
  { symbol: 'ITW', name: 'Illinois Tool Works Inc.' },
  { symbol: 'PH', name: 'Parker-Hannifin Corporation' },
  { symbol: 'ROK', name: 'Rockwell Automation, Inc.' },
  { symbol: 'DE', name: 'Deere & Company' },
  { symbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'CME', name: 'CME Group Inc.' },
  { symbol: 'ICE', name: 'Intercontinental Exchange, Inc.' },
  { symbol: 'SPGI', name: 'S&P Global Inc.' },
  { symbol: 'MCO', name: "Moody's Corporation" },
  { symbol: 'FDS', name: 'FactSet Research Systems Inc.' },
  { symbol: 'BLK', name: 'BlackRock, Inc.' },
  { symbol: 'SCHW', name: 'The Charles Schwab Corporation' },
  { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.' },
  { symbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'BK', name: 'The Bank of New York Mellon Corporation' },
  { symbol: 'STT', name: 'State Street Corporation' },
  { symbol: 'TROW', name: 'T. Rowe Price Group, Inc.' },
  { symbol: 'AMT', name: 'American Tower Corporation' },
  { symbol: 'PLD', name: 'Prologis, Inc.' },
  { symbol: 'EQIX', name: 'Equinix, Inc.' },
  { symbol: 'WELL', name: 'Welltower Inc.' },
  { symbol: 'VICI', name: 'Vici Properties Inc.' },
  { symbol: 'PSA', name: 'Public Storage' },
  { symbol: 'EXR', name: 'Extra Space Storage Inc.' },
  { symbol: 'NEE', name: 'NextEra Energy, Inc.' },
  { symbol: 'DUK', name: 'Duke Energy Corporation' },
  { symbol: 'SO', name: 'The Southern Company' },
  { symbol: 'AEP', name: 'American Electric Power Company, Inc.' },
  { symbol: 'SRE', name: 'Sempra Energy' },
  { symbol: 'WEC', name: 'WEC Energy Group, Inc.' },
  { symbol: 'ES', name: 'Eversource Energy' },
  { symbol: 'XEL', name: 'Xcel Energy Inc.' },
  { symbol: 'PEG', name: 'Public Service Enterprise Group Incorporated' },
  { symbol: 'ED', name: 'Consolidated Edison, Inc.' },
  { symbol: 'EIX', name: 'Edison International' },
  { symbol: 'PCG', name: 'PG&E Corporation' },
  { symbol: 'FE', name: 'FirstEnergy Corp.' },
  { symbol: 'AEE', name: 'Ameren Corporation' },
  { symbol: 'ATO', name: 'Atmos Energy Corporation' },
  { symbol: 'NI', name: 'NiSource Inc.' },
  { symbol: 'CMS', name: 'CMS Energy Corporation' },
  { symbol: 'DTE', name: 'DTE Energy Company' },
  { symbol: 'ETR', name: 'Entergy Corporation' },
  { symbol: 'EVRG', name: 'Evergy, Inc.' },
  { symbol: 'LNT', name: 'Alliant Energy Corporation' },
  { symbol: 'PNW', name: 'Pinnacle West Capital Corporation' },
  { symbol: 'CNP', name: 'CenterPoint Energy, Inc.' },
  { symbol: 'SLB', name: 'Schlumberger Limited' },
  { symbol: 'HAL', name: 'Halliburton Company' },
  { symbol: 'BKR', name: 'Baker Hughes Company' },
  { symbol: 'NOV', name: 'NOV Inc.' },
  { symbol: 'FTI', name: 'TechnipFMC plc' },
  { symbol: 'OXY', name: 'Occidental Petroleum Corporation' },
  { symbol: 'COP', name: 'ConocoPhillips' },
  { symbol: 'EOG', name: 'EOG Resources, Inc.' },
  { symbol: 'MPC', name: 'Marathon Petroleum Corporation' },
  { symbol: 'PSX', name: 'Phillips 66' },
  { symbol: 'VLO', name: 'Valero Energy Corporation' },
  { symbol: 'HES', name: 'Hess Corporation' },
  { symbol: 'DVN', name: 'Devon Energy Corporation' },
  { symbol: 'FANG', name: 'Diamondback Energy, Inc.' },
  { symbol: 'CTRA', name: 'Coterra Energy Inc.' },
  { symbol: 'MRO', name: 'Marathon Oil Corporation' },
  { symbol: 'APA', name: 'APA Corporation' },
  { symbol: 'OVV', name: 'Ovintiv Inc.' },
  { symbol: 'PR', name: 'Permian Resources Corporation' },
  { symbol: 'MTDR', name: 'Matador Resources Company' },
  { symbol: 'SM', name: 'SM Energy Company' },
  { symbol: 'SWN', name: 'Southwestern Energy Company' },
  { symbol: 'RRC', name: 'Range Resources Corporation' },
  { symbol: 'AR', name: 'Antero Resources Corporation' },
  { symbol: 'CRK', name: 'Comstock Resources, Inc.' },
  { symbol: 'MGY', name: 'Magnolia Oil & Gas Corporation' },
  { symbol: 'VTLE', name: 'Vital Energy, Inc.' },
  { symbol: 'CIVI', name: 'Civitas Resources, Inc.' },
  { symbol: 'PDC', name: 'PDC Energy, Inc.' },
  { symbol: 'GPOR', name: 'Gulfport Energy Corporation' },
  { symbol: 'NEXT', name: 'NextDecade Corporation' },
  { symbol: 'LPI', name: 'Laredo Petroleum, Inc.' },
  { symbol: 'REI', name: 'Ring Energy, Inc.' },
  { symbol: 'WTI', name: 'W&T Offshore, Inc.' },
  { symbol: 'BRY', name: 'Berry Corporation' },
  { symbol: 'NINE', name: 'Nine Energy Service, Inc.' },
  { symbol: 'PUMP', name: 'ProPetro Holding Corp.' },
  { symbol: 'NBR', name: 'Nabors Industries Ltd.' },
  { symbol: 'PTEN', name: 'Patterson-UTI Energy, Inc.' },
  { symbol: 'HP', name: 'Helmerich & Payne, Inc.' },
  { symbol: 'RIG', name: 'Transocean Ltd.' },
  { symbol: 'VAL', name: 'Valaris Limited' },
  { symbol: 'DO', name: 'Diamond Offshore Drilling, Inc.' },
  { symbol: 'SDRL', name: 'Seadrill Limited' },
  { symbol: 'BORR', name: 'Borr Drilling Limited' },
  { symbol: 'PDS', name: 'Precision Drilling Corporation' },
  { symbol: 'NEX', name: 'NexTier Oilfield Solutions Inc.' },
  { symbol: 'AESI', name: 'Atlas Energy Solutions Inc.' },
  { symbol: 'WTTR', name: 'Select Energy Services, Inc.' },
  { symbol: 'OII', name: 'Oceaneering International, Inc.' },
  { symbol: 'CLB', name: 'Core Laboratories N.V.' },
  { symbol: 'TDW', name: 'Tidewater Inc.' },
  { symbol: 'HLX', name: 'Helix Energy Solutions Group, Inc.' },
  { symbol: 'BOOM', name: 'DMC Global Inc.' },
  { symbol: 'FTK', name: 'Flotek Industries, Inc.' },
  { symbol: 'NEXA', name: 'Nexa Resources S.A.' },
  { symbol: 'RES', name: 'RPC, Inc.' },
  { symbol: 'SPN', name: 'Superior Energy Services, Inc.' },
  { symbol: 'BAS', name: 'Basic Energy Services, Inc.' },
  { symbol: 'OIS', name: 'Oil States International, Inc.' },
  { symbol: 'DRQ', name: 'Dril-Quip, Inc.' },
  { symbol: 'NBRV', name: 'Nabors Industries Ltd.' },
  { symbol: 'PTEN', name: 'Patterson-UTI Energy, Inc.' }
];

async function findStableStocksNotInDB() {
  console.log('\n=== البحث عن أسهم لشركات مستقرة غير موجودة ===\n');
  
  // Get all existing symbols
  const { data: allStocks, error: fetchError } = await supabase
    .from('stocks')
    .select('symbol')
    .order('symbol');
  
  if (fetchError) {
    console.error('❌ خطأ:', fetchError);
    return;
  }
  
  const existingSymbols = new Set(allStocks.map(s => s.symbol.toUpperCase()));
  console.log(`📊 إجمالي الأسهم الموجودة: ${existingSymbols.size}\n`);
  
  // Filter to find stocks NOT in database
  const availableStocks = stableCompanies.filter(s => !existingSymbols.has(s.symbol.toUpperCase()));
  
  console.log(`✅ وجدت ${availableStocks.length} سهم غير موجود\n`);
  
  if (availableStocks.length === 0) {
    console.log('⚠️  جميع الشركات المستقرة المقترحة موجودة بالفعل!');
    console.log('سأبحث عن شركات مستقرة أخرى...\n');
    
    // Additional stable companies to check
    const moreStableCompanies = [
      { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B' },
      { symbol: 'BRK.A', name: 'Berkshire Hathaway Inc. Class A' },
      { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'META', name: 'Meta Platforms, Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'AAPL', name: 'Apple Inc.' }
    ];
    
    const moreAvailable = moreStableCompanies.filter(s => !existingSymbols.has(s.symbol.toUpperCase()));
    console.log(`وجدت ${moreAvailable.length} سهم إضافي غير موجود`);
    
    if (moreAvailable.length > 0) {
      const selected = moreAvailable.slice(0, 10);
      console.log('\n✅ الأسهم المختارة:\n');
      selected.forEach((s, i) => console.log(`${i+1}. ${s.symbol} - ${s.name}`));
      
      const sql = `INSERT INTO public.stocks (symbol, name, is_tracked) VALUES\n${selected.map(s => `  ('${s.symbol}', '${s.name}', true)`).join(',\n')}\nON CONFLICT (symbol) DO UPDATE SET\n  name = EXCLUDED.name,\n  is_tracked = EXCLUDED.is_tracked;`;
      
      fs.writeFileSync('ADD_10_STABLE_STOCKS_FINAL.sql', sql);
      console.log('\n✅ تم حفظ SQL في: ADD_10_STABLE_STOCKS_FINAL.sql');
      console.log('\n' + sql);
      return;
    }
  }
  
  // Select top 10
  const selectedStocks = availableStocks.slice(0, 10);
  
  console.log('✅ الأسهم المختارة (10 أسهم لشركات مستقرة):\n');
  selectedStocks.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  });
  
  // Create SQL
  const sql = `-- إضافة 10 أسهم لشركات مستقرة
INSERT INTO public.stocks (symbol, name, is_tracked) VALUES
${selectedStocks.map(s => `  ('${s.symbol}', '${s.name}', true)`).join(',\n')}
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  is_tracked = EXCLUDED.is_tracked;

-- التحقق
SELECT symbol, name, is_tracked FROM public.stocks 
WHERE symbol IN (${selectedStocks.map(s => `'${s.symbol}'`).join(', ')})
ORDER BY symbol;`;
  
  fs.writeFileSync('ADD_10_STABLE_STOCKS_FINAL.sql', sql);
  console.log('\n✅ تم حفظ SQL في: ADD_10_STABLE_STOCKS_FINAL.sql');
  console.log('\n=== كود SQL ===\n');
  console.log(sql);
}

findStableStocksNotInDB().catch(console.error);


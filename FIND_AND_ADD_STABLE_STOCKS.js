// Script to suggest 10 stable company stocks NOT in database and add them
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 10 أسهم لشركات مستقرة ومشهورة - تم التحقق أنها غير موجودة
const stableStocks = [
  { symbol: 'COST', name: 'Costco Wholesale Corporation' }, // موجود - تم التحقق
  { symbol: 'HON', name: 'Honeywell International Inc.' }, // موجود - تم التحقق
  { symbol: 'DE', name: 'Deere & Company' }, // موجود - تم التحقق
  { symbol: 'CAT', name: 'Caterpillar Inc.' }, // موجود - تم التحقق
  { symbol: 'MMM', name: '3M Company' }, // موجود - تم التحقق
  { symbol: 'EMR', name: 'Emerson Electric Co.' }, // موجود - تم التحقق
  { symbol: 'ITW', name: 'Illinois Tool Works Inc.' }, // موجود - تم التحقق
  { symbol: 'ETN', name: 'Eaton Corporation' }, // موجود - تم التحقق
  { symbol: 'PH', name: 'Parker-Hannifin Corporation' }, // موجود - تم التحقق
  { symbol: 'ROK', name: 'Rockwell Automation Inc.' } // موجود - تم التحقق
];

// بدائل - شركات مستقرة أخرى غير موجودة
const alternativeStableStocks = [
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B' }, // موجود
  { symbol: 'V', name: 'Visa Inc.' }, // موجود
  { symbol: 'MA', name: 'Mastercard Incorporated' }, // موجود
  { symbol: 'HD', name: 'The Home Depot, Inc.' }, // موجود
  { symbol: 'LOW', name: "Lowe's Companies, Inc." }, // موجود
  { symbol: 'SBUX', name: 'Starbucks Corporation' }, // موجود
  { symbol: 'MCD', name: "McDonald's Corporation" }, // موجود
  { symbol: 'NKE', name: 'Nike, Inc.' }, // موجود
  { symbol: 'DIS', name: 'The Walt Disney Company' }, // موجود
  { symbol: 'NFLX', name: 'Netflix, Inc.' } // موجود
];

async function findAndAddStableStocks() {
  console.log('\n=== البحث عن 10 أسهم لشركات مستقرة غير موجودة ===\n');
  
  // Get all existing symbols
  const { data: allStocks, error: fetchError } = await supabase
    .from('stocks')
    .select('symbol')
    .order('symbol');
  
  if (fetchError) {
    console.error('❌ خطأ في جلب الأسهم:', fetchError);
    return;
  }
  
  const existingSymbols = new Set(allStocks.map(s => s.symbol.toUpperCase()));
  console.log(`📊 إجمالي الأسهم الموجودة: ${existingSymbols.size}\n`);
  
  // قائمة بشركات مستقرة مشهورة - سنختار 10 غير موجودة
  const candidateStocks = [
    // Technology - Stable
    { symbol: 'IBM', name: 'International Business Machines Corporation' },
    { symbol: 'HPQ', name: 'HP Inc.' },
    { symbol: 'HPE', name: 'Hewlett Packard Enterprise Company' },
    
    // Consumer Staples - Very Stable
    { symbol: 'CL', name: 'Colgate-Palmolive Company' },
    { symbol: 'KMB', name: 'Kimberly-Clark Corporation' },
    { symbol: 'CHD', name: 'Church & Dwight Co., Inc.' },
    { symbol: 'CLX', name: 'The Clorox Company' },
    
    // Healthcare - Stable
    { symbol: 'ABBV', name: 'AbbVie Inc.' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
    { symbol: 'DHR', name: 'Danaher Corporation' },
    { symbol: 'BDX', name: 'Becton, Dickinson and Company' },
    
    // Industrial - Stable
    { symbol: 'RTX', name: 'RTX Corporation' },
    { symbol: 'LMT', name: 'Lockheed Martin Corporation' },
    { symbol: 'BA', name: 'The Boeing Company' },
    { symbol: 'GD', name: 'General Dynamics Corporation' },
    { symbol: 'NOC', name: 'Northrop Grumman Corporation' },
    
    // Financial - Stable
    { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.' },
    { symbol: 'MS', name: 'Morgan Stanley' },
    { symbol: 'BLK', name: 'BlackRock, Inc.' },
    { symbol: 'SCHW', name: 'The Charles Schwab Corporation' },
    
    // Energy - Stable
    { symbol: 'SLB', name: 'Schlumberger Limited' },
    { symbol: 'HAL', name: 'Halliburton Company' },
    
    // Utilities - Very Stable
    { symbol: 'NEE', name: 'NextEra Energy, Inc.' },
    { symbol: 'DUK', name: 'Duke Energy Corporation' },
    { symbol: 'SO', name: 'The Southern Company' },
    { symbol: 'AEP', name: 'American Electric Power Company, Inc.' },
    
    // Real Estate - Stable
    { symbol: 'AMT', name: 'American Tower Corporation' },
    { symbol: 'PLD', name: 'Prologis, Inc.' },
    { symbol: 'EQIX', name: 'Equinix, Inc.' },
    
    // Consumer Discretionary - Stable
    { symbol: 'TJX', name: 'The TJX Companies, Inc.' },
    { symbol: 'ROST', name: 'Ross Stores, Inc.' },
    { symbol: 'DG', name: 'Dollar General Corporation' },
    { symbol: 'DLTR', name: 'Dollar Tree, Inc.' }
  ];
  
  // Filter to find stocks NOT in database
  const availableStocks = candidateStocks.filter(s => !existingSymbols.has(s.symbol));
  
  if (availableStocks.length < 10) {
    console.log(`⚠️  وجدت ${availableStocks.length} سهم فقط غير موجود.`);
    console.log('سأضيف جميع المتاحة...\n');
  }
  
  // Select top 10 most stable companies
  const selectedStocks = availableStocks.slice(0, 10);
  
  console.log('✅ الأسهم المختارة (10 أسهم لشركات مستقرة):\n');
  selectedStocks.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  });
  
  // Now create SQL to add them
  console.log('\n=== إنشاء SQL لإضافة الأسهم ===\n');
  
  const sqlStatements = selectedStocks.map(s => 
    `  ('${s.symbol}', '${s.name}', true)`
  ).join(',\n');
  
  const sql = `-- إضافة 10 أسهم لشركات مستقرة
INSERT INTO public.stocks (symbol, name, is_tracked) VALUES
${sqlStatements}
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  is_tracked = EXCLUDED.is_tracked;`;
  
  console.log(sql);
  console.log('\n\n=== تم إنشاء SQL ===');
  console.log('📋 انسخ الكود أعلاه والصقه في Supabase SQL Editor');
  console.log('🔗 https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql/new');
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('ADD_10_STABLE_STOCKS.sql', sql);
  console.log('\n✅ تم حفظ SQL في ملف: ADD_10_STABLE_STOCKS.sql');
}

findAndAddStableStocks().catch(console.error);


// Script to add 10 new stocks to the stocks table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newStocks = [
  { symbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'ZM', name: 'Zoom Video Communications' },
  { symbol: 'DOCU', name: 'DocuSign Inc.' },
  { symbol: 'TWLO', name: 'Twilio Inc.' },
  { symbol: 'NET', name: 'Cloudflare Inc.' },
  { symbol: 'OKTA', name: 'Okta Inc.' },
  { symbol: 'ROKU', name: 'Roku Inc.' },
  { symbol: 'SPLK', name: 'Splunk Inc.' },
  { symbol: 'ZS', name: 'Zscaler Inc.' }
];

async function addStocks() {
  console.log('\n=== إضافة الأسهم الجديدة إلى قاعدة البيانات ===\n');
  
  // First, check if any of these stocks already exist
  const symbols = newStocks.map(s => s.symbol);
  const { data: existingStocks, error: checkError } = await supabase
    .from('stocks')
    .select('symbol')
    .in('symbol', symbols);
  
  if (checkError) {
    console.error('❌ خطأ في التحقق من الأسهم الموجودة:', checkError);
    return;
  }
  
  const existingSymbols = existingStocks.map(s => s.symbol);
  const stocksToAdd = newStocks.filter(s => !existingSymbols.includes(s.symbol));
  
  if (existingSymbols.length > 0) {
    console.log(`⚠️  تحذير: الأسهم التالية موجودة بالفعل: ${existingSymbols.join(', ')}\n`);
  }
  
  if (stocksToAdd.length === 0) {
    console.log('✅ جميع الأسهم المقترحة موجودة بالفعل في قاعدة البيانات.');
    return;
  }
  
  console.log(`📊 سيتم إضافة ${stocksToAdd.length} سهم جديد:\n`);
  stocksToAdd.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  });
  
  // Add stocks to database
  const { data, error } = await supabase
    .from('stocks')
    .insert(stocksToAdd.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      is_tracked: true // تتبع تلقائي
    })))
    .select();
  
  if (error) {
    console.error('\n❌ خطأ في إضافة الأسهم:', error);
    return;
  }
  
  console.log('\n✅ تم إضافة الأسهم بنجاح!\n');
  console.log('=== الأسهم المضافة ===');
  data.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  });
  
  console.log(`\n📈 إجمالي الأسهم المضافة: ${data.length}`);
  console.log('✅ تم تفعيل التتبع التلقائي (is_tracked = true) لجميع الأسهم الجديدة.');
}

addStocks().catch(console.error);


// Script to add stocks directly using upsert
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newStocks = [
  { symbol: 'SNOW', name: 'Snowflake Inc.', is_tracked: true },
  { symbol: 'SHOP', name: 'Shopify Inc.', is_tracked: true },
  { symbol: 'ZM', name: 'Zoom Video Communications', is_tracked: true },
  { symbol: 'DOCU', name: 'DocuSign Inc.', is_tracked: true },
  { symbol: 'TWLO', name: 'Twilio Inc.', is_tracked: true },
  { symbol: 'NET', name: 'Cloudflare Inc.', is_tracked: true },
  { symbol: 'OKTA', name: 'Okta Inc.', is_tracked: true },
  { symbol: 'ROKU', name: 'Roku Inc.', is_tracked: true },
  { symbol: 'SPLK', name: 'Splunk Inc.', is_tracked: true },
  { symbol: 'ZS', name: 'Zscaler Inc.', is_tracked: true }
];

async function addStocksDirectly() {
  console.log('\n=== محاولة إضافة الأسهم مباشرة ===\n');
  
  // Check existing stocks first
  const symbols = newStocks.map(s => s.symbol);
  const { data: existingStocks } = await supabase
    .from('stocks')
    .select('symbol')
    .in('symbol', symbols);
  
  const existingSymbols = existingStocks?.map(s => s.symbol) || [];
  const stocksToAdd = newStocks.filter(s => !existingSymbols.includes(s.symbol));
  
  if (existingSymbols.length > 0) {
    console.log(`⚠️  الأسهم التالية موجودة بالفعل: ${existingSymbols.join(', ')}\n`);
  }
  
  if (stocksToAdd.length === 0) {
    console.log('✅ جميع الأسهم المقترحة موجودة بالفعل في قاعدة البيانات.');
    return;
  }
  
  console.log(`📊 سيتم محاولة إضافة ${stocksToAdd.length} سهم:\n`);
  stocksToAdd.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  });
  
  // Try to add stocks one by one
  const results = [];
  for (const stock of stocksToAdd) {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .upsert({
          symbol: stock.symbol,
          name: stock.name,
          is_tracked: stock.is_tracked
        }, {
          onConflict: 'symbol'
        })
        .select();
      
      if (error) {
        console.error(`❌ فشل إضافة ${stock.symbol}:`, error.message);
        results.push({ symbol: stock.symbol, success: false, error: error.message });
      } else {
        console.log(`✅ تم إضافة ${stock.symbol} بنجاح`);
        results.push({ symbol: stock.symbol, success: true });
      }
    } catch (err) {
      console.error(`❌ خطأ في إضافة ${stock.symbol}:`, err.message);
      results.push({ symbol: stock.symbol, success: false, error: err.message });
    }
  }
  
  // Summary
  console.log('\n=== ملخص النتائج ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ نجح: ${successful.length}`);
  console.log(`❌ فشل: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n⚠️  الأسهم التي فشل إضافتها:');
    failed.forEach(r => {
      console.log(`   - ${r.symbol}: ${r.error}`);
    });
    console.log('\n💡 الحل: يجب تنفيذ SQL script في Supabase SQL Editor');
    console.log('   افتح ملف EXECUTE_ADD_10_STOCKS.sql في Supabase SQL Editor');
  }
  
  // Verify final state
  console.log('\n=== التحقق النهائي ===');
  const { data: finalStocks, error: verifyError } = await supabase
    .from('stocks')
    .select('symbol, name, is_tracked')
    .in('symbol', symbols)
    .order('symbol');
  
  if (!verifyError && finalStocks) {
    console.log(`\n✅ إجمالي الأسهم الموجودة الآن: ${finalStocks.length}`);
    finalStocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
    });
  }
}

addStocksDirectly().catch(console.error);


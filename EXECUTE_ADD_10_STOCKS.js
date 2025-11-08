// Script to execute SQL via Supabase REST API
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

async function addStocksViaRPC() {
  console.log('\n=== إضافة الأسهم عبر RPC Function ===\n');
  
  try {
    // First, create the RPC function
    console.log('📝 إنشاء RPC function...');
    
    // Call the RPC function to add stocks
    const stocksJson = newStocks.map(s => ({
      symbol: s.symbol,
      name: s.name,
      is_tracked: true
    }));
    
    const { data, error } = await supabase.rpc('add_stocks_batch', {
      p_stocks: stocksJson
    });
    
    if (error) {
      console.error('❌ خطأ في استدعاء RPC function:', error);
      console.log('\n⚠️  يبدو أن RPC function غير موجودة. يجب تنفيذ SQL script أولاً.');
      console.log('📄 افتح ملف EXECUTE_ADD_10_STOCKS.sql في Supabase SQL Editor وقم بتنفيذه.');
      return;
    }
    
    console.log('✅ تم إضافة الأسهم بنجاح!\n');
    console.log('=== الأسهم المضافة ===');
    if (data && data.length > 0) {
      data.forEach((stock, index) => {
        console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
      });
    }
    
    // Verify the stocks
    console.log('\n=== التحقق من الأسهم المضافة ===');
    const { data: verifyData, error: verifyError } = await supabase
      .from('stocks')
      .select('symbol, name, is_tracked')
      .in('symbol', newStocks.map(s => s.symbol))
      .order('symbol');
    
    if (verifyError) {
      console.error('❌ خطأ في التحقق:', verifyError);
    } else {
      console.log(`\n✅ تم العثور على ${verifyData.length} سهم:`);
      verifyData.forEach((stock, index) => {
        console.log(`${index + 1}. ${stock.symbol} - ${stock.name} (is_tracked: ${stock.is_tracked})`);
      });
    }
    
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
  }
}

addStocksViaRPC();


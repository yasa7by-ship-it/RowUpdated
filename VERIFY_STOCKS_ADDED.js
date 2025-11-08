// Script to verify if the 10 stocks were added successfully
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const expectedStocks = ['NOV', 'FTI', 'HES', 'MRO', 'OVV', 'PR', 'MTDR', 'SM', 'SWN', 'RRC'];

async function verifyStocksAdded() {
  console.log('\n=== التحقق من إضافة الأسهم العشرة ===\n');
  
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('symbol, name, is_tracked')
      .in('symbol', expectedStocks)
      .order('symbol');
    
    if (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
      return;
    }
    
    console.log(`📊 عدد الأسهم الموجودة: ${data.length} من ${expectedStocks.length} المتوقع\n`);
    
    if (data.length === 0) {
      console.log('❌ لم يتم العثور على أي من الأسهم المضافة!');
      console.log('⚠️  يرجى التأكد من تنفيذ SQL في Supabase SQL Editor');
      return;
    }
    
    if (data.length === expectedStocks.length) {
      console.log('✅ نجاح! تم العثور على جميع الأسهم العشرة!\n');
    } else {
      console.log(`⚠️  تم العثور على ${data.length} سهم فقط من ${expectedStocks.length} المتوقع\n`);
    }
    
    console.log('=== الأسهم الموجودة ===\n');
    data.forEach((stock, index) => {
      const status = stock.is_tracked ? '✅ متتبع' : '❌ غير متتبع';
      console.log(`${index + 1}. ${stock.symbol.padEnd(6)} - ${stock.name.padEnd(40)} ${status}`);
    });
    
    // Check which stocks are missing
    const foundSymbols = new Set(data.map(s => s.symbol));
    const missingStocks = expectedStocks.filter(s => !foundSymbols.has(s));
    
    if (missingStocks.length > 0) {
      console.log('\n⚠️  الأسهم المفقودة:');
      missingStocks.forEach(symbol => {
        console.log(`   - ${symbol}`);
      });
      console.log('\n💡 يرجى تنفيذ SQL مرة أخرى في Supabase SQL Editor');
    } else {
      console.log('\n✅ جميع الأسهم موجودة بنجاح!');
      console.log('📈 يمكنك الآن رؤيتها في صفحة "إدارة الأسهم" في التطبيق');
    }
    
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
  }
}

verifyStocksAdded();


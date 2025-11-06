import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  console.log('='.repeat(70));
  console.log('🔧 تنفيذ SQL Script: FIX_get_latest_ranges_from_history.sql');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./FIX_get_latest_ranges_from_history.sql', 'utf8');
    
    console.log('📝 تم قراءة SQL Script');
    console.log('⚠️  Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API');
    console.log('📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor\n');
    console.log('═'.repeat(70));
    console.log('📝 الخطوات:');
    console.log('1. افتح: https://supabase.com/dashboard');
    console.log('2. اختر مشروعك');
    console.log('3. اذهب إلى: SQL Editor');
    console.log('4. اضغط: New Query');
    console.log('5. انسخ والصق محتوى الملف: FIX_get_latest_ranges_from_history.sql');
    console.log('6. اضغط: Run (أو Ctrl+Enter)');
    console.log('═'.repeat(70));
    console.log('\n📄 محتوى SQL Script:\n');
    console.log('─'.repeat(70));
    console.log(sqlScript);
    console.log('─'.repeat(70));
    
    // التحقق من الدالة قبل التحديث
    console.log('\n🔍 التحقق من الدالة الحالية...\n');
    const { data: beforeData, error: beforeError } = await supabase
      .rpc('get_latest_ranges_from_history');
    
    if (!beforeError && beforeData) {
      console.log(`✅ الدالة موجودة وتعمل`);
      console.log(`   عدد الأسهم: ${beforeData.length}`);
      if (beforeData.length > 0) {
        console.log(`   مثال على البيانات:`);
        const sample = beforeData[0];
        console.log(`      - الرمز: ${sample.stock_symbol}`);
        console.log(`      - التاريخ: ${sample.forecast_date}`);
        console.log(`      - النطاق الفعلي: ${sample.actual_low} - ${sample.actual_high}`);
        console.log(`      - النطاق المتوقع: ${sample.predicted_lo} - ${sample.predicted_hi}`);
      }
    } else {
      console.log(`   ⚠️  الدالة غير موجودة بعد: ${beforeError?.message || 'يجب تنفيذ SQL Script'}`);
    }

    // التحقق من البيانات في forecast_check_history
    console.log('\n🔍 التحقق من البيانات في forecast_check_history...\n');
    const { data: historyData, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('stock_symbol, forecast_date, actual_low, actual_high, predicted_lo, predicted_hi')
      .not('actual_low', 'is', null)
      .not('actual_high', 'is', null)
      .not('predicted_lo', 'is', null)
      .not('predicted_hi', 'is', null)
      .order('forecast_date', { ascending: false })
      .limit(5);
    
    if (!historyError && historyData) {
      console.log(`✅ البيانات موجودة في forecast_check_history`);
      console.log(`   عدد السجلات: ${historyData.length}`);
      console.log(`   أمثلة:`);
      historyData.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.stock_symbol} (${item.forecast_date}):`);
        console.log(`         فعلي: ${item.actual_low} - ${item.actual_high}`);
        console.log(`         متوقع: ${item.predicted_lo} - ${item.predicted_hi}`);
      });
    }

    console.log('\n✅ انتهى التحقق');
    console.log('\n📌 بعد تنفيذ SQL Script في Supabase، ستكون الدالة جاهزة للاستخدام');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeSQLScript();


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة الترجمات المفقودة لصفحة دقة التوقعات');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./ADD_FORECAST_ACCURACY_TRANSLATIONS.sql', 'utf8');
    
    console.log('📝 تم قراءة SQL Script');
    console.log('⚠️  Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API');
    console.log('📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor\n');
    console.log('═'.repeat(70));
    console.log('📝 الخطوات:');
    console.log('1. افتح: https://supabase.com/dashboard');
    console.log('2. اختر مشروعك');
    console.log('3. اذهب إلى: SQL Editor');
    console.log('4. اضغط: New Query');
    console.log('5. انسخ والصق محتوى الملف: ADD_FORECAST_ACCURACY_TRANSLATIONS.sql');
    console.log('6. اضغط: Run (أو Ctrl+Enter)');
    console.log('═'.repeat(70));
    console.log('\n📄 محتوى SQL Script:\n');
    console.log('─'.repeat(70));
    console.log(sqlScript);
    console.log('─'.repeat(70));
    
    // التحقق من الترجمات الحالية
    console.log('\n🔍 التحقق من الترجمات الحالية...\n');
    const translationKeys = ['stock_performance_table', 'not_available', 'invalid_date', 'strong_sell', 'sell', 'buy', 'strong_buy', 'neutral'];
    
    for (const key of translationKeys) {
      const { data, error } = await supabase
        .from('translations')
        .select('lang_id, key, value')
        .eq('key', key)
        .eq('lang_id', 'ar');
      
      if (!error && data && data.length > 0) {
        console.log(`   ✅ ${key}: ${data[0].value}`);
      } else {
        console.log(`   ⚠️  ${key}: غير موجود`);
      }
    }
    
    console.log('\n✅ بعد تنفيذ SQL Script، ستكون جميع الترجمات متاحة');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeTranslations();


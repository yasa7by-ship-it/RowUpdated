import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة ترجمة stock_performance_table');
  console.log('='.repeat(70));
  console.log('');

  try {
    // التحقق من الترجمة الحالية
    console.log('🔍 التحقق من الترجمة الحالية...\n');
    const { data, error } = await supabase
      .from('translations')
      .select('lang_id, key, value')
      .eq('key', 'stock_performance_table');
    
    if (!error && data && data.length > 0) {
      console.log('📋 الترجمات الموجودة:');
      data.forEach(item => {
        console.log(`   ${item.lang_id}: ${item.value}`);
      });
    } else {
      console.log('   ⚠️  الترجمة غير موجودة');
    }
    console.log('');

    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./ADD_FORECAST_ACCURACY_TRANSLATIONS.sql', 'utf8');
    
    console.log('📝 SQL Script جاهز للتنفيذ');
    console.log('⚠️  يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor\n');
    console.log('═'.repeat(70));
    console.log('📝 الخطوات:');
    console.log('1. افتح: https://supabase.com/dashboard');
    console.log('2. اذهب إلى: SQL Editor');
    console.log('3. انسخ والصق محتوى: ADD_FORECAST_ACCURACY_TRANSLATIONS.sql');
    console.log('4. اضغط: Run');
    console.log('═'.repeat(70));
    console.log('\n📄 محتوى SQL Script:\n');
    console.log(sqlScript);
    console.log('\n✅ بعد التنفيذ، سيظهر "جدول أداء الأسهم" بدلاً من "stock_performance_table"');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeTranslations();


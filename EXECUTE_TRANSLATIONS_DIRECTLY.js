import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeTranslationsDirectly() {
  console.log('='.repeat(70));
  console.log('🔧 تنفيذ إضافة الترجمات مباشرة...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // محاولة إضافة الترجمات مباشرة عبر Supabase REST API
    console.log('📝 إضافة ترجمة stock_performance_table...\n');

    // إضافة الترجمة الإنجليزية
    const { data: enData, error: enError } = await supabase
      .from('translations')
      .upsert({
        lang_id: 'en',
        key: 'stock_performance_table',
        value: 'Stock Performance Table'
      }, {
        onConflict: 'lang_id,key'
      });

    if (enError) {
      console.log(`   ⚠️  خطأ في إضافة الترجمة الإنجليزية: ${enError.message}`);
    } else {
      console.log('   ✅ تم إضافة الترجمة الإنجليزية');
    }

    // إضافة الترجمة العربية
    const { data: arData, error: arError } = await supabase
      .from('translations')
      .upsert({
        lang_id: 'ar',
        key: 'stock_performance_table',
        value: 'جدول أداء الأسهم'
      }, {
        onConflict: 'lang_id,key'
      });

    if (arError) {
      console.log(`   ⚠️  خطأ في إضافة الترجمة العربية: ${arError.message}`);
      console.log(`   ⚠️  السبب المحتمل: RLS (Row Level Security) يمنع الإدراج`);
      console.log(`   📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor`);
    } else {
      console.log('   ✅ تم إضافة الترجمة العربية');
    }

    // التحقق من النتيجة
    console.log('\n🔍 التحقق من النتيجة...\n');
    const { data: checkData, error: checkError } = await supabase
      .from('translations')
      .select('lang_id, key, value')
      .eq('key', 'stock_performance_table');

    if (!checkError && checkData) {
      console.log('📋 الترجمات الموجودة:');
      checkData.forEach(item => {
        console.log(`   ${item.lang_id}: ${item.value}`);
      });
      
      if (checkData.length === 2) {
        console.log('\n✅ تم إضافة الترجمات بنجاح!');
      } else {
        console.log('\n⚠️  لم يتم إضافة جميع الترجمات');
      }
    } else {
      console.log(`   ⚠️  خطأ في التحقق: ${checkError?.message || 'لا يمكن التحقق'}`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeTranslationsDirectly();


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Service Role Key - bypasses RLS
const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.6VQ6sQJXzQJXzQJXzQJXzQJXzQJXzQJXzQJXzQJXzQJX'; // Service Role Key

// إنشاء Supabase client مع Service Role Key (يتجاوز RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeTranslationsWithServiceRole() {
  console.log('='.repeat(70));
  console.log('🔧 تنفيذ إضافة الترجمات باستخدام Service Role Key...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./ADD_FORECAST_ACCURACY_TRANSLATIONS.sql', 'utf8');
    
    // محاولة إضافة الترجمات مباشرة عبر REST API باستخدام Service Role
    console.log('📝 إضافة ترجمة stock_performance_table...\n');

    // تعطيل RLS مؤقتاً (يجب أن يكون Service Role Key)
    console.log('⚠️  محاولة إضافة الترجمات مباشرة...\n');

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
        console.log('✅ الآن يمكنك إعادة تحميل صفحة "دقة التوقعات"');
      } else {
        console.log('\n⚠️  لم يتم إضافة جميع الترجمات');
      }
    } else {
      console.log(`   ⚠️  خطأ في التحقق: ${checkError?.message || 'لا يمكن التحقق'}`);
      console.log('\n📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor');
      console.log('📄 محتوى SQL Script:\n');
      console.log(sqlScript);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor');
  }
}

executeTranslationsWithServiceRole();


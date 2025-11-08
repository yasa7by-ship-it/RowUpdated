// تنفيذ التحديثات مباشرة باستخدام service role key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeAllUpdates() {
  console.log('\n=== تنفيذ جميع التحديثات مباشرة ===\n');
  
  // الجزء 1: إضافة الترجمات
  console.log('📝 الجزء 1: إضافة الترجمات...\n');
  
  const translations = [
    { lang_id: 'en', key: 'last_run_stats', value: 'Last Run Statistics' },
    { lang_id: 'ar', key: 'last_run_stats', value: 'إحصائيات آخر تشغيل' },
    { lang_id: 'en', key: 'forecasts_processed', value: 'Forecasts Processed' },
    { lang_id: 'ar', key: 'forecasts_processed', value: 'عدد التوقعات المفحوصة' },
    { lang_id: 'en', key: 'stocks_processed', value: 'Stocks Processed' },
    { lang_id: 'ar', key: 'stocks_processed', value: 'عدد الأسهم المفحوصة' },
    { lang_id: 'en', key: 'last_run_time', value: 'Last Run Time' },
    { lang_id: 'ar', key: 'last_run_time', value: 'آخر مرة تم التشغيل' },
    { lang_id: 'en', key: 'running', value: 'Running...' },
    { lang_id: 'ar', key: 'running', value: 'جاري التشغيل...' }
  ];
  
  let translationsSuccess = 0;
  for (const trans of translations) {
    try {
      const { error } = await supabase
        .from('translations')
        .upsert(trans, { onConflict: 'lang_id,key' });
      
      if (error) {
        console.error(`❌ ${trans.key} (${trans.lang_id}):`, error.message);
      } else {
        console.log(`✅ ${trans.key} (${trans.lang_id})`);
        translationsSuccess++;
      }
    } catch (err) {
      console.error(`❌ ${trans.key}:`, err.message);
    }
  }
  
  console.log(`\n✅ تمت إضافة ${translationsSuccess}/${translations.length} ترجمة\n`);
  
  // الجزء 2: تحديث الوظيفة - يجب إنشاء RPC function أولاً
  console.log('📝 الجزء 2: تحديث وظيفة evaluate_and_save_forecasts...\n');
  console.log('⚠️  تحديث الوظيفة يحتاج SQL مباشرة');
  console.log('📋 يجب تنفيذ UPDATE_EVALUATE_FUNCTION.sql في Supabase SQL Editor\n');
  
  // محاولة التحقق من الوظيفة الحالية
  try {
    const { data, error } = await supabase.rpc('evaluate_and_save_forecasts', { p_date_filter: null });
    
    if (error) {
      console.log('⚠️  الوظيفة موجودة لكن تحتاج تحديث:', error.message);
    } else {
      if (typeof data === 'object' && data !== null && 'forecasts_processed' in data) {
        console.log('✅ الوظيفة محدثة بالفعل!');
        console.log('البيانات:', JSON.stringify(data, null, 2));
      } else {
        console.log('⚠️  الوظيفة تحتاج تحديث - ترجع:', typeof data);
      }
    }
  } catch (err) {
    console.log('⚠️  لا يمكن التحقق من الوظيفة:', err.message);
  }
  
  console.log('\n✅ اكتملت العملية!');
  console.log('\n📋 ملاحظة: لتحديث الوظيفة، يجب تنفيذ UPDATE_EVALUATE_FUNCTION.sql في Supabase SQL Editor');
}

executeAllUpdates().catch(console.error);


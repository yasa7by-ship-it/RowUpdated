// فحص الجداول والوظائف للتأكد من التحديثات
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseUpdates() {
  console.log('\n=== فحص حالة الجداول والوظائف ===\n');
  
  // 1. فحص الترجمات
  console.log('📝 1. فحص الترجمات...\n');
  const translationKeys = ['last_run_stats', 'forecasts_processed', 'stocks_processed', 'last_run_time', 'running'];
  
  for (const key of translationKeys) {
    const { data: enData, error: enError } = await supabase
      .from('translations')
      .select('lang_id, key, value')
      .eq('lang_id', 'en')
      .eq('key', key)
      .single();
    
    const { data: arData, error: arError } = await supabase
      .from('translations')
      .select('lang_id, key, value')
      .eq('lang_id', 'ar')
      .eq('key', key)
      .single();
    
    if (enError || arError) {
      console.log(`❌ ${key}:`);
      if (enError) console.log(`   - EN: ${enError.message}`);
      if (arError) console.log(`   - AR: ${arError.message}`);
    } else {
      console.log(`✅ ${key}:`);
      console.log(`   - EN: ${enData?.value || 'غير موجود'}`);
      console.log(`   - AR: ${arData?.value || 'غير موجود'}`);
    }
  }
  
  console.log('\n');
  
  // 2. فحص وظيفة evaluate_and_save_forecasts
  console.log('📝 2. فحص وظيفة evaluate_and_save_forecasts...\n');
  
  try {
    // محاولة استدعاء الوظيفة
    const { data, error } = await supabase.rpc('evaluate_and_save_forecasts', { p_date_filter: null });
    
    if (error) {
      console.log(`❌ خطأ في الوظيفة: ${error.message}`);
    } else {
      if (typeof data === 'object' && data !== null) {
        console.log('✅ الوظيفة محدثة وتعمل بشكل صحيح!');
        console.log('   نوع الإرجاع: JSON Object');
        
        if ('forecasts_processed' in data) {
          console.log(`   ✅ forecasts_processed موجود: ${data.forecasts_processed}`);
        } else {
          console.log(`   ❌ forecasts_processed غير موجود`);
        }
        
        if ('stocks_processed' in data) {
          console.log(`   ✅ stocks_processed موجود: ${data.stocks_processed}`);
        } else {
          console.log(`   ❌ stocks_processed غير موجود`);
        }
        
        if ('execution_time' in data) {
          console.log(`   ✅ execution_time موجود: ${data.execution_time}`);
        } else {
          console.log(`   ⚠️  execution_time غير موجود (اختياري)`);
        }
        
        console.log('\n   البيانات الكاملة:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ الوظيفة ترجع نوع خاطئ: ${typeof data}`);
        console.log(`   القيمة: ${data}`);
      }
    }
  } catch (err) {
    console.log(`❌ خطأ في استدعاء الوظيفة: ${err.message}`);
  }
  
  console.log('\n');
  
  // 3. فحص نوع الإرجاع من قاعدة البيانات
  console.log('📝 3. فحص نوع الإرجاع من قاعدة البيانات...\n');
  
  try {
    const { data: funcData, error: funcError } = await supabase.rpc('pg_get_function_result', {
      function_name: 'evaluate_and_save_forecasts'
    });
    
    if (funcError) {
      // محاولة طريقة أخرى
      console.log('   ⚠️  لا يمكن التحقق من نوع الإرجاع مباشرة');
      console.log('   💡 تأكد من تنفيذ EXECUTE_THIS_SQL.sql في Supabase SQL Editor');
    } else {
      console.log('   ✅ نوع الإرجاع:', funcData);
    }
  } catch (err) {
    console.log('   ⚠️  لا يمكن التحقق من نوع الإرجاع');
  }
  
  console.log('\n=== انتهى الفحص ===\n');
}

checkDatabaseUpdates().catch(console.error);


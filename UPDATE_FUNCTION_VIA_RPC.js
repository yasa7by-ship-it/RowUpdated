// تنفيذ التحديثات - الجزء 2: تحديث الوظيفة
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateFunction() {
  console.log('\n=== تحديث وظيفة evaluate_and_save_forecasts ===\n');
  
  try {
    console.log('📝 محاولة استدعاء update_evaluate_function_v2...');
    const { data, error } = await supabase.rpc('update_evaluate_function_v2');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  الوظيفة update_evaluate_function_v2 غير موجودة');
        console.log('📋 يجب تنفيذ CREATE_UPDATE_FUNCTION_V2.sql في Supabase SQL Editor أولاً\n');
        console.log('💡 أو يمكنك تنفيذ EXECUTE_ALL_UPDATES.sql مباشرة في Supabase SQL Editor\n');
        return;
      }
      console.error('❌ خطأ:', error.message);
      return;
    }
    
    console.log('✅', data);
    console.log('\n✅ تم تحديث الوظيفة بنجاح!');
    
    // التحقق من الوظيفة
    console.log('\n📝 التحقق من الوظيفة...');
    const { data: testData, error: testError } = await supabase.rpc('evaluate_and_save_forecasts', { p_date_filter: null });
    
    if (testError) {
      console.log('⚠️  خطأ في التحقق:', testError.message);
    } else {
      if (typeof testData === 'object' && testData !== null && 'forecasts_processed' in testData) {
        console.log('✅ الوظيفة محدثة وتعمل بشكل صحيح!');
        console.log('البيانات:', JSON.stringify(testData, null, 2));
      } else {
        console.log('⚠️  الوظيفة ترجع:', typeof testData);
      }
    }
    
  } catch (err) {
    console.log('⚠️  خطأ:', err.message);
    console.log('\n📋 يجب تنفيذ EXECUTE_ALL_UPDATES.sql في Supabase SQL Editor');
  }
}

updateFunction().catch(console.error);


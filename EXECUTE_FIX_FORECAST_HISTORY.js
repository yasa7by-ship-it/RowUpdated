import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeFixForecastHistory() {
  console.log('='.repeat(70));
  console.log('🔧 إصلاح صفحة تحليل تاريخ التوقعات...');
  console.log('='.repeat(70));
  console.log('');

  console.log('⚠️  ملاحظة: يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql');
  console.log('   يدوياً في Supabase SQL Editor');
  console.log('');
  console.log('   السبب: الدالة get_forecast_performance_by_month تحتوي');
  console.log('   على خطأ في GROUP BY clause');
  console.log('');

  // التحقق من وجود الدالة
  console.log('🔍 التحقق من وجود الدالة...');
  try {
    const { data, error } = await supabase
      .rpc('get_forecast_performance_by_month', {
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31'
      });

    if (error) {
      console.log(`   ❌ الدالة بها خطأ: ${error.message}`);
      console.log('');
      console.log('   ✅ يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql لإصلاح المشكلة');
    } else {
      console.log('   ✅ الدالة تعمل بشكل صحيح');
    }
  } catch (err) {
    console.log(`   ❌ خطأ في التحقق: ${err.message}`);
  }

  console.log('\n✅ تم التحقق');
}

executeFixForecastHistory();


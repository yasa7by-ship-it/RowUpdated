import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyFunction() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق الشامل من دالة get_forecast_performance_by_month...');
  console.log('='.repeat(70));
  console.log('');

  // اختبار 1: بدون معاملات
  console.log('📝 اختبار 1: استدعاء بدون معاملات (يستخدم القيم الافتراضية)...');
  try {
    const { data: data1, error: error1 } = await supabase
      .rpc('get_forecast_performance_by_month');

    if (error1) {
      console.log(`   ❌ خطأ: ${error1.message}`);
      if (error1.message.includes('GROUP BY')) {
        console.log('   ⚠️  الدالة تحتاج إلى إصلاح! الخطأ في GROUP BY');
        console.log('   📝 يجب تنفيذ FIX_FORECAST_HISTORY_ANALYSIS.sql');
      }
    } else {
      console.log(`   ✅ نجح! عدد النتائج: ${Array.isArray(data1) ? data1.length : 'N/A'}`);
      if (Array.isArray(data1) && data1.length > 0) {
        console.log('   📋 عينة:');
        console.log(JSON.stringify(data1[0], null, 2));
      }
    }
  } catch (err) {
    console.log(`   ❌ استثناء: ${err.message}`);
  }

  console.log('');

  // اختبار 2: بمعاملات
  console.log('📝 اختبار 2: استدعاء بمعاملات (2023-2025)...');
  try {
    const { data: data2, error: error2 } = await supabase
      .rpc('get_forecast_performance_by_month', {
        p_start_date: '2023-01-01',
        p_end_date: '2025-12-31'
      });

    if (error2) {
      console.log(`   ❌ خطأ: ${error2.message}`);
      if (error2.message.includes('GROUP BY')) {
        console.log('   ⚠️  الدالة تحتاج إلى إصلاح! الخطأ في GROUP BY');
        console.log('   📝 يجب تنفيذ FIX_FORECAST_HISTORY_ANALYSIS.sql');
      }
    } else {
      console.log(`   ✅ نجح! عدد النتائج: ${Array.isArray(data2) ? data2.length : 'N/A'}`);
      if (Array.isArray(data2) && data2.length > 0) {
        console.log('   📋 أول 3 نتائج:');
        data2.slice(0, 3).forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.year}-${item.month}: ${item.total_forecasts} توقعات`);
        });
      }
    }
  } catch (err) {
    console.log(`   ❌ استثناء: ${err.message}`);
  }

  console.log('');

  // التحقق من وجود بيانات في الجدول
  console.log('📝 التحقق من وجود بيانات في forecast_check_history...');
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date, hit_range')
      .order('forecast_date', { ascending: false })
      .limit(5);

    if (tableError) {
      console.log(`   ⚠️  خطأ في قراءة الجدول: ${tableError.message}`);
    } else {
      console.log(`   ✅ يوجد ${tableData?.length || 0} سجل في العينة`);
      if (tableData && tableData.length > 0) {
        console.log('   📅 آخر تواريخ:');
        tableData.forEach((row, idx) => {
          console.log(`   ${idx + 1}. ${row.forecast_date} - hit: ${row.hit_range}`);
        });
      }
    }
  } catch (err) {
    console.log(`   ⚠️  خطأ: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
}

verifyFunction();


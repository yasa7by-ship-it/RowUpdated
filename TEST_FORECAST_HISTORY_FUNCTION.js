import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFunction() {
  console.log('='.repeat(70));
  console.log('🔍 اختبار دالة get_forecast_performance_by_month...');
  console.log('='.repeat(70));
  console.log('');

  try {
    console.log('📝 محاولة استدعاء الدالة...\n');
    
    const { data, error } = await supabase
      .rpc('get_forecast_performance_by_month', {
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31'
      });

    if (error) {
      console.log('❌ خطأ في الدالة:');
      console.log(`   الكود: ${error.code || 'N/A'}`);
      console.log(`   الرسالة: ${error.message}`);
      console.log(`   التفاصيل: ${error.details || 'N/A'}`);
      console.log(`   التلميح: ${error.hint || 'N/A'}`);
      console.log('');
      console.log('⚠️  الدالة تحتاج إلى إصلاح!');
      console.log('   يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql يدوياً');
      return false;
    } else {
      console.log('✅ الدالة تعمل بشكل صحيح!');
      console.log(`📊 عدد النتائج: ${Array.isArray(data) ? data.length : 'غير محدد'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 عينة من النتائج:');
        console.log(JSON.stringify(data.slice(0, 3), null, 2));
      }
      
      return true;
    }
  } catch (err) {
    console.log('❌ خطأ في الاستدعاء:');
    console.log(`   ${err.message}`);
    console.log('');
    console.log('⚠️  يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql يدوياً');
    return false;
  }
}

testFunction().then(success => {
  if (!success) {
    console.log('\n' + '='.repeat(70));
    console.log('📝 تعليمات التنفيذ اليدوي:');
    console.log('='.repeat(70));
    console.log('1. افتح: https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
    console.log('2. انسخ محتوى ملف FIX_FORECAST_HISTORY_ANALYSIS.sql');
    console.log('3. الصقه في SQL Editor واضغط Run');
    console.log('='.repeat(70));
  }
});



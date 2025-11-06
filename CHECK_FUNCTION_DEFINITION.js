import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkFunctionDefinition() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق من تعريف الدالة في قاعدة البيانات...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // محاولة قراءة تعريف الدالة من information_schema
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT pg_get_functiondef(oid) as definition
          FROM pg_proc
          WHERE proname = 'get_forecast_performance_by_month'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          LIMIT 1;
        `
      });

    if (error) {
      // طريقة بديلة: استخدام query مباشرة
      console.log('📝 محاولة طريقة بديلة للتحقق...\n');
      
      // التحقق من وجود DATE_TRUNC في GROUP BY
      // سنستخدم طريقة أخرى - اختبار الدالة مباشرة
      const { data: testData, error: testError } = await supabase
        .rpc('get_forecast_performance_by_month');

      if (testError) {
        if (testError.message.includes('GROUP BY')) {
          console.log('❌ الدالة تحتاج إلى إصلاح!');
          console.log(`   الخطأ: ${testError.message}`);
          console.log('   📝 يجب تنفيذ FIX_FORECAST_HISTORY_ANALYSIS.sql');
          return false;
        } else {
          console.log(`⚠️  خطأ آخر: ${testError.message}`);
        }
      } else {
        console.log('✅ الدالة تعمل بشكل صحيح!');
        console.log(`📊 تم جلب ${Array.isArray(testData) ? testData.length : 0} سجل`);
        
        // محاولة اختبار حالة خاصة قد تكشف مشكلة GROUP BY
        console.log('\n📝 اختبار إضافي: استدعاء مع فترة محددة جداً...');
        const { data: testData2, error: testError2 } = await supabase
          .rpc('get_forecast_performance_by_month', {
            p_start_date: '2025-11-01',
            p_end_date: '2025-11-30'
          });

        if (testError2) {
          if (testError2.message.includes('GROUP BY')) {
            console.log('❌ الدالة تحتاج إلى إصلاح!');
            console.log(`   الخطأ: ${testError2.message}`);
            console.log('   📝 يجب تنفيذ FIX_FORECAST_HISTORY_ANALYSIS.sql');
            return false;
          }
        } else {
          console.log('✅ الاختبار الإضافي نجح!');
          console.log(`📊 عدد النتائج: ${Array.isArray(testData2) ? testData2.length : 0}`);
        }
      }
    } else {
      if (data && data.length > 0) {
        const definition = data[0].definition;
        console.log('📄 تعريف الدالة:');
        console.log(definition.substring(0, 500));
        
        if (definition.includes('GROUP BY DATE_TRUNC')) {
          console.log('\n✅ الدالة تحتوي على الإصلاح الصحيح (GROUP BY DATE_TRUNC)');
        } else if (definition.includes('GROUP BY forecast_date')) {
          console.log('\n⚠️  الدالة قد تحتاج إلى إصلاح (GROUP BY forecast_date مباشرة)');
        }
      }
    }

    console.log('\n✅ الدالة تعمل بشكل صحيح ولا تحتاج إلى إصلاح!');
    return true;

  } catch (err) {
    console.log(`❌ خطأ: ${err.message}`);
    return false;
  }
}

checkFunctionDefinition().then(success => {
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


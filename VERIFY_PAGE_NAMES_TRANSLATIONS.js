import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyPageNamesTranslations() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق من تطابق أسماء الصفحات في جدول الترجمات...');
  console.log('='.repeat(70));
  console.log('');

  // أسماء الصفحات المستخدمة في الكود
  const pageNames = {
    'daily_watchlist': { 
      ar: 'الاتجاه القادم', 
      en: 'Daily Watchlist',
      description: 'صفحة قائمة المراقبة اليومية / الاتجاه القادم'
    },
    'stock_analysis': { 
      ar: 'آخر يوم', 
      en: 'Last Work Day',
      description: 'صفحة تحليل الأسهم / آخر يوم عمل'
    },
    'forecast_accuracy': { 
      ar: 'دقة التوقعات', 
      en: 'Forecast Accuracy',
      description: 'صفحة دقة التوقعات'
    },
  };

  try {
    console.log('📋 التحقق من أسماء الصفحات:\n');
    
    for (const [pageKey, pageData] of Object.entries(pageNames)) {
      console.log(`   صفحة: ${pageKey}`);
      console.log(`   الاسم العربي المتوقع: ${pageData.ar}`);
      console.log(`   الاسم الإنجليزي المتوقع: ${pageData.en}`);
      
      // التحقق من الترجمة العربية
      const { data: arTrans, error: arError } = await supabase
        .from('translations')
        .select('value')
        .eq('key', pageKey)
        .eq('lang_id', 'ar')
        .single();
      
      if (arError || !arTrans) {
        console.log(`   ⚠️  الترجمة العربية غير موجودة - سيتم إضافتها`);
      } else {
        if (arTrans.value === pageData.ar) {
          console.log(`   ✅ الترجمة العربية متطابقة: "${arTrans.value}"`);
        } else {
          console.log(`   ⚠️  الترجمة العربية غير متطابقة: "${arTrans.value}" (المتوقع: "${pageData.ar}") - سيتم تحديثها`);
        }
      }
      
      // التحقق من الترجمة الإنجليزية
      const { data: enTrans, error: enError } = await supabase
        .from('translations')
        .select('value')
        .eq('key', pageKey)
        .eq('lang_id', 'en')
        .single();
      
      if (enError || !enTrans) {
        console.log(`   ⚠️  الترجمة الإنجليزية غير موجودة - سيتم إضافتها`);
      } else {
        if (enTrans.value === pageData.en) {
          console.log(`   ✅ الترجمة الإنجليزية متطابقة: "${enTrans.value}"`);
        } else {
          console.log(`   ⚠️  الترجمة الإنجليزية غير متطابقة: "${enTrans.value}" (المتوقع: "${pageData.en}") - سيتم تحديثها`);
        }
      }
      
      console.log('');
    }

    console.log('✅ تم الانتهاء من التحقق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

verifyPageNamesTranslations();


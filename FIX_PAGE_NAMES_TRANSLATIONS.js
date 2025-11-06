import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPageNamesTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إصلاح أسماء الصفحات في جدول الترجمات...');
  console.log('='.repeat(70));
  console.log('');

  // أسماء الصفحات المستخدمة في الكود (يجب أن تكون متطابقة مع ما يظهر في الموقع)
  const pageNamesTranslations = [
    { 
      key: 'daily_watchlist', 
      ar: 'الاتجاه القادم', 
      en: 'Daily Watchlist',
      description: 'صفحة قائمة المراقبة اليومية / الاتجاه القادم'
    },
    { 
      key: 'stock_analysis', 
      ar: 'آخر يوم', 
      en: 'Last Work Day',
      description: 'صفحة تحليل الأسهم / آخر يوم عمل'
    },
    { 
      key: 'forecast_accuracy', 
      ar: 'دقة التوقعات', 
      en: 'Forecast Accuracy',
      description: 'صفحة دقة التوقعات'
    },
  ];

  try {
    console.log('📝 إضافة/تحديث ترجمات أسماء الصفحات...\n');
    
    for (const page of pageNamesTranslations) {
      // إضافة/تحديث الترجمة العربية
      const { error: arError } = await supabase
        .from('translations')
        .upsert({
          lang_id: 'ar',
          key: page.key,
          value: page.ar
        }, {
          onConflict: 'lang_id,key'
        });

      if (arError) {
        console.log(`   ⚠️  خطأ في إضافة/تحديث الترجمة العربية لـ ${page.key}: ${arError.message}`);
      } else {
        console.log(`   ✅ تم إضافة/تحديث الترجمة العربية لـ ${page.key}: "${page.ar}"`);
      }

      // إضافة/تحديث الترجمة الإنجليزية
      const { error: enError } = await supabase
        .from('translations')
        .upsert({
          lang_id: 'en',
          key: page.key,
          value: page.en
        }, {
          onConflict: 'lang_id,key'
        });

      if (enError) {
        console.log(`   ⚠️  خطأ في إضافة/تحديث الترجمة الإنجليزية لـ ${page.key}: ${enError.message}`);
      } else {
        console.log(`   ✅ تم إضافة/تحديث الترجمة الإنجليزية لـ ${page.key}: "${page.en}"`);
      }
      
      console.log('');
    }

    console.log('✅ تم الانتهاء من إصلاح أسماء الصفحات');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

fixPageNamesTranslations();


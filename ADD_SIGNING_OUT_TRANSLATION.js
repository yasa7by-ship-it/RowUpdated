import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addSigningOutTranslation() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة ترجمة "signing_out"...');
  console.log('='.repeat(70));
  console.log('');

  const translations = [
    { lang_id: 'en', key: 'signing_out', value: 'Signing Out' },
    { lang_id: 'ar', key: 'signing_out', value: 'جاري تسجيل الخروج' }
  ];

  try {
    for (const translation of translations) {
      const { data, error } = await supabase
        .from('translations')
        .upsert(translation, { 
          onConflict: 'lang_id,key',
          ignoreDuplicates: false 
        });

      if (error) {
        console.log(`❌ خطأ في إضافة "${translation.key}" (${translation.lang_id}): ${error.message}`);
      } else {
        console.log(`✅ تم إضافة/تحديث: "${translation.key}" (${translation.lang_id}): ${translation.value}`);
      }
    }

    console.log('\n✅ تم الانتهاء من إضافة الترجمات!');
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

addSigningOutTranslation();



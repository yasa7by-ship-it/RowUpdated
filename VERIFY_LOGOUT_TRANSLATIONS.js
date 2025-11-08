import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyLogoutTranslations() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق من ترجمات زر تسجيل الخروج...');
  console.log('='.repeat(70));
  console.log('');

  const requiredKeys = ['sign_out', 'signing_out'];

  try {
    for (const key of requiredKeys) {
      const { data, error } = await supabase
        .from('translations')
        .select('lang_id, key, value')
        .eq('key', key);

      if (error) {
        console.log(`❌ خطأ في جلب "${key}": ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`⚠️  لا توجد ترجمة لـ "${key}"`);
      } else {
        console.log(`✅ ترجمة "${key}":`);
        data.forEach(trans => {
          console.log(`   ${trans.lang_id}: ${trans.value}`);
        });
      }
    }

    console.log('\n✅ تم الانتهاء من التحقق');
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

verifyLogoutTranslations();



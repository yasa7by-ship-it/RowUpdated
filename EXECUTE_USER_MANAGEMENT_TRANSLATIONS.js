import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة ترجمات فلاتر إدارة المستخدمين...');
  console.log('='.repeat(70));
  console.log('');

  const translations = [
    { lang_id: 'en', key: 'search', value: 'Search' },
    { lang_id: 'ar', key: 'search', value: 'بحث' },
    { lang_id: 'en', key: 'all_roles', value: 'All Roles' },
    { lang_id: 'ar', key: 'all_roles', value: 'جميع الصلاحيات' },
    { lang_id: 'en', key: 'all_statuses', value: 'All Statuses' },
    { lang_id: 'ar', key: 'all_statuses', value: 'جميع الحالات' },
    { lang_id: 'en', key: 'results', value: 'Results' },
    { lang_id: 'ar', key: 'results', value: 'النتائج' },
    { lang_id: 'en', key: 'page', value: 'Page' },
    { lang_id: 'ar', key: 'page', value: 'صفحة' },
    { lang_id: 'en', key: 'of', value: 'of' },
    { lang_id: 'ar', key: 'of', value: 'من' },
    { lang_id: 'en', key: 'no_users_match_filters', value: 'No users match the selected filters' },
    { lang_id: 'ar', key: 'no_users_match_filters', value: 'لا توجد مستخدمين يطابقون الفلاتر المختارة' }
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
        console.log(`✅ تم إضافة/تحديث: "${translation.key}" (${translation.lang_id})`);
      }
    }

    console.log('\n✅ تم الانتهاء من إضافة الترجمات!');
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

addTranslations();



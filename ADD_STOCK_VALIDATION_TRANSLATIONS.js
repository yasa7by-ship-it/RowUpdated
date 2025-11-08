import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addStockValidationTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة ترجمات validation نموذج الأسهم...');
  console.log('='.repeat(70));
  console.log('');

  const translations = [
    { lang_id: 'en', key: 'symbol_required', value: 'Symbol is required' },
    { lang_id: 'ar', key: 'symbol_required', value: 'الرمز مطلوب' },
    { lang_id: 'en', key: 'invalid_symbol_format', value: 'Symbol must be 1-10 letters/numbers only' },
    { lang_id: 'ar', key: 'invalid_symbol_format', value: 'الرمز يجب أن يكون من 1-10 أحرف/أرقام فقط' },
    { lang_id: 'en', key: 'symbol_already_exists', value: 'This symbol already exists' },
    { lang_id: 'ar', key: 'symbol_already_exists', value: 'الرمز موجود بالفعل' },
    { lang_id: 'en', key: 'name_required', value: 'Name is required' },
    { lang_id: 'ar', key: 'name_required', value: 'الاسم مطلوب' },
    { lang_id: 'en', key: 'name_too_short', value: 'Name must be at least 2 characters' },
    { lang_id: 'ar', key: 'name_too_short', value: 'الاسم يجب أن يكون حرفين على الأقل' },
    { lang_id: 'en', key: 'name_too_long', value: 'Name is too long (maximum 200 characters)' },
    { lang_id: 'ar', key: 'name_too_long', value: 'الاسم طويل جداً (الحد الأقصى 200 حرف)' }
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

addStockValidationTranslations();



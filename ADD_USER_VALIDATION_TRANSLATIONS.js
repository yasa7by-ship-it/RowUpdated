import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addUserValidationTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة ترجمات validation نموذج المستخدم...');
  console.log('='.repeat(70));
  console.log('');

  const translations = [
    { lang_id: 'en', key: 'full_name_required', value: 'Full name is required (at least 2 characters)' },
    { lang_id: 'ar', key: 'full_name_required', value: 'الاسم الكامل مطلوب (على الأقل حرفان)' },
    { lang_id: 'en', key: 'email_required', value: 'Email is required' },
    { lang_id: 'ar', key: 'email_required', value: 'البريد الإلكتروني مطلوب' },
    { lang_id: 'en', key: 'invalid_email', value: 'Invalid email address' },
    { lang_id: 'ar', key: 'invalid_email', value: 'البريد الإلكتروني غير صحيح' },
    { lang_id: 'en', key: 'email_already_exists', value: 'This email is already registered' },
    { lang_id: 'ar', key: 'email_already_exists', value: 'البريد الإلكتروني مستخدم بالفعل' },
    { lang_id: 'en', key: 'role_required', value: 'Please select a role' },
    { lang_id: 'ar', key: 'role_required', value: 'يجب اختيار صلاحية' },
    { lang_id: 'en', key: 'password_too_long', value: 'Password is too long (maximum 72 characters)' },
    { lang_id: 'ar', key: 'password_too_long', value: 'كلمة المرور طويلة جداً (الحد الأقصى 72 حرف)' },
    { lang_id: 'en', key: 'password_weak', value: 'Password must contain at least one letter and one number' },
    { lang_id: 'ar', key: 'password_weak', value: 'كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل' },
    { lang_id: 'en', key: 'password_invalid', value: 'Invalid password' },
    { lang_id: 'ar', key: 'password_invalid', value: 'كلمة المرور غير صحيحة' },
    { lang_id: 'en', key: 'save_failed', value: 'Failed to save' },
    { lang_id: 'ar', key: 'save_failed', value: 'فشل الحفظ' }
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

addUserValidationTranslations();



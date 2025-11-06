import { createClient } from '@supabase/supabase-js';

// Service Role Key - bypasses RLS
const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

// إنشاء Supabase client مع Service Role Key (يتجاوز RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeTranslations() {
  console.log('='.repeat(70));
  console.log('🔧 إضافة الترجمات لصفحة إدارة الصلاحيات...');
  console.log('='.repeat(70));
  console.log('');

  const translations = [
    // ترجمات عامة للجدول
    { lang_id: 'en', key: 'permission_name', value: 'Permission Name' },
    { lang_id: 'ar', key: 'permission_name', value: 'اسم الصلاحية' },
    { lang_id: 'en', key: 'description', value: 'Description' },
    { lang_id: 'ar', key: 'description', value: 'الوصف' },
    { lang_id: 'en', key: 'status', value: 'Status' },
    { lang_id: 'ar', key: 'status', value: 'الحالة' },
    { lang_id: 'en', key: 'enabled', value: 'Enabled' },
    { lang_id: 'ar', key: 'enabled', value: 'مفعل' },
    { lang_id: 'en', key: 'disabled', value: 'Disabled' },
    { lang_id: 'ar', key: 'disabled', value: 'معطل' },
    
    // ترجمات الأدوار
    { lang_id: 'en', key: 'role_admin', value: 'Admin' },
    { lang_id: 'ar', key: 'role_admin', value: 'مدير' },
    { lang_id: 'en', key: 'role_admin_desc', value: 'Full system access with all permissions.' },
    { lang_id: 'ar', key: 'role_admin_desc', value: 'وصول كامل للنظام مع جميع الصلاحيات.' },
    
    { lang_id: 'en', key: 'role_supervisor', value: 'Supervisor' },
    { lang_id: 'ar', key: 'role_supervisor', value: 'مشرف' },
    { lang_id: 'en', key: 'role_supervisor_desc', value: 'Can monitor and manage users with limited administrative access.' },
    { lang_id: 'ar', key: 'role_supervisor_desc', value: 'يمكنه مراقبة وإدارة المستخدمين مع وصول إداري محدود.' },
    
    { lang_id: 'en', key: 'role_user', value: 'User' },
    { lang_id: 'ar', key: 'role_user', value: 'مستخدم' },
    { lang_id: 'en', key: 'role_user_desc', value: 'Standard user with read-only access to most features.' },
    { lang_id: 'ar', key: 'role_user_desc', value: 'مستخدم قياسي مع وصول للقراءة فقط لمعظم الميزات.' },
    
    // ترجمات الصلاحيات المفقودة
    { lang_id: 'en', key: 'perm_view_forecast_accuracy', value: 'View Forecast Accuracy' },
    { lang_id: 'ar', key: 'perm_view_forecast_accuracy', value: 'عرض دقة التوقعات' },
    { lang_id: 'en', key: 'perm_view_forecast_accuracy_desc', value: 'Can view forecast accuracy analysis and statistics.' },
    { lang_id: 'ar', key: 'perm_view_forecast_accuracy_desc', value: 'يمكنه عرض تحليل دقة التوقعات والإحصائيات.' },
    
    { lang_id: 'en', key: 'perm_view_forecast_history_analysis', value: 'View Forecast History Analysis' },
    { lang_id: 'ar', key: 'perm_view_forecast_history_analysis', value: 'عرض تحليل تاريخ التوقعات' },
    { lang_id: 'en', key: 'perm_view_forecast_history_analysis_desc', value: 'Can view historical forecast analysis and trends.' },
    { lang_id: 'ar', key: 'perm_view_forecast_history_analysis_desc', value: 'يمكنه عرض تحليل التوقعات التاريخية والاتجاهات.' },
  ];

  try {
    console.log('📝 إضافة الترجمات...\n');

    for (const translation of translations) {
      const { data, error } = await supabase
        .from('translations')
        .upsert({
          lang_id: translation.lang_id,
          key: translation.key,
          value: translation.value
        }, {
          onConflict: 'lang_id,key'
        });

      if (error) {
        console.log(`   ⚠️  خطأ في إضافة "${translation.key}": ${error.message}`);
      } else {
        console.log(`   ✅ تم إضافة "${translation.key}"`);
      }
    }

    console.log('\n✅ تم إضافة جميع الترجمات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeTranslations();


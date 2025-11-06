import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPermissions() {
  console.log('='.repeat(70));
  console.log('🔧 إصلاح بيانات الصلاحيات...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. إضافة صلاحية view:system_documentation
    console.log('📝 إضافة صلاحية view:system_documentation...\n');
    
    const { data: permData, error: permError } = await supabase
      .from('permissions')
      .upsert({
        action: 'view:system_documentation',
        description: 'Can view the system documentation page.'
      }, {
        onConflict: 'action'
      })
      .select('id')
      .single();

    if (permError) {
      console.log(`   ⚠️  خطأ في إضافة الصلاحية: ${permError.message}`);
    } else {
      console.log(`   ✅ تم إضافة/تحديث صلاحية view:system_documentation (ID: ${permData.id})`);
      
      // ربط الصلاحية بدور Admin
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Admin')
        .single();

      if (adminRole) {
        const { error: rpError } = await supabase
          .from('role_permissions')
          .upsert({
            role_id: adminRole.id,
            permission_id: permData.id
          }, {
            onConflict: 'role_id,permission_id'
          });

        if (rpError) {
          console.log(`   ⚠️  خطأ في ربط الصلاحية بدور Admin: ${rpError.message}`);
        } else {
          console.log(`   ✅ تم ربط الصلاحية بدور Admin`);
        }
      }
    }
    console.log('');

    // 2. إضافة الترجمات
    console.log('📝 إضافة الترجمات...\n');
    
    const translations = [
      { lang_id: 'en', key: 'perm_view_system_documentation', value: 'View System Documentation' },
      { lang_id: 'ar', key: 'perm_view_system_documentation', value: 'عرض توثيق النظام' },
      { lang_id: 'en', key: 'perm_view_system_documentation_desc', value: 'Can view the system documentation page.' },
      { lang_id: 'ar', key: 'perm_view_system_documentation_desc', value: 'يمكنه عرض صفحة توثيق النظام.' },
    ];

    for (const trans of translations) {
      const { error: transError } = await supabase
        .from('translations')
        .upsert({
          lang_id: trans.lang_id,
          key: trans.key,
          value: trans.value
        }, {
          onConflict: 'lang_id,key'
        });

      if (transError) {
        console.log(`   ⚠️  خطأ في إضافة "${trans.key}": ${transError.message}`);
      } else {
        console.log(`   ✅ تم إضافة "${trans.key}"`);
      }
    }
    console.log('');

    // 3. التحقق من النتيجة
    console.log('🔍 التحقق من النتيجة...\n');
    const { data: allPerms } = await supabase
      .from('permissions')
      .select('action')
      .order('action');

    if (allPerms) {
      console.log(`✅ إجمالي الصلاحيات الآن: ${allPerms.length}`);
      const sysDoc = allPerms.find(p => p.action === 'view:system_documentation');
      if (sysDoc) {
        console.log('✅ صلاحية view:system_documentation موجودة الآن');
      }
    }

    console.log('\n✅ تم الانتهاء من الإصلاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

fixPermissions();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanAndFixPermissions() {
  console.log('='.repeat(70));
  console.log('🔧 تنظيف وإصلاح جدول الصلاحيات...');
  console.log('='.repeat(70));
  console.log('');

  // قائمة الصلاحيات المستخدمة في الكود
  const usedPermissions = [
    'view:dashboard',
    'manage:users',
    'manage:roles',
    'manage:announcements',
    'view:system_documentation',
    'view:stock_analysis',
    'view:daily_watchlist',
    'manage:stocks',
    'manage:translations',
    'view:activity_log',
    'submit:user_notes',
    'manage:user_notes',
    'view:forecast_accuracy',
    'view:forecast_history_analysis',
  ];

  // قائمة الصلاحيات غير المستخدمة (لحذفها)
  const unusedPermissions = [
    'manage:settings',
    'truncate:activity_log',
    'view:confidence_analysis',
    'view:tomorrows_watchlist',
  ];

  try {
    // 1. حذف الصلاحيات غير المستخدمة
    console.log('📝 1. حذف الصلاحيات غير المستخدمة...\n');
    
    for (const permAction of unusedPermissions) {
      // جلب ID الصلاحية
      const { data: permData } = await supabase
        .from('permissions')
        .select('id')
        .eq('action', permAction)
        .single();

      if (permData) {
        // حذف من role_permissions أولاً
        const { error: rpError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('permission_id', permData.id);

        if (rpError) {
          console.log(`   ⚠️  خطأ في حذف role_permissions لـ ${permAction}: ${rpError.message}`);
        } else {
          console.log(`   ✅ تم حذف role_permissions لـ ${permAction}`);
        }

        // حذف الصلاحية
        const { error: permError } = await supabase
          .from('permissions')
          .delete()
          .eq('id', permData.id);

        if (permError) {
          console.log(`   ⚠️  خطأ في حذف صلاحية ${permAction}: ${permError.message}`);
        } else {
          console.log(`   ✅ تم حذف صلاحية ${permAction}`);
        }
      } else {
        console.log(`   ℹ️  صلاحية ${permAction} غير موجودة (لا حاجة للحذف)`);
      }
    }
    console.log('');

    // 2. التأكد من وجود جميع الصلاحيات المستخدمة
    console.log('📝 2. التأكد من وجود جميع الصلاحيات المستخدمة...\n');
    
    const permissionDescriptions = {
      'view:dashboard': 'Can view the main dashboard.',
      'manage:users': 'Can create, edit, and delete users.',
      'manage:roles': 'Can create, edit, and delete roles and assign permissions.',
      'manage:announcements': 'Can create, edit, and delete global announcements.',
      'view:system_documentation': 'Can view the system documentation page.',
      'view:stock_analysis': 'Can view the stock analysis and forecast performance dashboard.',
      'view:daily_watchlist': 'Can view the daily watchlist of stock forecasts.',
      'manage:stocks': 'Can add, update, and track stocks.',
      'manage:translations': 'Can edit UI translation values for all languages.',
      'view:activity_log': 'Can view the system activity log.',
      'submit:user_notes': 'Can access the "My Notes" page to submit feedback.',
      'manage:user_notes': 'Can view, manage, and export all user-submitted notes.',
      'view:forecast_accuracy': 'Can view the forecast accuracy analysis page.',
      'view:forecast_history_analysis': 'Can view the forecast history analysis page.',
    };

    for (const permAction of usedPermissions) {
      const { data: permData, error: permError } = await supabase
        .from('permissions')
        .upsert({
          action: permAction,
          description: permissionDescriptions[permAction] || ''
        }, {
          onConflict: 'action'
        })
        .select('id')
        .single();

      if (permError) {
        console.log(`   ⚠️  خطأ في إضافة/تحديث صلاحية ${permAction}: ${permError.message}`);
      } else {
        console.log(`   ✅ تم التأكد من وجود صلاحية ${permAction}`);
      }
    }
    console.log('');

    // 3. ربط جميع الصلاحيات بدور Admin
    console.log('📝 3. ربط جميع الصلاحيات بدور Admin...\n');
    
    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Admin')
      .single();

    if (adminRole) {
      const { data: allPerms } = await supabase
        .from('permissions')
        .select('id');

      if (allPerms) {
        for (const perm of allPerms) {
          const { error: rpError } = await supabase
            .from('role_permissions')
            .upsert({
              role_id: adminRole.id,
              permission_id: perm.id
            }, {
              onConflict: 'role_id,permission_id'
            });

          if (rpError) {
            console.log(`   ⚠️  خطأ في ربط صلاحية (ID: ${perm.id}): ${rpError.message}`);
          }
        }
        console.log(`   ✅ تم ربط ${allPerms.length} صلاحية بدور Admin`);
      }
    }
    console.log('');

    // 4. التحقق النهائي
    console.log('🔍 4. التحقق النهائي...\n');
    
    const { data: finalPerms } = await supabase
      .from('permissions')
      .select('action')
      .order('action');

    if (finalPerms) {
      console.log(`✅ إجمالي الصلاحيات بعد التنظيف: ${finalPerms.length}`);
      console.log('\n   الصلاحيات الموجودة:');
      finalPerms.forEach((perm, index) => {
        const isUsed = usedPermissions.includes(perm.action);
        const marker = isUsed ? '✅' : '⚠️';
        console.log(`   ${marker} ${index + 1}. ${perm.action}`);
      });
    }

    console.log('\n✅ تم الانتهاء من التنظيف والإصلاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

cleanAndFixPermissions();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function finalCleanPermissions() {
  console.log('='.repeat(70));
  console.log('🔧 تنظيف وإصلاح نهائي لجدول الصلاحيات...');
  console.log('='.repeat(70));
  console.log('');

  // قائمة الصلاحيات المستخدمة فعلياً في الكود
  // من App.tsx (لوصول الصفحات) + من المكونات الداخلية
  const usedPermissions = [
    // من App.tsx - صلاحيات الوصول للصفحات
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
    // من المكونات الداخلية
    'manage:settings', // مستخدمة في Dashboard.tsx
    'truncate:activity_log', // مستخدمة في ActivityLog.tsx
  ];

  // قائمة الصلاحيات غير المستخدمة (لحذفها)
  const unusedPermissions = [
    'view:confidence_analysis', // غير مستخدمة في الكود
    'view:tomorrows_watchlist', // غير مستخدمة في الكود
  ];

  try {
    console.log('📋 الصلاحيات المستخدمة فعلياً في الموقع:');
    usedPermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm}`);
    });
    console.log('');

    console.log('📋 الصلاحيات غير المستخدمة (سيتم حذفها):');
    unusedPermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm}`);
    });
    console.log('');

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

        if (!rpError) {
          console.log(`   ✅ تم حذف role_permissions لـ ${permAction}`);
        }

        // حذف الصلاحية
        const { error: permError } = await supabase
          .from('permissions')
          .delete()
          .eq('id', permData.id);

        if (!permError) {
          console.log(`   ✅ تم حذف صلاحية ${permAction}`);
        } else {
          console.log(`   ⚠️  خطأ في حذف صلاحية ${permAction}: ${permError.message}`);
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
      'manage:settings': 'Can update site-wide application settings.',
      'truncate:activity_log': 'Can permanently delete all entries from the activity log.',
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
        let linkedCount = 0;
        for (const perm of allPerms) {
          const { error: rpError } = await supabase
            .from('role_permissions')
            .upsert({
              role_id: adminRole.id,
              permission_id: perm.id
            }, {
              onConflict: 'role_id,permission_id'
            });

          if (!rpError) {
            linkedCount++;
          }
        }
        console.log(`   ✅ تم ربط ${linkedCount} صلاحية بدور Admin`);
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

      // التحقق من تطابق
      const missingPerms = usedPermissions.filter(used => !finalPerms.find(p => p.action === used));
      const extraPerms = finalPerms.filter(p => !usedPermissions.includes(p.action));

      if (missingPerms.length > 0) {
        console.log('\n   ⚠️  صلاحيات مستخدمة في الكود ولكن غير موجودة في قاعدة البيانات:');
        missingPerms.forEach(perm => {
          console.log(`      - ${perm}`);
        });
      }

      if (extraPerms.length > 0) {
        console.log('\n   ⚠️  صلاحيات موجودة في قاعدة البيانات ولكن غير مستخدمة في الكود:');
        extraPerms.forEach(perm => {
          console.log(`      - ${perm.action}`);
        });
      }

      if (missingPerms.length === 0 && extraPerms.length === 0) {
        console.log('\n   ✅ جميع الصلاحيات متطابقة!');
      }
    }

    console.log('\n✅ تم الانتهاء من التنظيف والإصلاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

finalCleanPermissions();


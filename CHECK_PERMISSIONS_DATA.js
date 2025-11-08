import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPermissionsData() {
  console.log('='.repeat(70));
  console.log('🔍 فحص بيانات الصلاحيات في قاعدة البيانات');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. جلب جميع الصلاحيات
    console.log('📋 1. جلب جميع الصلاحيات...\n');
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('id, action, description')
      .order('action');

    if (permError) {
      console.error('❌ خطأ في جلب الصلاحيات:', permError.message);
      return;
    }

    console.log(`✅ تم العثور على ${permissions.length} صلاحية:`);
    permissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm.action} - ${perm.description || 'بدون وصف'}`);
    });
    console.log('');

    // 2. جلب جميع الأدوار
    console.log('📋 2. جلب جميع الأدوار...\n');
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name');

    if (roleError) {
      console.error('❌ خطأ في جلب الأدوار:', roleError.message);
      return;
    }

    console.log(`✅ تم العثور على ${roles.length} دور:`);
    roles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name} - ${role.description || 'بدون وصف'}`);
    });
    console.log('');

    // 3. جلب جميع الصلاحيات المرتبطة بالأدوار
    console.log('📋 3. جلب الصلاحيات المرتبطة بالأدوار...\n');
    const { data: rolePerms, error: rpError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id');

    if (rpError) {
      console.error('❌ خطأ في جلب الصلاحيات المرتبطة:', rpError.message);
      return;
    }

    console.log(`✅ تم العثور على ${rolePerms.length} ربط بين الأدوار والصلاحيات\n`);

    // 4. عرض تفصيلي لكل دور وصلاحياته
    console.log('📋 4. عرض تفصيلي لكل دور وصلاحياته:\n');
    for (const role of roles) {
      const rolePermIds = rolePerms
        .filter(rp => rp.role_id === role.id)
        .map(rp => rp.permission_id);
      
      const rolePermissionsList = permissions.filter(p => rolePermIds.includes(p.id));
      
      console.log(`   ${role.name} (${rolePermissionsList.length} صلاحية):`);
      if (rolePermissionsList.length === 0) {
        console.log('      ⚠️  لا توجد صلاحيات مرتبطة بهذا الدور!');
      } else {
        rolePermissionsList.forEach(perm => {
          console.log(`      - ${perm.action}`);
        });
      }
      console.log('');
    }

    // 5. التحقق من الصلاحيات المستخدمة في الكود
    console.log('📋 5. التحقق من الصلاحيات المستخدمة في الكود:\n');
    const codePermissions = [
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
      'view:what_happened',
    ];

    console.log('   الصلاحيات المستخدمة في الكود:');
    codePermissions.forEach(perm => {
      const found = permissions.find(p => p.action === perm);
      if (found) {
        console.log(`      ✅ ${perm}`);
      } else {
        console.log(`      ❌ ${perm} - غير موجود في قاعدة البيانات!`);
      }
    });
    console.log('');

    // 6. التحقق من الصلاحيات الموجودة في قاعدة البيانات ولكن غير مستخدمة
    console.log('📋 6. الصلاحيات الموجودة في قاعدة البيانات:\n');
    const dbPermissions = permissions.map(p => p.action);
    const unused = dbPermissions.filter(dbPerm => !codePermissions.includes(dbPerm));
    
    if (unused.length > 0) {
      console.log('   ⚠️  صلاحيات موجودة في قاعدة البيانات ولكن غير مستخدمة في الكود:');
      unused.forEach(perm => {
        console.log(`      - ${perm}`);
      });
    } else {
      console.log('   ✅ جميع الصلاحيات مستخدمة في الكود');
    }
    console.log('');

    // 7. التحقق من الترجمة لكل صلاحية
    console.log('📋 7. التحقق من وجود الترجمة لكل صلاحية:\n');
    for (const perm of permissions) {
      const permKey = `perm_${perm.action.replace(':', '_')}`;
      const permDescKey = `${permKey}_desc`;
      
      const { data: transName, error: transNameError } = await supabase
        .from('translations')
        .select('value')
        .eq('key', permKey)
        .eq('lang_id', 'ar')
        .single();
      
      const { data: transDesc, error: transDescError } = await supabase
        .from('translations')
        .select('value')
        .eq('key', permDescKey)
        .eq('lang_id', 'ar')
        .single();
      
      if (transNameError || !transName) {
        console.log(`   ⚠️  ${perm.action} - لا توجد ترجمة للاسم (${permKey})`);
      } else {
        console.log(`   ✅ ${perm.action} - ${transName.value}`);
      }
      
      if (transDescError || !transDesc) {
        console.log(`      ⚠️  لا توجد ترجمة للوصف (${permDescKey})`);
      }
    }
    console.log('');

    console.log('✅ تم الانتهاء من الفحص');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkPermissionsData();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeCleanPermissions() {
  console.log('='.repeat(70));
  console.log('🔧 تنظيف الصلاحيات المكررة وإعادة ترتيبها...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Get all permissions
    console.log('📝 الخطوة 1: جلب جميع الصلاحيات...');
    const { data: allPermissions, error: fetchError } = await supabase
      .from('permissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`✅ تم جلب ${allPermissions.length} صلاحية`);

    // Step 2: Find duplicates by action
    console.log('\n📝 الخطوة 2: البحث عن التكرارات...');
    const actionMap = new Map();
    const duplicates = [];

    allPermissions.forEach(perm => {
      if (!actionMap.has(perm.action)) {
        actionMap.set(perm.action, []);
      }
      actionMap.get(perm.action).push(perm);
    });

    actionMap.forEach((perms, action) => {
      if (perms.length > 1) {
        duplicates.push({ action, perms });
        console.log(`   ⚠️  وجد ${perms.length} صلاحية مكررة لـ ${action}`);
      }
    });

    if (duplicates.length === 0) {
      console.log('   ✅ لا توجد صلاحيات مكررة');
    }

    // Step 3: Remove duplicates (keep the newest one)
    if (duplicates.length > 0) {
      console.log('\n📝 الخطوة 3: إزالة التكرارات...');
      for (const { action, perms } of duplicates) {
        // Sort by created_at DESC, keep the first (newest)
        const sortedPerms = [...perms].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        
        const keptPerm = sortedPerms[0];
        const toDelete = sortedPerms.slice(1);

        console.log(`   📌 الإبقاء على: ${keptPerm.id} (${action})`);
        console.log(`   🗑️  حذف ${toDelete.length} صلاحية مكررة`);

        // Move role_permissions to kept permission
        for (const delPerm of toDelete) {
          // Get role_permissions for this permission
          const { data: rolePerms, error: rpError } = await supabase
            .from('role_permissions')
            .select('role_id')
            .eq('permission_id', delPerm.id);

          if (!rpError && rolePerms) {
            // Insert role_permissions for kept permission (ignore conflicts)
            for (const rp of rolePerms) {
              await supabase
                .from('role_permissions')
                .upsert({
                  role_id: rp.role_id,
                  permission_id: keptPerm.id
                }, {
                  onConflict: 'role_id,permission_id',
                  ignoreDuplicates: true
                });
            }

            // Delete old role_permissions
            await supabase
              .from('role_permissions')
              .delete()
              .eq('permission_id', delPerm.id);
          }

          // Delete duplicate permission
          const { error: deleteError } = await supabase
            .from('permissions')
            .delete()
            .eq('id', delPerm.id);

          if (deleteError) {
            console.log(`   ❌ خطأ في حذف ${delPerm.id}: ${deleteError.message}`);
          } else {
            console.log(`   ✅ تم حذف ${delPerm.id}`);
          }
        }
      }
    }

    // Step 4: Check if display_order column exists and add if needed
    console.log('\n📝 الخطوة 4: التحقق من عمود display_order...');
    const { data: samplePerm } = await supabase
      .from('permissions')
      .select('display_order')
      .limit(1)
      .single();

    // If display_order doesn't exist, we need to add it via SQL
    // For now, we'll just update existing permissions
    if (samplePerm && samplePerm.display_order === undefined) {
      console.log('   ⚠️  عمود display_order غير موجود - يجب إضافته عبر SQL');
    } else {
      console.log('   ✅ عمود display_order موجود');
    }

    // Step 5: Update display_order for all permissions
    console.log('\n📝 الخطوة 5: تحديث ترتيب العرض...');
    const orderMap = {
      'view:daily_watchlist': 1,
      'view:stock_analysis': 2,
      'view:forecast_accuracy': 3,
      'view:forecast_history_analysis': 4,
      'view:dashboard': 5,
      'manage:users': 10,
      'manage:roles': 11,
      'manage:announcements': 12,
      'view:system_documentation': 13,
      'manage:stocks': 14,
      'manage:translations': 15,
      'view:activity_log': 16,
      'submit:user_notes': 17,
      'manage:user_notes': 18,
      'manage:settings': 19,
      'truncate:activity_log': 20,
    };

    // Get all permissions again after deletion
    const { data: remainingPerms, error: remError } = await supabase
      .from('permissions')
      .select('id, action');

    if (remError) throw remError;

    for (const perm of remainingPerms) {
      const order = orderMap[perm.action] || 999;
      
      const { error: updateError } = await supabase
        .from('permissions')
        .update({ display_order: order })
        .eq('id', perm.id);

      if (updateError) {
        console.log(`   ⚠️  خطأ في تحديث ${perm.action}: ${updateError.message}`);
      } else {
        console.log(`   ✅ ${perm.action} → ${order}`);
      }
    }

    console.log('\n✅ تم الانتهاء من تنظيف الصلاحيات وإعادة ترتيبها!');
    console.log('');
    console.log('📝 ملاحظة: إذا كان عمود display_order غير موجود،');
    console.log('   يجب تنفيذ هذا SQL في Supabase SQL Editor:');
    console.log('   ALTER TABLE public.permissions ADD COLUMN display_order INTEGER DEFAULT 999;');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n⚠️  يجب تنفيذ SQL يدوياً في Supabase SQL Editor');
  }
}

executeCleanPermissions();



import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeCleanDuplicatePermissions() {
  console.log('='.repeat(70));
  console.log('🔧 تنظيف الصلاحيات المكررة وإعادة ترتيبها...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Find and remove duplicates
    console.log('📝 الخطوة 1: البحث عن الصلاحيات المكررة...');
    const { data: duplicates, error: dupError } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT action, COUNT(*) as cnt, array_agg(id ORDER BY created_at DESC) as ids
          FROM public.permissions
          GROUP BY action
          HAVING COUNT(*) > 1
        `
      });

    if (dupError) {
      console.log('⚠️  لا يمكن البحث عن التكرارات مباشرة');
      console.log('   يجب تنفيذ SQL يدوياً');
    } else {
      console.log('✅ تم العثور على التكرارات');
      
      // Step 2: Add display_order column if not exists
      console.log('\n📝 الخطوة 2: إضافة عمود display_order...');
      const { error: alterError } = await supabase
        .rpc('exec_sql', {
          query: `
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'permissions' 
                AND column_name = 'display_order'
              ) THEN
                ALTER TABLE public.permissions ADD COLUMN display_order INTEGER DEFAULT 999;
              END IF;
            END $$;
          `
        });

      if (alterError) {
        console.log('⚠️  لا يمكن إضافة العمود مباشرة');
      } else {
        console.log('✅ تم إضافة/التحقق من عمود display_order');
      }

      // Step 3: Update display_order for main pages
      console.log('\n📝 الخطوة 3: تحديث ترتيب العرض...');
      const orderUpdates = [
        { action: 'view:daily_watchlist', order: 1 },
        { action: 'view:stock_analysis', order: 2 },
        { action: 'view:forecast_accuracy', order: 3 },
        { action: 'view:forecast_history_analysis', order: 4 },
        { action: 'view:dashboard', order: 5 },
        { action: 'manage:users', order: 10 },
        { action: 'manage:roles', order: 11 },
        { action: 'manage:announcements', order: 12 },
        { action: 'view:system_documentation', order: 13 },
        { action: 'manage:stocks', order: 14 },
        { action: 'manage:translations', order: 15 },
        { action: 'view:activity_log', order: 16 },
        { action: 'submit:user_notes', order: 17 },
        { action: 'manage:user_notes', order: 18 },
        { action: 'manage:settings', order: 19 },
        { action: 'truncate:activity_log', order: 20 },
      ];

      for (const update of orderUpdates) {
        const { error: updateError } = await supabase
          .from('permissions')
          .update({ display_order: update.order })
          .eq('action', update.action);

        if (updateError) {
          console.log(`   ⚠️  خطأ في تحديث ${update.action}: ${updateError.message}`);
        } else {
          console.log(`   ✅ تم تحديث ترتيب ${update.action} → ${update.order}`);
        }
      }

      console.log('\n✅ تم الانتهاء من تحديث الترتيب');
    }

    // Since we can't execute the full SQL directly, show instructions
    console.log('\n' + '='.repeat(70));
    console.log('📝 ملاحظة: بعض العمليات تتطلب تنفيذ SQL مباشرة');
    console.log('='.repeat(70));
    console.log('للإزالة الكاملة للتكرارات، يجب تنفيذ:');
    console.log('   CLEAN_DUPLICATE_PERMISSIONS_AND_ORDER.sql');
    console.log('في Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n⚠️  يجب تنفيذ SQL يدوياً في Supabase SQL Editor');
  }
}

executeCleanDuplicatePermissions();



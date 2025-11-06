import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifySystemDocTranslation() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق من ترجمة system_documentation...');
  console.log('='.repeat(70));
  console.log('');

  try {
    const { data: arTrans, error: arError } = await supabase
      .from('translations')
      .select('value')
      .eq('key', 'system_documentation')
      .eq('lang_id', 'ar')
      .single();

    const { data: enTrans, error: enError } = await supabase
      .from('translations')
      .select('value')
      .eq('key', 'system_documentation')
      .eq('lang_id', 'en')
      .single();

    console.log('📋 الترجمات:');
    if (arError || !arTrans) {
      console.log('   ❌ الترجمة العربية غير موجودة');
    } else {
      console.log(`   ✅ العربية: "${arTrans.value}"`);
    }

    if (enError || !enTrans) {
      console.log('   ❌ الترجمة الإنجليزية غير موجودة');
    } else {
      console.log(`   ✅ الإنجليزية: "${enTrans.value}"`);
    }

    console.log('\n✅ تم التحقق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

verifySystemDocTranslation();


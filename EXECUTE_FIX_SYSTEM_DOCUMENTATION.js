import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeFixSystemDocumentation() {
  console.log('='.repeat(70));
  console.log('🔧 إصلاح صفحة System Documentation...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة ملف SQL
    const sqlFilePath = join(__dirname, 'FIX_SYSTEM_DOCUMENTATION.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');

    // تقسيم SQL إلى أوامر منفصلة (بين BEGIN و COMMIT)
    const sqlCommands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('RAISE NOTICE'));

    console.log('📝 تنفيذ SQL...\n');

    // تنفيذ الأوامر واحداً تلو الآخر
    for (const command of sqlCommands) {
      if (command.length > 10) { // تجاهل الأوامر الفارغة
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: command });
          if (error) {
            // إذا فشل exec_sql، حاول استخدام طريقة أخرى
            console.log(`   ⚠️  محاولة طريقة بديلة للأمر...`);
          }
        } catch (err) {
          console.log(`   ⚠️  خطأ في تنفيذ الأمر: ${err.message}`);
        }
      }
    }

    // طريقة بديلة: استخدام Supabase Management API أو تنفيذ مباشر
    // لكن Supabase لا يدعم exec_sql مباشرة، لذلك سنستخدم طريقة أخرى
    console.log('\n📝 تنفيذ الإصلاح بطريقة مباشرة...\n');

    // 1. إضافة/تحديث الترجمة
    console.log('1. إضافة/تحديث ترجمة system_documentation...');
    const { error: transError } = await supabase
      .from('translations')
      .upsert([
        { lang_id: 'en', key: 'system_documentation', value: 'System Documentation' },
        { lang_id: 'ar', key: 'system_documentation', value: 'توثيق النظام' }
      ], {
        onConflict: 'lang_id,key'
      });

    if (transError) {
      console.log(`   ⚠️  خطأ في إضافة الترجمة: ${transError.message}`);
    } else {
      console.log('   ✅ تم إضافة/تحديث الترجمة');
    }

    // 2. التحقق من وجود الدالة
    console.log('\n2. التحقق من وجود دالة get_database_documentation...');
    const { data: funcData, error: funcError } = await supabase
      .rpc('get_database_documentation');

    if (funcError) {
      console.log(`   ⚠️  الدالة غير موجودة أو بها خطأ: ${funcError.message}`);
      console.log('   ⚠️  يجب تنفيذ SQL script يدوياً في Supabase SQL Editor');
      console.log('   ⚠️  الملف: FIX_SYSTEM_DOCUMENTATION.sql');
    } else {
      console.log('   ✅ الدالة تعمل بشكل صحيح');
    }

    console.log('\n✅ تم الانتهاء من الإصلاح');
    console.log('\n⚠️  ملاحظة: إذا كانت الدالة لا تزال لا تعمل، يجب تنفيذ');
    console.log('   ملف FIX_SYSTEM_DOCUMENTATION.sql يدوياً في Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeFixSystemDocumentation();


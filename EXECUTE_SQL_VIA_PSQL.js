import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseDbPassword = 'bojrgkiqsahuwufbkacm'; // Database password (usually in connection string)
const dbHost = 'db.bojrgkiqsahuwufbkacm.supabase.co';
const dbPort = '5432';
const dbName = 'postgres';
const dbUser = 'postgres.bojrgkiqsahuwufbkacm';

async function executeSQLViaPsql() {
  console.log('='.repeat(70));
  console.log('🔧 تنفيذ SQL عبر psql...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة ملف SQL
    const sqlFilePath = join(__dirname, 'FIX_FORECAST_HISTORY_ANALYSIS.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');

    // تنظيف SQL من RAISE NOTICE (لا يعمل في psql مباشرة)
    const cleanSql = sql
      .replace(/RAISE NOTICE '.*?';/g, '')
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .trim();

    // بناء connection string
    const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    
    // استخدام PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: dbPassword };

    console.log('📝 محاولة تنفيذ SQL عبر psql...\n');

    // محاولة استخدام psql
    try {
      const command = `psql "${connectionString}" -c "${cleanSql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
      const { stdout, stderr } = await execAsync(command, { env });

      if (stdout) {
        console.log('✅ النتيجة:');
        console.log(stdout);
      }
      if (stderr && !stderr.includes('NOTICE')) {
        console.log('⚠️  تحذيرات:');
        console.log(stderr);
      }

      console.log('\n✅ تم تنفيذ SQL بنجاح!');
    } catch (psqlError) {
      console.log('   ⚠️  psql غير متاح أو فشل الاتصال');
      console.log(`   خطأ: ${psqlError.message}`);
      
      // محاولة استخدام supabase CLI
      console.log('\n📝 محاولة استخدام Supabase CLI...');
      try {
        const supabaseCommand = `supabase db execute "${cleanSql}" --project-ref bojrgkiqsahuwufbkacm`;
        const { stdout, stderr } = await execAsync(supabaseCommand);

        if (stdout) {
          console.log('✅ النتيجة:');
          console.log(stdout);
        }
        if (stderr) {
          console.log('⚠️  تحذيرات:');
          console.log(stderr);
        }

        console.log('\n✅ تم تنفيذ SQL بنجاح!');
      } catch (supabaseError) {
        console.log('   ⚠️  Supabase CLI غير متاح');
        console.log(`   خطأ: ${supabaseError.message}`);
        console.log('\n⚠️  يجب تنفيذ SQL يدوياً:');
        console.log('   1. افتح Supabase Dashboard');
        console.log('   2. اذهب إلى SQL Editor');
        console.log('   3. انسخ محتوى ملف FIX_FORECAST_HISTORY_ANALYSIS.sql');
        console.log('   4. الصقه واضغط Run');
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n⚠️  يجب تنفيذ SQL يدوياً في Supabase SQL Editor');
  }
}

executeSQLViaPsql();


import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

async function executeSQLDirectly() {
  console.log('='.repeat(70));
  console.log('🔧 محاولة تنفيذ SQL مباشرة عبر Supabase API...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة ملف SQL
    const sqlFilePath = join(__dirname, 'FIX_FORECAST_HISTORY_ANALYSIS.sql');
    let sql = readFileSync(sqlFilePath, 'utf8');

    // تنظيف SQL من BEGIN/COMMIT و RAISE NOTICE
    sql = sql
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .replace(/RAISE NOTICE '.*?';/g, '')
      .replace(/--.*$/gm, '')
      .trim();

    // تقسيم SQL إلى أوامر منفصلة
    const sqlCommands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 10 && !cmd.startsWith('--'));

    console.log(`📝 تم العثور على ${sqlCommands.length} أمر SQL\n`);

    // محاولة تنفيذ كل أمر على حدة
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (!command) continue;

      console.log(`\n📝 تنفيذ الأمر ${i + 1}/${sqlCommands.length}...`);
      
      // محاولة استخدام Supabase REST API مع endpoint خاص
      try {
        // طريقة 1: استخدام PostgREST (لا يدعم CREATE FUNCTION مباشرة)
        // طريقة 2: استخدام Supabase Management API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ 
            query: command 
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ تم التنفيذ بنجاح`);
          if (data) console.log(`   📊 النتيجة:`, JSON.stringify(data, null, 2));
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  فشل التنفيذ: ${response.status}`);
          console.log(`   📄 التفاصيل: ${errorText.substring(0, 200)}`);
          
          // محاولة طريقة بديلة: استخدام Supabase Database API
          console.log(`   🔄 محاولة طريقة بديلة...`);
          await tryAlternativeMethod(command);
        }
      } catch (err) {
        console.log(`   ❌ خطأ: ${err.message}`);
        // محاولة طريقة بديلة
        await tryAlternativeMethod(command);
      }
    }

    // التحقق من نجاح التنفيذ
    console.log('\n🔍 التحقق من الدالة بعد التنفيذ...');
    await verifyFunction();

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    console.log('\n⚠️  يجب تنفيذ SQL يدوياً في Supabase SQL Editor');
    console.log('   الرابط: https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
  }
}

async function tryAlternativeMethod(sqlCommand) {
  try {
    // محاولة استخدام Supabase PostgREST مباشرة
    // لكن هذا لا يعمل مع DDL commands
    
    // بديل: استخدام Supabase Database REST API
    const dbUrl = supabaseUrl.replace('https://', 'https://api.supabase.com/v1/projects/');
    const response = await fetch(`${dbUrl}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        query: sqlCommand
      })
    });

    if (response.ok) {
      console.log(`   ✅ تم التنفيذ بنجاح (طريقة بديلة)`);
      return true;
    }
  } catch (err) {
    // لا شيء - سنحاول طريقة أخرى
  }
  
  return false;
}

async function verifyFunction() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_forecast_performance_by_month`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ الدالة تعمل بشكل صحيح!`);
      console.log(`   📊 تم جلب ${Array.isArray(data) ? data.length : 0} سجل`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ الدالة لا تزال بها خطأ`);
      console.log(`   📄 الخطأ: ${errorText.substring(0, 300)}`);
    }
  } catch (err) {
    console.log(`   ⚠️  خطأ في التحقق: ${err.message}`);
  }
}

executeSQLDirectly();

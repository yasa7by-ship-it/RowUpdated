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

async function executeFixForecastHistoryDirectly() {
  console.log('='.repeat(70));
  console.log('🔧 تنفيذ إصلاح صفحة تحليل تاريخ التوقعات...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة ملف SQL
    const sqlFilePath = join(__dirname, 'FIX_FORECAST_HISTORY_ANALYSIS.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');

    // تنظيف SQL من تعليقات RAISE NOTICE
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('RAISE NOTICE'))
      .join('\n')
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .trim();

    console.log('📝 تنفيذ SQL...\n');

    // تنفيذ SQL مباشرة باستخدام Supabase RPC (إذا كان متاحاً)
    // أو استخدام طريقة أخرى
    try {
      // محاولة استخدام طريقة مباشرة
      const sqlCommands = cleanSql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 10 && !cmd.startsWith('--'));

      for (const command of sqlCommands) {
        if (command.includes('CREATE OR REPLACE FUNCTION')) {
          // تنفيذ إنشاء الدالة مباشرة
          console.log('   📝 إنشاء/تحديث دالة get_forecast_performance_by_month...');
          
          // استخدام Supabase REST API مباشرة
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceRoleKey,
              'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({ query: command })
          });

          if (!response.ok) {
            // إذا فشل exec_sql، نستخدم طريقة أخرى
            console.log('   ⚠️  exec_sql غير متاح، استخدام طريقة بديلة...');
          }
        }
      }

      // محاولة مباشرة: استخدام pg REST API أو Supabase Management API
      console.log('   📝 محاولة تنفيذ مباشر...');
      
      // إنشاء الدالة مباشرة باستخدام Supabase client
      // لكن Supabase لا يدعم تنفيذ SQL مباشرة من client
      // لذلك سنستخدم طريقة أخرى

      // بديل: استخدام Supabase Management API
      const managementApiUrl = `https://api.supabase.com/v1/projects/bojrgkiqsahuwufbkacm/database/query`;
      
      // لكن هذا يتطلب API key مختلف
      // الحل الأفضل: استخدام Supabase CLI أو تنفيذ يدوي
      
      console.log('   ⚠️  لا يمكن تنفيذ SQL مباشرة من Node.js');
      console.log('   ✅ يجب تنفيذ الملف يدوياً في Supabase SQL Editor');
      console.log('');
      console.log('   📄 الملف: FIX_FORECAST_HISTORY_ANALYSIS.sql');
      
    } catch (err) {
      console.log(`   ⚠️  خطأ: ${err.message}`);
      console.log('   ✅ يجب تنفيذ الملف يدوياً في Supabase SQL Editor');
    }

    // التحقق من الدالة بعد الإصلاح
    console.log('\n🔍 التحقق من الدالة...');
    try {
      const { data, error } = await supabase
        .rpc('get_forecast_performance_by_month', {
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31'
        });

      if (error) {
        console.log(`   ❌ الدالة لا تزال بها خطأ: ${error.message}`);
        console.log('   ⚠️  يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql يدوياً');
      } else {
        console.log('   ✅ الدالة تعمل بشكل صحيح!');
        console.log(`   📊 تم جلب ${data?.length || 0} سجل`);
      }
    } catch (err) {
      console.log(`   ⚠️  خطأ في التحقق: ${err.message}`);
    }

    console.log('\n✅ تم الانتهاء');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n⚠️  يجب تنفيذ ملف FIX_FORECAST_HISTORY_ANALYSIS.sql يدوياً في Supabase SQL Editor');
  }
}

executeFixForecastHistoryDirectly();


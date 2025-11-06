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

async function executeFixViaSupabaseAPI() {
  console.log('='.repeat(70));
  console.log('🔧 محاولة تنفيذ SQL عبر Supabase API...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة ملف SQL
    const sqlFilePath = join(__dirname, 'FIX_FORECAST_HISTORY_ANALYSIS.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');

    // تنظيف SQL
    const cleanSql = sql
      .replace(/RAISE NOTICE '.*?';/g, '')
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .trim();

    console.log('📝 محاولة تنفيذ SQL مباشرة...\n');

    // محاولة استخدام Supabase REST API مع endpoint خاص
    // لكن Supabase لا يوفر endpoint مباشر لتنفيذ SQL
    
    // بديل: استخدام Supabase PostgREST لإرسال SQL كـ query parameter
    // لكن هذا غير مدعوم أيضاً
    
    // الحل الوحيد المتاح: استخدام Supabase Dashboard API
    // لكن هذا يتطلب API key خاص بالإدارة
    
    console.log('⚠️  Supabase لا يدعم تنفيذ SQL مباشرة من REST API');
    console.log('   لأسباب أمنية، يجب استخدام أحد الطرق التالية:');
    console.log('');
    console.log('   1. ✅ Supabase Dashboard SQL Editor (الموصى به)');
    console.log('      - افتح: https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
    console.log('      - انسخ محتوى ملف FIX_FORECAST_HISTORY_ANALYSIS.sql');
    console.log('      - الصقه واضغط Run');
    console.log('');
    console.log('   2. ✅ Supabase CLI (إذا كان مثبتاً)');
    console.log('      - supabase db execute "FIX_FORECAST_HISTORY_ANALYSIS.sql"');
    console.log('');
    console.log('   3. ✅ psql (إذا كان مثبتاً)');
    console.log('      - psql connection_string < FIX_FORECAST_HISTORY_ANALYSIS.sql');
    console.log('');

    // عرض محتوى SQL للمستخدم
    console.log('📄 محتوى SQL المطلوب تنفيذه:');
    console.log('='.repeat(70));
    console.log(cleanSql);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeFixViaSupabaseAPI();


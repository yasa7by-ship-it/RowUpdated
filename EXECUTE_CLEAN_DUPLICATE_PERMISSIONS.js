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

async function executeCleanDuplicatePermissions() {
  console.log('='.repeat(70));
  console.log('🔧 تنظيف الصلاحيات المكررة وإعادة ترتيبها...');
  console.log('='.repeat(70));
  console.log('');
  console.log('⚠️  يجب تنفيذ ملف CLEAN_DUPLICATE_PERMISSIONS_AND_ORDER.sql يدوياً في Supabase SQL Editor');
  console.log('   الرابط: https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
  console.log('');
  console.log('📄 الملف: CLEAN_DUPLICATE_PERMISSIONS_AND_ORDER.sql');
  console.log('');
  console.log('✅ تم تحديث صفحة إدارة الصلاحيات لعرض أسماء الصفحات وترتيب الصلاحيات');
  console.log('');
}

executeCleanDuplicatePermissions();



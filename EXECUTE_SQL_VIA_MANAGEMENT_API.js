import fetch from 'node-fetch';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
// للحصول على service_role key:
// 1. اذهب إلى Supabase Dashboard → Settings → API
// 2. انسخ service_role key (مخفي)
// 3. ضعه هنا
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // يجب استبداله

async function executeSQLViaManagementAPI() {
  console.log('='.repeat(70));
  console.log('🔧 محاولة تنفيذ SQL عبر Supabase Management API...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./FIX_get_latest_ranges_from_history.sql', 'utf8');
    
    // التحقق من service_role key
    if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
      console.log('❌ يجب إضافة service_role key أولاً');
      console.log('');
      console.log('📋 كيفية الحصول على service_role key:');
      console.log('1. افتح: https://supabase.com/dashboard');
      console.log('2. اختر مشروعك');
      console.log('3. اذهب إلى: Settings → API');
      console.log('4. انسخ service_role key (secret)');
      console.log('5. ضعه في الملف: EXECUTE_SQL_VIA_MANAGEMENT_API.js');
      console.log('');
      console.log('⚠️  لكن للأسف، Supabase Management API لا يدعم تنفيذ SQL مباشرة');
      console.log('📋 الحل الوحيد: تنفيذ SQL Script يدوياً في Supabase SQL Editor');
      return;
    }

    // محاولة استخدام Supabase Management API
    // لكن للأسف، Supabase لا يوفر API مباشر لتنفيذ SQL
    console.log('⚠️  Supabase Management API لا يدعم تنفيذ SQL مباشرة');
    console.log('📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor');
    console.log('');
    console.log('📄 محتوى SQL Script:');
    console.log('─'.repeat(70));
    console.log(sqlScript);
    console.log('─'.repeat(70));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeSQLViaManagementAPI();


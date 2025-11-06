import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryExecuteSQL() {
  console.log('='.repeat(70));
  console.log('🔧 محاولة تنفيذ SQL Script عبر Supabase...');
  console.log('='.repeat(70));
  console.log('');

  try {
    // قراءة SQL Script
    const sqlScript = fs.readFileSync('./FIX_get_latest_ranges_from_history.sql', 'utf8');
    
    // محاولة تنفيذ SQL عبر RPC (لن تعمل لأنها DDL)
    // لكن يمكننا التحقق من أن الدالة موجودة بعد التنفيذ
    
    console.log('📝 SQL Script جاهز');
    console.log('');
    console.log('⚠️  Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API');
    console.log('');
    console.log('✅ تم إنشاء ملف HTML لمساعدتك:');
    console.log('   📄 EXECUTE_SQL.html');
    console.log('');
    console.log('📋 الخطوات السريعة:');
    console.log('1. افتح الملف: EXECUTE_SQL.html في المتصفح');
    console.log('2. اضغط على زر "نسخ SQL Script"');
    console.log('3. اضغط على زر "فتح SQL Editor"');
    console.log('4. الصق SQL Script واضغط Run');
    console.log('');
    console.log('أو مباشرة:');
    console.log('1. افتح: https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql');
    console.log('2. انسخ والصق محتوى ملف: FIX_get_latest_ranges_from_history.sql');
    console.log('3. اضغط Run');
    console.log('');
    
    // التحقق من الدالة (قبل التنفيذ)
    console.log('🔍 التحقق من الدالة قبل التنفيذ...\n');
    const { data: beforeData, error: beforeError } = await supabase
      .rpc('get_latest_ranges_from_history');
    
    if (!beforeError && beforeData) {
      console.log('✅ الدالة موجودة بالفعل!');
      console.log(`   عدد الأسهم: ${beforeData.length}`);
    } else {
      console.log('⚠️  الدالة غير موجودة بعد');
      console.log(`   الخطأ: ${beforeError?.message || 'يجب تنفيذ SQL Script'}`);
      console.log('');
      console.log('📌 يجب تنفيذ SQL Script في Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

tryExecuteSQL();


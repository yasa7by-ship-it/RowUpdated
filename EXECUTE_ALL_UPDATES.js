// محاولة تنفيذ التحديثات عبر RPC function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeAllUpdates() {
  console.log('\n=== محاولة تنفيذ جميع التحديثات ===\n');
  
  console.log('📝 يجب تنفيذ EXECUTE_ALL_UPDATES_VIA_RPC.sql في Supabase SQL Editor أولاً');
  console.log('   لإنشاء RPC function التي ستنفذ جميع التحديثات\n');
  
  console.log('📝 بعد ذلك، يمكن استدعاء الوظيفة...');
  
  try {
    const { data, error } = await supabase.rpc('execute_evaluation_system_update');
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  الوظيفة غير موجودة بعد');
        console.log('💡 يجب تنفيذ EXECUTE_ALL_UPDATES_VIA_RPC.sql في Supabase SQL Editor أولاً\n');
      } else {
        console.error('❌ خطأ:', error.message);
      }
    } else {
      console.log('✅ تم تنفيذ جميع التحديثات بنجاح!');
      console.log('📊 النتيجة:', data);
    }
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
  
  console.log('\n📋 الملفات الجاهزة:');
  console.log('1. EXECUTE_UPDATE_EVALUATION_SYSTEM.sql - سكريبت شامل (الأفضل)');
  console.log('2. EXECUTE_ALL_UPDATES_VIA_RPC.sql - RPC function شاملة');
  console.log('\n💡 الطريقة الأسهل:');
  console.log('   - افتح EXECUTE_UPDATE_EVALUATION_SYSTEM.sql');
  console.log('   - انسخ المحتوى');
  console.log('   - الصقه في Supabase SQL Editor');
  console.log('   - اضغط Run');
}

executeAllUpdates().catch(console.error);


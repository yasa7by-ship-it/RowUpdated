// محاولة تنفيذ التحديثات عبر RPC
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeUpdates() {
  console.log('\n=== محاولة تنفيذ التحديثات ===\n');
  
  // محاولة استدعاء RPC function
  try {
    console.log('📝 محاولة استدعاء execute_sql_update...');
    const { data, error } = await supabase.rpc('execute_sql_update');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  الوظيفة execute_sql_update غير موجودة');
        console.log('📋 يجب تنفيذ CREATE_EXECUTE_FUNCTION.sql في Supabase SQL Editor أولاً\n');
        console.log('💡 أو يمكنك تنفيذ EXECUTE_ALL_UPDATES.sql مباشرة في Supabase SQL Editor\n');
        return;
      }
      console.error('❌ خطأ:', error.message);
      return;
    }
    
    console.log('✅', data);
    console.log('\n✅ تم تنفيذ جميع التحديثات بنجاح!');
    
  } catch (err) {
    console.log('⚠️  لا يمكن استدعاء الوظيفة:', err.message);
    console.log('\n📋 يجب تنفيذ EXECUTE_ALL_UPDATES.sql في Supabase SQL Editor');
    console.log('🔗 https://supabase.com/dashboard/project/bojrgkiqsahuwufbkacm/sql/new\n');
  }
}

executeUpdates().catch(console.error);

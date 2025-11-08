// Script to execute updates via RPC functions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeUpdates() {
  console.log('\n=== تنفيذ التحديثات ===\n');
  
  // Step 1: Create update functions first (must be done in SQL Editor)
  console.log('⚠️  يجب تنفيذ CREATE_UPDATE_FUNCTIONS.sql أولاً في Supabase SQL Editor\n');
  console.log('بعد ذلك، سيتم تنفيذ التحديثات تلقائياً...\n');
  
  // Step 2: Try to call update functions
  try {
    console.log('📝 محاولة تحديث الوظيفة...');
    const { data: funcResult, error: funcError } = await supabase.rpc('update_evaluate_function');
    
    if (funcError) {
      if (funcError.message.includes('function') && funcError.message.includes('does not exist')) {
        console.log('⚠️  الوظيفة update_evaluate_function غير موجودة');
        console.log('📋 يجب تنفيذ CREATE_UPDATE_FUNCTIONS.sql في Supabase SQL Editor أولاً\n');
        return;
      }
      console.error('❌ خطأ:', funcError.message);
    } else {
      console.log('✅', funcResult);
    }
  } catch (err) {
    console.log('⚠️  لا يمكن استدعاء الوظيفة:', err.message);
    console.log('📋 يجب تنفيذ CREATE_UPDATE_FUNCTIONS.sql في Supabase SQL Editor\n');
  }
  
  try {
    console.log('\n📝 محاولة إضافة الترجمات...');
    const { data: transResult, error: transError } = await supabase.rpc('add_evaluation_translations');
    
    if (transError) {
      if (transError.message.includes('function') && transError.message.includes('does not exist')) {
        console.log('⚠️  الوظيفة add_evaluation_translations غير موجودة');
        console.log('📋 يجب تنفيذ CREATE_UPDATE_FUNCTIONS.sql في Supabase SQL Editor أولاً\n');
        return;
      }
      console.error('❌ خطأ:', transError.message);
    } else {
      console.log('✅', transResult);
    }
  } catch (err) {
    console.log('⚠️  لا يمكن استدعاء الوظيفة:', err.message);
    console.log('📋 يجب تنفيذ CREATE_UPDATE_FUNCTIONS.sql في Supabase SQL Editor\n');
  }
  
  console.log('\n✅ اكتملت العملية');
}

executeUpdates().catch(console.error);


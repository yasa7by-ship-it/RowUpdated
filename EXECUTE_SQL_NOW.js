// تنفيذ SQL مباشرة باستخدام service role key
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLUpdates() {
  console.log('\n=== تنفيذ SQL مباشرة ===\n');
  
  try {
    // قراءة ملف SQL
    const sqlContent = readFileSync('EXECUTE_ALL_UPDATES.sql', 'utf-8');
    
    // تقسيم SQL إلى أجزاء (كل جزء بين BEGIN و COMMIT)
    const sqlParts = sqlContent.split('COMMIT;').filter(part => part.trim().length > 0);
    
    console.log(`📝 تم العثور على ${sqlParts.length} جزء SQL\n`);
    
    // تنفيذ كل جزء
    for (let i = 0; i < sqlParts.length; i++) {
      const sql = sqlParts[i].trim() + ' COMMIT;';
      console.log(`🔄 تنفيذ الجزء ${i + 1}...`);
      
      try {
        // استخدام RPC لتنفيذ SQL مباشرة
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // إذا فشل RPC، جرب طريقة أخرى
          console.log('⚠️  RPC فشل، جرب طريقة أخرى...');
          
          // محاولة استخدام REST API مباشرة
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceRoleKey,
              'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({ sql_query: sql })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
          
          console.log(`✅ تم تنفيذ الجزء ${i + 1}`);
        } else {
          console.log(`✅ تم تنفيذ الجزء ${i + 1}`);
        }
      } catch (err) {
        console.error(`❌ خطأ في الجزء ${i + 1}:`, err.message);
        // استمر في التنفيذ
      }
    }
    
    console.log('\n✅ اكتمل التنفيذ!');
    
  } catch (err) {
    console.error('❌ خطأ عام:', err.message);
    console.log('\n💡 سيتم استخدام طريقة بديلة...\n');
    
    // طريقة بديلة: تنفيذ SQL عبر RPC function
    await executeViaRPC();
  }
}

async function executeViaRPC() {
  console.log('📝 محاولة تنفيذ SQL عبر RPC functions...\n');
  
  // تحديث الوظيفة أولاً
  try {
    console.log('1️⃣ تحديث وظيفة evaluate_and_save_forecasts...');
    
    // قراءة SQL
    const sqlContent = readFileSync('UPDATE_EVALUATE_FUNCTION.sql', 'utf-8');
    
    // استخدام Supabase REST API لتنفيذ SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({ sql_query: sqlContent })
    });
    
    if (response.ok) {
      console.log('✅ تم تحديث الوظيفة');
    } else {
      console.log('⚠️  لا يمكن تنفيذ SQL مباشرة عبر REST API');
      console.log('📋 يجب تنفيذ EXECUTE_ALL_UPDATES.sql في Supabase SQL Editor');
    }
  } catch (err) {
    console.log('⚠️  خطأ:', err.message);
    console.log('📋 يجب تنفيذ EXECUTE_ALL_UPDATES.sql في Supabase SQL Editor');
  }
  
  // إضافة الترجمات
  try {
    console.log('\n2️⃣ إضافة الترجمات...');
    
    const translations = [
      { lang_id: 'en', key: 'last_run_stats', value: 'Last Run Statistics' },
      { lang_id: 'ar', key: 'last_run_stats', value: 'إحصائيات آخر تشغيل' },
      { lang_id: 'en', key: 'forecasts_processed', value: 'Forecasts Processed' },
      { lang_id: 'ar', key: 'forecasts_processed', value: 'عدد التوقعات المفحوصة' },
      { lang_id: 'en', key: 'stocks_processed', value: 'Stocks Processed' },
      { lang_id: 'ar', key: 'stocks_processed', value: 'عدد الأسهم المفحوصة' },
      { lang_id: 'en', key: 'last_run_time', value: 'Last Run Time' },
      { lang_id: 'ar', key: 'last_run_time', value: 'آخر مرة تم التشغيل' },
      { lang_id: 'en', key: 'running', value: 'Running...' },
      { lang_id: 'ar', key: 'running', value: 'جاري التشغيل...' }
    ];
    
    for (const trans of translations) {
      const { error } = await supabase
        .from('translations')
        .upsert(trans, { onConflict: 'lang_id,key' });
      
      if (error) {
        console.error(`❌ خطأ في ${trans.key}:`, error.message);
      } else {
        console.log(`✅ ${trans.key} (${trans.lang_id})`);
      }
    }
    
    console.log('\n✅ تمت إضافة جميع الترجمات!');
    
  } catch (err) {
    console.error('❌ خطأ في إضافة الترجمات:', err.message);
  }
}

// تنفيذ مباشر
executeSQLUpdates().catch(() => {
  // إذا فشل، جرب الطريقة البديلة
  executeViaRPC().catch(console.error);
});


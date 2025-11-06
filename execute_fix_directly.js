import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLDirectly() {
  console.log('🔧 محاولة تنفيذ SQL مباشرة...\n');

  try {
    // قراءة SQL script
    const sqlScript = fs.readFileSync('./FIX_get_daily_checklist_use_stocks_date.sql', 'utf8');
    
    // تقسيم SQL إلى أوامر منفصلة (إزالة BEGIN/COMMIT و RAISE NOTICE)
    const cleanSQL = sqlScript
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .replace(/RAISE NOTICE[^;]*;/g, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 تم قراءة ${cleanSQL.length} أمر SQL\n`);

    // تنفيذ كل أمر على حدة
    for (let i = 0; i < cleanSQL.length; i++) {
      const sql = cleanSQL[i];
      if (sql.includes('DROP VIEW') || sql.includes('CREATE VIEW') || sql.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`⏳ تنفيذ الأمر ${i + 1}/${cleanSQL.length}...`);
        
        try {
          // استخدام Supabase REST API لتنفيذ SQL
          // لكن Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API
          // لذلك سنستخدم طريقة أخرى
          
          // محاولة استخدام rpc إذا كان هناك دالة متاحة
          // لكن أفضل طريقة هي تنفيذ SQL مباشرة في Supabase Dashboard
          
          console.log(`   ⚠️ لا يمكن تنفيذ SQL مباشرة عبر REST API`);
          break;
        } catch (err) {
          console.log(`   ❌ خطأ: ${err.message}`);
        }
      }
    }

    console.log('\n📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor:');
    console.log('\n' + '═'.repeat(70));
    console.log('الخطوات:');
    console.log('1. افتح Supabase Dashboard');
    console.log('2. اذهب إلى SQL Editor');
    console.log('3. انسخ والصق محتوى الملف: FIX_get_daily_checklist_use_stocks_date.sql');
    console.log('4. اضغط Run');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

// بدلاً من ذلك، سأستخدم طريقة أخرى - محاولة تنفيذ SQL عبر psql
async function tryExecuteViaRPC() {
  console.log('🔧 محاولة تنفيذ SQL عبر RPC...\n');

  // قراءة SQL
  const sqlScript = fs.readFileSync('./FIX_get_daily_checklist_use_stocks_date.sql', 'utf8');

  // محاولة تنفيذ كل جزء على حدة
  const parts = [
    'DROP VIEW IF EXISTS public.vw_Last_dayCheckList CASCADE;',
    `CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fch.stock_symbol,
  s.name AS stock_name,
  s.last_updated::date AS forecast_date,
  s.price,
  fch.actual_low,
  fch.actual_high,
  fch.predicted_lo,
  fch.predicted_hi,
  fch.hit_range AS is_hit,
  fch.forecast_date AS original_forecast_date
FROM public.forecast_check_history AS fch
JOIN public.stocks AS s ON s.symbol = fch.stock_symbol
ORDER BY s.symbol;`,
    `CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_work_date DATE;
BEGIN
  SELECT max(last_updated::date) INTO v_last_work_date
  FROM public.stocks
  WHERE last_updated IS NOT NULL;
  
  IF v_last_work_date IS NULL THEN
    SELECT max(forecast_date) INTO v_last_work_date
    FROM public.forecast_check_history;
  END IF;
  
  RETURN QUERY
  SELECT 
    fch.stock_symbol,
    s.name AS stock_name,
    v_last_work_date AS forecast_date,
    s.price,
    fch.actual_low,
    fch.actual_high,
    fch.predicted_lo,
    fch.predicted_hi,
    fch.hit_range AS is_hit,
    fch.forecast_date AS original_forecast_date
  FROM public.forecast_check_history fch
  JOIN public.stocks s ON s.symbol = fch.stock_symbol
  WHERE s.last_updated::date = v_last_work_date
    AND fch.forecast_date = v_last_work_date
  ORDER BY s.symbol;
END;
$$;`
  ];

  console.log('⚠️ Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API');
  console.log('📝 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor\n');
  
  console.log('📄 محتوى SQL Script:');
  console.log('═'.repeat(70));
  console.log(sqlScript);
  console.log('═'.repeat(70));
}

// تنفيذ
tryExecuteViaRPC();


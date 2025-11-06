import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL script to fix the function
const sqlScript = `
BEGIN;

-- 1. إسقاط الـ View القديم
DROP VIEW IF EXISTS public.vw_Last_dayCheckList CASCADE;

-- 2. إنشاء View جديد يستخدم forecast_check_history مباشرة
CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fch.stock_symbol,
  s.name AS stock_name,
  s.last_updated,
  s.price,
  fch.actual_low,
  fch.actual_high,
  fch.predicted_lo,
  fch.predicted_hi,
  fch.hit_range AS is_hit,
  fch.forecast_date
FROM public.forecast_check_history AS fch
JOIN public.stocks AS s
  ON s.symbol = fch.stock_symbol
ORDER BY fch.stock_symbol;

-- 3. إعادة إنشاء دالة get_daily_checklist
CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE sql STABLE
AS $$
  WITH latest_date AS (
    SELECT max(forecast_date) AS value 
    FROM public.forecast_check_history
  )
  SELECT * 
  FROM public.vw_Last_dayCheckList
  WHERE forecast_date = (SELECT value FROM latest_date)
  ORDER BY stock_symbol;
$$;

COMMIT;
`;

async function executeFix() {
  console.log('🔧 تنفيذ إصلاح دالة get_daily_checklist...\n');

  try {
    // استخدام Supabase REST API لتنفيذ SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql: sqlScript }),
    });

    if (!response.ok) {
      // إذا لم تكن هناك دالة exec_sql، سنستخدم طريقة أخرى
      console.log('⚠️ لا يمكن تنفيذ SQL مباشرة عبر REST API');
      console.log('📝 يجب تنفيذ السكربت يدوياً في Supabase SQL Editor:');
      console.log('\n' + sqlScript);
      console.log('\n📄 أو استخدم الملف: FIX_get_daily_checklist_use_history.sql');
      return;
    }

    const result = await response.json();
    console.log('✅ تم تنفيذ الإصلاح بنجاح');
    console.log(result);

  } catch (error) {
    console.log('⚠️ لا يمكن تنفيذ SQL مباشرة');
    console.log('📝 يجب تنفيذ السكربت يدوياً في Supabase SQL Editor');
    console.log('\n📄 استخدم الملف: FIX_get_daily_checklist_use_history.sql');
    console.log('\nأو انسخ والصق هذا SQL في Supabase SQL Editor:\n');
    console.log(sqlScript);
  }
}

executeFix();


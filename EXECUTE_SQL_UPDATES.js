// Script to execute SQL updates via Supabase
// Note: This requires executing SQL in Supabase SQL Editor due to RLS restrictions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL scripts
const updateFunctionSQL = `-- تحديث وظيفة evaluate_and_save_forecasts
BEGIN;

CREATE OR REPLACE FUNCTION public.evaluate_and_save_forecasts(p_date_filter date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    processed_count integer;
    stocks_count integer;
    result_json json;
BEGIN
    WITH new_evaluations AS (
        SELECT
            f.stock_symbol,
            s.name AS stock_name,
            f.forecast_date,
            f.predicted_price,
            f.predicted_lo,
            f.predicted_hi,
            f.confidence,
            h.low AS actual_low,
            h.high AS actual_high,
            h.close AS actual_close,
            (f.predicted_lo <= h.high AND h.low <= f.predicted_hi) AS hit_range,
            ABS(f.predicted_price - h.close) AS abs_error,
            ABS(f.predicted_price - h.close) / NULLIF(h.close, 0) AS pct_error
        FROM
            public.forecasts f
        JOIN
            public.stocks s ON f.stock_symbol = s.symbol
        JOIN
            public.historical_data h ON f.stock_symbol = h.stock_symbol AND f.forecast_date = h.date
        WHERE (p_date_filter IS NULL OR f.forecast_date = p_date_filter)
    ),
    insert_history AS (
        INSERT INTO public.forecast_check_history (
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        )
        SELECT
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        FROM new_evaluations
        ON CONFLICT (stock_symbol, forecast_date) DO UPDATE SET
            predicted_price = EXCLUDED.predicted_price,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            actual_close = EXCLUDED.actual_close,
            hit_range = EXCLUDED.hit_range,
            abs_error = EXCLUDED.abs_error,
            pct_error = EXCLUDED.pct_error,
            confidence = EXCLUDED.confidence,
            created_at = NOW()
        RETURNING 1
    ),
    upsert_latest AS (
        INSERT INTO public.forecast_check_latest (
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        )
        SELECT DISTINCT ON (stock_symbol)
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        FROM new_evaluations
        ORDER BY stock_symbol, forecast_date DESC
        ON CONFLICT (stock_symbol) DO UPDATE SET
            forecast_date = EXCLUDED.forecast_date,
            predicted_price = EXCLUDED.predicted_price,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            actual_close = EXCLUDED.actual_close,
            hit_range = EXCLUDED.hit_range,
            abs_error = EXCLUDED.abs_error,
            pct_error = EXCLUDED.pct_error,
            confidence = EXCLUDED.confidence,
            created_at = NOW()
    ),
    insert_legacy AS (
        INSERT INTO public."Forcast_Result" (
            stock_symbol, stock_name, forecast_date, predicted_lo, predicted_hi,
            actual_low, actual_high, is_hit
        )
        SELECT
            stock_symbol, stock_name, forecast_date, predicted_lo, predicted_hi,
            actual_low, actual_high, hit_range
        FROM new_evaluations
        ON CONFLICT (stock_symbol, forecast_date) DO UPDATE SET
            stock_name = EXCLUDED.stock_name,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            is_hit = EXCLUDED.is_hit,
            created_at = NOW()
    ),
    count_stats AS (
        SELECT 
            COUNT(*) AS forecast_count,
            COUNT(DISTINCT stock_symbol) AS stock_count
        FROM new_evaluations
    )
    SELECT 
        forecast_count,
        stock_count
    INTO processed_count, stocks_count
    FROM count_stats;
    
    result_json := json_build_object(
        'forecasts_processed', COALESCE(processed_count, 0),
        'stocks_processed', COALESCE(stocks_count, 0),
        'execution_time', NOW()
    );
    
    RAISE NOTICE '% forecast(s) evaluated for % stock(s).', processed_count, stocks_count;
    
    RETURN result_json;
END;
$$;

COMMIT;`;

const addTranslationsSQL = `-- إضافة الترجمات
BEGIN;

ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'last_run_stats', 'Last Run Statistics'),
('ar', 'last_run_stats', 'إحصائيات آخر تشغيل'),
('en', 'forecasts_processed', 'Forecasts Processed'),
('ar', 'forecasts_processed', 'عدد التوقعات المفحوصة'),
('en', 'stocks_processed', 'Stocks Processed'),
('ar', 'stocks_processed', 'عدد الأسهم المفحوصة'),
('en', 'last_run_time', 'Last Run Time'),
('ar', 'last_run_time', 'آخر مرة تم التشغيل'),
('en', 'running', 'Running...'),
('ar', 'running', 'جاري التشغيل...')
ON CONFLICT (lang_id, key) 
DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;`;

console.log('\n=== محاولة تنفيذ SQL عبر Supabase ===\n');
console.log('⚠️  ملاحظة: بسبب RLS، يجب تنفيذ SQL في Supabase SQL Editor');
console.log('📋 تم حفظ SQL في الملفات التالية:\n');
console.log('1. UPDATE_EVALUATE_FUNCTION.sql - تحديث الوظيفة');
console.log('2. ADD_EVALUATION_STATS_TRANSLATIONS.sql - إضافة الترجمات\n');

console.log('💡 يرجى فتح Supabase SQL Editor وتنفيذ الملفات بالترتيب:\n');
console.log('الخطوة 1: انسخ محتوى UPDATE_EVALUATE_FUNCTION.sql');
console.log('الخطوة 2: الصقه في SQL Editor واضغط Run');
console.log('الخطوة 3: انسخ محتوى ADD_EVALUATION_STATS_TRANSLATIONS.sql');
console.log('الخطوة 4: الصقه في SQL Editor واضغط Run\n');

// محاولة التحقق من الوظيفة الحالية
async function checkCurrentFunction() {
  console.log('=== التحقق من الوظيفة الحالية ===\n');
  
  try {
    // محاولة استدعاء الوظيفة لمعرفة نوع الإرجاع
    const { data, error } = await supabase.rpc('evaluate_and_save_forecasts', { p_date_filter: null });
    
    if (error) {
      console.log('⚠️  خطأ في استدعاء الوظيفة:', error.message);
      console.log('هذا طبيعي إذا كانت الوظيفة لم يتم تحديثها بعد.\n');
    } else {
      console.log('✅ الوظيفة موجودة وتعمل');
      if (typeof data === 'object' && data !== null) {
        console.log('✅ الوظيفة ترجع JSON (محدثة)');
        console.log('البيانات:', JSON.stringify(data, null, 2));
      } else {
        console.log('⚠️  الوظيفة ترجع عدد فقط (تحتاج تحديث)');
      }
    }
  } catch (err) {
    console.log('⚠️  لا يمكن التحقق من الوظيفة:', err.message);
  }
}

checkCurrentFunction();

// حفظ SQL في ملفات
const fs = require('fs');
fs.writeFileSync('UPDATE_EVALUATE_FUNCTION.sql', updateFunctionSQL);
fs.writeFileSync('ADD_EVALUATION_STATS_TRANSLATIONS.sql', addTranslationsSQL);
console.log('\n✅ تم حفظ SQL في الملفات');


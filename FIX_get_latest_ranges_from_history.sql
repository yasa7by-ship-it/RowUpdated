-- ============================================
-- إصلاح جلب بيانات النطاق الفعلي والنطاق المتوقع من forecast_check_history
-- ============================================
-- 
-- الغرض: إنشاء دالة RPC جديدة تجلب أحدث نطاق سعر فعلي ومتوقع لكل سهم
-- مباشرة من جدول forecast_check_history
-- ============================================

BEGIN;

-- إنشاء دالة جديدة تجلب أحدث نطاق لكل سهم من forecast_check_history
CREATE OR REPLACE FUNCTION public.get_latest_ranges_from_history()
RETURNS TABLE (
  stock_symbol TEXT,
  stock_name TEXT,
  forecast_date DATE,
  actual_low DOUBLE PRECISION,
  actual_high DOUBLE PRECISION,
  predicted_lo DOUBLE PRECISION,
  predicted_hi DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH latest_forecasts AS (
    -- الحصول على أحدث تاريخ لكل سهم
    SELECT 
      fch.stock_symbol,
      MAX(fch.forecast_date) AS latest_date
    FROM public.forecast_check_history fch
    WHERE fch.actual_low IS NOT NULL 
      AND fch.actual_high IS NOT NULL
      AND fch.predicted_lo IS NOT NULL
      AND fch.predicted_hi IS NOT NULL
    GROUP BY fch.stock_symbol
  )
  SELECT DISTINCT ON (fch.stock_symbol)
    fch.stock_symbol,
    COALESCE(s.name, fch.stock_symbol) AS stock_name,
    fch.forecast_date,
    fch.actual_low,
    fch.actual_high,
    fch.predicted_lo,
    fch.predicted_hi
  FROM public.forecast_check_history fch
  JOIN latest_forecasts lf 
    ON fch.stock_symbol = lf.stock_symbol 
    AND fch.forecast_date = lf.latest_date
  LEFT JOIN public.stocks s 
    ON s.symbol = fch.stock_symbol
  WHERE fch.actual_low IS NOT NULL 
    AND fch.actual_high IS NOT NULL
    AND fch.predicted_lo IS NOT NULL
    AND fch.predicted_hi IS NOT NULL
  ORDER BY fch.stock_symbol, fch.forecast_date DESC, fch.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_latest_ranges_from_history IS 'Returns the latest actual and forecast ranges for each stock from forecast_check_history';

COMMIT;


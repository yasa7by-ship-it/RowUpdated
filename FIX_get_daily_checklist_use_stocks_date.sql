-- ============================================
-- إصلاح دالة get_daily_checklist لاستخدام تاريخ آخر يوم عمل من جدول stocks
-- ============================================
-- 
-- التوضيح من المستخدم:
-- 1. تاريخ آخر يوم عمل = تاريخ تحديث السجل في جدول stocks (stocks.last_updated)
-- 2. سعر الإغلاق = سعر إغلاق آخر يوم عمل (stocks.price)
-- 
-- لذلك يجب:
-- - أخذ آخر تاريخ من stocks.last_updated
-- - عرض التوقعات التي لها نفس هذا التاريخ
-- ============================================

BEGIN;

-- 1. إسقاط الـ View القديم
DROP VIEW IF EXISTS public.vw_Last_dayCheckList CASCADE;
RAISE NOTICE 'INFO: تم إسقاط الـ View القديم';

-- 2. إنشاء View جديد يستخدم stocks.last_updated كتاريخ آخر يوم عمل
CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fch.stock_symbol,
  s.name AS stock_name,
  s.last_updated::date AS forecast_date,  -- تاريخ آخر يوم عمل من stocks (كتاريخ فقط)
  s.price,  -- سعر الإغلاق لآخر يوم عمل
  fch.actual_low,
  fch.actual_high,
  fch.predicted_lo,
  fch.predicted_hi,
  fch.hit_range AS is_hit,
  fch.forecast_date AS original_forecast_date  -- تاريخ التوقع الأصلي (للرجوع)
FROM public.forecast_check_history AS fch
JOIN public.stocks AS s
  ON s.symbol = fch.stock_symbol
ORDER BY s.symbol;

RAISE NOTICE 'SUCCESS: تم إنشاء الـ View الجديد';

-- 3. إعادة إنشاء دالة get_daily_checklist
-- تأخذ آخر تاريخ من stocks.last_updated
CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_work_date DATE;
BEGIN
  -- الحصول على آخر تاريخ تحديث من جدول stocks (هذا هو آخر يوم عمل)
  SELECT max(last_updated::date) INTO v_last_work_date
  FROM public.stocks
  WHERE last_updated IS NOT NULL;
  
  -- إذا لم يوجد تاريخ، نرجع آخر تاريخ من forecast_check_history كبديل
  IF v_last_work_date IS NULL THEN
    SELECT max(forecast_date) INTO v_last_work_date
    FROM public.forecast_check_history;
  END IF;
  
  -- إرجاع البيانات لآخر يوم عمل
  -- نستخدم التوقعات التي لها نفس تاريخ آخر يوم عمل
  RETURN QUERY
  SELECT 
    fch.stock_symbol,
    s.name AS stock_name,
    v_last_work_date AS forecast_date,  -- تاريخ آخر يوم عمل من stocks
    s.price,  -- سعر الإغلاق لآخر يوم عمل
    fch.actual_low,
    fch.actual_high,
    fch.predicted_lo,
    fch.predicted_hi,
    fch.hit_range AS is_hit,
    fch.forecast_date AS original_forecast_date
  FROM public.forecast_check_history fch
  JOIN public.stocks s ON s.symbol = fch.stock_symbol
  WHERE s.last_updated::date = v_last_work_date
    AND fch.forecast_date = v_last_work_date  -- فقط التوقعات التي لها نفس تاريخ آخر يوم عمل
  ORDER BY s.symbol;
END;
$$;

RAISE NOTICE 'SUCCESS: تم تحديث دالة get_daily_checklist لاستخدام stocks.last_updated';

COMMIT;

-- ============================================
-- التحقق من الدالة
-- ============================================
-- للتحقق من آخر تاريخ عمل:
-- SELECT max(last_updated::date) FROM public.stocks WHERE last_updated IS NOT NULL;
-- 
-- للتحقق من البيانات:
-- SELECT * FROM public.get_daily_checklist() LIMIT 10;
-- ============================================


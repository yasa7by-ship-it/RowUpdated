-- ============================================
-- إصلاح دالة get_daily_checklist لاستخدام forecast_check_history
-- ============================================
-- 
-- المشكلة: الدالة الحالية تستخدم forecast_check_latest
-- الحل: يجب أن تستخدم forecast_check_history مباشرة
-- لأن آخر يوم توقع هو أحدث سجل في forecast_check_history
--
-- ============================================

BEGIN;

-- 1. إسقاط الـ View القديم إذا كان موجوداً
DROP VIEW IF EXISTS public.vw_Last_dayCheckList CASCADE;
RAISE NOTICE 'INFO: تم إسقاط الـ View القديم';

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

RAISE NOTICE 'SUCCESS: تم إنشاء الـ View الجديد من forecast_check_history';

-- 3. إعادة إنشاء دالة get_daily_checklist
-- تأخذ آخر تاريخ من forecast_check_history مباشرة
CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE sql STABLE
AS $$
  WITH latest_date AS (
    -- آخر تاريخ في forecast_check_history (المصدر الصحيح)
    SELECT max(forecast_date) AS value 
    FROM public.forecast_check_history
  )
  SELECT * 
  FROM public.vw_Last_dayCheckList
  WHERE forecast_date = (SELECT value FROM latest_date)
  ORDER BY stock_symbol;
$$;

RAISE NOTICE 'SUCCESS: تم تحديث دالة get_daily_checklist لاستخدام forecast_check_history';

COMMIT;

-- ============================================
-- التحقق من الدالة
-- ============================================
-- يمكنك تشغيل هذا الاستعلام للتحقق:
-- SELECT * FROM public.get_daily_checklist() LIMIT 10;
-- 
-- أو للتحقق من آخر تاريخ:
-- SELECT max(forecast_date) FROM public.forecast_check_history;
-- ============================================


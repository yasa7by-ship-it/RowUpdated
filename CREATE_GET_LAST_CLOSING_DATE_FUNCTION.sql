-- ============================================
-- إنشاء دالة لجلب تاريخ آخر إغلاق من جدول stocks
-- ============================================
-- هذه الدالة ترجع آخر تاريخ إغلاق من جدول stocks.last_updated
-- ============================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_last_closing_date()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT MAX(last_updated::date)
  FROM public.stocks
  WHERE last_updated IS NOT NULL;
$$;

COMMIT;

-- ============================================
-- التحقق من الدالة
-- ============================================
-- للتحقق من آخر تاريخ إغلاق:
-- SELECT public.get_last_closing_date();
-- ============================================


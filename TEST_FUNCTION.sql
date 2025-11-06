-- #############################################################################
-- # اختبار وظيفة evaluate_and_save_forecasts للتأكد من أنها تعمل بشكل صحيح
-- # تنفيذ مباشر في Supabase SQL Editor
-- #############################################################################

-- اختبار الوظيفة
SELECT public.evaluate_and_save_forecasts(NULL) AS test_result;

-- أو اختبار مع تاريخ محدد (اختياري)
-- SELECT public.evaluate_and_save_forecasts('2025-01-15'::date) AS test_result;


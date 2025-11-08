-- #############################################################################
-- # إضافة ترجمات لإحصائيات آخر تشغيل
-- #############################################################################

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

COMMIT;


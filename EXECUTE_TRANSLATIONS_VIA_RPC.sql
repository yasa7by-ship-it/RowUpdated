-- #############################################################################
-- # إنشاء RPC function لتنفيذ SQL مباشرة
-- #############################################################################

BEGIN;

-- إنشاء وظيفة لإضافة الترجمات
CREATE OR REPLACE FUNCTION public.add_evaluation_translations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- تعطيل RLS مؤقتاً
    ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;
    
    -- إضافة الترجمات
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
    
    -- إعادة تفعيل RLS
    ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
END;
$$;

COMMIT;

-- استدعاء الوظيفة
SELECT public.add_evaluation_translations();

-- التحقق
SELECT key, lang_id, value FROM public.translations 
WHERE key IN ('last_run_stats', 'forecasts_processed', 'stocks_processed', 'last_run_time', 'running')
ORDER BY key, lang_id;


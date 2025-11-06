-- إصلاح ترجمة "forecasts_for"
-- هذا الملف يمكن تشغيله مباشرة في Supabase SQL Editor

BEGIN;

-- Temporarily disable RLS to update system data
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- Add the missing translation for English and Arabic.
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'forecasts_for', 'Forecasts for'),
('ar', 'forecasts_for', 'توقعات ليوم')
ON CONFLICT (lang_id, key) 
DO UPDATE SET value = EXCLUDED.value;

-- Re-enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;









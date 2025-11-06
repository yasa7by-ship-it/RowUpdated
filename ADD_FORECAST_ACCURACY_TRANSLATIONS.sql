-- ============================================
-- إضافة الترجمات المفقودة لصفحة دقة التوقعات
-- ============================================
-- 
-- الغرض: إضافة ترجمات للكلمات الإنجليزية في صفحة دقة التوقعات
-- خاصة: stock_performance_table وغيرها
-- ============================================

BEGIN;

-- تعطيل RLS مؤقتاً لإضافة الترجمات
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- إضافة الترجمات المطلوبة (فقط المفقودة)
INSERT INTO public.translations (lang_id, key, value) VALUES
-- ترجمة stock_performance_table (المفقودة)
('en', 'stock_performance_table', 'Stock Performance Table'),
('ar', 'stock_performance_table', 'جدول أداء الأسهم')

ON CONFLICT (lang_id, key) 
DO UPDATE SET value = EXCLUDED.value;

-- إعادة تفعيل RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;

RAISE NOTICE 'SUCCESS: تم إضافة الترجمات المطلوبة لصفحة دقة التوقعات';


-- ============================================
-- إضافة ترجمات فلاتر إدارة المستخدمين
-- ============================================

BEGIN;

ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'search', 'Search'),
('ar', 'search', 'بحث'),
('en', 'all_roles', 'All Roles'),
('ar', 'all_roles', 'جميع الصلاحيات'),
('en', 'all_statuses', 'All Statuses'),
('ar', 'all_statuses', 'جميع الحالات'),
('en', 'results', 'Results'),
('ar', 'results', 'النتائج'),
('en', 'page', 'Page'),
('ar', 'page', 'صفحة'),
('en', 'of', 'of'),
('ar', 'of', 'من'),
('en', 'no_users_match_filters', 'No users match the selected filters'),
('ar', 'no_users_match_filters', 'لا توجد مستخدمين يطابقون الفلاتر المختارة')
ON CONFLICT (lang_id, key)
DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;



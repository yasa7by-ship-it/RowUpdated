-- ============================================
-- إضافة الترجمات المفقودة لصفحة إدارة الصلاحيات
-- ============================================
-- 
-- الغرض: إضافة ترجمات للصلاحيات والأدوار والأزرار في صفحة إدارة الصلاحيات
-- ============================================

BEGIN;

-- تعطيل RLS مؤقتاً لإضافة الترجمات
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- إضافة الترجمات المطلوبة
INSERT INTO public.translations (lang_id, key, value) VALUES
-- ترجمات عامة للجدول
('en', 'permission_name', 'Permission Name'),
('ar', 'permission_name', 'اسم الصلاحية'),
('en', 'description', 'Description'),
('ar', 'description', 'الوصف'),
('en', 'status', 'Status'),
('ar', 'status', 'الحالة'),
('en', 'enabled', 'Enabled'),
('ar', 'enabled', 'مفعل'),
('en', 'disabled', 'Disabled'),
('ar', 'disabled', 'معطل'),

-- ترجمات الأدوار
('en', 'role_admin', 'Admin'),
('ar', 'role_admin', 'مدير'),
('en', 'role_admin_desc', 'Full system access with all permissions.'),
('ar', 'role_admin_desc', 'وصول كامل للنظام مع جميع الصلاحيات.'),

('en', 'role_supervisor', 'Supervisor'),
('ar', 'role_supervisor', 'مشرف'),
('en', 'role_supervisor_desc', 'Can monitor and manage users with limited administrative access.'),
('ar', 'role_supervisor_desc', 'يمكنه مراقبة وإدارة المستخدمين مع وصول إداري محدود.'),

('en', 'role_user', 'User'),
('ar', 'role_user', 'مستخدم'),
('en', 'role_user_desc', 'Standard user with read-only access to most features.'),
('ar', 'role_user_desc', 'مستخدم قياسي مع وصول للقراءة فقط لمعظم الميزات.'),

-- ترجمات الصلاحيات المفقودة (مثال على الصلاحيات التي قد تكون مفقودة)
('en', 'perm_view_forecast_accuracy', 'View Forecast Accuracy'),
('ar', 'perm_view_forecast_accuracy', 'عرض دقة التوقعات'),
('en', 'perm_view_forecast_accuracy_desc', 'Can view forecast accuracy analysis and statistics.'),
('ar', 'perm_view_forecast_accuracy_desc', 'يمكنه عرض تحليل دقة التوقعات والإحصائيات.'),

('en', 'perm_view_forecast_history_analysis', 'View Forecast History Analysis'),
('ar', 'perm_view_forecast_history_analysis', 'عرض تحليل تاريخ التوقعات'),
('en', 'perm_view_forecast_history_analysis_desc', 'Can view historical forecast analysis and trends.'),
('ar', 'perm_view_forecast_history_analysis_desc', 'يمكنه عرض تحليل التوقعات التاريخية والاتجاهات.')

ON CONFLICT (lang_id, key) 
DO UPDATE SET value = EXCLUDED.value;

-- إعادة تفعيل RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;

RAISE NOTICE 'SUCCESS: تم إضافة الترجمات المطلوبة لصفحة إدارة الصلاحيات';


-- ============================================
-- إصلاح بيانات الصلاحيات
-- ============================================
-- 
-- الغرض: إضافة الصلاحيات المفقودة وإصلاح البيانات
-- ============================================

BEGIN;

-- تعطيل RLS مؤقتاً
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- إضافة صلاحية view:system_documentation المفقودة
INSERT INTO public.permissions (action, description)
VALUES ('view:system_documentation', 'Can view the system documentation page.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

-- إضافة ترجمات لصلاحية view:system_documentation
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'perm_view_system_documentation', 'View System Documentation'),
('ar', 'perm_view_system_documentation', 'عرض توثيق النظام'),
('en', 'perm_view_system_documentation_desc', 'Can view the system documentation page.'),
('ar', 'perm_view_system_documentation_desc', 'يمكنه عرض صفحة توثيق النظام.')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

-- ربط صلاحية view:system_documentation بدور Admin
DO $$
DECLARE
    admin_role_id UUID;
    sys_doc_perm_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
    SELECT id INTO sys_doc_perm_id FROM public.permissions WHERE action = 'view:system_documentation';

    IF admin_role_id IS NOT NULL AND sys_doc_perm_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (admin_role_id, sys_doc_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- إعادة تفعيل RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;

RAISE NOTICE 'SUCCESS: تم إصلاح بيانات الصلاحيات';


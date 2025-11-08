-- ============================================
-- تنظيف وإصلاح جدول الصلاحيات
-- ============================================
-- 
-- الغرض: 
-- 1. حذف الصلاحيات غير المستخدمة فعلياً في الموقع
-- 2. التأكد من وجود جميع الصلاحيات المستخدمة في الكود
-- 3. التأكد من تطابق أسماء الصلاحيات مع الكود
-- ============================================

BEGIN;

-- تعطيل RLS مؤقتاً
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- الخطوة 1: حذف الصلاحيات غير المستخدمة
-- ============================================
-- الصلاحيات غير المستخدمة في الكود:
-- - manage:settings (لم يتم استخدامها في الكود)
-- - truncate:activity_log (لم يتم استخدامها في الكود)
-- - view:confidence_analysis (لم يتم استخدامها في الكود)
-- - view:tomorrows_watchlist (لم يتم استخدامها في الكود)

-- حذف الصلاحيات غير المستخدمة من role_permissions أولاً
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions 
  WHERE action IN (
    'manage:settings',
    'truncate:activity_log',
    'view:confidence_analysis',
    'view:tomorrows_watchlist'
  )
);

-- حذف الصلاحيات غير المستخدمة
DELETE FROM public.permissions
WHERE action IN (
  'manage:settings',
  'truncate:activity_log',
  'view:confidence_analysis',
  'view:tomorrows_watchlist'
);

RAISE NOTICE 'SUCCESS: تم حذف الصلاحيات غير المستخدمة';

-- ============================================
-- الخطوة 2: التأكد من وجود جميع الصلاحيات المستخدمة
-- ============================================
-- قائمة الصلاحيات المستخدمة في الكود (من App.tsx):
-- 1. view:dashboard
-- 2. manage:users
-- 3. manage:roles
-- 4. manage:announcements
-- 5. view:system_documentation
-- 6. view:stock_analysis
-- 7. view:daily_watchlist
-- 8. manage:stocks
-- 9. manage:translations
-- 10. view:activity_log
-- 11. submit:user_notes
-- 12. manage:user_notes
-- 13. view:forecast_accuracy
-- 14. view:forecast_history_analysis

-- إضافة/تحديث الصلاحيات المستخدمة (إذا كانت مفقودة)
INSERT INTO public.permissions (action, description) VALUES
('view:dashboard', 'Can view the main dashboard.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:users', 'Can create, edit, and delete users.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:roles', 'Can create, edit, and delete roles and assign permissions.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:announcements', 'Can create, edit, and delete global announcements.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:system_documentation', 'Can view the system documentation page.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:stock_analysis', 'Can view the stock analysis and forecast performance dashboard.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:daily_watchlist', 'Can view the daily watchlist of stock forecasts.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:stocks', 'Can add, update, and track stocks.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:translations', 'Can edit UI translation values for all languages.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:activity_log', 'Can view the system activity log.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('submit:user_notes', 'Can access the "My Notes" page to submit feedback.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('manage:user_notes', 'Can view, manage, and export all user-submitted notes.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:forecast_accuracy', 'Can view the forecast accuracy analysis page.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:forecast_history_analysis', 'Can view the forecast history analysis page.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (action, description) VALUES
('view:what_happened', 'Can view the What Happened latest session overview page.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

RAISE NOTICE 'SUCCESS: تم التأكد من وجود جميع الصلاحيات المستخدمة';

-- ============================================
-- الخطوة 3: التأكد من ربط الصلاحيات بدور Admin
-- ============================================
-- ربط جميع الصلاحيات بدور Admin (إذا لم تكن مرتبطة بالفعل)
DO $$
DECLARE
    admin_role_id UUID;
    perm_record RECORD;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
    
    IF admin_role_id IS NOT NULL THEN
        FOR perm_record IN 
            SELECT id FROM public.permissions
        LOOP
            INSERT INTO public.role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_record.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'SUCCESS: تم ربط جميع الصلاحيات بدور Admin';
    END IF;
END $$;

-- إعادة تفعيل RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;

RAISE NOTICE 'SUCCESS: تم تنظيف وإصلاح جدول الصلاحيات بنجاح';


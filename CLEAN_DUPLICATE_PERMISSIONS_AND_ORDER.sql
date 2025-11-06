-- ============================================
-- تنظيف الصلاحيات المكررة وإعادة ترتيبها
-- ============================================
--
-- 1. إزالة الصلاحيات المكررة لنفس الصفحة
-- 2. ضمان ترتيب الصفحات الرئيسية أولاً
-- ============================================

BEGIN;

-- 1. حذف الصلاحيات المكررة (نحتفظ بالأحدث)
-- إذا كان هناك صلاحيات متعددة لنفس action، نحذف القديمة
DO $$
DECLARE
    perm_record RECORD;
    duplicate_count INT;
    kept_id UUID;
BEGIN
    -- للتحقق من التكرارات
    FOR perm_record IN 
        SELECT action, COUNT(*) as cnt, array_agg(id ORDER BY created_at DESC) as ids
        FROM public.permissions
        GROUP BY action
        HAVING COUNT(*) > 1
    LOOP
        -- نحتفظ بالأحدث (الأول في القائمة المرتبة)
        kept_id := perm_record.ids[1];
        
        -- نقل جميع role_permissions إلى الصلاحية المحفوظة
        UPDATE public.role_permissions
        SET permission_id = kept_id
        WHERE permission_id = ANY(perm_record.ids[2:array_length(perm_record.ids, 1)])
        AND permission_id != kept_id;
        
        -- حذف الصلاحيات المكررة
        DELETE FROM public.role_permissions
        WHERE permission_id = ANY(perm_record.ids[2:array_length(perm_record.ids, 1)]);
        
        DELETE FROM public.permissions
        WHERE id = ANY(perm_record.ids[2:array_length(perm_record.ids, 1)]);
        
        RAISE NOTICE 'Removed % duplicate(s) for action: %', perm_record.cnt - 1, perm_record.action;
    END LOOP;
END $$;

-- 2. إضافة عمود ترتيب للصلاحيات (إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.permissions ADD COLUMN display_order INTEGER DEFAULT 999;
        RAISE NOTICE 'Added display_order column to permissions table';
    END IF;
END $$;

-- 3. تعيين ترتيب العرض للصلاحيات
-- الصفحات الرئيسية تأتي أولاً
UPDATE public.permissions SET display_order = 1 WHERE action = 'view:daily_watchlist';
UPDATE public.permissions SET display_order = 2 WHERE action = 'view:stock_analysis';
UPDATE public.permissions SET display_order = 3 WHERE action = 'view:forecast_accuracy';
UPDATE public.permissions SET display_order = 4 WHERE action = 'view:forecast_history_analysis';
UPDATE public.permissions SET display_order = 5 WHERE action = 'view:dashboard';

-- الصلاحيات الإدارية
UPDATE public.permissions SET display_order = 10 WHERE action = 'manage:users';
UPDATE public.permissions SET display_order = 11 WHERE action = 'manage:roles';
UPDATE public.permissions SET display_order = 12 WHERE action = 'manage:announcements';
UPDATE public.permissions SET display_order = 13 WHERE action = 'view:system_documentation';
UPDATE public.permissions SET display_order = 14 WHERE action = 'manage:stocks';
UPDATE public.permissions SET display_order = 15 WHERE action = 'manage:translations';
UPDATE public.permissions SET display_order = 16 WHERE action = 'view:activity_log';
UPDATE public.permissions SET display_order = 17 WHERE action = 'submit:user_notes';
UPDATE public.permissions SET display_order = 18 WHERE action = 'manage:user_notes';
UPDATE public.permissions SET display_order = 19 WHERE action = 'manage:settings';
UPDATE public.permissions SET display_order = 20 WHERE action = 'truncate:activity_log';

-- بقية الصلاحيات
UPDATE public.permissions SET display_order = 999 WHERE display_order IS NULL OR display_order = 999;

RAISE NOTICE 'SUCCESS: تم تنظيف الصلاحيات المكررة وإعادة ترتيبها';

COMMIT;


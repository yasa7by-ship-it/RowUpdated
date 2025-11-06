-- ============================================
-- إصلاح صفحة System Documentation
-- ============================================
-- 
-- الغرض: 
-- 1. إنشاء/إصلاح دالة get_database_documentation
-- 2. إضافة ترجمة system_documentation في جدول الترجمات
-- ============================================

BEGIN;

-- تعطيل RLS مؤقتاً
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- الخطوة 1: إنشاء/إصلاح دالة get_database_documentation
-- ============================================
DROP FUNCTION IF EXISTS public.get_database_documentation() CASCADE;

CREATE OR REPLACE FUNCTION public.get_database_documentation()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog, information_schema
AS $$
SELECT json_build_object(
    'tables', (
        SELECT COALESCE(json_agg(
            json_build_object(
                'name', t.table_name,
                'description', pg_catalog.obj_description(c.oid, 'pg_class'),
                'columns', (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'name', col.column_name,
                            'type', col.udt_name,
                            'nullable', col.is_nullable,
                            'default', col.column_default,
                            'description', pg_catalog.col_description(c.oid, col.ordinal_position::int)
                        ) ORDER BY col.ordinal_position
                    ), '[]'::json)
                    FROM information_schema.columns col
                    WHERE col.table_schema = 'public' AND col.table_name = t.table_name
                )
            ) ORDER BY t.table_name
        ), '[]'::json)
        FROM information_schema.tables t
        JOIN pg_catalog.pg_class c ON c.relname = t.table_name
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ),
    'functions', (
        SELECT COALESCE(json_agg(
            json_build_object(
                'name', p.proname,
                'definition', pg_catalog.pg_get_functiondef(p.oid)
            ) ORDER BY p.proname
        ), '[]'::json)
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    ),
    'policies', (
        SELECT COALESCE(json_agg(
            json_build_object(
                'table', p.tablename,
                'name', p.policyname,
                'command', p.cmd,
                'definition', p.qual,
                'with_check', p.with_check
            ) ORDER BY p.tablename, p.policyname
        ), '[]'::json)
        FROM pg_catalog.pg_policies p
        WHERE p.schemaname = 'public'
    )
);
$$;

COMMENT ON FUNCTION public.get_database_documentation IS 'Returns comprehensive documentation for all tables, functions, and policies in the public schema';

RAISE NOTICE 'SUCCESS: تم إنشاء/إصلاح دالة get_database_documentation';

-- ============================================
-- الخطوة 2: إضافة ترجمة system_documentation
-- ============================================
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'system_documentation', 'System Documentation'),
('ar', 'system_documentation', 'توثيق النظام')
ON CONFLICT (lang_id, key) 
DO UPDATE SET value = EXCLUDED.value;

RAISE NOTICE 'SUCCESS: تم إضافة/تحديث ترجمة system_documentation';

-- إعادة تفعيل RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

COMMIT;

RAISE NOTICE 'SUCCESS: تم إصلاح صفحة System Documentation بنجاح';


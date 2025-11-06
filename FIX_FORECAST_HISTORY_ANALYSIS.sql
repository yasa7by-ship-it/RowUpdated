-- ============================================
-- إصلاح صفحة تحليل تاريخ التوقعات
-- ============================================
-- 
-- المشكلة: خطأ في GROUP BY في دالة get_forecast_performance_by_month
-- الخطأ: column "forecast_check_history.forecast_date" must appear in the GROUP BY clause
-- ============================================

BEGIN;

-- ============================================
-- إصلاح دالة get_forecast_performance_by_month
-- ============================================
CREATE OR REPLACE FUNCTION public.get_forecast_performance_by_month(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '365 days');
    v_end_date := COALESCE(p_end_date, CURRENT_DATE);

    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'year', year::integer,
                'month', month::integer,
                'month_name', TO_CHAR(month_date, 'Month'),
                'total_forecasts', total_forecasts::integer,
                'hits', hits::integer,
                'misses', misses::integer,
                'hit_rate', hit_rate,
                'avg_error', avg_error
            )
            ORDER BY year DESC, month DESC
        ), '[]'::json)
        FROM (
            SELECT 
                EXTRACT(YEAR FROM DATE_TRUNC('month', forecast_date))::integer as year,
                EXTRACT(MONTH FROM DATE_TRUNC('month', forecast_date))::integer as month,
                DATE_TRUNC('month', forecast_date) as month_date,
                COUNT(*) as total_forecasts,
                COUNT(*) FILTER (WHERE hit_range = true) as hits,
                COUNT(*) FILTER (WHERE hit_range = false) as misses,
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        ROUND((COUNT(*) FILTER (WHERE hit_range = true)::numeric / COUNT(*)::numeric) * 100, 2)
                    ELSE 0 
                END as hit_rate,
                COALESCE(AVG(pct_error), 0) as avg_error
            FROM public.forecast_check_history
            WHERE forecast_date BETWEEN v_start_date AND v_end_date
            GROUP BY DATE_TRUNC('month', forecast_date)
        ) monthly_stats
    );
END;
$$;

COMMENT ON FUNCTION public.get_forecast_performance_by_month IS 'Returns forecast performance grouped by month - Fixed GROUP BY issue';

RAISE NOTICE 'SUCCESS: تم إصلاح دالة get_forecast_performance_by_month';

COMMIT;

RAISE NOTICE 'SUCCESS: تم إصلاح صفحة تحليل تاريخ التوقعات بنجاح';


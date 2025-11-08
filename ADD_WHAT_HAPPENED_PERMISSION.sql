-- #############################################################################
-- # Add "What Happened" permission & translations
-- #############################################################################

BEGIN;

-- Ensure RLS does not block translation inserts
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

-- Page translations
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'what_happened', 'What Happened'),
('ar', 'what_happened', 'ماذا حدث'),
('en', 'what_happened_description', 'Latest trading session overview with full technical context.'),
('ar', 'what_happened_description', 'نظرة شاملة على آخر جلسة تداول مع السياق الفني الكامل.'),
('en', 'what_happened_last_session', 'Latest Trading Session'),
('ar', 'what_happened_last_session', 'آخر جلسة تداول'),
('en', 'what_happened_filters_placeholder', 'Search symbol or name...'),
('ar', 'what_happened_filters_placeholder', 'ابحث عن الرمز أو الاسم...'),
('en', 'what_happened_select_stock', 'Select a stock to explore detailed readings'),
('ar', 'what_happened_select_stock', 'اختر سهماً لعرض القراءات التفصيلية'),
('en', 'what_happened_overview', 'Session Overview'),
('ar', 'what_happened_overview', 'ملخص الجلسة'),
('en', 'what_happened_technicals', 'Technical Indicators'),
('ar', 'what_happened_technicals', 'المؤشرات الفنية'),
('en', 'what_happened_patterns', 'Candle Patterns'),
('ar', 'what_happened_patterns', 'نماذج الشموع'),
('en', 'what_happened_forecast_history', 'Forecast History'),
('ar', 'what_happened_forecast_history', 'سجل التوقعات'),
('en', 'what_happened_upcoming_forecasts', 'Upcoming Forecasts'),
('ar', 'what_happened_upcoming_forecasts', 'التوقعات القادمة'),
('en', 'what_happened_recent_prices', 'Recent Price Action'),
('ar', 'what_happened_recent_prices', 'الأسعار الأخيرة'),
('en', 'what_happened_pattern_none', 'No recent candle patterns'),
('ar', 'what_happened_pattern_none', 'لا توجد نماذج شموع حديثة'),
('en', 'what_happened_no_data', 'No data available for the latest session yet.'),
('ar', 'what_happened_no_data', 'لا توجد بيانات للجلسة الأخيرة حالياً.'),
('en', 'what_happened_loading_details', 'Loading stock insights...'),
('ar', 'what_happened_loading_details', 'جاري تحميل تفاصيل السهم...'),
('en', 'what_happened_indicator_rsi', 'Relative Strength Index (RSI)'),
('ar', 'what_happened_indicator_rsi', 'مؤشر القوة النسبية (RSI)'),
('en', 'what_happened_indicator_macd', 'MACD & Signal'),
('ar', 'what_happened_indicator_macd', 'MACD والإشارة'),
('en', 'what_happened_indicator_moving_averages', 'Moving Averages'),
('ar', 'what_happened_indicator_moving_averages', 'المتوسطات المتحركة'),
('en', 'what_happened_indicator_bollinger', 'Bollinger Bands'),
('ar', 'what_happened_indicator_bollinger', 'باندات بولينجر'),
('en', 'what_happened_indicator_stochastic', 'Stochastic Oscillator'),
('ar', 'what_happened_indicator_stochastic', 'مذبذب ستوكاستك'),
('en', 'what_happened_indicator_williams', 'Williams %R'),
('ar', 'what_happened_indicator_williams', 'ويليامز %R'),
('en', 'what_happened_indicator_volatility', 'Volatility & ATR'),
('ar', 'what_happened_indicator_volatility', 'التذبذب و ATR')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

-- Common column labels (reused in multiple tables)
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'column_trading_date', 'Trading Date'),
('ar', 'column_trading_date', 'تاريخ التداول'),
('en', 'column_change', 'Change'),
('ar', 'column_change', 'التغير'),
('en', 'column_change_percent', 'Change %'),
('ar', 'column_change_percent', 'نسبة التغير'),
('en', 'column_volume', 'Volume'),
('ar', 'column_volume', 'حجم التداول'),
('en', 'column_pattern', 'Pattern'),
('ar', 'column_pattern', 'النموذج'),
('en', 'column_signal', 'Signal'),
('ar', 'column_signal', 'الإشارة'),
('en', 'column_result', 'Result'),
('ar', 'column_result', 'النتيجة'),
('en', 'column_forecast', 'Forecast'),
('ar', 'column_forecast', 'التوقع'),
('en', 'column_range', 'Range'),
('ar', 'column_range', 'النطاق')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

-- Permission translations (Role Management table expects these keys)
INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'perm_view_what_happened', 'View "What Happened" page'),
('ar', 'perm_view_what_happened', 'عرض صفحة ماذا حدث'),
('en', 'perm_view_what_happened_desc', 'Allows access to the What Happened page for full session insights.'),
('ar', 'perm_view_what_happened_desc', 'يسمح بالوصول إلى صفحة ماذا حدث لمراجعة تفاصيل جلسة التداول.')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

-- Re-enable RLS on translations
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Insert permission (idempotent)
INSERT INTO public.permissions (action, description)
VALUES ('view:what_happened', 'Can view the What Happened session overview.')
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description;

-- Attach permission to Admin role if present
DO $$
DECLARE
    admin_role_id uuid;
    perm_id uuid;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
    SELECT id INTO perm_id FROM public.permissions WHERE action = 'view:what_happened';

    IF admin_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

COMMIT;



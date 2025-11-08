BEGIN;

-- Temporarily disable RLS to allow service role insertion
ALTER TABLE public.translations DISABLE ROW LEVEL SECURITY;

INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'nasdaq_snapshot', 'Nasdaq Market Snapshot'),
('ar', 'nasdaq_snapshot', 'ملخص سوق ناسداك'),
('en', 'nasdaq_snapshot_description', 'Daily summary of the Nasdaq Composite with breadth, sector performance, and headline context.'),
('ar', 'nasdaq_snapshot_description', 'ملخص يومي لمؤشر ناسداك المركب مع نطاق التغير وأداء القطاعات وأهم الأخبار.'),
('en', 'nasdaq_last_updated', 'Last update'),
('ar', 'nasdaq_last_updated', 'آخر تحديث'),
('en', 'nasdaq_close_price', 'Closing price'),
('ar', 'nasdaq_close_price', 'سعر الإغلاق'),
('en', 'nasdaq_open', 'Open'),
('ar', 'nasdaq_open', 'الافتتاح'),
('en', 'nasdaq_high', 'High'),
('ar', 'nasdaq_high', 'أعلى'),
('en', 'nasdaq_low', 'Low'),
('ar', 'nasdaq_low', 'أدنى'),
('en', 'nasdaq_change_points', 'Change (points)'),
('ar', 'nasdaq_change_points', 'التغير (نقاط)'),
('en', 'nasdaq_change_percent', 'Change %'),
('ar', 'nasdaq_change_percent', 'نسبة التغير'),
('en', 'nasdaq_volume', 'Volume'),
('ar', 'nasdaq_volume', 'حجم التداول'),
('en', 'nasdaq_breadth', 'Market breadth'),
('ar', 'nasdaq_breadth', 'اتساع السوق'),
('en', 'nasdaq_advancers', 'Advancers'),
('ar', 'nasdaq_advancers', 'الأسهم الصاعدة'),
('en', 'nasdaq_decliners', 'Decliners'),
('ar', 'nasdaq_decliners', 'الأسهم الهابطة'),
('en', 'nasdaq_leading_sector', 'Leading sector'),
('ar', 'nasdaq_leading_sector', 'القطاع الأقوى'),
('en', 'nasdaq_lagging_sector', 'Lagging sector'),
('ar', 'nasdaq_lagging_sector', 'القطاع الأضعف'),
('en', 'nasdaq_headline', 'Headline'),
('ar', 'nasdaq_headline', 'خبر مؤثر'),
('en', 'nasdaq_headline_none', 'No major headline captured for this session.'),
('ar', 'nasdaq_headline_none', 'لا يوجد خبر رئيسي مسجل لهذه الجلسة.'),
('en', 'nasdaq_sector_performance', 'Sector performance'),
('ar', 'nasdaq_sector_performance', 'أداء القطاعات'),
('en', 'nasdaq_heatmap_title', 'Top weighted constituents'),
('ar', 'nasdaq_heatmap_title', 'أهم الشركات وزناً'),
('en', 'nasdaq_heatmap_empty', 'Heatmap data is not available.'),
('ar', 'nasdaq_heatmap_empty', 'بيانات الخريطة الحرارية غير متوفرة.'),
('en', 'nasdaq_metadata_notices', 'Data notices'),
('ar', 'nasdaq_metadata_notices', 'ملاحظات البيانات'),
('en', 'nasdaq_notice_advancers_decliners', 'Advancers/decliners counts could not be retrieved this time.'),
('ar', 'nasdaq_notice_advancers_decliners', 'تعذر جلب عدد الأسهم الصاعدة والهابطة هذه المرة.'),
('en', 'nasdaq_notice_sector_performance', 'Sector performance data is temporarily unavailable.'),
('ar', 'nasdaq_notice_sector_performance', 'بيانات أداء القطاعات غير متوفرة مؤقتاً.'),
('en', 'nasdaq_notice_heatmap', 'Heatmap data is temporarily unavailable.'),
('ar', 'nasdaq_notice_heatmap', 'بيانات الخريطة الحرارية غير متوفرة مؤقتاً.'),
('en', 'nasdaq_notice_headline', 'No headline story was returned for this session.'),
('ar', 'nasdaq_notice_headline', 'لا يوجد خبر رئيسي مسجل لهذه الجلسة.'),
('en', 'market_cap', 'Market cap'),
('ar', 'market_cap', 'القيمة السوقية')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.translations (lang_id, key, value) VALUES
('en', 'perm_view_nasdaq_snapshot', 'View Nasdaq market snapshot'),
('ar', 'perm_view_nasdaq_snapshot', 'عرض ملخص سوق ناسداك'),
('en', 'perm_view_nasdaq_snapshot_desc', 'Allows access to the Nasdaq daily market snapshot page.'),
('ar', 'perm_view_nasdaq_snapshot_desc', 'يسمح بالوصول إلى صفحة ملخص سوق ناسداك اليومية.')
ON CONFLICT (lang_id, key) DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

INSERT INTO public.permissions (action, description, display_order)
VALUES ('view:nasdaq_snapshot', 'Can view Nasdaq market snapshot page.', 0)
ON CONFLICT (action) DO UPDATE SET description = EXCLUDED.description, display_order = 0;

-- Ensure other primary pages keep their ordering just after the snapshot
UPDATE public.permissions SET display_order = 1 WHERE action = 'view:daily_watchlist';
UPDATE public.permissions SET display_order = 2 WHERE action = 'view:stock_analysis';
UPDATE public.permissions SET display_order = 3 WHERE action = 'view:forecast_accuracy';
UPDATE public.permissions SET display_order = 4 WHERE action = 'view:forecast_history_analysis';
UPDATE public.permissions SET display_order = 5 WHERE action = 'view:dashboard';

-- Attach the new permission to Admin role by default
DO $$
DECLARE
    admin_role_id uuid;
    perm_id uuid;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
    SELECT id INTO perm_id FROM public.permissions WHERE action = 'view:nasdaq_snapshot';

    IF admin_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

COMMIT;

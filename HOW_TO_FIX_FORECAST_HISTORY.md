# كيفية إصلاح صفحة تحليل تاريخ التوقعات

## المشكلة:
❌ صفحة "تحليل تاريخ التوقعات" لا تعمل
❌ الخطأ: `column "forecast_check_history.forecast_date" must appear in the GROUP BY clause`

## السبب:
الدالة `get_forecast_performance_by_month` تحتوي على خطأ في GROUP BY clause. المشكلة هي:
- يتم استخدام `EXTRACT(YEAR FROM forecast_date)` و `EXTRACT(MONTH FROM forecast_date)` في SELECT
- لكن GROUP BY يحتوي فقط على `DATE_TRUNC('month', forecast_date)`
- يجب استخدام `EXTRACT` على القيمة المجمعة `DATE_TRUNC('month', forecast_date)` بدلاً من `forecast_date` مباشرة

## الحل:

### الخطوات:
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `FIX_FORECAST_HISTORY_ANALYSIS.sql`
4. الصقه في SQL Editor
5. اضغط "Run" أو "Execute"

### ما يقوم به السكربت:
- ✅ إصلاح دالة `get_forecast_performance_by_month`
- ✅ إضافة `SECURITY DEFINER` و `SET search_path` للتحسينات الأمنية
- ✅ استخدام `EXTRACT` على `DATE_TRUNC('month', forecast_date)` بدلاً من `forecast_date` مباشرة

## بعد التنفيذ:
- ✅ صفحة "تحليل تاريخ التوقعات" ستعمل بشكل صحيح
- ✅ جميع البيانات ستظهر بشكل صحيح


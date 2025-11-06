# 🚀 خطوات تنفيذ SQL Script مباشرة

## ⚠️ ملاحظة مهمة
Supabase **لا يدعم** تنفيذ SQL مباشرة عبر REST API. يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor.

---

## 📋 الخطوات المفصلة:

### **1. افتح Supabase Dashboard**
- اذهب إلى: **https://supabase.com/dashboard**
- سجل دخولك
- اختر مشروعك

### **2. افتح SQL Editor**
- من القائمة الجانبية اليسرى، اضغط على **"SQL Editor"**
- أو اذهب مباشرة إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

### **3. أنشئ Query جديد**
- اضغط على زر **"New Query"** (أو استخدم Ctrl+K)
- أو اضغط على **"+"** في الزاوية العلوية

### **4. انسخ والصق SQL Script**
- افتح الملف: `FIX_get_latest_ranges_from_history.sql`
- انسخ **المحتوى كامل** (Ctrl+A ثم Ctrl+C)
- الصق في SQL Editor (Ctrl+V)

### **5. شغل SQL Script**
- اضغط على زر **"Run"** (أو استخدم Ctrl+Enter)
- انتظر حتى تظهر رسالة النجاح

### **6. التحقق من النتيجة**
بعد التنفيذ، شغل هذا الاستعلام للتحقق:
```sql
SELECT * FROM public.get_latest_ranges_from_history() LIMIT 10;
```

---

## 📄 محتوى SQL Script:

```sql
-- ============================================
-- إصلاح جلب بيانات النطاق الفعلي والنطاق المتوقع من forecast_check_history
-- ============================================

BEGIN;

-- إنشاء دالة جديدة تجلب أحدث نطاق لكل سهم من forecast_check_history
CREATE OR REPLACE FUNCTION public.get_latest_ranges_from_history()
RETURNS TABLE (
  stock_symbol TEXT,
  stock_name TEXT,
  forecast_date DATE,
  actual_low DOUBLE PRECISION,
  actual_high DOUBLE PRECISION,
  predicted_lo DOUBLE PRECISION,
  predicted_hi DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH latest_forecasts AS (
    -- الحصول على أحدث تاريخ لكل سهم
    SELECT 
      fch.stock_symbol,
      MAX(fch.forecast_date) AS latest_date
    FROM public.forecast_check_history fch
    WHERE fch.actual_low IS NOT NULL 
      AND fch.actual_high IS NOT NULL
      AND fch.predicted_lo IS NOT NULL
      AND fch.predicted_hi IS NOT NULL
    GROUP BY fch.stock_symbol
  )
  SELECT DISTINCT ON (fch.stock_symbol)
    fch.stock_symbol,
    COALESCE(s.name, fch.stock_symbol) AS stock_name,
    fch.forecast_date,
    fch.actual_low,
    fch.actual_high,
    fch.predicted_lo,
    fch.predicted_hi
  FROM public.forecast_check_history fch
  JOIN latest_forecasts lf 
    ON fch.stock_symbol = lf.stock_symbol 
    AND fch.forecast_date = lf.latest_date
  LEFT JOIN public.stocks s 
    ON s.symbol = fch.stock_symbol
  WHERE fch.actual_low IS NOT NULL 
    AND fch.actual_high IS NOT NULL
    AND fch.predicted_lo IS NOT NULL
    AND fch.predicted_hi IS NOT NULL
  ORDER BY fch.stock_symbol, fch.forecast_date DESC, fch.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_latest_ranges_from_history IS 'Returns the latest actual and forecast ranges for each stock from forecast_check_history';

COMMIT;
```

---

## ✅ بعد التنفيذ

1. **أعد تحميل صفحة "دقة التوقعات"**
2. **تحقق من أن البيانات تظهر في الجدول**
3. **يجب أن تظهر النطاقات الفعلية والمتوقعة لكل سهم**

---

## 🔍 في حالة وجود أخطاء

إذا ظهرت أخطاء، تأكد من:
- أنك لديك صلاحيات كافية (Admin)
- أن جدول `forecast_check_history` موجود
- أن الأعمدة المطلوبة موجودة


# 📊 مراجعة البيانات في صفحة "آخر يوم" (Last Day)

## 🔍 نظرة عامة

صفحة "آخر يوم" (`StockAnalysis.tsx`) تعرض نتائج التوقعات لآخر يوم عمل. هذا التقرير يوضح بالضبط من أين تأتي البيانات وكيف يتم استخراجها.

---

## 📋 البيانات المعروضة في الصفحة

### 1️⃣ **تاريخ آخر يوم عمل**
- **المكان:** بطاقة كبيرة في أعلى الصفحة
- **المصدر:** `checklistData[0].forecast_date`
- **المشكلة الحالية:** يأخذ من `forecast_check_history.forecast_date`
- **المصدر الصحيح:** يجب أن يأخذ من `stocks.last_updated`

### 2️⃣ **إجمالي التوقعات**
- **الحساب:** `checklistData.length`
- **المصدر:** عدد السجلات المُرجعة من `get_daily_checklist()`

### 3️⃣ **التوقعات الصحيحة**
- **الحساب:** `checklistData.filter(item => item.is_hit).length`
- **المصدر:** عدد السجلات التي `is_hit = true`

### 4️⃣ **التوقعات الخاطئة**
- **الحساب:** `total - hits`
- **المصدر:** الفرق بين إجمالي التوقعات والتوقعات الصحيحة

### 5️⃣ **نسبة النجاح**
- **الحساب:** `(hits / total) * 100`
- **المصدر:** حساب في Frontend

### 6️⃣ **سعر الإغلاق**
- **المكان:** في الجدول - عمود "Last Close Info"
- **المصدر:** `item.price` من `checklistData`
- **المصدر الصحيح:** يجب أن يأخذ من `stocks.price` (سعر إغلاق آخر يوم عمل)

---

## 🔄 مسار البيانات الحالي

### **الخطوة 1: Frontend (StockAnalysis.tsx)**
```typescript
// السطر 389
const { data: rpcData, error: rpcError } = await supabase.rpc('get_daily_checklist');
```

### **الخطوة 2: RPC Function (get_daily_checklist)**
```sql
-- الدالة الحالية (غير صحيحة)
WITH latest_date AS (
  SELECT max(forecast_date) AS value 
  FROM public.forecast_check_latest  -- ❌ خطأ
)
SELECT * 
FROM public.vw_Last_dayCheckList
WHERE forecast_date = (SELECT value FROM latest_date);
```

**المشكلة:**
- تأخذ آخر تاريخ من `forecast_check_latest.forecast_date`
- لكن يجب أن تأخذ من `stocks.last_updated`

### **الخطوة 3: SQL View (vw_Last_dayCheckList)**
```sql
-- View الحالي (غير صحيح)
CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fcl.stock_symbol,
  s.name AS stock_name,
  s.last_updated,  -- ✅ موجود لكن لا يُستخدم كتاريخ آخر يوم عمل
  s.price,  -- ✅ موجود
  fcl.actual_low,
  fcl.actual_high,
  fcl.predicted_lo,
  fcl.predicted_hi,
  fcl.hit_range AS is_hit,
  fcl.forecast_date  -- ❌ هذا يُستخدم كتاريخ آخر يوم عمل
FROM public.forecast_check_latest AS fcl  -- ❌ مصدر خاطئ
JOIN public.stocks AS s ON s.symbol = fcl.stock_symbol;
```

**المشكلة:**
- يستخدم `forecast_check_latest` بدلاً من `forecast_check_history`
- يستخدم `fcl.forecast_date` كتاريخ آخر يوم عمل بدلاً من `s.last_updated`

---

## ✅ المسار الصحيح (المطلوب)

### **التوضيح من المستخدم:**
1. **تاريخ آخر يوم عمل** = `stocks.last_updated` (تاريخ تحديث السجل في جدول الأسهم)
2. **سعر الإغلاق** = `stocks.price` (سعر إغلاق آخر يوم عمل)

### **الحل:**

#### **1. تحديث SQL View:**
```sql
CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fch.stock_symbol,
  s.name AS stock_name,
  s.last_updated::date AS forecast_date,  -- ✅ تاريخ آخر يوم عمل من stocks
  s.price,  -- ✅ سعر الإغلاق لآخر يوم عمل
  fch.actual_low,
  fch.actual_high,
  fch.predicted_lo,
  fch.predicted_hi,
  fch.hit_range AS is_hit,
  fch.forecast_date AS original_forecast_date
FROM public.forecast_check_history AS fch  -- ✅ المصدر الصحيح
JOIN public.stocks AS s ON s.symbol = fch.stock_symbol;
```

#### **2. تحديث RPC Function:**
```sql
CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_work_date DATE;
BEGIN
  -- ✅ الحصول على آخر تاريخ تحديث من جدول stocks (هذا هو آخر يوم عمل)
  SELECT max(last_updated::date) INTO v_last_work_date
  FROM public.stocks
  WHERE last_updated IS NOT NULL;
  
  -- إذا لم يوجد تاريخ، نرجع آخر تاريخ من forecast_check_history كبديل
  IF v_last_work_date IS NULL THEN
    SELECT max(forecast_date) INTO v_last_work_date
    FROM public.forecast_check_history;
  END IF;
  
  -- إرجاع البيانات لآخر يوم عمل
  RETURN QUERY
  SELECT 
    fch.stock_symbol,
    s.name AS stock_name,
    v_last_work_date AS forecast_date,  -- ✅ تاريخ آخر يوم عمل من stocks
    s.price,  -- ✅ سعر الإغلاق لآخر يوم عمل
    fch.actual_low,
    fch.actual_high,
    fch.predicted_lo,
    fch.predicted_hi,
    fch.hit_range AS is_hit,
    fch.forecast_date AS original_forecast_date
  FROM public.forecast_check_history fch
  JOIN public.stocks s ON s.symbol = fch.stock_symbol
  WHERE s.last_updated::date = v_last_work_date  -- ✅ فقط الأسهم التي لها نفس تاريخ آخر يوم عمل
    AND fch.forecast_date = v_last_work_date  -- ✅ فقط التوقعات التي لها نفس تاريخ آخر يوم عمل
  ORDER BY s.symbol;
END;
$$;
```

---

## 📊 ملخص البيانات المعروضة

| البيانات | المصدر الحالي | المصدر الصحيح |
|---------|--------------|--------------|
| **تاريخ آخر يوم عمل** | `forecast_check_latest.forecast_date` | `stocks.last_updated` |
| **سعر الإغلاق** | `stocks.price` (✅ صحيح) | `stocks.price` (✅ صحيح) |
| **النطاق الفعلي** | `forecast_check_history.actual_low/high` | `forecast_check_history.actual_low/high` |
| **النطاق المتوقع** | `forecast_check_history.predicted_lo/hi` | `forecast_check_history.predicted_lo/hi` |
| **نتيجة التوقع** | `forecast_check_history.hit_range` | `forecast_check_history.hit_range` |

---

## 🔍 كيفية التحقق من البيانات

### **1. التحقق من آخر تاريخ عمل:**
```sql
SELECT max(last_updated::date) AS last_work_date
FROM public.stocks
WHERE last_updated IS NOT NULL;
```

### **2. التحقق من التوقعات لهذا التاريخ:**
```sql
SELECT 
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE hit_range = true) AS hits,
  COUNT(*) FILTER (WHERE hit_range = false) AS misses
FROM public.forecast_check_history fch
JOIN public.stocks s ON s.symbol = fch.stock_symbol
WHERE s.last_updated::date = (
  SELECT max(last_updated::date) 
  FROM public.stocks 
  WHERE last_updated IS NOT NULL
)
AND fch.forecast_date = (
  SELECT max(last_updated::date) 
  FROM public.stocks 
  WHERE last_updated IS NOT NULL
);
```

### **3. اختبار الدالة بعد التحديث:**
```sql
SELECT * FROM public.get_daily_checklist() LIMIT 10;
```

---

## ⚠️ المشاكل المحتملة

1. **التاريخ المعروض مختلف:**
   - إذا كان `stocks.last_updated` مختلف عن `forecast_check_history.forecast_date`
   - **الحل:** تحديث الدالة لاستخدام `stocks.last_updated`

2. **البيانات قديمة:**
   - إذا كان الكاش في `localStorage` قديم
   - **الحل:** مسح الكاش أو إعادة تحميل الصفحة

3. **عدد التوقعات مختلف:**
   - إذا كان عدد الأسهم في `stocks` مختلف عن عدد التوقعات في `forecast_check_history`
   - **الحل:** التأكد من أن جميع الأسهم لها توقعات في `forecast_check_history`

---

## 📝 الخطوات التالية

1. ✅ تنفيذ SQL Script: `FIX_get_daily_checklist_use_stocks_date.sql`
2. ✅ مسح الكاش في المتصفح
3. ✅ إعادة تحميل الصفحة
4. ✅ التحقق من البيانات المعروضة


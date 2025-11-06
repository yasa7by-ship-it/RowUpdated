# كيفية جلب البيانات في صفحة "آخر يوم" (Last Day)

## 📋 نظرة عامة

صفحة "آخر يوم" (`StockAnalysis.tsx`) تعرض نتائج التوقعات لآخر يوم عمل. البيانات تُجلب من قاعدة البيانات عبر دالة RPC.

---

## 🔄 خطوات جلب البيانات

### 1️⃣ **Frontend (React Component)**

**الملف:** `components/pages/StockAnalysis.tsx`

**الكود:**
```typescript
const { data: rpcData, error: rpcError } = await supabase.rpc('get_daily_checklist');
if (rpcError) throw rpcError;

const freshData = rpcData as DailyChecklistItem[];
setChecklistData(freshData);
```

**السطر:** 389-393

---

### 2️⃣ **RPC Function في قاعدة البيانات**

**الدالة:** `get_daily_checklist()`

**الموقع:** تم إنشاؤها في `migration_115_fix_daily_checklist_source.sql`

**الكود الكامل:**
```sql
CREATE OR REPLACE FUNCTION public.get_daily_checklist()
RETURNS SETOF public.vw_Last_dayCheckList
LANGUAGE sql STABLE
AS $$
  WITH latest_date AS (
    SELECT max(forecast_date) AS value FROM public.forecast_check_latest
  )
  SELECT * 
  FROM public.vw_Last_dayCheckList
  WHERE forecast_date = (SELECT value FROM latest_date);
$$;
```

**ما تفعله:**
1. تجد آخر تاريخ (`forecast_date`) في جدول `forecast_check_latest`
2. ترجع جميع البيانات من الـ View لهذا التاريخ فقط

---

### 3️⃣ **SQL View**

**الـ View:** `vw_Last_dayCheckList`

**الكود:**
```sql
CREATE VIEW public.vw_Last_dayCheckList AS
SELECT
  fcl.stock_symbol,
  s.name AS stock_name,
  s.last_updated,
  s.price,
  fcl.actual_low,
  fcl.actual_high,
  fcl.predicted_lo,
  fcl.predicted_hi,
  fcl.hit_range AS is_hit,
  fcl.forecast_date
FROM public.forecast_check_latest AS fcl
JOIN public.stocks AS s
  ON s.symbol = fcl.stock_symbol
ORDER BY fcl.stock_symbol;
```

**ما تفعله:**
1. تأخذ البيانات من جدول `forecast_check_latest`
2. تجمع مع جدول `stocks` للحصول على:
   - اسم السهم (`stock_name`)
   - آخر تحديث (`last_updated`)
   - السعر الحالي (`price`)
3. ترجع:
   - رمز السهم (`stock_symbol`)
   - النطاق الفعلي (`actual_low`, `actual_high`)
   - النطاق المتوقع (`predicted_lo`, `predicted_hi`)
   - نتيجة التوقع (`hit_range` كـ `is_hit`)
   - تاريخ التوقع (`forecast_date`)

---

### 4️⃣ **جدول المصدر الأساسي**

**الجدول:** `forecast_check_latest`

**ما يحتويه:**
- `stock_symbol`: رمز السهم
- `actual_low`: الحد الأدنى الفعلي
- `actual_high`: الحد الأعلى الفعلي
- `predicted_lo`: الحد الأدنى المتوقع
- `predicted_hi`: الحد الأعلى المتوقع
- `hit_range`: نتيجة التوقع (true/false)
- `forecast_date`: تاريخ التوقع

---

## 📊 حساب الإحصائيات في Frontend

**الكود:** `StockAnalysis.tsx` - السطور 407-416

```typescript
const summaryStats = useMemo(() => {
    const total = checklistData.length;
    if (total === 0) {
        return { total: 0, hits: 0, misses: 0, hitRate: 0 };
    }
    const hits = checklistData.filter(item => item.is_hit).length;
    const misses = total - hits;
    const hitRate = (hits / total);
    return { total, hits, misses, hitRate };
}, [checklistData]);
```

**الحسابات:**
- **إجمالي التوقعات:** عدد جميع السجلات
- **التوقعات الصحيحة:** عدد السجلات التي `is_hit = true`
- **التوقعات الخاطئة:** `total - hits`
- **نسبة النجاح:** `(hits / total) * 100`

---

## ⚠️ المشاكل المحتملة

### 1. **البيانات غير صحيحة في `forecast_check_latest`**
   - **الحل:** التحقق من جدول `forecast_check_history` المصدر

### 2. **حساب `hit_range` غير صحيح**
   - **الحل:** التحقق من منطق حساب `hit_range` في قاعدة البيانات

### 3. **البيانات قديمة**
   - **الحل:** التحقق من آخر تاريخ في `forecast_check_latest`

### 4. **الكاش في المتصفح**
   - **الحل:** مسح `localStorage` أو إعادة تحميل الصفحة

---

## 🔍 كيفية التحقق من البيانات

### 1. **التحقق من آخر تاريخ:**
```sql
SELECT max(forecast_date) AS latest_date 
FROM public.forecast_check_latest;
```

### 2. **التحقق من عدد السجلات:**
```sql
SELECT COUNT(*) AS total_records
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest);
```

### 3. **التحقق من التوقعات الصحيحة/الخاطئة:**
```sql
SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE hit_range = true) AS hits,
    COUNT(*) FILTER (WHERE hit_range = false) AS misses,
    ROUND(COUNT(*) FILTER (WHERE hit_range = true)::numeric / COUNT(*)::numeric * 100, 2) AS hit_rate
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest);
```

### 4. **اختبار الدالة مباشرة:**
```sql
SELECT * FROM public.get_daily_checklist();
```

---

## 📝 ملاحظات مهمة

1. **البيانات تأتي من `forecast_check_latest` وليس `forecast_check_history`**
2. **الدالة ترجع فقط آخر تاريخ متاح**
3. **الإحصائيات تُحسب في Frontend وليس في قاعدة البيانات**
4. **يتم حفظ البيانات في `localStorage` للكاش**

---

## 🔧 في حالة وجود مشكلة

1. **تحقق من البيانات في قاعدة البيانات مباشرة**
2. **تحقق من صحة `hit_range` في `forecast_check_latest`**
3. **تحقق من آخر تاريخ متاح**
4. **امسح الكاش في المتصفح**
5. **أعد تحميل الصفحة**


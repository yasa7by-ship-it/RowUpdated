# 🔧 كيفية تنفيذ FIX_get_daily_checklist_use_stocks_date.sql

## 📋 الخطوات المطلوبة

### **1. افتح Supabase Dashboard**
- اذهب إلى: https://supabase.com/dashboard
- سجل دخولك
- اختر مشروعك

### **2. افتح SQL Editor**
- من القائمة الجانبية، اضغط على **"SQL Editor"**
- اضغط **"New Query"** (أو استخدم Ctrl+K)

### **3. انسخ والصق SQL Script**
- افتح الملف: `FIX_get_daily_checklist_use_stocks_date.sql`
- انسخ **المحتوى كامل** (Ctrl+A ثم Ctrl+C)
- الصق في SQL Editor (Ctrl+V)

### **4. شغل SQL Script**
- اضغط **"Run"** (أو Ctrl+Enter)
- انتظر حتى تظهر رسالة النجاح

### **5. التحقق من النتيجة**
- يجب أن ترى رسالة: `SUCCESS: تم تحديث دالة get_daily_checklist لاستخدام stocks.last_updated`
- إذا ظهرت أخطاء، تحقق من أنك لديك الصلاحيات الكافية

---

## ✅ بعد التنفيذ

### **التحقق من الدالة:**
```sql
SELECT * FROM public.get_daily_checklist() LIMIT 10;
```

### **التحقق من آخر تاريخ عمل:**
```sql
SELECT max(last_updated::date) AS last_work_date 
FROM public.stocks 
WHERE last_updated IS NOT NULL;
```

---

## 📝 ملاحظات

- SQL Script آمن ويمكن تنفيذه عدة مرات
- سيتم إسقاط View القديم وإنشاء View جديد
- سيتم تحديث دالة `get_daily_checklist()` لاستخدام `stocks.last_updated`

---

## 🔍 ما يفعله SQL Script

1. **إسقاط View القديم:** `vw_Last_dayCheckList`
2. **إنشاء View جديد:** يستخدم `stocks.last_updated` كتاريخ آخر يوم عمل
3. **تحديث الدالة:** `get_daily_checklist()` لاستخدام `stocks.last_updated` بدلاً من `forecast_check_latest.forecast_date`

---

## ⚠️ تحذير

إذا كان لديك أي Views أو Functions تعتمد على `vw_Last_dayCheckList`، سيتم إسقاطها أيضاً بسبب `CASCADE`. لكن الدالة `get_daily_checklist()` ستُعاد إنشاؤها تلقائياً.


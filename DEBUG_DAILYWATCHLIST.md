# تشخيص مشكلة صفحة "الاتجاه القادم"

## الخطوات للتشخيص:

### 1. فتح Developer Console:
- اضغط `F12` في المتصفح
- اذهب لتبويب **Console**

### 2. البحث عن الأخطاء:
ابحث عن:
- `RPC Error:` - خطأ في استدعاء قاعدة البيانات
- `Error fetching DailyWatchlist data:` - خطأ عام في التحميل
- `No data returned from get_the_coming_trend_data` - لا توجد بيانات

### 3. التحقق من البيانات:

في Console، اكتب:
```javascript
localStorage.getItem('dailyWatchlistData-v2')
```

إذا كان `null` → البيانات لم تُحمّل بعد
إذا كان هناك JSON → البيانات موجودة في Cache

### 4. التحقق من RPC Function:

في Supabase Dashboard:
1. اذهب إلى **SQL Editor**
2. شغل هذا الاستعلام:
```sql
SELECT * FROM get_the_coming_trend_data();
```

**إذا لم تُرجع أي بيانات:**
- تأكد من وجود بيانات في جدول `stocks` مع `is_tracked = true`
- تأكد من وجود بيانات في `forecasts`
- تأكد من وجود بيانات في `technical_indicators`

### 5. المشاكل الشائعة:

#### المشكلة 1: لا توجد بيانات في جدول `stocks`
```sql
-- التحقق
SELECT COUNT(*) FROM stocks WHERE is_tracked = true;

-- إذا كان 0، أضف بيانات
INSERT INTO stocks (symbol, name, price, change, change_percent, is_tracked)
VALUES ('AAPL', 'Apple Inc.', 150.00, 2.5, 1.69, true);
```

#### المشكلة 2: لا توجد بيانات في `forecasts`
```sql
-- التحقق
SELECT COUNT(*) FROM forecasts;

-- يحتاج وجود توقعات للأسهم
```

#### المشكلة 3: RPC Function غير موجودة
```sql
-- التحقق من وجود الـ Function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_the_coming_trend_data';

-- إذا لم توجد، شغل migration_153_update_coming_trend_function.sql.txt
```

### 6. حل سريع:

إذا كانت المشكلة أن البيانات فارغة:

1. **امسح Cache:**
```javascript
// في Console
localStorage.removeItem('dailyWatchlistData-v2');
localStorage.removeItem('dailyWatchlistTimestamp-v2');
// ثم أعد تحميل الصفحة
```

2. **تحقق من Console للأخطاء**

3. **إذا كان هناك خطأ في RPC:**
   - تأكد من تطبيق migration_153_update_coming_trend_function.sql.txt
   - تأكد من صلاحيات المستخدم على RPC functions

### 7. التحقق من الصلاحيات:

```sql
-- التحقق من RLS Policies
SELECT * FROM pg_policies WHERE tablename = 'stocks';

-- تأكد من أن المستخدم لديه صلاحية الوصول
```

---

## رسائل الخطأ المحتملة:

### "لا توجد بيانات متاحة حالياً"
- **السبب:** جدول `stocks` فارغ أو `is_tracked = false` لجميع الأسهم
- **الحل:** أضف بيانات أو فعل `is_tracked` للأسهم

### "فشل تحميل البيانات"
- **السبب:** خطأ في RPC function أو مشكلة في الاتصال
- **الحل:** تحقق من Console للأخطاء التفصيلية

### الصفحة تظهر Loading دائماً
- **السبب:** الـ RPC call لا يكتمل
- **الحل:** تحقق من Network tab في Developer Tools

---

## اختبار سريع:

افتح Console واكتب:
```javascript
// 1. مسح Cache
localStorage.clear();

// 2. إعادة تحميل الصفحة
location.reload();

// 3. مراقبة Console للأخطاء
```

---

## ملاحظات:

- إذا كانت البيانات موجودة في قاعدة البيانات لكن الصفحة لا تعرضها، قد تكون مشكلة في الـ filtering
- إذا كان `loading` دائماً `true`، قد تكون مشكلة في الـ useEffect dependency









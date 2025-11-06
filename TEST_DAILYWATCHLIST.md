# اختبار صفحة الاتجاه القادم

## خطوات التشخيص:

### 1. افتح Developer Console:
- اضغط `F12` في المتصفح
- اذهب لتبويب **Console**

### 2. ابحث عن الأخطاء:
ابحث عن:
- خطأ أحمر
- `Error:` أو `Failed to`
- `DailyWatchlist`
- `get_the_coming_trend_data`

### 3. افتح تبويب Network:
- اذهب لتبويب **Network**
- أعد تحميل الصفحة (`Ctrl + Shift + R`)
- ابحث عن:
  - `DailyWatchlist` (ملف JS)
  - `get_the_coming_trend_data` (API call)

### 4. تحقق من الملف:
افتح:
```
http://localhost:3000/components/pages/DailyWatchlist.js
```

---

## الأخطاء المحتملة:

### خطأ: "Cannot read property 't' of undefined"
- **السبب:** `useLanguage()` لا يعمل
- **الحل:** تأكد من أن المكون داخل `LanguageProvider`

### خطأ: "get_the_coming_trend_data is not a function"
- **السبب:** RPC function غير موجودة في قاعدة البيانات
- **الحل:** شغل migration_153_update_coming_trend_function.sql.txt

### خطأ: "Loading... forever"
- **السبب:** البيانات لا تُحمّل
- **الحل:** تحقق من Console للأخطاء

### صفحة بيضاء تماماً:
- **السبب:** خطأ في JavaScript يمنع التحميل
- **الحل:** 
  1. افتح Console
  2. ابحث عن خطأ أحمر
  3. أرسل لي الخطأ

---

## اختبار سريع:

افتح Console واكتب:
```javascript
// 1. تحقق من أن الصفحة محمّلة
console.log('Testing DailyWatchlist...');

// 2. تحقق من Cache
localStorage.getItem('dailyWatchlistData-v3');

// 3. مسح Cache وإعادة تحميل
localStorage.removeItem('dailyWatchlistData-v3');
localStorage.removeItem('dailyWatchlistTimestamp-v3');
location.reload();
```

---

## إذا كان هناك خطأ في Console:

انسخ الخطأ الكامل وأرسله لي.








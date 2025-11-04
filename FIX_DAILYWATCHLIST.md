# إصلاح صفحة الاتجاه القادم - خطوات التشخيص

## الخطوة 1: افتح Developer Console

1. اضغط `F12` في المتصفح
2. اذهب لتبويب **Console**

---

## الخطوة 2: ابحث عن الأخطاء

ابحث عن:
- ❌ **خطأ أحمر** - هذا هو السبب!
- `Error:`
- `Failed to`
- `Cannot read`
- `DailyWatchlist`

**انسخ الخطأ الكامل وأرسله لي**

---

## الخطوة 3: تحقق من Network

1. في Developer Tools، اذهب لتبويب **Network**
2. أعد تحميل الصفحة (`Ctrl + Shift + R`)
3. ابحث عن:
   - `DailyWatchlist` (ملف JavaScript)
   - `get_the_coming_trend_data` (استدعاء API)

**هل الملفات تُحمّل؟**

---

## الخطوة 4: مسح Cache

افتح Console واكتب:

```javascript
// مسح جميع Cache
localStorage.removeItem('dailyWatchlistData-v3');
localStorage.removeItem('dailyWatchlistTimestamp-v3');
location.reload();
```

---

## الأخطاء الشائعة والحلول:

### ❌ "Cannot read property 't' of undefined"
**الحل:** تأكد من أن المستخدم مسجل دخول

### ❌ "get_the_coming_trend_data is not a function"
**الحل:** شغل migration_153_update_coming_trend_function.sql.txt في Supabase

### ❌ "Loading... forever"
**الحل:** تحقق من Console - قد يكون هناك خطأ في API call

### ❌ صفحة بيضاء تماماً
**الحل:** 
1. افتح Console
2. ابحث عن خطأ JavaScript
3. أرسل لي الخطأ

---

## اختبار سريع:

افتح Console واكتب:

```javascript
// تحقق من أن React يعمل
console.log('React version:', React.version);

// تحقق من البيانات
localStorage.getItem('dailyWatchlistData-v3');
```

---

**أرسل لي ما يظهر في Console!**




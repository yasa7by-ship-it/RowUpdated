# خطوات مسح الكاش بعد تنفيذ السكربت

## خطوات سريعة:

1. **افتح Developer Tools** (اضغط `F12`)

2. **اذهب إلى Application** → **Local Storage** → `http://localhost:3001`

3. **احذف المفاتيح التالية:**
   - `dailyWatchlistData-v3`
   - `dailyWatchlistTimestamp-v3`

4. **أعد تحميل الصفحة** (اضغط `F5`)

---

## أو استخدم Console:

افتح Console (في Developer Tools) واكتب:

```javascript
localStorage.removeItem('dailyWatchlistData-v3');
localStorage.removeItem('dailyWatchlistTimestamp-v3');
location.reload();
```

---

## بعد إعادة التحميل:

✅ يجب أن يعرض الجدول:
- ✅ النطاق المتوقع (من جدول forecasts)
- ✅ النطاق الفعلي (من forecast_check_history أو historical_data)
- ✅ جميع البيانات الأخرى

إذا لم تظهر البيانات، تحقق من:
1. هل يوجد توقعات في جدول `forecasts` لتاريخ اليوم/الغد؟
2. هل الأسهم `is_tracked = true`؟


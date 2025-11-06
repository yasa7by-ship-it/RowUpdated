# كيفية إصلاح صفحة System Documentation

## المشاكل:
1. ❌ صفحة System Documentation لا تعمل (خطأ في `get_database_documentation`)
2. ❌ الاسم "system_documentation" يظهر بالإنجليزية بدلاً من العربية

## الحلول المطبقة:

### ✅ 1. إصلاح الترجمة (تم تنفيذه)
- تم إضافة/تحديث ترجمة `system_documentation` في جدول الترجمات:
  - العربية: "توثيق النظام"
  - الإنجليزية: "System Documentation"

### ⚠️ 2. إصلاح الدالة (يحتاج تنفيذ يدوي)

**الملف المطلوب:** `FIX_SYSTEM_DOCUMENTATION.sql`

**الخطوات:**
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `FIX_SYSTEM_DOCUMENTATION.sql`
4. الصقه في SQL Editor
5. اضغط "Run" أو "Execute"

**ما يقوم به السكربت:**
- حذف الدالة القديمة (إن وجدت)
- إنشاء دالة `get_database_documentation` جديدة
- إضافة/تحديث ترجمة `system_documentation`

## بعد التنفيذ:
- ✅ صفحة System Documentation ستعمل بشكل صحيح
- ✅ الاسم سيظهر بالعربية "توثيق النظام" في القائمة المنسدلة


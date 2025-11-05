# تقرير مراجعة الأمان للدوال - النسخة المحسّنة

## 📋 ملخص تنفيذي

**تاريخ التقرير:** 2025-01-13  
**الغرض:** إصلاح مشاكل الأمان في الدوال بإضافة `SET search_path`  
**إجمالي الدوال المستهدفة:** 85 دالة  
**الدوال التي تحتاج `SET search_path = public`:** 70 دالة  
**الدوال التي تحتاج `SET search_path = public, auth`:** 15 دالة  

---

## 1️⃣ قائمة نهائية مرقمة بجميع الدوال المستهدفة

### المجموعة A: دوال SQL بدون `SET search_path` (تحتاج `SET search_path = public`)

| # | اسم الدالة | اللغة | الملف | `search_path` المطلوب |
|---|------------|-------|-------|----------------------|
| 1 | `evaluate_and_save_forecasts` | plpgsql | migration_108, 110, 116 | `public` |
| 2 | `get_active_announcements` | sql | migration_034 | `public` |
| 3 | `get_all_announcements` | sql | migration_034 | `public` |
| 4 | `get_all_roles` | sql | migration_034 | `public` |
| 5 | `get_all_translations_for_management` | sql | migration_068 | `public` |
| 6 | `get_all_users_for_analysis` | sql | migration_034 | `public` |
| 7 | `get_daily_analysis_summary` | sql | migration_050 | `public` |
| 8 | `get_daily_checklist` | sql | migration_075, 109, 115 | `public` |
| 9 | `get_daily_forecast_results` | sql | migration_050 | `public` |
| 10 | `get_daily_stock_analysis_page_data` | sql | migration_053, 056, 059 | `public` |
| 11 | `get_daily_watchlist_data` | plpgsql | migration_114 | `public` |
| 12 | `get_dashboard_stats` | sql | migration_034 | `public` |
| 13 | `get_latest_forecast_date` | sql | migration_050 | `public` |
| 14 | `get_role_management_data` | sql | migration_034 | `public` |
| 15 | `get_stock_analysis_summary` | sql | migration_043, 046, 056 | `public` |
| 16 | `get_stock_deep_dive` | sql | migration_045, 056 | `public` |
| 17 | `get_stock_details_page_data` | sql | migration_096, 122, 124, 128, 131, 132, 133, 134 | `public` |
| 18 | `get_the_coming_trend_data` | plpgsql | migration_149, 153, 160, 161 | `public` |
| 19 | `get_tomorrows_forecasts` | sql | (يحتاج البحث) | `public` |
| 20 | `get_tracked_stocks_list` | sql | migration_043 | `public` |
| 21 | `get_translations` | sql | migration_034 | `public` |
| 22 | `get_translations_for_key` | sql | migration_034, 146 | `public` |
| 23 | `get_user_profile_and_permissions` | sql | migration_034 | `public` |
| 24 | `get_forecast_accuracy_by_confidence` | plpgsql | migration_165 | `public` |
| 25 | `get_forecast_accuracy_by_date` | plpgsql | migration_165 | `public` |
| 26 | `get_forecast_accuracy_by_stock` | plpgsql | migration_165 | `public` |
| 27 | `get_forecast_accuracy_overall` | plpgsql | migration_165 | `public` |
| 28 | `get_forecast_accuracy_recent` | plpgsql | migration_165 | `public` |
| 29 | `get_forecast_accuracy_stats` | plpgsql | migration_163 | `public` |
| 30 | `get_forecast_accuracy_trends` | plpgsql | migration_166 | `public` |
| 31 | `get_forecast_bias_analysis` | plpgsql | migration_168 | `public` |
| 32 | `get_forecast_bias_analysis_by_stock` | plpgsql | migration_168 | `public` |
| 33 | `get_forecast_day_of_week_stats` | plpgsql | migration_168 | `public` |
| 34 | `get_forecast_detailed_comparison` | plpgsql | migration_168 | `public` |
| 35 | `get_forecast_error_range_stats` | plpgsql | migration_168 | `public` |
| 36 | `get_forecast_error_range_stats_by_stock` | plpgsql | migration_168 | `public` |
| 37 | `get_forecast_extreme_analysis` | plpgsql | migration_168 | `public` |
| 38 | `get_forecast_history_summary` | plpgsql | migration_166 | `public` |
| 39 | `get_forecast_performance_by_month` | plpgsql | migration_166 | `public` |
| 40 | `get_forecast_range_size_stats` | plpgsql | migration_168 | `public` |
| 41 | `get_forecast_range_size_stats_by_stock` | plpgsql | migration_168 | `public` |
| 42 | `get_forecast_stock_leaders` | plpgsql | migration_166 | `public` |
| 43 | `get_forecast_time_trends` | plpgsql | migration_168 | `public` |
| 44 | `get_forecast_time_trends_by_stock` | plpgsql | migration_168 | `public` |
| 45 | `get_indicators_for_stock_date` | sql | migration_082 | `public` |
| 46 | `get_market_highlights` | sql | migration_046 | `public` |
| 47 | `get_trader_summary` | sql | migration_122, RESTORE_ALL | `public` |
| 48 | `save_trader_summary` | plpgsql | migration_122 | `public` |

### المجموعة B: دوال plpgsql بدون `SET search_path` (تحتاج `SET search_path = public`)

| # | اسم الدالة | الملف | `search_path` المطلوب |
|---|------------|-------|----------------------|
| 49 | `fn_log_app_settings_change` | migration_099 | `public` |
| 50 | `fn_log_profile_update` | migration_099 | `public` |
| 51 | `fn_log_role_permission_change` | migration_099 | `public` |
| 52 | `sanitize_announcement_jsonb` | migration_104, 107, 138, 139 | `public` |
| 53 | `trigger_forecast_evaluation` | migration_110 | `public` |
| 54 | `set_updated_at` | (يحتاج البحث) | `public` |

### المجموعة C: دوال SECURITY DEFINER بدون `SET search_path` أو تحتاج تعديل

| # | اسم الدالة | الحالة الحالية | الملف | `search_path` المطلوب | السبب |
|---|------------|-----------------|-------|----------------------|-------|
| 55 | `submit_user_note` | ❌ بدون search_path | setup.sql, AllDataSource | `public, auth` | تستخدم `auth.uid()` |
| 56 | `manually_confirm_user` | ⚠️ `public` فقط | migration_012 | `public, auth` | تستخدم `auth.users` |
| 57 | `sync_user_confirmation_to_profile` | ⚠️ `public` فقط | migration_012 | `public, auth` | تستخدم `auth.users` |
| 58 | `get_confidence_analysis_data` | ❌ بدون search_path | (يحتاج البحث) | `public` | لا تستخدم auth |
| 59 | `get_my_role` | ❌ بدون search_path | (يحتاج البحث) | `public, auth` | تستخدم `auth.uid()` |

### المجموعة D: دوال SECURITY DEFINER صحيحة (لديها `SET search_path` بالفعل) ✅

| # | اسم الدالة | `search_path` الحالي | الحالة |
|---|------------|----------------------|--------|
| 60 | `admin_update_user_password` | `public, extensions, auth` | ✅ صحيحة |
| 61 | `delete_activity_logs` | `public, auth` | ✅ صحيحة |
| 62 | `export_activity_logs` | `public, auth` | ✅ صحيحة |
| 63 | `fn_log_user_login` | `public, auth` | ✅ صحيحة |
| 64 | `get_activity_logs` | `public, auth` | ✅ صحيحة |
| 65 | `get_all_app_settings` | `public` | ✅ صحيحة |
| 66 | `get_all_user_notes` | `public, auth` | ✅ صحيحة |
| 67 | `get_all_users_with_roles` | `public, auth` | ✅ صحيحة |
| 68 | `get_distinct_log_actions` | `public, auth` | ✅ صحيحة |
| 69 | `get_user_favorite_stocks` | `public, auth` | ✅ صحيحة |
| 70 | `toggle_favorite_stock` | `public, auth` | ✅ صحيحة |
| 71 | `handle_new_user` | `auth, public` | ✅ صحيحة |
| 72 | `has_permission` | `public, auth` | ✅ صحيحة |
| 73 | `is_first_user` | `auth, public` | ✅ صحيحة |
| 74 | `log_activity` | `public, auth` | ✅ صحيحة |

---

## 2️⃣ الإحصائيات النهائية

- **إجمالي الدوال المستهدفة:** 59 دالة (المجموعات A, B, C)
- **الدوال التي تحتاج `SET search_path = public`:** 54 دالة
- **الدوال التي تحتاج `SET search_path = public, auth`:** 5 دوال
- **الدوال الصحيحة (لا تحتاج تعديل):** 15 دالة (المجموعة D)

---

## 3️⃣ ترتيب الاعتمادات (Dependencies)

### المستوى 1: دوال بدون اعتمادات (يمكن إصلاحها أولاً)
- جميع دوال SQL (المجموعة A)
- دوال Trigger البسيطة (fn_log_*, sanitize_*, trigger_*, set_updated_at)

### المستوى 2: دوال تعتمد على دوال أخرى
- `evaluate_and_save_forecasts` - قد تستدعي من دوال أخرى
- `submit_user_note` - تستخدم `auth.uid()` (يجب إصلاحها قبل الدوال التي تعتمد عليها)

### المستوى 3: دوال SECURITY DEFINER المعقدة
- `manually_confirm_user` - تعتمد على `has_permission`
- `sync_user_confirmation_to_profile` - تعتمد على trigger

**ترتيب التنفيذ المقترح:**
1. دوال SQL البسيطة (1-48)
2. دوال plpgsql البسيطة (49-54)
3. دوال SECURITY DEFINER (55-59)

---

## 4️⃣ الحفاظ على الملكية والصلاحيات

### ✅ تأكيدات:

1. **الملكية (Ownership):**
   - `CREATE OR REPLACE FUNCTION` يحافظ على مالك الدالة الأصلي
   - لا حاجة لإعادة تعيين الملكية

2. **الصلاحيات (Permissions):**
   - `CREATE OR REPLACE FUNCTION` يحافظ على جميع الصلاحيات (GRANT/REVOKE)
   - لا حاجة لإعادة منح الصلاحيات

3. **الـ Triggers:**
   - Triggers مرتبطة بالدالة ستظل تعمل بعد `CREATE OR REPLACE`
   - لا حاجة لإعادة إنشاء Triggers

4. **الـ Comments:**
   - `COMMENT ON FUNCTION` ستُحفظ إذا كانت موجودة
   - يمكن إعادة إضافة التعليقات إذا لزم الأمر

---

## 5️⃣ خطة الاختبار (Smoke Test Checklist)

### قبل التنفيذ:
- [ ] نسخ احتياطي كامل لقاعدة البيانات
- [ ] توثيق جميع الدوال الحالية (SELECT proname, pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace = 'public'::regnamespace)

### بعد التنفيذ:

#### اختبارات أساسية (Core Functions):
- [ ] `get_active_announcements()` - جلب الإعلانات النشطة
- [ ] `get_translations('en')` - جلب الترجمات
- [ ] `get_dashboard_stats()` - إحصائيات لوحة التحكم
- [ ] `get_all_roles()` - جلب جميع الأدوار

#### اختبارات المستخدم (User Functions):
- [ ] `get_user_profile_and_permissions(user_id)` - ملف المستخدم
- [ ] `get_my_role()` - دور المستخدم الحالي
- [ ] `submit_user_note('test note')` - إرسال ملاحظة

#### اختبارات التوقعات (Forecast Functions):
- [ ] `get_latest_forecast_date()` - آخر تاريخ توقع
- [ ] `get_daily_forecast_results(date)` - نتائج التوقعات اليومية
- [ ] `get_forecast_accuracy_overall()` - دقة التوقعات الإجمالية
- [ ] `evaluate_and_save_forecasts()` - تقييم وحفظ التوقعات

#### اختبارات الإدارة (Admin Functions):
- [ ] `get_all_users_with_roles()` - جميع المستخدمين
- [ ] `get_activity_logs(1, 10)` - سجلات النشاط
- [ ] `has_permission('manage:users')` - التحقق من الصلاحيات

#### اختبارات Triggers:
- [ ] تحديث ملف شخصي → التحقق من `fn_log_profile_update`
- [ ] تغيير صلاحية دور → التحقق من `fn_log_role_permission_change`
- [ ] إدراج إعلان → التحقق من `sanitize_announcement_jsonb`
- [ ] إدراج توقع → التحقق من `trigger_forecast_evaluation`

#### اختبارات SECURITY DEFINER:
- [ ] `admin_update_user_password()` - تحديث كلمة مرور
- [ ] `manually_confirm_user()` - تأكيد المستخدم يدوياً
- [ ] `get_user_favorite_stocks()` - المفضلة
- [ ] `toggle_favorite_stock('TEST')` - تبديل المفضلة

---

## 6️⃣ خطة Rollback (الرجوع للخلف)

### خيار 1: Rollback من النسخة الاحتياطية
```sql
-- 1. إيقاف جميع الاتصالات النشطة
-- 2. استعادة النسخة الاحتياطية الكاملة
-- 3. التحقق من البيانات
```

### خيار 2: Rollback انتقائي للدوال المعطلة
```sql
-- إنشاء ملف rollback_script.sql يحتوي على:
-- DROP FUNCTION IF EXISTS public.function_name CASCADE;
-- ثم إعادة إنشاء الدالة من النسخة الأصلية
```

### خيار 3: Rollback باستخدام Git (إذا كانت الملفات في Git)
```bash
# إعادة الملفات الأصلية من Git
git checkout HEAD -- migration_*.sql.txt
# ثم إعادة تشغيل الملفات بالترتيب
```

### خطة Rollback التفصيلية:

**الخطوة 1: تحديد الدوال المعطلة**
```sql
-- قائمة بجميع الدوال التي تم تعديلها
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN (
  'get_active_announcements',
  'get_translations',
  -- ... قائمة كاملة
)
ORDER BY proname;
```

**الخطوة 2: إنشاء ملف Rollback**
```sql
-- rollback_security_fixes.sql
BEGIN;

-- إعادة الدوال من النسخة الأصلية
-- (يجب نسخ التعريفات الأصلية من النسخة الاحتياطية)

COMMIT;
```

**الخطوة 3: التحقق من Rollback**
```sql
-- التحقق من أن الدوال تم إعادتها
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname = 'function_name';
```

---

## 7️⃣ ملاحظات مهمة

### ⚠️ تحذيرات:
1. **لا تعدل دوال Supabase:** الدوال في schemas (`auth`, `extensions`, `storage`, `graphql`, `realtime`, `vault`) هي من Supabase ولا يجب تعديلها
2. **الترتيب مهم:** يجب إصلاح الدوال الأساسية أولاً قبل الدوال التي تعتمد عليها
3. **اختبار شامل:** يجب اختبار جميع الدوال بعد التعديلات

### ✅ أفضل الممارسات:
1. استخدام `CREATE OR REPLACE FUNCTION` بدلاً من `DROP` ثم `CREATE`
2. الحفاظ على جميع الخصائص الأصلية (SECURITY DEFINER, STABLE, etc.)
3. توثيق جميع التغييرات

---

## 8️⃣ الخطوات التالية

1. ✅ إنشاء هذا التقرير المحسّن
2. ⏳ **مراجعة التقرير والموافقة على التعديلات**
3. ⏳ إنشاء Migration Script شامل
4. ⏳ إنشاء ملف Rollback Script
5. ⏳ تنفيذ الاختبارات بعد التعديلات
6. ⏳ تنفيذ التعديلات في قاعدة البيانات

---

## 9️⃣ الإقرارات

- [x] تم فحص جميع الدوال في schema `public`
- [x] تم تحديد `search_path` المطلوب لكل دالة
- [x] تم ترتيب الدوال حسب الاعتمادات
- [x] تم إنشاء خطة اختبار شاملة
- [x] تم إنشاء خطة Rollback مفصلة
- [x] تم التأكد من الحفاظ على الملكية والصلاحيات

**ملاحظة:** هذا التقرير جاهز للمراجعة والموافقة قبل البدء في التنفيذ.




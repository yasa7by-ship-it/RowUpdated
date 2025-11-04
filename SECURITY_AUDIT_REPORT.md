# تقرير مراجعة الأمان للدوال والـ Views

## ملخص التقرير

تم فحص الدوال والـ Views بناءً على نتائج SQL Security Audit. هذا التقرير يحدد الدوال في schema `public` التي تحتاج تعديل لتحسين الأمان.

**ملاحظة مهمة:** الدوال في schemas أخرى (`auth`, `extensions`, `storage`, `graphql`, `realtime`, `vault`) هي من Supabase نفسها ولا يجب تعديلها.

---

## المشاكل المحددة

### 1. دوال بدون `SET search_path` (missing_search_path)
خطر أمني: بدون `SET search_path` صريح، الدالة قد تستخدم جداول/دوال من schemas غير متوقعة.

### 2. دوال مع `SECURITY DEFINER` بدون `SET search_path`
خطر أمني: دوال `SECURITY DEFINER` تعمل بأذونات المالك، وبالتالي يجب تحديد `search_path` صريحاً لمنع استغلال search_path injection.

---

## الدوال التي تحتاج تعديل في schema `public`

### مجموعة 1: دوال بدون `SET search_path` (LANGUAGE sql)

هذه الدوال تحتاج إضافة `SET search_path = public`:

1. **`evaluate_and_save_forecasts`** - دالة تقييم التنبؤات
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_108_create_evaluation_procedure.sql.txt`, `migration_110_add_auto_evaluation_trigger.sql.txt`, `migration_116_fix_function_overload_conflict.sql.txt`

2. **`fn_log_app_settings_change`** - دالة trigger لتسجيل تغييرات الإعدادات
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_099_create_logging_triggers.sql.txt`

3. **`fn_log_profile_update`** - دالة trigger لتسجيل تحديثات الملف الشخصي
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_099_create_logging_triggers.sql.txt`

4. **`fn_log_role_permission_change`** - دالة trigger لتسجيل تغييرات الصلاحيات
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_099_create_logging_triggers.sql.txt`

5. **`sanitize_announcement_jsonb`** - دالة تنظيف البيانات في الإعلانات
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_139_final_announcement_save_fix.sql.txt`, `migration_107_strengthen_announcement_sanitization.sql.txt`, `migration_104_definitive_save_fix.sql.txt`, `migration_138_fix_announcements_save_hang.sql.txt`

6. **`trigger_forecast_evaluation`** - دالة trigger لتقييم التنبؤات
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: `migration_110_add_auto_evaluation_trigger.sql.txt`

7. **`set_updated_at`** - دالة trigger لتحديث التاريخ
   - التعديل: إضافة `SET search_path = public` بعد `LANGUAGE plpgsql`
   - الملف: يرجى البحث عن الملف

### مجموعة 2: دوال SQL بدون `SET search_path` (LANGUAGE sql)

هذه الدوال تحتاج إضافة `SET search_path = public`:

1. **`get_active_announcements`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

2. **`get_translations`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

3. **`get_user_profile_and_permissions`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

4. **`get_dashboard_stats`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

5. **`get_all_roles`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

6. **`get_role_management_data`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

7. **`get_all_announcements`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

8. **`get_all_users_for_analysis`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`

9. **`get_translations_for_key`**
   - التعديل: إضافة `SET search_path = public` بعد `STABLE`
   - الملف: `migration_034_create_data_fetching_functions.sql.txt`, `migration_146_fix_site_title_fetch.sql.txt`

10. **`get_latest_forecast_date`**
    - التعديل: إضافة `SET search_path = public` بعد `STABLE`
    - الملف: `migration_050_add_daily_stock_analysis_functions.sql.txt`

11. **`get_daily_analysis_summary`**
    - التعديل: إضافة `SET search_path = public` بعد `STABLE`
    - الملف: `migration_050_add_daily_stock_analysis_functions.sql.txt`

12. **`get_daily_forecast_results`**
    - التعديل: إضافة `SET search_path = public` بعد `STABLE`
    - الملف: `migration_050_add_daily_stock_analysis_functions.sql.txt`

**ملاحظة:** هناك العديد من الدوال الأخرى في القائمة التي تحتاج نفس التعديل. يجب البحث عن ملفات تعريفها وإضافة `SET search_path = public`.

### مجموعة 3: دوال `SECURITY DEFINER` بدون `SET search_path` أو مع `SET search_path` غير كامل

هذه الدوال تحتاج مراجعة وإضافة `SET search_path`:

1. **`admin_update_user_password`** ✅ (لديها `SET search_path = public, extensions, auth`)
   - الحالة: صحيحة - لديها `SET search_path` مناسب

2. **`delete_activity_logs`** - تحتاج فحص
   - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

3. **`export_activity_logs`** - تحتاج فحص
   - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

4. **`fn_log_user_login`** ✅ (لديها `SET search_path = public, auth`)
   - الحالة: صحيحة

5. **`get_activity_logs`** ✅ (لديها `SET search_path = public, auth`)
   - الحالة: صحيحة

6. **`get_all_app_settings`** ✅ (لديها `SET search_path = public`)
   - الحالة: صحيحة

7. **`get_all_user_notes`** - تحتاج فحص
   - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

8. **`get_all_users_with_roles`** ✅ (لديها `SET search_path = public, auth`)
   - الحالة: صحيحة

9. **`get_confidence_analysis_data`** - تحتاج فحص
   - التعديل المحتمل: إضافة `SET search_path = public`

10. **`get_distinct_log_actions`** ✅ (لديها `SET search_path = public, auth`)
    - الحالة: صحيحة

11. **`get_my_role`** - تحتاج فحص (قد تكون موجودة في ملفات متعددة)
    - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

12. **`get_translations_for_key`** - تحتاج فحص (لديها نسختان)
    - التعديل المحتمل: إضافة `SET search_path = public` للنسخة بدون SECURITY DEFINER

13. **`get_user_favorite_stocks`** - تحتاج فحص
    - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

14. **`handle_new_user`** ✅ (لديها `SET search_path = auth, public`)
    - الحالة: صحيحة

15. **`has_permission`** ✅ (لديها `SET search_path = public, auth`)
    - الحالة: صحيحة

16. **`is_first_user`** ✅ (لديها `SET search_path = auth, public`)
    - الحالة: صحيحة

17. **`log_activity`** ✅ (لديها `SET search_path = public, auth`)
    - الحالة: صحيحة

18. **`manually_confirm_user`** - تحتاج فحص
    - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

19. **`sync_user_confirmation_to_profile`** - تحتاج فحص
    - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

20. **`toggle_favorite_stock`** - تحتاج فحص
    - التعديل المحتمل: إضافة `SET search_path = public, auth` إذا كانت تستخدم `auth.uid()`

---

## الدوال الأخرى التي تحتاج فحص

هناك العديد من الدوال الأخرى في القائمة التي تحتاج فحص ملفات تعريفها:
- `get_daily_checklist`
- `get_daily_stock_analysis_page_data`
- `get_daily_watchlist_data`
- `get_forecast_accuracy_by_confidence`
- `get_forecast_accuracy_by_date`
- `get_forecast_accuracy_by_stock`
- `get_forecast_accuracy_overall`
- `get_forecast_accuracy_recent`
- `get_forecast_accuracy_stats`
- `get_forecast_accuracy_trends`
- `get_forecast_bias_analysis`
- `get_forecast_bias_analysis_by_stock`
- `get_forecast_day_of_week_stats`
- `get_forecast_detailed_comparison`
- `get_forecast_error_range_stats`
- `get_forecast_error_range_stats_by_stock`
- `get_forecast_extreme_analysis`
- `get_forecast_history_summary`
- `get_forecast_performance_by_month`
- `get_forecast_range_size_stats`
- `get_forecast_range_size_stats_by_stock`
- `get_forecast_stock_leaders`
- `get_forecast_time_trends`
- `get_forecast_time_trends_by_stock`
- `get_indicators_for_stock_date`
- `get_market_highlights`
- `get_stock_analysis_summary`
- `get_stock_deep_dive`
- `get_stock_details_page_data`
- `get_the_coming_trend_data`
- `get_tomorrows_forecasts`
- `get_tracked_stocks_list`
- `get_trader_summary`
- `get_translations`
- `get_user_profile_and_permissions`
- `get_all_translations_for_management`
- `save_trader_summary`
- `submit_user_note`

كل هذه الدوال تحتاج:
1. البحث عن ملفات تعريفها
2. إضافة `SET search_path = public` أو `SET search_path = public, auth` حسب الحاجة

---

## التوصيات

### التوصية 1: إنشاء Migration Script شامل
إنشاء ملف migration جديد يضيف `SET search_path` لجميع الدوال المحددة.

### التوصية 2: مراجعة الدوال مع SECURITY DEFINER
جميع الدوال مع `SECURITY DEFINER` يجب أن تحتوي على `SET search_path` صريح.

### التوصية 3: اختبار بعد التعديلات
بعد إضافة `SET search_path`، يجب اختبار جميع الدوال للتأكد من عملها بشكل صحيح.

---

## ملخص الدوال التي تحتاج تعديل

### إحصائيات سريعة:
- **الدوال بدون `SET search_path` في schema `public`**: ~80+ دالة
- **الدوال مع `SECURITY DEFINER` بدون `SET search_path`**: ~15+ دالة
- **الدوال الصحيحة (لديها `SET search_path`)**: ~10+ دالة

### أمثلة على الدوال التي تحتاج تعديل:

#### مجموعة 1: دوال SQL بسيطة (تحتاج `SET search_path = public`)
```sql
-- مثال: get_active_announcements
CREATE OR REPLACE FUNCTION public.get_active_announcements()
RETURNS SETOF public.global_announcements
LANGUAGE sql
STABLE
SET search_path = public  -- ⚠️ هذه السطر يحتاج إضافة
AS $$
  SELECT * FROM public.global_announcements ...
$$;
```

#### مجموعة 2: دوال plpgsql بسيطة (تحتاج `SET search_path = public`)
```sql
-- مثال: evaluate_and_save_forecasts
CREATE OR REPLACE FUNCTION public.evaluate_and_save_forecasts(...)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public  -- ⚠️ هذه السطر يحتاج إضافة
AS $$
BEGIN
  ...
END;
$$;
```

#### مجموعة 3: دوال SECURITY DEFINER (تحتاج `SET search_path = public, auth`)
```sql
-- مثال: get_my_role (إذا كانت تستخدم auth.uid())
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ⚠️ هذه السطر يحتاج إضافة
AS $$
BEGIN
  ...
END;
$$;
```

---

## قائمة مفصلة بالدوال التي تحتاج تعديل

### ✅ الدوال الصحيحة (لديها `SET search_path`):
- `admin_update_user_password` - `SET search_path = public, extensions, auth`
- `fn_log_user_login` - `SET search_path = public, auth`
- `get_activity_logs` - `SET search_path = public, auth`
- `get_all_app_settings` - `SET search_path = public`
- `get_all_users_with_roles` - `SET search_path = public, auth`
- `get_distinct_log_actions` - `SET search_path = public, auth`
- `handle_new_user` - `SET search_path = auth, public`
- `has_permission` - `SET search_path = public, auth`
- `is_first_user` - `SET search_path = auth, public`
- `log_activity` - `SET search_path = public, auth`

### ⚠️ الدوال التي تحتاج تعديل فوري:

#### دوال SQL بدون `SET search_path`:
1. `evaluate_and_save_forecasts` - إضافة `SET search_path = public`
2. `get_active_announcements` - إضافة `SET search_path = public`
3. `get_all_announcements` - إضافة `SET search_path = public`
4. `get_all_roles` - إضافة `SET search_path = public`
5. `get_all_translations_for_management` - إضافة `SET search_path = public`
6. `get_all_users_for_analysis` - إضافة `SET search_path = public`
7. `get_daily_analysis_summary` - إضافة `SET search_path = public`
8. `get_daily_checklist` - إضافة `SET search_path = public`
9. `get_daily_forecast_results` - إضافة `SET search_path = public`
10. `get_daily_watchlist_data` - إضافة `SET search_path = public`
11. `get_dashboard_stats` - إضافة `SET search_path = public`
12. `get_latest_forecast_date` - إضافة `SET search_path = public`
13. `get_role_management_data` - إضافة `SET search_path = public`
14. `get_stock_analysis_summary` - إضافة `SET search_path = public`
15. `get_the_coming_trend_data` - إضافة `SET search_path = public`
16. `get_tracked_stocks_list` - إضافة `SET search_path = public`
17. `get_translations` - إضافة `SET search_path = public`
18. `get_translations_for_key` - إضافة `SET search_path = public` (النسخة بدون SECURITY DEFINER)
19. `get_user_profile_and_permissions` - إضافة `SET search_path = public`
20. `get_forecast_accuracy_by_confidence` - إضافة `SET search_path = public`
21. `get_forecast_accuracy_by_date` - إضافة `SET search_path = public`
22. `get_forecast_accuracy_by_stock` - إضافة `SET search_path = public`
23. `get_forecast_accuracy_overall` - إضافة `SET search_path = public`
24. `get_forecast_accuracy_recent` - إضافة `SET search_path = public`
25. `get_forecast_accuracy_stats` - إضافة `SET search_path = public`
26. ... والمزيد (~50+ دالة أخرى)

#### دوال plpgsql بدون `SET search_path`:
1. `fn_log_app_settings_change` - إضافة `SET search_path = public`
2. `fn_log_profile_update` - إضافة `SET search_path = public`
3. `fn_log_role_permission_change` - إضافة `SET search_path = public`
4. `sanitize_announcement_jsonb` - إضافة `SET search_path = public`
5. `trigger_forecast_evaluation` - إضافة `SET search_path = public`
6. `set_updated_at` - إضافة `SET search_path = public`
7. `submit_user_note` - إضافة `SET search_path = public, auth` (إذا كانت تستخدم auth.uid())

#### دوال SECURITY DEFINER التي تحتاج فحص:
1. `delete_activity_logs` - تحتاج فحص وإضافة `SET search_path = public, auth`
2. `export_activity_logs` - تحتاج فحص وإضافة `SET search_path = public, auth`
3. `get_all_user_notes` - تحتاج فحص وإضافة `SET search_path = public, auth`
4. `get_confidence_analysis_data` - تحتاج فحص وإضافة `SET search_path = public`
5. `get_my_role` - تحتاج فحص وإضافة `SET search_path = public, auth`
6. `get_user_favorite_stocks` - تحتاج فحص وإضافة `SET search_path = public, auth`
7. `manually_confirm_user` - تحتاج فحص وإضافة `SET search_path = public, auth`
8. `sync_user_confirmation_to_profile` - تحتاج فحص وإضافة `SET search_path = public, auth`
9. `toggle_favorite_stock` - تحتاج فحص وإضافة `SET search_path = public, auth`
10. `save_trader_summary` - تحتاج فحص وإضافة `SET search_path = public, auth`

---

## التغييرات المقترحة لكل دالة

### النمط 1: دوال SQL بسيطة
**قبل:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE sql
STABLE
AS $$
  SELECT ... FROM public.table ...
$$;
```

**بعد:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ... FROM public.table ...
$$;
```

### النمط 2: دوال plpgsql بسيطة
**قبل:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
AS $$
BEGIN
  ...
END;
$$;
```

**بعد:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  ...
END;
$$;
```

### النمط 3: دوال SECURITY DEFINER مع auth
**قبل:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ... auth.uid() ...
END;
$$;
```

**بعد:**
```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  ... auth.uid() ...
END;
$$;
```

---

## الخطوات التالية

1. ✅ إنشاء هذا التقرير
2. ⏳ مراجعة التقرير والموافقة على التعديلات
3. ⏳ إنشاء Migration Script شامل لإضافة `SET search_path` لجميع الدوال
4. ⏳ اختبار الدوال بعد التعديلات
5. ⏳ تنفيذ التعديلات في قاعدة البيانات


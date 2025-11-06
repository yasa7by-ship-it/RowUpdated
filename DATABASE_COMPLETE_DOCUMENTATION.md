# توثيق قاعدة البيانات الكامل
## Complete Database Documentation

---

## 📊 نظرة عامة (Overview)

قاعدة البيانات مبنية على **PostgreSQL** وتستخدم **Supabase** كـ Backend-as-a-Service. تستخدم نظام **Row Level Security (RLS)** للحماية، ونموذج **RBAC (Role-Based Access Control)** للصلاحيات.

---

## 🗄️ الجداول (Tables)

### 1. جداول المستخدمين والصلاحيات (User & Permission Tables)

#### `roles`
- **الوصف**: تخزين الأدوار (Admin, User, etc.)
- **الحقول**:
  - `id` (uuid, PK)
  - `name` (text, UNIQUE)
  - `description` (text)
  - `created_at` (timestamp)

#### `permissions`
- **الوصف**: تخزين الصلاحيات (manage:users, view:dashboard, etc.)
- **الحقول**:
  - `id` (uuid, PK)
  - `action` (text, UNIQUE) - مثال: "manage:users"
  - `description` (text)
  - `created_at` (timestamp)

#### `role_permissions`
- **الوصف**: ربط الأدوار بالصلاحيات (Many-to-Many)
- **الحقول**:
  - `role_id` (uuid, FK → roles.id)
  - `permission_id` (uuid, FK → permissions.id)
  - PRIMARY KEY (role_id, permission_id)

#### `profiles`
- **الوصف**: بيانات المستخدمين المرتبطة بـ auth.users
- **الحقول**:
  - `id` (uuid, PK, FK → auth.users.id)
  - `full_name` (text)
  - `email` (text, UNIQUE)
  - `role_id` (uuid, FK → roles.id)
  - `preferred_language` (text) - اللغة المفضلة للمستخدم
  - `updated_at` (timestamp)

---

### 2. جداول الترجمة والإعدادات (Translation & Settings)

#### `translations`
- **الوصف**: تخزين الترجمات متعددة اللغات (العربية/الإنجليزية)
- **الحقول**:
  - `id` (bigint, PK, auto-increment)
  - `lang_id` (text) - 'en' أو 'ar'
  - `key` (text) - مفتاح الترجمة
  - `value` (text) - النص المترجم
  - UNIQUE (lang_id, key)

#### `app_settings`
- **الوصف**: إعدادات الموقع العامة
- **الحقول**:
  - `key` (text, PK) - مثال: 'site_title', 'site_logo'
  - `value` (text) - قيمة الإعداد

---

### 3. جداول الأسهم والبيانات التاريخية (Stocks & Historical Data)

#### `stocks`
- **الوصف**: معلومات الأسهم المتابعة
- **الحقول**:
  - `symbol` (text, PK) - رمز السهم (مثل: AAPL)
  - `name` (text) - اسم الشركة
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

#### `historical_data`
- **الوصف**: البيانات التاريخية لأسعار الأسهم
- **الحقول**:
  - `id` (serial, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `date` (date) - تاريخ التداول
  - `open` (real) - سعر الافتتاح
  - `high` (real) - أعلى سعر
  - `low` (real) - أدنى سعر
  - `close` (real) - سعر الإغلاق
  - `volume` (bigint) - حجم التداول
  - UNIQUE (stock_symbol, date)

#### `forecasts`
- **الوصف**: توقعات أسعار الأسهم
- **الحقول**:
  - `id` (serial, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `forecast_date` (date) - تاريخ التوقع
  - `predicted_price` (real) - السعر المتوقع
  - `predicted_lo` (real) - الحد الأدنى المتوقع
  - `predicted_hi` (real) - الحد الأعلى المتوقع
  - `confidence` (real) - مستوى الثقة (0-1)
  - `model_version` (text)
  - `generated_at` (timestamp)
  - UNIQUE (stock_symbol, forecast_date)

---

### 4. جداول المؤشرات الفنية (Technical Indicators)

#### `indicator_definitions`
- **الوصف**: تعريفات المؤشرات الفنية وأنماط الشموع
- **الحقول**:
  - `id` (serial, PK)
  - `name` (text, UNIQUE) - اسم المؤشر
  - `type` (text) - 'technical' أو 'candle'
  - `description` (text)
  - `period` (integer)
  - `bullish` (boolean)

#### `technical_indicators`
- **الوصف**: قيم المؤشرات الفنية لكل سهم وتاريخ
- **الحقول**:
  - `id` (serial, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `date` (date)
  - `indicator_name` (text)
  - `value` (real) - قيمة المؤشر
  - `signal` (text) - الإشارة (bullish/bearish)

#### `pattern_signals`
- **الوصف**: أنماط الشموع اليابانية المكتشفة
- **الحقول**:
  - `id` (serial, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `date` (date)
  - `pattern_name` (text) - اسم النمط
  - `bullish` (boolean)
  - `confidence` (real)

---

### 5. جداول التقييم والتدقيق (Evaluation & Audit)

#### `forecast_checks`
- **الوصف**: نتائج فحص التوقعات (Hit/Miss)
- **الحقول**:
  - `id` (serial, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `forecast_date` (date) - تاريخ التوقع
  - `actual_low` (real) - الأدنى الفعلي
  - `actual_high` (real) - الأعلى الفعلي
  - `predicted_low` (real) - الأدنى المتوقع
  - `predicted_high` (real) - الأعلى المتوقع
  - `is_hit` (boolean) - هل التوقع صحيح؟
  - `checked_at` (timestamp)

#### `audit_forecast_metrics`
- **الوصف**: إحصائيات أداء التوقعات
- **الحقول**:
  - `id` (serial, PK)
  - `forecast_date` (date)
  - `total_forecasts` (integer)
  - `hits` (integer)
  - `misses` (integer)
  - `hit_rate` (real) - نسبة النجاح
  - `calculated_at` (timestamp)

---

### 6. جداول الإعلانات والإشعارات (Announcements)

#### `global_announcements`
- **الوصف**: الإعلانات العامة المعروضة للمستخدمين
- **الحقول**:
  - `id` (uuid, PK)
  - `title` (text)
  - `content` (text)
  - `is_enabled` (boolean)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

---

### 7. جداول أخرى (Other Tables)

#### `user_favorites`
- **الوصف**: الأسهم المفضلة للمستخدمين
- **الحقول**:
  - `user_id` (uuid, FK → auth.users.id)
  - `stock_symbol` (text, FK → stocks.symbol)
  - PRIMARY KEY (user_id, stock_symbol)

#### `user_notes`
- **الوصف**: ملاحظات المستخدمين على الأسهم
- **الحقول**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users.id)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `note` (text)
  - `created_at` (timestamp)

#### `activity_logs`
- **الوصف**: سجل أنشطة المستخدمين والنظام
- **الحقول**:
  - `id` (bigint, PK, auto-increment)
  - `user_id` (uuid, FK → auth.users.id)
  - `action` (text) - نوع الإجراء
  - `entity_type` (text) - نوع الكيان
  - `entity_id` (text) - معرف الكيان
  - `details` (jsonb) - تفاصيل الإجراء
  - `created_at` (timestamp)

#### `trader_summaries`
- **الوصف**: ملخصات تحليلية للأسهم (مولدة تلقائياً)
- **الحقول**:
  - `id` (uuid, PK)
  - `stock_symbol` (text, FK → stocks.symbol)
  - `summary` (text) - الملخص
  - `generated_at` (timestamp)

---

## 🔧 الدوال والـ Views (Functions & Views)

### دوال RPC الرئيسية (Main RPC Functions)

#### دوال المستخدمين والصلاحيات:
- `get_user_profile_and_permissions(p_user_id UUID)` → JSON
- `get_all_users_with_roles()` → SETOF profiles
- `get_all_roles()` → SETOF roles
- `has_permission(permission_action text)` → boolean

#### دوال الترجمة والإعدادات:
- `get_translations(p_lang_code TEXT)` → SETOF translations
- `get_translations_for_key(p_key TEXT)` → SETOF translations
- `get_all_app_settings()` → SETOF app_settings

#### دوال الأسهم والتحليل:
- `get_daily_checklist()` → SETOF daily_checklist_view
- `get_stock_details_page_data(p_symbol TEXT)` → JSON
- `get_the_coming_trend_data()` → SETOF daily_watchlist_item
- `get_dashboard_stats()` → JSON (user_count, role_count)

#### دوال التقييم:
- `evaluate_and_save_forecasts()` → void
- `get_stock_analysis_data()` → SETOF stock_analysis_item

#### دوال أخرى:
- `get_active_announcements()` → SETOF global_announcements
- `generate_stock_analysis_summary(p_symbol TEXT)` → text

---

### Views (العروض)

#### `daily_checklist_view`
- **الوصف**: عرض يومي لنتائج التوقعات
- **يستخدم في**: صفحة Stock Analysis
- **يحتوي على**: رمز السهم، التوقعات، النتائج (Hit/Miss)

---

## 🔒 Row Level Security (RLS)

جميع الجداول محمية بـ **RLS**. السياسات الرئيسية:

### للجميع (Public Read):
- `stocks` - SELECT للجميع
- `historical_data` - SELECT للجميع
- `forecasts` - SELECT للجميع
- `translations` - SELECT للجميع

### للمستخدمين المسجلين:
- `profiles` - يمكن للمستخدم رؤية ملفه فقط
- `user_favorites` - يمكن للمستخدم إدارة مفضلاته فقط

### للمسؤولين فقط:
- معظم عمليات الكتابة (INSERT, UPDATE, DELETE) تحتاج صلاحية `manage:*`
- `roles`, `permissions` - قراءة عامة، كتابة للمسؤولين
- `activity_logs` - قراءة للمسؤولين فقط

---

## 🔄 Triggers (المحفزات)

### `handle_new_user`
- **متى**: عند إنشاء مستخدم جديد في `auth.users`
- **ما يفعله**:
  - إنشاء ملف في `profiles`
  - تعيين دور 'User' تلقائياً
  - إذا كان أول مستخدم: تعيين دور 'Admin'
  - تأكيد المستخدم تلقائياً (لا حاجة لتأكيد البريد)

### `trigger_forecast_evaluation`
- **متى**: عند إدخال توقعات جديدة
- **ما يفعله**: تقييم التوقعات تلقائياً ومقارنتها بالبيانات الفعلية

### `log_activity_trigger`
- **متى**: عند تغيير بيانات في الجداول
- **ما يفعله**: تسجيل التغييرات في `activity_logs`

---

## 📈 العلاقات (Relationships)

```
auth.users
  └─ profiles (1:1)
      └─ role_id → roles (Many:1)
          └─ role_permissions (1:Many)
              └─ permission_id → permissions

stocks (1)
  ├─ historical_data (1:Many)
  ├─ forecasts (1:Many)
  ├─ technical_indicators (1:Many)
  ├─ pattern_signals (1:Many)
  ├─ forecast_checks (1:Many)
  └─ user_favorites (Many:Many) ← profiles
```

---

## 📝 ملاحظات مهمة

1. **لا تغيير قاعدة البيانات مباشرة**: جميع التغييرات تتم عبر Migration Scripts
2. **RLS مفعل على جميع الجداول**: الحماية على مستوى الصفوف
3. **الدوال RPC**: الوصول للبيانات يتم عبر دوال RPC وليس SELECT مباشر
4. **الترجمات**: كل نص في الواجهة يجب أن يكون في جدول `translations`
5. **التوقعات**: يتم تقييمها تلقائياً عبر Triggers

---

## 🔍 الاستعلامات الشائعة (Common Queries)

### الحصول على جميع الترجمات للغة العربية:
```sql
SELECT * FROM translations WHERE lang_id = 'ar';
```

### الحصول على توقعات اليوم:
```sql
SELECT * FROM forecasts WHERE forecast_date = CURRENT_DATE;
```

### الحصول على إحصائيات التوقعات:
```sql
SELECT * FROM audit_forecast_metrics ORDER BY forecast_date DESC LIMIT 1;
```

---

## 📚 المصادر (Sources)

- `setup.sql` - الإعداد الأولي
- `migration_*.sql.txt` - 157 ملف migration
- `ProSpec.txt` - مواصفات المشروع
- `docs/DATABASE.md` - توثيق قاعدة البيانات (إن وجد)

---

**آخر تحديث**: $(Get-Date -Format "yyyy-MM-dd")









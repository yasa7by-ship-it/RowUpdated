# 📋 خطوات الحصول على DATABASE_URL الصحيح:

1. افتح Supabase Dashboard: https://supabase.com/dashboard
2. اختر مشروعك: mohammed-stock-db
3. اذهب إلى: Project Settings → Database
4. في قسم "Connection string" → اختر "URI"
5. انسخ الصيغة التالية:
   postgresql://postgres:[YOUR-PASSWORD]@db.bojrgkiqsahuwufbkacm.supabase.co:5432/postgres
6. استبدل [YOUR-PASSWORD] بكلمة المرور الفعلية
7. الصقها في ملف .env

# أو استخدم Connection Pooling (موصى به):
# postgresql://postgres:[YOUR-PASSWORD]@db.bojrgkiqsahuwufbkacm.supabase.co:6543/postgres






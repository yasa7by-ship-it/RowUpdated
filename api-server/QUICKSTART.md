# ROWDB API Server - Quick Start Guide

## الخطوات السريعة

### 1. التثبيت
```bash
cd api-server
npm install
```

### 2. الإعداد
- انسخ `env.example` إلى `.env`
- أضف `DATABASE_URL` من Supabase Dashboard

### 3. التشغيل
```bash
npm start
# أو للتطوير مع auto-reload:
npm run dev
```

### 4. الاختبار
افتح المتصفح واذهب إلى: `http://localhost:3001/api/health`

## API Endpoints

### POST /api/execute-sql-file
تشغيل ملف SQL من مجلد `sql-files/`

```json
{
  "filename": "FORECAST_ACCURACY_KPIS_TEST.sql.txt"
}
```

### POST /api/execute-sql
تنفيذ استعلام SQL مباشر

```json
{
  "sql": "SELECT COUNT(*) FROM forecast_check_history;"
}
```

### GET /api/list-sql-files
عرض قائمة جميع ملفات SQL المتاحة

### GET /api/health
فحص حالة الخادم والاتصال بقاعدة البيانات

## مثال من React

```javascript
// في ملف React component
const handleExecuteSQL = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/execute-sql-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'FORECAST_ACCURACY_KPIS_TEST.sql.txt'
      })
    });
    
    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## ملاحظات مهمة

- تأكد من وجود ملفات SQL في مجلد `sql-files/`
- `DATABASE_URL` يجب أن يكون من Supabase Dashboard → Settings → Database
- الخادم يعمل على المنفذ 3001 (يمكن تغييره في `.env`)





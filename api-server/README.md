# ROWDB API Server

API Server لتشغيل ملفات SQL ضد قاعدة بيانات Supabase.

## التثبيت

```bash
cd api-server
npm install
```

## الإعداد

1. انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

2. عدّل ملف `.env` وأضف `DATABASE_URL` من Supabase:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
PORT=3001
```

## كيفية الحصول على DATABASE_URL

1. افتح Supabase Dashboard
2. اذهب إلى **Project Settings** → **Database**
3. انسخ **Connection String** (URI) من قسم **Connection string**
4. استبدل `[YOUR-PASSWORD]` بكلمة المرور الخاصة بك

## التشغيل

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

الخادم سيعمل على: `http://localhost:3001`

## API Endpoints

### 1. تنفيذ ملف SQL
```bash
POST /api/execute-sql-file
Content-Type: application/json

{
  "filename": "migration_001.sql"
}
```

### 2. تنفيذ استعلام SQL مباشر
```bash
POST /api/execute-sql
Content-Type: application/json

{
  "sql": "SELECT * FROM forecast_check_history LIMIT 10;"
}
```

### 3. عرض قائمة ملفات SQL المتاحة
```bash
GET /api/list-sql-files
```

### 4. Health Check
```bash
GET /api/health
```

## استخدام من Frontend

```javascript
// تشغيل ملف SQL
const response = await fetch('http://localhost:3001/api/execute-sql-file', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'FORECAST_ACCURACY_KPIS_TEST.sql.txt'
  })
});

const result = await response.json();
console.log(result);

// تنفيذ استعلام SQL مباشر
const sqlResponse = await fetch('http://localhost:3001/api/execute-sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sql: 'SELECT COUNT(*) FROM forecast_check_history;'
  })
});

const sqlResult = await sqlResponse.json();
console.log(sqlResult);
```

## هيكل المجلدات

```
api-server/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Example environment file
├── sql-files/         # Place SQL files here
│   ├── migration_001.sql
│   ├── FORECAST_ACCURACY_KPIS_TEST.sql.txt
│   └── ...
└── README.md          # This file
```

## الأمان

- الملفات تُقرأ فقط من مجلد `sql-files/`
- يتم منع directory traversal attacks
- العمليات الخطيرة (DROP, DELETE, etc.) محظورة إلا في وضع admin

## ملاحظات

- تأكد من أن ملفات SQL موجودة في مجلد `sql-files/`
- يمكنك نسخ ملفات SQL من المجلد الرئيسي إلى `api-server/sql-files/`






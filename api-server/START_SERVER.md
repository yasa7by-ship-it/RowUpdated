# 🚀 تشغيل السيرفر المحلي

## الطريقة 1: تشغيل مباشر
```bash
cd api-server
npm start
```

## الطريقة 2: وضع التطوير (مع auto-reload)
```bash
cd api-server
npm run dev
```

## بعد التشغيل:
السيرفر سيعمل على: **http://localhost:3001**

## اختبار السيرفر:
افتح المتصفح واذهب إلى:
- http://localhost:3001/api/health

## API Endpoints المتاحة:

### 1. Health Check
```
GET http://localhost:3001/api/health
```

### 2. List SQL Files
```
GET http://localhost:3001/api/list-sql-files
```

### 3. Execute SQL File
```
POST http://localhost:3001/api/execute-sql-file
Body: { "filename": "FORECAST_ACCURACY_KPIS_TEST.sql.txt" }
```

### 4. Execute SQL Query
```
POST http://localhost:3001/api/execute-sql
Body: { "sql": "SELECT COUNT(*) FROM forecast_check_history;" }
```

## ملاحظات:
- تأكد من أن ملف `.env` موجود ويحتوي على `DATABASE_URL` الصحيح
- السيرفر سيطبع رسائل في الـ console عند التشغيل
- إذا ظهرت أخطاء، تحقق من `DATABASE_URL` في ملف `.env`







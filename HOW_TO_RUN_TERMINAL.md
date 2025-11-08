# كيفية تشغيل الأوامر في Terminal

## الطريقة الأولى: استخدام Terminal في VS Code

1. **افتح Terminal في VS Code:**
   - اضغط `Ctrl + ~` (أو `Ctrl + ` ` )
   - أو من القائمة: `Terminal` → `New Terminal`

2. **انتقل إلى مجلد المشروع:**
   ```powershell
   cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
   ```

3. **شغل السيرفر:**
   ```powershell
   npm run dev
   ```

## الطريقة الثانية: استخدام PowerShell مباشرة

1. **افتح PowerShell:**
   - اضغط `Windows + X`
   - اختر `Windows PowerShell` أو `Terminal`

2. **انتقل إلى المجلد:**
   ```powershell
   cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
   ```

3. **شغل السيرفر:**
   ```powershell
   npm run dev
   ```

## الطريقة الثالثة: استخدام ملف .bat (الأسهل)

1. **انقر مرتين على الملف:**
   - `RUN_SITE.bat` أو `start-dev.bat`

2. **السيرفر سيعمل تلقائياً!**

---

## ملاحظات مهمة:

- **المنفذ (Port)**: السيرفر سيبحث عن منفذ متاح (3000, 3001, 3002, ...)
- **العنوان**: بعد التشغيل، ستظهر رسالة مثل:
  ```
  ➜  Local:   http://localhost:3003/
  ```
- **لا تغلق Terminal**: اترك Terminal مفتوحاً أثناء الاستخدام










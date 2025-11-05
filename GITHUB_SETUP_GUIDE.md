# دليل ربط المشروع مع GitHub 🔗

## الخطوات المطلوبة:

### **الخطوة 1: إنشاء حساب/تسجيل الدخول إلى GitHub**
1. اذهب إلى [https://github.com](https://github.com)
2. سجّل الدخول أو أنشئ حساب جديد

---

### **الخطوة 2: إنشاء Repository جديد على GitHub**

1. **انقر على زر "+"** في الزاوية العلوية اليمنى
2. اختر **"New repository"**
3. املأ التفاصيل:
   - **Repository name**: `ROWDB` (أو أي اسم تفضله)
   - **Description**: `Stock Analysis & Forecasting Dashboard`
   - **Visibility**: 
     - ✅ **Private** (مستحسن) - إذا كان المشروع خاص
     - ⭕ **Public** - إذا كنت تريد مشاركته
   - ❌ **لا** تضع علامة على "Initialize with README" (لأن المشروع موجود بالفعل)
4. انقر **"Create repository"**

---

### **الخطوة 3: إعداد Git في المشروع المحلي**

افتح Terminal في VS Code (`Ctrl + ~`) ثم نفذ الأوامر التالية:

#### **أ) تهيئة Git:**
```powershell
cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
git init
```

#### **ب) إضافة جميع الملفات:**
```powershell
git add .
```

#### **ج) عمل Commit أولي:**
```powershell
git commit -m "Initial commit: Stock Analysis Dashboard"
```

---

### **الخطوة 4: ربط المشروع مع GitHub**

بعد إنشاء Repository على GitHub، ستظهر لك تعليمات. استخدم **"…or push an existing repository from the command line"**:

```powershell
# استبدل YOUR_USERNAME و REPO_NAME بالقيم الصحيحة
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

**مثال:**
```powershell
git remote add origin https://github.com/ahmed/ROWDB.git
git branch -M main
git push -u origin main
```

---

### **الخطوة 5: المصادقة (Authentication)**

إذا طُلب منك اسم المستخدم وكلمة المرور:

1. **Username**: اسم المستخدم على GitHub
2. **Password**: استخدم **Personal Access Token** (ليس كلمة المرور العادية)

#### **كيفية إنشاء Personal Access Token:**

1. اذهب إلى GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. انقر **"Generate new token"**
3. اختر **"Generate new token (classic)"**
4. املأ:
   - **Note**: `ROWDB Project Access`
   - **Expiration**: اختر المدة (90 days أو حسب احتياجك)
   - **Select scopes**: ✅ **repo** (كل شيء تحت repo)
5. انقر **"Generate token"**
6. **انسخ Token** واحفظه في مكان آمن (لن يظهر مرة أخرى!)
7. استخدمه كـ Password عند `git push`

---

### **الخطوة 6: التحقق من النجاح**

اذهب إلى صفحة Repository على GitHub وتحقق من ظهور الملفات!

---

## الأوامر الأساسية لاحقاً:

### **حفظ التغييرات وإرسالها:**
```powershell
git add .
git commit -m "وصف التغييرات"
git push
```

### **سحب التحديثات من GitHub:**
```powershell
git pull
```

### **مشاهدة حالة المشروع:**
```powershell
git status
```

### **مشاهدة التاريخ:**
```powershell
git log
```

---

## نصائح مهمة:

1. ✅ **لا تحفظ ملفات حساسة** مثل:
   - `.env` (يجب أن يكون في `.gitignore`)
   - Passwords أو API keys

2. ✅ **استخدم رسائل commit واضحة:**
   - `"إضافة صفحة Daily Watchlist"`
   - `"إصلاح خطأ في Stock Analysis"`
   - `"تحسين الأداء - إضافة Caching"`

3. ✅ **عمل Commit بانتظام** (بعد كل ميزة أو إصلاح)

4. ✅ **استخدم Branches** للميزات الكبيرة:
   ```powershell
   git checkout -b feature/new-page
   # ... اعمل التغييرات ...
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-page
   ```

---

## المساعدة:

إذا واجهت أي مشاكل:
- تحقق من رسالة الخطأ في Terminal
- تأكد من أنك في المجلد الصحيح
- تأكد من أن Token لديه صلاحية **repo**






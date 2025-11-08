# ✅ الخطوات التالية لربط المشروع مع GitHub

## ✅ ما تم إنجازه:
- [x] تهيئة Git repository
- [x] إضافة جميع الملفات
- [x] عمل Commit أولي
- [x] إضافة `.env` إلى `.gitignore` (لحماية المعلومات الحساسة)

---

## 🔴 الخطوات المتبقية:

### **الخطوة 1: إنشاء Repository على GitHub**

1. اذهب إلى [https://github.com](https://github.com)
2. انقر على **"+"** في الزاوية العلوية اليمنى
3. اختر **"New repository"**
4. املأ:
   - **Repository name**: `ROWDB` (أو أي اسم تفضله)
   - **Description**: `Stock Analysis & Forecasting Dashboard`
   - **Visibility**: 
     - ✅ **Private** (مستحسن للبداية)
     - ⭕ **Public** (إذا تريد مشاركته)
   - ❌ **لا** تضع علامة على "Initialize with README"
5. انقر **"Create repository"**

---

### **الخطوة 2: ربط المشروع المحلي مع GitHub**

بعد إنشاء Repository، GitHub سيعرض لك صفحة بها تعليمات. استخدم القسم:

**"…or push an existing repository from the command line"**

افتح Terminal في VS Code (`Ctrl + ~`) واكتب:

```powershell
cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
```

ثم استبدل `YOUR_USERNAME` و `REPO_NAME` بقيمك الصحيحة:

```powershell
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

### **الخطوة 3: المصادقة (Authentication)**

عند طلب اسم المستخدم وكلمة المرور:

1. **Username**: اسم المستخدم على GitHub
2. **Password**: استخدم **Personal Access Token** (ليس كلمة المرور!)

#### **كيفية إنشاء Personal Access Token:**

1. GitHub → **Settings** (أيقونة المستخدم) → **Developer settings**
2. **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → **Generate new token (classic)**
4. املأ:
   - **Note**: `ROWDB Project Access`
   - **Expiration**: اختر المدة
   - **Select scopes**: ✅ **repo** (كل شيء تحت repo)
5. **Generate token**
6. **انسخ Token** واحفظه (لن يظهر مرة أخرى!)
7. استخدمه كـ Password عند `git push`

---

### **الخطوة 4: التحقق**

اذهب إلى صفحة Repository على GitHub وتحقق من ظهور جميع الملفات! 🎉

---

## 📝 ملاحظات مهمة:

### **لحفظ التغييرات لاحقاً:**

```powershell
git add .
git commit -m "وصف التغييرات"
git push
```

### **لجلب التحديثات من GitHub:**

```powershell
git pull
```

### **لفحص حالة المشروع:**

```powershell
git status
```

---

## ⚠️ تحذيرات أمنية:

✅ **تم إضافة إلى `.gitignore`:**
- `.env` وملفات البيئة
- `node_modules`
- ملفات مؤقتة

❌ **لا تحفظ أبداً:**
- Passwords
- API Keys
- ملفات `.env` الحقيقية

---

## 🆘 المساعدة:

إذا واجهت مشاكل:
1. تحقق من رسالة الخطأ في Terminal
2. تأكد من أن Token لديه صلاحية **repo**
3. تأكد من أنك في المجلد الصحيح









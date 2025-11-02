# كيفية دفع الملفات إلى GitHub

## ✅ ما تم إنجازه:
- ✅ تم ربط المستودع: `https://github.com/yasa7by-ship-it/RowUpdated.git`
- ✅ تم تغيير اسم الفرع إلى `main`

## 🔴 الخطوة التالية: المصادقة

Git يحتاج إلى مصادقة لدفع الملفات. يمكنك استخدام أحد الطرق التالية:

---

## الطريقة 1: استخدام Personal Access Token (موصى به)

### أ) إنشاء Token:
1. اذهب إلى GitHub → **Settings** (أيقونة المستخدم)
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → **Generate new token (classic)**
4. املأ:
   - **Note**: `RowUpdated Project`
   - **Expiration**: اختر المدة
   - **Select scopes**: ✅ **repo** (كل شيء تحت repo)
5. **Generate token**
6. **انسخ Token** واحفظه (لن يظهر مرة أخرى!)

### ب) دفع الملفات:
افتح Terminal في VS Code (`Ctrl + ~`) واكتب:

```powershell
cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
git push -u origin main
```

عند الطلب:
- **Username**: `yasa7by-ship-it`
- **Password**: الصق الـ Token الذي نسخته

---

## الطريقة 2: استخدام Git Credential Manager

إذا كان مثبتاً، سيطلب منك تسجيل الدخول عبر المتصفح.

```powershell
cd "C:\D\29102025\Last_Version_02_11_2025\GithHub_Code\ROWDB-main"
git push -u origin main
```

---

## الطريقة 3: استخدام SSH (أكثر أماناً للاستخدام طويل المدى)

### أ) إنشاء SSH Key:
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### ب) إضافة المفتاح إلى GitHub:
1. انسخ محتوى `~/.ssh/id_ed25519.pub`
2. GitHub → **Settings** → **SSH and GPG keys** → **New SSH key**
3. الصق المفتاح واحفظه

### ج) تغيير Remote إلى SSH:
```powershell
git remote set-url origin git@github.com:yasa7by-ship-it/RowUpdated.git
git push -u origin main
```

---

## التحقق من النجاح:

بعد الدفع، اذهب إلى:
**https://github.com/yasa7by-ship-it/RowUpdated**

يجب أن ترى جميع الملفات هناك! 🎉

---

## للمستقبل: حفظ التغييرات

```powershell
git add .
git commit -m "وصف التغييرات"
git push
```



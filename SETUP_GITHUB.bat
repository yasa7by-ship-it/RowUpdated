@echo off
chcp 65001 >nul
echo ====================================
echo  إعداد Git وربط المشروع مع GitHub
echo ====================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo [1/4] التحقق من تثبيت Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت! يرجى تثبيت Git أولاً من: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git مثبت

echo.
echo [2/4] تهيئة Git repository...
if exist ".git" (
    echo ✅ Git repository موجود بالفعل
) else (
    git init
    echo ✅ تم إنشاء Git repository
)

echo.
echo [3/4] إضافة الملفات...
git add .
echo ✅ تم إضافة الملفات

echo.
echo [4/4] عمل Commit أولي...
git commit -m "Initial commit: Stock Analysis Dashboard" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  لا توجد تغييرات جديدة أو تم Commit من قبل
) else (
    echo ✅ تم عمل Commit
)

echo.
echo ====================================
echo  الخطوات التالية:
echo ====================================
echo.
echo 1. اذهب إلى https://github.com وأنشئ Repository جديد
echo 2. انسخ رابط Repository (مثل: https://github.com/USERNAME/REPO.git)
echo 3. شغل الأمر التالي (استبدل الرابط):
echo.
echo    git remote add origin https://github.com/USERNAME/REPO.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ====================================
pause






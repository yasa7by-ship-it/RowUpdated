@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل موقع تحليل الأسهم
echo ========================================
echo.

cd /d "%~dp0"

echo [1] التحقق من تثبيت Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js غير مثبت!
    echo     يرجى تثبيت Node.js من: https://nodejs.org/
    pause
    exit /b 1
)
echo [✓] Node.js مثبت
node --version
echo.

echo [2] التحقق من node_modules...
if not exist "node_modules" (
    echo [X] المكتبات غير مثبتة
    echo [→] جاري تثبيت المكتبات... (قد يستغرق بضع دقائق)
    call npm install
    if errorlevel 1 (
        echo [X] فشل التثبيت!
        pause
        exit /b 1
    )
    echo [✓] تم تثبيت المكتبات بنجاح
) else (
    echo [✓] المكتبات مثبتة مسبقاً
)
echo.

echo [3] تشغيل الموقع...
echo.
echo ========================================
echo   الموقع سيعمل على:
echo   http://localhost:3000
echo ========================================
echo.
echo اضغط Ctrl+C لإيقاف الموقع
echo.

call npm run dev

pause



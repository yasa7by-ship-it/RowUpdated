# تشغيل موقع تحليل الأسهم
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  تشغيل موقع تحليل الأسهم" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Node.js
Write-Host "[1] التحقق من تثبيت Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js مثبت: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[X] Node.js غير مثبت!" -ForegroundColor Red
    Write-Host "    يرجى تثبيت Node.js من: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}
Write-Host ""

# التحقق من node_modules
Write-Host "[2] التحقق من node_modules..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "[X] المكتبات غير مثبتة" -ForegroundColor Red
    Write-Host "[→] جاري تثبيت المكتبات... (قد يستغرق بضع دقائق)" -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] فشل التثبيت!" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
    Write-Host "[✓] تم تثبيت المكتبات بنجاح" -ForegroundColor Green
} else {
    Write-Host "[✓] المكتبات مثبتة مسبقاً" -ForegroundColor Green
}
Write-Host ""

# تشغيل الموقع
Write-Host "[3] تشغيل الموقع..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  الموقع سيعمل على:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف الموقع" -ForegroundColor Yellow
Write-Host ""

npm run dev



# إعداد Git وربط المشروع مع GitHub
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " إعداد Git وربط المشروع مع GitHub" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/4] التحقق من تثبيت Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git مثبت: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git غير مثبت! يرجى تثبيت Git أولاً من: https://git-scm.com/download/win" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host ""
Write-Host "[2/4] تهيئة Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git repository موجود بالفعل" -ForegroundColor Green
} else {
    git init
    Write-Host "✅ تم إنشاء Git repository" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/4] إضافة الملفات..." -ForegroundColor Yellow
git add .
Write-Host "✅ تم إضافة الملفات" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] عمل Commit أولي..." -ForegroundColor Yellow
try {
    git commit -m "Initial commit: Stock Analysis Dashboard" 2>&1 | Out-Null
    Write-Host "✅ تم عمل Commit" -ForegroundColor Green
} catch {
    Write-Host "⚠️  لا توجد تغييرات جديدة أو تم Commit من قبل" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " الخطوات التالية:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. اذهب إلى https://github.com وأنشئ Repository جديد" -ForegroundColor White
Write-Host "2. انسخ رابط Repository (مثل: https://github.com/USERNAME/REPO.git)" -ForegroundColor White
Write-Host "3. شغل الأوامر التالية (استبدل الرابط):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/USERNAME/REPO.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Read-Host "اضغط Enter للخروج"



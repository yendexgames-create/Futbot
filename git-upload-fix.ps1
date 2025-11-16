# Git PATH ni Qo'shish va GitHub ga Yuklash

Write-Host "🔧 Git PATH ni sozlayapman..." -ForegroundColor Cyan

# Git PATH ni qo'shish
$gitPath = "C:\Program Files\Git\bin"
if ($env:PATH -notlike "*$gitPath*") {
    $env:PATH += ";$gitPath"
    Write-Host "✅ Git PATH qo'shildi" -ForegroundColor Green
} else {
    Write-Host "✅ Git PATH allaqachon mavjud" -ForegroundColor Green
}

# Git versiyasini tekshirish
Write-Host ""
Write-Host "📋 Git versiyasini tekshiryapman..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git topilmadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Git o'rnatish uchun:" -ForegroundColor Yellow
    Write-Host "1. https://git-scm.com/download/win ga o'ting" -ForegroundColor White
    Write-Host "2. Git ni yuklab oling va o'rnating" -ForegroundColor White
    Write-Host "3. PowerShell ni qayta oching" -ForegroundColor White
    exit 1
}

Write-Host ""

# Papkaga o'tish
$projectPath = "C:\Users\Acer\Desktop\fut bto"
Write-Host "📁 Papkaga o'tish: $projectPath" -ForegroundColor Cyan
Set-Location $projectPath

# Git repository yaratish
Write-Host ""
Write-Host "📦 Git repository yaratish..." -ForegroundColor Cyan
if (Test-Path .git) {
    Write-Host "⚠️ Git repository allaqachon mavjud" -ForegroundColor Yellow
} else {
    git init
    Write-Host "✅ Git repository yaratildi" -ForegroundColor Green
}

# Barcha fayllarni qo'shish
Write-Host ""
Write-Host "📝 Barcha fayllarni qo'shish..." -ForegroundColor Cyan
git add .
Write-Host "✅ Fayllar qo'shildi" -ForegroundColor Green

# Commit qilish
Write-Host ""
Write-Host "💾 Commit qilish..." -ForegroundColor Cyan
git commit -m "Stadium booking bot - complete project"
Write-Host "✅ Commit qilindi" -ForegroundColor Green

# Branch nomini main qilish
Write-Host ""
Write-Host "🌿 Branch nomini main qilish..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Branch nomi main ga o'zgartirildi" -ForegroundColor Green

# GitHub repository URL so'rash
Write-Host ""
Write-Host "🔗 GitHub repository URL ni kiriting:" -ForegroundColor Yellow
Write-Host "Masalan: https://github.com/yendexgames-create/Futbot.git" -ForegroundColor Gray
$repoUrl = Read-Host "Repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Repository URL kiritilmadi!" -ForegroundColor Red
    exit 1
}

# Remote qo'shish
Write-Host ""
Write-Host "🔗 Remote qo'shish..." -ForegroundColor Cyan
try {
    git remote remove origin 2>$null
} catch {
    # Remote mavjud emas, xato emas
}
git remote add origin $repoUrl
Write-Host "✅ Remote qo'shildi" -ForegroundColor Green

# GitHub ga yuklash
Write-Host ""
Write-Host "🚀 GitHub ga yuklash..." -ForegroundColor Cyan
Write-Host "⚠️ GitHub username va Personal Access Token so'raladi" -ForegroundColor Yellow
Write-Host ""

try {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Muvaffaqiyatli yuklandi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Kod GitHub ga yuklandi!" -ForegroundColor Green
    Write-Host "Keyin Render.com ga deploy qilishingiz mumkin." -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Xatolik yuz berdi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Yechimlar:" -ForegroundColor Yellow
    Write-Host "1. GitHub username va Personal Access Token ni to'g'ri kiriting" -ForegroundColor White
    Write-Host "2. Repository URL ni tekshiring" -ForegroundColor White
    Write-Host "3. GitHub da repository yaratilganligini tekshiring" -ForegroundColor White
    Write-Host ""
    Write-Host "Personal Access Token yaratish:" -ForegroundColor Yellow
    Write-Host "https://github.com/settings/tokens" -ForegroundColor Cyan
}



# GitHub ga Kod Yuklash Script

Write-Host "🚀 GitHub ga kod yuklash jarayoni boshlanmoqda..." -ForegroundColor Green

# Papkaga o'tish
$projectPath = "C:\Users\Acer\Desktop\fut bto"
Set-Location $projectPath

Write-Host "`n📁 Papka: $projectPath" -ForegroundColor Cyan

# GitHub Desktop orqali ishlash
Write-Host "`n⚠️ Git o'rnatilmagan. GitHub Desktop orqali ishlash kerak." -ForegroundColor Yellow
Write-Host "`n📋 Qadamlar:" -ForegroundColor Cyan
Write-Host "1. GitHub Desktop ni oching" -ForegroundColor White
Write-Host "2. File → New Repository (Ctrl+N)" -ForegroundColor White
Write-Host "3. Name: Futbot" -ForegroundColor White
Write-Host "4. Local path: $projectPath" -ForegroundColor White
Write-Host "5. 'Create Repository' ni bosing" -ForegroundColor White
Write-Host "6. 'Commit to main' ni bosing" -ForegroundColor White
Write-Host "7. 'Publish repository' ni bosing" -ForegroundColor White

Write-Host "`n✅ Yoki GitHub Web Interface orqali:" -ForegroundColor Green
Write-Host "1. https://github.com/new ga o'ting" -ForegroundColor White
Write-Host "2. Repository nomi: Futbot" -ForegroundColor White
Write-Host "3. 'Create repository' ni bosing" -ForegroundColor White
Write-Host "4. 'uploading an existing file' linkini bosing" -ForegroundColor White
Write-Host "5. Barcha fayllarni drag & drop qiling" -ForegroundColor White

Write-Host "`n📝 Batafsil qo'llanma: GITHUB_DRAG_DROP.md" -ForegroundColor Cyan


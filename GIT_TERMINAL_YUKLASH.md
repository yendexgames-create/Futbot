# Terminal Orqali GitHub ga Yuklash

## ⚠️ Git O'rnatilmagan

Terminal orqali yuklash uchun Git o'rnatish kerak.

---

## 🚀 Variant 1: Git O'rnatish (Tavsiya Etiladi)

### Qadam 1: Git O'rnatish

1. [Git for Windows](https://git-scm.com/download/win) ni yuklab oling
2. O'rnatish jarayonida:
   - **"Use Git from the command line and also from 3rd-party software"** ni tanlang
   - Boshqa sozlamalarni default qoldiring
3. O'rnatishdan keyin **PowerShell ni qayta oching**

### Qadam 2: Terminal Orqali Yuklash

PowerShell da quyidagi buyruqlarni bajaring:

```powershell
# Papkaga o'tish
cd "C:\Users\Acer\Desktop\fut bto"

# Git repository yaratish
git init

# Barcha fayllarni qo'shish
git add .

# Commit qilish
git commit -m "Stadium booking bot - complete project"

# GitHub da repository yaratganingizdan keyin:
# (GitHub.com da repository yarating va URL ni oling)
# Masalan: https://github.com/yendexgames-create/Futbot.git

# Remote qo'shish (YOUR_USERNAME va REPO_NAME ni o'zgartiring)
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git

# Branch nomini main qilish
git branch -M main

# GitHub ga yuklash
git push -u origin main
```

---

## 🚀 Variant 2: GitHub Desktop (Git O'rnatmasdan)

Agar Git o'rnatishni xohlamasangiz, GitHub Desktop orqali ishlashingiz mumkin:

1. **GitHub Desktop** ni oching
2. **File** → **New Repository** (Ctrl+N)
3. **Name:** `Futbot`
4. **Local path:** `C:\Users\Acer\Desktop\fut bto`
5. **"Create Repository"** ni bosing
6. **"Commit to main"** ni bosing
7. **"Publish repository"** ni bosing

---

## 🚀 Variant 3: GitHub Web Interface (Eng Oson)

1. [GitHub.com](https://github.com) ga kiring
2. **"New repository"** ni yarating
3. **"uploading an existing file"** linkini bosing
4. Barcha fayllarni drag & drop qiling
5. **"Commit changes"** ni bosing

---

## ✅ Qaysi Variantni Tanlash?

- **Terminal orqali:** Variant 1 (Git o'rnatish kerak)
- **Oson:** Variant 2 (GitHub Desktop)
- **Eng Oson:** Variant 3 (Web Interface)


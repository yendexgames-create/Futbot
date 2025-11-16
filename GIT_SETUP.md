# Git O'rnatish va GitHub ga Yuklash

## 1️⃣ Git O'rnatish

### Variant 1: Git Desktop (Eng Oson)

1. [GitHub Desktop](https://desktop.github.com) ni yuklab oling va o'rnating
2. GitHub akkauntingiz bilan kirish
3. "File" → "Add Local Repository"
4. "C:\Users\Acer\Desktop\fut bto" papkasini tanlang
5. "Publish repository" ni bosing

✅ **Tayyor!** Barcha fayllar GitHub ga yuklanadi.

---

### Variant 2: Git Command Line

1. [Git for Windows](https://git-scm.com/download/win) ni yuklab oling
2. O'rnatish jarayonida **"Git from the command line and also from 3rd-party software"** ni tanlang
3. O'rnatishni yakunlang
4. **PowerShell ni qayta oching** (yoki kompyuterni qayta ishga tushiring)

Keyin quyidagi buyruqlarni bajaring:

```powershell
cd "C:\Users\Acer\Desktop\fut bto"

# Git init
git init

# Barcha fayllarni qo'shish
git add .

# Commit qilish
git commit -m "Stadium booking bot - complete project"

# Branch nomini main qilish
git branch -M main

# Remote qo'shish
git remote add origin https://github.com/yendexgames-create/Futbot.git

# GitHub ga yuklash
git push -u origin main
```

---

## 2️⃣ Agar Git allaqachon o'rnatilgan bo'lsa

Agar siz Git Desktop yoki boshqa usul bilan yuklayotgan bo'lsangiz, quyidagilarni bajaring:

### GitHub Desktop orqali:

1. GitHub Desktop ni oching
2. "File" → "Add Local Repository"
3. "C:\Users\Acer\Desktop\fut bto" ni tanlang
4. "Publish repository" ni bosing
5. Repository nomi: `Futbot`
6. "Publish repository" ni bosing

### Yoki Command Line orqali (Git o'rnatilgan bo'lsa):

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
git init
git add .
git commit -m "Stadium booking bot - complete project"
git branch -M main
git remote add origin https://github.com/yendexgames-create/Futbot.git
git push -u origin main
```

---

## 3️⃣ Keyin Render.com ga Deploy

GitHub ga yuklangandan keyin:

1. [Render.com](https://render.com) ga kiring
2. "New +" → "Web Service"
3. GitHub repository ni tanlang: `yendexgames-create/Futbot`
4. Sozlamalarni to'ldiring
5. Environment variables qo'shing
6. Deploy!

**Batafsil:** `RENDER_DEPLOY.md` faylini ko'ring.


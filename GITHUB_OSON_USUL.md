# GitHub ga Kod Yuklash - Eng Oson Usullar

## 🎯 Usul 1: GitHub Web Interface (Eng Oson!)

### Qadam 1: GitHub da Repository Yaratish

1. [GitHub.com](https://github.com) ga kiring va login qiling
2. Yuqorida o'ng tomonda **"+"** tugmasini bosing
3. **"New repository"** ni tanlang
4. Quyidagilarni to'ldiring:
   - **Repository name:** `Futbot`
   - **Description:** `Stadium booking bot`
   - **Public** yoki **Private** ni tanlang
   - **"Initialize this repository with a README"** ni **O'CHIRING**
   - **"Add .gitignore"** ni **O'CHIRING**
   - **"Choose a license"** ni **None** qoldiring
5. **"Create repository"** ni bosing

### Qadam 2: GitHub Desktop orqali Clone Qilish

1. **GitHub Desktop** ni oching
2. **"File"** → **"Clone Repository"** ni bosing
3. **"GitHub.com"** tab ni tanlang
4. `Futbot` repository ni toping va tanlang
5. **Local path:** `C:\Users\Acer\Desktop\fut bto` (yoki yangi papka nomi)
6. **"Clone"** ni bosing

### Qadam 3: Fayllarni Ko'chirish

1. **File Explorer** ni oching
2. `C:\Users\Acer\Desktop\fut bto` papkasiga o'ting
3. **Barcha fayllarni** tanlang (Ctrl+A)
4. **Ko'chirib** (Cut - Ctrl+X), GitHub Desktop da clone qilingan papkaga **yopishtiring** (Paste - Ctrl+V)

### Qadam 4: Commit va Push

1. **GitHub Desktop** da barcha fayllar ko'rinishi kerak
2. Pastda **"Commit to main"** bo'limida:
   - **Summary:** `Stadium booking bot`
   - **"Commit to main"** ni bosing
3. Yuqorida **"Push origin"** tugmasini bosing

✅ **Tayyor!** Kod GitHub ga yuklandi.

---

## 🎯 Usul 2: VS Code Git Integration

### Qadam 1: VS Code ni O'rnatish

1. [VS Code](https://code.visualstudio.com) ni o'rnating (agar yo'q bo'lsa)
2. VS Code ni oching

### Qadam 2: Repository Yaratish

1. VS Code da **"File"** → **"Open Folder"** ni bosing
2. `C:\Users\Acer\Desktop\fut bto` papkasini tanlang
3. Chap tomonda **Source Control** (Ctrl+Shift+G) ni bosing
4. **"Initialize Repository"** ni bosing

### Qadam 3: GitHub ga Yuklash

1. **Source Control** bo'limida barcha fayllar ko'rinishi kerak
2. **"+"** tugmasi bilan barcha fayllarni stage qiling
3. **Message** ga: `Stadium booking bot` yozing
4. **"✓ Commit"** tugmasini bosing
5. **"..."** (3 nuqta) ni bosing → **"Publish to GitHub"** ni tanlang
6. Repository nomi: `Futbot`
7. **"Publish to GitHub"** ni bosing

✅ **Tayyor!**

---

## 🎯 Usul 3: GitHub Web Interface - Drag & Drop

### Qadam 1: Repository Yaratish

1. [GitHub.com](https://github.com) ga kiring
2. **"New repository"** ni yarating (Usul 1, Qadam 1 ga qarang)

### Qadam 2: Fayllarni Yuklash

1. Repository yaratilgandan keyin, **"uploading an existing file"** linkini bosing
2. Yoki to'g'ridan-to'g'ri **"Add file"** → **"Upload files"** ni bosing
3. **File Explorer** dan `C:\Users\Acer\Desktop\fut bto` papkasini oching
4. **Barcha fayllarni** tanlang va **GitHub oynasiga sürükleyin** (drag & drop)
5. Pastda **"Commit changes"** ni bosing

⚠️ **Eslatma:** Bu usul har bir fayl uchun alohida qilish kerak bo'lishi mumkin. Lekin bir nechta faylni bir vaqtda yuklash mumkin.

---

## 🎯 Usul 4: Git Bash (Agar Git O'rnatilgan Bo'lsa)

### Qadam 1: Git Bash ni Ochiш

1. **Git Bash** ni oching (Start → Git → Git Bash)
2. Yoki papkada o'ng tugma → **"Git Bash Here"**

### Qadam 2: Repository Yaratish va Yuklash

```bash
# Papkaga o'ting
cd "/c/Users/Acer/Desktop/fut bto"

# Git repository yaratish
git init

# Barcha fayllarni qo'shish
git add .

# Commit qilish
git commit -m "Stadium booking bot"

# GitHub da repository yaratganingizdan keyin:
# (GitHub.com da repository yarating va URL ni oling)

# Remote qo'shish (YOUR_USERNAME ni o'z username bilan almashtiring)
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git

# Branch nomini main qilish
git branch -M main

# GitHub ga yuklash
git push -u origin main
```

---

## ✅ Qaysi Usulni Tanlash?

- **Eng Oson:** Usul 1 (GitHub Web + GitHub Desktop)
- **Tez:** Usul 2 (VS Code)
- **Oddiy:** Usul 3 (Drag & Drop)
- **Professional:** Usul 4 (Git Bash)

---

## 🚀 Keyin Render.com

GitHub ga yuklangandan keyin:

1. [Render.com](https://render.com) ga kiring
2. **"New +"** → **"Web Service"**
3. GitHub repository ni tanlang: `Futbot`
4. Deploy!

**Batafsil:** `RENDER_DEPLOY.md` faylini ko'ring.


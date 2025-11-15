# Git O'rnatish va Terminal Orqali GitHub ga Yuklash

## 📥 Qadam 1: Git O'rnatish

### 1.1 Git Yuklab Olish

1. [Git for Windows](https://git-scm.com/download/win) ga o'ting
2. **"Download for Windows"** tugmasini bosing
3. Yuklangan faylni oching va o'rnatishni boshlang

### 1.2 Git O'rnatish Sozlamalari

O'rnatish jarayonida quyidagilarni tanlang:

1. **"Select Components"**:
   - ✅ **"Git from the command line and also from 3rd-party software"** ni tanlang
   - Boshqa sozlamalarni default qoldiring

2. **"Choosing the default editor"**:
   - **"Use Visual Studio Code as Git's default editor"** ni tanlang (yoki istalgan editor)

3. **"Adjusting your PATH environment"**:
   - ✅ **"Use Git from the command line and also from 3rd-party software"** ni tanlang

4. **"Choosing HTTPS transport backend"**:
   - **"Use the OpenSSL library"** ni tanlang

5. **"Configuring the line ending conversions"**:
   - **"Checkout Windows-style, commit Unix-style line endings"** ni tanlang

6. **"Configuring the terminal emulator"**:
   - **"Use Windows' default console window"** ni tanlang

7. **"Configuring extra options"**:
   - Barcha checkbox larni belgilang (tavsiya etiladi)

8. **"Configuring experimental options"**:
   - Bo'sh qoldiring

9. **"Install"** tugmasini bosing va o'rnatishni kutib turing

### 1.3 Tekshirish

O'rnatishdan keyin:

1. **PowerShell ni YANGI oching** (yoki qayta ishga tushiring)
2. Quyidagi buyruqni bajaring:

```powershell
git --version
```

Agar Git versiyasi ko'rsatilsa, o'rnatish muvaffaqiyatli!

---

## 🚀 Qadam 2: GitHub da Repository Yaratish

1. [GitHub.com](https://github.com) ga kiring va login qiling
2. Yuqorida o'ng tomonda **"+"** tugmasini bosing
3. **"New repository"** ni tanlang
4. Quyidagilarni to'ldiring:
   - **Repository name:** `Futbot`
   - **Description:** `Stadium booking bot`
   - **Public** yoki **Private** ni tanlang
   - ⚠️ **"Initialize this repository with a README"** ni **O'CHIRING**
   - ⚠️ **"Add .gitignore"** ni **O'CHIRING**
   - ⚠️ **"Choose a license"** ni **None** qoldiring
5. **"Create repository"** ni bosing
6. Repository yaratilgandan keyin, **HTTPS URL ni nusxa oling**:
   - Masalan: `https://github.com/yendexgames-create/Futbot.git`
   - Yoki: `https://github.com/YOUR_USERNAME/Futbot.git`

---

## 💻 Qadam 3: Terminal Orqali Yuklash

PowerShell da quyidagi buyruqlarni **ketma-ket** bajaring:

### 3.1 Papkaga O'tish

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
```

### 3.2 Git Repository Yaratish

```powershell
git init
```

### 3.3 Barcha Fayllarni Qo'shish

```powershell
git add .
```

### 3.4 Commit Qilish

```powershell
git commit -m "Stadium booking bot - complete project"
```

### 3.5 Branch Nomini Main Qilish

```powershell
git branch -M main
```

### 3.6 GitHub Repository ga Bog'lash

```powershell
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git
```

⚠️ **MUHIM:** `YOUR_USERNAME` o'rniga o'zingizning GitHub username ingizni yozing!

Masalan:
```powershell
git remote add origin https://github.com/yendexgames-create/Futbot.git
```

### 3.7 GitHub ga Yuklash

```powershell
git push -u origin main
```

Bu buyruqni bajarganda:
- GitHub username so'raladi
- GitHub password yoki **Personal Access Token** so'raladi

---

## 🔐 Qadam 4: GitHub Authentication

### 4.1 Personal Access Token Yaratish (Tavsiya Etiladi)

1. [GitHub.com](https://github.com) ga kiring
2. **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **"Generate new token"** → **"Generate new token (classic)"** ni bosing
4. Quyidagilarni to'ldiring:
   - **Note:** `Futbot Upload`
   - **Expiration:** `90 days` (yoki istalgan)
   - **Scopes:** `repo` ni belgilang
5. **"Generate token"** ni bosing
6. **Token ni nusxa oling** (keyin ko'rinmaydi!)

### 4.2 Push Qilish

```powershell
git push -u origin main
```

- **Username:** GitHub username ingiz
- **Password:** Personal Access Token (parol emas!)

---

## ✅ Tekshirish

1. [GitHub.com](https://github.com) ga kiring
2. Repository ni oching: `Futbot`
3. Barcha fayllar ko'rinishi kerak

---

## 🚀 Keyin Render.com

1. [Render.com](https://render.com) ga kiring
2. **"New +"** → **"Web Service"**
3. GitHub repository ni tanlang: `Futbot`
4. Deploy!

---

## ⚠️ Xatoliklar va Yechimlar

### Xatolik 1: "git: command not found"
**Yechim:** Git o'rnatilmagan yoki PowerShell qayta ochilmagan. Git ni o'rnating va PowerShell ni qayta oching.

### Xatolik 2: "fatal: not a git repository"
**Yechim:** `git init` buyrug'ini bajaring.

### Xatolik 3: "remote origin already exists"
**Yechim:**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git
```

### Xatolik 4: "Authentication failed"
**Yechim:** Personal Access Token ishlatishingiz kerak, oddiy parol emas!

---

## 📝 Batafsil Qo'llanma

- **Git O'rnatish:** [git-scm.com/download/win](https://git-scm.com/download/win)
- **GitHub Token:** [github.com/settings/tokens](https://github.com/settings/tokens)
- **Render Deploy:** `RENDER_DEPLOY.md` faylini ko'ring


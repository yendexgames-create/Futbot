# GitHub ga Yuklash - Final Qadamlar

## ✅ Commit Muvaffaqiyatli!

Kod commit qilindi. Endi GitHub ga yuklash kerak.

---

## 🚀 Keyingi Qadamlar

### 1. GitHub da Repository Yaratish

Agar hali yaratilmagan bo'lsa:

1. [GitHub.com](https://github.com) ga kiring
2. **"+"** → **"New repository"**
3. **Repository name:** `Futbot`
4. **"Create repository"** ni bosing
5. **HTTPS URL ni nusxa oling:**
   - Masalan: `https://github.com/yendexgames-create/Futbot.git`

### 2. GitHub ga Yuklash

PowerShell da quyidagi buyruqlarni bajaring:

```powershell
# PATH ni qo'shish (agar kerak bo'lsa)
$env:PATH += ";C:\Program Files\Git\bin"

# Papkaga o'tish
cd "C:\Users\Acer\Desktop\fut bto"

# Branch nomini main qilish
git branch -M main

# GitHub repository URL ni kiriting (YOUR_USERNAME ni o'zgartiring!)
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git

# GitHub ga yuklash
git push -u origin main
```

### 3. Authentication

`git push` buyrug'ini bajarganda:
- **Username:** GitHub username ingiz
- **Password:** Personal Access Token (parol emas!)

**Personal Access Token yaratish:**
1. [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. **"Generate new token"** → **"Generate new token (classic)"**
3. **Note:** `Futbot Upload`
4. **Scopes:** `repo` ni belgilang
5. **"Generate token"** ni bosing
6. **Token ni nusxa oling!**

---

## ✅ Tekshirish

1. [GitHub.com](https://github.com) ga kiring
2. Repository ni oching: `Futbot`
3. Barcha fayllar ko'rinishi kerak
4. `node_modules` ko'rinmasligi kerak (`.gitignore` tufayli)

---

## 🚀 Keyin Render.com

1. [Render.com](https://render.com) ga kiring
2. **"New +"** → **"Web Service"**
3. GitHub repository ni tanlang: `Futbot`
4. Deploy!

---

## ⚠️ Eslatma

- `node_modules` GitHub ga yuklanmaydi (`.gitignore` tufayli)
- `.env` fayl ham yuklanmaydi (xavfsizlik uchun)
- Render.com da `.env` sozlamalarini qo'lda qo'shishingiz kerak



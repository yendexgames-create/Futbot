# Git O'rnatish - Qadam-baqadam

## ❌ Muammo: Git o'rnatilmagan

Terminalda `git` buyrug'i topilmayapti. Git ni o'rnatish kerak.

---

## 📥 Qadam 1: Git Yuklab Olish

1. **Brauzer** ni oching
2. Quyidagi linkga o'ting:
   ```
   https://git-scm.com/download/win
   ```
3. **"Download for Windows"** tugmasini bosing
4. Yuklangan fayl: `Git-2.x.x-64-bit.exe` (yoki shunga o'xshash)

---

## 🔧 Qadam 2: Git O'rnatish

### 2.1 O'rnatishni Boshlash

1. Yuklangan `.exe` faylini **ikki marta bosing**
2. **"Next"** tugmasini bosing
3. **"Next"** tugmasini yana bosing

### 2.2 Muhim Sozlamalar

O'rnatish jarayonida quyidagilarni **MUHIM** tanlang:

#### "Select Components"
- ✅ **"Git from the command line and also from 3rd-party software"** ni tanlang
- Boshqa sozlamalarni default qoldiring
- **"Next"** ni bosing

#### "Choosing the default editor"
- **"Use Visual Studio Code as Git's default editor"** ni tanlang
- Yoki **"Use Notepad as Git's default editor"** ni tanlang
- **"Next"** ni bosing

#### "Adjusting your PATH environment" ⚠️ **MUHIM!**
- ✅ **"Use Git from the command line and also from 3rd-party software"** ni tanlang
- Bu eng muhim sozlama!
- **"Next"** ni bosing

#### "Choosing HTTPS transport backend"
- **"Use the OpenSSL library"** ni tanlang
- **"Next"** ni bosing

#### "Configuring the line ending conversions"
- **"Checkout Windows-style, commit Unix-style line endings"** ni tanlang
- **"Next"** ni bosing

#### "Configuring the terminal emulator"
- **"Use Windows' default console window"** ni tanlang
- **"Next"** ni bosing

#### "Configuring extra options"
- ✅ **"Enable file system caching"** ni belgilang
- ✅ **"Enable Git Credential Manager"** ni belgilang
- **"Next"** ni bosing

#### "Configuring experimental options"
- Bo'sh qoldiring
- **"Install"** tugmasini bosing

### 2.3 O'rnatishni Kutish

O'rnatish bir necha daqiqa davom etadi. Kutib turing...

### 2.4 O'rnatishni Tugatish

- **"Finish"** tugmasini bosing
- ✅ **"Launch Git Bash"** ni o'chirib qo'ying (agar kerak bo'lmasa)

---

## ✅ Qadam 3: Tekshirish

### 3.1 PowerShell ni Qayta Ochish

⚠️ **MUHIM:** O'rnatishdan keyin **PowerShell ni YANGI oching** yoki qayta ishga tushiring!

1. **Joriy PowerShell oynasini yoping**
2. **Yangi PowerShell oynasini oching**
3. Yoki **Windows Terminal** ni qayta ishga tushiring

### 3.2 Git Versiyasini Tekshirish

Yangi PowerShell da:

```powershell
git --version
```

Agar Git versiyasi ko'rsatilsa (masalan: `git version 2.42.0.windows.1`), o'rnatish muvaffaqiyatli! ✅

---

## 🚀 Qadam 4: GitHub ga Yuklash

Git o'rnatilgandan keyin, quyidagi buyruqlarni bajaring:

```powershell
# 1. Papkaga o'tish
cd "C:\Users\Acer\Desktop\fut bto"

# 2. Git repository yaratish
git init

# 3. Barcha fayllarni qo'shish
git add .

# 4. Commit qilish
git commit -m "Stadium booking bot - complete project"

# 5. Branch nomini main qilish
git branch -M main

# 6. GitHub repository URL ni kiriting (YOUR_USERNAME ni o'zgartiring!)
git remote add origin https://github.com/YOUR_USERNAME/Futbot.git

# 7. GitHub ga yuklash
git push -u origin main
```

---

## ⚠️ Agar Hali Ham Ishlamasa

### Variant 1: PATH ni Qo'llash

Agar Git o'rnatilgan bo'lsa, lekin hali ham ishlamasa:

1. **File Explorer** da: `C:\Program Files\Git\bin\` papkasiga o'ting
2. `git.exe` fayli mavjudligini tekshiring
3. Agar mavjud bo'lsa, PowerShell ni qayta oching

### Variant 2: Qayta O'rnatish

1. **Control Panel** → **Programs and Features**
2. **Git** ni toping va **Uninstall** qiling
3. Qayta o'rnating (yuqoridagi qadamlarni takrorlang)

### Variant 3: Avtomatik Script

Agar hali ham muammo bo'lsa, `upload-to-github.ps1` scriptini ishlatishingiz mumkin:

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
.\upload-to-github.ps1
```

---

## 📝 Eslatma

- Git o'rnatishdan keyin **mutlaka PowerShell ni qayta oching**!
- PATH sozlamasi to'g'ri bo'lishi kerak
- Agar muammo bo'lsa, kompyuterni qayta ishga tushiring

---

## 🎯 Keyingi Qadamlar

Git o'rnatilgandan keyin:
1. GitHub da repository yarating
2. Terminal buyruqlarini bajaring
3. Kod GitHub ga yuklanadi
4. Render.com ga deploy qiling!



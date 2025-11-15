# 🚀 Render.com ga Bot Deploy Qilish

## 📋 Qadam-baqadam Qo'llanma

### 1️⃣ GitHub Repository Yaratish

1. [GitHub.com](https://github.com) ga kiring va yangi repository yarating
2. Repository nomi: `stadium-booking-bot` (yoki istalgan nom)
3. Repository ni **Private** yoki **Public** qiling

### 2️⃣ Kodni GitHub ga Yuklash

PowerShell da quyidagi buyruqlarni bajaring:

```powershell
cd "C:\Users\Acer\Desktop\fut bto"

# Git o'rnatilmagan bo'lsa, avval Git o'rnating
# https://git-scm.com/download/win

# Git init (agar hali qilinmagan bo'lsa)
git init

# .gitignore fayl yaratish (agar yo'q bo'lsa)
# .env faylini GitHub ga yuklamaslik uchun
if (-not (Test-Path .gitignore)) {
    ".env`nnode_modules`nlogs`n*.log" | Out-File -FilePath .gitignore -Encoding utf8
}

# Barcha fayllarni qo'shish
git add .

# Commit qilish
git commit -m "Initial commit - Stadium booking bot"

# GitHub repository URL ni qo'shing (o'zingizning repository URL ingiz)
git remote add origin https://github.com/YOUR_USERNAME/stadium-booking-bot.git

# GitHub ga yuklash
git branch -M main
git push -u origin main
```

**Eslatma:** `YOUR_USERNAME` o'rniga o'zingizning GitHub username ingizni yozing.

### 3️⃣ Render.com da Web Service Yaratish

1. [Render.com](https://render.com) ga kiring
2. **Sign Up** yoki **Log In** qiling (GitHub orqali kirish mumkin)
3. Dashboard da **"New +"** tugmasini bosing
4. **"Web Service"** ni tanlang

### 4️⃣ Repository Ulash

1. **"Connect a repository"** ni tanlang
2. GitHub akkauntingizni ulang (agar ulangan bo'lmasa)
3. `stadium-booking-bot` repository ni tanlang
4. **"Connect"** ni bosing

### 5️⃣ Service Sozlamalari

Quyidagi sozlamalarni kiriting:

- **Name:** `stadium-booking-bot` (yoki istalgan nom)
- **Environment:** `Node`
- **Region:** `Singapore` (yoki eng yaqin region)
- **Branch:** `main`
- **Root Directory:** (bo'sh qoldiring)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free` (yoki `Starter` - $7/oy)

### 6️⃣ Environment Variables Qo'shish

**"Environment"** bo'limiga o'ting va quyidagilarni qo'shing:

```
BOT_TOKEN=8585366325:AAGA6tdPMI1-EJ3oQ6bkl3MAF5WDtc3QLsA
ADMIN_BOT_TOKEN=8137570529:AAFw3_e26GHvsHlXND1s13GMGjHYMLJ7j7Y
ADMIN_CHAT_ID=7386008809
CHANNEL_ID=@bekzodfutn
MONGODB_URI=mongodb+srv://yendexgames:bekzod001@cluster0.vii80.mongodb.net/?appName=Cluster0
PAYMENT_CARD=8600123456789012
ADMIN_USERNAME=Cyberphantom001
ADMIN_PHONE=+998970986226
TZ=Asia/Tashkent
```

**Muhim:** Har bir variable ni alohida qo'shing:
1. **"Add Environment Variable"** ni bosing
2. **Key** va **Value** ni kiriting
3. **"Save Changes"** ni bosing

### 7️⃣ Deploy

1. Barcha sozlamalarni tekshiring
2. **"Create Web Service"** tugmasini bosing
3. Bot avtomatik deploy bo'ladi (2-5 daqiqa)

### 8️⃣ Deploy Keyin Tekshirish

1. **"Logs"** bo'limiga o'ting va bot ishlayotganini tekshiring
2. Telegram da botga `/start` yuboring
3. Kanalga jadval tashlanayotganini tekshiring

---

## ✅ Render.com Afzalliklari

- ✅ **Bepul** (750 soat/oy)
- ✅ **24/7 ishlaydi** (noutbukdan mustaqil)
- ✅ **Avtomatik restart** (xatolik bo'lsa)
- ✅ **Loglar** (dashboard da ko'rish mumkin)
- ✅ **GitHub integration** (kod o'zgarganda avtomatik deploy)

---

## 🔧 Render.com Buyruqlari

### Loglarni Ko'rish
Render dashboard da **"Logs"** bo'limiga o'ting

### Botni Restart Qilish
Render dashboard da **"Manual Deploy"** → **"Clear build cache & deploy"**

### Environment Variables O'zgartirish
Render dashboard da **"Environment"** bo'limiga o'ting va o'zgartiring

---

## ⚠️ Muhim Eslatmalar

1. **Free Plan:**
   - 750 soat/oy (31 kun × 24 soat = 744 soat)
   - Agar 750 soatdan oshib ketsa, bot to'xtaydi
   - Keyingi oy boshlanganda yana ishlaydi

2. **Sleep Mode:**
   - Free plan da 15 daqiqa ishlatilmasa bot "sleep" rejimiga o'tadi
   - Birinchi so'rovda 30-60 soniyada uyg'onadi
   - Bu muammo emas, lekin agar doimiy ishlash kerak bo'lsa, **Starter plan** ($7/oy) olish mumkin

3. **MongoDB:**
   - MongoDB Atlas bepul (512 MB)
   - Render.com dan mustaqil ishlaydi

---

## 🆘 Muammolar bo'lsa

### Bot ishlamayapti:
1. **Logs** ni tekshiring
2. **Environment variables** to'g'ri ekanligini tekshiring
3. **MongoDB connection** ishlayotganini tekshiring

### Deploy xatosi:
1. **Build logs** ni ko'ring
2. `package.json` da barcha dependencies borligini tekshiring
3. **Start command** to'g'ri ekanligini tekshiring (`npm start`)

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Render.com **Logs** ni ko'ring
2. Telegram botga `/start` yuborib tekshiring
3. MongoDB connection ni tekshiring

**Tayyor!** Bot endi 24/7 ishlaydi va noutbukdan mustaqil! 🎉


# ⚽ Telegram Stadion Bron Boti

Futbol stadioni uchun to'liq funksional Telegram bron boti.

## ✨ Funksiyalar

### 👤 Foydalanuvchi Boti
- ✅ Stadionni bron qilish (kun va vaqt tanlash)
- ✅ Bronlarni bekor qilish
- ✅ Haftalik jadvalni ko'rish
- ✅ Keyingi haftaga o'tish
- ✅ 30 daqiqa oldin eslatma
- ✅ Jarima to'lovi (adminning lichkasiga rasm yuborish)

### 👨‍💼 Admin Boti
- ✅ Yangi bronlarni ko'rish
- ✅ Bronlarni bekor qilish
- ✅ Jarima belgilash
- ✅ Jarima to'lovini tasdiqlash
- ✅ Admin uchun bron qilish (boshqa odamlar uchun)
- ✅ Haftalik jadvalni ko'rish

### 📢 Kanal
- ✅ Kunlik jadval (06:00, 19:30 va har 3 soatda)
- ✅ Yangi bronlar haqida xabar
- ✅ Bekor qilingan bronlar haqida xabar
- ✅ Masked telefon raqamlari

## 🚀 Tezkor Start

### 1. Dependencies o'rnatish

```bash
npm install
```

### 2. Environment Variables

`.env` fayl yaratish va quyidagilarni qo'shish:

```env
BOT_TOKEN=your_main_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token
ADMIN_CHAT_ID=your_admin_chat_id
CHANNEL_ID=@your_channel
MONGODB_URI=your_mongodb_uri
PAYMENT_CARD=your_card_number
ADMIN_USERNAME=your_admin_username
ADMIN_PHONE=your_admin_phone
TZ=Asia/Tashkent
```

### 3. Botni ishga tushirish

```bash
npm start
```

## 📚 Qo'llanmalar

- **SETUP.md** - Batafsil sozlash qo'llanmasi
- **QUICK_START.md** - Tezkor start qo'llanmasi
- **RENDER_DEPLOY.md** - Render.com ga deploy qilish
- **DEPLOYMENT.md** - Boshqa deployment variantlari
- **WINDOWS_24_7_SETUP.md** - Windows noutbukda 24/7 ishlatish

## 🌐 24/7 Deployment

### Render.com (Tavsiya etiladi)

1. GitHub ga kodni yuklang
2. [Render.com](https://render.com) ga kiring
3. "New Web Service" → Repository ni tanlang
4. Environment variables qo'shing
5. Deploy!

**Batafsil:** `RENDER_DEPLOY.md` faylini ko'ring.

## 📁 Loyiha Strukturasi

```
├── index.js              # Asosiy foydalanuvchi boti
├── adminBot.js           # Admin boti
├── database.js           # MongoDB ulanishi
├── models/               # Database modellari
│   ├── User.js
│   ├── Booking.js
│   └── Settings.js
├── utils/                # Utility funksiyalar
│   ├── time.js
│   ├── keyboard.js
│   ├── adminKeyboard.js
│   ├── phone.js
│   └── schedule.js
├── cron/                 # CRON joblar
│   └── schedule.js
└── .env                  # Environment variables
```

## 🔧 Texnologiyalar

- **Node.js** - Runtime
- **Telegraf** - Telegram Bot API
- **Mongoose** - MongoDB ODM
- **Node-cron** - CRON joblar
- **Axios** - HTTP requests

## 📝 License

ISC

## 👨‍💻 Yaratuvchi

Stadion bron boti - to'liq funksional yechim

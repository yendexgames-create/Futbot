# Railway.app ga Bot Deploy Qilish - Qadam-baqadam

## 🎯 Railway.app - Eng Oson va Bepul Variant!

Railway.app da **30 kun trial** va **$5 kredit** bepul beriladi. Bu yetarli!

---

## ✅ Trial Plan Ma'nosi

- **30 kun** bepul
- **$5 kredit** bepul
- Keyin **pullik** bo'ladi ($5/oy minimal)
- Lekin **free tier** ham mavjud (500 soat/oy)

---

## 🚀 Qadam-baqadam Deploy

### Qadam 1: GitHub Repository ni Ulash

1. Railway.app dashboard da **"New Project"** ni bosing
2. **"Deploy from GitHub repo"** ni tanlang
3. GitHub akkauntingiz bilan login qiling (agar hali qilmagan bo'lsangiz)
4. Repository ni tanlang: **`Futbot`**
5. **"Deploy Now"** ni bosing

### Qadam 2: Environment Variables Qo'shish

1. Railway dashboard da loyihangizni oching
2. **"Variables"** tab ni bosing
3. Quyidagilarni qo'shing:

```
BOT_TOKEN=your_main_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token
ADMIN_CHAT_ID=your_chat_id
CHANNEL_ID=@your_channel
MONGODB_URI=your_mongodb_uri
TZ=Asia/Tashkent
PAYMENT_CARD=your_card_number
ADMIN_USERNAME=@your_admin_username
ADMIN_PHONE=+998970986226
```

4. Har birini **"Add Variable"** tugmasi bilan qo'shing

### Qadam 3: Build va Start Command (Ixtiyoriy)

Railway avtomatik `package.json` ni o'qiydi, lekin agar kerak bo'lsa:

1. **"Settings"** tab ni bosing
2. **"Build Command"** ga: `npm install` (yoki bo'sh qoldiring)
3. **"Start Command"** ga: `npm start` (yoki bo'sh qoldiring)

### Qadam 4: Deploy

1. Railway avtomatik deploy qiladi
2. **"Deployments"** tab da progress ni kuzating
3. **"Logs"** tab da xatoliklarni tekshiring

---

## ✅ Tekshirish

1. **"Logs"** tab da quyidagilar ko'rinishi kerak:
   ```
   ✅ Main bot started
   ✅ Admin bot started
   ✅ Database connected
   ```

2. Telegram da botni sinab ko'ring

---

## 💰 Narx va Limitlar

### Trial Plan (30 kun)
- **$5 kredit** bepul
- **Cheksiz** deploy
- **24/7** ishlaydi

### Free Tier (Trialdan keyin)
- **500 soat/oy** bepul
- **24/7** ishlaydi (500 soat yetadi)
- Agar oshib ketsa: **$5/oy** minimal

### Pro Plan
- **$5/oy** minimal
- **Cheksiz** ishlaydi

---

## 🔧 Muammolar va Yechimlar

### Muammo 1: "Set up your project locally"

Bu xabar **normal**! Bu shunchaki ko'rsatma. Siz **GitHub repository** dan deploy qilishingiz kerak.

**Yechim:**
1. **"New Project"** → **"Deploy from GitHub repo"** ni tanlang
2. Repository ni tanlang
3. Deploy!

### Muammo 2: Build xatosi

**Yechim:**
- **"Logs"** tab da xatolikni ko'ring
- `package.json` ni tekshiring
- Environment variables to'g'ri qo'shilganligini tekshiring

### Muammo 3: Bot ishlamayapti

**Yechim:**
- **"Logs"** tab da xatolikni ko'ring
- Environment variables to'g'ri qo'shilganligini tekshiring
- MongoDB URI to'g'ri ekanligini tekshiring

---

## 📝 Muhim Eslatmalar

1. **Environment Variables** mutlako qo'shishingiz kerak!
2. **MongoDB URI** to'g'ri bo'lishi kerak
3. **Bot Token** lar to'g'ri bo'lishi kerak
4. **Channel ID** to'g'ri bo'lishi kerak (bot channel admin bo'lishi kerak)

---

## 🚀 Keyingi Qadamlar

1. ✅ GitHub ga kod yuklang
2. ✅ Railway ga repository ni ulang
3. ✅ Environment variables qo'shing
4. ✅ Deploy!
5. ✅ Bot ishlayotganini tekshiring

---

## 💡 Maslahatlar

- **Trial plan** 30 kun davom etadi - bu yetarli!
- Keyin **free tier** ga o'ting (500 soat/oy bepul)
- Agar kerak bo'lsa, **Pro plan** ga o'ting ($5/oy)

---

## ✅ Xulosa

Railway.app **eng oson** va **bepul** variant:

1. ✅ GitHub repository ni ulang
2. ✅ Environment variables qo'shing
3. ✅ Deploy!
4. ✅ Bot 24/7 ishlaydi!

**"Set up your project locally"** xabari **normal** - bu shunchaki ko'rsatma. Siz **GitHub repository** dan deploy qilishingiz kerak!

---

## 📞 Yordam

Agar muammo bo'lsa:
1. **"Logs"** tab da xatolikni ko'ring
2. Environment variables ni tekshiring
3. `package.json` ni tekshiring



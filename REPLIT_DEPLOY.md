# Replit ga Bot Deploy Qilish

## 🎯 Replit - Bepul va Oson Variant

Replit ham botni 24/7 ishlatish uchun yaxshi variant!

---

## ✅ Afzalliklari

- **Bepul** (Free tier mavjud)
- **Oson** sozlash
- **24/7** ishlaydi (Always On - pullik)
- **GitHub** bilan integratsiya
- **Kod editor** o'rnatilgan

---

## ❌ Kamchiliklari

- Free tier da **Always On** yo'q (bot uxlaydi)
- **Always On** uchun pullik ($7/oy)
- Free tier da **CPU limit** bor

---

## 💰 Narx

- **Free:** 0 so'm (Always On yo'q)
- **Core:** $7/oy (Always On bilan)

---

## 🚀 Qadam-baqadam Qo'llanma

### Qadam 1: Replit Akkaunt Yaratish

1. [Replit.com](https://replit.com) ga kiring
2. **"Sign up"** ni bosing
3. GitHub yoki Google bilan login qiling

### Qadam 2: Yangi Repl Yaratish

1. **"Create Repl"** tugmasini bosing
2. **"Import from GitHub"** ni tanlang
3. GitHub repository URL ni kiriting:
   ```
   https://github.com/YOUR_USERNAME/Futbot
   ```
4. **"Import"** ni bosing

### Qadam 3: Environment Variables Qo'shish

1. Replit da chap tomonda **"Secrets"** (yoki **"Environment Variables"**) ni bosing
2. Quyidagilarni qo'shing:

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

### Qadam 4: Dependencies O'rnatish

Replit avtomatik `package.json` ni o'qiydi va dependencies ni o'rnatadi. Agar o'rnatilmasa:

1. **Shell** ni oching (pastda)
2. Quyidagi buyruqni bajaring:
   ```bash
   npm install
   ```

### Qadam 5: Botni Ishga Tushirish

1. **"Run"** tugmasini bosing
2. Bot ishga tushadi!

---

## ⚙️ Always On Sozlash (24/7 Ishlasin)

### Variant 1: Pullik (Tavsiya Etiladi)

1. Replit da **"Upgrade"** ni bosing
2. **"Core"** plan ni tanlang ($7/oy)
3. **"Always On"** ni yoqing
4. Bot 24/7 ishlaydi!

### Variant 2: Bepul (UptimeRobot)

Agar pullik xohlamasangiz, **UptimeRobot** ishlatishingiz mumkin:

1. [UptimeRobot.com](https://uptimerobot.com) ga kiring
2. **"Add New Monitor"** ni bosing
3. **Monitor Type:** `HTTP(s)`
4. **URL:** Replit Webview URL ni kiriting
5. **Monitoring Interval:** `5 minutes`
6. **"Create Monitor"** ni bosing

Bu botni har 5 daqiqada uyg'otadi (free tier da).

---

## 📝 Replit Sozlamalari

### .replit Fayl (Ixtiyoriy)

Agar `.replit` fayl yaratmoqchi bo'lsangiz:

```toml
run = "npm start"
language = "nodejs"
entrypoint = "index.js"
```

### package.json Scripts

`package.json` da quyidagilar bo'lishi kerak:

```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

---

## 🔧 Muammolar va Yechimlar

### Muammo 1: Bot uxlayapti

**Yechim:** 
- **Always On** ni yoqing (pullik)
- Yoki **UptimeRobot** ishlating

### Muammo 2: Environment Variables ishlamayapti

**Yechim:**
- **Secrets** bo'limida to'g'ri qo'shilganligini tekshiring
- Replit ni qayta ishga tushiring

### Muammo 3: Dependencies o'rnatilmayapti

**Yechim:**
- Shell da `npm install` ni qo'lda bajaring
- `package.json` ni tekshiring

---

## ✅ Tekshirish

1. Replit da **"Run"** tugmasini bosing
2. Console da xatoliklar yo'qligini tekshiring
3. Bot Telegram da ishlayotganini tekshiring

---

## 🚀 Keyingi Qadamlar

1. Bot ishga tushgandan keyin, **Always On** ni yoqing (24/7 ishlashi uchun)
2. Yoki **UptimeRobot** ishlating (bepul variant)

---

## 📊 Qiyoslash

| Xususiyat | Replit Free | Replit Core |
|-----------|-------------|-------------|
| **Narx** | Bepul | $7/oy |
| **Always On** | ❌ | ✅ |
| **CPU** | Limit | Cheksiz |
| **RAM** | 512 MB | 1 GB |

---

## 🎯 Xulosa

**Replit yaxshi variant**, lekin:

- ✅ **Free tier:** Bot uxlaydi (Always On yo'q)
- ✅ **Core ($7/oy):** 24/7 ishlaydi

**Tavsiya:**
- Agar bepul xohlasangiz: **Railway.app** yoki **Render.com**
- Agar Replit ishlatmoqchi bo'lsangiz: **Core plan** ($7/oy)

---

## 📝 Qo'llanmalar

- **Railway.app:** `DEPLOYMENT.md` (Railway bo'limi)
- **Render.com:** `RENDER_DEPLOY.md`
- **PM2 (Windows):** `WINDOWS_24_7_SETUP.md`



# 🚀 24/7 Bot Deployment Guide

Botni 24/7 ishlaydigan qilish uchun quyidagi usullardan birini tanlang:

## 📋 Variant 1: Render.com (Tavsiya etiladi - Bepul)

### 1. Render.com ga kirish
1. [Render.com](https://render.com) ga kirib, akkaunt yarating
2. "New +" tugmasini bosing va "Web Service" ni tanlang

### 2. Repository ulash
1. GitHub ga kodni yuklang (yoki Render ga to'g'ridan-to'g'ri yuklang)
2. Repository ni ulang

### 3. Sozlamalar
- **Name**: `stadium-booking-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (yoki Starter)

### 4. Environment Variables qo'shish
Render dashboard da "Environment" bo'limiga o'ting va quyidagilarni qo'shing:

```
BOT_TOKEN=your_main_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token
ADMIN_CHAT_ID=your_chat_id
CHANNEL_ID=@your_channel
MONGODB_URI=your_mongodb_uri
TZ=Asia/Tashkent
```

### 5. Deploy
"Create Web Service" tugmasini bosing. Bot avtomatik deploy bo'ladi va 24/7 ishlaydi.

---

## 📋 Variant 2: Railway.app (Bepul)

### 1. Railway ga kirish
1. [Railway.app](https://railway.app) ga kirib, akkaunt yarating
2. "New Project" ni tanlang

### 2. GitHub Repository ulash
1. GitHub ga kodni yuklang
2. Railway da "Deploy from GitHub repo" ni tanlang
3. Repository ni tanlang

### 3. Environment Variables
Railway dashboard da "Variables" bo'limiga o'ting va barcha `.env` o'zgaruvchilarini qo'shing.

### 4. Deploy
Avtomatik deploy bo'ladi. Bot 24/7 ishlaydi.

---

## 📋 Variant 3: VPS (Ubuntu Server)

### 1. Server tayyorlash
```bash
# SSH orqali serverni ulang
ssh root@your_server_ip

# Node.js o'rnatish
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git o'rnatish
sudo apt-get install -y git
```

### 2. Kodni yuklash
```bash
# Loyihani klonlash
git clone <your_repo_url>
cd stadium-booking-bot

# Dependencies o'rnatish
npm install
```

### 3. Environment Variables
```bash
# .env fayl yaratish
nano .env

# Quyidagilarni qo'shing:
BOT_TOKEN=your_token
ADMIN_BOT_TOKEN=your_admin_token
ADMIN_CHAT_ID=your_chat_id
CHANNEL_ID=@your_channel
MONGODB_URI=your_mongodb_uri
TZ=Asia/Tashkent
```

### 4. PM2 bilan ishga tushirish (24/7)
```bash
# PM2 o'rnatish
sudo npm install -g pm2

# Botni ishga tushirish
pm2 start index.js --name stadium-bot

# PM2 ni saqlash
pm2 save

# Server qayta ishga tushganda avtomatik ishga tushishi uchun
pm2 startup
# Ko'rsatilgan buyruqni bajarish kerak
```

### 5. PM2 Buyruqlari
```bash
# Bot holatini ko'rish
pm2 status

# Loglarni ko'rish
pm2 logs stadium-bot

# Botni qayta ishga tushirish
pm2 restart stadium-bot

# Botni to'xtatish
pm2 stop stadium-bot

# Botni o'chirish
pm2 delete stadium-bot
```

---

## 📋 Variant 4: Heroku (To'lov talab qiladi)

### 1. Heroku CLI o'rnatish
```bash
# Windows
# Heroku CLI ni https://devcenter.heroku.com/articles/heroku-cli dan yuklab oling

# Linux/Mac
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Heroku ga kirish
```bash
heroku login
```

### 3. Project yaratish
```bash
cd stadium-booking-bot
heroku create stadium-booking-bot
```

### 4. Environment Variables
```bash
heroku config:set BOT_TOKEN=your_token
heroku config:set ADMIN_BOT_TOKEN=your_admin_token
heroku config:set ADMIN_CHAT_ID=your_chat_id
heroku config:set CHANNEL_ID=@your_channel
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set TZ=Asia/Tashkent
```

### 5. Deploy
```bash
git push heroku main
```

---

## 📋 Variant 5: Windows Server (Task Scheduler)

### 1. Botni ishga tushirish scripti yaratish
`start-bot.bat` fayl yaratish:

```batch
@echo off
cd C:\Users\Acer\Desktop\fut bto
node index.js
pause
```

### 2. Task Scheduler sozlash
1. Windows da "Task Scheduler" ni oching
2. "Create Basic Task" ni tanlang
3. Name: "Stadium Bot"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\Users\Acer\Desktop\fut bto\start-bot.bat`

**Yoki** PowerShell orqali:
```powershell
# PM2 o'rnatish (Windows uchun)
npm install -g pm2-windows-startup
pm2 start index.js --name stadium-bot
pm2 save
pm2-startup install
```

---

## ✅ Deployment Keyin Tekshirish

### Bot ishlayotganini tekshirish:
1. Telegram da botga `/start` yuboring
2. Loglarni tekshiring (Render/Railway dashboard yoki `pm2 logs`)
3. Kanalga jadval tashlanayotganini tekshiring

### Muammolar bo'lsa:
- Environment variables to'g'ri ekanligini tekshiring
- MongoDB connection ishlayotganini tekshiring
- Bot tokenlar to'g'ri ekanligini tekshiring
- Loglarni ko'rib xatolarni toping

---

## 🔧 Production Sozlamalari

### package.json ga qo'shing:
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "pm2:start": "pm2 start index.js --name stadium-bot",
    "pm2:stop": "pm2 stop stadium-bot",
    "pm2:restart": "pm2 restart stadium-bot"
  }
}
```

### Error Handling:
Bot allaqachon error handling ga ega. Agar xatolik bo'lsa, bot qayta ishga tushadi.

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Loglarni tekshiring
2. Environment variables ni tekshiring
3. MongoDB connection ni tekshiring
4. Bot tokenlar to'g'ri ekanligini tekshiring

**Tavsiya**: Render.com yoki Railway.app eng oson va bepul variantlar.


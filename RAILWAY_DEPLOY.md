# Railway Deployment Guide (TOML faylsiz)

## 🚀 Railway ga ulash qadamlari:

### 1. **GitHub ga yuklash:**
```bash
git add .
git commit -m "Add monitoring bot and fix railway config"
git push origin main
```

### 2. **Railway da yangi project:**
1. Railway.com ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. O'z repositoryingizni tanlang

### 3. **Environment Variables (MUHIM!):**
Railway project settings → Variables → quyidagilarni qo'shing:

```
BOT_TOKEN=your_main_bot_token
ADMIN_BOT_TOKEN=your_admin_bot_token
MONITORING_BOT_TOKEN=8799404582:AAHp8PWKH7vMbSn_LSms5tenhcpTKHt3oCQ
MONITORING_ADMIN_CHAT_ID=7386008809
ADMIN_CHAT_ID=your_admin_chat_id
CHANNEL_ID=@your_channel
MONGODB_URI=your_mongodb_uri
TZ=Asia/Tashkent
NODE_ENV=production
```

### 4. **Start Command:**
Railway avtomatik `npm start` ni ishga tushiradi.

## ✅ **Nima ishlaydi:**
- ✅ Asosiy bot ishga tushadi
- ✅ Monitoring bot avtomatik ishga tushadi
- ✅ Admin bot ishga tushadi
- ✅ Cron joblar ishlaydi
- ✅ MongoDB ulanadi

## 🔍 **Loglarni tekshirish:**
Railway → Logs → real-time monitoring

## ⚠️ **Potensial muammolar va yechimlari:**

### 1. **MongoDB connection error:**
- MONGODB_URI to'g'ri ekanligini tekshiring
- MongoDB Atlas da IP whitelist ga Railway IP sini qo'shing

### 2. **Bot token error:**
- Tokenlar to'g'ri ekanligini tekshiring
- Botlarni @BotFather dan aktivlangan bo'lishi kerak

### 3. **Monitoring bot xatosi:**
- Monitoring bot tokeni to'g'ri bo'lishi kerak
- Admin Chat ID to'g'ri bo'lishi kerak

### 4. **Port muammosi:**
Telegram botlar uchun port kerak emas, Railway avtomatik hal qiladi

## 🎯 **Test qilish:**
1. Railway da deploy qiling
2. Loglarni tekshiring ("✅ Main bot started", "✅ Monitoring bot started")
3. Admin botdan bron qiling
4. Monitoring botdan xabar kelishini tekshiring

## 📋 **Muhim eslatmalar:**
- ❌ **railway.toml fayli kerak emas**
- ✅ **Environment Variables muhim**
- ✅ **Package.json da "start": "node index.js" kerak**
- ✅ **Monitoring bot index.js ichida chaqiriladi**

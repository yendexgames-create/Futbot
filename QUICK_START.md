# ⚡ Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install
```bash
npm install
```

### 2. Create `.env` file
```env
BOT_TOKEN=your_token_from_botfather
ADMIN_BOT_TOKEN=your_admin_bot_token
ADMIN_CHAT_ID=your_telegram_user_id
CHANNEL_ID=@your_channel
MONGODB_URI=mongodb://localhost:27017/stadium-booking
```

### 3. Get Your Tokens

**Main Bot:**
1. Message [@BotFather](https://t.me/BotFather)
2. `/newbot` → Follow instructions
3. Copy token → `BOT_TOKEN`

**Admin Bot:**
1. Create another bot with [@BotFather](https://t.me/BotFather)
2. Copy token → `ADMIN_BOT_TOKEN`

**Your Chat ID:**
1. Message [@userinfobot](https://t.me/userinfobot)
2. Copy your ID → `ADMIN_CHAT_ID`

**Channel:**
1. Create public channel
2. Add main bot as admin
3. Use `@channel_name` → `CHANNEL_ID`

### 4. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 5. Run Bot
```bash
npm start
```

### 6. Test
1. Open your bot on Telegram
2. Send `/start`
3. Book a time slot
4. Check admin bot for notification
5. Check channel for update

## ✅ Done!

Your bot is now running. Check `README.md` for full documentation.


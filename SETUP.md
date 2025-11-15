# 🚀 Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory with the following content:

```env
BOT_TOKEN=your_main_bot_token_here
ADMIN_BOT_TOKEN=your_admin_bot_token_here
ADMIN_CHAT_ID=your_telegram_user_id_here
CHANNEL_ID=@your_channel_username
MONGODB_URI=mongodb://localhost:27017/stadium-booking
TZ=Asia/Tashkent
```

### 3. Get Bot Tokens

1. **Main Bot Token**:
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot`
   - Follow instructions to create your bot
   - Copy the token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Admin Bot Token**:
   - Create a second bot with [@BotFather](https://t.me/BotFather)
   - This bot will send notifications to admins
   - Copy the admin bot token

### 4. Get Your Chat ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start the bot
3. It will show your user ID (e.g., `123456789`)
4. Use this as `ADMIN_CHAT_ID`

### 5. Setup Channel

1. Create a public Telegram channel
2. Add your **main bot** as an administrator
3. Give it permission to post messages
4. Note the channel username (e.g., `@mystadium_channel`)
5. Use this as `CHANNEL_ID` (with @ symbol)

**Alternative**: To use channel ID instead of username:
- Forward a message from channel to [@userinfobot](https://t.me/userinfobot)
- Use the format: `-1001234567890`

### 6. Setup MongoDB

**Option A: Local MongoDB**

1. Install MongoDB on your system
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongodb
   ```
3. Use connection string: `mongodb://localhost:27017/stadium-booking`

**Option B: MongoDB Atlas (Cloud - Recommended)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (free tier available)
4. Create database user
5. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
6. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/stadium-booking?retryWrites=true&w=majority
   ```
7. Replace `username` and `password` with your credentials

### 7. Initialize Admin Bot

1. Start a chat with your admin bot
2. Send `/start` command
3. This initializes the bot

### 8. Run the Bot

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 9. Test the Bot

1. Open Telegram and search for your main bot
2. Send `/start`
3. You should see the week view with day buttons
4. Try booking a time slot
5. Check if admin bot receives notification
6. Check if channel receives updates

## ✅ Verification Checklist

- [ ] Main bot responds to `/start`
- [ ] Week view shows 7 days (Mon-Sun)
- [ ] Can select a day and see time slots
- [ ] Can book a time slot
- [ ] Phone number is requested if not provided
- [ ] Admin bot receives booking notification
- [ ] Channel receives booking update
- [ ] Can cancel a reservation
- [ ] Late cancellation shows penalty message
- [ ] Daily schedule posts at 06:00 (check next day)

## 🔧 Troubleshooting

### Bot not starting

- Check if all environment variables are set
- Verify bot tokens are correct
- Check MongoDB connection

### Channel not receiving messages

- Verify bot is admin in channel
- Check channel ID format
- Ensure channel is public or bot has access

### Admin notifications not working

- Verify admin bot token is correct
- Check ADMIN_CHAT_ID is your user ID
- Make sure you started admin bot (send `/start`)

### Database errors

- Check MongoDB is running
- Verify connection string is correct
- Check network connectivity

## 📞 Need Help?

Check the main README.md for detailed documentation.


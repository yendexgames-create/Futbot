# 📁 Project Structure

```
stadium-booking-bot/
│
├── index.js                 # Main user bot - handles bookings, cancellations, user interactions
├── adminBot.js              # Admin notification bot - sends alerts to admin
├── database.js              # MongoDB connection setup
│
├── models/                  # Mongoose data models
│   ├── User.js             # User schema (userId, username, phone, etc.)
│   ├── Booking.js          # Booking schema (date, time, status, penalty, etc.)
│   └── Settings.js         # Settings schema (for future use)
│
├── utils/                   # Utility functions
│   ├── time.js             # Date/time helpers (week calculation, formatting, etc.)
│   └── keyboard.js         # Inline keyboard generators for Telegram
│
├── cron/                    # Scheduled tasks
│   └── schedule.js         # Daily schedule posting at 06:00, channel notifications
│
├── package.json            # Dependencies and scripts
├── .gitignore              # Git ignore rules
├── README.md               # Full documentation
├── SETUP.md                # Quick setup guide
└── .env                    # Environment variables (create this - see README)
```

## 🔑 Key Files Explained

### index.js
- Main bot entry point
- Handles all user interactions
- Manages booking flow, cancellation logic
- Integrates with admin bot and channel

### adminBot.js
- Separate bot for admin notifications
- Sends booking/cancellation alerts
- Handles penalty notifications

### database.js
- MongoDB connection handler
- Error handling for database operations

### models/
- **User.js**: Stores user information (Telegram ID, username, phone)
- **Booking.js**: Stores all bookings with status, dates, times, penalties
- **Settings.js**: For future configuration storage

### utils/
- **time.js**: Date manipulation, week calculations, formatting
- **keyboard.js**: Dynamic keyboard generation based on availability

### cron/schedule.js
- Automated daily schedule posting
- Channel update notifications
- Timezone-aware scheduling

## 🔄 Data Flow

1. **User books** → Saved to MongoDB → Admin notified → Channel updated
2. **User cancels** → Booking updated → Admin notified → Channel updated
3. **Daily 06:00** → Schedule generated → Posted to channel
4. **Late cancellation** → Penalty calculated → Admin notified with details

## 📊 Database Collections

### users
```javascript
{
  userId: Number,      // Telegram user ID
  username: String,    // Telegram username
  phone: String,       // Phone number
  firstName: String,
  lastName: String,
  createdAt: Date
}
```

### bookings
```javascript
{
  userId: Number,      // Reference to user
  date: Date,          // Booking date
  hourStart: Number,   // 20, 21, 22, or 23
  hourEnd: Number,     // 21, 22, 23, or 24
  status: String,      // 'booked' or 'cancelled'
  cancelReason: String,
  cancelTime: Date,
  penaltyAmount: Number,
  penaltyPaid: Boolean,
  createdAt: Date
}
```

## 🎯 Environment Variables Required

- `BOT_TOKEN` - Main bot token
- `ADMIN_BOT_TOKEN` - Admin bot token
- `ADMIN_CHAT_ID` - Telegram user/group ID for admin notifications
- `CHANNEL_ID` - Channel username or ID for public schedule
- `MONGODB_URI` - MongoDB connection string
- `TZ` - Timezone (optional, default: server timezone)


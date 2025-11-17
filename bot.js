import { Telegraf } from 'telegraf';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Define your booking schema and model
const bookingSchema = new mongoose.Schema({
  userId: String,
  date: Date,
  time: String,
  // Add other relevant fields
});

const Booking = mongoose.model('Booking', bookingSchema);

// Middleware to handle /start command
bot.start((ctx) => {
  ctx.reply('Welcome to the Stadium Booking Bot!');
});

// Command to show bookings for the current week
bot.command('bookings', async (ctx) => {
  const userId = ctx.from.id;
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));

  try {
    const bookings = await Booking.find({
      userId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });

    if (bookings.length === 0) {
      ctx.reply('No bookings found for this week.');
    } else {
      let message = 'Your bookings for this week:\n';
      bookings.forEach(booking => {
        message += `- ${booking.date.toDateString()} at ${booking.time}\n`;
      });
      ctx.reply(message);
    }
  } catch (error) {
    ctx.reply('Error fetching bookings. Please try again later.');
  }
});

// When generating week navigation buttons:
const weekKeyboard = {
  inline_keyboard: [
    [
      { text: 'Next Week', callback_data: 'next_week' }
    ],
    [
      { text: 'Previous Week', callback_data: 'prev_week' }
    ]
  ]
};

// Handle callback for week navigation
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const now = new Date();

  if (data === 'next_week') {
    // Move forward one week
    now.setDate(now.getDate() + 7);
  }
  if (data === 'prev_week') {
    // Move backward one week
    now.setDate(now.getDate() - 7);
  }

  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));

  try {
    const bookings = await Booking.find({
      userId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });

    if (bookings.length === 0) {
      ctx.reply('No bookings found for this week.');
    } else {
      let message = 'Your bookings for this week:\n';
      bookings.forEach(booking => {
        message += `- ${booking.date.toDateString()} at ${booking.time}\n`;
      });
      ctx.reply(message);
    }
  } catch (error) {
    ctx.reply('Error fetching bookings. Please try again later.');
  }
});

// Start the bot
bot.launch();
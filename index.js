
// Add this at the very top of index.js
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
const { Telegraf, Markup } = require('telegraf');
const connectDB = require('./database');
const User = require('./models/User');
const Booking = require('./models/Booking');
const { createMainKeyboard, createTimeSlotKeyboard, createBackKeyboard, createUserReplyKeyboard } = require('./utils/keyboard');
const { formatDate, isPastDate, isToday, getWeekStart } = require('./utils/time');
const { initScheduler, notifyChannelBooking, notifyChannelCancellation } = require('./cron/schedule');
const { initAdminBot, notifyNewBooking, notifyCancellation, notifyLateCancellationPenalty } = require('./adminBot');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Global middleware: block access for blocked users
bot.use(async (ctx, next) => {
  try {
    if (!ctx.from) return next();

    const userId = ctx.from.id;
    const user = await User.findOne({ userId });

    if (user && user.isBlocked) {
      // Short message to blocked users
      try {
        await ctx.reply('❌ Siz botdan foydalanishdan bloklangansiz. Iltimos, admin bilan bog\'laning.');
      } catch (e) {
        console.error('Error sending blocked message:', e);
      }
      return; // stop processing other handlers
    }

    return next();
  } catch (error) {
    console.error('Error in block middleware:', error);
    return next();
  }
});

// Store user states for cancellation flow
const userStates = new Map();
// Store user booking mode: 'daily' or 'weekly'
const bookingModes = new Map();

// Helper to build booking mode selection keyboard
function getBookingModeKeyboard() {
  return {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📅 Bir kunlik bron qilish', 'booking_mode_daily')],
      [Markup.button.callback('📆 Haftalik bron qilish (har hafta bir kun uchun)', 'booking_mode_weekly')]
    ]),
    parse_mode: 'HTML'
  };
}

// Connect to database
connectDB().then(() => {
  console.log('✅ Database connected');
  
  // Initialize admin bot
  initAdminBot();
  
  // Initialize cron scheduler
  if (process.env.CHANNEL_ID) {
    initScheduler(bot, process.env.CHANNEL_ID);
  }
});

// Welcome message and main menu
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;
    
    // Save or update user
    await User.findOneAndUpdate(
      { userId },
      {
        userId,
        username,
        firstName,
        lastName
      },
      { upsert: true, new: true }
    );
    
    const welcomeMessage = `Xush kelibsiz! Stadionni bron qilish uchun kunni tanlang.\n\n` +
      `📌 ESLATMA:\n` +
      `DIQQAT!Botdan foydalanayotganda ehtiyotkor bo'ling, botni tekshirish yoki oyin qilish uchun ishlatmang bu yomon oqibatga olib kelishi mumkin!!! \n` +
      `Bron qilgandan keyin, bekor qilmoqchi bo'lsangiz, kamida 1 kun oldin bekor qilishingiz kerak.\n` +
      `Xuddi shu kuni bekor qilish 100,000 so'm jarima to'lashni talab qiladi.\n` +
      `Stadion narxi soatiga 200,000 so'm.`;
    
    await ctx.reply(welcomeMessage, getBookingModeKeyboard());
    
    // Set reply keyboard (always visible)
    await ctx.reply('📋 <b>Asosiy menu:</b>', {
      ...createUserReplyKeyboard(),
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error in bot.start handler:', error);
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } catch (innerError) {
      console.error('Error sending error message in bot.start handler:', innerError);
    }
  }
});

// Helper to get user's booking mode (default: daily)
function getUserBookingMode(userId) {
  const mode = bookingModes.get(userId);
  return mode === 'weekly' ? 'weekly' : 'daily';
}

// Helper to create weekly recurring bookings up to ~1 month ahead
async function createWeeklyBookings(userId, firstDate, hourStart, hourEnd, weeklyGroupId) {
  // Limit weekly series to approximately 1 month (30 days) from the first date
  const startDate = new Date(firstDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const date = new Date(d);

    // Skip past dates just in case
    if (isPastDate(date)) {
      continue;
    }

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      userId,
      date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
      hourStart,
      status: 'booked'
    });

    if (existingBooking) {
      continue;
    }

    await Booking.create({
      userId,
      date,
      hourStart,
      hourEnd,
      status: 'booked',
      isWeekly: true,
      weeklyGroupId
    });
  }
}

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  
  try {
    // Handle booking mode selection
    if (data === 'booking_mode_daily') {
      bookingModes.set(userId, 'daily');
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      await ctx.answerCbQuery('Bir kunlik bron rejimi tanlandi.');
      await ctx.editMessageText(
        'Stadionni bron qilish uchun kunni tanlang:',
        keyboard
      );
      return;
    }
    if (data === 'booking_mode_weekly') {
      bookingModes.set(userId, 'weekly');
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      await ctx.answerCbQuery('Haftalik bron rejimi tanlandi.');
      await ctx.editMessageText(
        'Stadionni haftalik bron qilish uchun kunni tanlang:',
        keyboard
      );
      return;
    }

    // Handle day selection
    if (data.startsWith('day_')) {
      const dateStr = data.replace('day_', '');
      // Parse date string (YYYY-MM-DD) as local date, not UTC
      const [year, month, day] = dateStr.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      
      if (isPastDate(selectedDate)) {
        await ctx.answerCbQuery('Bu kun allaqachon o\'tib ketgan.');
        await ctx.reply(
          '❌ Bu kun allaqachon o\'tib ketgan.\nIltimos, boshqa sanani tanlang.',
          createBackKeyboard()
        );
        return;
      }
      
      const keyboard = await createTimeSlotKeyboard(selectedDate);
      const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      const dayName = dayNames[selectedDate.getDay()];
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📅 ${dayName}, ${formatDate(selectedDate)}\n\nVaqtni tanlang:`,
        keyboard
      );
    }
    
    // Handle time slot selection
    else if (data.startsWith('slot_') && !data.includes('slot_booked_')) {
      const parts = data.replace('slot_', '').split('_');
      const dateStr = parts[0];
      const hourStart = parseInt(parts[1]);
      const hourEnd = parseInt(parts[2]);
      
      // Parse date string (YYYY-MM-DD) as local date, not UTC
      const [year, month, day] = dateStr.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Check if slot is still available
      const existingBooking = await Booking.findOne({
        date: { $gte: selectedDate, $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) },
        hourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.answerCbQuery('Bu vaqt allaqachon band qilingan.');
        const keyboard = await createTimeSlotKeyboard(selectedDate);
        await ctx.editMessageText(
          '❌ Bu vaqt boshqa foydalanuvchi tomonidan band qilingan.\n\nIltimos, boshqa vaqtni tanlang:',
          keyboard
        );
        return;
      }
      
      // Get user info
      let user = await User.findOne({ userId });
      if (!user) {
        user = await User.create({
          userId,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name
        });
      }
      
      // Request phone number if not available (majburiy)
      if (!user.phone) {
        await ctx.answerCbQuery();
        await ctx.reply(
          '📞 <b>Bronni yakunlash uchun telefon raqamingizni ulashing:</b>\n\n' +
          'Telefon raqamni ulashish majburiy!',
          {
            reply_markup: {
              keyboard: [[
                { text: '📱 Telefon raqamni ulashish', request_contact: true }
              ]],
              resize_keyboard: true,
              one_time_keyboard: true
            },
            parse_mode: 'HTML'
          }
        );
        
        // Store pending booking
        const mode = getUserBookingMode(userId);
        userStates.set(userId, {
          type: 'booking',
          date: selectedDate,
          hourStart,
          hourEnd,
          mode
        });
        return;
      }
      
      const mode = getUserBookingMode(userId);
      let booking;
      if (mode === 'weekly') {
        // Check active weekly groups limit (max 3)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeWeeklyGroups = await Booking.distinct('weeklyGroupId', {
          userId,
          isWeekly: true,
          weeklyGroupId: { $ne: null },
          status: 'booked',
          date: { $gte: today }
        });
        const activeWeeklyCount = activeWeeklyGroups.filter(g => g !== null).length;
        if (activeWeeklyCount >= 3) {
          await ctx.answerCbQuery('Sizda allaqachon 3 ta haftalik bron mavjud.');
          const currentWeekStart = getWeekStart();
          const keyboard = await createMainKeyboard(currentWeekStart);
          await ctx.reply(
            '❌ Siz maksimal 3 ta haftalik bron qilishingiz mumkin. Yangi haftalik bron qilishdan oldin mavjud haftalik bronlardan birini bekor qiling.',
            keyboard
          );
          return;
        }

        const weeklyGroupId = `${userId}_${Date.now()}_${hourStart}`;
        // Create first booking as part of weekly series
        booking = await Booking.create({
          userId,
          date: selectedDate,
          hourStart,
          hourEnd,
          status: 'booked',
          isWeekly: true,
          weeklyGroupId
        });

        // Create future weekly bookings (no additional notifications)
        await createWeeklyBookings(userId, selectedDate, hourStart, hourEnd, weeklyGroupId);
      } else {
        // Create single (daily) booking
        booking = await Booking.create({
          userId,
          date: selectedDate,
          hourStart,
          hourEnd,
          status: 'booked'
        });
      }
      
      await ctx.answerCbQuery('Bron tasdiqlandi!');
      
      // Notify admin
      await notifyNewBooking(booking, user);
      
      // Notify channel (phone will be fetched in notifyChannelBooking function)
      await notifyChannelBooking(selectedDate, hourStart, hourEnd, userId, user.username || '');
      
      // Send daily schedule to admin and channel
      const { generateDailySchedule } = require('./utils/schedule');
      const { postDailyScheduleToAdmin } = require('./adminBot');
      const { postDailyScheduleToChannel } = require('./cron/schedule');
      const scheduleText = await generateDailySchedule(selectedDate);
      await postDailyScheduleToAdmin(scheduleText, selectedDate);
      await postDailyScheduleToChannel(scheduleText, selectedDate);
      
      // Show success message and return to main menu
      const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd).padStart(2, '0')}:00`;
      let successMessage = `✅ Bron tasdiqlandi!\n\n` +
        `📅 Sana: ${formatDate(selectedDate)}\n` +
        `⏰ Vaqt: ${timeLabel}\n` +
        `💰 Narx: 200,000 so'm`;

      if (booking.isWeekly) {
        successMessage += `\n\n📆 Bu haftalik bron. Har hafta shu kuni shu vaqtda maydon siz uchun band bo'ladi (maksimal 3 ta haftalik bron).`;
      }
      
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.reply(successMessage, keyboard);
    }
    
    // Handle next week navigation
    else if (data.startsWith('next_week_')) {
      const dateStr = data.replace('next_week_', '');
      // Parse date string (YYYY-MM-DD) as local date, not UTC
      const [year, month, day] = dateStr.split('-').map(Number);
      const nextWeekStart = new Date(year, month - 1, day);
      const keyboard = await createMainKeyboard(nextWeekStart);
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Stadionni bron qilish uchun kunni tanlang:',
        keyboard
      );
    }
    
    // Handle back to week view
    else if (data === 'back_to_week') {
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Stadionni bron qilish uchun kunni tanlang:',
        keyboard
      );
    }
    
    // Handle cancel reservation main menu (choose daily vs weekly)
    else if (data === 'cancel_reservation') {
      const buttons = [
        [Markup.button.callback('❌ Kunlik broni bekor qilish', 'cancel_daily_menu')],
        [Markup.button.callback('❌ Haftalik broni bekor qilish', 'cancel_weekly_menu')],
        [Markup.button.callback('🔙 Orqaga', 'back_to_week')]
      ];

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Bekor qilish turini tanlang:',
        {
          ...Markup.inlineKeyboard(buttons),
          parse_mode: 'HTML'
        }
      );
    }

    // Handle daily bookings cancellation list
    else if (data === 'cancel_daily_menu') {
      // Get today's start time to include today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeBookings = await Booking.find({
        userId,
        status: 'booked',
        isWeekly: false,
        date: { $gte: today }
      }).sort({ date: 1 });
      
      if (activeBookings.length === 0) {
        await ctx.answerCbQuery('Sizda kunlik faol bronlar yo\'q.');
        await ctx.reply('❌ Bekor qilish uchun kunlik faol bronlar yo\'q.');
        return;
      }
      
      const buttons = activeBookings.map((booking) => {
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        const bookingDate = new Date(booking.date);
        const isSameDay = isToday(bookingDate);
        const buttonText = isSameDay 
          ? `⚠️ ${formatDate(bookingDate)} ${timeLabel} (Jarima: 100,000 so'm)`
          : `${formatDate(bookingDate)} ${timeLabel}`;
        return [Markup.button.callback(
          buttonText,
          `cancel_booking_${booking._id}`
        )];
      });

      buttons.push([Markup.button.callback('🔙 Orqaga', 'cancel_reservation')]);

      const hasSameDayBookings = activeBookings.some(booking => {
        const bookingDate = new Date(booking.date);
        return isToday(bookingDate);
      });
      
      const messageText = hasSameDayBookings
        ? '⚠️ ESLATMA: Bugungi kun uchun bekor qilish 100,000 so\'m jarima to\'lashni talab qiladi.\n\n' +
          'Bekor qilish uchun kunlik bronni tanlang:'
        : 'Bekor qilish uchun kunlik bronni tanlang:';

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        messageText,
        {
          ...Markup.inlineKeyboard(buttons),
          parse_mode: 'HTML'
        }
      );
    }

    // Handle weekly bookings cancellation menu
    else if (data === 'cancel_weekly_menu') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const groupIds = await Booking.distinct('weeklyGroupId', {
        userId,
        isWeekly: true,
        weeklyGroupId: { $ne: null },
        status: 'booked',
        date: { $gte: today }
      });

      if (!groupIds || groupIds.length === 0) {
        await ctx.answerCbQuery('Sizda haftalik faol bronlar yo\'q.');
        await ctx.reply('❌ Bekor qilish uchun haftalik faol bronlar yo\'q.');
        return;
      }

      const buttons = [];
      for (const groupId of groupIds) {
        const nextBooking = await Booking.findOne({
          userId,
          isWeekly: true,
          weeklyGroupId: groupId,
          status: 'booked',
          date: { $gte: today }
        }).sort({ date: 1, hourStart: 1 });

        if (!nextBooking) {
          continue;
        }

        const bookingDate = new Date(nextBooking.date);
        const timeLabel = `${String(nextBooking.hourStart).padStart(2, '0')}:00–${String(nextBooking.hourEnd).padStart(2, '0')}:00`;
        const buttonText = `📆 Haftalik: ${formatDate(bookingDate)} ${timeLabel}`;
        buttons.push([Markup.button.callback(buttonText, `cancel_weekly_group_${groupId}`)]);
      }

      buttons.push([Markup.button.callback('🔙 Orqaga', 'cancel_reservation')]);

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Bekor qilish uchun haftalik bronni tanlang:',
        {
          ...Markup.inlineKeyboard(buttons),
          parse_mode: 'HTML'
        }
      );
    }

    // Handle weekly group cancellation
    else if (data.startsWith('cancel_weekly_group_')) {
      const groupId = data.replace('cancel_weekly_group_', '');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await Booking.find({
        userId,
        isWeekly: true,
        weeklyGroupId: groupId,
        status: 'booked',
        date: { $gte: today }
      }).sort({ date: 1, hourStart: 1 });

      if (bookings.length === 0) {
        await ctx.answerCbQuery('Haftalik bronlar topilmadi.');
        return;
      }

      for (const booking of bookings) {
        booking.status = 'cancelled';
        booking.cancelTime = new Date();
        await booking.save();
      }

      await ctx.answerCbQuery('Haftalik bron bekor qilindi.');

      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);

      await ctx.editMessageText(
        `✅ Haftalik bron muvaffaqiyatli bekor qilindi.\n\n` +
        `Endi ushbu haftalik bron uchun kelajakdagi barcha sanalar bo'shatildi.\n\n` +
        `Stadionni bron qilish uchun kunni tanlang:`,
        keyboard
      );
    }
    
    // Handle specific booking cancellation
    else if (data.startsWith('cancel_booking_')) {
      const bookingId = data.replace('cancel_booking_', '');
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.userId !== userId || booking.status !== 'booked') {
        await ctx.answerCbQuery('Bron topilmadi.');
        return;
      }
      
      const bookingDate = new Date(booking.date);
      const isSameDay = isToday(bookingDate);
      
      if (isSameDay) {
        // Late cancellation - penalty required
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '⚠️ JARIMA ESLATMASI\n\n' +
          `Siz bugungi kun (${formatDate(bookingDate)}) uchun ${timeLabel} vaqtidagi broningizni bekor qilmoqdasiz.\n\n` +
          `💰Jarima miqdori: 100,000 so'm\n\n` +
          `⚠️ ESLATMA: Bugungi kun uchun bekor qilish 100,000 so'm jarima to'lashni talab qiladi.\n\n` +
          `Iltimos, bekor qilish sababini yozing.\n` +
          `Jarimani qachon to'laysiz?`,
          {
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔙 Bekor qilish', 'back_to_week')]
            ]),
            parse_mode: 'HTML'
          }
        );
        
        userStates.set(userId, {
          type: 'late_cancellation',
          bookingId: booking._id.toString()
        });
        return;
      }
      
      // Normal cancellation (at least 1 day before)
      booking.status = 'cancelled';
      booking.cancelTime = new Date();
      await booking.save();
      
      const user = await User.findOne({ userId });
      
      // Notify admin
      await notifyCancellation(booking, user, false);
      
      // Notify channel
      await notifyChannelCancellation(bookingDate, booking.hourStart, booking.hourEnd);
      
      // Send daily schedule to admin and channel
      const { generateDailySchedule } = require('./utils/schedule');
      const { postDailyScheduleToAdmin } = require('./adminBot');
      const { postDailyScheduleToChannel } = require('./cron/schedule');
      const scheduleText = await generateDailySchedule(bookingDate);
      await postDailyScheduleToAdmin(scheduleText, bookingDate);
      await postDailyScheduleToChannel(scheduleText, bookingDate);
      
      await ctx.answerCbQuery('Bron bekor qilindi.');
      
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.editMessageText(
        `✅ Bron muvaffaqiyatli bekor qilindi!\n\n` +
        `📅 Sana: ${formatDate(bookingDate)}\n` +
        `⏰ Vaqt: ${timeLabel}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Stadionni bron qilish uchun kunni tanlang:`,
        keyboard
      );
    }
    
    // Handle booked slot click (no action)
    else if (data.startsWith('slot_booked_')) {
      await ctx.answerCbQuery('Bu vaqt allaqachon band qilingan.');
    }
    
    // Handle penalty payment button
    else if (data.startsWith('penalty_payment_')) {
      const bookingId = data.replace('penalty_payment_', '');
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.userId !== userId) {
        await ctx.answerCbQuery('Bron topilmadi.');
        return;
      }
      
      await ctx.answerCbQuery();
      
      // Get admin contact info from .env or use default message
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPhone = process.env.ADMIN_PHONE || '';
      
      let adminContact = '';
      if (adminUsername && adminUsername !== 'admin') {
        adminContact = `\n📱 Admin Telegram: @${adminUsername}`;
      }
      if (adminPhone) {
        adminContact += `\n📞 Admin telefon:${adminPhone}`;
      }
      
      // Get user info
      let user = await User.findOne({ userId });
      if (!user) {
        user = await User.create({
          userId,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name
        });
      }
      
      // Update booking status to pending payment
      booking.penaltyPaymentStatus = 'pending';
      await booking.save();
      
      // Notify admin that user is ready to pay
      const { notifyAdminPaymentReady } = require('./adminBot');
      await notifyAdminPaymentReady(booking, user);
      
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.reply(
        `💰 <b>Jarima to'lovi</b>\n\n` +
        `Jarimani to'lash uchun quyidagi usullardan birini tanlang:\n\n` +
        `1️⃣ Adminning Telegram lichkasiga to'lov skrinshotini yuboring${adminContact}\n\n` +
        `2️⃣ Admin bilan kelishib oling - Admin bilan to'g'ridan-to'g'ri bog'laning va to'lov haqida kelishib oling.\n\n` +
        `⚠️ ESLATMA: To'lov skrinshotini adminning Telegram lichkasiga yuborish yoki admin bilan kelishib olish kerak. To'lov qilgandan so'ng, admin to'lovni tasdiqlaydi va sizga xabar keladi.\n\n` +
        `✅ Admin botga to'lov haqida xabar yuborildi.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Stadionni bron qilish uchun kunni tanlang:`,
        keyboard
      );
    }
    
  } catch (error) {
    console.error('Error handling callback:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

// Handle phone number sharing
bot.on('contact', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const phone = ctx.message.contact.phone_number;
    
    // Update user phone
    await User.findOneAndUpdate(
      { userId },
      { phone },
      { upsert: true, new: true }
    );
    
    const state = userStates.get(userId);
    
    if (state && state.type === 'booking') {
      // Complete the booking
      const { date, hourStart, hourEnd } = state;
      
      // Check if slot is still available
      const existingBooking = await Booking.findOne({
        date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        hourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.reply('❌ Bu vaqt boshqa foydalanuvchi tomonidan band qilingan. Iltimos, boshqa vaqtni tanlang.');
        userStates.delete(userId);
        return;
      }
      
      // Create booking
      const booking = await Booking.create({
        userId,
        date,
        hourStart,
        hourEnd,
        status: 'booked'
      });
      
      const user = await User.findOne({ userId });
      
      // Notify admin
      await notifyNewBooking(booking, user);
      
      // Notify channel (phone will be fetched in notifyChannelBooking function)
      await notifyChannelBooking(date, hourStart, hourEnd, userId, user.username || '');
      
        // Send daily schedule to admin and channel
        const { generateDailySchedule } = require('./utils/schedule');
        const { postDailyScheduleToAdmin } = require('./adminBot');
        const { postDailyScheduleToChannel } = require('./cron/schedule');
        const scheduleText = await generateDailySchedule(date);
        await postDailyScheduleToAdmin(scheduleText, date);
        await postDailyScheduleToChannel(scheduleText, date);
      
      const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd).padStart(2, '0')}:00`;
      const successMessage = `✅ Bron tasdiqlandi!\n\n` +
        `📅 Sana: ${formatDate(date)}\n` +
        `⏰ Vaqt: ${timeLabel}\n` +
        `💰 Narx: 200,000 so'm`;
      
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.reply(successMessage, keyboard);
      userStates.delete(userId);
    }
  } catch (error) {
    console.error('Error in bot.on("contact") handler:', error);
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } catch (innerError) {
      console.error('Error sending error message in contact handler:', innerError);
    }
  }
});

// Photo handler disabled - users now send screenshots to admin's personal Telegram
// No photo processing needed

// Handle text messages (unified handler for Reply Keyboard and late cancellation)
bot.on('text', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    const state = userStates.get(userId);
    
    // Handle Reply Keyboard buttons first
    if (text === '📅 Hafta jadvali') {
      await ctx.reply('Bron turini tanlang:', getBookingModeKeyboard());
      return;
    } else if (text === '❌ Bronni bekor qilish') {
      const buttons = [
        [Markup.button.callback('❌ Kunlik broni bekor qilish', 'cancel_daily_menu')],
        [Markup.button.callback('❌ Haftalik broni bekor qilish', 'cancel_weekly_menu')],
        [Markup.button.callback('🔙 Orqaga', 'back_to_week')]
      ];

      await ctx.reply('Bekor qilish turini tanlang:', {
        ...Markup.inlineKeyboard(buttons),
        parse_mode: 'HTML'
      });
      return;
    }
    
    // Handle late cancellation reason
    if (state && state.type === 'late_cancellation') {
      // Handle late cancellation reason (existing handler)
      const booking = await Booking.findById(state.bookingId);
      
      if (!booking || booking.userId !== userId) {
        await ctx.reply('❌ Bron topilmadi.');
        userStates.delete(userId);
        return;
      }
      
      // Extract reason and payment promise from text
      const lines = text.split('\n');
      const reason = lines[0] || text;
      const paymentPromise = lines.slice(1).join('\n') || 'Ko\'rsatilmagan';
      
      // Update booking
      booking.status = 'cancelled';
      booking.cancelTime = new Date();
      booking.cancelReason = reason;
      booking.penaltyAmount = 100000;
      booking.penaltyNotificationSent = true;
      await booking.save();
      
      const user = await User.findOne({ userId });
      
      // Notify admin with penalty info
      await notifyLateCancellationPenalty(booking, user, reason, paymentPromise);
      
      // Notify channel
      const bookingDate = new Date(booking.date);
      await notifyChannelCancellation(bookingDate, booking.hourStart, booking.hourEnd);
      
      // Send penalty notification to user automatically
      const { Telegraf } = require('telegraf');
      const mainBot = new Telegraf(process.env.BOT_TOKEN);
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
      const penaltyMessage = `⚠️ <b>JARIMA XABARNOMASI</b>\n\n` +
        `Siz bugungi kun (${formatDate(bookingDate)}) uchun ${timeLabel} vaqtidagi broningizni bekor qildingiz.\n\n` +
        `💰 <b>Jarima miqdori: 100,000 so'm</b>\n\n` +
        `Jarimani to'lash uchun quyidagi usullardan birini tanlang:\n` +
        `1️⃣ Adminning Telegram lichkasiga to'lov skrinshotini yuboring\n` +
        `📱 Admin Telegram: @${process.env.ADMIN_USERNAME || 'admin'}\n` +
        `📞 Admin telefon: ${process.env.ADMIN_PHONE || 'Ko\'rsatilmagan'}\n\n` +
        `2️⃣ Admin bilan kelishib oling\n\n` +
        `⚠️ ESLATMA: To'lov qilgandan so'ng, admin to'lovni tasdiqlaydi va sizga xabar keladi.`;
      
      try {
        await mainBot.telegram.sendMessage(userId, penaltyMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '💰 Jarimani to\'lash', callback_data: `penalty_payment_${booking._id}` }
            ]]
          }
        });
      } catch (error) {
        console.error('Error sending automatic penalty notification:', error);
      }
      
      // Send daily schedule to admin and channel
      const { generateDailySchedule } = require('./utils/schedule');
      const { postDailyScheduleToAdmin } = require('./adminBot');
      const { postDailyScheduleToChannel } = require('./cron/schedule');
      const scheduleText = await generateDailySchedule(bookingDate);
      await postDailyScheduleToAdmin(scheduleText, bookingDate);
      await postDailyScheduleToChannel(scheduleText, bookingDate);
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      
      await ctx.reply(
        `✅ <b>Bekor qilish qayta ishlandi.</b>\n\n` +
        `⚠️ Jarima: 100,000 so'm\n` +
        `📅 Sana: ${formatDate(bookingDate)}\n` +
        `⏰ Vaqt: ${timeLabel}\n\n` +
        `Sizning bekor qilish sababingiz va to'lov va'dangiz adminga yuborildi.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Stadionni bron qilish uchun kunni tanlang:`,
        keyboard
      );
      
      userStates.delete(userId);
    }
  } catch (error) {
    console.error('Error in bot.on("text") handler:', error);
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } catch (innerError) {
      console.error('Error sending error message in text handler:', innerError);
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

// Start bot
bot.launch().then(() => {
  console.log('✅ Main bot started');
}).catch((error) => {
  console.error('❌ Error starting bot:', error);
  process.exit(1);
});


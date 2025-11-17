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

// Store user states for cancellation flow
const userStates = new Map();

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
    `Bron qilgandan keyin, bekor qilmoqchi bo'lsangiz, kamida 1 kun oldin bekor qilishingiz kerak.\n` +
    `Xuddi shu kuni bekor qilish 100,000 so'm jarima to'lashni talab qiladi.\n` +
    `Stadion narxi soatiga 200,000 so'm.`;
  
  const currentWeekStart = getWeekStart();
  const keyboard = await createMainKeyboard(currentWeekStart);
  
  await ctx.reply(welcomeMessage, keyboard);
  
  // Set reply keyboard (always visible)
  await ctx.reply('📋 <b>Asosiy menu:</b>', {
    ...createUserReplyKeyboard(),
    parse_mode: 'HTML'
  });
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  
  try {
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
        userStates.set(userId, {
          type: 'booking',
          date: selectedDate,
          hourStart,
          hourEnd
        });
        return;
      }
      
      // Create booking
      const booking = await Booking.create({
        userId,
        date: selectedDate,
        hourStart,
        hourEnd,
        status: 'booked'
      });
      
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
      const successMessage = `✅ Bron tasdiqlandi!\n\n` +
        `📅 Sana: ${formatDate(selectedDate)}\n` +
        `⏰ Vaqt: ${timeLabel}\n` +
        `💰 Narx: 200,000 so'm`;
      
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
    
    // Handle cancel reservation
    else if (data === 'cancel_reservation') {
      // Get today's start time to include today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeBookings = await Booking.find({
        userId,
        status: 'booked',
        date: { $gte: today }
      }).sort({ date: 1 });
      
      if (activeBookings.length === 0) {
        await ctx.answerCbQuery('Sizda faol bronlar yo\'q.');
        await ctx.reply('❌ Bekor qilish uchun faol bronlar yo\'q.');
        return;
      }
      
      // Show list of bookings to cancel
      const buttons = activeBookings.map((booking, index) => {
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
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'back_to_week')]);
      
      // Check if there are same-day bookings and add warning
      const hasSameDayBookings = activeBookings.some(booking => {
        const bookingDate = new Date(booking.date);
        return isToday(bookingDate);
      });
      
      const messageText = hasSameDayBookings
        ? '⚠️ ESLATMA: Bugungi kun uchun bekor qilish 100,000 so\'m jarima to\'lashni talab qiladi.\n\n' +
          'Bekor qilish uchun bronni tanlang:'
        : 'Bekor qilish uchun bronni tanlang:';
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        messageText,
        {
          ...Markup.inlineKeyboard(buttons),
          parse_mode: 'HTML'
        }
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
          '⚠️ <b>JARIMA ESLATMASI</b>\n\n' +
          `Siz bugungi kun (${formatDate(bookingDate)}) uchun ${timeLabel} vaqtidagi broningizni bekor qilmoqdasiz.\n\n` +
          `💰 <b>Jarima miqdori: 100,000 so'm</b>\n\n` +
          `⚠️ <b>ESLATMA:</b> Bugungi kun uchun bekor qilish 100,000 so'm jarima to'lashni talab qiladi.\n\n` +
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
        `✅ <b>Bron muvaffaqiyatli bekor qilindi!</b>\n\n` +
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
        adminContact = `\n📱 <b>Admin Telegram:</b> @${adminUsername}`;
      }
      if (adminPhone) {
        adminContact += `\n📞 <b>Admin telefon:</b> ${adminPhone}`;
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
        `1️⃣ <b>Adminning Telegram lichkasiga to'lov skrinshotini yuboring</b>${adminContact}\n\n` +
        `2️⃣ <b>Admin bilan kelishib oling</b> - Admin bilan to'g'ridan-to'g'ri bog'laning va to'lov haqida kelishib oling.\n\n` +
        `⚠️ <b>ESLATMA:</b> To'lov skrinshotini adminning Telegram lichkasiga yuborish yoki admin bilan kelishib olish kerak. To'lov qilgandan so'ng, admin to'lovni tasdiqlaydi va sizga xabar keladi.\n\n` +
        `✅ Admin botga to'lov haqida xabar yuborildi.Admining karta raqami:${123456789}\n\n` +
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
});

// Photo handler disabled - users now send screenshots to admin's personal Telegram
// No photo processing needed

// Handle text messages (unified handler for Reply Keyboard and late cancellation)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const state = userStates.get(userId);
  
  // Handle Reply Keyboard buttons first
  if (text === '📅 Hafta jadvali') {
    const currentWeekStart = getWeekStart();
    const keyboard = await createMainKeyboard(currentWeekStart);
    await ctx.reply('📅 <b>Hafta jadvali:</b>', keyboard);
    return;
  } else if (text === '❌ Bronni bekor qilish') {
    // Get only today and future bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeBookings = await Booking.find({
      userId,
      status: 'booked',
      date: { $gte: today }
    }).sort({ date: 1, hourStart: 1 });
    
    if (activeBookings.length === 0) {
      await ctx.reply('❌ Bekor qilish uchun faol bronlar yo\'q.');
      return;
    }
    
    const buttons = activeBookings.map((booking, index) => {
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
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
    
    buttons.push([Markup.button.callback('🔙 Orqaga', 'back_to_week')]);
    
    const hasSameDayBookings = activeBookings.some(booking => {
      const bookingDate = new Date(booking.date);
      return isToday(bookingDate);
    });
    
    const messageText = hasSameDayBookings
      ? '⚠️ <b>ESLATMA:</b> Bugungi kun uchun bekor qilish 100,000 so\'m jarima to\'lashni talab qiladi.\n\n' +
        'Bekor qilish uchun bronni tanlang:'
      : 'Bekor qilish uchun bronni tanlang:';
    
    await ctx.reply(messageText, {
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


const { Telegraf, Markup } = require('telegraf');
const { formatDate, getWeekStart, isPastDate } = require('./utils/time');
const { createMainKeyboard } = require('./utils/keyboard');
const { getWeekSchedule, getWeekScheduleExcludingPast } = require('./utils/adminKeyboard');
const Booking = require('./models/Booking');
const User = require('./models/User');
const { notifyChannelBooking } = require('./cron/schedule');
require('dotenv').config();

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stadium-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Monitoring bot connected to MongoDB');
}).catch((error) => {
  console.error('❌ Monitoring bot MongoDB connection error:', error);
});

// Import createWeeklyBookings function
async function createWeeklyBookings(userId, firstDate, hourStart, hourEnd, weeklyGroupId) {
  // Limit weekly series to approximately 1 month (30 days) from first date
  const startDate = new Date(firstDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const date = new Date(d);

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      userId,
      date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
      hourStart,
      status: 'booked'
    });

    if (existingBooking) {
      console.log(`Slot already booked: ${formatDate(date)} ${hourStart}:00`);
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
    
    console.log(`Weekly booking created: ${formatDate(date)} ${hourStart}:00-${hourEnd}:00`);
  }
}

// Monitoring bot initialization
const monitoringBot = new Telegraf(process.env.MONITORING_BOT_TOKEN || '8799404582:AAHp8PWKH7vMbSn_LSms5tenhcpTKHt3oCQ');

// Allowed admin IDs (only this can use this bot)
const ADMIN_CHAT_IDS = ['7386008809'];

// Store monitoring bot states
const monitoringStates = new Map(); // Store admin states for booking flow
const monitoringBookingModes = new Map(); // Store admin booking mode: 'daily' or 'weekly'

function getMonitoringBookingMode(userId) {
  const mode = monitoringBookingModes.get(userId);
  return mode === 'weekly' ? 'weekly' : 'daily';
}

// Check if user is admin
function isAdmin(chatId) {
  return ADMIN_CHAT_IDS.includes(chatId.toString());
}

// Start command
monitoringBot.start(async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  const welcomeMessage = `👋 <b>Monitoring Bot</b>\n\n` +
    `Quyidagi funksiyalardan foydalaning:`;
  
  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback('📝📝📝 STADIONI YOZDIRISH 📝📝📝', 'monitoring_book')],
        [Markup.button.callback('📊 Joylarni ko\'rish', 'monitoring_schedule')],
        [Markup.button.callback('❌ Bronlarni bekor qilish', 'monitoring_cancel')]
      ]
    },
    parse_mode: 'HTML'
  });
});

// Handle callback queries
monitoringBot.on('callback_query', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('Siz admin emassiz!');
    return;
  }
  
  const data = ctx.callbackQuery.data;
  
  try {
    if (data === 'monitoring_book') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Bron turini tanlang:',
        {
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('📅 Bir kunlik yozdirish', 'monitoring_booking_mode_daily')],
              [Markup.button.callback('📆 Haftalik yozdirish (har hafta bir kun uchun)', 'monitoring_booking_mode_weekly')]
            ]
          },
          parse_mode: 'HTML'
        }
      );
    }
    else if (data === 'monitoring_booking_mode_daily') {
      monitoringBookingModes.set(ctx.from.id, 'daily');
      await ctx.answerCbQuery('Bir kunlik yozdirish rejimi tanlandi.');
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      await ctx.editMessageText(
        'Stadionni bir kunlik bron qilish uchun kunni tanlang:',
        keyboard
      );
    }
    else if (data === 'monitoring_booking_mode_weekly') {
      monitoringBookingModes.set(ctx.from.id, 'weekly');
      await ctx.answerCbQuery('Haftalik yozdirish rejimi tanlandi.');
      const currentWeekStart = getWeekStart();
      const keyboard = await createMainKeyboard(currentWeekStart);
      await ctx.editMessageText(
        'Stadionni haftalik bron qilish uchun kunni tanlang:',
        keyboard
      );
    }
    else if (data.startsWith('day_')) {
      const dateStr = data.replace('day_', '');
      // Parse date string (YYYY-MM-DD) correctly
      const selectedDate = new Date(dateStr + 'T00:00:00');
      
      if (isPastDate(selectedDate)) {
        await ctx.answerCbQuery('Bu kun allaqachon o\'tib ketgan.');
        await ctx.reply(
          '❌ Bu kun allaqachon o\'tib ketgan.\nIltimos, boshqa sanani tanlang.',
          {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('🔙 Orqaga', 'monitoring_back')]
              ]
            },
            parse_mode: 'HTML'
          }
        );
        return;
      }
      
      // Create time slots keyboard
      const timeSlots = [
        { start: 19, end: 20, label: '19:00–20:00' },
        { start: 20, end: 21, label: '20:00–21:00' },
        { start: 21, end: 22, label: '21:00–22:00' },
        { start: 22, end: 23, label: '22:00–23:00' },
        { start: 23, end: 0, label: '23:00–00:00' }
      ];
      
      const buttons = timeSlots.map(slot => [
        Markup.button.callback(slot.label, `monitoring_time_${dateStr}_${slot.start}_${slot.end}`)
      ]);
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'monitoring_back')]);
      
      const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      const dayName = dayNames[selectedDate.getDay()];
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📅 ${dayName}, ${formatDate(selectedDate)}\n\nVaqtni tanlang:`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        }
      );
    }
    else if (data.startsWith('monitoring_time_')) {
      const parts = data.replace('monitoring_time_', '').split('_');
      const dateStr = parts[0];
      const hourStart = parseInt(parts[1]);
      const hourEnd = parseInt(parts[2]);
      
      // Parse date string (YYYY-MM-DD) correctly
      const selectedDate = new Date(dateStr + 'T00:00:00');
      
      // Check if slot is available
      const existingBooking = await Booking.findOne({
        date: { $gte: selectedDate, $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) },
        hourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.answerCbQuery('Bu vaqt allaqachon band!');
        return;
      }
      
      // Store booking info in state
      const mode = getMonitoringBookingMode(ctx.from.id);
      monitoringStates.set(ctx.from.id, {
        type: 'monitoring_booking',
        date: selectedDate,
        hourStart,
        hourEnd,
        mode
      });
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📝 <b>Faqat telefon raqamini kiriting:</b>\n\n` +
        `Masalan: +998901234567`,
        {
          reply_markup: {
            inline_keyboard: [[
              Markup.button.callback('🔙 Bekor qilish', 'monitoring_back')
            ]]
          },
          parse_mode: 'HTML'
        }
      );
    }
    else if (data === 'monitoring_schedule') {
      await ctx.answerCbQuery('Jadval yuklanmoqda...');
      
      const weekStart = getWeekStart();
      const schedule = await getWeekScheduleExcludingPast(weekStart);
      
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      
      const buttons = [];
      if (prevWeekStart >= getWeekStart(new Date())) {
        buttons.push([Markup.button.callback('⬅️ Oldingi hafta', `monitoring_schedule_week_${prevWeekStart.toISOString().split('T')[0]}`)]);
      }
      buttons.push([Markup.button.callback('➡️ Keyingi hafta', `monitoring_schedule_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
      buttons.push([Markup.button.callback('🔙 Orqaga', 'monitoring_back')]);
      
      const message = `📊 <b>Haftalik jadval</b>\n\n${schedule || 'O\'tib ketgan kunlar ko\'rsatilmaydi.'}`;
      
      await ctx.editMessageText(message, {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML'
      });
    }
    else if (data === 'monitoring_cancel') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Bekor qilish turini tanlang:',
        {
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('❌ Kunlik broni bekor qilish', 'monitoring_cancel_daily')],
              [Markup.button.callback('❌ Haftalik broni bekor qilish', 'monitoring_cancel_weekly')],
              [Markup.button.callback('🔙 Orqaga', 'monitoring_back')]
            ]
          },
          parse_mode: 'HTML'
        }
      );
    }
    else if (data === 'monitoring_back') {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `👋 <b>Monitoring Bot</b>\n\n` +
        `Quyidagi funksiyalardan foydalaning:`,
        {
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('📝📝📝 STADIONI YOZDIRISH 📝📝📝', 'monitoring_book')],
              [Markup.button.callback('📊 Joylarni ko\'rish', 'monitoring_schedule')],
              [Markup.button.callback('❌ Bronlarni bekor qilish', 'monitoring_cancel')]
            ]
          },
          parse_mode: 'HTML'
        }
      );
    }
  } catch (error) {
    console.error('Monitoring bot callback error:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi.');
  }
});

// Help command
monitoringBot.help(async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  await ctx.reply(
    `📋 <b>Yordam</b>\n\n` +
    `Bu bot avtomatik ravishda ishlaydi:\n\n` +
    `🔹 <b>Bron qilinganda:</b>\n` +
    `• Qaysi chat ID orqali bron qilingan\n` +
    `• Bron tafsilotlari\n` +
    `• Vaqt va sana\n\n` +
    `🔹 <b>Bekor qilinganda:</b>\n` +
    `• Qaysi chat ID orqali bekor qilingan\n` +
    `• Bekor qilish sababi\n` +
    `• Vaqt va sana\n\n` +
    ` <b>Bog'lanish:</b> @admin`,
    { parse_mode: 'HTML' }
  );
});

// Status command
monitoringBot.command('status', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  await ctx.reply(
    `✅ <b>Bot Status</b>\n\n` +
    `🤖 Monitoring bot: Faol\n` +
    `👤 Admin: ${ctx.from.first_name}\n` +
    `🆔 Chat ID: ${ctx.from.id}\n` +
    `📊 Xabarlarni qabul qilish: Tayor\n\n` +
    `⏰ Oxirgi tekshiruv: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`,
    { parse_mode: 'HTML' }
  );
});

// Function to send booking notification
async function sendBookingNotification(chatId, bookingInfo, adminName) {
  try {
    const message = `🆕 <b>YANGI STADION BRONI</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Admin:</b> ${adminName}\n` +
      `🆔 <b>Chat ID:</b> ${chatId}\n\n` +
      `📅 <b>Sana:</b> ${bookingInfo.date}\n` +
      `⏰ <b>Vaqt:</b> ${bookingInfo.time}\n` +
      `📞 <b>Telefon:</b> ${bookingInfo.phone}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Stadion muvaffaqiyat bron qilindi!`;
    
    // Send to all admin IDs
    for (const adminId of ADMIN_CHAT_IDS) {
      await monitoringBot.telegram.sendMessage(adminId, message, {
        parse_mode: 'HTML'
      });
    }
    
    console.log(`✅ Booking notification sent for chat ID: ${chatId}`);
  } catch (error) {
    console.error('❌ Error sending booking notification:', error);
  }
}

// Function to send cancellation notification
async function sendCancellationNotification(chatId, bookingInfo, adminName, reason = '') {
  try {
    const message = `❌ <b>STADION BRON BEKOR QILINDI</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Admin:</b> ${adminName}\n` +
      `🆔 <b>Chat ID:</b> ${chatId}\n\n` +
      `📅 <b>Sana:</b> ${bookingInfo.date}\n` +
      `⏰ <b>Vaqt:</b> ${bookingInfo.time}\n` +
      `📞 <b>Telefon:</b> ${bookingInfo.phone}\n` +
      `${reason ? `\n📝 <b>Sababi:</b> ${reason}` : ''}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ Stadion bron qilindi va bekor qilindi!`;
    
    // Send to all admin IDs
    for (const adminId of ADMIN_CHAT_IDS) {
      await monitoringBot.telegram.sendMessage(adminId, message, {
        parse_mode: 'HTML'
      });
    }
    
    console.log(`✅ Cancellation notification sent for chat ID: ${chatId}`);
  } catch (error) {
    console.error('❌ Error sending cancellation notification:', error);
  }
}

// Handle text messages for booking input
monitoringBot.on('text', async (ctx) => {
  try {
    if (!isAdmin(ctx.from.id)) return;
    
    const text = ctx.message.text;
    
    // Check if user is in booking state
    const state = monitoringStates.get(ctx.from.id);
    
    if (state && state.type === 'monitoring_booking') {
      // Handle booking phone input
      const { date, hourStart, hourEnd, mode } = state;
      
      // Validate phone number
      const phoneRegex = /^\+998\d{9}$/;
      if (!phoneRegex.test(text)) {
        await ctx.reply(
          '❌ Noto\'g\'ri telefon raqami formati!\n\n' +
          'Iltimos, quyidagi formatda kiriting:\n' +
          '+998901234567\n\n' +
          'Yoki qaytadan urining:',
          {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('🔙 Orqaga', 'monitoring_back')]
              ]
            },
            parse_mode: 'HTML'
          }
        );
        return;
      }
      
      const phone = text.trim();
      
      // Check if user exists with this phone
      const existingUser = await User.findOne({ phone });
      
      if (!existingUser) {
        await ctx.reply(
          '❌ Bu telefon raqami bilan foydalanuvchi topilmadi.\n\n' +
          'Iltimos, avval botdan ro\'yxatdan o\'tganingizni tekshiring.\n' +
          'Yoki boshqa telefon raqamini kiriting:',
          {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('🔙 Orqaga', 'monitoring_back')]
              ]
            },
            parse_mode: 'HTML'
          }
        );
        return;
      }
      
      const monitoringUserId = existingUser.userId;
      
      // Create booking
      let booking;
      if (mode === 'weekly') {
        // Check active weekly groups limit (max 8)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeWeeklyGroups = await Booking.distinct('weeklyGroupId', {
          userId: monitoringUserId,
          isWeekly: true,
          weeklyGroupId: { $ne: null },
          status: 'booked',
          date: { $gte: today }
        });
        const activeWeeklyCount = activeWeeklyGroups.filter(g => g !== null).length;
        if (activeWeeklyCount >= 8) {
          await ctx.reply(
            '❌ Bu foydalanuvchida allaqachon 8 ta haftalik bron mavjud. Yangi haftalik bron qilishdan oldin mavjud haftalik bronlardan birini bekor qiling.',
            {
              reply_markup: {
                inline_keyboard: [
                  [Markup.button.callback('🔙 Orqaga', 'monitoring_back')]
                ]
              },
              parse_mode: 'HTML'
            }
          );
          return;
        }

        const weeklyGroupId = `${monitoringUserId}_${Date.now()}_${hourStart}`;
        // Create first booking as part of weekly series
        booking = await Booking.create({
          userId: monitoringUserId,
          date,
          hourStart,
          hourEnd,
          status: 'booked',
          isWeekly: true,
          weeklyGroupId
        });

        // Create future weekly bookings
        await createWeeklyBookings(monitoringUserId, date, hourStart, hourEnd, weeklyGroupId);
      } else {
        // Create single (daily) booking
        booking = await Booking.create({
          userId: monitoringUserId,
          date,
          hourStart,
          hourEnd,
          status: 'booked'
        });
      }
      
      // Clear state
      monitoringStates.delete(ctx.from.id);
      
      // Notify channel
      try {
        await notifyChannelBooking(date, hourStart, hourEnd);
      } catch (notifyError) {
        console.error('Error notifying channel for monitoring booking:', notifyError);
      }
      
      // Send notification to admin
      const adminInfo = ctx.from;
      const adminName = adminInfo.first_name || adminInfo.username || 'Admin';
      const bookingInfo = {
        date: formatDate(date),
        time: `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd === 0 ? '00' : hourEnd).padStart(2, '0')}:00`,
        phone: phone
      };
      
      try {
        await sendBookingNotification(monitoringUserId, bookingInfo, adminName);
      } catch (error) {
        console.error('Error sending booking notification:', error);
      }
      
      const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd === 0 ? '00' : hourEnd).padStart(2, '0')}:00`;
      
      let successMessage = `✅ <b>Bron muvaffaqiyatli qilindi!</b>\n\n` +
        `📅 Sana: ${formatDate(date)}\n` +
        `⏰ Vaqt: ${timeLabel}\n` +
        `📞 Telefon: ${phone}`;
      
      if (mode === 'weekly') {
        successMessage += '\n\n📆 <b>Haftalik bron yaratildi!</b>\nHar hafta shu kun va vaqtda bron qilinadi.';
      }
      
      await ctx.reply(
        successMessage,
        {
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔙 Asosiy menyu', 'monitoring_back')]
            ]
          },
          parse_mode: 'HTML'
        }
      );
      
      return;
    }
  } catch (error) {
    console.error('Error in monitoringBot.on("text") handler:', error);
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } catch (innerError) {
      console.error('Error sending error message in monitoringBot.on("text") handler:', innerError);
    }
  }
});

// Error handling
monitoringBot.catch((err, ctx) => {
  console.error('Monitoring bot error:', err);
});

// Start the bot
monitoringBot.launch()
  .then(() => {
    console.log('✅ Stadium Monitoring Bot started successfully!');
    console.log(`👤 Admin Chat ID: ${ADMIN_CHAT_ID}`);
  })
  .catch((error) => {
    console.error('❌ Error starting monitoring bot:', error);
  });

// Graceful shutdown
process.once('SIGINT', () => monitoringBot.stop('SIGINT'));
process.once('SIGTERM', () => monitoringBot.stop('SIGTERM'));

// Export functions for use in admin bot
module.exports = {
  sendBookingNotification,
  sendCancellationNotification,
  monitoringBot
};

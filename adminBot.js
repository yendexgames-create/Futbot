const { Telegraf, Markup } = require('telegraf');
const { formatDate, getWeekStart } = require('./utils/time');
const { createAdminReplyKeyboard, createAdminDateKeyboard, createAdminTimeKeyboard, getWeekSchedule, getWeekScheduleExcludingPast } = require('./utils/adminKeyboard');
const Booking = require('./models/Booking');
const User = require('./models/User');
const { notifyChannelBooking } = require('./cron/schedule');
require('dotenv').config();

let adminBot = null;
const adminStates = new Map(); // Store admin states for booking flow

/**
 * Get admin bot instance
 */
function getAdminBot() {
  return adminBot;
}

/**
 * Initialize admin bot
 */
function initAdminBot() {
  if (!process.env.ADMIN_BOT_TOKEN) {
    console.warn('⚠️ Admin bot token not provided');
    return null;
  }
  
  adminBot = new Telegraf(process.env.ADMIN_BOT_TOKEN);
  
  // Admin start command
  adminBot.start(async (ctx) => {
    const adminChatId = ctx.from.id.toString();
    if (adminChatId !== process.env.ADMIN_CHAT_ID) {
      await ctx.reply('❌ Siz admin emassiz!');
      return;
    }
    
    const welcomeMessage = `👋 <b>Admin panel</b>\n\n` +
      `Quyidagi funksiyalardan foydalaning:`;
    
    // Faqat Reply Keyboard (asosiy menu)
    await ctx.reply(welcomeMessage, {
      ...createAdminReplyKeyboard(),
      parse_mode: 'HTML'
    });
  });
  
  // Handle admin callback queries
  adminBot.on('callback_query', async (ctx) => {
    const adminChatId = ctx.from.id.toString();
    if (adminChatId !== process.env.ADMIN_CHAT_ID) {
      await ctx.answerCbQuery('Siz admin emassiz!');
      return;
    }
    
    const data = ctx.callbackQuery.data;
    
    try {
      // Admin book button
      if (data === 'admin_book') {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '📅 <b>Stadioni yozdirish uchun sanani tanlang:</b>',
          {
            ...createAdminDateKeyboard(),
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin date selection
      else if (data.startsWith('admin_date_')) {
        const dateStr = data.replace('admin_date_', '');
        // Parse date string (YYYY-MM-DD) as local date, not UTC
        const [year, month, day] = dateStr.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          `📅 <b>Sana:</b> ${formatDate(selectedDate)}\n\n` +
          `⏰ <b>Vaqtni tanlang:</b>`,
          {
            ...createAdminTimeKeyboard(dateStr),
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin time selection
      else if (data.startsWith('admin_time_')) {
        const parts = data.replace('admin_time_', '').split('_');
        const dateStr = parts[0];
        const hourStart = parseInt(parts[1]);
        const hourEnd = parseInt(parts[2]);
        
        // Parse date string (YYYY-MM-DD) as local date, not UTC
        const [year, month, day] = dateStr.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        
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
        adminStates.set(adminChatId, {
          type: 'admin_booking',
          date: selectedDate,
          hourStart,
          hourEnd
        });
        
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          `📝 <b>Ism yoki telefon raqamni kiriting:</b>\n\n` +
          `Masalan: Akmal yoki +998901234567`,
          {
            reply_markup: {
              inline_keyboard: [[
                Markup.button.callback('🔙 Bekor qilish', 'admin_back')
              ]]
            },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin view schedule
      else if (data === 'admin_view_schedule') {
        await ctx.answerCbQuery('Jadval yuklanmoqda...');
        
        const weekStart = getWeekStart();
        const schedule = await getWeekScheduleExcludingPast(weekStart);
        
        // Calculate next and previous week
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        
        const buttons = [];
        if (prevWeekStart >= getWeekStart(new Date())) {
          buttons.push([Markup.button.callback('⬅️ Oldingi hafta', `admin_schedule_week_${prevWeekStart.toISOString().split('T')[0]}`)]);
        }
        buttons.push([Markup.button.callback('➡️ Keyingi hafta', `admin_schedule_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        const message = `📊 <b>Haftalik jadval</b>\n\n${schedule || 'O\'tib ketgan kunlar ko\'rsatilmaydi.'}`;
        
        await ctx.editMessageText(message, {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        });
      }
      
      // Admin schedule week navigation
      else if (data.startsWith('admin_schedule_week_')) {
        const dateStr = data.replace('admin_schedule_week_', '');
        const [year, month, day] = dateStr.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        
        await ctx.answerCbQuery('Jadval yuklanmoqda...');
        
        const schedule = await getWeekScheduleExcludingPast(weekStart);
        
        // Calculate next and previous week
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        
        const buttons = [];
        if (prevWeekStart >= getWeekStart(new Date())) {
          buttons.push([Markup.button.callback('⬅️ Oldingi hafta', `admin_schedule_week_${prevWeekStart.toISOString().split('T')[0]}`)]);
        }
        buttons.push([Markup.button.callback('➡️ Keyingi hafta', `admin_schedule_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        const message = `📊 <b>Haftalik jadval</b>\n\n${schedule || 'O\'tib ketgan kunlar ko\'rsatilmaydi.'}`;
        
        await ctx.editMessageText(message, {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        });
      }
      
      // Admin cancel booking
      else if (data === 'admin_cancel_booking') {
        await ctx.answerCbQuery('Bronlar yuklanmoqda...');
        
        // Get only today and future bookings (o'tib ketgan kunlarni chiqarmaslik)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const bookings = await Booking.find({
          status: 'booked',
          date: { $gte: today }
        }).sort({ date: 1, hourStart: 1 });
        
        if (bookings.length === 0) {
          await ctx.editMessageText(
            '❌ Yozdirilgan bronlar topilmadi.',
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        // Get users for bookings
        const userIds = bookings.map(b => b.userId);
        const users = await User.find({ userId: { $in: userIds } });
        const userMap = {};
        users.forEach(u => userMap[u.userId] = u);
        
        // Get day names
        const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        
        const buttons = bookings.map(booking => {
          const user = userMap[booking.userId];
          const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
          const userPhone = user && user.phone ? ` (${user.phone})` : '';
          const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
          const bookingDate = new Date(booking.date);
          const dayName = dayNames[bookingDate.getDay()];
          
          return [Markup.button.callback(
            `${dayName} ${timeLabel} - ${userName}${userPhone}`,
            `admin_cancel_${booking._id}`
          )];
        });
        
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        await ctx.editMessageText(
          `❌ <b>Bekor qilish uchun bronni tanlang:</b>\n\n` +
          `📊 Jami: ${bookings.length} ta yozdirilgan bron`,
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin cancel specific booking
      else if (data.startsWith('admin_cancel_')) {
        const bookingId = data.replace('admin_cancel_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking || booking.status !== 'booked') {
          await ctx.answerCbQuery('Bron topilmadi yoki allaqachon bekor qilingan.');
          return;
        }
        
        booking.status = 'cancelled';
        booking.cancelTime = new Date();
        await booking.save();
        
        const user = await User.findOne({ userId: booking.userId });
        const { notifyChannelCancellation } = require('./cron/schedule');
        await notifyChannelCancellation(booking.date, booking.hourStart, booking.hourEnd);
        
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        await ctx.answerCbQuery('Bron bekor qilindi!');
        
        // Refresh bookings list - only today and future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const bookings = await Booking.find({
          status: 'booked',
          date: { $gte: today }
        }).sort({ date: 1, hourStart: 1 });
        
        if (bookings.length === 0) {
          await ctx.editMessageText(
            '✅ <b>Bron bekor qilindi!</b>\n\n' +
            `📅 Sana: ${formatDate(booking.date)}\n` +
            `⏰ Vaqt: ${timeLabel}\n` +
            `👤 Foydalanuvchi: ${user ? (user.username ? `@${user.username}` : user.firstName || 'Noma\'lum') : 'Noma\'lum'}\n\n` +
            `❌ Faol bronlar qolmadi.`,
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        // Get users for bookings
        const userIds = bookings.map(b => b.userId);
        const users = await User.find({ userId: { $in: userIds } });
        const userMap = {};
        users.forEach(u => userMap[u.userId] = u);
        
        const buttons = bookings.map(b => {
          const u = userMap[b.userId];
          const tLabel = `${String(b.hourStart).padStart(2, '0')}:00–${String(b.hourEnd).padStart(2, '0')}:00`;
          const uName = u ? (u.firstName || u.phone || 'Noma\'lum') : 'Noma\'lum';
          return [Markup.button.callback(
            `${formatDate(b.date)} ${tLabel} - ${uName}`,
            `admin_cancel_${b._id}`
          )];
        });
        
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        await ctx.editMessageText(
          `✅ <b>Bron bekor qilindi!</b>\n\n` +
          `📅 Sana: ${formatDate(booking.date)}\n` +
          `⏰ Vaqt: ${timeLabel}\n` +
          `👤 Foydalanuvchi: ${user ? (user.username ? `@${user.username}` : user.firstName || 'Noma\'lum') : 'Noma\'lum'}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `❌ <b>Bekor qilish uchun bronni tanlang:</b>\n\n` +
          `📊 Jami: ${bookings.length} ta faol bron`,
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin penalty - show only today's bookings
      else if (data === 'admin_penalty') {
        await ctx.answerCbQuery('Bronlar yuklanmoqda...');
        
        // Get only today's bookings
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const bookings = await Booking.find({
          date: { $gte: today, $lt: tomorrow },
          status: 'booked'
        }).sort({ hourStart: 1 });
        
        if (bookings.length === 0) {
          await ctx.editMessageText(
            `❌ Bugungi kun uchun band bronlar topilmadi.`,
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        // Get users for bookings
        const userIds = bookings.map(b => b.userId);
        const users = await User.find({ userId: { $in: userIds } });
        const userMap = {};
        users.forEach(u => userMap[u.userId] = u);
        
        const buttons = bookings.map(booking => {
          const user = userMap[booking.userId];
          const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
          const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
          const userPhone = user && user.phone ? ` (${user.phone})` : '';
          
          // Check if penalty already set
          const hasPenalty = booking.penaltyAmount > 0;
          const penaltyStatus = hasPenalty 
            ? (booking.penaltyPaid && booking.penaltyPaymentStatus === 'approved' 
                ? ' [✅ To\'lov qabul qilindi]' 
                : booking.penaltyPaymentStatus === 'pending' 
                  ? ' [⏳ To\'lov kutilmoqda]' 
                  : ' [💰 Jarima belgilangan]')
            : '';
          
          return [Markup.button.callback(
            `${timeLabel} - ${userName}${userPhone}${penaltyStatus}`,
            `admin_set_penalty_${booking._id}`
          )];
        });
        
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        await ctx.editMessageText(
          `💰 <b>Jarima belgilash:</b> ${formatDate(today)}\n\n` +
          `Quyidagi band vaqtlar uchun jarima belgilash mumkin:\n\n` +
          `📊 Jami: ${bookings.length} ta band vaqt`,
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin set penalty for specific booking
      else if (data.startsWith('admin_set_penalty_')) {
        const bookingId = data.replace('admin_set_penalty_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking || booking.status !== 'booked') {
          await ctx.answerCbQuery('Bron topilmadi.');
          return;
        }
        
        // Check if time has passed - vaqt kelmaguncha jarima belgilab bo'lmasin
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const bookingDateTime = new Date(bookingDate);
        bookingDateTime.setHours(booking.hourStart, 0, 0, 0);
        
        if (now < bookingDateTime) {
          await ctx.answerCbQuery(`⚠️ Vaqt hali kelmagan! Jarimani ${booking.hourStart}:00 dan keyin belgilash mumkin.`);
          return;
        }
        
        const user = await User.findOne({ userId: booking.userId });
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
        const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
        
        // Set penalty amount (default 100,000)
        booking.penaltyAmount = 100000;
        booking.penaltyNotificationSent = true;
        await booking.save();
        
        // Notify user about penalty
        const { Telegraf } = require('telegraf');
        const mainBot = new Telegraf(process.env.BOT_TOKEN);
        
        try {
          await mainBot.telegram.sendMessage(
            booking.userId,
            `⚠️ <b>JARIMA BELGILANDI</b>\n\n` +
            `📅 Sana: ${formatDate(booking.date)}\n` +
            `⏰ Vaqt: ${timeLabel}\n` +
            `💰 Jarima miqdori: ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
            `Jarimani to'lash uchun quyidagi usullardan birini tanlang:\n` +
            `1️⃣ Adminning Telegram lichkasiga to'lov skrinshotini yuboring\n` +
            `📱 Admin Telegram: @${process.env.ADMIN_USERNAME || 'admin'}\n` +
            `📞 Admin telefon: ${process.env.ADMIN_PHONE || 'Ko\'rsatilmagan'}\n\n` +
            `2️⃣ Admin bilan kelishib oling\n\n` +
            `⚠️ ESLATMA: To'lov qilgandan so'ng, admin to'lovni tasdiqlaydi va sizga xabar keladi.`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  { text: '🔙 Asosiy joyga qaytish', callback_data: 'back_to_week' }
                ]]
              }
            }
          );
        } catch (error) {
          console.error('Error sending penalty notification to user:', error);
        }
        
        await ctx.answerCbQuery('Jarima belgilandi!');
        
        // Refresh the list - only today's bookings
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const bookings = await Booking.find({
          date: { $gte: today, $lt: tomorrow },
          status: 'booked'
        }).sort({ hourStart: 1 });
        
        if (bookings.length === 0) {
          await ctx.editMessageText(
            `✅ <b>Jarima belgilandi!</b>\n\n` +
            `👤 Foydalanuvchi: ${userName}\n` +
            `⏰ Vaqt: ${timeLabel}\n` +
            `💰 Jarima: ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
            `❌ Bugungi kun uchun boshqa band bronlar qolmadi.`,
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        const userIds = bookings.map(b => b.userId);
        const users = await User.find({ userId: { $in: userIds } });
        const userMap = {};
        users.forEach(u => userMap[u.userId] = u);
        
        const buttons = bookings.map(b => {
          const u = userMap[b.userId];
          const tLabel = `${String(b.hourStart).padStart(2, '0')}:00–${String(b.hourEnd === 0 ? '00' : b.hourEnd).padStart(2, '0')}:00`;
          const uName = u ? (u.firstName || u.phone || 'Noma\'lum') : 'Noma\'lum';
          const uPhone = u && u.phone ? ` (${u.phone})` : '';
          
          const hasPenalty = b.penaltyAmount > 0;
          const penaltyStatus = hasPenalty 
            ? (b.penaltyPaid && b.penaltyPaymentStatus === 'approved' 
                ? ' [✅ To\'lov qabul qilindi]' 
                : b.penaltyPaymentStatus === 'pending' 
                  ? ' [⏳ To\'lov kutilmoqda]' 
                  : ' [💰 Jarima belgilangan]')
            : '';
          
          return [Markup.button.callback(
            `${tLabel} - ${uName}${uPhone}${penaltyStatus}`,
            `admin_set_penalty_${b._id}`
          )];
        });
        
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        await ctx.editMessageText(
          `✅ <b>Jarima belgilandi!</b>\n\n` +
          `👤 Foydalanuvchi: ${userName}\n` +
          `⏰ Vaqt: ${timeLabel}\n` +
          `💰 Jarima: ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `💰 <b>Jarima belgilash:</b> ${formatDate(today)}\n\n` +
          `📊 Jami: ${bookings.length} ta band vaqt`,
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin view penalty payments (old functionality - keep for backward compatibility)
      else if (data === 'admin_view_penalties') {
        await ctx.answerCbQuery('Bronlar yuklanmoqda...');
        
        // Get today's bookings with penalty
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const bookings = await Booking.find({
          status: 'booked',
          date: { $gte: today, $lt: tomorrow },
          penaltyAmount: { $gt: 0 }
        }).sort({ hourStart: 1 });
        
        if (bookings.length === 0) {
          await ctx.editMessageText(
            '❌ Bugungi kun uchun jarima belgilangan bronlar topilmadi.',
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        const userIds = bookings.map(b => b.userId);
        const users = await User.find({ userId: { $in: userIds } });
        const userMap = {};
        users.forEach(u => userMap[u.userId] = u);
        
        const buttons = bookings.map(booking => {
          const user = userMap[booking.userId];
          const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
          const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
          const userPhone = user && user.phone ? ` (${user.phone})` : '';
          
          let statusText = '';
          if (booking.penaltyPaid && booking.penaltyPaymentStatus === 'approved') {
            statusText = ' [✅ To\'lov qabul qilindi]';
          } else if (booking.penaltyPaymentStatus === 'pending') {
            statusText = ' [⏳ To\'lov kutilmoqda]';
          } else {
            statusText = ' [💰 To\'lov kutilmoqda]';
          }
          
          return [Markup.button.callback(
            `${timeLabel} - ${userName}${userPhone}${statusText}`,
            `admin_penalty_${booking._id}`
          )];
        });
        
        buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
        
        await ctx.editMessageText(
          '💰 <b>Jarima to\'lovlarini ko\'rish:</b>\n\n' +
          'To\'lov qilgan foydalanuvchilarni tanlang va to\'lovni tasdiqlang:',
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin penalty specific booking - show payment confirmation
      else if (data.startsWith('admin_penalty_')) {
        const bookingId = data.replace('admin_penalty_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking || booking.status !== 'booked') {
          await ctx.answerCbQuery('Bron topilmadi.');
          return;
        }
        
        const user = await User.findOne({ userId: booking.userId });
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        
        // Check if payment already approved
        if (booking.penaltyPaid && booking.penaltyPaymentStatus === 'approved') {
          await ctx.answerCbQuery('To\'lov allaqachon qabul qilingan!');
          await ctx.editMessageText(
            `✅ <b>To'lov qabul qilingan!</b>\n\n` +
            `👤 <b>Foydalanuvchi:</b> ${user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum'}\n` +
            `📞 <b>Telefon:</b> ${user && user.phone ? user.phone : 'Ko\'rsatilmagan'}\n` +
            `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
            `📅 <b>Sana:</b> ${formatDate(booking.date)}\n` +
            `💰 <b>Jarima:</b> ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
            `✅ To'lov qabul qilingan va foydalanuvchiga xabar yuborilgan.`,
            {
              ...createAdminReplyKeyboard(),
              parse_mode: 'HTML'
            }
          );
          return;
        }
        
        // Show payment confirmation dialog
        await ctx.editMessageText(
          `💰 <b>Jarima to'lovi tasdiqlash</b>\n\n` +
          `👤 <b>Foydalanuvchi:</b> ${user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum'}\n` +
          `📞 <b>Telefon:</b> ${user && user.phone ? user.phone : 'Ko\'rsatilmagan'}\n` +
          `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
          `📅 <b>Sana:</b> ${formatDate(booking.date)}\n` +
          `💰 <b>Jarima:</b> ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
          `Foydalanuvchi to'lov skrinshotini adminning Telegram lichkasiga yuborgan yoki admin bilan kelishib olgan.\n\n` +
          `To'lovni tasdiqlaysizmi?`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Ha, u to\'lov qildi', callback_data: `admin_confirm_payment_${booking._id}` },
                { text: '❌ Bekor qilish', callback_data: 'admin_back' }
              ]]
            },
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin confirm payment
      else if (data.startsWith('admin_confirm_payment_')) {
        const bookingId = data.replace('admin_confirm_payment_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
          await ctx.answerCbQuery('Bron topilmadi.');
          return;
        }
        
        // Update booking payment status
        booking.penaltyPaymentStatus = 'approved';
        booking.penaltyPaid = true;
        await booking.save();
        
        const user = await User.findOne({ userId: booking.userId });
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        
        // Notify user
        const { Telegraf } = require('telegraf');
        const mainBot = new Telegraf(process.env.BOT_TOKEN);
        
        try {
          await mainBot.telegram.sendMessage(
            booking.userId,
            `✅ <b>Jarima to'lovi qabul qilindi!</b>\n\n` +
            `💰 Jarima miqdori: ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
            `📌 <b>ESLATMA:</b> Keyingi safar ertaroq harakat qiling!`,
            { parse_mode: 'HTML' }
          );
        } catch (error) {
          console.error('Error sending payment confirmation to user:', error);
        }
        
        await ctx.answerCbQuery('To\'lov qabul qilindi!');
        await ctx.editMessageText(
          `✅ <b>To'lov qabul qilindi!</b>\n\n` +
          `👤 <b>Foydalanuvchi:</b> ${user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum'}\n` +
          `📞 <b>Telefon:</b> ${user && user.phone ? user.phone : 'Ko\'rsatilmagan'}\n` +
          `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
          `📅 <b>Sana:</b> ${formatDate(booking.date)}\n` +
          `💰 <b>Jarima:</b> ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
          `Foydalanuvchiga xabar yuborildi.`,
          {
            ...createAdminMainKeyboard(),
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin approve penalty payment
      else if (data.startsWith('admin_approve_penalty_')) {
        const bookingId = data.replace('admin_approve_penalty_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
          await ctx.answerCbQuery('Bron topilmadi.');
          return;
        }
        
        booking.penaltyPaymentStatus = 'approved';
        booking.penaltyPaid = true;
        await booking.save();
        
        // Notify user
        const { Telegraf } = require('telegraf');
        const mainBot = new Telegraf(process.env.BOT_TOKEN);
        
        try {
          await mainBot.telegram.sendMessage(
            booking.userId,
            `✅ <b>Jarimangiz qabul qilindi!</b>\n\n` +
            `💰 Jarima miqdori: ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
            `📌 <b>ESLATMA:</b> Keyingi safar ertaroq harakat qiling!`,
            { parse_mode: 'HTML' }
          );
        } catch (error) {
          console.error('Error sending approval message:', error);
        }
        
        await ctx.answerCbQuery('To\'lov qabul qilindi!');
        await ctx.editMessageText(
          '✅ <b>To\'lov qabul qilindi va foydalanuvchiga xabar yuborildi!</b>',
          {
            ...createAdminMainKeyboard(),
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin reject penalty payment
      else if (data.startsWith('admin_reject_penalty_')) {
        const bookingId = data.replace('admin_reject_penalty_', '');
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
          await ctx.answerCbQuery('Bron topilmadi.');
          return;
        }
        
        booking.penaltyPaymentStatus = 'rejected';
        await booking.save();
        
        // Notify user
        const { Telegraf } = require('telegraf');
        const mainBot = new Telegraf(process.env.BOT_TOKEN);
        
        try {
          await mainBot.telegram.sendMessage(
            booking.userId,
            `❌ <b>To'lov rad etildi</b>\n\n` +
            `Iltimos, to'lov skrinshotini qayta yuboring yoki naqd pul bilan to'lang.`,
            { parse_mode: 'HTML' }
          );
        } catch (error) {
          console.error('Error sending rejection message:', error);
        }
        
        await ctx.answerCbQuery('To\'lov rad etildi!');
        await ctx.editMessageText(
          '❌ <b>To\'lov rad etildi va foydalanuvchiga xabar yuborildi!</b>',
          {
            ...createAdminMainKeyboard(),
            parse_mode: 'HTML'
          }
        );
      }
      
      // Admin back button - faqat Reply Keyboard qaytaradi
      else if (data === 'admin_back') {
        await ctx.answerCbQuery();
        await ctx.reply(
          `👋 <b>Admin panel</b>\n\n` +
          `Quyidagi funksiyalardan foydalaning:`,
          {
            ...createAdminReplyKeyboard(),
            parse_mode: 'HTML'
          }
        );
        adminStates.delete(adminChatId);
      }
      
    } catch (error) {
      console.error('Admin bot callback error:', error);
      await ctx.answerCbQuery('Xatolik yuz berdi.');
    }
  });
  
  // Handle admin text messages (unified handler for Reply Keyboard and booking input)
  adminBot.on('text', async (ctx) => {
    const adminChatId = ctx.from.id.toString();
    if (adminChatId !== process.env.ADMIN_CHAT_ID) return;
    
    const text = ctx.message.text;
    
    // Check if user is in booking state first
    const state = adminStates.get(adminChatId);
    
    if (state && state.type === 'admin_booking') {
      // Handle booking name/phone input
      const { date, hourStart, hourEnd } = state;
      
      // Check if slot is still available
      const existingBooking = await Booking.findOne({
        date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        hourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.reply('❌ Bu vaqt allaqachon band qilingan!');
        adminStates.delete(adminChatId);
        return;
      }
      
      // Create booking with special userId (negative for admin bookings)
      const adminUserId = -Math.abs(parseInt(adminChatId));
      const booking = await Booking.create({
        userId: adminUserId,
        date,
        hourStart,
        hourEnd,
        status: 'booked'
      });
      
      // Create or update user with name/phone
      const phoneMatch = text.match(/\+?\d{9,13}/);
      const phone = phoneMatch ? phoneMatch[0] : null;
      const name = phone ? text.replace(phone, '').trim() : text;
      
      await User.findOneAndUpdate(
        { userId: adminUserId },
        {
          userId: adminUserId,
          username: null,
          phone: phone || name,
          firstName: name,
          lastName: null
        },
        { upsert: true, new: true }
      );
      
      const user = await User.findOne({ userId: adminUserId });
      
      // Notify channel (pass name as userName, phone will be fetched in notifyChannelBooking)
      await notifyChannelBooking(date, hourStart, hourEnd, adminUserId, name || phone || '');
      
      const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd === 0 ? '00' : hourEnd).padStart(2, '0')}:00`;
      
      await ctx.reply(
        `✅ <b>Bron muvaffaqiyatli qilindi!</b>\n\n` +
        `📅 Sana: ${formatDate(date)}\n` +
        `⏰ Vaqt: ${timeLabel}\n` +
        `👤 Ism/Nomer: ${name}${phone ? `\n📞 Telefon: ${phone}` : ''}`,
        {
          ...createAdminReplyKeyboard(),
          parse_mode: 'HTML'
        }
      );
      
      adminStates.delete(adminChatId);
      return;
    }
    
    // Handle Reply Keyboard buttons
    if (text === '📝📝📝 STADIONI YOZDIRISH 📝📝📝' || text === '📝 Stadioni yozdirish') {
      await ctx.reply('📅 <b>Stadioni yozdirish uchun sanani tanlang:</b>', {
        ...createAdminDateKeyboard(),
        parse_mode: 'HTML'
      });
    } else if (text === '📊 Joylarni ko\'rish') {
      const weekStart = getWeekStart();
      const schedule = await getWeekScheduleExcludingPast(weekStart);
      
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      
      const buttons = [];
      if (prevWeekStart >= getWeekStart(new Date())) {
        buttons.push([Markup.button.callback('⬅️ Oldingi hafta', `admin_schedule_week_${prevWeekStart.toISOString().split('T')[0]}`)]);
      }
      buttons.push([Markup.button.callback('➡️ Keyingi hafta', `admin_schedule_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
      buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
      
      await ctx.reply(`📊 <b>Haftalik jadval</b>\n\n${schedule || 'O\'tib ketgan kunlar ko\'rsatilmaydi.'}`, {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML'
      });
    } else if (text === '❌ Bronlarni bekor qilish') {
      // Get only today and future bookings (o'tib ketgan kunlarni chiqarmaslik)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const bookings = await Booking.find({
        status: 'booked',
        date: { $gte: today }
      }).sort({ date: 1, hourStart: 1 });
      
      if (bookings.length === 0) {
        await ctx.reply('❌ Yozdirilgan bronlar topilmadi.', {
          ...createAdminReplyKeyboard(),
          parse_mode: 'HTML'
        });
        return;
      }
      
      const userIds = bookings.map(b => b.userId);
      const users = await User.find({ userId: { $in: userIds } });
      const userMap = {};
      users.forEach(u => userMap[u.userId] = u);
      
      const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      
      const buttons = bookings.map(booking => {
        const user = userMap[booking.userId];
        const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
        const userPhone = user && user.phone ? ` (${user.phone})` : '';
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
        const bookingDate = new Date(booking.date);
        const dayName = dayNames[bookingDate.getDay()];
        
        return [Markup.button.callback(
          `${dayName} ${timeLabel} - ${userName}${userPhone}`,
          `admin_cancel_${booking._id}`
        )];
      });
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
      
      await ctx.reply(
        `❌ <b>Bekor qilish uchun bronni tanlang:</b>\n\n` +
        `📊 Jami: ${bookings.length} ta yozdirilgan bron`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        }
      );
    } else if (text === '💰 Jarima belgilash') {
      // Get only today's bookings
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const bookings = await Booking.find({
        date: { $gte: today, $lt: tomorrow },
        status: 'booked'
      }).sort({ hourStart: 1 });
      
      if (bookings.length === 0) {
        await ctx.reply(`❌ Bugungi kun uchun band bronlar topilmadi.`, {
          ...createAdminReplyKeyboard(),
          parse_mode: 'HTML'
        });
        return;
      }
      
      const userIds = bookings.map(b => b.userId);
      const users = await User.find({ userId: { $in: userIds } });
      const userMap = {};
      users.forEach(u => userMap[u.userId] = u);
      
      const buttons = bookings.map(booking => {
        const user = userMap[booking.userId];
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
        const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
        const userPhone = user && user.phone ? ` (${user.phone})` : '';
        
        const hasPenalty = booking.penaltyAmount > 0;
        const penaltyStatus = hasPenalty 
          ? (booking.penaltyPaid && booking.penaltyPaymentStatus === 'approved' 
              ? ' [✅ To\'lov qabul qilindi]' 
              : booking.penaltyPaymentStatus === 'pending' 
                ? ' [⏳ To\'lov kutilmoqda]' 
                : ' [💰 Jarima belgilangan]')
          : '';
        
        return [Markup.button.callback(
          `${timeLabel} - ${userName}${userPhone}${penaltyStatus}`,
          `admin_set_penalty_${booking._id}`
        )];
      });
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
      
      await ctx.reply(
        `💰 <b>Jarima belgilash:</b> ${formatDate(today)}\n\n` +
        `Quyidagi band vaqtlar uchun jarima belgilash mumkin:\n\n` +
        `📊 Jami: ${bookings.length} ta band vaqt`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        }
      );
    }
  });
  
  adminBot.launch().then(() => {
    console.log('✅ Admin bot started');
  }).catch((error) => {
    console.error('❌ Error starting admin bot:', error);
  });
  
  return adminBot;
}

/**
 * Send new booking notification to admin
 */
async function notifyNewBooking(booking, user) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
    const phone = user.phone || 'Ko\'rsatilmagan';
    const username = user.username ? `@${user.username}` : 'Ko\'rsatilmagan';
    
    const message = `📥 Yangi bron!\n\n` +
      `📅 Kun: ${formatDate(booking.date)}\n` +
      `⏰ Vaqt: ${timeLabel}\n` +
      `👤 Ism: ${username}\n` +
      `📞 Telefon: ${phone}\n` +
      `🆔 Foydalanuvchi ID: ${user.userId}`;
    
    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message);
  } catch (error) {
    console.error('❌ Error sending booking notification to admin:', error);
  }
}

/**
 * Send cancellation notification to admin
 */
async function notifyCancellation(booking, user, isLate = false) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
    const phone = user.phone || 'Ko\'rsatilmagan';
    const username = user.username ? `@${user.username}` : 'Ko\'rsatilmagan';
    
    let message = `❌ Bekor qilish`;
    if (isLate) {
      message += ` (Kechikkan - Jarima talab qilinadi)`;
    }
    message += `\n\n` +
      `📅 Kun: ${formatDate(booking.date)}\n` +
      `⏰ Vaqt: ${timeLabel}\n` +
      `👤 Ism: ${username}\n` +
      `📞 Telefon: ${phone}\n` +
      `🆔 Foydalanuvchi ID: ${user.userId}`;
    
    if (booking.cancelReason) {
      message += `\n\n📝 Sabab: ${booking.cancelReason}`;
    }
    
    if (isLate && booking.penaltyAmount > 0) {
      message += `\n\n💰 Jarima: ${booking.penaltyAmount.toLocaleString()} so'm`;
    }
    
    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message);
  } catch (error) {
    console.error('❌ Error sending cancellation notification to admin:', error);
  }
}

/**
 * Send late cancellation penalty notification to admin
 */
async function notifyLateCancellationPenalty(booking, user, reason, paymentPromise) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
    const phone = user.phone || 'Ko\'rsatilmagan';
    const username = user.username ? `@${user.username}` : 'Ko\'rsatilmagan';
    
    const message = `⚠️ <b>KECHIKKAN BEKOR QILISH - JARIMA TO'LOV TALAB QILINADI</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Foydalanuvchi:</b> ${username}\n` +
      `📞 <b>Telefon raqami:</b> ${phone}\n` +
      `🆔 <b>User ID:</b> ${user.userId}\n\n` +
      `📅 <b>Bron sanasi:</b> ${formatDate(booking.date)}\n` +
      `⏰ <b>Vaqt:</b> ${timeLabel}\n\n` +
      `💰 <b>JARIMA:</b> ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
      `📝 <b>Bekor qilish sababi:</b>\n${reason}\n\n` +
      `💳 <b>To'lov va'dasi:</b>\n${paymentPromise}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ <b>Bu foydalanuvchi ${booking.penaltyAmount.toLocaleString()} so'm jarima to'lashi kerak!</b>`;
    
    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error sending late cancellation penalty notification:', error);
  }
}

/**
 * Notify admin that user is ready to pay penalty
 */
async function notifyAdminPaymentReady(booking, user) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
    const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
    const userPhone = user && user.phone ? user.phone : 'Ko\'rsatilmagan';
    const userUsername = user && user.username ? `@${user.username}` : '';
    
    const message = `💰 <b>YANGI JARIMA TO'LOVI</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Foydalanuvchi:</b> ${userName}\n` +
      `${userUsername ? `📱 <b>Username:</b> ${userUsername}\n` : ''}` +
      `📞 <b>Telefon:</b> ${userPhone}\n` +
      `📅 <b>Sana:</b> ${formatDate(booking.date)}\n` +
      `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
      `💰 <b>Jarima:</b> ${booking.penaltyAmount.toLocaleString()} so'm\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ <b>Foydalanuvchi to'lov qilishga tayyor!</b>\n\n` +
      `Foydalanuvchi adminning Telegram lichkasiga to'lov skrinshotini yuboradi yoki admin bilan kelishib oladi.\n\n` +
      `To'lovni tasdiqlash uchun "Jarima belgilash" bo'limiga o'ting.`;
    
  } catch (error) {
    console.error('❌ Error notifying admin about payment ready:', error);
  }
}

/**
 * Post daily schedule to admin
 */
async function postDailyScheduleToAdmin(scheduleText, date) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, scheduleText, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error posting schedule to admin:', error);
  }
}

/**
 * Gracefully stop admin bot
 */
function stopAdminBot() {
  if (adminBot) {
    adminBot.stop();
  }
}

module.exports = {
  initAdminBot,
  getAdminBot,
  notifyNewBooking,
  notifyCancellation,
  notifyLateCancellationPenalty,
  notifyAdminPaymentReady,
  postDailyScheduleToAdmin,
  stopAdminBot
};


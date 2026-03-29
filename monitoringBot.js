const { Telegraf, Markup } = require('telegraf');
const { formatDate, formatDateShort, getWeekDays } = require('./utils/time');
require('dotenv').config();

// Monitoring bot initialization
const monitoringBot = new Telegraf(process.env.MONITORING_BOT_TOKEN || '8799404582:AAHp8PWKH7vMbSn_LSms5tenhcpTKHt3oCQ');

// Allowed admin ID (only you can use this bot)
const ADMIN_CHAT_ID = process.env.MONITORING_ADMIN_CHAT_ID || '7386008809';

// Models
const Booking = require('./models/Booking');
const User = require('./models/User');

// State management for monitoring bot
const monitoringStates = new Map();

// Check if user is admin
function isAdmin(chatId) {
  return chatId.toString() === ADMIN_CHAT_ID;
}

// Start command
monitoringBot.start(async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  await ctx.reply(
    `👋 <b>Stadion Monitoring Boti</b>\n\n` +
    `Bu bot sizga stadion bron va bekor qilish haqidagi xabarlarni yuboradi.\n\n` +
    `📊 <b>Funksiyalar:</b>\n` +
    `• Stadion bron qilinganda xabar\n` +
    `• Bron bekor qilinganda xabar\n` +
    `• Vaqt almashtirish\n` +
    `• Bronni surish\n` +
    `• Qaysi chat ID orqali bo'lganligi\n\n` +
    `🤖 Bot admin botdan ma'lumotlarni qabul qiladi va sizga yuboradi.\n\n` +
    `✅ Bot tayyor va ishlayapti!`,
    { parse_mode: 'HTML' }
  );
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
    `🔹 <b>Qo'shimcha funksiyalar:</b>\n` +
    `/reschedule - Vaqt almashtirish\n` +
    `/move - Bronni surish\n` +
    `/bookings - Barcha bronlarni ko'rish\n\n` +
    `📞 <b>Bog'lanish:</b> @admin`,
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

// View all bookings command
monitoringBot.command('bookings', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
      status: 'booked',
      date: { $gte: today }
    }).sort({ date: 1, hourStart: 1 });
    
    if (bookings.length === 0) {
      await ctx.reply('📊 <b>Hozircha faol bronlar yo\'q</b>', { parse_mode: 'HTML' });
      return;
    }
    
    let message = `📊 <b>Faol bronlar (${bookings.length} ta)</b>\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const booking of bookings) {
      const user = await User.findOne({ userId: booking.userId });
      const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
      const userPhone = user && user.phone ? ` (${user.phone})` : '';
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
      
      message += `📅 <b>${formatDate(booking.date)}</b>\n` +
                 `⏰ <b>${timeLabel}</b>\n` +
                 `👤 <b>${userName}${userPhone}</b>\n` +
                 `🆔 <b>ID: ${booking._id}</b>\n\n`;
    }
    
    await ctx.reply(message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

// Reschedule command - vaqt almashtirish
monitoringBot.command('reschedule', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
      status: 'booked',
      date: { $gte: today }
    }).sort({ date: 1, hourStart: 1 });
    
    if (bookings.length === 0) {
      await ctx.reply('📊 <b>Hozircha faol bronlar yo\'q</b>', { parse_mode: 'HTML' });
      return;
    }
    
    const buttons = bookings.map(booking => {
      const user = await User.findOne({ userId: booking.userId });
      const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
      const label = `${formatDate(booking.date)} ${timeLabel} - ${userName}`;
      
      return [Markup.button.callback(label, `monitor_reschedule_${booking._id}`)];
    });
    
    buttons.push([Markup.button.callback('🔙 Orqaga', 'monitor_back')]);
    
    await ctx.reply(
      `📅 <b>Vaqt almashtirish uchun bronni tanlang:</b>\n\n` +
      `📊 Jami: ${bookings.length} ta bron`,
      {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML'
      }
    );
  } catch (error) {
    console.error('Error in reschedule command:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

// Move booking command - bronni surish
monitoringBot.command('move', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Siz bu botdan foydalanishga ruxsatsiz.');
    return;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
      status: 'booked',
      date: { $gte: today }
    }).sort({ date: 1, hourStart: 1 });
    
    if (bookings.length === 0) {
      await ctx.reply('📊 <b>Hozircha faol bronlar yo\'q</b>', { parse_mode: 'HTML' });
      return;
    }
    
    const buttons = bookings.map(booking => {
      const user = await User.findOne({ userId: booking.userId });
      const userName = user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum';
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
      const label = `${formatDate(booking.date)} ${timeLabel} - ${userName}`;
      
      return [Markup.button.callback(label, `monitor_move_${booking._id}`)];
    });
    
    buttons.push([Markup.button.callback('🔙 Orqaga', 'monitor_back')]);
    
    await ctx.reply(
      `📅 <b>Bronni surish uchun bronni tanlang:</b>\n\n` +
      `📊 Jami: ${bookings.length} ta bron`,
      {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML'
      }
    );
  } catch (error) {
    console.error('Error in move command:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

// Handle callback queries
monitoringBot.on('callback_query', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('Siz admin emassiz!');
    return;
  }
  
  const data = ctx.callbackQuery.data;
  
  try {
    // Handle reschedule booking selection
    if (data.startsWith('monitor_reschedule_')) {
      const bookingId = data.replace('monitor_reschedule_', '');
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.status !== 'booked') {
        await ctx.answerCbQuery('Bron topilmadi yoki allaqachon bekor qilingan.');
        return;
      }
      
      // Store booking info in state
      monitoringStates.set(ctx.from.id, {
        type: 'reschedule',
        bookingId: bookingId,
        originalBooking: booking
      });
      
      // Show time slots for reschedule
      const timeSlots = [
        { start: 19, end: 20, label: '19:00–20:00' },
        { start: 20, end: 21, label: '20:00–21:00' },
        { start: 21, end: 22, label: '21:00–22:00' },
        { start: 22, end: 23, label: '22:00–23:00' },
        { start: 23, end: 0, label: '23:00–00:00' }
      ];
      
      const buttons = timeSlots.map(slot => [
        Markup.button.callback(
          `🔄 ${slot.label}`,
          `monitor_reschedule_time_${bookingId}_${slot.start}_${slot.end}`
        )
      ]);
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'monitor_back')]);
      
      await ctx.editMessageText(
        `⏰ <b>Yangi vaqtni tanlang:</b>\n\n` +
        `📅 Sana: ${formatDate(booking.date)}\n` +
        `⏰ Joriy vaqt: ${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00\n\n` +
        `Quyidan yangi vaqtni tanlang (faqat bo'sh vaqtlar almashtiriladi):`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        }
      );
      
      await ctx.answerCbQuery();
    }
    
    // Handle move booking selection
    else if (data.startsWith('monitor_move_')) {
      const bookingId = data.replace('monitor_move_', '');
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.status !== 'booked') {
        await ctx.answerCbQuery('Bron topilmadi yoki allaqachon bekor qilingan.');
        return;
      }
      
      // Store booking info in state
      monitoringStates.set(ctx.from.id, {
        type: 'move',
        bookingId: bookingId,
        originalBooking: booking
      });
      
      // Show date selection for move
      const buttons = [];
      for (let i = 0; i < 14; i++) {
        const day = new Date();
        day.setDate(day.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        const dayName = formatDateShort(day);
        
        buttons.push([Markup.button.callback(
          `${dayName}`,
          `monitor_move_date_${bookingId}_${dateKey}`
        )]);
      }
      
      buttons.push([Markup.button.callback('🔙 Orqaga', 'monitor_back')]);
      
      await ctx.editMessageText(
        `📅 <b>Yangi sanani tanlang:</b>\n\n` +
        `📅 Joriy sana: ${formatDate(booking.date)}\n` +
        `⏰ Vaqt: ${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00\n\n` +
        `Bronni qaysi kunga surmoqchisiz?`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML'
        }
      );
      
      await ctx.answerCbQuery();
    }
    
    // Handle reschedule time selection
    else if (data.startsWith('monitor_reschedule_time_')) {
      const parts = data.replace('monitor_reschedule_time_', '').split('_');
      const bookingId = parts[0];
      const newHourStart = parseInt(parts[1]);
      const newHourEnd = parseInt(parts[2]);
      
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.status !== 'booked') {
        await ctx.answerCbQuery('Bron topilmadi yoki allaqachon bekor qilingan.');
        return;
      }
      
      // Check if new time slot is available
      const existingBooking = await Booking.findOne({
        _id: { $ne: bookingId },
        date: booking.date,
        hourStart: newHourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.answerCbQuery('Bu vaqt allaqachon band!');
        return;
      }
      
      // Update booking
      const oldHourStart = booking.hourStart;
      const oldHourEnd = booking.hourEnd;
      
      booking.hourStart = newHourStart;
      booking.hourEnd = newHourEnd;
      await booking.save();
      
      // Notify about reschedule
      const user = await User.findOne({ userId: booking.userId });
      const oldLabel = `${String(oldHourStart).padStart(2, '0')}:00–${String(oldHourEnd === 0 ? '00' : oldHourEnd).padStart(2, '0')}:00`;
      const newLabel = `${String(newHourStart).padStart(2, '0')}:00–${String(newHourEnd === 0 ? '00' : newHourEnd).padStart(2, '0')}:00`;
      
      const message = `🔄 <b>BRON VAQTI ALMASHTIRILDI!</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📅 <b>Sana:</b> ${formatDate(booking.date)}\n` +
        `⏰ <b>Avvalgi vaqt:</b> ${oldLabel}\n` +
        `⏰ <b>Yangi vaqt:</b> ${newLabel}\n` +
        `👤 <b>Foydalanuvchi:</b> ${user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum'}\n` +
        `📞 <b>Telefon:</b> ${user && user.phone ? user.phone : 'Noma\'lum'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Monitoring bot tomonidan muvaffaqiyatli almashtirildi!`;
      
      await ctx.editMessageText(message, { parse_mode: 'HTML' });
      await ctx.answerCbQuery('Vaqt muvaffaqiyatli almashtirildi!');
      
      // Clear state
      monitoringStates.delete(ctx.from.id);
    }
    
    // Handle move date selection
    else if (data.startsWith('monitor_move_date_')) {
      const parts = data.replace('monitor_move_date_', '').split('_');
      const bookingId = parts[0];
      const newDateStr = parts[1];
      
      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.status !== 'booked') {
        await ctx.answerCbQuery('Bron topilmadi yoki allaqachon bekor qilingan.');
        return;
      }
      
      // Parse new date
      const [year, month, day] = newDateStr.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      
      // Check if new date slot is available
      const existingBooking = await Booking.findOne({
        _id: { $ne: bookingId },
        date: newDate,
        hourStart: booking.hourStart,
        status: 'booked'
      });
      
      if (existingBooking) {
        await ctx.answerCbQuery('Bu kun va vaqt allaqachon band!');
        return;
      }
      
      // Update booking
      const oldDate = booking.date;
      booking.date = newDate;
      await booking.save();
      
      // Notify about move
      const user = await User.findOne({ userId: booking.userId });
      const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
      
      const message = `📅 <b>BRON SURILDI!</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📅 <b>Avvalgi sana:</b> ${formatDate(oldDate)}\n` +
        `📅 <b>Yangi sana:</b> ${formatDate(newDate)}\n` +
        `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
        `👤 <b>Foydalanuvchi:</b> ${user ? (user.firstName || user.phone || 'Noma\'lum') : 'Noma\'lum'}\n` +
        `📞 <b>Telefon:</b> ${user && user.phone ? user.phone : 'Noma\'lum'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Monitoring bot tomonidan muvaffaqiyatli surildi!`;
      
      await ctx.editMessageText(message, { parse_mode: 'HTML' });
      await ctx.answerCbQuery('Bron muvaffaqiyatli surildi!');
      
      // Clear state
      monitoringStates.delete(ctx.from.id);
    }
    
    // Handle back button
    else if (data === 'monitor_back') {
      await ctx.editMessageText(
        `🔙 <b>Asosiy menyuga qaytdingiz</b>\n\n` +
        `📊 <b>Mavjud komandalar:</b>\n` +
        `/bookings - Barcha bronlarni ko'rish\n` +
        `/reschedule - Vaqt almashtirish\n` +
        `/move - Bronni surish\n` +
        `/status - Bot holati\n` +
        `/help - Yordam`,
        { parse_mode: 'HTML' }
      );
      await ctx.answerCbQuery();
      
      // Clear state
      monitoringStates.delete(ctx.from.id);
    }
    
  } catch (error) {
    console.error('Error in monitoring bot callback:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi.');
  }
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
    
    await monitoringBot.telegram.sendMessage(ADMIN_CHAT_ID, message, {
      parse_mode: 'HTML'
    });
    
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
    
    await monitoringBot.telegram.sendMessage(ADMIN_CHAT_ID, message, {
      parse_mode: 'HTML'
    });
    
    console.log(`✅ Cancellation notification sent for chat ID: ${chatId}`);
  } catch (error) {
    console.error('❌ Error sending cancellation notification:', error);
  }
}

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

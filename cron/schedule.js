const cron = require('node-cron');
const { Telegraf } = require('telegraf');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { formatDate, getTimeSlots } = require('../utils/time');
const { maskPhoneNumber } = require('../utils/phone');

let botInstance = null;
let channelId = null;

/**
 * Initialize the cron scheduler with bot and channel
 */
function initScheduler(bot, channel) {
  botInstance = bot;
  channelId = channel;
  
  // Schedule daily post at 06:00
  cron.schedule('0 6 * * *', async () => {
    await postDailySchedule('ertalab');
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  // Schedule evening post at 19:30
  cron.schedule('30 19 * * *', async () => {
    await postDailySchedule('kechqurun');
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  // Schedule channel schedule post every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    await postChannelSchedule();
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  // Schedule reminder 30 minutes before booking time
  cron.schedule('*/5 * * * *', async () => {
    await sendBookingReminders();
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  console.log('✅ Cron scheduler initialized - Daily schedule at 06:00, 19:30, har 3 soatda va 30 daqiqa oldin eslatma');
}

/**
 * Notify channel when an existing booking time is rescheduled
 */
async function notifyChannelReschedule(date, oldHourStart, oldHourEnd, newHourStart, newHourEnd, userId) {
  if (!botInstance || !channelId) return;

  try {
    const { formatDate } = require('../utils/time');
    const oldLabel = `${String(oldHourStart).padStart(2, '0')}:00–${String(oldHourEnd === 0 ? '00' : oldHourEnd).padStart(2, '0')}:00`;
    const newLabel = `${String(newHourStart).padStart(2, '0')}:00–${String(newHourEnd === 0 ? '00' : newHourEnd).padStart(2, '0')}:00`;

    const user = await User.findOne({ userId });
    const maskedPhone = user && user.phone ? maskPhoneNumber(user.phone) : 'Ko\'rsatilmagan';

    const message = `🔄 <b>Bron vaqti almashtirildi</b>\n\n` +
      `📅 <b>Sana:</b> ${formatDate(date)}\n` +
      `⏰ <b>Eski vaqt:</b> ${oldLabel}\n` +
      `⏰ <b>Yangi vaqt:</b> ${newLabel}\n` +
      `📞 <b>Telefon:</b> ${maskedPhone}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    await botInstance.telegram.sendMessage(channelId, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error notifying channel about reschedule:', error);
  }
}

/**
 * Post daily schedule to channel
 */
async function postDailySchedule(timeOfDay = 'ertalab') {
  if (!botInstance || !channelId) {
    console.error('❌ Bot or channel not initialized');
    return;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get bookings for today
    const bookings = await Booking.find({
      date: { $gte: today, $lt: tomorrow },
      status: 'booked'
    });
    
    const bookedHours = new Set(bookings.map(b => b.hourStart));
    const timeSlots = getTimeSlots();
    
    const timeEmoji = timeOfDay === 'ertalab' ? '🌅' : '🌆';
    const timeText = timeOfDay === 'ertalab' ? 'Ertalabki jadval' : 'Kechqurunki jadval';
    
    let scheduleText = `${timeEmoji} <b>${timeText}</b>\n`;
    scheduleText += `📅 <b>${formatDate(today)}</b>\n\n`;
    scheduleText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const slot of timeSlots) {
      if (bookedHours.has(slot.start)) {
        scheduleText += `❌ ${slot.label} - <b>Band</b>\n`;
      } else {
        scheduleText += `🟢 ${slot.label} - <b>Bo'sh</b>\n`;
      }
    }
    
    scheduleText += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    scheduleText += `⚽ <b>Bo'sh vaqtni bron qilish uchun quyidagi tugmani bosing:</b>`;
    
    const keyboard = {
      inline_keyboard: [[
        { text: '⚽ Stadionni bron qilish', url: `https://t.me/${botInstance.botInfo.username}` }
      ]]
    };
    
    await botInstance.telegram.sendMessage(channelId, scheduleText, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    
    console.log(`✅ ${timeText} posted to channel for ${formatDate(today)}`);
  } catch (error) {
    console.error('❌ Error posting daily schedule:', error);
  }
}

/**
 * Update channel when booking is made
 */
async function notifyChannelBooking(date, hourStart, hourEnd, userId, userName = '') {
  if (!botInstance || !channelId) return;
  
  try {
    const { formatDate } = require('../utils/time');
    const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd).padStart(2, '0')}:00`;
    
    // Get user phone number
    const user = await User.findOne({ userId });
    const maskedPhone = user && user.phone ? maskPhoneNumber(user.phone) : 'Ko\'rsatilmagan';

    // Detect if this booking is part of a weekly series
    let weeklyLabel = '';
    try {
      const booking = await Booking.findOne({
        userId,
        date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        hourStart,
        status: 'booked'
      });
      if (booking && booking.isWeekly) {
        weeklyLabel = '\n📆 <b>Haftalik bron:</b> Har hafta shu kuni shu vaqtda maydon band.';
      }
    } catch (lookupError) {
      console.error('Error checking weekly status for channel booking notification:', lookupError);
    }
    
    // Format userName - if it starts with @, keep it, otherwise show as name
    let userDisplay = '';
    if (userName) {
      if (userName.startsWith('@')) {
        userDisplay = `\n👤 <b>Username:</b> ${userName}`;
      } else {
        userDisplay = `\n👤 <b>Ism:</b> ${userName}`;
      }
    }
    
    const message = `✅ <b>Yangi bron!</b>\n\n` +
      `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
      `📅 <b>Sana:</b> ${formatDate(date)}\n` +
      `📞 <b>Telefon:</b> ${maskedPhone}${userDisplay}${weeklyLabel}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`;
    
    await botInstance.telegram.sendMessage(channelId, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error notifying channel about booking:', error);
  }
}

/**
 * Post schedule to channel every 3 hours
 */
async function postChannelSchedule() {
  if (!botInstance || !channelId) return;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get bookings for today
    const bookings = await Booking.find({
      date: { $gte: today, $lt: tomorrow },
      status: 'booked'
    });
    
    const bookedHours = new Set(bookings.map(b => b.hourStart));
    const timeSlots = getTimeSlots();
    
    let scheduleText = `📊 <b>Bugungi jadval</b>\n`;
    scheduleText += `📅 <b>${formatDate(today)}</b>\n\n`;
    scheduleText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const slot of timeSlots) {
      if (bookedHours.has(slot.start)) {
        scheduleText += `❌ ${slot.label} - <b>Band</b>\n`;
      } else {
        scheduleText += `🟢 ${slot.label} - <b>Bo'sh</b>\n`;
      }
    }
    
    scheduleText += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    scheduleText += `⚽ <b>Bo'sh vaqtni bron qilish uchun quyidagi tugmani bosing:</b>`;
    
    const keyboard = {
      inline_keyboard: [[
        { text: '⚽ Stadionni bron qilish', url: `https://t.me/${botInstance.botInfo.username}` }
      ]]
    };
    
    await botInstance.telegram.sendMessage(channelId, scheduleText, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    
    console.log(`✅ Channel schedule posted for ${formatDate(today)}`);
  } catch (error) {
    console.error('❌ Error posting channel schedule:', error);
  }
}

/**
 * Send reminders 30 minutes before booking time
 */
async function sendBookingReminders() {
  if (!botInstance) return;
  
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's bookings that haven't sent reminder
    const bookings = await Booking.find({
      status: 'booked',
      date: { $gte: today, $lt: tomorrow },
      reminderSent: false
    });
    
    for (const booking of bookings) {
      const bookingDate = new Date(booking.date);
      bookingDate.setHours(booking.hourStart, 0, 0, 0);
      
      // Check if it's 30 minutes before booking time
      const timeDiff = bookingDate.getTime() - now.getTime();
      if (timeDiff >= 25 * 60 * 1000 && timeDiff <= 35 * 60 * 1000) {
        const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
        
        try {
          await botInstance.telegram.sendMessage(
            booking.userId,
            `⏰ <b>ESLATMA</b>\n\n` +
            `Sizning o'yiningiz bor bugun ${timeLabel} vaqtida.\n` +
            `📅 Sana: ${formatDate(bookingDate)}\n\n` +
            `Iltimos, vaqtida kelishingizni eslang!`,
            { parse_mode: 'HTML' }
          );
          
          booking.reminderSent = true;
          await booking.save();
        } catch (error) {
          console.error('Error sending reminder:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendBookingReminders:', error);
  }
}

/**
 * Update channel when booking is cancelled
 */
async function notifyChannelCancellation(date, hourStart, hourEnd) {
  if (!botInstance || !channelId) return;
  
  try {
    const { formatDate } = require('../utils/time');
    const timeLabel = `${String(hourStart).padStart(2, '0')}:00–${String(hourEnd).padStart(2, '0')}:00`;
    
    const message = `⚠️ <b>Vaqt bo'sh bo'ldi!</b>\n\n` +
      `⏰ <b>Vaqt:</b> ${timeLabel}\n` +
      `📅 <b>Sana:</b> ${formatDate(date)}\n\n` +
      `💡 <b>Endi bron qilishingiz mumkin!</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`;
    
    const keyboard = {
      inline_keyboard: [[
        { text: '⚽ Hozir bron qilish', url: `https://t.me/${botInstance.botInfo.username}` }
      ]]
    };
    
    await botInstance.telegram.sendMessage(channelId, message, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error notifying channel about cancellation:', error);
  }
}

/**
 * Post daily schedule to channel
 */
async function postDailyScheduleToChannel(scheduleText, date) {
  if (!botInstance || !channelId) return;
  
  try {
    const keyboard = {
      inline_keyboard: [[
        { text: '⚽ Stadionni bron qilish', url: `https://t.me/${botInstance.botInfo.username}` }
      ]]
    };
    
    await botInstance.telegram.sendMessage(channelId, scheduleText, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error posting schedule to channel:', error);
  }
}

module.exports = {
  initScheduler,
  postDailySchedule,
  postChannelSchedule,
  postDailyScheduleToChannel,
  sendBookingReminders,
  notifyChannelBooking,
  notifyChannelCancellation,
  notifyChannelReschedule
};


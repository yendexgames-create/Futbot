const { Telegraf, Markup } = require('telegraf');
const { formatDate, getWeekStart, isPastDate } = require('./utils/time');
const { createAdminReplyKeyboard, getWeekSchedule, getWeekScheduleExcludingPast } = require('./utils/adminKeyboard');
const Booking = require('./models/Booking');
const User = require('./models/User');
const { notifyChannelBooking } = require('./cron/schedule');
const { sendBookingNotification, sendCancellationNotification } = require('./monitoringBot');
require('dotenv').config();

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stadium-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Admin bot connected to MongoDB');
}).catch((error) => {
  console.error('❌ Admin bot MongoDB connection error:', error);
});

let adminBot = null;
// Support multiple admin chat IDs via environment variable.
// Example in .env:
// ADMIN_CHAT_IDS=123456789,987654321
// For backward compatibility, single ADMIN_CHAT_ID is also supported.
const ADMIN_IDS = (() => {
  // Uchta chat ID ga ruxsat
  const allowedIds = ['739525204', '7439840181', '7386008809'];
  return allowedIds;
})();

function isAdmin(chatId) {
  if (!chatId) return false;
  const idStr = chatId.toString();
  return ADMIN_IDS.includes(idStr);
}

const adminStates = new Map(); // Store admin states for booking flow
const adminBookingModes = new Map(); // Store admin booking mode: 'daily' or 'weekly'

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
    try {
      const adminChatId = ctx.from.id.toString();
      if (!isAdmin(adminChatId)) {
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
    } catch (error) {
      console.error('Error in adminBot.start handler:', error);
      try {
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      } catch (innerError) {
        console.error('Error sending error message in adminBot.start handler:', innerError);
      }
    }
  });
  
  // Handle admin callback queries
  adminBot.on('callback_query', async (ctx) => {
    const adminChatId = ctx.from.id.toString();
    if (!isAdmin(adminChatId)) {
      await ctx.answerCbQuery('Siz admin emassiz!');
      return;
    }
    
    const data = ctx.callbackQuery.data;
    
    try {

      // Admin block specific user
      if (data.startsWith('admin_block_user_')) {
        const targetIdStr = data.replace('admin_block_user_', '');
        const targetId = parseInt(targetIdStr, 10);

        const user = await User.findOne({ userId: targetId });
        if (!user) {
          await ctx.answerCbQuery('Foydalanuvchi topilmadi.');
          return;
        }

        user.isBlocked = true;
        user.blockedAt = new Date();
        await user.save();

        await ctx.answerCbQuery('Foydalanuvchi bloklandi.');

        await ctx.editMessageText(
          `🚫 Foydalanuvchi bloklandi.

📞 Telefon: ${user.phone || 'Noma\'lum'}
🆔 ID: ${user.userId}`,
          {
            reply_markup: {
              inline_keyboard: [[
                Markup.button.callback('⬅️ Bloklash menyusiga qaytish', 'admin_block_menu')
              ]]
            },
            parse_mode: 'HTML'
          }
        );
      }

      // Admin unblock specific user
      else if (data.startsWith('admin_unblock_user_')) {
        const targetIdStr = data.replace('admin_unblock_user_', '');
        const targetId = parseInt(targetIdStr, 10);

        const user = await User.findOne({ userId: targetId });
        if (!user) {
          await ctx.answerCbQuery('Foydalanuvchi topilmadi.');
          return;
        }

        user.isBlocked = false;
        user.blockedAt = null;
        await user.save();

        await ctx.answerCbQuery('Foydalanuvchi blokdan chiqarildi.');

        await ctx.editMessageText(
          `✅ Foydalanuvchi blokdan chiqarildi.

📞 Telefon: ${user.phone || 'Noma\'lum'}
🆔 ID: ${user.userId}`,
          {
            reply_markup: {
              inline_keyboard: [[
                Markup.button.callback('⬅️ Bloklash menyusiga qaytish', 'admin_block_menu')
              ]]
            },
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
    try {
      const adminChatId = ctx.from.id.toString();
      if (!isAdmin(adminChatId)) return;
      
      const text = ctx.message.text;
      
      // Check if user is in booking state first
      const state = adminStates.get(adminChatId);
      
      if (text === '🚫 Bloklash') {
      
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
        const buttons = [
          [Markup.button.callback('❌ Kunlik broni bekor qilish', 'admin_cancel_daily_menu')],
          [Markup.button.callback('❌ Haftalik broni bekor qilish', 'admin_cancel_weekly_menu')],
          [Markup.button.callback('🔙 Orqaga', 'admin_back')]
        ];

        await ctx.reply(
          'Bekor qilish turini tanlang:',
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
      } else if (text === '🚫 Bloklash') {
        const buttons = [
          [Markup.button.callback('🚫 Bloklash', 'admin_block_action')],
          [Markup.button.callback('✅ Blokdan chiqarish', 'admin_unblock_action')],
          [Markup.button.callback('🔙 Orqaga', 'admin_back')]
        ];

        await ctx.reply(
          'Bloklash bo\'limi:\nQuyidagi amallardan birini tanlang:',
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: 'HTML'
          }
        );
      }
    } catch (error) {
      console.error('Error in adminBot.on("text") handler:', error);
      try {
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      } catch (innerError) {
        console.error('Error sending error message in adminBot.on("text") handler:', innerError);
      }
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
 * Notify admin when a user's booking time is rescheduled
 */
async function notifyReschedule(booking, user, oldHourStart, oldHourEnd) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;

  try {
    const oldLabel = `${String(oldHourStart).padStart(2, '0')}:00–${String(oldHourEnd === 0 ? '00' : oldHourEnd).padStart(2, '0')}:00`;
    const newLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd === 0 ? '00' : booking.hourEnd).padStart(2, '0')}:00`;
    const phone = user.phone || 'Ko\'rsatilmagan';
    const username = user.username ? `@${user.username}` : 'Ko\'rsatilmagan';

    const message = `🔄 Bron vaqti almashtirildi\n\n` +
      `📅 Kun: ${formatDate(booking.date)}\n` +
      `⏰ Eski vaqt: ${oldLabel}\n` +
      `⏰ Yangi vaqt: ${newLabel}\n` +
      `👤 Ism: ${username}\n` +
      `📞 Telefon: ${phone}\n` +
      `🆔 Foydalanuvchi ID: ${user.userId}`;

    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message);
  } catch (error) {
    console.error('❌ Error sending reschedule notification to admin:', error);
  }
}

/**
 * Notify admin about weekly booking expiry
 */
async function notifyAdminWeeklyExpiry(booking, user) {
  if (!adminBot || !process.env.ADMIN_CHAT_ID) return;
  
  try {
    const timeLabel = `${String(booking.hourStart).padStart(2, '0')}:00–${String(booking.hourEnd).padStart(2, '0')}:00`;
    const phone = user.phone || 'Ko\'rsatilmagan';
    const username = user.username ? `@${user.username}` : 'Ko\'rsatilmagan';
    const userName = user.firstName || phone || 'Noma\'lum';
    
    const message = `⚠️ <b>HAFTALIK BRON TUGAYDI!</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Foydalanuvchi:</b> ${userName}\n` +
      `${username !== 'Ko\'rsatilmagan' ? `📱 <b>Username:</b> ${username}\n` : ''}` +
      `📞 <b>Telefon:</b> ${phone}\n` +
      `🆔 <b>User ID:</b> ${user.userId}\n\n` +
      `📅 <b>Oxirgi bron sanasi:</b> ${formatDate(booking.date)}\n` +
      `⏰ <b>Vaqt:</b> ${timeLabel}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 <b>Eslatma:</b> Bu foydalanuvchining haftalik broni 7 kun ichida tugaydi.\n` +
      `Foydalanuvchiga ogohlantirish xabari yuborildi.\n\n` +
      `🆕 <b>Tavsiya:</b> Foydalanuvchi bilan bog'lanib yangi haftalik bron taklif qiling!`;
    
    await adminBot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('❌ Error sending weekly expiry notification to admin:', error);
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
  getAdminBot,
  initAdminBot,
  notifyNewBooking,
  notifyCancellation,
  notifyLateCancellationPenalty,
  notifyReschedule,
  notifyAdminPaymentReady,
  notifyAdminWeeklyExpiry,
  postDailyScheduleToAdmin,
  stopAdminBot
};

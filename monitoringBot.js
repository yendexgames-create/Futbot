const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

// Monitoring bot initialization
const monitoringBot = new Telegraf(process.env.MONITORING_BOT_TOKEN || '8799404582:AAHp8PWKH7vMbSn_LSms5tenhcpTKHt3oCQ');

// Allowed admin ID (only you can use this bot)
const ADMIN_CHAT_ID = process.env.MONITORING_ADMIN_CHAT_ID || '7386008809';

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

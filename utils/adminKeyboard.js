const { Markup } = require('telegraf');
const { getWeekDays, formatDate, formatDateShort, isPastDate } = require('./time');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Create admin main menu keyboard (Inline)
 */
function createAdminMainKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Joylarni ko\'rish', 'admin_view_schedule')],
    [Markup.button.callback('❌ Bronlarni bekor qilish', 'admin_cancel_booking')],
    [Markup.button.callback('💰 Jarima belgilash', 'admin_penalty')],
    [Markup.button.callback('🚫 Bloklash', 'admin_block_menu')]
  ]);
}

/**
 * Create admin reply keyboard (always visible)
 */
function createAdminReplyKeyboard() {
  return Markup.keyboard([
    ['📊 Joylarni ko\'rish', '❌ Bronlarni bekor qilish'],
    ['💰 Jarima belgilash', '🚫 Bloklash']
  ]).resize().persistent();
}

/**
 * Create date selection keyboard for admin booking
 * @param {string} prefix - Callback prefix (default: 'admin_date_', can be 'admin_penalty_date_')
 */
function createAdminDateKeyboard(prefix = 'admin_date_') {
  const weekDays = getWeekDays();
  const buttons = [];
  
  // Create day buttons for next 14 days
  for (let i = 0; i < 14; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    const dateKey = day.toISOString().split('T')[0];
    const dayName = formatDateShort(day);
    
    buttons.push([Markup.button.callback(
      `${dayName}`,
      `${prefix}${dateKey}`
    )]);
  }
  
  buttons.push([Markup.button.callback('🔙 Orqaga', prefix === 'admin_penalty_date_' ? 'admin_penalty' : 'admin_back')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Create time slot keyboard for admin booking
 */
function createAdminTimeKeyboard(date) {
  const { getTimeSlots } = require('./time');
  const timeSlots = getTimeSlots();
  
  const buttons = timeSlots.map(slot => [
    Markup.button.callback(
      `🟢 ${slot.label}`,
      `admin_time_${date}_${slot.start}_${slot.end}`
    )
  ]);
  
  buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Get schedule for a specific day
 */
async function getDaySchedule(date) {
  try {
    const { getTimeSlots } = require('./time');
    
    // Create date range using local time (not UTC)
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    // Get target date components for comparison
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    
    // Find all bookings and filter by local date (not UTC)
    const allBookings = await Booking.find({
      status: 'booked',
      date: { $gte: dateStart, $lte: dateEnd }
    });
    
    // Filter bookings by local date (handle timezone issues)
    const bookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getFullYear() === targetYear &&
             bookingDate.getMonth() === targetMonth &&
             bookingDate.getDate() === targetDay;
    });
    
    // Prepare user info map for booked slots
    const userIds = bookings.map(b => b.userId);
    const users = userIds.length > 0
      ? await User.find({ userId: { $in: userIds } })
      : [];
    const userMap = {};
    for (const u of users) {
      userMap[u.userId] = u;
    }

    const bookedByHour = {};
    for (const b of bookings) {
      bookedByHour[b.hourStart] = b;
    }

    const timeSlots = getTimeSlots();
    
    let schedule = '';
    for (const slot of timeSlots) {
      const booking = bookedByHour[slot.start];
      if (booking) {
        const user = userMap[booking.userId];
        let extraInfo = '';

        if (user) {
          if (user.phone) {
            extraInfo += ` (${user.phone})`;
          } else if (user.firstName) {
            extraInfo += ` (${user.firstName})`;
          }
        }

        if (booking.isWeekly) {
          // Add weekly booking marker
          extraInfo += extraInfo ? ' - Haftalik bron' : ' (Haftalik bron)';
        }

        schedule += `${slot.label}: ❌ <b>Band</b>${extraInfo}\n`;
      } else {
        schedule += `${slot.label}: 🟢 <b>Bo'sh</b>\n`;
      }
    }
    
    return schedule;
  } catch (error) {
    console.error('Error in getDaySchedule:', error);
    throw error;
  }
}

/**
 * Get schedule for all days in week
 */
async function getWeekSchedule(weekStart = new Date()) {
  try {
    const weekDays = getWeekDays(weekStart);
    let schedule = '';
    
    for (const day of weekDays) {
      const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      const dayName = dayNames[day.getDay()];
      const daySchedule = await getDaySchedule(day);
      
      schedule += `\n📅 <b>${dayName} (${formatDate(day)})</b>\n${daySchedule}\n`;
    }
    
    return schedule;
  } catch (error) {
    console.error('Error in getWeekSchedule:', error);
    throw error;
  }
}

/**
 * Get schedule for all days in week (excluding past days)
 */
async function getWeekScheduleExcludingPast(weekStart = new Date()) {
  try {
    const { isPastDate } = require('./time');
    const weekDays = getWeekDays(weekStart);
    let schedule = '';
    let hasAnyDay = false;
    
    for (const day of weekDays) {
      // Skip past days only for current week, not for future weeks
      const today = new Date();
      const currentWeekStart = getWeekStart(today);
      const isCurrentWeek = Math.abs(weekStart - currentWeekStart) < 7 * 24 * 60 * 60 * 1000;
      
      if (isCurrentWeek && isPastDate(day)) {
        continue;
      }
      
      const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      const dayName = dayNames[day.getDay()];
      const daySchedule = await getDaySchedule(day);
      
      schedule += `\n📅 <b>${dayName} (${formatDate(day)})</b>\n${daySchedule}\n`;
      hasAnyDay = true;
    }
    
    return hasAnyDay ? schedule : 'Bu hafta uchun ko\'rsatiladigan jadval yo\'q.';
  } catch (error) {
    console.error('Error in getWeekScheduleExcludingPast:', error);
    throw error;
  }
}

module.exports = {
  createAdminMainKeyboard,
  createAdminReplyKeyboard,
  createAdminDateKeyboard,
  createAdminTimeKeyboard,
  getDaySchedule,
  getWeekSchedule,
  getWeekScheduleExcludingPast
};


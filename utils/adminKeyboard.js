const { Markup } = require('telegraf');
const { getWeekDays, formatDate, formatDateShort, isPastDate } = require('./time');
const Booking = require('../models/Booking');

/**
 * Create admin main menu keyboard (Inline)
 */
function createAdminMainKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📝📝📝 STADIONI YOZDIRISH 📝📝📝', 'admin_book')],
    [Markup.button.callback('📊 Joylarni ko\'rish', 'admin_view_schedule')],
    [Markup.button.callback('❌ Bronlarni bekor qilish', 'admin_cancel_booking')],
    [Markup.button.callback('💰 Jarima belgilash', 'admin_penalty')]
  ]);
}

/**
 * Create admin reply keyboard (always visible)
 */
function createAdminReplyKeyboard() {
  return Markup.keyboard([
    ['📝📝📝 STADIONI YOZDIRISH 📝📝📝'],
    ['📊 Joylarni ko\'rish', '❌ Bronlarni bekor qilish'],
    ['💰 Jarima belgilash']
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
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const dayLabel = dayNames[day.getDay()];
    
    buttons.push([Markup.button.callback(
      `${dayLabel} ${dayName}`,
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
  
  const bookedHours = new Set(bookings.map(b => b.hourStart));
  const timeSlots = getTimeSlots();
  
  let schedule = '';
  for (const slot of timeSlots) {
    if (bookedHours.has(slot.start)) {
      schedule += `${slot.label}: ❌ <b>Band</b>\n`;
    } else {
      schedule += `${slot.label}: 🟢 <b>Bo'sh</b>\n`;
    }
  }
  
  return schedule;
}

/**
 * Get schedule for all days in week
 */
async function getWeekSchedule(weekStart = new Date()) {
  const weekDays = getWeekDays(weekStart);
  let schedule = '';
  
  for (const day of weekDays) {
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const dayName = dayNames[day.getDay()];
    const daySchedule = await getDaySchedule(day);
    
    schedule += `\n📅 <b>${dayName} (${formatDate(day)})</b>\n${daySchedule}\n`;
  }
  
  return schedule;
}

/**
 * Get schedule for all days in week (excluding past days)
 */
async function getWeekScheduleExcludingPast(weekStart = new Date()) {
  const { isPastDate } = require('./time');
  const weekDays = getWeekDays(weekStart);
  let schedule = '';
  
  for (const day of weekDays) {
    // Skip past days
    if (isPastDate(day)) {
      continue;
    }
    
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const dayName = dayNames[day.getDay()];
    const daySchedule = await getDaySchedule(day);
    
    schedule += `\n📅 <b>${dayName} (${formatDate(day)})</b>\n${daySchedule}\n`;
  }
  
  return schedule;
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


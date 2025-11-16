const { Markup } = require('telegraf');
const { getWeekDays, formatDate, formatDateShort, isPastDate, formatTime } = require('./time');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Create admin main menu keyboard
 */
function createAdminMainKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Bron qilish', 'admin_book')],
    [Markup.button.callback('📊 Bugungi bronlar', 'admin_today_bookings')],
    [Markup.button.callback('❌ Bronni bekor qilish', 'admin_cancel_booking')],
    [Markup.button.callback('� Kelgusi kunlar', 'admin_future_bookings')],
    [Markup.button.callback('�💰 Jarima belgilash', 'admin_penalty')]
  ]);
}

/**
 * Create date selection keyboard for admin booking
 */
async function createAdminDateKeyboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const buttons = [];
  const row = [];
  
  // Get all future bookings
  const bookings = await Booking.find({
    date: { $gte: today },
    status: 'booked'
  }).sort({ date: 1 });
  
  // Group bookings by date
  const bookingsByDate = {};
  bookings.forEach(booking => {
    const dateKey = booking.date.toISOString().split('T')[0];
    if (!bookingsByDate[dateKey]) {
      bookingsByDate[dateKey] = [];
    }
    bookingsByDate[dateKey].push(booking);
  });
  
  // Create buttons for each date with bookings
  for (const [dateKey, dateBookings] of Object.entries(bookingsByDate)) {
    const date = new Date(dateKey);
    const dayName = formatDateShort(date);
    const dayLabel = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'][date.getDay()];
    const bookingCount = dateBookings.length;
    
    row.push(Markup.button.callback(
      `${dayLabel} ${dayName} (${bookingCount})`,
      `admin_view_date_${dateKey}`
    ));
    
    // Add a new row every 2 buttons
    if (row.length >= 2) {
      buttons.push([...row]);
      row.length = 0;
    }
  }
  
  // Add remaining buttons
  if (row.length > 0) {
    buttons.push([...row]);
  }
  
  // Add navigation buttons
  buttons.push([
    Markup.button.callback('📅 Bugungi bronlar', 'admin_today_bookings'),
    Markup.button.callback('📅 Kelgusi kunlar', 'admin_future_bookings')
  ]);
  
  buttons.push([Markup.button.callback('🔙 Orqaga', 'admin_back')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Create time slot keyboard for admin booking
 */
function createAdminTimeKeyboard(date) {
  const timeSlots = [
    { start: 20, end: 21, label: '20:00–21:00' },
    { start: 21, end: 22, label: '21:00–22:00' },
    { start: 22, end: 23, label: '22:00–23:00' },
    { start: 23, end: 24, label: '23:00–24:00' }
  ];
  
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
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const bookings = await Booking.find({
    date: { $gte: dateStart, $lte: dateEnd },
    status: 'booked'
  });
  
  const bookedHours = new Set(bookings.map(b => b.hourStart));
  const timeSlots = [
    { start: 20, end: 21, label: '20:00–21:00' },
    { start: 21, end: 22, label: '21:00–22:00' },
    { start: 22, end: 23, label: '22:00–23:00' },
    { start: 23, end: 24, label: '23:00–24:00' }
  ];
  
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

module.exports = {
  createAdminMainKeyboard,
  createAdminDateKeyboard,
  createAdminTimeKeyboard,
  getDaySchedule,
  getWeekSchedule
};


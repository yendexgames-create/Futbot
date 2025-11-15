const { Markup } = require('telegraf');
const { getWeekDays, formatDate, formatDateShort, formatWeekRange, isPastDate, getTimeSlots } = require('./time');
const Booking = require('../models/Booking');

/**
 * Create main menu keyboard with week days
 */
async function createMainKeyboard(currentWeekStart = new Date()) {
  const weekDays = getWeekDays(currentWeekStart);
  const buttons = [];
  
  // Get all bookings for the week
  const weekStart = new Date(weekDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);
  
  const bookings = await Booking.find({
    date: { $gte: weekStart, $lte: weekEnd },
    status: 'booked'
  });
  
  // Create a map of booked slots per day
  const bookedSlots = {};
  bookings.forEach(booking => {
    const dateKey = booking.date.toISOString().split('T')[0];
    if (!bookedSlots[dateKey]) {
      bookedSlots[dateKey] = new Set();
    }
    bookedSlots[dateKey].add(booking.hourStart);
  });
  
  // Create day buttons
  for (let i = 0; i < weekDays.length; i++) {
    const day = weekDays[i];
    const dateKey = day.toISOString().split('T')[0];
    const isPast = isPastDate(day);
    const hasAvailableSlots = !isPast && (!bookedSlots[dateKey] || bookedSlots[dateKey].size < 4);
    
    const dayName = formatDateShort(day);
    const dayLabel = getDayLabel(day);
    
    let buttonText = `${dayLabel} ${dayName}`;
    
    if (isPast) {
      buttonText = `❌ ${dayLabel} ${dayName}`;
    } else if (hasAvailableSlots) {
      buttonText = `🟢 ${dayLabel} ${dayName}`;
    } else {
      buttonText = `🔴 ${dayLabel} ${dayName}`;
    }
    
    buttons.push([Markup.button.callback(buttonText, `day_${dateKey}`)]);
  }
  
  // Add next week button
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
  const weekRange = formatWeekRange(nextWeekStart, nextWeekEnd);
  
  buttons.push([Markup.button.callback(`➡️ Keyingi hafta (${weekRange})`, `next_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
  
  // Add cancel reservation button
  buttons.push([Markup.button.callback('❌ Bronni bekor qilish', 'cancel_reservation')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Get day label (Yak, Dush, etc.) - O'zbek tilida
 */
function getDayLabel(date) {
  const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
  return days[date.getDay()];
}

/**
 * Create time slot keyboard for a specific date
 */
async function createTimeSlotKeyboard(date) {
  const timeSlots = getTimeSlots();
  const buttons = [];
  
  // Get bookings for this date
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const bookings = await Booking.find({
    date: { $gte: dateStart, $lte: dateEnd },
    status: 'booked'
  });
  
  const bookedHours = new Set(bookings.map(b => b.hourStart));
  
  // Create time slot buttons
  for (const slot of timeSlots) {
    const isBooked = bookedHours.has(slot.start);
    const dateKey = date.toISOString().split('T')[0];
    
    if (isBooked) {
      buttons.push([Markup.button.callback(`❌ ${slot.label} (Band)`, `slot_booked_${dateKey}_${slot.start}`)]);
    } else {
      buttons.push([Markup.button.callback(`🟢 ${slot.label}`, `slot_${dateKey}_${slot.start}_${slot.end}`)]);
    }
  }
  
  // Add back button
  buttons.push([Markup.button.callback('🔙 Hafta ko\'rinishiga qaytish', 'back_to_week')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Create confirmation keyboard
 */
function createConfirmationKeyboard(bookingId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Confirm', `confirm_${bookingId}`)],
    [Markup.button.callback('❌ Cancel', 'cancel_booking')]
  ]);
}

/**
 * Create back button keyboard
 */
function createBackKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Boshqa kunni tanlash', 'back_to_week')]
  ]);
}

module.exports = {
  createMainKeyboard,
  createTimeSlotKeyboard,
  createConfirmationKeyboard,
  createBackKeyboard
};


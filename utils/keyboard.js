const { Markup } = require('telegraf');
const { getWeekDays, formatDate, formatDateShort, formatWeekRange, isPastDate, getTimeSlots } = require('./time');
const Booking = require('../models/Booking');

/**
 * Create main menu keyboard with week days
 */
async function createMainKeyboard(currentWeekStart = new Date()) {
  try {
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
    const timeSlotsCount = getTimeSlots().length; // 5 ta slot (19, 20, 21, 22, 23)
    
    bookings.forEach(booking => {
      // Use local date for key (not UTC)
      const bookingDate = new Date(booking.date);
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!bookedSlots[dateKey]) {
        bookedSlots[dateKey] = new Set();
      }
      bookedSlots[dateKey].add(booking.hourStart);
    });
    
    // Create day buttons
    for (let i = 0; i < weekDays.length; i++) {
      const day = weekDays[i];
      // Use local date for key (not UTC)
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayNum = String(day.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dayNum}`;
      
      const isPast = isPastDate(day);
      const hasAvailableSlots = !isPast && (!bookedSlots[dateKey] || bookedSlots[dateKey].size < timeSlotsCount);
      
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
    
    // Add previous and next week navigation buttons
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
    const prevWeekRange = formatWeekRange(prevWeekStart, prevWeekEnd);
    
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    const nextWeekRange = formatWeekRange(nextWeekStart, nextWeekEnd);
    
    // Only show previous week button if we're not in the current week
    if (new Date() < currentWeekStart) {
      buttons.push([Markup.button.callback(`⬅️ Oldingi hafta (${prevWeekRange})`, `next_week_${prevWeekStart.toISOString().split('T')[0]}`)]);
    }
    
    buttons.push([Markup.button.callback(`➡️ Keyingi hafta (${nextWeekRange})`, `next_week_${nextWeekStart.toISOString().split('T')[0]}`)]);
    
    // Add cancel reservation button
    buttons.push([Markup.button.callback('❌ Bronni bekor qilish', 'cancel_reservation')]);
    
    return Markup.inlineKeyboard(buttons);
  } catch (error) {
    console.error('Error in createMainKeyboard:', error);
    throw error;
  }
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
  try {
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
      // Use local date for key (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayNum = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dayNum}`;
      
      if (isBooked) {
        buttons.push([Markup.button.callback(`❌ ${slot.label} (Band)`, `slot_booked_${dateKey}_${slot.start}`)]);
      } else {
        buttons.push([Markup.button.callback(`🟢 ${slot.label}`, `slot_${dateKey}_${slot.start}_${slot.end}`)]);
      }
    }
    
    // Add back button
    buttons.push([Markup.button.callback('🔙 Hafta ko\'rinishiga qaytish', 'back_to_week')]);
    
    return Markup.inlineKeyboard(buttons);
  } catch (error) {
    console.error('Error in createTimeSlotKeyboard:', error);
    throw error;
  }
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

/**
 * Create reply keyboard for user (always visible)
 */
function createUserReplyKeyboard() {
  return Markup.keyboard([
    ['📅 Hafta jadvali', '❌ Bronni bekor qilish']
  ]).resize().persistent();
}

module.exports = {
  createMainKeyboard,
  createTimeSlotKeyboard,
  createConfirmationKeyboard,
  createBackKeyboard,
  createUserReplyKeyboard
};


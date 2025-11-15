const Booking = require('../models/Booking');
const { formatDate, getTimeSlots } = require('./time');

/**
 * Generate daily schedule text for a specific date
 */
async function generateDailySchedule(date) {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const bookings = await Booking.find({
    date: { $gte: dateStart, $lte: dateEnd },
    status: 'booked'
  });
  
  const bookedHours = new Set(bookings.map(b => b.hourStart));
  const timeSlots = getTimeSlots();
  
  let scheduleText = `📅 <b>${formatDate(date)}</b>\n\n`;
  scheduleText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  for (const slot of timeSlots) {
    if (bookedHours.has(slot.start)) {
      scheduleText += `❌ ${slot.label} - <b>Band</b>\n`;
    } else {
      scheduleText += `🟢 ${slot.label} - <b>Bo'sh</b>\n`;
    }
  }
  
  scheduleText += `\n━━━━━━━━━━━━━━━━━━━━`;
  
  return scheduleText;
}

module.exports = {
  generateDailySchedule
};

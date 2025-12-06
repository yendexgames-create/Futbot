const Booking = require('../models/Booking');
const { formatDate, getTimeSlots } = require('./time');

/**
 * Generate daily schedule text for a specific date
 */
async function generateDailySchedule(date) {
  try {
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
  } catch (error) {
    console.error('Error in generateDailySchedule:', error);
    throw error;
  }
}

module.exports = {
  generateDailySchedule
};

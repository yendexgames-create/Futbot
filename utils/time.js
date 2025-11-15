/**
 * Utility functions for date and time operations
 */

/**
 * Get start of week (Monday) for a given date
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Sunday) for a given date
 */
function getWeekEnd(date = new Date()) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

/**
 * Get all days of the week (Mon-Sun) for a given date
 */
function getWeekDays(date = new Date()) {
  const weekStart = getWeekStart(date);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  
  return days;
}

/**
 * Format date as DD.MM.YYYY
 */
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format date as DD.MM
 */
function formatDateShort(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

/**
 * Format date range for week navigation
 */
function formatWeekRange(weekStart, weekEnd) {
  return `${formatDateShort(weekStart)} – ${formatDateShort(weekEnd)}`;
}

/**
 * Check if date is in the past
 */
function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Check if date is today
 */
function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
}

/**
 * Get date at midnight (00:00:00)
 */
function getDateAtMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get available time slots (20-21, 21-22, 22-23, 23-24)
 */
function getTimeSlots() {
  return [
    { start: 20, end: 21, label: '20:00–21:00' },
    { start: 21, end: 22, label: '21:00–22:00' },
    { start: 22, end: 23, label: '22:00–23:00' },
    { start: 23, end: 24, label: '23:00–24:00' }
  ];
}

/**
 * Get day name in English
 */
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get day name in short format (Mon, Tue, etc.)
 */
function getDayNameShort(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

module.exports = {
  getWeekStart,
  getWeekEnd,
  getWeekDays,
  formatDate,
  formatDateShort,
  formatWeekRange,
  isPastDate,
  isToday,
  getDateAtMidnight,
  getTimeSlots,
  getDayName,
  getDayNameShort
};


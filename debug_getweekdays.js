// Test getWeekDays function bug
const { getWeekDays, getWeekStart } = require('./utils/time');

console.log('=== Test getWeekDays muammosi ===');

// Test: 5 aprelda yakshanba kunini tanlash
const selectedDate = new Date('2025-04-05'); // Shanba (5-aprel)
console.log('Tanlangan sana:', selectedDate.toDateString(), '- Kun:', selectedDate.getDay());

// Hafta boshi
const weekStart = getWeekStart(selectedDate);
console.log('Hafta boshi:', weekStart.toDateString(), '- Kun:', weekStart.getDay());

// Hafta kunlari
const weekDays = getWeekDays(selectedDate);
console.log('\nHafta kunlari:');
weekDays.forEach((day, index) => {
  console.log(`Kun ${index}:`, day.toDateString(), '- Kun:', day.getDay(), '- Sana:', day.toLocaleDateString('uz-UZ'));
});

// Qaysi kun tanlanishi kerak?
console.log('\nTanlangan sana haftada qaysi o\'rinda?');
const selectedDayIndex = weekDays.findIndex(day => 
  day.getDate() === selectedDate.getDate() && 
  day.getMonth() === selectedDate.getMonth() && 
  day.getFullYear() === selectedDate.getFullYear()
);
console.log('Tanlangan kun indeksi:', selectedDayIndex);
console.log('Tanlangan kun:', weekDays[selectedDayIndex]?.toDateString());

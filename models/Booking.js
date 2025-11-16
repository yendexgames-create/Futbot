const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  hourStart: {
    type: Number,
    required: true,
    enum: [19, 20, 21, 22, 23]
  },
  hourEnd: {
    type: Number,
    required: true,
    enum: [20, 21, 22, 23, 0]
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  },
  cancelReason: {
    type: String,
    default: null
  },
  cancelTime: {
    type: Date,
    default: null
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  penaltyPaid: {
    type: Boolean,
    default: false
  },
  penaltyPaymentScreenshot: {
    type: String,
    default: null
  },
  penaltyPaymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: null
  },
  penaltyNotificationSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
bookingSchema.index({ date: 1, hourStart: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);


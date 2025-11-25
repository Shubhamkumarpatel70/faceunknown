const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: 'Inappropriate behavior'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate reports from same user
reportSchema.index({ reportedUserId: 1, reportedByUserId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);


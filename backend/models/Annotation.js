// backend/models/Annotation.js
const mongoose = require('mongoose');

const AnnotationSchema = new mongoose.Schema({
  sequenceId: { type: String, required: true, index: true },
  originalPrediction: { type: String, required: true },
  userFeedback: { type: String, enum: ['Confirmed', 'Flagged'], required: true },
  correctedSpecies: { type: String }, // Only if flagged and corrected
  scientistId: { type: String, required: true, index: true }, // In a real app, this would be a user reference
  timestamp: { type: Date, default: Date.now, index: true },
  // New fields for collaborative features
  position: {
    start: Number,
    end: Number
  },
  roomId: { type: String, index: true }, // For collaborative sessions
  collaborativeNote: { type: String }, // Notes added during collaboration
  votes: [{
    scientistId: String,
    vote: { type: String, enum: ['Confirm', 'Reject', 'Uncertain'] },
    confidence: { type: Number, min: 0, max: 100 },
    timestamp: { type: Date, default: Date.now }
  }]
});

// Compound indexes for better query performance
AnnotationSchema.index({ sequenceId: 1, timestamp: -1 });
AnnotationSchema.index({ scientistId: 1, timestamp: -1 });
AnnotationSchema.index({ roomId: 1, timestamp: -1 });
AnnotationSchema.index({ userFeedback: 1, timestamp: -1 });

module.exports = mongoose.model('Annotation', AnnotationSchema);
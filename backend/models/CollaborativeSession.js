// backend/models/CollaborativeSession.js
const mongoose = require('mongoose');

const CollaborativeSessionSchema = new mongoose.Schema({
  roomId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true
  },
  dataset: { 
    type: String, 
    required: true 
  },
  participants: [{
    scientistId: String,
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' }
  }],
  status: { 
    type: String, 
    enum: ['active', 'archived'], 
    default: 'active',
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  lastActivity: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// Compound indexes for better query performance
CollaborativeSessionSchema.index({ status: 1, lastActivity: -1 });
CollaborativeSessionSchema.index({ createdBy: 1, createdAt: -1 });
CollaborativeSessionSchema.index({ 'participants.scientistId': 1, lastActivity: -1 });

module.exports = mongoose.model('CollaborativeSession', CollaborativeSessionSchema);
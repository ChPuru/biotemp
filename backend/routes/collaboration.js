// backend/routes/collaboration.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CollaborativeSession = require('../models/CollaborativeSession');
const Annotation = require('../models/Annotation');
const blockchainService = require('../services/blockchain_service');

// Import JWT middleware
const { verifyToken, requireRole } = require('../middleware/auth');

// Create a new collaborative session
router.post('/sessions', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { name, dataset } = req.body;
    const scientistId = req.user.userId;
    
    const roomId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const session = new CollaborativeSession({
      roomId,
      name,
      dataset,
      createdBy: scientistId,
      participants: [{ scientistId, role: 'admin' }]
    });
    
    await session.save();
    
    // Record to blockchain for audit trail
    await blockchainService.recordFinding({
      action: 'session_created',
      scientistId,
      sessionId: roomId,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating collaborative session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all active sessions
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await CollaborativeSession.find({ status: 'active' })
      .sort({ lastActivity: -1 })
      .limit(20);
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join a session
router.post('/sessions/:roomId/join', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const scientistId = req.user.userId;
    
    const session = await CollaborativeSession.findOne({ roomId });
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Check if already a participant
    const existingParticipant = session.participants.find(p => p.scientistId === scientistId);
    
    if (!existingParticipant) {
      session.participants.push({
        scientistId,
        role: 'viewer',
        joinedAt: new Date()
      });
    }
    
    session.lastActivity = new Date();
    await session.save();
    
    // Record to blockchain for audit trail
    await blockchainService.recordFinding({
      action: 'session_joined',
      scientistId,
      sessionId: roomId,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create annotation
router.post('/annotations', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { sequenceId, position, content, roomId, originalPrediction } = req.body;
    const scientistId = req.user.userId;
    
    const annotation = new Annotation({
      sequenceId,
      position,
      content,
      roomId,
      originalPrediction,
      userFeedback: 'Confirmed', // Default
      scientistId,
      collaborativeNote: content
    });
    
    await annotation.save();
    
    // Record to blockchain for audit trail
    await blockchainService.recordFinding({
      action: 'annotation_created',
      scientistId,
      annotationId: annotation._id,
      sequenceId,
      roomId,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      annotation
    });
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit vote on species identification
router.post('/annotations/:annotationId/vote', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { annotationId } = req.params;
    const { vote, confidence } = req.body;
    const scientistId = req.user.userId;
    
    const annotation = await Annotation.findById(annotationId);
    
    if (!annotation) {
      return res.status(404).json({ success: false, error: 'Annotation not found' });
    }
    
    // Check if already voted
    const existingVoteIndex = annotation.votes.findIndex(v => v.scientistId === scientistId);
    
    if (existingVoteIndex >= 0) {
      // Update existing vote
      annotation.votes[existingVoteIndex] = {
        scientistId,
        vote,
        confidence,
        timestamp: new Date()
      };
    } else {
      // Add new vote
      annotation.votes.push({
        scientistId,
        vote,
        confidence,
        timestamp: new Date()
      });
    }
    
    await annotation.save();
    
    // Record to blockchain for audit trail
    await blockchainService.recordFinding({
      action: 'vote_submitted',
      scientistId,
      annotationId,
      vote,
      confidence,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      annotation
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all annotations for a session
router.get('/sessions/:roomId/annotations', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const annotations = await Annotation.find({ roomId })
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      annotations
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
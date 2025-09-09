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
router.post('/sessions', async (req, res) => {
  try {
    const { name, dataset } = req.body;
    const scientistId = req.body.scientistId || 'demo-user';
    
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
    try {
      blockchainService.recordFinding({
        action: 'session_created',
        scientistId,
        sessionId: roomId,
        timestamp: new Date()
      });
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Don't fail the session creation if blockchain fails
    }
    
    res.status(201).json({
      session
    });
  } catch (error) {
    console.error('Error creating collaborative session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all active sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await CollaborativeSession.find({ status: 'active' })
      .sort({ lastActivity: -1 })
      .limit(20);

    res.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's created sessions
router.get('/sessions/my-sessions/:scientistId', async (req, res) => {
  try {
    const { scientistId } = req.params;

    const sessions = await CollaborativeSession.find({ createdBy: scientistId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all sessions (including archived) with pagination
router.get('/sessions/all', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'lastActivity', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await CollaborativeSession.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await CollaborativeSession.countDocuments(query);

    res.json({
      sessions: sessions || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSessions: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session statistics
router.get('/sessions/stats', async (req, res) => {
  try {
    const totalSessions = await CollaborativeSession.countDocuments();
    const activeSessions = await CollaborativeSession.countDocuments({ status: 'active' });
    const archivedSessions = await CollaborativeSession.countDocuments({ status: 'archived' });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = await CollaborativeSession.countDocuments({
      lastActivity: { $gte: sevenDaysAgo }
    });

    res.json({
      totalSessions,
      activeSessions,
      archivedSessions,
      recentSessions,
      inactiveSessions: totalSessions - activeSessions - archivedSessions
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join a session
router.post('/sessions/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const scientistId = req.body.scientistId || 'demo-user';
    
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
    try {
      blockchainService.recordFinding({
        action: 'session_joined',
        scientistId,
        sessionId: roomId,
        timestamp: new Date()
      });
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Don't fail the session join if blockchain fails
    }
    
    res.json({
      session
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create annotation
router.post('/annotations', async (req, res) => {
  try {
    const { sequenceId, position, content, roomId, originalPrediction } = req.body;
    const scientistId = req.body.scientistId || 'demo-user';
    
    const annotation = new Annotation({
      sequenceId,
      position: {
        start: position.start,
        end: position.end
      },
      content,
      roomId,
      originalPrediction,
      userFeedback: 'Confirmed', // Default
      scientistId,
      collaborativeNote: content,
      votes: [] // Initialize empty votes array
    });
    
    await annotation.save();
    
    // Record to blockchain for audit trail
    try {
      blockchainService.recordFinding({
        action: 'annotation_created',
        scientistId,
        annotationId: annotation._id,
        sequenceId,
        roomId,
        timestamp: new Date()
      });
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Don't fail the annotation creation if blockchain fails
    }
    
    res.status(201).json({
      annotation
    });
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit vote on species identification
router.post('/annotations/:annotationId/vote', async (req, res) => {
  try {
    const { annotationId } = req.params;
    const { vote, confidence } = req.body;
    const scientistId = req.body.scientistId || 'demo-user';
    
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
    try {
      blockchainService.recordFinding({
        action: 'vote_submitted',
        scientistId,
        annotationId,
        vote,
        confidence,
        timestamp: new Date()
      });
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Don't fail the vote submission if blockchain fails
    }
    
    res.json({
      annotation
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all annotations for a session
router.get('/sessions/:roomId/annotations', async (req, res) => {
  try {
    const { roomId } = req.params;

    const annotations = await Annotation.find({ roomId })
      .sort({ timestamp: -1 });

    res.json({
      annotations: annotations || []
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
// backend/routes/training.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

// Training data management endpoint
router.post('/add-data', verifyToken, requireRole('scientist'), async (req, res) => {
  const { sequence_id, predicted_species, correct_species, confidence, novelty_score, feedback_type, user_role } = req.body;

  if (!sequence_id || !predicted_species || !correct_species) {
    return res.status(400).json({
      error: 'sequence_id, predicted_species, and correct_species are required'
    });
  }

  try {
    // In a real implementation, this would save to a training database
    // For demo purposes, we'll just log and return success
    console.log('Training data added:', {
      sequence_id,
      predicted_species,
      correct_species,
      confidence,
      novelty_score,
      feedback_type,
      user_role,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Training data added successfully',
      training_record: {
        id: `training_${Date.now()}`,
        sequence_id,
        predicted_species,
        correct_species,
        confidence: parseFloat(confidence) || 0,
        novelty_score: parseFloat(novelty_score) || 0,
        feedback_type: feedback_type || 'correction',
        user_role: user_role || 'scientist',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding training data:', error);
    res.status(500).json({
      error: 'Failed to add training data',
      details: error.message
    });
  }
});

// Get training data statistics
router.get('/stats', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    // Mock training statistics
    const stats = {
      total_samples: 1250,
      species_covered: 89,
      accuracy_improvement: 0.12, // 12% improvement
      last_updated: new Date().toISOString(),
      training_rounds: 15,
      active_models: ['species_classifier_v2.1', 'novelty_detector_v1.3']
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting training stats:', error);
    res.status(500).json({
      error: 'Failed to get training statistics',
      details: error.message
    });
  }
});

// Get training feedback endpoint
router.post('/feedback', verifyToken, requireRole('scientist'), async (req, res) => {
  const { sequence_id, predicted_species, correct_species, confidence, novelty_score, feedback_type, user_role } = req.body;

  if (!sequence_id || !predicted_species || !correct_species) {
    return res.status(400).json({
      error: 'sequence_id, predicted_species, and correct_species are required'
    });
  }

  try {
    // In a real implementation, this would save to a training database
    // For demo purposes, we'll just log and return success
    console.log('Training feedback received:', {
      sequence_id,
      predicted_species,
      correct_species,
      confidence,
      novelty_score,
      feedback_type,
      user_role,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Training feedback recorded successfully',
      feedback_record: {
        id: `feedback_${Date.now()}`,
        sequence_id,
        predicted_species,
        correct_species,
        confidence: parseFloat(confidence) || 0,
        novelty_score: parseFloat(novelty_score) || 0,
        feedback_type: feedback_type || 'correction',
        user_role: user_role || 'scientist',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error recording training feedback:', error);
    res.status(500).json({
      error: 'Failed to record training feedback',
      details: error.message
    });
  }
});

module.exports = router;

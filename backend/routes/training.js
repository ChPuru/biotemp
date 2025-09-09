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

// Get training jobs endpoint
router.get('/jobs', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    // Mock training jobs data
    const jobs = [
      {
        id: 'job_001',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 1800000).toISOString(),
        duration: 1800000,
        logs: [
          { type: 'info', message: 'Training started', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { type: 'info', message: 'Loading dataset...', timestamp: new Date(Date.now() - 3500000).toISOString() },
          { type: 'info', message: 'Training epoch 1/10', timestamp: new Date(Date.now() - 3000000).toISOString() },
          { type: 'info', message: 'Training completed successfully', timestamp: new Date(Date.now() - 1800000).toISOString() }
        ],
        results: { accuracy: 0.94, loss: 0.06 }
      }
    ];

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error getting training jobs:', error);
    res.status(500).json({
      error: 'Failed to get training jobs',
      details: error.message
    });
  }
});

// Get training history endpoint
router.get('/history', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    // Mock training history data
    const history = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        model_type: 'species_classifier_v2.1',
        dataset_size: 1250,
        accuracy: 0.94,
        precision_score: 0.92,
        recall_score: 0.96,
        f1_score: 0.94,
        training_time: 1800,
        model_path: '/models/species_classifier_v2.1.pkl',
        model_hash: 'a1b2c3d4e5f6'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        model_type: 'species_classifier_v2.0',
        dataset_size: 1100,
        accuracy: 0.91,
        precision_score: 0.89,
        recall_score: 0.93,
        f1_score: 0.91,
        training_time: 1650,
        model_path: '/models/species_classifier_v2.0.pkl',
        model_hash: 'f6e5d4c3b2a1'
      }
    ];

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting training history:', error);
    res.status(500).json({
      error: 'Failed to get training history',
      details: error.message
    });
  }
});

// Start retraining endpoint
router.post('/retrain', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    // Mock retraining job
    const jobId = `retrain_${Date.now()}`;

    // Simulate starting a training job
    console.log('Starting retraining job:', jobId);

    res.json({
      success: true,
      message: 'Retraining job started successfully',
      jobId,
      estimatedDuration: 1800 // 30 minutes
    });
  } catch (error) {
    console.error('Error starting retraining:', error);
    res.status(500).json({
      error: 'Failed to start retraining',
      details: error.message
    });
  }
});

// Get job status endpoint
router.get('/status/:jobId', verifyToken, requireRole('scientist'), async (req, res) => {
  try {
    const { jobId } = req.params;

    // Mock job status data
    const job = {
      id: jobId,
      status: 'completed',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 1800000).toISOString(),
      duration: 1800000,
      logs: [
        { type: 'info', message: 'Training started', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { type: 'info', message: 'Loading dataset...', timestamp: new Date(Date.now() - 3500000).toISOString() },
        { type: 'info', message: 'Training epoch 1/10', timestamp: new Date(Date.now() - 3000000).toISOString() },
        { type: 'info', message: 'Training epoch 2/10', timestamp: new Date(Date.now() - 2700000).toISOString() },
        { type: 'info', message: 'Training epoch 3/10', timestamp: new Date(Date.now() - 2400000).toISOString() },
        { type: 'info', message: 'Training epoch 4/10', timestamp: new Date(Date.now() - 2100000).toISOString() },
        { type: 'info', message: 'Training epoch 5/10', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { type: 'info', message: 'Training completed successfully', timestamp: new Date(Date.now() - 1800000).toISOString() }
      ],
      results: {
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.96,
        f1_score: 0.94,
        training_time: 1800,
        epochs_completed: 5
      },
      error: null
    };

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      details: error.message
    });
  }
});

module.exports = router;

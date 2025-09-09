// backend/routes/training.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { verifyToken, requireRole } = require('../middleware/auth');

// Training job status tracking
const trainingJobs = new Map();

// Trigger AI model retraining
router.post('/retrain', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const jobId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Start training pipeline
        const trainingProcess = spawn('python', [
            path.join(__dirname, '../../python_engine/ai_training_pipeline.py')
        ], {
            cwd: path.join(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Track job status
        trainingJobs.set(jobId, {
            status: 'running',
            startTime: new Date(),
            process: trainingProcess,
            logs: [],
            userId: req.user.userId
        });

        let outputBuffer = '';
        let errorBuffer = '';

        trainingProcess.stdout.on('data', (data) => {
            const output = data.toString();
            outputBuffer += output;
            trainingJobs.get(jobId).logs.push({
                type: 'stdout',
                message: output,
                timestamp: new Date()
            });
        });

        trainingProcess.stderr.on('data', (data) => {
            const error = data.toString();
            errorBuffer += error;
            trainingJobs.get(jobId).logs.push({
                type: 'stderr',
                message: error,
                timestamp: new Date()
            });
        });

        trainingProcess.on('close', (code) => {
            const job = trainingJobs.get(jobId);
            if (job) {
                job.status = code === 0 ? 'completed' : 'failed';
                job.endTime = new Date();
                job.exitCode = code;
                job.duration = job.endTime - job.startTime;
                
                if (code === 0) {
                    try {
                        job.results = JSON.parse(outputBuffer);
                    } catch (e) {
                        job.results = { raw_output: outputBuffer };
                    }
                } else {
                    job.error = errorBuffer;
                }
            }
        });

        res.json({
            success: true,
            jobId,
            message: 'AI model retraining started successfully',
            estimatedDuration: '5-15 minutes',
            status: 'running'
        });

    } catch (error) {
        console.error('Error starting training job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start training job'
        });
    }
});

// Get training job status
router.get('/status/:jobId', verifyToken, requireRole('admin'), (req, res) => {
    const { jobId } = req.params;
    const job = trainingJobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Training job not found'
        });
    }

    // Clean up old logs to prevent memory issues
    const recentLogs = job.logs.slice(-50);

    res.json({
        success: true,
        job: {
            id: jobId,
            status: job.status,
            startTime: job.startTime,
            endTime: job.endTime,
            duration: job.duration,
            logs: recentLogs,
            results: job.results,
            error: job.error,
            exitCode: job.exitCode
        }
    });
});

// Get all training jobs
router.get('/jobs', verifyToken, requireRole('admin'), (req, res) => {
    const jobs = Array.from(trainingJobs.entries()).map(([id, job]) => ({
        id,
        status: job.status,
        startTime: job.startTime,
        endTime: job.endTime,
        duration: job.duration,
        userId: job.userId,
        hasResults: !!job.results,
        hasError: !!job.error
    }));

    res.json({
        success: true,
        jobs: jobs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    });
});

// Get training history from database
router.get('/history', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const historyProcess = spawn('python', ['-c', `
import sys
sys.path.append('python_engine')
from ai_training_pipeline import BioMapperTrainingPipeline
import json

pipeline = BioMapperTrainingPipeline()
history = pipeline.get_training_history()
print(json.dumps(history.to_dict('records')))
        `], {
            cwd: path.join(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        historyProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        historyProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        historyProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const history = JSON.parse(output);
                    res.json({
                        success: true,
                        history
                    });
                } catch (e) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse training history'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to get training history'
                });
            }
        });

    } catch (error) {
        console.error('Error getting training history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get training history'
        });
    }
});

// Add training data with corrections
router.post('/add-data', verifyToken, async (req, res) => {
    try {
        const { sequenceId, predictedSpecies, correctSpecies, feedbackType } = req.body;
        const userId = req.user.userId;

        // Store training data for future model improvement
        const trainingDataProcess = spawn('python', ['-c', `
import sys
sys.path.append('python_engine')
from ai_training_pipeline import BioMapperTrainingPipeline
import json

pipeline = BioMapperTrainingPipeline()
pipeline.add_training_correction(
    "${sequenceId}",
    "${predictedSpecies}",
    "${correctSpecies}",
    "${userId}",
    "${feedbackType}"
)
print(json.dumps({"success": True, "message": "Training data added successfully"}))
        `], {
            cwd: path.join(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        trainingDataProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        trainingDataProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        trainingDataProcess.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    message: 'Training data added successfully. This will help improve future predictions.'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to add training data'
                });
            }
        });

    } catch (error) {
        console.error('Error adding training data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add training data'
        });
    }
});

// Add annotation feedback for training
router.post('/feedback', verifyToken, async (req, res) => {
    try {
        const { sequenceId, originalPrediction, userFeedback, confidenceScore } = req.body;
        const scientistId = req.user.userId;

        const feedbackProcess = spawn('python', ['-c', `
import sys
sys.path.append('python_engine')
from ai_training_pipeline import BioMapperTrainingPipeline
import json

pipeline = BioMapperTrainingPipeline()
pipeline.add_annotation_feedback(
    "${sequenceId}",
    "${originalPrediction}",
    "${userFeedback}",
    "${scientistId}",
    ${confidenceScore}
)
print(json.dumps({"success": True, "message": "Feedback added successfully"}))
        `], {
            cwd: path.join(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        feedbackProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        feedbackProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        feedbackProcess.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    message: 'Annotation feedback added for future training'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to add feedback'
                });
            }
        });

    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add annotation feedback'
        });
    }
});

// Clean up old training jobs (run periodically)
setInterval(() => {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [jobId, job] of trainingJobs.entries()) {
        if (job.endTime && job.endTime < cutoffTime) {
            trainingJobs.delete(jobId);
        }
    }
}, 60 * 60 * 1000); // Clean up every hour

module.exports = router;

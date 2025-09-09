// backend/routes/quantum.js

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const { enhancedQuantumService } = require('../services/enhanced_quantum_service');
const fs = require('fs');

// Quantum service endpoint
router.post('/submit-job', async (req, res) => {
    try {
        const { algorithm, parameters } = req.body;
        
        if (!algorithm) {
            return res.status(400).json({
                success: false,
                error: 'Algorithm is required'
            });
        }
        
        // Call Python quantum service
        const pythonScript = path.join(__dirname, '../services/quantum_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'submit', algorithm, JSON.stringify(parameters)]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse quantum service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Quantum service execution failed'
                });
            }
        });
        
    } catch (error) {
        console.error('Quantum job submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Execute quantum job
router.post('/execute-job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const pythonScript = path.join(__dirname, '../services/quantum_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'execute', jobId]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse quantum service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Quantum job execution failed'
                });
            }
        });
        
    } catch (error) {
        console.error('Quantum job execution error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get job status
router.get('/job-status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const pythonScript = path.join(__dirname, '../services/quantum_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'status', jobId]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse quantum service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to get job status'
                });
            }
        });
        
    } catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// List all jobs
router.get('/jobs', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/quantum_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'list']);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse quantum service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to list jobs'
                });
            }
        });
        
    } catch (error) {
        console.error('List jobs error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get available algorithms
router.get('/algorithms', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/quantum_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'algorithms']);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse quantum service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to get algorithms'
                });
            }
        });
        
    } catch (error) {
        console.error('Get algorithms error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Simulate quantum job execution (for demo purposes)
router.post('/simulate', async (req, res) => {
    try {
        const { algorithm, parameters } = req.body;
        
        // Simulate quantum job execution
        const jobId = `qjob_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Simulate processing time
        setTimeout(() => {
            const result = {
                success: true,
                job_id: jobId,
                algorithm: algorithm,
                result: {
                    algorithm: algorithm,
                    execution_time: Math.random() * 2 + 0.5,
                    success_probability: 0.85 + Math.random() * 0.15,
                    quantum_advantage: Math.random() > 0.3,
                    output: generateSimulatedOutput(algorithm, parameters)
                },
                status: 'completed',
                completed_at: new Date().toISOString()
            };
            
            res.json(result);
        }, 1000 + Math.random() * 2000); // 1-3 second delay
        
    } catch (error) {
        console.error('Quantum simulation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

function generateSimulatedOutput(algorithm, parameters) {
    switch (algorithm) {
        case 'grover_search':
            return {
                target_found: Math.random() > 0.2,
                iterations: Math.floor(Math.random() * 50) + 10,
                speedup_factor: 2.5 + Math.random() * 2.5,
                matching_species: [
                    {
                        species_id: 'species_001',
                        name: 'Panthera tigris',
                        confidence: 0.85 + Math.random() * 0.15,
                        habitat: 'forest'
                    }
                ]
            };
            
        case 'quantum_annealing':
            return {
                solution: Array.from({length: 10}, () => Math.floor(Math.random() * 2)),
                energy: -Math.random() * 10,
                convergence: true,
                quantum_tunneling_events: Math.floor(Math.random() * 20) + 5
            };
            
        case 'vqe':
            return {
                ground_state_energy: -1.137 + Math.random() * 0.1,
                optimization_steps: Array.from({length: 10}, (_, i) => ({
                    step: i,
                    energy: -1.0 + i * 0.01 + Math.random() * 0.02,
                    gradient_norm: Math.random() * 0.1
                })),
                converged: true
            };
            
        case 'qaoa':
            return {
                solution: Array.from({length: 8}, () => Math.floor(Math.random() * 2)),
                approximation_ratio: 0.7 + Math.random() * 0.25,
                beta_parameters: Array.from({length: 3}, () => Math.random() * Math.PI),
                gamma_parameters: Array.from({length: 3}, () => Math.random() * 2 * Math.PI)
            };
            
        case 'qml':
            return {
                training_accuracy: 0.85 + Math.random() * 0.12,
                test_accuracy: 0.80 + Math.random() * 0.15,
                potential_speedup: 1.5 + Math.random() * 2.0,
                quantum_circuit_depth: Math.floor(Math.random() * 80) + 20
            };
            
        default:
            return {
                message: 'Quantum computation completed',
                result: Math.random()
            };
    }
}

// Enhanced quantum endpoints using the new service
router.post('/enhanced/submit-job', async (req, res) => {
    try {
        const { algorithm, parameters, options = {} } = req.body;

        if (!algorithm) {
            return res.status(400).json({
                success: false,
                error: 'Algorithm is required'
            });
        }

        const result = await enhancedQuantumService.submitQuantumJob(algorithm, parameters, options);
        res.json(result);
    } catch (error) {
        console.error('Enhanced quantum job submission error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/enhanced/job-status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await enhancedQuantumService.getJobStatus(jobId);
        res.json(status);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/enhanced/algorithms', async (req, res) => {
    try {
        const algorithms = enhancedQuantumService.getAvailableAlgorithms();
        res.json({
            success: true,
            algorithms,
            total: algorithms.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/enhanced/backends', async (req, res) => {
    try {
        const backends = enhancedQuantumService.getAvailableBackends();
        res.json({
            success: true,
            backends,
            total: backends.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/enhanced/stats', async (req, res) => {
    try {
        const stats = enhancedQuantumService.getServiceStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

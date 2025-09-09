// backend/routes/federated_learning.js

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Start FL server
router.post('/start-server', async (req, res) => {
    try {
        const { host = 'localhost', port = 8765 } = req.body;
        
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'start_server', host, port.toString()]);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to start FL server'
                });
            }
        });
        
    } catch (error) {
        console.error('Start FL server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Stop FL server
router.post('/stop-server', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'stop_server']);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to stop FL server'
                });
            }
        });
        
    } catch (error) {
        console.error('Stop FL server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start FL client
router.post('/start-client', async (req, res) => {
    try {
        const { client_id } = req.body;
        
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const args = ['start_client'];
        if (client_id) {
            args.push(client_id);
        }
        
        const pythonProcess = spawn('python', [pythonScript, ...args]);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to start FL client'
                });
            }
        });
        
    } catch (error) {
        console.error('Start FL client error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Stop all clients
router.post('/stop-clients', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'stop_clients']);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to stop FL clients'
                });
            }
        });
        
    } catch (error) {
        console.error('Stop FL clients error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get FL status
router.get('/status', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'status']);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to get FL status'
                });
            }
        });
        
    } catch (error) {
        console.error('Get FL status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Simulate FL round
router.post('/simulate-round', async (req, res) => {
    try {
        const { num_clients = 3 } = req.body;
        
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'simulate_round', num_clients.toString()]);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to simulate FL round'
                });
            }
        });
        
    } catch (error) {
        console.error('Simulate FL round error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get FL history
router.get('/history', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'history']);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to get FL history'
                });
            }
        });
        
    } catch (error) {
        console.error('Get FL history error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Reset FL system
router.post('/reset', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'reset']);
        
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
                        error: 'Failed to parse FL service response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Failed to reset FL system'
                });
            }
        });
        
    } catch (error) {
        console.error('Reset FL system error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Simulate FL round (for demo purposes)
router.post('/simulate', async (req, res) => {
    try {
        const { num_clients = 3, rounds = 1 } = req.body;
        
        // Simulate FL round execution
        const roundResults = [];
        
        for (let round = 1; round <= rounds; round++) {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            const roundData = {
                round_number: round,
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                participating_clients: num_clients,
                global_accuracy: 0.75 + (round * 0.05) + (0.1 * (0.5 - Math.abs(0.5 - (round % 10) / 10))),
                convergence_score: 0.8 + (round * 0.02),
                privacy_cost: 0.1 * num_clients,
                client_contributions: Array.from({length: num_clients}, (_, i) => ({
                    client_id: `client_${i + 1}`,
                    local_accuracy: 0.7 + (i * 0.05) + (0.1 * (0.5 - Math.abs(0.5 - (round % 10) / 10))),
                    data_size: 50 + (i * 25),
                    contribution_weight: 0.8 + (i * 0.1)
                })),
                simulation: true
            };
            
            roundResults.push(roundData);
        }
        
        res.json({
            success: true,
            rounds_completed: rounds,
            round_results: roundResults,
            total_accuracy_improvement: roundResults[roundResults.length - 1].global_accuracy - roundResults[0].global_accuracy
        });
        
    } catch (error) {
        console.error('FL simulation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;

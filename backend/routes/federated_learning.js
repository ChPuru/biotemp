// backend/routes/federated_learning.js

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Start FL server
router.post('/start-server', async (req, res) => {
    try {
        const { host = 'localhost', port = 8765 } = req.body;

        // Simulate starting FL server
        setTimeout(() => {
            res.json({
                success: true,
                message: 'FL server started successfully',
                server_info: {
                    host: host,
                    port: port,
                    status: 'running'
                }
            });
        }, 1000);

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
        // Simulate stopping FL server
        setTimeout(() => {
            res.json({
                success: true,
                message: 'FL server stopped successfully'
            });
        }, 500);

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

        // Simulate starting FL client
        setTimeout(() => {
            res.json({
                success: true,
                message: 'FL client started successfully',
                client_info: {
                    client_id: client_id || `client_${Date.now()}`,
                    status: 'connected'
                }
            });
        }, 800);

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
        // Simulate stopping FL clients
        setTimeout(() => {
            res.json({
                success: true,
                message: 'All FL clients stopped successfully'
            });
        }, 600);

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
        // Return mock FL status for demo purposes
        const status = {
            success: true,
            server_status: 'stopped',
            active_clients: 0,
            total_clients: 0,
            clients: [],
            fl_rounds: 0,
            current_round: 0,
            last_activity: new Date().toISOString()
        };

        res.json(status);

    } catch (error) {
        console.error('Get FL status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start FL simulation (alias for frontend compatibility)
router.post('/start', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../services/federated_learning_service.py');
        const pythonProcess = spawn('python', [pythonScript, 'simulate_round']);
        
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
                    error: error || 'Failed to start FL simulation'
                });
            }
        });
        
    } catch (error) {
        console.error('FL simulation start error:', error);
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
        // Return mock FL history for demo purposes
        const fl_rounds = [
            {
                round_number: 1,
                start_time: new Date(Date.now() - 3600000).toISOString(),
                end_time: new Date(Date.now() - 3300000).toISOString(),
                participating_clients: 3,
                global_accuracy: 0.75,
                convergence_score: 0.8,
                privacy_cost: 0.3,
                client_contributions: [
                    {
                        client_id: 'client_1',
                        local_accuracy: 0.72,
                        data_size: 50,
                        contribution_weight: 0.8
                    },
                    {
                        client_id: 'client_2',
                        local_accuracy: 0.76,
                        data_size: 75,
                        contribution_weight: 0.85
                    },
                    {
                        client_id: 'client_3',
                        local_accuracy: 0.74,
                        data_size: 60,
                        contribution_weight: 0.82
                    }
                ],
                simulation: true
            }
        ];

        res.json({
            success: true,
            fl_rounds: fl_rounds,
            total_rounds: fl_rounds.length
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
        // Simulate resetting FL system
        setTimeout(() => {
            res.json({
                success: true,
                message: 'FL system reset successfully',
                status: 'reset'
            });
        }, 300);

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

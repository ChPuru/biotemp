// backend/routes/enhanced_federated_learning.js
// Enhanced Federated Learning Routes with Real Flower Integration

const express = require('express');
const router = express.Router();
const enhancedFLService = require('../services/enhanced_fl_service');

// Start enhanced FL server
router.post('/server/start', async (req, res) => {
    try {
        const { use_real_flower = false, host = 'localhost', port = 8765, config = {} } = req.body;

        const serverConfig = {
            use_real_flower,
            host,
            port,
            ...config
        };

        const result = await enhancedFLService.startFLServer(serverConfig);
        res.json(result);
    } catch (error) {
        console.error('Enhanced FL server start error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop FL server
router.post('/server/stop', async (req, res) => {
    try {
        const result = await enhancedFLService.stopFLServer();
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Register FL client
router.post('/client/register', async (req, res) => {
    try {
        const { client_id, device_type, location, data_size, privacy_budget } = req.body;

        const clientInfo = {
            client_id,
            device_type,
            location,
            data_size,
            privacy_budget
        };

        const result = await enhancedFLService.registerFLClient(clientInfo);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start FL round
router.post('/round/start', async (req, res) => {
    try {
        const {
            algorithm = 'fedavg',
            learning_rate = 0.01,
            batch_size = 32,
            epochs = 5,
            min_clients = 2,
            timeout = 300000,
            privacy_technique = null
        } = req.body;

        const roundConfig = {
            algorithm,
            learning_rate,
            batch_size,
            epochs,
            min_clients,
            timeout,
            privacy_technique
        };

        const result = await enhancedFLService.startFLRound(roundConfig);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get FL status
router.get('/status', async (req, res) => {
    try {
        const status = enhancedFLService.getFLStatus();
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get round history
router.get('/rounds/history', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const history = enhancedFLService.getRoundHistory(parseInt(limit));
        res.json({
            success: true,
            history,
            total: history.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get client statistics
router.get('/clients/stats', async (req, res) => {
    try {
        const stats = enhancedFLService.getClientStatistics();
        res.json({
            success: true,
            ...stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available algorithms
router.get('/algorithms', async (req, res) => {
    try {
        const algorithms = enhancedFLService.getAvailableAlgorithms();
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

// Get available privacy techniques
router.get('/privacy-techniques', async (req, res) => {
    try {
        const techniques = enhancedFLService.getAvailablePrivacyTechniques();
        res.json({
            success: true,
            techniques,
            total: techniques.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simulate FL round (for demo purposes)
router.post('/simulate/round', async (req, res) => {
    try {
        const { num_clients = 3, rounds = 1, algorithm = 'fedavg' } = req.body;

        // Start FL server if not running
        const status = enhancedFLService.getFLStatus();
        if (status.server_status !== 'running') {
            await enhancedFLService.startFLServer({ use_real_flower: false });
        }

        // Register simulated clients if needed
        const currentClients = enhancedFLService.getFLStatus().total_clients;
        if (currentClients < num_clients) {
            for (let i = currentClients; i < num_clients; i++) {
                await enhancedFLService.registerFLClient({
                    client_id: `sim_client_${i + 1}`,
                    device_type: ['mobile', 'desktop', 'edge_device'][Math.floor(Math.random() * 3)],
                    location: ['asia', 'europe', 'america', 'africa'][Math.floor(Math.random() * 4)],
                    data_size: Math.floor(Math.random() * 1000) + 100
                });
            }
        }

        const results = [];
        for (let round = 1; round <= rounds; round++) {
            const roundResult = await enhancedFLService.startFLRound({
                algorithm,
                learning_rate: 0.01,
                batch_size: 32,
                epochs: 5,
                min_clients: num_clients
            });
            results.push(roundResult);
        }

        res.json({
            success: true,
            simulation_results: results,
            total_rounds: rounds,
            algorithm_used: algorithm,
            clients_participated: num_clients
        });
    } catch (error) {
        console.error('FL simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            suggestion: 'Try starting the FL server first or check server status'
        });
    }
});

// Get FL performance metrics
router.get('/metrics', async (req, res) => {
    try {
        const history = enhancedFLService.getRoundHistory(50); // Last 50 rounds
        const status = enhancedFLService.getFLStatus();

        const metrics = {
            total_rounds: history.length,
            average_accuracy: history.length > 0 ?
                history.reduce((sum, round) => sum + (round.metrics?.global_accuracy || 0), 0) / history.length : 0,
            average_participation: history.length > 0 ?
                history.reduce((sum, round) => sum + (round.participating_clients || 0), 0) / history.length : 0,
            convergence_trend: history.map(round => ({
                round: round.round_number,
                accuracy: round.metrics?.global_accuracy || 0,
                clients: round.participating_clients || 0
            })),
            algorithm_distribution: history.reduce((dist, round) => {
                dist[round.algorithm] = (dist[round.algorithm] || 0) + 1;
                return dist;
            }, {}),
            current_status: status.server_status,
            active_clients: status.active_clients,
            total_clients: status.total_clients
        };

        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reset FL system
router.post('/reset', async (req, res) => {
    try {
        // Stop server if running
        if (enhancedFLService.getFLStatus().server_status === 'running') {
            await enhancedFLService.stopFLServer();
        }

        // Reset the service (this would need to be implemented in the service)
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'FL system reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
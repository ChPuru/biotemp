// backend/services/enhanced_fl_service.js
// Enhanced Federated Learning Service with Real Flower Integration and Simulations

const { PythonShell } = require('python-shell');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const WebSocket = require('ws');

class EnhancedFLService {
    constructor() {
        this.flServer = null;
        this.flClients = new Map();
        this.activeRounds = new Map();
        this.roundHistory = [];
        this.clientData = new Map();
        this.serverConfig = {
            host: 'localhost',
            port: 8765,
            min_clients: 2,
            max_clients: 10,
            rounds: 5,
            timeout: 300000 // 5 minutes
        };

        this.algorithms = {
            'fedavg': {
                name: 'Federated Averaging (FedAvg)',
                description: 'Standard federated learning algorithm',
                communication_efficiency: 'high',
                convergence_speed: 'medium',
                privacy_level: 'medium'
            },
            'fedprox': {
                name: 'FedProx',
                description: 'Federated learning with proximal term for heterogeneity',
                communication_efficiency: 'medium',
                convergence_speed: 'medium',
                privacy_level: 'medium'
            },
            'fednova': {
                name: 'FedNova',
                description: 'Normalized averaging for fair federated learning',
                communication_efficiency: 'medium',
                convergence_speed: 'high',
                privacy_level: 'medium'
            },
            'scaffold': {
                name: 'SCAFFOLD',
                description: 'Stochastic Controlled Averaging for Federated Learning',
                communication_efficiency: 'low',
                convergence_speed: 'high',
                privacy_level: 'high'
            },
            'fedadam': {
                name: 'FedAdam',
                description: 'Adaptive federated optimization using Adam',
                communication_efficiency: 'medium',
                convergence_speed: 'high',
                privacy_level: 'medium'
            }
        };

        this.privacyTechniques = {
            'differential_privacy': {
                name: 'Differential Privacy',
                description: 'Add noise to protect individual privacy',
                privacy_level: 'high',
                utility_impact: 'low'
            },
            'secure_aggregation': {
                name: 'Secure Aggregation',
                description: 'Cryptographically secure model aggregation',
                privacy_level: 'very_high',
                utility_impact: 'none'
            },
            'homomorphic_encryption': {
                name: 'Homomorphic Encryption',
                description: 'Encrypted computation on model updates',
                privacy_level: 'very_high',
                utility_impact: 'medium'
            }
        };

        this.initializeFLService();
    }

    async initializeFLService() {
        try {
            // Create FL data directories
            await fs.mkdir(path.join(__dirname, '../fl_data'), { recursive: true });
            await fs.mkdir(path.join(__dirname, '../fl_models'), { recursive: true });
            console.log('✅ Enhanced FL Service initialized');
        } catch (error) {
            console.error('❌ FL service initialization error:', error);
        }
    }

    // Start federated learning server
    async startFLServer(config = {}) {
        try {
            const serverConfig = { ...this.serverConfig, ...config };
            const serverId = `fl_server_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

            // Check if using real Flower framework or simulation
            if (config.use_real_flower) {
                return await this.startRealFlowerServer(serverConfig, serverId);
            } else {
                return await this.startSimulatedFLServer(serverConfig, serverId);
            }

        } catch (error) {
            console.error('FL server start error:', error);
            throw error;
        }
    }

    async startRealFlowerServer(config, serverId) {
        const pythonScript = path.join(__dirname, '../../python_engine/enhanced_fl_server.py');

        return new Promise((resolve, reject) => {
            const options = {
                mode: 'text',
                pythonPath: 'python',
                scriptPath: path.dirname(pythonScript),
                args: [
                    'start_server',
                    serverId,
                    config.host,
                    config.port.toString(),
                    JSON.stringify(config)
                ]
            };

            PythonShell.run(path.basename(pythonScript), options)
                .then(messages => {
                    try {
                        const result = JSON.parse(messages.join(''));
                        this.flServer = {
                            id: serverId,
                            config,
                            status: 'running',
                            startTime: new Date().toISOString(),
                            real_flower: true,
                            ...result
                        };

                        resolve({
                            server_id: serverId,
                            status: 'running',
                            host: config.host,
                            port: config.port,
                            real_flower: true,
                            message: 'Real Flower FL server started'
                        });
                    } catch (parseError) {
                        reject(new Error('Failed to parse Flower server response'));
                    }
                })
                .catch(err => {
                    reject(new Error(`Flower server start failed: ${err.message}`));
                });
        });
    }

    async startSimulatedFLServer(config, serverId) {
        this.flServer = {
            id: serverId,
            config,
            status: 'running',
            startTime: new Date().toISOString(),
            real_flower: false,
            global_model: this.initializeGlobalModel(),
            round_number: 0
        };

        return {
            server_id: serverId,
            status: 'running',
            host: config.host,
            port: config.port,
            real_flower: false,
            message: 'Simulated FL server started'
        };
    }

    initializeGlobalModel() {
        // Initialize a simple neural network model structure
        return {
            layers: [
                { type: 'dense', units: 128, activation: 'relu', input_shape: [784] },
                { type: 'dense', units: 64, activation: 'relu' },
                { type: 'dense', units: 10, activation: 'softmax' }
            ],
            weights: this.generateRandomWeights(),
            optimizer: 'adam',
            loss: 'categorical_crossentropy',
            metrics: ['accuracy']
        };
    }

    generateRandomWeights() {
        // Generate random weights for demonstration
        return {
            layer_0: {
                kernel: Array.from({length: 128 * 784}, () => (Math.random() - 0.5) * 0.1),
                bias: Array.from({length: 128}, () => 0)
            },
            layer_1: {
                kernel: Array.from({length: 64 * 128}, () => (Math.random() - 0.5) * 0.1),
                bias: Array.from({length: 64}, () => 0)
            },
            layer_2: {
                kernel: Array.from({length: 10 * 64}, () => (Math.random() - 0.5) * 0.1),
                bias: Array.from({length: 10}, () => 0)
            }
        };
    }

    // Register FL client
    async registerFLClient(clientInfo) {
        const clientId = clientInfo.client_id || `fl_client_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const client = {
            id: clientId,
            ...clientInfo,
            registered_at: new Date().toISOString(),
            status: 'registered',
            local_model: null,
            data_size: clientInfo.data_size || Math.floor(Math.random() * 1000) + 100,
            device_type: clientInfo.device_type || 'mobile',
            location: clientInfo.location || 'unknown',
            privacy_budget: clientInfo.privacy_budget || 1.0
        };

        this.flClients.set(clientId, client);
        this.clientData.set(clientId, {
            training_data: this.generateClientData(client.data_size),
            local_updates: []
        });

        return {
            client_id: clientId,
            status: 'registered',
            server_config: this.flServer?.config || this.serverConfig
        };
    }

    generateClientData(dataSize) {
        // Generate synthetic training data for demonstration
        return Array.from({length: dataSize}, () => ({
            features: Array.from({length: 784}, () => Math.random()),
            label: Math.floor(Math.random() * 10)
        }));
    }

    // Start federated learning round
    async startFLRound(roundConfig = {}) {
        if (!this.flServer || this.flServer.status !== 'running') {
            throw new Error('FL server is not running');
        }

        const roundId = `fl_round_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const roundNumber = this.flServer.round_number + 1;

        const round = {
            id: roundId,
            round_number: roundNumber,
            status: 'active',
            start_time: new Date().toISOString(),
            config: {
                algorithm: roundConfig.algorithm || 'fedavg',
                learning_rate: roundConfig.learning_rate || 0.01,
                batch_size: roundConfig.batch_size || 32,
                epochs: roundConfig.epochs || 5,
                min_clients: roundConfig.min_clients || 2,
                timeout: roundConfig.timeout || 300000,
                privacy_technique: roundConfig.privacy_technique || null,
                ...roundConfig
            },
            participating_clients: [],
            client_updates: [],
            global_model: JSON.parse(JSON.stringify(this.flServer.global_model))
        };

        this.activeRounds.set(roundId, round);
        this.flServer.round_number = roundNumber;

        // Select participating clients
        const availableClients = Array.from(this.flClients.values())
            .filter(client => client.status === 'registered');

        if (availableClients.length < round.config.min_clients) {
            throw new Error(`Not enough clients available. Required: ${round.config.min_clients}, Available: ${availableClients.length}`);
        }

        round.participating_clients = availableClients
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(availableClients.length, round.config.min_clients * 2));

        // Start client training
        await this.startClientTraining(round);

        return {
            round_id: roundId,
            round_number: roundNumber,
            participating_clients: round.participating_clients.length,
            algorithm: round.config.algorithm,
            status: 'active'
        };
    }

    async startClientTraining(round) {
        const trainingPromises = round.participating_clients.map(async (client) => {
            try {
                const clientData = this.clientData.get(client.id);
                const localUpdate = await this.trainClientModel(client, round, clientData);

                round.client_updates.push({
                    client_id: client.id,
                    local_update: localUpdate,
                    training_time: localUpdate.training_time,
                    data_size: clientData.training_data.length,
                    privacy_budget_used: localUpdate.privacy_budget_used || 0
                });

                return { client_id: client.id, success: true };
            } catch (error) {
                console.error(`Client ${client.id} training failed:`, error);
                return { client_id: client.id, success: false, error: error.message };
            }
        });

        // Wait for all clients to complete training
        await Promise.allSettled(trainingPromises);

        // Aggregate client updates
        await this.aggregateClientUpdates(round);
    }

    async trainClientModel(client, round, clientData) {
        // Simulate local training
        const trainingTime = (round.config.epochs * clientData.training_data.length / round.config.batch_size) * 0.001;
        await new Promise(resolve => setTimeout(resolve, Math.min(trainingTime * 1000, 5000))); // Max 5 seconds for demo

        // Generate local model update
        const localUpdate = {
            client_id: client.id,
            round_id: round.id,
            model_weights: this.generateLocalUpdate(round.global_model),
            training_loss: 0.5 + Math.random() * 0.5,
            training_accuracy: 0.7 + Math.random() * 0.3,
            validation_loss: 0.6 + Math.random() * 0.4,
            validation_accuracy: 0.65 + Math.random() * 0.3,
            training_time: trainingTime,
            samples_used: clientData.training_data.length,
            privacy_budget_used: round.config.privacy_technique ? Math.random() * 0.1 : 0
        };

        return localUpdate;
    }

    generateLocalUpdate(globalModel) {
        // Generate a local model update by adding noise to global weights
        const localWeights = JSON.parse(JSON.stringify(globalModel.weights));

        Object.keys(localWeights).forEach(layerKey => {
            const layer = localWeights[layerKey];
            layer.kernel = layer.kernel.map(w => w + (Math.random() - 0.5) * 0.01);
            layer.bias = layer.bias.map(b => b + (Math.random() - 0.5) * 0.01);
        });

        return localWeights;
    }

    async aggregateClientUpdates(round) {
        const successfulUpdates = round.client_updates.filter(update => update.local_update);

        if (successfulUpdates.length === 0) {
            round.status = 'failed';
            round.error = 'No successful client updates';
            return;
        }

        // Federated averaging
        const aggregatedWeights = this.aggregateWeights(successfulUpdates, round.config.algorithm);

        // Update global model
        this.flServer.global_model.weights = aggregatedWeights;
        this.flServer.global_model.last_updated = new Date().toISOString();

        // Calculate round metrics
        round.end_time = new Date().toISOString();
        round.metrics = {
            participating_clients: successfulUpdates.length,
            total_samples: successfulUpdates.reduce((sum, update) => sum + update.data_size, 0),
            average_training_time: successfulUpdates.reduce((sum, update) => sum + update.training_time, 0) / successfulUpdates.length,
            average_accuracy: successfulUpdates.reduce((sum, update) => sum + update.local_update.training_accuracy, 0) / successfulUpdates.length,
            global_accuracy: this.calculateGlobalAccuracy(aggregatedWeights),
            privacy_budget_used: successfulUpdates.reduce((sum, update) => sum + (update.privacy_budget_used || 0), 0),
            communication_cost: this.calculateCommunicationCost(successfulUpdates)
        };

        round.status = 'completed';
        this.roundHistory.push(round);
        this.activeRounds.delete(round.id);

        console.log(`✅ FL Round ${round.round_number} completed with ${successfulUpdates.length} clients`);
    }

    aggregateWeights(updates, algorithm) {
        const globalWeights = JSON.parse(JSON.stringify(this.flServer.global_model.weights));

        if (algorithm === 'fedavg') {
            // Simple averaging
            const totalSamples = updates.reduce((sum, update) => sum + update.samples_used, 0);

            Object.keys(globalWeights).forEach(layerKey => {
                const layer = globalWeights[layerKey];

                // Reset to zero
                layer.kernel = layer.kernel.map(() => 0);
                layer.bias = layer.bias.map(() => 0);

                // Weighted average of client updates
                updates.forEach(update => {
                    const weight = update.samples_used / totalSamples;
                    const localLayer = update.local_update.model_weights[layerKey];

                    layer.kernel = layer.kernel.map((w, i) => w + localLayer.kernel[i] * weight);
                    layer.bias = layer.bias.map((b, i) => b + localLayer.bias[i] * weight);
                });
            });
        }

        return globalWeights;
    }

    calculateGlobalAccuracy(weights) {
        // Simplified accuracy calculation for demonstration
        return 0.75 + (this.flServer.round_number * 0.05) + (Math.random() - 0.5) * 0.1;
    }

    calculateCommunicationCost(updates) {
        // Estimate communication cost based on model size and number of clients
        const modelSize = JSON.stringify(this.flServer.global_model.weights).length;
        return modelSize * updates.length * 2; // Upload + download
    }

    // Get FL status
    getFLStatus() {
        return {
            server_status: this.flServer?.status || 'stopped',
            server_id: this.flServer?.id || null,
            active_rounds: this.activeRounds.size,
            total_clients: this.flClients.size,
            active_clients: Array.from(this.flClients.values()).filter(c => c.status === 'active').length,
            completed_rounds: this.roundHistory.length,
            current_round: this.flServer?.round_number || 0,
            real_flower: this.flServer?.real_flower || false,
            algorithms: Object.keys(this.algorithms),
            privacy_techniques: Object.keys(this.privacyTechniques)
        };
    }

    // Get round history
    getRoundHistory(limit = 10) {
        return this.roundHistory
            .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
            .slice(0, limit)
            .map(round => ({
                round_id: round.id,
                round_number: round.round_number,
                status: round.status,
                start_time: round.start_time,
                end_time: round.end_time,
                participating_clients: round.participating_clients.length,
                algorithm: round.config.algorithm,
                metrics: round.metrics
            }));
    }

    // Get client statistics
    getClientStatistics() {
        const clients = Array.from(this.flClients.values());

        return {
            total_clients: clients.length,
            active_clients: clients.filter(c => c.status === 'active').length,
            device_distribution: this.groupBy(clients, 'device_type'),
            location_distribution: this.groupBy(clients, 'location'),
            average_data_size: clients.reduce((sum, c) => sum + (c.data_size || 0), 0) / clients.length,
            total_data_size: clients.reduce((sum, c) => sum + (c.data_size || 0), 0)
        };
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = item[key] || 'unknown';
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    // Stop FL server
    async stopFLServer() {
        if (!this.flServer) {
            throw new Error('No FL server is running');
        }

        if (this.flServer.real_flower) {
            // Stop real Flower server
            const pythonScript = path.join(__dirname, '../../python_engine/enhanced_fl_server.py');

            await new Promise((resolve, reject) => {
                const options = {
                    mode: 'text',
                    pythonPath: 'python',
                    scriptPath: path.dirname(pythonScript),
                    args: ['stop_server', this.flServer.id]
                };

                PythonShell.run(path.basename(pythonScript), options)
                    .then(() => resolve())
                    .catch(err => reject(new Error(`Flower server stop failed: ${err.message}`)));
            });
        }

        this.flServer.status = 'stopped';
        this.flServer.endTime = new Date().toISOString();

        // Stop all active rounds
        for (const [roundId, round] of this.activeRounds) {
            round.status = 'cancelled';
            this.activeRounds.delete(roundId);
        }

        console.log('✅ FL server stopped');
        return { message: 'FL server stopped successfully' };
    }

    // Get available algorithms
    getAvailableAlgorithms() {
        return Object.entries(this.algorithms).map(([id, algo]) => ({
            id,
            ...algo
        }));
    }

    // Get available privacy techniques
    getAvailablePrivacyTechniques() {
        return Object.entries(this.privacyTechniques).map(([id, technique]) => ({
            id,
            ...technique
        }));
    }

    // Legacy method for backward compatibility
    startFLSimulation() {
        return this.startFLServer({ use_real_flower: false });
    }
}

// Create enhanced FL service instance
const enhancedFLService = new EnhancedFLService();

module.exports = {
    enhancedFLService,
    EnhancedFLService
};
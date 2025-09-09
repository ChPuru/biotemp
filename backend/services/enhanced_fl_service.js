// backend/services/enhanced_fl_service.js
// Enhanced Federated Learning with Real-time Collaboration

const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class EnhancedFLService {
    constructor() {
        this.activeSessions = new Map();
        this.participants = new Map();
        this.models = new Map();
        this.collaborationRooms = new Map();
        this.wss = null;
    }

    // Initialize WebSocket server for real-time collaboration
    initializeWebSocketServer(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            const userId = this.extractUserId(req);
            const sessionId = this.extractSessionId(req);

            this.handleWebSocketConnection(ws, userId, sessionId);
        });

        console.log('Enhanced FL WebSocket server initialized');
    }

    // Handle WebSocket connections
    handleWebSocketConnection(ws, userId, sessionId) {
        console.log(`User ${userId} connected to session ${sessionId}`);

        // Add to participants
        this.participants.set(userId, {
            id: userId,
            sessionId,
            ws,
            connectedAt: new Date(),
            lastActivity: new Date(),
            status: 'active'
        });

        // Join collaboration room
        this.joinCollaborationRoom(sessionId, userId, ws);

        // Handle messages
        ws.on('message', (message) => {
            this.handleWebSocketMessage(userId, sessionId, message);
        });

        // Handle disconnection
        ws.on('close', () => {
            this.handleParticipantDisconnection(userId, sessionId);
        });

        // Send welcome message
        this.sendToParticipant(userId, {
            type: 'welcome',
            data: {
                userId,
                sessionId,
                timestamp: new Date(),
                activeParticipants: this.getActiveParticipants(sessionId)
            }
        });
    }

    // Create advanced FL session
    async createAdvancedFLSession(config) {
        const sessionId = `fl_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session = {
            id: sessionId,
            name: config.name || 'Advanced FL Session',
            participants: [],
            maxParticipants: config.maxParticipants || 10,
            modelConfig: {
                type: config.modelType || 'neural_network',
                architecture: config.architecture || 'simple_cnn',
                dataset: config.dataset || 'distributed_biodiversity'
            },
            privacyConfig: {
                differentialPrivacy: config.differentialPrivacy || true,
                noiseMultiplier: config.noiseMultiplier || 0.1,
                secureAggregation: config.secureAggregation || true
            },
            collaborationConfig: {
                realTimeUpdates: true,
                resultSharing: true,
                modelMerging: config.modelMerging || 'fedavg'
            },
            status: 'waiting',
            created: new Date(),
            rounds: [],
            globalModel: null,
            metrics: {
                totalRounds: 0,
                averageAccuracy: 0,
                participationRate: 0,
                communicationCost: 0
            }
        };

        this.activeSessions.set(sessionId, session);
        this.collaborationRooms.set(sessionId, new Set());

        return {
            sessionId,
            status: 'created',
            config: session,
            joinUrl: `/fl/join/${sessionId}`,
            websocketUrl: `ws://localhost:5001/fl/ws/${sessionId}`
        };
    }

    // Start FL training with real-time collaboration
    async startCollaborativeTraining(sessionId) {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        session.status = 'training';

        // Initialize global model
        session.globalModel = await this.initializeGlobalModel(session.modelConfig);

        // Start training rounds
        const trainingProcess = spawn('python', [
            path.join(__dirname, '../../python_engine/run_federated_learning.py'),
            sessionId,
            JSON.stringify(session.modelConfig),
            JSON.stringify(session.privacyConfig)
        ]);

        // Handle training output
        trainingProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            this.handleTrainingOutput(sessionId, output);
        });

        trainingProcess.stderr.on('data', (data) => {
            console.error(`FL Training Error: ${data}`);
        });

        trainingProcess.on('close', (code) => {
            session.status = code === 0 ? 'completed' : 'failed';
            this.broadcastToRoom(sessionId, {
                type: 'training_complete',
                data: { success: code === 0, finalMetrics: session.metrics }
            });
        });

        return {
            sessionId,
            status: 'training_started',
            processId: trainingProcess.pid,
            estimatedDuration: this.estimateTrainingDuration(session)
        };
    }

    // Real-time model updates and collaboration
    async updateModelWithParticipant(sessionId, participantId, localModelUpdate) {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        // Validate participant
        if (!session.participants.find(p => p.id === participantId)) {
            throw new Error('Participant not in session');
        }

        // Store local update
        const updateId = `update_${Date.now()}_${participantId}`;
        const update = {
            id: updateId,
            participantId,
            modelUpdate: localModelUpdate,
            timestamp: new Date(),
            validated: false
        };

        // Add to current round
        if (!session.currentRound) {
            session.currentRound = {
                roundNumber: session.rounds.length + 1,
                updates: [],
                startTime: new Date()
            };
        }

        session.currentRound.updates.push(update);

        // Check if round is complete
        if (session.currentRound.updates.length >= session.participants.length * 0.8) {
            await this.completeTrainingRound(sessionId);
        }

        // Broadcast update to all participants
        this.broadcastToRoom(sessionId, {
            type: 'model_update',
            data: {
                participantId,
                updateId,
                timestamp: update.timestamp,
                roundProgress: session.currentRound.updates.length / session.participants.length
            }
        });

        return { updateId, roundProgress: session.currentRound.updates.length / session.participants.length };
    }

    // Complete training round and aggregate models
    async completeTrainingRound(sessionId) {
        const session = this.activeSessions.get(sessionId);

        if (!session || !session.currentRound) {
            return;
        }

        const round = session.currentRound;

        // Aggregate model updates
        const aggregatedModel = await this.aggregateModelUpdates(round.updates, session.collaborationConfig.modelMerging);

        // Update global model
        session.globalModel = aggregatedModel;

        // Calculate round metrics
        const roundMetrics = {
            roundNumber: round.roundNumber,
            participants: round.updates.length,
            accuracy: this.calculateRoundAccuracy(aggregatedModel),
            loss: this.calculateRoundLoss(aggregatedModel),
            communicationCost: this.calculateCommunicationCost(round.updates),
            duration: Date.now() - round.startTime.getTime()
        };

        // Store round results
        session.rounds.push({
            ...round,
            endTime: new Date(),
            aggregatedModel,
            metrics: roundMetrics
        });

        // Update session metrics
        this.updateSessionMetrics(session);

        // Broadcast round completion
        this.broadcastToRoom(sessionId, {
            type: 'round_complete',
            data: {
                roundNumber: round.roundNumber,
                metrics: roundMetrics,
                globalModelUpdate: true,
                nextRoundEta: this.estimateNextRoundTime(session)
            }
        });

        // Clear current round
        session.currentRound = null;

        // Check if training should continue
        if (this.shouldContinueTraining(session)) {
            this.startNextRound(sessionId);
        } else {
            this.completeTraining(sessionId);
        }
    }

    // Advanced visualization data
    async generateCollaborationVisualization(sessionId) {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        return {
            sessionId,
            participants: session.participants.map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                contributionScore: this.calculateParticipantScore(p, session),
                activityTimeline: this.getParticipantActivity(p.id, session)
            })),
            rounds: session.rounds.map(round => ({
                number: round.roundNumber,
                participants: round.updates.length,
                metrics: round.metrics,
                timeline: {
                    start: round.startTime,
                    end: round.endTime,
                    duration: round.endTime - round.startTime
                }
            })),
            globalMetrics: {
                totalRounds: session.metrics.totalRounds,
                averageAccuracy: session.metrics.averageAccuracy,
                participationRate: session.metrics.participationRate,
                communicationEfficiency: this.calculateCommunicationEfficiency(session)
            },
            collaborationNetwork: this.generateCollaborationNetwork(session),
            realTimeData: {
                activeParticipants: this.getActiveParticipants(sessionId).length,
                currentRound: session.currentRound ? session.currentRound.roundNumber : null,
                pendingUpdates: session.currentRound ? session.currentRound.updates.length : 0
            }
        };
    }

    // Workflow automation for FL pipelines
    async createFLWorkflow(name, config) {
        const workflowId = `fl_workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const workflow = {
            id: workflowId,
            name,
            type: 'federated_learning',
            steps: [
                { id: 'data_preparation', name: 'Data Preparation', status: 'pending' },
                { id: 'model_initialization', name: 'Model Initialization', status: 'pending' },
                { id: 'participant_recruitment', name: 'Participant Recruitment', status: 'pending' },
                { id: 'training_rounds', name: 'Training Rounds', status: 'pending' },
                { id: 'model_aggregation', name: 'Model Aggregation', status: 'pending' },
                { id: 'evaluation', name: 'Model Evaluation', status: 'pending' },
                { id: 'deployment', name: 'Model Deployment', status: 'pending' }
            ],
            config,
            status: 'created',
            created: new Date(),
            progress: 0
        };

        return workflow;
    }

    // Helper methods
    extractUserId(req) {
        return req.headers['x-user-id'] || `user_${Date.now()}`;
    }

    extractSessionId(req) {
        const url = req.url;
        const match = url.match(/\/fl\/ws\/([^\/]+)/);
        return match ? match[1] : null;
    }

    joinCollaborationRoom(sessionId, userId, ws) {
        if (!this.collaborationRooms.has(sessionId)) {
            this.collaborationRooms.set(sessionId, new Set());
        }
        this.collaborationRooms.get(sessionId).add(userId);
    }

    handleWebSocketMessage(userId, sessionId, message) {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'model_update':
                    this.handleModelUpdate(sessionId, userId, data.data);
                    break;
                case 'chat_message':
                    this.handleChatMessage(sessionId, userId, data.data);
                    break;
                case 'status_update':
                    this.handleStatusUpdate(sessionId, userId, data.data);
                    break;
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleParticipantDisconnection(userId, sessionId) {
        console.log(`User ${userId} disconnected from session ${sessionId}`);

        // Update participant status
        const participant = this.participants.get(userId);
        if (participant) {
            participant.status = 'disconnected';
            participant.disconnectedAt = new Date();
        }

        // Remove from collaboration room
        const room = this.collaborationRooms.get(sessionId);
        if (room) {
            room.delete(userId);
        }

        // Broadcast disconnection
        this.broadcastToRoom(sessionId, {
            type: 'participant_disconnected',
            data: { userId, timestamp: new Date() }
        });
    }

    sendToParticipant(userId, message) {
        const participant = this.participants.get(userId);
        if (participant && participant.ws.readyState === WebSocket.OPEN) {
            participant.ws.send(JSON.stringify(message));
        }
    }

    broadcastToRoom(sessionId, message) {
        const room = this.collaborationRooms.get(sessionId);
        if (room) {
            room.forEach(userId => {
                this.sendToParticipant(userId, message);
            });
        }
    }

    getActiveParticipants(sessionId) {
        const room = this.collaborationRooms.get(sessionId);
        if (!room) return [];

        return Array.from(room).map(userId => {
            const participant = this.participants.get(userId);
            return participant ? {
                id: userId,
                name: participant.name || `User ${userId}`,
                status: participant.status,
                lastActivity: participant.lastActivity
            } : null;
        }).filter(Boolean);
    }

    async initializeGlobalModel(modelConfig) {
        // Initialize global model based on configuration
        return {
            architecture: modelConfig.architecture,
            weights: [], // Placeholder for actual weights
            initialized: true,
            timestamp: new Date()
        };
    }

    async aggregateModelUpdates(updates, mergingStrategy) {
        // Implement federated averaging or other aggregation strategies
        return {
            aggregated: true,
            strategy: mergingStrategy,
            participantCount: updates.length,
            timestamp: new Date()
        };
    }

    calculateRoundAccuracy(model) {
        // Calculate round accuracy (placeholder)
        return Math.random() * 0.2 + 0.8; // 80-100%
    }

    calculateRoundLoss(model) {
        // Calculate round loss (placeholder)
        return Math.random() * 0.5 + 0.1; // 0.1-0.6
    }

    calculateCommunicationCost(updates) {
        // Calculate communication cost
        return updates.length * 1024; // KB
    }

    updateSessionMetrics(session) {
        const rounds = session.rounds;
        if (rounds.length > 0) {
            session.metrics.totalRounds = rounds.length;
            session.metrics.averageAccuracy = rounds.reduce((sum, round) => sum + round.metrics.accuracy, 0) / rounds.length;
            session.metrics.participationRate = rounds.reduce((sum, round) => sum + round.participants, 0) / (rounds.length * session.participants.length);
            session.metrics.communicationCost = rounds.reduce((sum, round) => sum + round.metrics.communicationCost, 0);
        }
    }

    estimateTrainingDuration(session) {
        // Estimate training duration based on configuration
        const baseTime = 300; // 5 minutes
        const participantMultiplier = Math.sqrt(session.participants.length);
        const roundMultiplier = session.modelConfig.complexity || 1;

        return baseTime * participantMultiplier * roundMultiplier;
    }

    estimateNextRoundTime(session) {
        // Estimate time for next round
        return 60; // 1 minute
    }

    shouldContinueTraining(session) {
        // Determine if training should continue
        return session.rounds.length < 10 && session.metrics.averageAccuracy < 0.95;
    }

    startNextRound(sessionId) {
        // Start next training round
        setTimeout(() => {
            this.startCollaborativeTraining(sessionId);
        }, 5000); // 5 second delay
    }

    completeTraining(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'completed';
            session.completedAt = new Date();
        }
    }

    calculateParticipantScore(participant, session) {
        // Calculate participant contribution score
        return Math.random() * 100; // Placeholder
    }

    getParticipantActivity(userId, session) {
        // Get participant activity timeline
        return []; // Placeholder
    }

    calculateCommunicationEfficiency(session) {
        // Calculate communication efficiency
        return session.metrics.communicationCost / session.metrics.totalRounds || 0;
    }

    generateCollaborationNetwork(session) {
        // Generate collaboration network visualization
        return {
            nodes: session.participants.map(p => ({ id: p.id, name: p.name })),
            edges: [] // Placeholder for collaboration edges
        };
    }

    handleModelUpdate(sessionId, userId, data) {
        // Handle model update messages
        this.broadcastToRoom(sessionId, {
            type: 'model_update_received',
            data: { userId, ...data }
        });
    }

    handleChatMessage(sessionId, userId, data) {
        // Handle chat messages
        const message = {
            id: `msg_${Date.now()}`,
            userId,
            text: data.text,
            timestamp: new Date()
        };

        // Store message (implement storage)
        this.broadcastToRoom(sessionId, {
            type: 'chat_message',
            data: message
        });
    }

    handleStatusUpdate(sessionId, userId, data) {
        // Handle status updates
        const participant = this.participants.get(userId);
        if (participant) {
            participant.status = data.status;
            participant.lastActivity = new Date();
        }

        this.broadcastToRoom(sessionId, {
            type: 'status_update',
            data: { userId, status: data.status }
        });
    }

    // FL Server Management Methods
    getFLStatus() {
        return {
            server_status: 'running',
            total_clients: this.participants.size,
            active_clients: Array.from(this.participants.values()).filter(p => p.status === 'active').length,
            total_sessions: this.activeSessions.size,
            server_uptime: process.uptime(),
            memory_usage: process.memoryUsage()
        };
    }

    async startFLServer(config = {}) {
        console.log('Starting FL server with config:', config);
        return {
            success: true,
            server_id: `fl_server_${Date.now()}`,
            config: config,
            status: 'running',
            port: config.port || 8765
        };
    }

    async stopFLServer() {
        console.log('Stopping FL server');
        return {
            success: true,
            status: 'stopped',
            uptime: process.uptime()
        };
    }

    async registerFLClient(clientInfo) {
        const clientId = clientInfo.client_id;
        this.participants.set(clientId, {
            id: clientId,
            ...clientInfo,
            registeredAt: new Date(),
            status: 'registered'
        });

        console.log(`Registered FL client: ${clientId}`);
        return {
            success: true,
            client_id: clientId,
            status: 'registered'
        };
    }

    async startFLRound(roundConfig) {
        const roundId = `round_${Date.now()}`;
        console.log(`Starting FL round: ${roundId}`, roundConfig);

        // Simulate round execution
        setTimeout(() => {
            console.log(`FL round ${roundId} completed`);
        }, 5000);

        return {
            success: true,
            round_id: roundId,
            status: 'started',
            config: roundConfig,
            estimated_duration: 30,
            participating_clients: roundConfig.min_clients || 2
        };
    }

    getRoundHistory(limit = 10) {
        // Return mock round history
        const mockRounds = [];
        for (let i = 0; i < Math.min(limit, 5); i++) {
            mockRounds.push({
                round_number: i + 1,
                algorithm: 'fedavg',
                participating_clients: Math.floor(Math.random() * 5) + 2,
                metrics: {
                    global_accuracy: 0.8 + Math.random() * 0.15,
                    loss: 0.1 + Math.random() * 0.4
                },
                start_time: new Date(Date.now() - (i * 60000)),
                end_time: new Date(Date.now() - ((i-1) * 60000)),
                status: 'completed'
            });
        }
        return mockRounds;
    }

    getClientStatistics() {
        const clients = Array.from(this.participants.values());
        return {
            total_clients: clients.length,
            active_clients: clients.filter(c => c.status === 'active').length,
            registered_clients: clients.filter(c => c.status === 'registered').length,
            client_types: clients.reduce((acc, client) => {
                acc[client.device_type || 'unknown'] = (acc[client.device_type || 'unknown'] || 0) + 1;
                return acc;
            }, {}),
            average_data_size: clients.length > 0 ?
                clients.reduce((sum, c) => sum + (c.data_size || 0), 0) / clients.length : 0
        };
    }

    getAvailableAlgorithms() {
        return [
            { name: 'fedavg', description: 'Federated Averaging', complexity: 'low' },
            { name: 'fedprox', description: 'FedProx with proximal term', complexity: 'medium' },
            { name: 'scaffold', description: 'SCAFFOLD algorithm', complexity: 'high' },
            { name: 'fednova', description: 'FedNova with normalized averaging', complexity: 'medium' }
        ];
    }

    getAvailablePrivacyTechniques() {
        return [
            { name: 'differential_privacy', description: 'Differential Privacy with noise addition', effectiveness: 'high' },
            { name: 'secure_aggregation', description: 'Secure multi-party computation', effectiveness: 'very_high' },
            { name: 'homomorphic_encryption', description: 'Homomorphic encryption', effectiveness: 'very_high' },
            { name: 'local_dp', description: 'Local differential privacy', effectiveness: 'medium' }
        ];
    }
}

module.exports = new EnhancedFLService();
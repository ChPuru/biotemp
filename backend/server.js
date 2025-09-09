require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: false
  }
});
const PORT = process.env.PORT || 5001;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/biomapper";
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully."))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Add compression middleware for better performance
app.use(compression());
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const analysisRoutes = require('./routes/analysis');
const collaborationRoutes = require('./routes/collaboration');
const authRoutes = require('./routes/auth');
const trainingRoutes = require('./routes/training');
const satelliteRoutes = require('./routes/satellite');
const quantumRoutes = require('./routes/quantum');
const federatedLearningRoutes = require('./routes/federated_learning');
const enhancedFederatedLearningRoutes = require('./routes/enhanced_federated_learning');
const blockchainRoutes = require('./routes/blockchain');
const securityRoutes = require('./routes/security');
const qiime2Routes = require('./routes/qiime2');
const bioNeMoRoutes = require('./routes/bionemo');
const caseStudiesRoutes = require('./routes/case_studies');
const costAnalysisRoutes = require('./routes/cost_analysis');
const benchmarkingRoutes = require('./routes/benchmarking');
const parabricksRoutes = require('./routes/parabricks');
const mambaDNARoutes = require('./routes/mamba_dna');
const policySimulationRoutes = require('./routes/policy_simulation');
const metaAnalysisRoutes = require('./routes/meta_analysis');
const climateIntegrationRoutes = require('./routes/climate_integration');
const economicModelingRoutes = require('./routes/economic_modeling');
const globalMonitoringRoutes = require('./routes/global_monitoring');
const indianSpeciesRoutes = require('./routes/indian_species');

app.use('/api/analysis', analysisRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/federated-learning', federatedLearningRoutes);
app.use('/api/enhanced-fl', enhancedFederatedLearningRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/qiime2', qiime2Routes);
app.use('/api/bionemo', bioNeMoRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/cost-analysis', costAnalysisRoutes);
app.use('/api/benchmarking', benchmarkingRoutes);
app.use('/api/parabricks', parabricksRoutes);
app.use('/api/mamba-dna', mambaDNARoutes);
app.use('/api/policy-simulation', policySimulationRoutes);
app.use('/api/meta-analysis', metaAnalysisRoutes);
app.use('/api/climate-integration', climateIntegrationRoutes);
app.use('/api/economic-modeling', economicModelingRoutes);
app.use('/api/global-monitoring', globalMonitoringRoutes);
app.use('/api/indian-species', indianSpeciesRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a collaboration room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });
  
  // Handle live annotations
  socket.on('create-annotation', (data) => {
    socket.to(data.roomId).emit('annotation-created', {
      id: data.id,
      userId: socket.id,
      position: data.position,
      content: data.content,
      timestamp: new Date()
    });
  });
  
  // Handle voting on species identification
  socket.on('submit-vote', (data) => {
    socket.to(data.roomId).emit('vote-submitted', {
      userId: socket.id,
      sequenceId: data.sequenceId,
      vote: data.vote,
      confidence: data.confidence,
      timestamp: new Date()
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    console.log('Chat message received:', data);
    socket.to(data.roomId).emit('chat-message', {
      id: data.id,
      userId: data.userId,
      username: data.username,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString()
    });
  });

  // Handle user joining chat
  socket.on('user-joined-chat', (data) => {
    console.log('User joined chat:', data);
    socket.to(data.roomId).emit('user-joined-chat', {
      userId: data.userId,
      username: data.username,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
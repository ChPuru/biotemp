# Enhanced BioMapper Setup Guide
## Manual Installation and Configuration

This guide provides step-by-step instructions for setting up the enhanced BioMapper system with all advanced features.

## Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **Python**: Version 3.8 or higher
- **MongoDB**: Version 4.4 or higher
- **Redis**: Version 6.0 or higher
- **Git**: Latest version
- **npm**: Latest version (comes with Node.js)

### Optional Dependencies
- **Ollama**: For local AI model inference
- **Docker**: For containerized deployment
- **Cloudflare account**: For tunnel setup

## 1. Project Setup

### Clone and Navigate
```bash
git clone <repository-url>
cd biomapper-lite-project
```

### Directory Structure
```
biomapper-lite-project/
├── backend/                 # Node.js backend server
├── frontend/               # React frontend application
├── python_engine/          # Python AI/ML services
├── docker/                 # Docker configurations
└── docs/                   # Documentation
```

## 2. Backend Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Install Python Dependencies
```bash
pip install numpy pandas scikit-learn tensorflow torch transformers
pip install biopython qiime2 ollama-api pymongo redis motor
pip install qiskit plotly dash streamlit aiofiles
```

### Environment Configuration
1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `backend/.env` with your configuration:
```env
# Server Configuration
PORT=5001
NODE_ENV=development
HOST=localhost

# Database Configuration
MONGO_URI=mongodb://localhost:27017/biomapper
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=24h

# Ollama Configuration
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M

# Feature Flags
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_REAL_TIME_COLLABORATION=true
ENABLE_ADAPTIVE_MODEL_SELECTION=true
ENABLE_PREDICTIVE_CACHING=true
ENABLE_PERFORMANCE_MONITORING=true
```

### Start MongoDB and Redis
**Option A: Using Docker**
```bash
# MongoDB
docker run -d --name biomapper-mongo \
  -p 27017:27017 \
  -v $(pwd)/docker/volumes/mongo:/data/db \
  mongo:latest

# Redis
docker run -d --name biomapper-redis \
  -p 6379:6379 \
  -v $(pwd)/docker/volumes/redis:/data \
  redis:latest
```

**Option B: Local Installation**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Install Redis from https://redis.io/download
- Start both services

## 3. Frontend Setup

### Install Dependencies
```bash
cd ../frontend
npm install
```

### Install Additional Packages
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-router-dom react-i18next socket.io-client axios
npm install recharts plotly.js d3 three @react-three/fiber @react-three/drei
npm install leaflet react-leaflet react-pdf jspdf html2canvas
```

### Environment Configuration
1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
REACT_APP_OLLAMA_URL=http://localhost:11434
```

## 4. Python Engine Setup

### Install Dependencies
```bash
cd ../python_engine
pip install -r requirements.txt
```

### Additional Python Packages
```bash
pip install numpy pandas scikit-learn tensorflow torch transformers
pip install biopython qiime2 q2-types q2-feature-table q2-diversity
pip install ollama-api huggingface-hub qiskit qiskit-aer
pip install pymongo redis motor aiofiles plotly dash
```

## 5. Ollama Setup (Optional)

### Install Ollama
1. Download from: https://ollama.ai/download
2. Install and start Ollama service

### Pull Required Models
```bash
ollama pull llama3:8b-instruct-q4_K_M
ollama pull codellama:7b-code
ollama pull mistral:7b-instruct
```

### Verify Installation
```bash
ollama list
ollama serve
```

## 6. Database Initialization

### MongoDB Setup
```javascript
// Connect to MongoDB and create collections
use biomapper

// Create collections
db.createCollection("users")
db.createCollection("analyses")
db.createCollection("annotations")
db.createCollection("training_data")
db.createCollection("performance_metrics")
db.createCollection("cache_entries")

// Create indexes
db.analyses.createIndex({ "userId": 1, "timestamp": -1 })
db.training_data.createIndex({ "species": 1, "confidence": -1 })
db.cache_entries.createIndex({ "key": 1 }, { unique: true })
```

### Redis Configuration
Redis will be automatically configured when the backend starts. No manual setup required.

## 7. Service Startup

### Start Backend Server
```bash
cd backend
npm start
```
The backend will start on http://localhost:5001

### Start Frontend Development Server
```bash
cd frontend
npm start
```
The frontend will start on http://localhost:3000

### Start Python Services (if needed)
```bash
cd python_engine
python api_server.py
```

## 8. Advanced Features Configuration

### Performance Monitoring
The performance monitoring service starts automatically with the backend. It will:
- Track model response times
- Monitor system resources
- Log API performance
- Generate performance reports

### Adaptive Model Selection
Configure model preferences in `backend/.env`:
```env
ADAPTIVE_SELECTION_ENABLED=true
MODEL_SELECTION_HISTORY_SIZE=1000
USER_PREFERENCE_RETENTION_DAYS=30
```

### Predictive Caching
Configure caching in `backend/.env`:
```env
PREDICTIVE_CACHE_ENABLED=true
CACHE_SIZE_LIMIT=1000
CACHE_EXPIRY_HOURS=24
PREDICTION_HISTORY_SIZE=500
```

### QIIME2-Lite Integration
```env
QIIME2_LITE_ENABLED=true
QIIME2_DATABASES_PATH=~/qiime2-databases
QIIME2_REFERENCE_DB=silva-138-99-nb-classifier.qza
```

### Microbiome Pipeline
```env
MICROBIOME_ENABLED=true
MICROBIOME_PYTHON_PATH=python3
```

## 9. Cloudflare Tunnel Setup (Optional)

### Prerequisites
1. Create a Cloudflare account
2. Get API token and Account ID

### Configuration
Add to `backend/.env`:
```env
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_TUNNEL_NAME=biomapper-tunnel
```

### Manual Tunnel Setup
```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/

# Authenticate
cloudflared auth login

# Create tunnel
cloudflared tunnel create biomapper-tunnel

# Configure tunnel
# Create cloudflare-tunnel.yml
tunnel: biomapper-tunnel
credentials-file: ./config/cloudflare-tunnel.json
ingress:
  - hostname: biomapper.yourdomain.com
    service: http://localhost:5001
  - service: http_status:404

# Start tunnel
cloudflared tunnel run biomapper-tunnel
```

## 10. Testing the Setup

### Health Checks
1. **Backend Health**: http://localhost:5001/api/health
2. **Frontend**: http://localhost:3000
3. **Database Connection**: Check backend logs
4. **AI Services**: Test Ollama at http://localhost:11434

### Basic Functionality Test
1. Open http://localhost:3000 in your browser
2. Upload a FASTA file
3. Run an analysis
4. Check results and visualizations
5. Test collaborative features
6. Verify advanced analytics

### Advanced Features Test
1. **QIIME2-Lite**: Upload microbiome data
2. **Microbiome Analysis**: Test diversity analysis
3. **Performance Monitoring**: Check metrics endpoint
4. **Adaptive Selection**: Monitor model selection
5. **Predictive Caching**: Observe cache hit rates

## 11. Troubleshooting

### Common Issues

#### Backend Won't Start
- Check Node.js version: `node --version`
- Verify MongoDB connection
- Check environment variables
- Review backend logs

#### Frontend Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check React version compatibility
- Verify environment variables

#### Database Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string in .env
- Verify MongoDB port (default: 27017)

#### AI Model Issues
- Verify Ollama installation: `ollama --version`
- Check model availability: `ollama list`
- Ensure sufficient RAM for models

#### Performance Issues
- Monitor system resources
- Check Redis connection
- Review performance logs
- Consider model optimization

### Log Locations
- Backend logs: `backend/logs/`
- Frontend logs: Browser console
- Database logs: MongoDB/Ruby logs
- Performance logs: `backend/logs/performance/`

## 12. Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in backend/.env
2. Configure production database URLs
3. Set up SSL certificates
4. Configure reverse proxy (nginx/apache)

### Process Management
```bash
# Using PM2 (recommended)
npm install -g pm2
cd backend
pm2 start server.js --name biomapper-backend
cd ../frontend
pm2 start npm --name biomapper-frontend -- start
```

### Security Checklist
- [ ] Change default JWT secrets
- [ ] Set up HTTPS
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring alerts
- [ ] Configure backup systems
- [ ] Review CORS settings

## 13. Feature Overview

### Core Features
- ✅ DNA sequence analysis
- ✅ Species classification
- ✅ Biodiversity metrics
- ✅ Geographic mapping
- ✅ Real-time collaboration

### Advanced Features
- ✅ QIIME2-Lite integration
- ✅ Microbiome analysis pipeline
- ✅ Performance monitoring
- ✅ Adaptive model selection
- ✅ Predictive caching
- ✅ Enhanced XAI analysis
- ✅ Quantum computing integration
- ✅ Federated learning
- ✅ Protein structure prediction

### AI/ML Features
- ✅ Multiple model support (HyenaDNA, Evo2, Mamba-DNA)
- ✅ Ensemble analysis
- ✅ Training data integration
- ✅ Model performance tracking
- ✅ Automated model selection

## 14. API Documentation

### Main Endpoints
- `POST /api/analysis/analyze` - Core DNA analysis
- `POST /api/qiime2-lite/analyze` - QIIME2 microbiome analysis
- `POST /api/microbiome/analyze` - Advanced microbiome analysis
- `GET /api/performance/report` - Performance metrics
- `POST /api/adaptive/select-models` - Model selection
- `POST /api/cache/get` - Cached results

### WebSocket Events
- `user-joined` - User joined session
- `annotation-created` - New annotation added
- `chat-message` - Real-time chat messages

## 15. Support and Resources

### Documentation
- API Documentation: `/api/docs`
- User Guide: `docs/user-guide.md`
- Developer Guide: `docs/developer-guide.md`

### Community Support
- GitHub Issues: Report bugs and request features
- Discussion Forum: Community support
- Email Support: support@biomapper.com

### Performance Optimization
- Monitor system resources regularly
- Use appropriate model sizes for your hardware
- Implement caching for frequently accessed data
- Consider horizontal scaling for high traffic

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../python_engine && pip install -r requirements.txt

# 2. Start databases
# MongoDB and Redis should be running

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration

# 4. Start services
cd backend && npm start &
cd ../frontend && npm start &
cd ../python_engine && python api_server.py &

# 5. Open browser
# http://localhost:3000
```

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Python        │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Engine        │
│                 │    │                 │    │   (AI/ML)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   Redis Cache   │    │   Ollama AI     │
│   (Data)        │    │   (Sessions)    │    │   (Models)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

This setup provides a complete, production-ready BioMapper system with advanced AI/ML capabilities, real-time collaboration, and comprehensive performance monitoring.
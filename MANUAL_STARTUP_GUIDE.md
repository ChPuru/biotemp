# BioMapper Platform - Manual Startup Guide

## 🚀 Complete Manual Setup Instructions

This guide provides step-by-step manual instructions to start all BioMapper services without relying on automated scripts.

---

## 📋 Prerequisites Check

### Required Software
1. **Node.js** (v16 or higher)
   ```bash
   node --version
   npm --version
   ```

2. **Python** (v3.8 or higher)
   ```bash
   python --version
   pip --version
   ```

3. **MongoDB** (Local or Atlas)
   - Local: Download from https://www.mongodb.com/try/download/community
   - Atlas: Create account at https://www.mongodb.com/atlas

### Optional Software (for advanced features)
4. **Docker** (for Parabricks)
   ```bash
   docker --version
   ```

5. **Conda** (for QIIME2)
   ```bash
   conda --version
   ```

---

## 🔧 Step 1: Environment Configuration

### Backend Environment (.env)
Create `backend/.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/biomapper
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/biomapper

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# API Keys (Optional - platform works without these)
MAPBOX_ACCESS_TOKEN=your_mapbox_token
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_key
NVIDIA_API_KEY=your_nvidia_api_key
IUCN_API_TOKEN=your_iucn_token

# Security
ENCRYPTION_KEY=your_32_character_encryption_key_here
SECURITY_LOG_PATH=./logs/security.log

# QIIME2 (if using)
QIIME2_CONDA_ENV=qiime2-2023.5

# Parabricks (if using)
PARABRICKS_DOCKER_IMAGE=nvcr.io/nvidia/clara/clara-parabricks:4.0.1

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Frontend Environment (.env)
Create `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
GENERATE_SOURCEMAP=false
```

---

## 🔧 Step 2: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install
```

**If npm install fails, try:**
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

**If npm install fails, try:**
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Python Dependencies
```bash
cd python_engine
pip install -r requirements.txt
```

**If pip install fails, try:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

**Or create virtual environment:**
```bash
python -m venv biomapper_env
# Windows:
biomapper_env\Scripts\activate
# Linux/Mac:
source biomapper_env/bin/activate
pip install -r requirements.txt
```

---

## 🔧 Step 3: Database Setup

### Option A: Local MongoDB
1. **Install MongoDB Community Edition**
2. **Start MongoDB service:**
   ```bash
   # Windows (as Administrator):
   net start MongoDB
   
   # Linux:
   sudo systemctl start mongod
   
   # macOS:
   brew services start mongodb/brew/mongodb-community
   ```

3. **Verify MongoDB is running:**
   ```bash
   mongo --eval "db.adminCommand('ismaster')"
   ```

### Option B: MongoDB Atlas (Cloud)
1. **Create account** at https://www.mongodb.com/atlas
2. **Create cluster** (free tier available)
3. **Get connection string** and update `MONGODB_URI` in backend/.env
4. **Whitelist your IP** in Atlas security settings

---

## 🚀 Step 4: Start Services (Manual Order)

### Terminal 1: Start Python AI Engine
```bash
cd python_engine
python main_ensemble.py
```

**Expected output:**
```
🤖 BioMapper AI Engine Starting...
🔄 Loading AI models...
✅ Nucleotide Transformer loaded
✅ Evo/HyenaDNA model loaded
✅ Local BLAST database ready
🌐 Server running on http://localhost:8000
```

**If it fails:**
- Check Python version: `python --version`
- Install missing packages: `pip install torch transformers flask`
- Try: `python -m flask run --host=0.0.0.0 --port=8000`

### Terminal 2: Start Backend Server
```bash
cd backend
npm start
```

**Expected output:**
```
🚀 BioMapper Backend Server Starting...
📊 Connected to MongoDB
🔐 JWT authentication enabled
🌐 Server running on http://localhost:5000
🔌 Socket.IO enabled
✅ All routes loaded successfully
```

**If it fails:**
- Check Node.js version: `node --version`
- Try: `node server.js`
- Check MongoDB connection in logs
- Verify .env file exists and has correct MONGODB_URI

### Terminal 3: Start Frontend Development Server
```bash
cd frontend
npm start
```

**Expected output:**
```
🎨 BioMapper Frontend Starting...
📦 Webpack compiled successfully
🌐 Local server: http://localhost:3000
🔄 Live reload enabled
✅ Ready for development
```

**If it fails:**
- Try: `npm run build` then serve build folder
- Check for port conflicts: `netstat -ano | findstr :3000`
- Clear npm cache: `npm cache clean --force`

---

## 🔧 Step 5: Verify Services

### Check Service Health
1. **Python AI Engine:** http://localhost:8000/health
2. **Backend API:** http://localhost:5000/api/health
3. **Frontend App:** http://localhost:3000

### Test Basic Functionality
1. **Open browser:** http://localhost:3000
2. **Upload sample DNA sequence**
3. **Verify analysis results**
4. **Check advanced features tabs**

---

## 🛠️ Troubleshooting Common Issues

### Port Conflicts
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :8000

# Kill processes if needed (Windows)
taskkill /PID <process_id> /F

# Kill processes (Linux/Mac)
sudo kill -9 <process_id>
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
mongo --eval "db.runCommand({connectionStatus : 1})"

# Restart MongoDB (Windows)
net stop MongoDB
net start MongoDB

# Restart MongoDB (Linux)
sudo systemctl restart mongod
```

### Node.js Module Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use yarn instead
npm install -g yarn
yarn install
```

### Python Package Issues
```bash
# Upgrade pip and reinstall
python -m pip install --upgrade pip
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Use conda instead
conda create -n biomapper python=3.9
conda activate biomapper
pip install -r requirements.txt
```

---

## 🔧 Optional Advanced Features Setup

### QIIME2 Integration
```bash
# Install Miniconda first
# Then create QIIME2 environment
conda create -n qiime2-2023.5 -c qiime2 -c bioconda -c conda-forge qiime2=2023.5
conda activate qiime2-2023.5
```

### Docker for Parabricks
```bash
# Pull Parabricks image
docker pull nvcr.io/nvidia/clara/clara-parabricks:4.0.1

# Verify GPU access (if available)
nvidia-smi
docker run --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### NVIDIA BioNeMo Setup
1. **Get NVIDIA API key** from https://build.nvidia.com/
2. **Add to backend/.env:** `NVIDIA_API_KEY=your_key_here`
3. **Test connection:** Check logs for BioNeMo service initialization

---

## 📊 Service Monitoring

### Check Service Status
```bash
# Backend health
curl http://localhost:5000/api/health

# Python AI health
curl http://localhost:8000/health

# Frontend (browser)
# Navigate to http://localhost:3000
```

### View Logs
```bash
# Backend logs (in backend terminal)
# Python logs (in python_engine terminal)
# Frontend logs (in frontend terminal)

# Or check log files
tail -f backend/logs/app.log
tail -f python_engine/logs/ai_engine.log
```

---

## 🚀 Production Deployment Notes

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://production-cluster
API_RATE_LIMIT=1000
CORS_ORIGIN=https://yourdomain.com
```

### Build for Production
```bash
# Frontend production build
cd frontend
npm run build

# Serve with static server
npm install -g serve
serve -s build -l 3000
```

### Process Management (Linux/Mac)
```bash
# Use PM2 for process management
npm install -g pm2

# Start services with PM2
pm2 start backend/server.js --name "biomapper-backend"
pm2 start python_engine/main_ensemble.py --name "biomapper-ai" --interpreter python3
pm2 startup
pm2 save
```

---

## 📞 Support & Debugging

### Common Error Messages & Solutions

**"EADDRINUSE: address already in use"**
- Solution: Kill process using the port or change port number

**"Cannot connect to MongoDB"**
- Solution: Check MongoDB service status and connection string

**"Module not found"**
- Solution: Run `npm install` or `pip install -r requirements.txt`

**"CORS error"**
- Solution: Check CORS_ORIGIN in backend/.env matches frontend URL

**"GPU not available"**
- Solution: Parabricks features will use CPU fallback (slower but functional)

### Getting Help
1. **Check console logs** in browser developer tools
2. **Check terminal outputs** for error messages
3. **Verify environment variables** are set correctly
4. **Test individual services** before running together

---

This manual setup ensures you have full control over each service and can troubleshoot issues step by step. The platform is designed to work even if some advanced features (QIIME2, Parabricks, external APIs) are not available.

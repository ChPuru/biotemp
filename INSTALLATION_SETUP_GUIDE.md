# 🚀 BioMapper Complete Installation & Setup Guide

## 📋 **System Requirements**

### **Operating System**
- ✅ Windows 10/11 (Current)
- ✅ macOS 10.15+
- ✅ Ubuntu 18.04+

### **Hardware Requirements**
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **CPU**: Multi-core processor (4+ cores recommended)
- **GPU**: Optional (CUDA-compatible for AI acceleration)

---

## 📦 **Required Software Installation**

### **1. Node.js & npm**
```bash
# Download from: https://nodejs.org/
# Install LTS version (18.x or 20.x)

# Verify installation
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 8.x.x or higher
```

### **2. Python 3.11+**
```bash
# Download from: https://python.org/downloads/
# ✅ You already have Python 3.11 installed

# Verify installation
python --version  # or py --version on Windows
pip --version
```

### **3. Git**
```bash
# Download from: https://git-scm.com/
# Verify installation
git --version
```

### **4. MongoDB**
**Option A: Local Installation**
```bash
# Download from: https://www.mongodb.com/try/download/community
# Install MongoDB Community Server
# Start service: mongod
```

**Option B: MongoDB Atlas (Recommended)**
```bash
# Sign up at: https://www.mongodb.com/atlas
# Create free cluster
# Get connection string
```

### **5. Docker (Optional)**
```bash
# Download from: https://docker.com/get-started
# For containerized deployment
docker --version
docker-compose --version
```

---

## 🛠️ **BioMapper Installation Steps**

### **Step 1: Clone Repository**
```bash
# If you don't have the code yet
git clone https://github.com/your-username/biomapper-lite-project.git
cd biomapper-lite-project
```

### **Step 2: Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Install additional packages if needed
npm install express mongoose cors helmet bcryptjs jsonwebtoken
npm install multer axios node-cron winston dotenv stripe
npm install @tensorflow/tfjs-node socket.io nodemailer

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
notepad .env  # Windows
# nano .env   # Linux/Mac
```

### **Step 3: Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Install additional packages if needed
npm install @types/react @types/node typescript
npm install axios react-router-dom @mui/material @emotion/react
npm install mapbox-gl react-map-gl recharts d3
npm install @stripe/stripe-js socket.io-client

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
notepad .env  # Windows
```

### **Step 4: Python Engine Setup**
```bash
cd ../python_engine

# Create virtual environment (recommended)
python -m venv biomapper_env

# Activate virtual environment
# Windows:
biomapper_env\Scripts\activate
# Linux/Mac:
source biomapper_env/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# If requirements.txt doesn't exist, install manually:
pip install numpy pandas scikit-learn biopython
pip install tensorflow torch transformers
pip install fastapi uvicorn websockets
pip install sqlite3 joblib requests beautifulsoup4
pip install matplotlib seaborn plotly
```

---

## 🔧 **External Services Setup**

### **1. Database Setup**

**MongoDB Atlas (Recommended):**
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create new cluster
4. Create database user
5. Whitelist IP address (0.0.0.0/0 for development)
6. Get connection string
7. Add to `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biomapper
```

**Local MongoDB:**
```bash
# Start MongoDB service
# Windows: Start MongoDB service from Services
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community

# Add to backend/.env:
MONGODB_URI=mongodb://localhost:27017/biomapper
```

### **2. Essential API Keys**

**Mapbox (Required for Maps):**
1. Go to https://www.mapbox.com/
2. Create account
3. Generate access token
4. Add to `frontend/.env`:
```env
REACT_APP_MAPBOX_TOKEN=pk.eyJ1...your_token_here
```

**Google OAuth (For User Login):**
1. Go to https://console.developers.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

### **3. Optional Services**

**OpenAI API (Advanced AI Features):**
```env
OPENAI_API_KEY=sk-proj-...your_key_here
```

**AWS S3 (File Storage):**
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=biomapper-storage
```

---

## 🚀 **Running the Application**

### **Method 1: Manual Start (Recommended for Development)**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should start on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Should start on http://localhost:3000
```

**Terminal 3 - Python Services (Optional):**
```bash
cd python_engine
python main_ensemble.py
# Should start on http://localhost:8001
```

### **Method 2: Docker (Production)**
```bash
# Build and run all services
docker-compose up --build

# Or run in background
docker-compose up -d
```

### **Method 3: Start Script (After Fixing)**
```bash
# Once start_services.py is fixed
python start_services.py
```

---

## 📁 **Project Structure**
```
biomapper-lite-project/
├── backend/                 # Node.js Express server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Auth, validation
│   └── server.js           # Main server file
├── frontend/               # React TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── public/             # Static files
├── python_engine/          # AI/ML services
│   ├── core/               # Core algorithms
│   ├── models/             # ML models
│   └── main_ensemble.py    # Main Python service
└── docs/                   # Documentation
```

---

## 🔍 **Verification & Testing**

### **1. Check Backend**
```bash
# Test API endpoint
curl http://localhost:5000/api/health
# Should return: {"status": "OK", "timestamp": "..."}
```

### **2. Check Frontend**
```bash
# Open browser
http://localhost:3000
# Should show BioMapper dashboard
```

### **3. Check Database Connection**
```bash
# In backend directory
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biomapper');
mongoose.connection.on('connected', () => console.log('✅ Database connected'));
mongoose.connection.on('error', (err) => console.log('❌ Database error:', err));
"
```

### **4. Check Python Services**
```bash
# Test Python API
curl http://localhost:8001/health
# Should return: {"status": "healthy"}
```

---

## 🐛 **Common Issues & Solutions**

### **Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5000
npx kill-port 5000

# Or find and kill manually
netstat -ano | findstr :3000  # Windows
lsof -ti:3000 | xargs kill    # Mac/Linux
```

### **Node Modules Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Python Dependencies Issues**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with specific versions
pip install numpy==1.24.3 pandas==2.0.3

# Use conda instead of pip
conda install numpy pandas scikit-learn
```

### **MongoDB Connection Issues**
```bash
# Check MongoDB service status
# Windows: services.msc -> MongoDB
# Linux: sudo systemctl status mongod
# Mac: brew services list | grep mongodb

# Test connection
mongosh "mongodb://localhost:27017/biomapper"
```

---

## 📊 **Performance Optimization**

### **Development Mode**
```bash
# Use development builds
NODE_ENV=development npm start

# Enable hot reloading
REACT_APP_DEBUG_MODE=true npm start
```

### **Production Mode**
```bash
# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3000
```

---

## 🔐 **Security Considerations**

### **Environment Variables**
- Never commit `.env` files to version control
- Use different keys for development/production
- Rotate API keys regularly

### **Database Security**
- Use strong passwords
- Enable authentication
- Restrict network access
- Regular backups

### **API Security**
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs
- Monitor for suspicious activity

---

## 📚 **Additional Resources**

### **Documentation**
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Python Documentation](https://docs.python.org/)

### **Tutorials**
- [MERN Stack Tutorial](https://www.mongodb.com/mern-stack)
- [TypeScript React Tutorial](https://react-typescript-cheatsheet.netlify.app/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)

### **Community**
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Discussions](https://github.com/discussions)
- [Discord/Slack Communities](https://discord.com/)

---

## 🆘 **Getting Help**

### **Error Logs**
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# Open browser DevTools -> Console

# Python logs
tail -f python_engine/logs/service.log
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm start

# Python debug mode
python -u main_ensemble.py --debug
```

### **Support Channels**
- Create GitHub Issues for bugs
- Check existing documentation
- Search Stack Overflow
- Contact development team

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Tested On**: Windows 11, Node.js 20.x, Python 3.11

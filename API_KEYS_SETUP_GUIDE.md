# 🔑 BioMapper API Keys & External Services Setup Guide

## 📋 **Complete List of Required API Keys & Tokens**

### **🌍 Geolocation & Mapping Services**

#### 1. **Mapbox API** (Currently Used)
- **Purpose**: Interactive maps, satellite imagery, geocoding
- **Where to get**: https://www.mapbox.com/
- **Setup**:
  1. Create account at mapbox.com
  2. Go to Account → Access Tokens
  3. Create new token with these scopes:
     - `styles:read`
     - `fonts:read` 
     - `datasets:read`
     - `geocoding`
- **Add to**: `frontend/src/components/MapComponent.tsx`
- **Current placeholder**: `pk.eyJ1IjoiYmlvbWFwcGVyIiwiYSI6ImNrOXh5...` (replace this)

#### 2. **OpenStreetMap Nominatim** (Free - No Key Required)
- **Purpose**: Reverse geocoding, location names
- **Status**: ✅ Already implemented with fallbacks
- **No setup required**

#### 3. **ISRO Bhuvan API** (Optional - India Specific)
- **Purpose**: Indian satellite imagery, terrain data
- **Where to get**: https://bhuvan.nrsc.gov.in/
- **Setup**: Contact ISRO for API access
- **Status**: ⚠️ Currently has fallback implementation

---

### **🧬 Biodiversity & Species Data**

#### 4. **IUCN Red List API** (Free)
- **Purpose**: Species conservation status
- **Where to get**: https://apiv3.iucnredlist.org/
- **Setup**:
  1. Register at iucnredlist.org
  2. Request API token via email
  3. Add to backend environment
- **Add to**: `backend/.env`
```env
IUCN_API_TOKEN=your_token_here
```

#### 5. **GBIF API** (Free - No Key Required)
- **Purpose**: Species occurrence data, taxonomy
- **Where to get**: https://www.gbif.org/developer
- **Status**: ✅ No authentication required
- **Already implemented**: Backend uses GBIF for species data

#### 6. **Encyclopedia of Life (EOL) API** (Free)
- **Purpose**: Species information, images
- **Where to get**: https://eol.org/docs/what-is-eol/data-services
- **Status**: ⚠️ Not yet implemented
- **Setup**: No key required, just HTTP requests

---

### **🤖 AI & Machine Learning Services**

#### 7. **OpenAI API** (Paid)
- **Purpose**: Advanced species identification, NLP
- **Where to get**: https://platform.openai.com/
- **Setup**:
  1. Create account at platform.openai.com
  2. Add payment method
  3. Generate API key
- **Add to**: `backend/.env`
```env
OPENAI_API_KEY=sk-proj-...your_key_here
```
- **Cost**: ~$0.002 per 1K tokens (GPT-4)

#### 8. **Hugging Face API** (Free Tier Available)
- **Purpose**: Transformer models, embeddings
- **Where to get**: https://huggingface.co/
- **Setup**:
  1. Create account
  2. Go to Settings → Access Tokens
  3. Create new token
- **Add to**: `backend/.env`
```env
HUGGINGFACE_API_KEY=hf_...your_key_here
```

#### 9. **Ollama** (Free - Local Installation)
- **Purpose**: Local LLM inference
- **Where to get**: https://ollama.ai/
- **Setup**:
  1. Download and install Ollama
  2. Run: `ollama serve`
  3. Pull models: `ollama pull llama3:8b-instruct-q4_K_M`
- **Status**: ✅ Already configured with fallbacks

---

### **☁️ Cloud & Database Services**

#### 10. **MongoDB Atlas** (Free Tier Available)
- **Purpose**: Main database for user data, annotations
- **Where to get**: https://www.mongodb.com/atlas
- **Setup**:
  1. Create cluster
  2. Create database user
  3. Get connection string
- **Add to**: `backend/.env`
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biomapper
```

#### 11. **AWS S3** (Free Tier Available)
- **Purpose**: File storage for images, sequences
- **Where to get**: https://aws.amazon.com/s3/
- **Setup**:
  1. Create AWS account
  2. Create S3 bucket
  3. Create IAM user with S3 permissions
- **Add to**: `backend/.env`
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=biomapper-storage
AWS_REGION=us-east-1
```

---

### **🔐 Authentication & Security**

#### 12. **JWT Secret** (Generate Yourself)
- **Purpose**: User authentication tokens
- **Setup**: Generate random 256-bit key
- **Add to**: `backend/.env`
```env
JWT_SECRET=your_super_secret_256_bit_key_here
```

#### 13. **Google OAuth** (Free)
- **Purpose**: Social login
- **Where to get**: https://console.developers.google.com/
- **Setup**:
  1. Create project
  2. Enable Google+ API
  3. Create OAuth 2.0 credentials
- **Add to**: `backend/.env`
```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

---

### **💳 Payment Processing**

#### 14. **Stripe API** (Transaction Fees Apply)
- **Purpose**: Payment processing for premium features
- **Where to get**: https://stripe.com/
- **Setup**:
  1. Create Stripe account
  2. Get API keys from dashboard
- **Add to**: `backend/.env`
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### **📧 Communication Services**

#### 15. **SendGrid API** (Free Tier Available)
- **Purpose**: Email notifications, reports
- **Where to get**: https://sendgrid.com/
- **Setup**:
  1. Create account
  2. Verify sender identity
  3. Generate API key
- **Add to**: `backend/.env`
```env
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@biomapper.com
```

---

## 🛠️ **Environment Configuration Files**

### **Backend Environment** (`backend/.env`)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biomapper
DB_NAME=biomapper_production

# Authentication
JWT_SECRET=your_super_secret_256_bit_key_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# External APIs
IUCN_API_TOKEN=your_iucn_token
OPENAI_API_KEY=sk-proj-...
HUGGINGFACE_API_KEY=hf_...

# Cloud Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=biomapper-storage
AWS_REGION=us-east-1

# Payment
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@biomapper.com

# Server Config
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

### **Frontend Environment** (`frontend/.env`)
```env
# API Endpoints
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# Map Services
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoiYmlvbWFwcGVyIiwiYSI6ImNrOXh5...

# Authentication
REACT_APP_GOOGLE_CLIENT_ID=...apps.googleusercontent.com

# Payment
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Feature Flags
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_QUANTUM_FEATURES=false
REACT_APP_DEBUG_MODE=false
```

---

## 🚀 **Quick Setup Commands**

### **1. Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install

# Python Engine
cd python_engine
pip install -r requirements.txt
```

### **2. Setup Environment Files**
```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your actual keys
nano backend/.env
nano frontend/.env
```

### **3. Initialize Services**
```bash
# Start MongoDB (if local)
mongod

# Start Ollama
ollama serve
ollama pull llama3:8b-instruct-q4_K_M

# Start BioMapper services
python start_services.py
```

---

## 💰 **Cost Estimates (Monthly)**

| Service | Free Tier | Paid Plans | Estimated Cost |
|---------|-----------|------------|----------------|
| **Mapbox** | 50K requests | $5/50K requests | $0-20/month |
| **OpenAI API** | $5 credit | $0.002/1K tokens | $10-50/month |
| **MongoDB Atlas** | 512MB | $9/month | $0-9/month |
| **AWS S3** | 5GB | $0.023/GB | $0-5/month |
| **Stripe** | Free | 2.9% + 30¢/transaction | Transaction fees |
| **SendGrid** | 100 emails/day | $14.95/month | $0-15/month |
| **Total Estimated** | | | **$20-100/month** |

---

## ⚠️ **Security Best Practices**

1. **Never commit API keys to version control**
2. **Use environment variables for all secrets**
3. **Rotate keys regularly (quarterly)**
4. **Use least-privilege access for cloud services**
5. **Enable API rate limiting and monitoring**
6. **Use HTTPS for all external API calls**

---

## 🔧 **Testing & Development**

### **Test API Connections**
```bash
# Test MongoDB connection
node backend/scripts/test-db.js

# Test external APIs
node backend/scripts/test-apis.js

# Test Python services
python python_engine/test_services.py
```

### **Development vs Production**
- **Development**: Use test/sandbox keys
- **Production**: Use live keys with proper monitoring
- **Staging**: Separate environment with limited quotas

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **API Rate Limits**: Implement caching and request queuing
2. **Network Timeouts**: Add retry logic with exponential backoff
3. **Key Expiration**: Set up monitoring and alerts
4. **CORS Issues**: Configure proper origins in API settings

### **Monitoring Setup**
- Set up alerts for API failures
- Monitor usage quotas
- Track response times
- Log all external API calls

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Contact**: biomapper-support@example.com

// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'biomapper-secret-key-change-in-production';

// Generate JWT token for demo purposes
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role, iat: Date.now() },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Role-based authorization middleware
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: `Access denied. ${requiredRole} role required.`,
                currentRole: req.user.role 
            });
        }
        
        next();
    };
};

// Demo authentication endpoint (for testing purposes)
const authenticateDemo = (req, res) => {
    const { role } = req.body;
    
    if (!role || !['researcher', 'scientist', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role required (researcher, scientist, admin)' });
    }
    
    const demoUserId = `demo-${role}-${Date.now()}`;
    const token = generateToken(demoUserId, role);
    
    res.json({
        success: true,
        token,
        user: {
            id: demoUserId,
            role,
            name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`
        },
        expiresIn: '24h'
    });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove potential script tags and dangerous characters
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/[<>'"]/g, '')
                     .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };
    
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    
    next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }
    
    const file = req.file;
    
    // Validate file extension
    const allowedExtensions = ['.fasta', '.fa', '.fas'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: 'Only FASTA files (.fasta, .fa, .fas) are allowed' });
    }
    
    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be less than 20MB' });
    }
    
    // Basic content validation - check if it looks like a FASTA file
    const fs = require('fs');
    try {
        const content = fs.readFileSync(file.path, 'utf8');
        if (!content.startsWith('>')) {
            return res.status(400).json({ error: 'Invalid FASTA format. File must start with ">"' });
        }
    } catch (error) {
        return res.status(400).json({ error: 'Unable to read uploaded file' });
    }
    
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    requireRole,
    authenticateDemo,
    sanitizeInput,
    validateFileUpload
};

// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');

// Demo login endpoint for testing
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Demo users for testing
    const demoUsers = {
      'scientist': { id: 'scientist-123', role: 'scientist', name: 'Dr. Marine Biologist' },
      'admin': { id: 'admin-456', role: 'admin', name: 'System Administrator' }
    };
    
    const user = demoUsers[username];
    
    if (user && password === 'demo123') {
      const token = generateToken(user.id, user.role);
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          role: user.role,
          name: user.name
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'biomapper-secret-key-change-in-production';
    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      user: {
        id: decoded.userId,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;

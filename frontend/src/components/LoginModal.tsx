import React, { useState } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string, user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.token, response.data.user);
        onClose();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>🔬 BioMapper Login</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="demo-info">
            <p><strong>Demo Credentials:</strong></p>
            <p>👨‍🔬 Scientist: <code>scientist</code> / <code>demo123</code></p>
            <p>👨‍💼 Admin: <code>admin</code> / <code>demo123</code></p>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
      
      <style>{`
        .login-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        
        .login-modal {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .login-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .login-header h2 {
          margin: 0;
          color: #2c3e50;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #7f8c8d;
        }
        
        .demo-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .demo-info p {
          margin: 5px 0;
        }
        
        .demo-info code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .error-message {
          background: #fee;
          color: #c53030;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          border: 1px solid #fcc;
        }
        
        .login-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;

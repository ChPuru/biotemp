// frontend/src/App.tsx (NATIONALS VERSION)

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import AnalysisPage from './pages/AnalysisPage';
import AdminPage from './pages/AdminPage';
import MarketPage from './pages/MarketPage';
import SatellitePage from './pages/SatellitePage';
import CollaborativePage from './pages/CollaborativePage';
import QuantumSimulator from './components/QuantumSimulator';
import FederatedLearningSimulator from './components/FederatedLearningSimulator';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import LoginModal from './components/LoginModal';
import { useErrorHandler } from './hooks/useErrorHandler';
import offlineStorage from './services/offlineStorage';
import logo from './assets/logo.png';

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={isActive ? 'nav-link active' : 'nav-link'}>
            {children}
        </Link>
    );
};

function App() {
  const { t, i18n } = useTranslation();
  const { error, clearError } = useErrorHandler();
  const [showLogin, setShowLogin] = React.useState(false);
  const [user, setUser] = React.useState(null);

  // Initialize offline storage capabilities
  useEffect(() => {
    offlineStorage.initOfflineSync();
    
    // Check for existing token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogin = (token: string, userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <aside className="sidebar">
            <div className="sidebar-header">
              <img src={logo} alt="BioMapper Logo" className="sidebar-logo" />
              <span className="sidebar-title">{t('title')}</span>
            </div>
            <nav className="sidebar-nav">
              <NavLink to="/">Analysis</NavLink>
              <NavLink to="/satellite">Satellite Intelligence</NavLink>
              <NavLink to="/collaborative">Collaborative Workspace</NavLink>
              <NavLink to="/quantum">Quantum Simulator</NavLink>
              <NavLink to="/federated-learning">Federated Learning</NavLink>
              <NavLink to="/admin">Admin Panel</NavLink>
              <NavLink to="/market">Bio-Market</NavLink>
            </nav>
            <div className="sidebar-controls">
              <h3>{t('controls_header')}</h3>
              <label htmlFor="language-select">{t('language_label')}</label>
              <select 
                id="language-select" 
                className="language-selector" 
                value={i18n.language} 
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமিழ்</option>
                <option value="ml">മലയാളം</option>
                <option value="bn">বাংলা</option>
              </select>
              
              <div className="auth-section">
                {user ? (
                  <div className="user-info">
                    <p>👤 {(user as any).name}</p>
                    <p>🔑 {(user as any).role}</p>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                  </div>
                ) : (
                  <button onClick={() => setShowLogin(true)} className="login-btn">
                    🔐 Login
                  </button>
                )}
              </div>
            </div>
          </aside>
          <main className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<AnalysisPage />} />
                <Route path="/satellite" element={<SatellitePage />} />
                <Route path="/collaborative" element={<CollaborativePage />} />
                <Route path="/quantum" element={<QuantumSimulator />} />
                <Route path="/federated-learning" element={<FederatedLearningSimulator />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/market" element={<MarketPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <ErrorNotification error={error} onClose={clearError} />
          <LoginModal 
            isOpen={showLogin} 
            onClose={() => setShowLogin(false)} 
            onLogin={handleLogin} 
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
export default App;
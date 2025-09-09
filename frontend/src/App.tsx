// frontend/src/App.tsx (NATIONALS VERSION)

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.scss';
import AnalysisPage from './pages/AnalysisPage';
import AdminPage from './pages/AdminPage';
// import MarketPage from './pages/MarketPage';
import SatellitePage from './pages/SatellitePage';
import CollaborativePage from './pages/CollaborativePage';
import QuantumSimulator from './components/QuantumSimulator';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorNotification from './components/ErrorNotification';
import LoginModal from './components/LoginModal';
import { useErrorHandler } from './hooks/useErrorHandler';
import offlineStorage from './services/offlineStorage';
import logo from './assets/logo.png';
import BioluminescentBackground from './components/BioluminescentBackground';
import ToastContainer from './components/ToastContainer';

const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: string }> = ({ to, children, icon }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={isActive ? 'nav-link active' : 'nav-link'}>
            {icon && <span className="nav-icon">{icon}</span>}
            {children}
        </Link>
    );
};

function App() {
  const { t, i18n } = useTranslation();
  const { error, clearError } = useErrorHandler();
  const [showLogin, setShowLogin] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Initialize offline storage capabilities
  useEffect(() => {
    offlineStorage.initOfflineSync();
    
    // Check for existing token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    // Cleanup legacy UI attributes/preferences
    try {
      const root = document.documentElement;
      root.removeAttribute('data-high-contrast');
      root.removeAttribute('data-glow');
      localStorage.removeItem('ui.highContrast');
      localStorage.removeItem('ui.glow');
    } catch {}
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };


  return (
    <ErrorBoundary>
      <ToastContainer>
        <Router>
          <div className="App">
            <BioluminescentBackground />
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <img src={logo} alt="BioMapper Logo" className="sidebar-logo" />
              {!sidebarCollapsed && <span className="sidebar-title">{t('title')}</span>}
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
            </div>
            <nav className="sidebar-nav">
              <NavLink to="/" icon="🧬">{sidebarCollapsed ? '' : 'Analysis'}</NavLink>
              <NavLink to="/satellite" icon="🛰️">{sidebarCollapsed ? '' : 'Satellite Intelligence'}</NavLink>
              <NavLink to="/collaborative" icon="👥">{sidebarCollapsed ? '' : 'Collaborative Workspace'}</NavLink>
              <NavLink to="/quantum" icon="⚛️">{sidebarCollapsed ? '' : 'Quantum Simulator'}</NavLink>
              <NavLink to="/admin" icon="⚙️">{sidebarCollapsed ? '' : 'Admin Panel'}</NavLink>
              {/* <NavLink to="/market" icon="🛒">{sidebarCollapsed ? '' : 'Bio-Market'}</NavLink> */}
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
                <Route path="/admin" element={<AdminPage />} />
                {/* <Route path="/market" element={<MarketPage />} /> */}
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
      </ToastContainer>
    </ErrorBoundary>
  );
}
export default App;
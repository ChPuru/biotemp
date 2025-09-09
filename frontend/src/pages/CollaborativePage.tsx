// frontend/src/pages/CollaborativePage.tsx

import React, { useState, useEffect } from 'react';
import CollaborativeWorkspace from '../components/CollaborativeWorkspace';
import ProteinViewer from '../components/ProteinViewer';
import offlineStorage from '../services/offlineStorage';
import './CollaborativePage.css';

const CollaborativePage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDataset, setNewSessionDataset] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [proteinStructure, setProteinStructure] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get scientist ID from localStorage or use default
  const scientistId = localStorage.getItem('userId') ||
                     localStorage.getItem('scientistId') ||
                     `scientist-${Date.now()}`;

  // Initialize offline detection
  useEffect(() => {
    offlineStorage.initOfflineSync();
    
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        if (navigator.onLine) {
          // Online: fetch from API with authentication
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5001/api/collaboration/sessions', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setSessions(Array.isArray(data) ? data : []);
            // Also update offline storage
            if (Array.isArray(data)) {
              data.forEach((session: any) => {
                offlineStorage.saveCollaborativeSession(session);
              });
            }
          } else if (response.status === 401) {
            console.error('Authentication required for collaboration sessions');
            // Show login prompt or redirect to login
          }
        } else {
          // Offline: load from IndexedDB
          const offlineSessions = await offlineStorage.getAllCollaborativeSessions();
          setSessions(offlineSessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Fallback to offline storage on error
        const offlineSessions = await offlineStorage.getAllCollaborativeSessions();
        setSessions(offlineSessions);
      }
    };

    loadSessions();
  }, [isOffline]);

  const handleCreateSession = async () => {
    if (!newSessionName || !newSessionDataset) return;

    const newSession = {
      name: newSessionName,
      dataset: newSessionDataset,
      createdAt: Date.now(),
      status: 'active'
    };

    try {
      if (navigator.onLine) {
        // Online: create via API
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/collaboration/sessions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSession),
        });

        if (response.ok) {
          const createdSession = await response.json();
          setSessions([...sessions, createdSession]);
          setSelectedSession(createdSession.roomId);
          // Save to offline storage
          offlineStorage.saveCollaborativeSession(createdSession);
        }
      } else {
        // Offline: create locally with temporary ID
        const tempSession = {
          ...newSession,
          roomId: `temp-${Date.now()}`,
          createdBy: 'current-user', // This would normally come from auth
          participants: ['current-user'],
          lastActivity: Date.now(),
          pendingSync: true
        };
        
        await offlineStorage.saveCollaborativeSession(tempSession);
        setSessions([...sessions, tempSession]);
        setSelectedSession(tempSession.roomId);
      }

      // Reset form
      setNewSessionName('');
      setNewSessionDataset('');
      setIsCreatingSession(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleJoinSession = (roomId: string) => {
    setSelectedSession(roomId);
  };

  const handleViewProtein = (pdbId: string) => {
    setProteinStructure(pdbId);
  };

  // Load user's created sessions
  const loadMySessions = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/collaboration/sessions/my-sessions/${scientistId}`);
      if (response.ok) {
        const data = await response.json();
        setMySessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading my sessions:', error);
    }
  };

  // Load all sessions with pagination and filtering
  const loadAllSessions = async (page = 1, status = 'all') => {
    try {
      const response = await fetch(`http://localhost:5001/api/collaboration/sessions/all?page=${page}&limit=10&status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setAllSessions(data.sessions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading all sessions:', error);
    }
  };

  // Load session statistics
  const loadSessionStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/collaboration/sessions/stats');
      if (response.ok) {
        const stats = await response.json();
        setSessionStats(stats);
      }
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  // Handle showing history
  const handleShowHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      await Promise.all([
        loadMySessions(),
        loadAllSessions(),
        loadSessionStats()
      ]);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadAllSessions(page, filterStatus);
  };

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    loadAllSessions(1, status);
  };

  return (
    <div className="collaborative-page">
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Some features may be limited.
        </div>
      )}

      {!selectedSession ? (
        <div className="session-selection">
          <div className="session-header">
            <h1>Collaborative Workspace</h1>
            <button
              onClick={handleShowHistory}
              className="history-toggle-btn"
              style={{
                padding: '0.75rem 1.5rem',
                background: showHistory ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showHistory ? '📋 Hide History' : '📊 Show History'}
            </button>
          </div>

          {showHistory && (
            <div className="session-history" style={{ marginBottom: '2rem' }}>
              {/* Session Statistics */}
              {sessionStats && (
                <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="stat-card" style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>📊 Total Sessions</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{sessionStats.totalSessions}</p>
                  </div>
                  <div className="stat-card" style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>🟢 Active</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{sessionStats.activeSessions}</p>
                  </div>
                  <div className="stat-card" style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#f57c00' }}>📁 Archived</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{sessionStats.archivedSessions}</p>
                  </div>
                  <div className="stat-card" style={{ background: '#fce4ec', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#c2185b' }}>📅 Recent (7d)</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{sessionStats.recentSessions}</p>
                  </div>
                </div>
              )}

              {/* My Sessions */}
              <div className="my-sessions" style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #007bff', paddingBottom: '0.5rem' }}>📝 My Created Sessions</h2>
                {mySessions.length > 0 ? (
                  <div className="sessions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {mySessions.map((session, index) => (
                      <div key={session.roomId || session.id || `my-${index}`} className="session-card" style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '1rem', cursor: 'pointer' }} onClick={() => setSelectedSession(session.roomId)}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{session.name}</h4>
                        <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>📊 Dataset: {session.dataset}</p>
                        <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>👥 Participants: {session.participants?.length || 0}</p>
                        <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>📅 Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                        <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>🔴 Status: {session.status}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>You haven't created any sessions yet. Create your first session! 🚀</p>
                )}
              </div>

              {/* All Sessions with Filters */}
              <div className="all-sessions">
                <div className="all-sessions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #28a745', paddingBottom: '0.5rem', margin: 0 }}>🌍 All Sessions</h2>
                  <select
                    value={filterStatus}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    aria-label="Filter sessions by status"
                    title="Filter sessions by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="archived">Archived Only</option>
                  </select>
                </div>

                {allSessions.length > 0 ? (
                  <>
                    <div className="sessions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      {allSessions.map((session, index) => (
                        <div key={session.roomId || session.id || `all-${index}`} className="session-card" style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '1rem', cursor: 'pointer' }} onClick={() => setSelectedSession(session.roomId)}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{session.name}</h4>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>👤 Created by: {session.createdBy}</p>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>📊 Dataset: {session.dataset}</p>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>👥 Participants: {session.participants?.length || 0}</p>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>📅 Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>🔴 Status: {session.status}</p>
                          <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>🕒 Last Activity: {new Date(session.lastActivity).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ padding: '0.5rem 1rem', border: '1px solid #ced4da', borderRadius: '4px', background: currentPage === 1 ? '#f8f9fa' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Previous
                      </button>
                      <span style={{ padding: '0.5rem', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{ padding: '0.5rem 1rem', border: '1px solid #ced4da', borderRadius: '4px', background: currentPage === totalPages ? '#f8f9fa' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>No sessions found with the selected filter. 📭</p>
                )}
              </div>
            </div>
          )}

          <div className="sessions-list">
            <h2>Available Sessions</h2>
            {sessions.length > 0 ? (
              <div className="sessions-grid">
                {sessions.map((session, index) => (
                  <div key={session.roomId || session.id || `session-${index}`} className="session-card" onClick={() => setSelectedSession(session.roomId)}>
                    <h4>{session.name}</h4>
                    <p>Dataset: {session.dataset}</p>
                    <p>Participants: {session.participants?.length || 0}</p>
                    <p>Status: {session.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No active sessions found.</p>
            )}
          </div>

          {isCreatingSession ? (
            <div className="create-session-form">
              <h2>Create New Session</h2>
              <div className="form-group">
                <label htmlFor="session-name">Session Name:</label>
                <input
                  id="session-name"
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter session name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="session-dataset">Dataset:</label>
                <input
                  id="session-dataset"
                  type="text"
                  value={newSessionDataset}
                  onChange={(e) => setNewSessionDataset(e.target.value)}
                  placeholder="Enter dataset ID"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleCreateSession}>Create</button>
                <button onClick={() => setIsCreatingSession(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button 
              className="create-session-button" 
              onClick={() => setIsCreatingSession(true)}
            >
              Create New Session
            </button>
          )}
        </div>
      ) : (
        <div className="active-workspace">
          <div className="workspace-header">
            <button onClick={() => setSelectedSession(null)}>← Back to Sessions</button>
            <h1>Collaborative Analysis</h1>
            {proteinStructure && (
              <button onClick={() => setProteinStructure(null)}>Close Protein View</button>
            )}
          </div>

          <div className="workspace-content">
            {proteinStructure ? (
              <div className="protein-view-container">
                <ProteinViewer pdbId={proteinStructure} />
              </div>
            ) : (
              <CollaborativeWorkspace
                sessionId={selectedSession}
                scientistId={scientistId}
                onViewProtein={handleViewProtein}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativePage;
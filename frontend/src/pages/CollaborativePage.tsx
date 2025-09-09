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

  return (
    <div className="collaborative-page">
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Some features may be limited.
        </div>
      )}

      {!selectedSession ? (
        <div className="session-selection">
          <h1>Collaborative Workspace</h1>
          
          <div className="sessions-list">
            <h2>Available Sessions</h2>
            {sessions.length > 0 ? (
              <div>
                {sessions.map((session) => (
                  <div key={session.roomId || session.id} className="session-card" onClick={() => setSelectedSession(session.roomId)}>
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
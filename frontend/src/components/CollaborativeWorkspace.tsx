import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface Annotation {
  _id: string;
  sequenceId: string;
  position: {
    start: number;
    end: number;
  };
  content: string;
  createdBy: string;
  roomId: string;
  timestamp: string;
  votes: {
    scientistId: string;
    vote: 'Confirm' | 'Reject' | 'Uncertain';
    confidence: number;
    timestamp: string;
  }[];
}

interface CollaborativeSession {
  _id: string;
  roomId: string;
  name: string;
  createdBy: string;
  dataset: string;
  participants: {
    scientistId: string;
    joinedAt: string;
    role: 'viewer' | 'editor' | 'admin';
  }[];
  status: 'active' | 'archived';
  createdAt: string;
  lastActivity: string;
}

interface CollaborativeWorkspaceProps {
  sequenceId?: string;
  sequenceData?: string;
  scientistId?: string;
  sessionId?: string;
  onViewProtein?: (pdbId: string) => void;
}

const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  sequenceId,
  sequenceData,
  scientistId
}) => {
  const { t } = useTranslation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [sessions, setSessions] = useState<CollaborativeSession[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);
  const [annotationContent, setAnnotationContent] = useState<string>('');
  const [participants, setParticipants] = useState<{id: string, role: string}[]>([]);
  const [showCreateSession, setShowCreateSession] = useState<boolean>(false);
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const sequenceRef = useRef<HTMLDivElement>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('user-joined', (data) => {
      console.log(`User joined: ${data.userId}`);
      // Update participants list
      setParticipants(prev => [...prev, {id: data.userId, role: 'viewer'}]);
    });
    
    socket.on('annotation-created', (data) => {
      console.log('New annotation received:', data);
      // Add new annotation to the list
      setAnnotations(prev => [...prev, data as Annotation]);
    });
    
    socket.on('vote-submitted', (data) => {
      console.log('Vote received:', data);
      // Update annotation with new vote
      setAnnotations(prev => prev.map(ann => {
        if (ann.sequenceId === data.sequenceId) {
          const updatedVotes = [...ann.votes, {
            scientistId: data.userId,
            vote: data.vote,
            confidence: data.confidence,
            timestamp: new Date().toISOString()
          }];
          return { ...ann, votes: updatedVotes };
        }
        return ann;
      }));
    });
    
    return () => {
      socket.off('user-joined');
      socket.off('annotation-created');
      socket.off('vote-submitted');
    };
  }, [socket]);
  
  // Fetch available sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/collaboration/sessions');
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load collaborative sessions');
      setLoading(false);
    }
  };
  
  // Create a new session
  const createSession = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/collaboration/sessions', {
        name: newSessionName,
        dataset: sequenceId,
        scientistId
      });
      
      const newSession = response.data.session;
      setSessions(prev => [...prev, newSession]);
      joinSession(newSession.roomId);
      setShowCreateSession(false);
      setNewSessionName('');
      setLoading(false);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create collaborative session');
      setLoading(false);
    }
  };
  
  // Join an existing session
  const joinSession = async (sessionRoomId: string) => {
    try {
      setLoading(true);
      await axios.post(`/api/collaboration/sessions/${sessionRoomId}/join`, {
        scientistId
      });
      
      setRoomId(sessionRoomId);
      
      // Join the socket room
      if (socket) {
        socket.emit('join-room', sessionRoomId);
      }
      
      // Fetch annotations for this session
      const response = await axios.get(`/api/collaboration/sessions/${sessionRoomId}/annotations`);
      setAnnotations(response.data.annotations);
      
      setLoading(false);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join collaborative session');
      setLoading(false);
    }
  };
  
  // Create a new annotation
  const createAnnotation = async () => {
    if (!selectedRegion || !annotationContent || !roomId) return;
    
    try {
      const response = await axios.post('/api/collaboration/annotations', {
        sequenceId,
        position: selectedRegion,
        content: annotationContent,
        roomId,
        scientistId
      });
      
      const newAnnotation = response.data.annotation;
      setAnnotations(prev => [...prev, newAnnotation]);
      
      // Emit to socket
      if (socket) {
        socket.emit('create-annotation', {
          id: newAnnotation._id,
          roomId,
          position: selectedRegion,
          content: annotationContent
        });
      }
      
      // Reset form
      setSelectedRegion(null);
      setAnnotationContent('');
    } catch (err) {
      console.error('Error creating annotation:', err);
      setError('Failed to create annotation');
    }
  };
  
  // Submit a vote on species identification
  const submitVote = async (annotationId: string, vote: 'Confirm' | 'Reject' | 'Uncertain', confidence: number) => {
    try {
      const response = await axios.post(`/api/collaboration/annotations/${annotationId}/vote`, {
        vote,
        confidence,
        scientistId
      });
      
      // Update local state
      const updatedAnnotation = response.data.annotation;
      setAnnotations(prev => prev.map(ann => 
        ann._id === annotationId ? updatedAnnotation : ann
      ));
      
      // Emit to socket
      if (socket) {
        socket.emit('submit-vote', {
          roomId,
          sequenceId,
          vote,
          confidence
        });
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Failed to submit vote');
    }
  };
  
  // Handle sequence selection
  const handleSequenceSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !sequenceRef.current) return;
    
    const range = selection.getRangeAt(0);
    const sequenceContent = sequenceRef.current.textContent || '';
    
    // Calculate start and end positions
    const start = sequenceContent.indexOf(range.toString());
    if (start >= 0) {
      setSelectedRegion({
        start,
        end: start + range.toString().length
      });
    }
  };
  
  // Load sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);
  
  return (
    <div className="collaborative-workspace">
      <h2>{t('Collaborative Workspace')}</h2>
      
      {/* Session Management */}
      <div className="session-management">
        <h3>{t('Sessions')}</h3>
        
        {loading ? (
          <p>{t('Loading...')}</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            {sessions.length > 0 ? (
              <ul className="session-list">
                {sessions.map(session => (
                  <li key={session._id} className={roomId === session.roomId ? 'active' : ''}>
                    <div className="session-info">
                      <h4>{session.name}</h4>
                      <p>{t('Created by')}: {session.createdBy}</p>
                      <p>{t('Participants')}: {session.participants.length}</p>
                    </div>
                    {roomId !== session.roomId && (
                      <button onClick={() => joinSession(session.roomId)}>
                        {t('Join')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('No active sessions')}</p>
            )}
            
            {showCreateSession ? (
              <div className="create-session-form">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder={t('Session name')}
                />
                <button onClick={createSession} disabled={!newSessionName}>
                  {t('Create')}
                </button>
                <button onClick={() => setShowCreateSession(false)}>
                  {t('Cancel')}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCreateSession(true)}>
                {t('Create New Session')}
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Active Session */}
      {roomId && (
        <div className="active-session">
          <h3>{t('Active Session')}: {sessions.find(s => s.roomId === roomId)?.name}</h3>
          
          {/* Participants */}
          <div className="participants">
            <h4>{t('Participants')}</h4>
            <ul>
              {participants.map(participant => (
                <li key={participant.id}>
                  {participant.id} ({participant.role})
                </li>
              ))}
            </ul>
          </div>
          
          {/* Sequence Viewer with Selection */}
          <div className="sequence-viewer">
            <h4>{t('Sequence')}</h4>
            <div 
              ref={sequenceRef} 
              className="sequence-content" 
              onMouseUp={handleSequenceSelection}
            >
              {sequenceData}
            </div>
          </div>
          
          {/* Annotation Creator */}
          {selectedRegion && (
            <div className="annotation-creator">
              <h4>{t('Create Annotation')}</h4>
              <p>
                {t('Selected region')}: {selectedRegion.start} - {selectedRegion.end}
              </p>
              <textarea
                value={annotationContent}
                onChange={(e) => setAnnotationContent(e.target.value)}
                placeholder={t('Enter annotation content')}
              />
              <div className="buttons">
                <button 
                  onClick={createAnnotation} 
                  disabled={!annotationContent}
                >
                  {t('Save Annotation')}
                </button>
                <button onClick={() => setSelectedRegion(null)}>
                  {t('Cancel')}
                </button>
              </div>
            </div>
          )}
          
          {/* Annotations List */}
          <div className="annotations-list">
            <h4>{t('Annotations')}</h4>
            {annotations.length > 0 ? (
              <ul>
                {annotations.map(annotation => (
                  <li key={annotation._id}>
                    <div className="annotation-header">
                      <span className="position">
                        {annotation.position.start} - {annotation.position.end}
                      </span>
                      <span className="author">
                        {t('By')}: {annotation.createdBy}
                      </span>
                    </div>
                    <div className="annotation-content">
                      {annotation.content}
                    </div>
                    <div className="annotation-votes">
                      <h5>{t('Votes')}</h5>
                      {annotation.votes.length > 0 ? (
                        <ul className="votes-list">
                          {annotation.votes.map((vote, index) => (
                            <li key={index}>
                              {vote.scientistId}: {vote.vote} ({vote.confidence}%)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{t('No votes yet')}</p>
                      )}
                      <div className="vote-buttons">
                        <button onClick={() => submitVote(annotation._id, 'Confirm', 100)}>
                          {t('Confirm')}
                        </button>
                        <button onClick={() => submitVote(annotation._id, 'Reject', 100)}>
                          {t('Reject')}
                        </button>
                        <button onClick={() => submitVote(annotation._id, 'Uncertain', 50)}>
                          {t('Uncertain')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('No annotations yet')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeWorkspace;
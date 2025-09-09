import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import './CollaborativeWorkspace.css';

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

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system';
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

  console.log('CollaborativeWorkspace component mounted', { sequenceId, sequenceData, scientistId });
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(true);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
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

    socket.on('chat-message', (data) => {
      console.log('Chat message received:', data);
      const newMessage: ChatMessage = {
        id: data.id || `msg-${Date.now()}`,
        userId: data.userId,
        username: data.username || data.userId,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        type: 'message'
      };
      console.log('Adding message to state:', newMessage);
      setChatMessages(prev => {
        const updated = [...prev, newMessage];
        console.log('Updated chat messages:', updated);
        return updated;
      });
    });

    socket.on('user-joined-chat', (data) => {
      console.log('User joined chat:', data);
      setChatMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'System',
        message: `${data.username || data.userId} joined the session`,
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
    });

    return () => {
      socket.off('user-joined');
      socket.off('annotation-created');
      socket.off('vote-submitted');
      socket.off('chat-message');
      socket.off('user-joined-chat');
    };
  }, [socket]);
  
  // Fetch available sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/collaboration/sessions');
      setSessions(response.data.sessions || []);
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
      const response = await axios.post('http://localhost:5001/api/collaboration/sessions', {
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
      await axios.post(`http://localhost:5001/api/collaboration/sessions/${sessionRoomId}/join`, {
        scientistId
      });

      setRoomId(sessionRoomId);

      // Join the socket room
      if (socket) {
        socket.emit('join-room', sessionRoomId);

        // Notify others that user joined chat
        socket.emit('user-joined-chat', {
          userId: scientistId,
          username: scientistId,
          roomId: sessionRoomId
        });

        // Add a welcome message to test chat
        setChatMessages(prev => [...prev, {
          id: `welcome-${Date.now()}`,
          userId: 'system',
          username: 'System',
          message: `Welcome to session: ${sessions.find(s => s.roomId === sessionRoomId)?.name || sessionRoomId}`,
          timestamp: new Date().toISOString(),
          type: 'system'
        }]);
      }

      // Fetch annotations for this session
      const response = await axios.get(`http://localhost:5001/api/collaboration/sessions/${sessionRoomId}/annotations`);
      setAnnotations(response.data.annotations || []);

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
      const response = await axios.post('http://localhost:5001/api/collaboration/annotations', {
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
      const response = await axios.post(`http://localhost:5001/api/collaboration/annotations/${annotationId}/vote`, {
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
  
  // Send chat message
  const sendMessage = () => {
    console.log('sendMessage called', { newMessage, roomId, socket: !!socket, scientistId });

    if (!newMessage.trim() || !roomId || !socket || !scientistId) {
      console.log('sendMessage blocked:', { hasMessage: !!newMessage.trim(), hasRoomId: !!roomId, hasSocket: !!socket, hasScientistId: !!scientistId });
      return;
    }

    const messageData = {
      id: `msg-${Date.now()}`,
      userId: scientistId,
      username: scientistId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      roomId
    };

    console.log('Sending message:', messageData);

    // Add to local state immediately
    const newChatMessage: ChatMessage = {
      id: messageData.id,
      userId: messageData.userId,
      username: messageData.username,
      message: messageData.message,
      timestamp: messageData.timestamp,
      type: 'message'
    };
    setChatMessages(prev => [...prev, newChatMessage]);

    // Emit to socket
    socket.emit('chat-message', messageData);

    // Clear input
    setNewMessage('');

    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  // Handle Enter key in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);
  
  return (
    <div className="collaborative-workspace">
      <div className="workspace-header">
        <h2>{t('Collaborative Workspace')}</h2>
        <button
          onClick={() => setShowChat(!showChat)}
          className="chat-toggle-btn"
          style={{
            background: showChat ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {showChat ? '❌ Hide Chat' : '💬 Show Chat'}
        </button>
      </div>

      <div className="workspace-content">
        <div className="main-workspace">
      
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
                          <p>{t('Participants')}: {session.participants?.length || 0}</p>
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
                          {annotation.votes?.length > 0 ? (
                            <ul className="votes-list">
                              {(annotation.votes || []).map((vote, index) => (
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

        {/* Chat Panel */}
        {showChat && (
          <div className="chat-panel" style={{ border: '3px solid #007bff', boxShadow: '0 4px 12px rgba(0,123,255,0.3)' }}>
            <div className="chat-header" style={{ background: 'linear-gradient(135deg, #007bff, #0056b3)', color: 'white' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💬 Team Chat {roomId && <span style={{ fontSize: '12px', opacity: 0.8 }}>(Active)</span>}
              </h4>
              {!roomId && <small style={{color: 'rgba(255,255,255,0.8)'}}>🔒 Join a session to unlock chat</small>}
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <div key={msg.id || `msg-${index}`} className={`chat-message ${msg.type} ${msg.userId === scientistId ? 'own' : ''}`}>
                    <div className="message-header">
                      <span className="username">{msg.username}</span>
                      <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="message-content">
                      {msg.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages" style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  fontStyle: 'italic',
                  marginTop: '2rem',
                  padding: '2rem',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px dashed #007bff'
                }}>
                  {roomId ? (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
                      <div style={{ fontSize: '18px', marginBottom: '0.5rem' }}>No messages yet!</div>
                      <div style={{ fontSize: '14px' }}>Type a message below and press Enter to start chatting like WhatsApp! 🚀</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
                      <div style={{ fontSize: '18px', marginBottom: '0.5rem' }}>Chat Locked</div>
                      <div style={{ fontSize: '14px' }}>Join a collaborative session to unlock real-time chat! 👥</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="chat-input" style={{ borderTop: '2px solid #007bff', padding: '1rem', background: '#f8f9fa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={roomId ? "Type a message like WhatsApp..." : "Join a session to start chatting"}
                  maxLength={500}
                  disabled={!roomId}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #007bff',
                    borderRadius: '25px',
                    outline: 'none',
                    fontSize: '14px',
                    background: roomId ? 'white' : '#f5f5f5'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !roomId}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: (!newMessage.trim() || !roomId) ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: (!newMessage.trim() || !roomId) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  📤 Send
                </button>
                {roomId && (
                  <button
                    onClick={() => {
                      console.log('Test message button clicked');
                      setChatMessages(prev => [...prev, {
                        id: `test-${Date.now()}`,
                        userId: 'test-user',
                        username: 'Test User',
                        message: '🎉 This is a test message! Chat is working like WhatsApp! 🎉',
                        timestamp: new Date().toISOString(),
                        type: 'message'
                      }]);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title="Click to test chat functionality"
                  >
                    🧪 Test
                  </button>
                )}
              </div>
              {roomId && (
                <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                  💡 Press Enter to send • Messages are real-time like WhatsApp
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeWorkspace;
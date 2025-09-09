// frontend/src/services/offlineStorage.ts
import { openDB, IDBPDatabase } from 'idb';

type AnnotationType = {
  id: string;
  sequenceId: string;
  position: number;
  content: string;
  createdBy: string;
  roomId: string;
  timestamp: number;
  votes: string[];
  pendingSync: boolean;
};

type SequenceType = {
  id: string;
  data: string;
  metadata: Record<string, any>;
  timestamp: number;
  pendingSync: boolean;
};

type CollaborativeSessionType = {
  roomId: string;
  name: string;
  createdBy: string;
  dataset: string;
  participants: string[];
  status: string;
  createdAt: number;
  lastActivity: number;
  pendingSync: boolean;
};

// Simplified interface without extending DBSchema to avoid type conflicts
interface BioMapperDB {
  annotations: AnnotationType;
  sequences: SequenceType;
  collaborativeSessions: CollaborativeSessionType;
}

let dbPromise: Promise<IDBPDatabase<BioMapperDB>> | null = null;

const initDB = async (): Promise<IDBPDatabase<BioMapperDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<BioMapperDB>('biomapper-offline', 1, {
      upgrade(db) {
        // Annotations store
        const annotationStore = db.createObjectStore('annotations', { keyPath: 'id' });
        annotationStore.createIndex('by-sequence', 'sequenceId');
        annotationStore.createIndex('by-room', 'roomId');
        annotationStore.createIndex('by-pending', 'pendingSync');

        // Sequences store
        const sequenceStore = db.createObjectStore('sequences', { keyPath: 'id' });
        sequenceStore.createIndex('by-pending', 'pendingSync');

        // Collaborative sessions store
        const sessionStore = db.createObjectStore('collaborativeSessions', { keyPath: 'roomId' });
        sessionStore.createIndex('by-pending', 'pendingSync');
      },
    });
  }
  return dbPromise;
};

// Annotations
export const saveAnnotation = async (annotation: any): Promise<void> => {
  const db = await initDB();
  annotation.pendingSync = navigator.onLine ? false : true;
  await db.put('annotations', annotation);
};

export const getAnnotationsBySequence = async (sequenceId: string): Promise<any[]> => {
  const db = await initDB();
  return db.getAllFromIndex('annotations', 'by-sequence', sequenceId);
};

export const getAnnotationsByRoom = async (roomId: string): Promise<any[]> => {
  const db = await initDB();
  return db.getAllFromIndex('annotations', 'by-room', roomId);
};

// Sequences
export const saveSequence = async (sequence: any): Promise<void> => {
  const db = await initDB();
  sequence.pendingSync = navigator.onLine ? false : true;
  await db.put('sequences', sequence);
};

export const getSequence = async (id: string): Promise<any> => {
  const db = await initDB();
  return db.get('sequences', id);
};

// Collaborative Sessions
export const saveCollaborativeSession = async (session: any): Promise<void> => {
  const db = await initDB();
  // Ensure session has required roomId field
  if (!session.roomId) {
    session.roomId = session.id || `session_${Date.now()}`;
  }
  session.pendingSync = navigator.onLine ? false : true;
  await db.put('collaborativeSessions', session);
};

export const getCollaborativeSession = async (roomId: string): Promise<any> => {
  const db = await initDB();
  return db.get('collaborativeSessions', roomId);
};

export const getAllCollaborativeSessions = async (): Promise<any[]> => {
  const db = await initDB();
  return db.getAll('collaborativeSessions');
};

// Sync functions
export const syncPendingData = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  const db = await initDB();
  
  // Sync annotations
  const pendingAnnotations = await db.getAllFromIndex('annotations', 'by-pending', 1);
  for (const annotation of pendingAnnotations) {
    try {
      // Send to server
      const response = await fetch('/api/collaboration/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      });
      
      if (response.ok) {
        // Update local record to mark as synced
        annotation.pendingSync = false;
        await db.put('annotations', annotation);
      }
    } catch (error) {
      console.error('Failed to sync annotation:', error);
    }
  }
  
  // Sync sequences
   const pendingSequences = await db.getAllFromIndex('sequences', 'by-pending', 1);
   for (const sequence of pendingSequences) {
     try {
       const response = await fetch('/api/collaboration/sequences', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(sequence),
       });
       
       if (response.ok) {
         sequence.pendingSync = false;
         await db.put('sequences', sequence);
       }
     } catch (error) {
       console.error('Failed to sync sequence:', error);
     }
   }
   
   // Sync collaborative sessions
   const pendingSessions = await db.getAllFromIndex('collaborativeSessions', 'by-pending', 1);
   for (const session of pendingSessions) {
     try {
       const response = await fetch('/api/collaboration/sessions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(session),
       });
       
       if (response.ok) {
         // Update local record to mark as synced
         await db.put('collaborativeSessions', { ...session, pendingSync: false });
       }
     } catch (error) {
       console.error('Failed to sync collaborative session:', error);
     }
   }
};

// Listen for online status changes to trigger sync
export const initOfflineSync = (): void => {
  window.addEventListener('online', () => {
    console.log('Back online, syncing pending data...');
    syncPendingData();
  });
};

const offlineStorage = {
  initDB,
  saveAnnotation,
  getAnnotationsBySequence,
  getAnnotationsByRoom,
  saveSequence,
  getSequence,
  saveCollaborativeSession,
  getCollaborativeSession,
  getAllCollaborativeSessions,
  syncPendingData,
  initOfflineSync,
};

export default offlineStorage;
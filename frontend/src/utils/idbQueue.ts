// Minimal IndexedDB queue utility using idb-keyval-like API (no external deps)
export type EdgeQueueItem = { id: string; type: 'validate' | 'flag'; payload: any; ts: number };

const DB_NAME = 'biomapper-edge';
const STORE_NAME = 'queue';

function withStore(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => void) {
  const openReq = indexedDB.open(DB_NAME, 1);
  openReq.onupgradeneeded = () => {
    const db = openReq.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  };
  return new Promise<void>((resolve, reject) => {
    openReq.onsuccess = () => {
      const db = openReq.result;
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      callback(store);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

export async function enqueue(item: Omit<EdgeQueueItem, 'id' | 'ts'> & { id?: string; ts?: number }) {
  const full: EdgeQueueItem = { id: item.id || crypto.randomUUID(), ts: item.ts || Date.now(), type: item.type, payload: item.payload } as EdgeQueueItem;
  await withStore('readwrite', (store) => { store.put(full); });
  return full;
}

export async function getAll(): Promise<EdgeQueueItem[]> {
  const items: EdgeQueueItem[] = [];
  await withStore('readonly', (store) => {
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (cursor) { items.push(cursor.value as EdgeQueueItem); cursor.continue(); }
    };
  });
  return items;
}

export async function remove(id: string) {
  await withStore('readwrite', (store) => { store.delete(id); });
}

export async function clearAll() {
  await withStore('readwrite', (store) => { store.clear(); });
}


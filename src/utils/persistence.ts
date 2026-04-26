import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'frank-cortex-db';
const STORE_NAME = 'ia-responses';
const VERSION = 1;

export interface SavedResponse {
  id?: number;
  transcript: string;
  response: string;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export const persistenceService = {
  async saveResponse(data: Omit<SavedResponse, 'id' | 'timestamp'>) {
    const db = await getDB();
    const timestamp = Date.now();
    return db.add(STORE_NAME, { ...data, timestamp });
  },

  async getAllResponses(): Promise<SavedResponse[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async deleteResponse(id: number) {
    const db = await getDB();
    return db.delete(STORE_NAME, id);
  },

  async clearAll() {
    const db = await getDB();
    return db.clear(STORE_NAME);
  }
};

// src/scripts/data/db.js
import { openDB } from 'idb';

const DATABASE_NAME = 'berbagi-cerita-db';
const DATABASE_VERSION = 3;
const FAVORITES_STORE = 'favorites';
const OUTBOX_STORE = 'outbox';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
      db.createObjectStore(FAVORITES_STORE, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
      db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
    }
  },
});

/* ============================================================
 * [FAVORITES STORE] - CRUD untuk cerita favorit
 * ============================================================ */

/**
 * [CREATE/UPDATE] Menyimpan cerita ke IndexedDB (favorites)
 */
export async function saveStories(stories = []) {
  if (!stories || stories.length === 0) return;
  const db = await dbPromise;
  const tx = db.transaction(FAVORITES_STORE, 'readwrite');
  const store = tx.objectStore(FAVORITES_STORE);

  const storiesArray = Array.isArray(stories) ? stories : [stories];
  const promises = storiesArray.map(story => store.put(story));
  
  await Promise.all(promises);
  await tx.done;
  console.log('Cerita disimpan ke favorit (IndexedDB).');
}

/**
 * [DELETE] Menghapus cerita favorit berdasarkan ID
 */
export async function deleteStory(id) {
  if (!id) return;
  const db = await dbPromise;
  const tx = db.transaction(FAVORITES_STORE, 'readwrite');
  const store = tx.objectStore(FAVORITES_STORE);
  await store.delete(id);
  await tx.done;
  console.log('Cerita dihapus dari favorit (IndexedDB).');
}

/**
 * [READ-ALL] Mengambil semua cerita favorit
 */
export async function getAllStories() {
  const db = await dbPromise;
  const tx = db.transaction(FAVORITES_STORE, 'readonly');
  const store = tx.objectStore(FAVORITES_STORE);
  return store.getAll();
}

/**
 * [READ-ONE] Mengambil satu cerita favorit berdasarkan ID
 */
export async function getStoryById(id) {
  if (!id) return null;
  const db = await dbPromise;
  const tx = db.transaction(FAVORITES_STORE, 'readonly');
  const store = tx.objectStore(FAVORITES_STORE);
  return store.get(id);
}

/**
 * [CHECK] Memeriksa status favorit
 */
export async function isFavorited(id) {
  const story = await getStoryById(id);
  return !!story;
}


/* ============================================================
 * [OUTBOX STORE] - IndexedDB untuk Offline Synchronization (Kriteria 4 Advanced)
 * ============================================================ */

/**
 * [CREATE OFFLINE] Menyimpan draft cerita baru saat perangkat offline
 */
export async function saveOfflineStory(draftData) {
  const db = await dbPromise;
  const tx = db.transaction(OUTBOX_STORE, 'readwrite');
  const store = tx.objectStore(OUTBOX_STORE);
  
  const id = draftData.id || `offline_${Date.now()}`;
  const storyObj = {
    ...draftData,
    id,
    createdAt: new Date().toISOString(),
  };

  await store.put(storyObj);
  await tx.done;
  console.log('Draft cerita tersimpan di outbox IndexedDB:', id);
  return id;
}

/**
 * [READ OFFLINE DRAFTS] Mengambil semua draft cerita offline
 */
export async function getOfflineStories() {
  const db = await dbPromise;
  const tx = db.transaction(OUTBOX_STORE, 'readonly');
  const store = tx.objectStore(OUTBOX_STORE);
  return store.getAll();
}

/**
 * [DELETE OFFLINE DRAFT] Menghapus draft yang sudah berhasil di-sync ke API
 */
export async function deleteOfflineStory(id) {
  if (!id) return;
  const db = await dbPromise;
  const tx = db.transaction(OUTBOX_STORE, 'readwrite');
  const store = tx.objectStore(OUTBOX_STORE);
  await store.delete(id);
  await tx.done;
  console.log('Draft cerita offline terhapus dari outbox IndexedDB:', id);
}
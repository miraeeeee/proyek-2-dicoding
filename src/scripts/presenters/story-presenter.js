// src/scripts/presenters/story-presenter.js
import * as api from '../data/api.js';
import { 
  saveStories as saveStoriesToDB, 
  getAllStories,
  deleteStory as deleteStoryFromDB, 
  getStoryById as getStoryFromDB,
  saveOfflineStory,
  getOfflineStories,
  deleteOfflineStory
} from '../data/db.js';

export default class StoryPresenter {
  async register(name, email, password) {
    return await api.register(name, email, password);
  }

  async login(email, password) {
    return await api.login(email, password);
  }

  #fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  #base64ToFile(base64Data, filename, mimeType) {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Save stories to IndexedDB favorites
   */
  async saveStories(stories) {
    return await saveStoriesToDB(stories);
  }

  /**
   * Add Story with Offline Support (Kriteria 4 Advanced)
   */
  async addStory(desc, photo, lat, lon) {
    if (!navigator.onLine) {
      return await this.#saveStoryToOfflineOutbox(desc, photo, lat, lon);
    }

    try {
      const result = await api.addStory(desc, photo, lat, lon);
      if (!result.error) {
        return result;
      }
      return result;
    } catch (err) {
      console.warn('Network error saat kirim cerita, beralih ke simpan offline:', err);
      return await this.#saveStoryToOfflineOutbox(desc, photo, lat, lon);
    }
  }

  async #saveStoryToOfflineOutbox(desc, photo, lat, lon) {
    try {
      const photoBase64 = photo ? await this.#fileToBase64(photo) : null;
      const draft = {
        description: desc,
        photoData: photoBase64,
        photoName: photo ? photo.name : 'photo.jpg',
        photoType: photo ? photo.type : 'image/jpeg',
        lat: lat || null,
        lon: lon || null,
      };

      await saveOfflineStory(draft);
      return {
        error: false,
        isOffline: true,
        message: 'Perangkat offline. Cerita disimpan di draf IndexedDB dan akan di-sync otomatis saat online!'
      };
    } catch (err) {
      console.error('Gagal menyimpan draf offline:', err);
      return {
        error: true,
        message: 'Gagal menyimpan cerita secara offline: ' + err.message
      };
    }
  }

  /**
   * Synchronize pending offline stories to API when online (Kriteria 4 Advanced)
   */
  async syncOfflineStories() {
    if (!navigator.onLine) return 0;
    const token = localStorage.getItem('authToken');
    if (!token) return 0;

    let pendingDrafts = [];
    try {
      pendingDrafts = await getOfflineStories();
    } catch (err) {
      console.error('Gagal membaca outbox IndexedDB:', err);
      return 0;
    }

    if (!pendingDrafts || pendingDrafts.length === 0) return 0;

    console.log(`Memulai sinkronisasi ${pendingDrafts.length} cerita offline ke server...`);
    let syncedCount = 0;

    for (const draft of pendingDrafts) {
      try {
        let photoFile = null;
        if (draft.photoData) {
          photoFile = this.#base64ToFile(draft.photoData, draft.photoName, draft.photoType);
        }

        const res = await api.addStory(draft.description, photoFile, draft.lat, draft.lon);
        if (!res.error) {
          await deleteOfflineStory(draft.id);
          syncedCount++;
          console.log(`Cerita offline (ID: ${draft.id}) berhasil di-sync ke API!`);
        }
      } catch (err) {
        console.error(`Error saat sync cerita offline (ID: ${draft.id}):`, err);
      }
    }

    return syncedCount;
  }

  async fetchStories(withLocation = 0) {
    try {
      const data = await api.getStories(withLocation);
      if (!data.error && data.listStory) {
        return data.listStory;
      }
    } catch (err) {
      console.warn('Gagal ambil cerita dari API:', err);
    }
    return [];
  }

  async deleteStory(id) {
    const storyId = id;
    try {
      await deleteStoryFromDB(storyId);
      console.log('Berhasil dihapus dari favorit (IndexedDB)');
    } catch (err) {
      console.error('Gagal hapus dari IndexedDB:', err);
      throw err;
    }
  }

  async getStoryById(id) {
    const storyId = id;
    try {
      const data = await api.getStoryById(storyId);
      if (!data.error && data.story) {
        return data.story;
      }
    } catch (err) {
      console.warn('Gagal ambil detail dari API:', err);
    }

    const cachedStory = await getStoryFromDB(storyId);
    if (cachedStory) {
      console.log('Detail cerita diambil dari favorit (IndexedDB)');
      return cachedStory;
    }

    return null;
  }

  async getFavoriteStories() {
    try {
      return await getAllStories();
    } catch (err) {
      console.error('Gagal mengambil favorit dari DB:', err);
      return [];
    }
  }
}
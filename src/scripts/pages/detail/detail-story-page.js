// src/scripts/pages/detail/detail-story-page.js
import { saveStories, deleteStory, isFavorited } from '../../data/db.js';
import { showFormattedDate } from '../../utils/index.js';

export default class DetailStoryPage {
  #presenter = null;
  #storyId = null;

  setPresenter(presenter) { this.#presenter = presenter; }
  setStoryId(id) { this.#storyId = id; }

  async render() {
    return `
      <section class="container story-detail-section">
        <div class="back-navigation">
          <a href="#/" class="back-link">&larr; Kembali ke Beranda</a>
        </div>
        <div id="detail-content" class="detail-container">
          <p class="loading-state">Memuat detail cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyId = this.#storyId;
    const container = document.getElementById('detail-content');

    if (!storyId) {
      container.innerHTML = '<p class="error-msg">ID cerita tidak valid.</p>';
      return;
    }

    const story = await this.#presenter.getStoryById(storyId);
    if (!story) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Cerita Tidak Ditemukan</h3>
          <p>Cerita ini mungkin tidak tersedia secara offline atau telah dihapus.</p>
          <a href="#/" class="btn-primary-inline">&larr; Kembali</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <article class="story-detail-card">
        <div class="detail-image-wrapper">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="detail-photo" loading="lazy">
        </div>

        <div class="detail-body">
          <div class="detail-header-meta">
            <h1 class="detail-title" tabindex="0">${story.name}</h1>
            <time class="detail-date" datetime="${story.createdAt}">📅 ${showFormattedDate(story.createdAt)}</time>
          </div>

          <p class="detail-description">${story.description}</p>

          ${story.lat !== null && story.lat !== undefined && story.lon !== null && story.lon !== undefined ? `
            <div class="detail-location-box">
              <h3>📍 Lokasi Cerita</h3>
              <p class="location-coords">Latitude: ${story.lat}, Longitude: ${story.lon}</p>
              <div id="detail-map" class="map-detail-container"></div>
            </div>
          ` : ''}

          <div class="detail-actions">
            <button id="favorite-btn" class="btn-favorite">
              <span class="love-icon">❤️</span>
              <span class="btn-text">Tambah ke Favorit</span>
            </button>
          </div>
        </div>
      </article>
    `;

    // Leaflet map for detail page if coordinates exist
    if (story.lat !== null && story.lat !== undefined && story.lon !== null && story.lon !== undefined) {
      const mapEl = document.getElementById('detail-map');
      if (mapEl) {
        mapEl.style.height = '300px';
        mapEl.style.width = '100%';

        const L = await import('leaflet');
        const detailMap = L.map(mapEl, {
          center: [story.lat, story.lon],
          zoom: 13
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(detailMap);

        L.marker([story.lat, story.lon]).addTo(detailMap)
          .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 50)}...`)
          .openPopup();

        requestAnimationFrame(() => detailMap.invalidateSize(true));
      }
    }

    // Favorite Button UI Update
    const updateFavoriteButton = async () => {
      const liked = await isFavorited(storyId);
      const btn = document.getElementById('favorite-btn');
      if (!btn) return;
      
      const icon = btn.querySelector('.love-icon');
      const text = btn.querySelector('.btn-text');

      if (liked) {
        btn.classList.add('loved');
        icon.textContent = '❤️';
        text.textContent = 'Hapus dari Favorit';
      } else {
        btn.classList.remove('loved');
        icon.textContent = '🤍';
        text.textContent = 'Tambah ke Favorit';
      }
    };

    await updateFavoriteButton();

    document.getElementById('favorite-btn')?.addEventListener('click', async () => {
      try {
        const currentlyLiked = await isFavorited(storyId);
        if (currentlyLiked) {
          await deleteStory(storyId);
          showToast('Dihapus dari cerita favorit.');
        } else {
          await saveStories([story]);
          showToast('Tersimpan ke cerita favorit!');
        }
        await updateFavoriteButton();
      } catch (err) {
        console.error('Error favorit:', err);
        alert('Gagal memperbarui favorit!');
      }
    });

    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'network-status-toast info show';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }
}
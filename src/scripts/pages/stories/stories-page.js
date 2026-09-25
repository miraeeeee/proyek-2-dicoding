// src/scripts/pages/stories/stories-page.js
import { showFormattedDate } from '../../utils/index.js';

export default class StoriesPage {
  #presenter = null;
  #stories = [];
  #map = null;
  #markers = {};

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    return `
      <section class="container stories-page">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1 tabindex="0" class="hero-title">Jelajahi Cerita & Lokasi Pengalaman</h1>
            <p class="hero-subtitle">Temukan berbagai kisah menarik dari pengguna lain lengkap dengan titik lokasi geografis di seluruh wilayah.</p>
          </div>
        </div>

        <!-- Section Switcher Tabs / Toggle View -->
        <div class="view-toggle-bar">
          <div class="tab-group" role="tablist">
            <button id="tab-grid" class="tab-btn active" role="tab" aria-selected="true" aria-controls="stories-list">📋 Daftar Cerita</button>
            <button id="tab-map" class="tab-btn" role="tab" aria-selected="false" aria-controls="map-wrapper">🗺️ Peta Cerita</button>
          </div>
          <div class="stories-count-badge" id="stories-count">Memuat data...</div>
        </div>

        <!-- Main Stories Container -->
        <div class="stories-content-layout">
          <!-- Stories Grid View -->
          <div id="stories-list" class="grid view-active" aria-live="polite">
            <div class="loading-state-box">
              <span class="spinner"></span>
              <p>Memuat cerita terbaru...</p>
            </div>
          </div>

          <!-- Map View (Hidden by default until Map tab clicked) -->
          <div class="map-section-wrapper view-hidden" id="map-wrapper">
            <div class="map-header">
              <h3>📍 Peta Persebaran Cerita Interaktif</h3>
              <p>Klik salah satu marker pin pada peta untuk melihat informasi cerita.</p>
            </div>
            <div id="map" class="map-container-main"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const listEl = document.getElementById('stories-list');
    const mapEl = document.getElementById('map');
    const storiesCountEl = document.getElementById('stories-count');
    const tabGridBtn = document.getElementById('tab-grid');
    const tabMapBtn = document.getElementById('tab-map');
    const mapWrapper = document.getElementById('map-wrapper');

    // TAB SWITCHING LOGIC (Works perfectly on Desktop & Mobile)
    tabGridBtn?.addEventListener('click', () => {
      tabGridBtn.classList.add('active');
      tabGridBtn.setAttribute('aria-selected', 'true');
      tabMapBtn?.classList.remove('active');
      tabMapBtn?.setAttribute('aria-selected', 'false');

      // Show Grid, Hide Map
      listEl.classList.remove('view-hidden');
      listEl.classList.add('view-active');
      listEl.style.display = 'grid';

      mapWrapper.classList.remove('view-active');
      mapWrapper.classList.add('view-hidden');
      mapWrapper.style.display = 'none';
    });

    tabMapBtn?.addEventListener('click', () => {
      tabMapBtn.classList.add('active');
      tabMapBtn.setAttribute('aria-selected', 'true');
      tabGridBtn?.classList.remove('active');
      tabGridBtn?.setAttribute('aria-selected', 'false');

      // Show Map, Hide Grid
      listEl.classList.remove('view-active');
      listEl.classList.add('view-hidden');
      listEl.style.display = 'none';

      mapWrapper.classList.remove('view-hidden');
      mapWrapper.classList.add('view-active');
      mapWrapper.style.display = 'block';

      // Invalidate Leaflet map size so tiles render cleanly
      if (this.#map) {
        setTimeout(() => {
          this.#map.invalidateSize(true);
        }, 100);
      }
    });

    // Import Leaflet
    const L = await import('leaflet');

    // Ensure map container has explicit size
    if (mapEl) {
      mapEl.style.height = '500px';
      mapEl.style.width = '100%';
    }

    // Init Leaflet Map
    const defaultCenter = [-2.548926, 118.0148634];
    this.#map = L.map(mapEl, {
      center: defaultCenter,
      zoom: 5,
      zoomControl: true,
    });

    // Multiple Tile Layer Control (Kriteria 2 Advance)
    const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const cartoTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    const esriTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    });

    const baseMaps = {
      '🗺️ OpenStreetMap Standard': osmTile,
      '🎨 CartoDB Voyager': cartoTile,
      '🛰️ Esri Satelit': esriTile,
    };

    osmTile.addTo(this.#map);
    L.control.layers(baseMaps).addTo(this.#map);

    try {
      // 1. Fetch stories dari API
      const storiesFromApi = await this.#presenter.fetchStories(1);
      this.#stories = storiesFromApi || [];

      if (storiesCountEl) {
        storiesCountEl.textContent = `${this.#stories.length} Cerita Ditemukan`;
      }

      // 2. Fetch stories dari IndexedDB (Favorit)
      const storiesFromDb = await this.#presenter.getFavoriteStories();
      const favoriteIds = new Set((storiesFromDb || []).map(s => s.id));

      // 3. Render List & Markers
      this.renderList(listEl, this.#stories, favoriteIds);
      this.renderMarkers(L, this.#stories);
      this._initFavoriteButtons(listEl);

    } catch (error) {
      console.error('Gagal memuat data cerita:', error);
      listEl.innerHTML = `
        <div class="empty-state">
          <h3>Gagal Memuat Cerita</h3>
          <p>Terjadi kesalahan koneksi saat mengambil cerita dari server.</p>
        </div>
      `;
    }
  }

  renderList(container, stories, favoriteIds) {
    if (!stories || stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📖</span>
          <h3>Belum Ada Cerita</h3>
          <p>Jadilah orang pertama yang membagikan cerita pengalaman!</p>
          <a href="#/add-story" class="btn-primary-inline">+ Tambah Cerita Baru</a>
        </div>
      `;
      return;
    }

    container.innerHTML = stories.map(s => {
      const isFav = favoriteIds.has(s.id);
      const hasLocation = s.lat !== null && s.lat !== undefined && s.lon !== null && s.lon !== undefined;

      return `
        <article class="story-card" tabindex="0" data-id="${s.id}">
          <div class="card-image-wrapper">
            <img src="${s.photoUrl}" alt="Foto cerita oleh ${s.name}" loading="lazy">
            ${hasLocation ? '<span class="badge-loc">📍 Berlokasi</span>' : ''}
            <button 
              class="card-fav-btn ${isFav ? 'loved' : ''}" 
              data-id="${s.id}" 
              aria-label="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
              title="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
            >
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="content">
            <a href="#/detail/${s.id}" class="card-title-link">
              <h2>${s.name}</h2>
            </a>
            <p>${s.description ? (s.description.length > 110 ? s.description.substring(0, 110) + '...' : s.description) : ''}</p>
            <div class="card-footer">
              <time datetime="${s.createdAt}">📅 ${showFormattedDate(s.createdAt)}</time>
              <a href="#/detail/${s.id}" class="view-detail-link">Lihat Detail &rarr;</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  _initFavoriteButtons(container) {
    container.querySelectorAll('.card-fav-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        event.preventDefault();

        const id = btn.dataset.id;
        const story = this.#stories.find(s => s.id === id);
        if (!story) return;

        const currentlyLoved = btn.classList.contains('loved');

        try {
          if (currentlyLoved) {
            await this.#presenter.deleteStory(id);
            btn.classList.remove('loved');
            btn.innerHTML = '🤍';
            btn.setAttribute('aria-label', 'Tambah ke favorit');
          } else {
            await this.#presenter.saveStories([story]);
            btn.classList.add('loved');
            btn.innerHTML = '❤️';
            btn.setAttribute('aria-label', 'Hapus dari favorit');
          }
        } catch (err) {
          console.error('Gagal update favorit:', err);
        }
      });
    });
  }

  renderMarkers(L, stories) {
    this.#markers = {};
    if (!stories || !this.#map) return;

    stories.forEach(s => {
      if (s.lat !== null && s.lat !== undefined && s.lon !== null && s.lon !== undefined) {
        const marker = L.marker([s.lat, s.lon]).addTo(this.#map)
          .bindPopup(`
            <div class="popup-card">
              <img src="${s.photoUrl}" alt="${s.name}" class="popup-thumb">
              <div class="popup-info">
                <strong>${s.name}</strong>
                <p>${s.description ? s.description.substring(0, 60) + '...' : ''}</p>
                <a href="#/detail/${s.id}" class="popup-link">Detail Cerita &rarr;</a>
              </div>
            </div>
          `);
        this.#markers[s.id] = marker;
      }
    });
  }
}
// src/scripts/pages/favorites/favorites-page.js
import { showFormattedDate } from '../../utils/index.js';

export default class FavoritesPage {
  #presenter = null;
  #allStories = [];

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    return `
      <section class="container stories-page">
        <div class="page-header">
          <h1 tabindex="0">❤️ Cerita Favorit Saya</h1>
          <p class="subtitle">Koleksi cerita favorit tersimpan secara lokal di peramban Anda.</p>
        </div>

        <!-- Controls Interaktif (Kriteria 4 Skilled: Search, Sort, Filter) -->
        <div class="favorites-controls">
          <div class="search-box">
            <label for="search-favorite" class="sr-only">Cari Favorit</label>
            <input type="search" id="search-favorite" placeholder="🔍 Cari cerita berdasarkan nama atau isi..." aria-label="Cari cerita favorit">
          </div>

          <div class="filter-sort-group">
            <div class="control-item">
              <label for="sort-favorite">Urutkan:</label>
              <select id="sort-favorite" aria-label="Urutkan cerita">
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="name-asc">Nama (A - Z)</option>
                <option value="name-desc">Nama (Z - A)</option>
              </select>
            </div>

            <div class="control-item">
              <label for="filter-location">Lokasi:</label>
              <select id="filter-location" aria-label="Filter lokasi cerita">
                <option value="all">Semua</option>
                <option value="with-loc">Punya Lokasi</option>
                <option value="no-loc">Tanpa Lokasi</option>
              </select>
            </div>
          </div>
        </div>

        <div id="favorites-list" class="grid" aria-live="polite">
          <p class="loading-state">Memuat cerita favorit...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const listEl = document.getElementById('favorites-list');
    const searchInput = document.getElementById('search-favorite');
    const sortSelect = document.getElementById('sort-favorite');
    const filterSelect = document.getElementById('filter-location');

    // Ambil data dari IndexedDB via Presenter
    this.#allStories = await this.#presenter.getFavoriteStories();

    if (!this.#allStories || this.#allStories.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <h3>Belum Ada Favorit</h3>
          <p>Anda belum menyimpan cerita apapun ke favorit. Jelajahi halaman utama dan tandai cerita yang Anda sukai!</p>
          <a href="#/" class="btn-primary-inline">Jelajahi Cerita</a>
        </div>
      `;
      return;
    }

    const applyFiltersAndRender = () => {
      const query = (searchInput.value || '').toLowerCase().trim();
      const sortVal = sortSelect.value;
      const filterVal = filterSelect.value;

      let filtered = [...this.#allStories];

      // 1. Searching (Text Query)
      if (query) {
        filtered = filtered.filter(s => 
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.description && s.description.toLowerCase().includes(query))
        );
      }

      // 2. Filtering (Location)
      if (filterVal === 'with-loc') {
        filtered = filtered.filter(s => s.lat !== null && s.lat !== undefined);
      } else if (filterVal === 'no-loc') {
        filtered = filtered.filter(s => s.lat === null || s.lat === undefined);
      }

      // 3. Sorting
      filtered.sort((a, b) => {
        if (sortVal === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortVal === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortVal === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (sortVal === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });

      this.renderList(listEl, filtered);
    };

    // Event listeners
    searchInput.addEventListener('input', applyFiltersAndRender);
    sortSelect.addEventListener('change', applyFiltersAndRender);
    filterSelect.addEventListener('change', applyFiltersAndRender);

    // Initial render
    applyFiltersAndRender();
  }

  renderList(container, stories) {
    if (stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Tidak ada cerita favorit yang cocok dengan pencarian/filter Anda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = stories.map(s => `
      <article class="story-card" tabindex="0" data-id="${s.id}">
        <div class="card-image-wrapper">
          <img src="${s.photoUrl}" alt="Foto cerita oleh ${s.name}" loading="lazy">
          ${s.lat !== null && s.lat !== undefined ? '<span class="badge-loc">📍 Berlokasi</span>' : ''}
        </div>
        <div class="content">
          <h2>${s.name}</h2>
          <p>${s.description.length > 120 ? s.description.substring(0, 120) + '...' : s.description}</p>
          <div class="card-footer">
            <time datetime="${s.createdAt}">${showFormattedDate(s.createdAt)}</time>
            <span class="view-detail-link">Lihat Detail &rarr;</span>
          </div>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('.story-card').forEach(card => {
      const navigateToDetail = () => {
        location.hash = `#/detail/${card.dataset.id}`;
      };
      card.addEventListener('click', navigateToDetail);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToDetail();
        }
      });
    });
  }
}
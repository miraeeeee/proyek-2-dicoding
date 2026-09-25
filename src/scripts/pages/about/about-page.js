// src/scripts/pages/about/about-page.js
export default class AboutPage {
  async render() {
    return `
      <section class="container about-page-section">
        <div class="about-hero">
          <span class="about-badge">🚀 Progressive Web App</span>
          <h1 tabindex="0" class="about-title">Tentang StoryApp</h1>
          <p class="about-lead">Ruang untuk membagikan kisah dan pengalaman, melihat lokasi cerita pada peta, serta mengakses konten yang tersedia saat perangkat offline.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <span class="feature-icon">📲</span>
            <h3>Dukungan PWA & Offline</h3>
            <p>Aplikasi bisa dipasang pada layar utama ponsel atau komputer dan tetap menyediakan akses ke konten yang telah disimpan saat offline.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">🔔</span>
            <h3>Push Notification</h3>
            <p>Aktifkan notifikasi agar perangkat dapat menerima kabar saat pengguna lain membagikan cerita baru.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">💾</span>
            <h3>IndexedDB & Auto-Sync</h3>
            <p>Cerita favorit tersimpan di perangkat; draf yang dibuat tanpa internet dapat disinkronkan setelah koneksi kembali tersedia.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">🗺️</span>
            <h3>Peta Interaktif</h3>
            <p>Jelajahi lokasi berbagai cerita melalui peta interaktif yang memanfaatkan OpenStreetMap dan Leaflet.</p>
          </div>
        </div>

        <div class="tech-stack-box">
          <h2>🛠️ Teknologi yang Mendukung Aplikasi</h2>
          <div class="tech-tags">
            <span class="tech-tag">Webpack 5</span>
            <span class="tech-tag">Workbox PWA</span>
            <span class="tech-tag">Service Worker</span>
            <span class="tech-tag">IndexedDB (idb)</span>
            <span class="tech-tag">Leaflet JS</span>
            <span class="tech-tag">VAPID Push API</span>
            <span class="tech-tag">View Transitions API</span>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {}
}
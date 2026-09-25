// src/scripts/pages/add-story/add-story-page.js
import CONFIG from '../../config.js';

export default class AddStoryPage {
  #presenter = null;

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    const isOffline = !navigator.onLine;
    return `
      <section class="container add-story">
        <div class="page-header text-center">
          <h1 tabindex="0">✨ Bagikan Cerita Baru</h1>
          <p class="subtitle">Abadikan momen dan bagikan lokasi pengalaman Anda.</p>
        </div>

        ${isOffline ? `
          <div class="offline-banner" role="status">
            <span>⚠️ Perangkat sedang Offline. Cerita yang Anda kirim akan disimpan ke draf IndexedDB dan di-sync otomatis saat online.</span>
          </div>
        ` : ''}

        <form id="add-story-form" aria-label="Form tambah cerita" class="form-card">
          <div class="form-group">
            <label for="description">Deskripsi Cerita <span class="required">*</span></label>
            <textarea id="description" required minlength="10" placeholder="Tuliskan cerita menarik pengalamanmu di sini..."></textarea>
          </div>

          <div class="form-group">
            <label for="photo">Unggah Foto Cerita <span class="required">*</span></label>
            <div class="file-input-wrapper">
              <input type="file" id="photo" accept="image/*">
              <div class="camera-actions">
                <button type="button" id="camera-btn" class="btn-secondary">📷 Gunakan Kamera</button>
              </div>
            </div>
            <div id="photo-preview-container" class="preview-box" hidden>
              <img id="photo-preview" src="" alt="Pratinjau Foto Cerita">
            </div>
          </div>

          <div class="form-group">
            <label>Pilih Lokasi di Peta (Opsional)</label>
            <div class="location-controls">
              <button type="button" id="use-gps" class="btn-small">🎯 Lokasi Saya (GPS)</button>
              <span id="location-status" class="location-status-text">Pilih titik pada peta di bawah ini</span>
            </div>
            <div id="map-add" class="map-container"></div>
          </div>

          <button type="submit" id="submit-btn" class="btn-primary">🚀 Kirim Cerita</button>
          <p id="form-message" role="alert" aria-live="polite"></p>
        </form>

        <video id="camera-stream" hidden autoplay playsinline></video>
        <canvas id="photo-canvas" hidden></canvas>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('add-story-form');
    const msg = document.getElementById('form-message');
    const photoInput = document.getElementById('photo');
    const cameraBtn = document.getElementById('camera-btn');
    const gpsBtn = document.getElementById('use-gps');
    const locationStatus = document.getElementById('location-status');
    const mapEl = document.getElementById('map-add');
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('photo-canvas');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPreview = document.getElementById('photo-preview');
    const submitBtn = document.getElementById('submit-btn');

    let map, marker, lat, lon, stream;

    // Fix map styling
    mapEl.style.height = '380px';
    mapEl.style.width = '100%';

    const L = await import('leaflet');

    // Init map Leaflet
    const defaultCenter = [-2.548926, 118.0148634];
    map = L.map(mapEl, {
      center: defaultCenter,
      zoom: 5
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    requestAnimationFrame(() => map.invalidateSize(true));

    // Handle marker placement on map click
    const updateMarker = (latitude, longitude, popupText) => {
      lat = latitude;
      lon = longitude;
      const latlng = [lat, lon];

      if (marker) {
        marker.setLatLng(latlng);
      } else {
        marker = L.marker(latlng).addTo(map);
      }

      marker.bindPopup(popupText || `Lokasi dipilih: ${lat.toFixed(4)}, ${lon.toFixed(4)}`).openPopup();
      locationStatus.textContent = `📍 Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    };

    map.on('click', e => {
      updateMarker(e.latlng.lat, e.latlng.lng);
    });

    // Handle GPS geolocation button
    gpsBtn.addEventListener('click', () => {
      locationStatus.textContent = 'Mendeteksi lokasi GPS...';
      if (!navigator.geolocation) {
        locationStatus.textContent = 'Geolocation tidak didukung browser ini.';
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userLat = pos.coords.latitude;
          const userLon = pos.coords.longitude;
          map.setView([userLat, userLon], 14);
          updateMarker(userLat, userLon, '🎯 Lokasi Anda');
        },
        err => {
          console.warn('GPS Error:', err);
          locationStatus.textContent = 'Gagal mengambil posisi GPS.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    // Handle photo input change preview
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          photoPreview.src = e.target.result;
          photoPreviewContainer.hidden = false;
        };
        reader.readAsDataURL(file);
      }
    });

    // Camera Stream handling
    let isCameraActive = false;
    cameraBtn.addEventListener('click', async () => {
      if (isCameraActive) {
        // Take photo
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const dt = new DataTransfer();
          dt.items.add(file);
          photoInput.files = dt.files;
          
          photoPreview.src = canvas.toDataURL('image/jpeg');
          photoPreviewContainer.hidden = false;

          // Stop camera stream
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
          video.hidden = true;
          isCameraActive = false;
          cameraBtn.textContent = '📷 Gunakan Kamera';
        }, 'image/jpeg');
      } else {
        // Start camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          video.srcObject = stream;
          video.hidden = false;
          isCameraActive = true;
          cameraBtn.textContent = '📸 Ambil Foto';
        } catch (err) {
          console.error('Kamera gagal:', err);
          msg.className = 'error';
          msg.textContent = 'Tidak dapat mengakses kamera perangkat.';
        }
      }
    });

    // Form submission
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const desc = document.getElementById('description').value;
      const photo = photoInput.files[0];

      if (!photo) {
        msg.className = 'error';
        msg.textContent = 'Mohon unggah foto cerita terlebih dahulu.';
        return;
      }

      submitBtn.disabled = true;
      msg.className = '';
      msg.textContent = 'Sedang mengirim cerita...';

      const result = await this.#presenter.addStory(desc, photo, lat, lon);

      if (result.error) {
        msg.className = 'error';
        msg.textContent = result.message || 'Gagal mengirim cerita.';
        submitBtn.disabled = false;
      } else {
        msg.className = result.isOffline ? 'warning' : 'success';
        msg.textContent = result.message || 'Cerita berhasil dikirim!';
        form.reset();
        photoPreviewContainer.hidden = true;
        if (marker) map.removeLayer(marker);
        marker = lat = lon = null;
        
        setTimeout(() => {
          location.hash = '#/';
        }, 2000);
      }
    });
  }
}
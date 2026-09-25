// src/scripts/index.js
import '../styles/styles.css';
import '../styles/leaflet-fixed.css';
import App from './pages/app';
import CONFIG from './config.js';
import markerShadow from '../public/images/marker-shadow.png';

// --- Leaflet Marker Fix ---
const leafletFixStyle = document.createElement('style');
leafletFixStyle.innerHTML = `
  .leaflet-marker-shadow { background-image: url(${markerShadow}); }
`;
document.head.appendChild(leafletFixStyle);

// --- Inisialisasi Aplikasi ---
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Inisialisasi Push Notification
  await initPushNotification();
});


/* ============================================================
 * LOGIKA PUSH NOTIFICATION (Kriteria 2 Advanced)
 * ============================================================ */

async function initPushNotification() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push Notifikasi tidak didukung pada browser ini.');
    return;
  }

  let notificationBtn = document.getElementById('notificationButton');
  if (!notificationBtn) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      notificationBtn = document.createElement('button');
      notificationBtn.id = 'notificationButton';
      notificationBtn.className = 'push-toggle-btn';
      notificationBtn.innerHTML = '<span class="icon">🔔</span> <span class="label">Notifikasi</span>';
      notificationBtn.setAttribute('aria-label', 'Aktifkan push notifikasi');
      headerActions.prepend(notificationBtn);
    }
  }

  if (!notificationBtn) return;

  const basePath = process.env.PUBLIC_PATH || './';
  const swUrl = `${basePath}sw.bundle.js`;

  let registration;
  try {
    registration = await navigator.serviceWorker.register(swUrl);
    console.log('Service Worker registered successfully:', registration.scope);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return;
  }

  // Cek Status Subscription
  let currentSubscription = await registration.pushManager.getSubscription();
  updateNotificationButtonUI(!!currentSubscription);

  // Listener Klik Tombol Push Notification
  notificationBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Silakan login terlebih dahulu untuk mengaktifkan fitur notifikasi.');
      location.hash = '#/login';
      return;
    }

    notificationBtn.disabled = true;

    try {
      if (currentSubscription) {
        // --- UNSUBSCRIBE (DELETE) ---
        await unsubscribeFromPush(currentSubscription, token);
        currentSubscription = null;
        updateNotificationButtonUI(false);
        showNotificationToast('Langganan push notifikasi telah dimatikan.');
      } else {
        // --- SUBSCRIBE (POST) ---
        currentSubscription = await subscribeToPush(registration, token);
        if (currentSubscription) {
          updateNotificationButtonUI(true);
          showNotificationToast('Push notifikasi berhasil diaktifkan!');
        }
      }
    } catch (err) {
      console.error('Gagal memproses langganan notifikasi:', err);
      alert('Gagal memproses notifikasi: ' + err.message);
    } finally {
      notificationBtn.disabled = false;
    }
  });
}

function updateNotificationButtonUI(isSubscribed) {
  const btn = document.getElementById('notificationButton');
  if (!btn) return;

  if (isSubscribed) {
    btn.innerHTML = '<span class="icon">🔕</span> <span class="label">Matikan Notif</span>';
    btn.classList.add('subscribed');
    btn.setAttribute('aria-label', 'Matikan push notifikasi');
  } else {
    btn.innerHTML = '<span class="icon">🔔</span> <span class="label">Notifikasi</span>';
    btn.classList.remove('subscribed');
    btn.setAttribute('aria-label', 'Aktifkan push notifikasi');
  }
}

function showNotificationToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'network-status-toast info show';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function subscribeToPush(registration, token) {
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY)
  };

  const subscription = await registration.pushManager.subscribe(subscribeOptions);
  const subscriptionJson = subscription.toJSON();
  delete subscriptionJson.expirationTime;

  const payload = {
    endpoint: subscriptionJson.endpoint,
    keys: {
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth
    }
  };

  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await response.json();
  if (!response.ok) {
    await subscription.unsubscribe();
    throw new Error(responseBody.message || response.statusText);
  }

  return subscription;
}

async function unsubscribeFromPush(subscription, token) {
  const rawJson = subscription.toJSON();
  const payload = {
    endpoint: rawJson.endpoint
  };

  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await response.json();
  if (!response.ok && response.status !== 404) {
    throw new Error(responseBody.message || response.statusText);
  }

  await subscription.unsubscribe();
}


/* ============================================================
 * PROMPT INSTALASI PWA (Kriteria 3 Basic & Skilled)
 * ============================================================ */

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  if (document.getElementById('install-pwa-btn')) return;

  const installButton = document.createElement('button');
  installButton.id = 'install-pwa-btn';
  installButton.className = 'install-pwa-banner';
  installButton.innerHTML = '📲 <span>Install App</span>';
  installButton.setAttribute('aria-label', 'Install aplikasi ke homescreen');

  installButton.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install prompt choice:', outcome);
    deferredPrompt = null;
    installButton.remove();
  };

  document.body.appendChild(installButton);
});
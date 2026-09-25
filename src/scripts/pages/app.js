// src/scripts/pages/app.js
import routes from '../routes/routes';
import { getActiveRouteKey, parseActivePathname } from '../routes/url-parser.js';
import StoryPresenter from '../presenters/story-presenter.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #presenter = new StoryPresenter();
  #logoutBtn = null;
  #networkStatusEl = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupLogoutButton();
    this._setupNetworkStatusListener();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '🚪 Logout';
    logoutBtn.className = 'logout-btn';
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      location.hash = '#/login';
    });

    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      headerActions.appendChild(logoutBtn);
    } else {
      this.#drawerButton.parentElement.appendChild(logoutBtn);
    }
    this.#logoutBtn = logoutBtn;
    this._updateAuthUI();
  }

  _setupNetworkStatusListener() {
    // 1. Inisialisasi Toast / Indicator Network Status
    const statusContainer = document.createElement('div');
    statusContainer.id = 'network-status-indicator';
    statusContainer.className = 'network-status-toast';
    document.body.appendChild(statusContainer);
    this.#networkStatusEl = statusContainer;

    const handleNetworkChange = async () => {
      const isOnline = navigator.onLine;
      if (isOnline) {
        this.showToast('🟢 Koneksi pulih (Online). Memeriksa draf offline...', 'success');
        // Auto-sync offline drafts to API (Kriteria 4 Advanced)
        const syncedCount = await this.#presenter.syncOfflineStories();
        if (syncedCount > 0) {
          this.showToast(`🎉 Sukses mengunggah ${syncedCount} cerita draf offline ke server!`, 'success');
          // Refresh halaman saat ini jika berada di beranda
          if (getActiveRouteKey() === '/') {
            this.renderPage();
          }
        }
      } else {
        this.showToast('🔴 Mode Offline. Perubahan draf disimpan di IndexedDB.', 'warning');
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Initial check sync if online
    if (navigator.onLine) {
      setTimeout(async () => {
        const syncedCount = await this.#presenter.syncOfflineStories();
        if (syncedCount > 0) {
          this.showToast(`🎉 Berhasil mengunggah ${syncedCount} cerita offline tersimpan ke server!`, 'success');
        }
      }, 2000);
    }
  }

  showToast(message, type = 'info') {
    if (!this.#networkStatusEl) return;
    this.#networkStatusEl.textContent = message;
    this.#networkStatusEl.className = `network-status-toast ${type} show`;
    setTimeout(() => {
      this.#networkStatusEl.classList.remove('show');
    }, 4000);
  }

  _updateAuthUI() {
    const isLoggedIn = !!localStorage.getItem('authToken');
    if (this.#logoutBtn) {
      this.#logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    }
    const loginLink = document.querySelector('a[href="#/login"]');
    const registerLink = document.querySelector('a[href="#/register"]');
    if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : 'list-item';
    if (registerLink) registerLink.style.display = isLoggedIn ? 'none' : 'list-item';
  }

  async renderPage() {
    const routeKey = getActiveRouteKey();
    const isAuthPage = routeKey === '/login' || routeKey === '/register';
    const token = localStorage.getItem('authToken');

    // ROUTE GUARD
    if (!isAuthPage && !token) {
      location.hash = '#/login';
      return;
    }

    let pageInstance = routes[routeKey];
    if (!pageInstance) {
      location.hash = '#/';
      return;
    }

    // Injeksi presenter
    pageInstance.setPresenter?.(this.#presenter);

    // Kirim ID ke DetailStoryPage
    if (routeKey === '/detail/:id') {
      const { id } = parseActivePathname();
      pageInstance.setStoryId?.(id);
    }

    // Update UI Auth & Nav active link
    this._updateAuthUI();
    this._updateActiveNav(routeKey);

    // Render dengan View Transition
    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await pageInstance.render();
        await pageInstance.afterRender();
      }).finished;
    } else {
      this.#content.innerHTML = await pageInstance.render();
      await pageInstance.afterRender();
    }
  }

  _updateActiveNav(activeKey) {
    document.querySelectorAll('.nav-list a').forEach(link => {
      const href = link.getAttribute('href') || '';
      const key = href.replace('#', '');
      if (key === activeKey || (key === '/' && activeKey === '/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

export default App;
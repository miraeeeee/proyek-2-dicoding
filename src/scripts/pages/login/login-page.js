// src/scripts/pages/login/login-page.js
export default class LoginPage {
  #presenter = null;

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    return `
      <section class="container auth-section">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon-badge">🔑</div>
            <h1 tabindex="0">Selamat Datang Kembali</h1>
            <p class="auth-subtitle">Masuk ke akun StoryApp Anda untuk mulai berbagi cerita.</p>
          </div>

          <form id="login-form" class="auth-form" aria-label="Form login pengguna">
            <div class="form-group">
              <label for="email">Alamat Email <span class="required">*</span></label>
              <input type="email" id="email" class="form-input" required placeholder="nama@domain.com" autocomplete="email">
            </div>

            <div class="form-group">
              <label for="password">Kata Sandi <span class="required">*</span></label>
              <div class="password-input-wrapper">
                <input type="password" id="password" class="form-input" required minlength="8" placeholder="Masukkan kata sandi..." autocomplete="current-password">
                <button type="button" id="toggle-password" class="btn-toggle-eye" aria-label="Tampilkan kata sandi">👁️</button>
              </div>
            </div>

            <button type="submit" id="login-submit-btn" class="btn-primary auth-btn">
              <span>Masuk Ke Akun &rarr;</span>
            </button>
            <p id="msg" role="alert" aria-live="polite" class="auth-message-box"></p>

            <div class="auth-footer">
              <p>Belum memiliki akun? <a href="#/register">Daftar Akun Baru</a></p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const msg = document.getElementById('msg');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const submitBtn = document.getElementById('login-submit-btn');

    togglePasswordBtn?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;

      submitBtn.disabled = true;
      msg.className = 'auth-message-box info';
      msg.textContent = 'Sedang memproses masuk...';

      try {
        const result = await this.#presenter.login(email, password);
        if (result.error) {
          msg.className = 'auth-message-box error';
          msg.textContent = result.message || 'Gagal masuk. Periksa email dan kata sandi Anda.';
          submitBtn.disabled = false;
        } else {
          localStorage.setItem('authToken', result.loginResult.token);
          msg.className = 'auth-message-box success';
          msg.textContent = 'Login berhasil! Mengalihkan...';
          setTimeout(() => {
            location.hash = '#/';
          }, 800);
        }
      } catch (err) {
        msg.className = 'auth-message-box error';
        msg.textContent = 'Terjadi kesalahan jaringan: ' + err.message;
        submitBtn.disabled = false;
      }
    });
  }
}
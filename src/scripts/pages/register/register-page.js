// src/scripts/pages/register/register-page.js
export default class RegisterPage {
  #presenter = null;

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  async render() {
    return `
      <section class="container auth-section">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon-badge">📝</div>
            <h1 tabindex="0">Buat Akun Baru</h1>
            <p class="auth-subtitle">Bergabunglah dengan StoryApp dan bagikan pengalaman Anda ke seluruh dunia.</p>
          </div>

          <form id="register-form" class="auth-form" aria-label="Form registrasi pengguna">
            <div class="form-group">
              <label for="name">Nama Lengkap <span class="required">*</span></label>
              <input type="text" id="name" class="form-input" required minlength="3" placeholder="Masukkan nama Anda..." autocomplete="name">
            </div>

            <div class="form-group">
              <label for="email">Alamat Email <span class="required">*</span></label>
              <input type="email" id="email" class="form-input" required placeholder="nama@domain.com" autocomplete="email">
            </div>

            <div class="form-group">
              <label for="password">Kata Sandi <span class="required">*</span></label>
              <div class="password-input-wrapper">
                <input type="password" id="password" class="form-input" required minlength="8" placeholder="Minimal 8 karakter..." autocomplete="new-password">
                <button type="button" id="toggle-password" class="btn-toggle-eye" aria-label="Tampilkan kata sandi">👁️</button>
              </div>
            </div>

            <button type="submit" id="register-submit-btn" class="btn-primary auth-btn">
              <span>Daftar Sekarang &rarr;</span>
            </button>
            <p id="msg" role="alert" aria-live="polite" class="auth-message-box"></p>

            <div class="auth-footer">
              <p>Sudah memiliki akun? <a href="#/login">Masuk Di Sini</a></p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    const msg = document.getElementById('msg');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const submitBtn = document.getElementById('register-submit-btn');

    togglePasswordBtn?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;

      submitBtn.disabled = true;
      msg.className = 'auth-message-box info';
      msg.textContent = 'Mendaftarkan akun...';

      try {
        const result = await this.#presenter.register(name, email, password);
        if (result.error) {
          msg.className = 'auth-message-box error';
          msg.textContent = result.message || 'Gagal mendaftar akun.';
          submitBtn.disabled = false;
        } else {
          msg.className = 'auth-message-box success';
          msg.textContent = 'Pendaftaran berhasil! Mengalihkan ke halaman masuk...';
          setTimeout(() => {
            location.hash = '#/login';
          }, 1200);
        }
      } catch (err) {
        msg.className = 'auth-message-box error';
        msg.textContent = 'Terjadi kesalahan jaringan: ' + err.message;
        submitBtn.disabled = false;
      }
    });
  }
}
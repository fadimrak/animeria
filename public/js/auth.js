/* ==========================================================================
   ANIMERIA — CLIENT AUTHENTICATION & USER SESSION MANAGER
   Clean Email/Password Registration & Login with Full I18n Support
   ========================================================================== */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userStats = null;
    this.token = localStorage.getItem("animeria_auth_token") || null;
    this.isRegisterMode = false;
  }

  async init() {
    this.injectAuthModalIfMissing();
    this.bindGlobalEvents();

    window.addEventListener("animeria:lang-changed", () => {
      this.updateNavbarUser();
      window.I18n.updateDomTexts();
    });

    if (this.token) {
      try {
        const data = await window.API.getMe();
        this.currentUser = data.user;
        this.userStats = data.stats;
        localStorage.setItem("animeria_current_user", JSON.stringify(data.user));
        this.updateNavbarUser();
        window.dispatchEvent(new CustomEvent("animeria:user-changed", { detail: { user: this.currentUser, stats: this.userStats } }));
      } catch (err) {
        console.warn("Session expired:", err.message);
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem("animeria_auth_token");
        localStorage.removeItem("animeria_current_user");
        this.updateNavbarUser();
      }
    } else {
      this.updateNavbarUser();
    }
  }

  // Inject beautiful liquid glass auth modal into body
  injectAuthModalIfMissing() {
    if (document.getElementById("authModalOverlay")) return;

    const modal = document.createElement("div");
    modal.className = "modal-overlay auth-modal-overlay";
    modal.id = "authModalOverlay";
    modal.innerHTML = `
      <div class="auth-modal" id="authModalContent">
        <div class="auth-header">
          <div class="brand-logo-wrap" style="justify-content: center; margin-bottom: 0.5rem;">
            <img src="assets/logo.png" alt="ANIMERIA" style="height: 28px; width: 28px; border-radius: 50%; mix-blend-mode: lighten;"/>
            <span style="font-family: var(--font-display); font-weight: 900; font-size: 1.25rem; letter-spacing: 0.08em; color: #ffffff;">ANIMERIA</span>
          </div>
          <h3 class="auth-title" id="authModalTitle" data-i18n="auth_title">Giriş Yap & Kayıt Ol</h3>
          <p class="auth-subtitle" id="authModalSubtitle" data-i18n="auth_subtitle">Anime yolculuğunu kaydet, istatistiklerini takip et.</p>
          <button class="btn-icon auth-close-btn" id="closeAuthModalBtn">✕</button>
        </div>

        <!-- Mode Switch: Login vs Register -->
        <div class="auth-mode-switch">
          <button class="mode-switch-btn active" id="authModeLoginBtn" data-i18n="auth_tab_login">Giriş Yap</button>
          <button class="mode-switch-btn" id="authModeRegisterBtn" data-i18n="auth_tab_register">Kayıt Ol</button>
        </div>

        <!-- Email Auth Form -->
        <form id="emailAuthForm" class="auth-form">
          <div class="form-group" id="groupUsername" style="display: none;">
            <label class="form-label" data-i18n="auth_username_label">Kullanıcı Adı</label>
            <input type="text" class="form-input" id="authUsername" placeholder="Kullanıcı adınız..." data-i18n-placeholder="auth_username_placeholder" autocomplete="username"/>
          </div>

          <div class="form-group">
            <label class="form-label" id="labelEmailOrUser" data-i18n="auth_email_label">E-posta veya Kullanıcı Adı</label>
            <input type="text" class="form-input" id="authEmail" placeholder="ornek@animeria.com veya kullanıcı adı" data-i18n-placeholder="auth_email_placeholder" required autocomplete="email"/>
          </div>

          <div class="form-group">
            <label class="form-label" data-i18n="auth_password_label">Şifre</label>
            <input type="password" class="form-input" id="authPassword" placeholder="••••••••" data-i18n-placeholder="auth_password_placeholder" required autocomplete="current-password"/>
          </div>

          <button type="submit" class="btn btn-primary auth-submit-btn" id="emailAuthSubmitBtn">
            <span data-i18n="auth_btn_login">Giriş Yap</span>
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(modal);
    window.I18n.updateDomTexts();
  }

  bindGlobalEvents() {
    // Mode Switch: Login vs Register
    const loginSwitch = document.getElementById("authModeLoginBtn");
    const registerSwitch = document.getElementById("authModeRegisterBtn");
    const groupUsername = document.getElementById("groupUsername");
    const labelEmailOrUser = document.getElementById("labelEmailOrUser");
    const submitBtn = document.getElementById("emailAuthSubmitBtn");

    loginSwitch?.addEventListener("click", () => {
      this.isRegisterMode = false;
      loginSwitch.classList.add("active");
      registerSwitch?.classList.remove("active");
      if (groupUsername) groupUsername.style.display = "none";
      if (labelEmailOrUser) {
        labelEmailOrUser.setAttribute("data-i18n", "auth_email_label");
        labelEmailOrUser.textContent = window.I18n.t("auth_email_label");
      }
      const emailInput = document.getElementById("authEmail");
      if (emailInput) {
        emailInput.setAttribute("data-i18n-placeholder", "auth_email_placeholder");
        emailInput.placeholder = window.I18n.t("auth_email_placeholder");
        emailInput.type = "text";
      }
      if (submitBtn) {
        const span = submitBtn.querySelector("span");
        if (span) {
          span.setAttribute("data-i18n", "auth_btn_login");
          span.textContent = window.I18n.t("auth_btn_login");
        }
      }
    });

    registerSwitch?.addEventListener("click", () => {
      this.isRegisterMode = true;
      registerSwitch.classList.add("active");
      loginSwitch?.classList.remove("active");
      if (groupUsername) groupUsername.style.display = "block";
      if (labelEmailOrUser) {
        labelEmailOrUser.setAttribute("data-i18n", "auth_email_register_label");
        labelEmailOrUser.textContent = window.I18n.t("auth_email_register_label");
      }
      const emailInput = document.getElementById("authEmail");
      if (emailInput) {
        emailInput.setAttribute("data-i18n-placeholder", "auth_email_register_placeholder");
        emailInput.placeholder = window.I18n.t("auth_email_register_placeholder");
        emailInput.type = "email";
      }
      if (submitBtn) {
        const span = submitBtn.querySelector("span");
        if (span) {
          span.setAttribute("data-i18n", "auth_btn_register");
          span.textContent = window.I18n.t("auth_btn_register");
        }
      }
    });

    // Email form submit
    const emailForm = document.getElementById("emailAuthForm");
    emailForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const username = document.getElementById("authUsername")?.value.trim() || email.split("@")[0];

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>`;

        let res;
        if (this.isRegisterMode) {
          res = await window.API.register(username, email, password);
          window.UI.showToast(window.I18n.currentLang === "en" ? "🎉 Account created successfully!" : "🎉 Hesabınız başarıyla oluşturuldu!");
        } else {
          res = await window.API.login(email, password);
          window.UI.showToast((window.I18n.currentLang === "en" ? "👋 Welcome back, " : "👋 Hoş geldiniz, ") + res.user.username);
        }

        this.setSession(res.token, res.user, res.stats);
        this.closeAuthModal();
      } catch (err) {
        window.UI.showToast("Hata / Error: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span data-i18n="${this.isRegisterMode ? 'auth_btn_register' : 'auth_btn_login'}">${window.I18n.t(this.isRegisterMode ? 'auth_btn_register' : 'auth_btn_login')}</span>`;
      }
    });

    // Close button & overlay click
    document.getElementById("closeAuthModalBtn")?.addEventListener("click", () => this.closeAuthModal());
    const overlay = document.getElementById("authModalOverlay");
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) this.closeAuthModal();
    });
  }

  setSession(token, user, stats) {
    this.token = token;
    this.currentUser = user;
    this.userStats = stats;
    localStorage.setItem("animeria_auth_token", token);
    localStorage.setItem("animeria_current_user", JSON.stringify(user));
    this.updateNavbarUser();
    window.dispatchEvent(new CustomEvent("animeria:user-changed", { detail: { user, stats } }));
  }

  async logout() {
    await window.API.logout();
    this.token = null;
    this.currentUser = null;
    this.userStats = null;
    this.updateNavbarUser();
    window.UI.showToast(window.I18n.currentLang === "en" ? "Logged out." : "Çıkış yapıldı.");
    window.dispatchEvent(new CustomEvent("animeria:user-changed", { detail: { user: null, stats: null } }));
    if (window.location.pathname.includes("profile")) {
      window.location.href = "/";
    }
  }

  openAuthModal() {
    const overlay = document.getElementById("authModalOverlay");
    if (!overlay) return;
    overlay.classList.add("active");
    window.I18n.updateDomTexts();
  }

  closeAuthModal() {
    const overlay = document.getElementById("authModalOverlay");
    overlay?.classList.remove("active");
  }

  // Update Navbar user button / avatar & dropdown
  updateNavbarUser() {
    const navActions = document.querySelector(".nav-actions");
    if (!navActions) return;

    let userBtnWrap = document.getElementById("navUserContainer");
    if (!userBtnWrap) {
      userBtnWrap = document.createElement("div");
      userBtnWrap.id = "navUserContainer";
      userBtnWrap.className = "nav-user-container";
      navActions.appendChild(userBtnWrap);
    }

    if (!this.currentUser) {
      userBtnWrap.innerHTML = `
        <button class="btn btn-secondary nav-login-btn" id="navLoginTriggerBtn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span data-i18n="nav_login">${window.I18n.t('nav_login')}</span>
        </button>
      `;
      document.getElementById("navLoginTriggerBtn")?.addEventListener("click", () => {
        this.openAuthModal();
      });
    } else {
      const user = this.currentUser;
      const avatar = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;

      userBtnWrap.innerHTML = `
        <div class="user-nav-dropdown-wrap">
          <button class="user-nav-btn" id="userNavMenuToggleBtn" title="${user.username}">
            <img src="${avatar}" alt="${user.username}" class="nav-user-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}'"/>
            <span class="nav-user-name">${user.username}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="user-nav-menu" id="userNavMenuDropdown">
            <div class="user-nav-menu-header">
              <img src="${avatar}" alt="${user.username}" class="menu-avatar"/>
              <div class="menu-user-info">
                <div class="menu-username">${user.username}</div>
                <div class="menu-email">${user.email || `@${user.username}`}</div>
              </div>
            </div>
            <div class="menu-divider"></div>
            <a href="/profile" class="user-menu-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span data-i18n="nav_profile">${window.I18n.t('nav_profile')}</span>
            </a>
            <a href="/profile#watchlist" class="user-menu-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span data-i18n="nav_my_list">${window.I18n.t('nav_my_list')}</span>
            </a>
            <a href="/profile#import" class="user-menu-item">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span data-i18n="nav_import">${window.I18n.t('nav_import')}</span>
            </a>
            <div class="menu-divider"></div>
            <button class="user-menu-item logout-btn" id="navLogoutBtn">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span data-i18n="nav_logout">${window.I18n.t('nav_logout')}</span>
            </button>
          </div>
        </div>
      `;

      const toggleBtn = document.getElementById("userNavMenuToggleBtn");
      const dropdown = document.getElementById("userNavMenuDropdown");

      toggleBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!userBtnWrap.contains(e.target)) {
          dropdown?.classList.remove("open");
        }
      });

      document.getElementById("navLogoutBtn")?.addEventListener("click", () => {
        this.logout();
      });
    }
  }
}

window.Auth = new AuthManager();

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.Auth.init();
});

/* ==========================================================================
   ANIMERIA — PROFILE & WATCHLIST CONTROLLER
   Interactive Click-to-Edit Avatar/Banner, Preset Picker & Live Analytics
   ========================================================================== */

class ProfileController {
  constructor() {
    this.user = null;
    this.stats = null;
    this.watchlist = [];
    this.activeFilter = "ALL";
    this.searchQuery = "";

    // Image Changer Modal State
    this.currentImageEditTarget = "avatar"; // 'avatar' | 'banner'
    this.selectedImageData = "";

    // High quality preset avatars & banners
    this.presetAvatars = [
      { name: "Satoru Gojo", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80" },
      { name: "Frieren", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80" },
      { name: "Cyber Samurai", url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80" },
      { name: "Monochrome Mecha", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80" },
      { name: "Bot Minimalist", url: "https://api.dicebear.com/7.x/bottts/svg?seed=animeria99" },
      { name: "Otaku Dark", url: "https://api.dicebear.com/7.x/bottts/svg?seed=shadowblade" }
    ];

    this.presetBanners = [
      { name: "Tokyo Cyber Night", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80" },
      { name: "Monochrome Landscape", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80" },
      { name: "Dark Anime Horizon", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80" },
      { name: "Retro Wave Dark", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80" }
    ];
  }

  async init() {
    // Listen for global user change
    window.addEventListener("animeria:user-changed", (e) => {
      this.user = e.detail?.user;
      this.stats = e.detail?.stats;
      this.loadProfileData();
    });

    window.addEventListener("animeria:watchlist-updated", (e) => {
      if (e.detail?.stats) this.stats = e.detail.stats;
      this.loadProfileData();
    });

    window.addEventListener("animeria:lang-changed", () => {
      this.renderUserHeader();
      this.renderStats();
      this.renderAnalytics();
      this.renderWatchlist();
      window.I18n.updateDomTexts();
    });

    this.bindEvents();
    this.bindImageChangerEvents();

    // Initial load
    await this.loadProfileData();
  }

  async loadProfileData() {
    const token = window.API.getToken();
    if (!token) {
      this.renderGuestState();
      return;
    }

    try {
      const data = await window.API.getMe();
      this.user = data.user;
      this.stats = data.stats;
      this.watchlist = data.watchlist || [];

      this.renderUserHeader();
      this.renderStats();
      this.renderAnalytics();
      this.renderWatchlist();
      this.updateTabCounts();
    } catch (err) {
      console.warn("Failed to load profile data:", err);
      this.renderGuestState();
    }
  }

  renderGuestState() {
    const usernameEl = document.getElementById("profileUsername");
    if (usernameEl) usernameEl.textContent = window.I18n.t("profile_guest_title");

    const bioEl = document.getElementById("profileBio");
    if (bioEl) bioEl.textContent = window.I18n.t("profile_guest_bio");

    // Pre-fill local bookmarks if any
    const localBookmarks = JSON.parse(localStorage.getItem("animeria_bookmarks") || "[]");
    const localHistory = JSON.parse(localStorage.getItem("animeria_history") || "[]");

    let totalEpisodes = 0;
    localHistory.forEach(h => totalEpisodes += (h.epNumber || 1));
    const totalHours = ((totalEpisodes * 24) / 60).toFixed(1);

    document.getElementById("statTotalAnime").textContent = localBookmarks.length + localHistory.length;
    document.getElementById("statTotalHours").innerHTML = `${totalHours} <span style="font-size: 1rem; font-weight: 600; color: var(--text-muted);">${window.I18n.t('stat_total_hours')}</span>`;
    document.getElementById("statTotalDaysLabel").textContent = `~${(totalHours / 24).toFixed(1)} ${window.I18n.t('stat_total_days')}`;
    document.getElementById("statTotalEpisodes").textContent = totalEpisodes;
    document.getElementById("statAverageScore").textContent = "8.2";

    const grid = document.getElementById("profileWatchlistGrid");
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-glass-card); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
          <h3 style="color: #ffffff; margin-bottom: 0.5rem;" data-i18n="auth_title">${window.I18n.t('auth_title')}</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 460px; margin: 0 auto 1.5rem auto;" data-i18n="auth_subtitle">
            ${window.I18n.t('auth_subtitle')}
          </p>
          <button class="btn btn-primary" onclick="window.Auth.openAuthModal()">
            <span data-i18n="nav_login">${window.I18n.t('nav_login')}</span>
          </button>
        </div>
      `;
    }
  }

  renderUserHeader() {
    if (!this.user) return;

    const usernameEl = document.getElementById("profileUsername");
    const bioEl = document.getElementById("profileBio");
    const avatarEl = document.getElementById("profileAvatarImg");
    const bannerEl = document.getElementById("profileBannerImg");
    const badgesEl = document.getElementById("profileBadges");

    if (usernameEl) usernameEl.textContent = this.user.username;
    if (bioEl) bioEl.textContent = this.user.bio || "Animeria anime kaşifi 🖤";
    if (avatarEl) {
      avatarEl.src = this.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(this.user.username)}`;
      avatarEl.onerror = () => { avatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(this.user.username)}`; };
    }
    if (bannerEl && this.user.banner) {
      bannerEl.src = this.user.banner;
    }

    if (badgesEl) {
      badgesEl.innerHTML = "";
      if (this.user.anilistUsername) {
        const badge = document.createElement("a");
        badge.className = "profile-social-tag anilist";
        badge.href = `https://anilist.co/user/${encodeURIComponent(this.user.anilistUsername)}`;
        badge.target = "_blank";
        badge.rel = "noreferrer";
        badge.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.361 2.843h-2.722v18.314h2.722v-18.314zm8.639 0h-3.417l-5.583 18.314h3.417l1.361-4.722h6.444l1.361 4.722h3.417l-5.583-18.314zm-.805 10.778h-4.361l2.181-7.556 2.18 7.556z"/></svg>
          <span>@${this.user.anilistUsername}</span>
        `;
        badgesEl.appendChild(badge);
      }

      if (this.user.malUsername) {
        const badge = document.createElement("a");
        badge.className = "profile-social-tag mal";
        badge.href = `https://myanimelist.net/profile/${encodeURIComponent(this.user.malUsername)}`;
        badge.target = "_blank";
        badge.rel = "noreferrer";
        badge.innerHTML = `
          <strong style="font-size: 0.72rem; color: #2e51a2;">MAL</strong>
          <span>@${this.user.malUsername}</span>
        `;
        badgesEl.appendChild(badge);
      }
    }

    // Pre-fill import fields with linked usernames
    const anilistInput = document.getElementById("importAniListUsername");
    if (anilistInput && this.user.anilistUsername) anilistInput.value = this.user.anilistUsername;

    const malInput = document.getElementById("importMALUsername");
    if (malInput && this.user.malUsername) malInput.value = this.user.malUsername;
  }

  renderStats() {
    if (!this.stats) return;

    const totalAnime = this.stats.totalAnime || 0;
    const totalHours = this.stats.totalHours || 0;
    const totalDays = this.stats.totalDays || 0;
    const totalEpisodes = this.stats.totalEpisodes || 0;
    const avgScore = this.stats.averageScore ? `${this.stats.averageScore} / 10` : "—";

    document.getElementById("statTotalAnime").textContent = totalAnime;
    document.getElementById("statTotalHours").innerHTML = `${totalHours} <span style="font-size: 1rem; font-weight: 600; color: var(--text-muted);">${window.I18n.t('stat_total_hours')}</span>`;
    document.getElementById("statTotalDaysLabel").textContent = `~${totalDays} ${window.I18n.t('stat_total_days')}`;
    document.getElementById("statTotalEpisodes").textContent = totalEpisodes;
    document.getElementById("statAverageScore").textContent = avgScore;
  }

  renderAnalytics() {
    if (!this.stats) return;

    // Status Breakdown
    const breakdownList = document.getElementById("statusBreakdownList");
    if (breakdownList) {
      const counts = this.stats.statusCounts || { WATCHING: 0, COMPLETED: 0, PLANNING: 0, PAUSED: 0, DROPPED: 0 };
      const total = Math.max(1, this.stats.totalAnime || 0);

      const items = [
        { key: "COMPLETED", label: window.I18n.t('status_completed'), count: counts.COMPLETED || 0, colorClass: "completed" },
        { key: "WATCHING", label: window.I18n.t('status_watching'), count: counts.WATCHING || 0, colorClass: "watching" },
        { key: "PLANNING", label: window.I18n.t('status_planning'), count: counts.PLANNING || 0, colorClass: "planning" },
        { key: "PAUSED", label: window.I18n.t('status_paused'), count: counts.PAUSED || 0, colorClass: "paused" },
        { key: "DROPPED", label: window.I18n.t('status_dropped'), count: counts.DROPPED || 0, colorClass: "dropped" }
      ];

      breakdownList.innerHTML = items.map(item => {
        const pct = Math.round((item.count / total) * 100);
        return `
          <div class="breakdown-row">
            <div class="breakdown-info">
              <span style="color: var(--text-medium);">${item.label}</span>
              <span style="color: #ffffff; font-family: var(--font-mono); font-size: 0.8rem;">${item.count} anime (${pct}%)</span>
            </div>
            <div class="breakdown-bar">
              <div class="breakdown-fill ${item.colorClass}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Genres Cloud
    const genreCloud = document.getElementById("genreTagCloud");
    if (genreCloud) {
      const topGenres = this.stats.topGenres || [];
      if (!topGenres.length) {
        genreCloud.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">Henüz tür verisi yok. MAL veya AniList listenizi içe aktarın.</span>`;
      } else {
        genreCloud.innerHTML = topGenres.map(g => `
          <div class="genre-stat-tag">
            <span>${g.name}</span>
            <span class="count">${g.count}</span>
          </div>
        `).join("");
      }
    }
  }

  updateTabCounts() {
    const list = this.watchlist;
    const countAll = list.length;
    const countWatching = list.filter(e => e.status === "WATCHING").length;
    const countCompleted = list.filter(e => e.status === "COMPLETED").length;
    const countPlanning = list.filter(e => e.status === "PLANNING").length;
    const countDropped = list.filter(e => e.status === "DROPPED").length;

    document.getElementById("countAll").textContent = countAll;
    document.getElementById("countWatching").textContent = countWatching;
    document.getElementById("countCompleted").textContent = countCompleted;
    document.getElementById("countPlanning").textContent = countPlanning;
    document.getElementById("countDropped").textContent = countDropped;
  }

  renderWatchlist() {
    const grid = document.getElementById("profileWatchlistGrid");
    if (!grid) return;

    let filtered = this.watchlist;

    if (this.activeFilter !== "ALL") {
      filtered = filtered.filter(item => item.status === this.activeFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title?.english || item.title?.romaji || "").toLowerCase();
        return title.includes(q);
      });
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          Bu kategoride henüz anime bulunmuyor.
        </div>
      `;
      return;
    }

    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    filtered.forEach(entry => {
      const title = entry.title?.english || entry.title?.romaji || "Anime";
      const cover = entry.coverImage?.large || entry.coverImage?.medium || entry.coverImage?.extraLarge || "";
      const currentProgress = entry.progress || 0;
      const totalEpisodes = entry.episodesTotal || "?";
      const score = entry.score ? `★ ${entry.score}` : "—";
      const status = entry.status || "WATCHING";

      const card = document.createElement("div");
      card.className = "watchlist-entry-card";
      card.innerHTML = `
        <img src="${cover}" alt="${title}" class="watchlist-entry-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80';"/>
        <div class="watchlist-entry-info">
          <div>
            <div class="watchlist-entry-title" title="${title}">${title}</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <span class="mono-tag score" style="font-size: 0.68rem; padding: 0.1rem 0.35rem;">${score}</span>
              <span class="mono-tag outlined" style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">${status}</span>
            </div>
          </div>

          <div class="watchlist-progress-stepper">
            <span>${window.I18n.t('episodes')}: <strong>${currentProgress}</strong> / ${totalEpisodes}</span>
            <button class="step-btn btn-step-minus" title="Bölüm Azalt">-</button>
            <button class="step-btn btn-step-plus" title="Bölüm Artır">+</button>
          </div>

          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button class="btn btn-primary btn-play-entry" style="flex: 1; padding: 0.35rem 0.6rem; font-size: 0.78rem;">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <span>${window.I18n.t('btn_step_watch')}</span>
            </button>
            <button class="btn-icon btn-remove-entry" title="Listeden Kaldır" style="width: 28px; height: 28px;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;

      // Play button
      card.querySelector(".btn-play-entry")?.addEventListener("click", () => {
        const ep = Math.max(1, currentProgress);
        window.location.href = `/watch?id=${entry.animeId}&ep=${ep}`;
      });

      // Step Plus
      card.querySelector(".btn-step-plus")?.addEventListener("click", async () => {
        const nextProgress = currentProgress + 1;
        const isCompleted = typeof totalEpisodes === "number" && totalEpisodes > 0 && nextProgress >= totalEpisodes;
        entry.progress = nextProgress;
        if (isCompleted) entry.status = "COMPLETED";
        await window.API.updateWatchlistItem(entry);
        this.loadProfileData();
      });

      // Step Minus
      card.querySelector(".btn-step-minus")?.addEventListener("click", async () => {
        if (currentProgress <= 0) return;
        entry.progress = currentProgress - 1;
        await window.API.updateWatchlistItem(entry);
        this.loadProfileData();
      });

      // Remove button
      card.querySelector(".btn-remove-entry")?.addEventListener("click", async () => {
        if (confirm(`"${title}" listenden kaldırılsın mı?`)) {
          await window.API.removeWatchlistItem(entry.animeId);
          window.UI.showToast("Anime listeden kaldırıldı.");
          this.loadProfileData();
        }
      });

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  // --- INTERACTIVE AVATAR & BANNER CHANGER ---
  bindImageChangerEvents() {
    const modal = document.getElementById("quickImageModalOverlay");
    const avatarWrap = document.getElementById("profileAvatarWrap");
    const bannerWrap = document.getElementById("profileBannerWrap");
    const closeBtn = document.getElementById("closeQuickImageModalBtn");

    avatarWrap?.addEventListener("click", () => {
      if (!this.user) {
        window.Auth.openAuthModal();
        return;
      }
      this.openImageChanger("avatar");
    });

    bannerWrap?.addEventListener("click", () => {
      if (!this.user) {
        window.Auth.openAuthModal();
        return;
      }
      this.openImageChanger("banner");
    });

    closeBtn?.addEventListener("click", () => {
      modal?.classList.remove("active");
    });

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });

    // Image Modal Tab Switching
    const tabPresetsBtn = document.getElementById("imgTabPresetsBtn");
    const tabUrlBtn = document.getElementById("imgTabUrlBtn");
    const tabUploadBtn = document.getElementById("imgTabUploadBtn");
    const panelPresets = document.getElementById("imgPanelPresets");
    const panelUrl = document.getElementById("imgPanelUrl");
    const panelUpload = document.getElementById("imgPanelUpload");

    const switchImgTab = (activeTab) => {
      tabPresetsBtn?.classList.toggle("active", activeTab === "presets");
      tabUrlBtn?.classList.toggle("active", activeTab === "url");
      tabUploadBtn?.classList.toggle("active", activeTab === "upload");

      if (panelPresets) panelPresets.style.display = activeTab === "presets" ? "block" : "none";
      if (panelUrl) panelUrl.style.display = activeTab === "url" ? "block" : "none";
      if (panelUpload) panelUpload.style.display = activeTab === "upload" ? "block" : "none";
    };

    tabPresetsBtn?.addEventListener("click", () => switchImgTab("presets"));
    tabUrlBtn?.addEventListener("click", () => switchImgTab("url"));
    tabUploadBtn?.addEventListener("click", () => switchImgTab("upload"));

    // Live URL Input Preview
    const urlInput = document.getElementById("quickImageUrlInput");
    const previewImg = document.getElementById("quickImagePreviewImg");
    urlInput?.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      this.selectedImageData = val;
      if (val) {
        previewImg.src = val;
        previewImg.style.display = "block";
      } else {
        previewImg.style.display = "none";
      }
    });

    // Local File Upload with FileReader -> Base64
    const fileInput = document.getElementById("quickImageFileInput");
    const dropzone = document.getElementById("quickImageDropzone");
    const browseBtn = document.getElementById("btnBrowseFile");

    browseBtn?.addEventListener("click", () => fileInput?.click());
    dropzone?.addEventListener("click", (e) => {
      if (e.target !== browseBtn) fileInput?.click();
    });

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        this.selectedImageData = loadEvt.target.result;
        switchImgTab("url");
        if (urlInput) urlInput.value = "(Yerel Resim Yüklendi)";
        if (previewImg) {
          previewImg.src = this.selectedImageData;
          previewImg.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });

    // Save Quick Image Button
    const saveBtn = document.getElementById("btnSaveQuickImage");
    saveBtn?.addEventListener("click", async () => {
      if (!this.selectedImageData) {
        window.UI.showToast("Lütfen bir görsel seçin veya URL girin.");
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>`;

        const updates = {};
        if (this.currentImageEditTarget === "avatar") {
          updates.avatar = this.selectedImageData;
        } else {
          updates.banner = this.selectedImageData;
        }

        const res = await window.API.updateProfile(updates);
        this.user = res.user;
        window.Auth.currentUser = res.user;
        window.Auth.updateNavbarUser();
        this.renderUserHeader();

        window.UI.showToast(this.currentImageEditTarget === "avatar" ? "Avatar başarıyla güncellendi!" : "Banner başarıyla güncellendi!");
        modal?.classList.remove("active");
      } catch (err) {
        window.UI.showToast("Hata: " + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span data-i18n="img_save_btn">${window.I18n.t('img_save_btn')}</span>`;
      }
    });
  }

  openImageChanger(targetType = "avatar") {
    this.currentImageEditTarget = targetType;
    this.selectedImageData = "";

    const modal = document.getElementById("quickImageModalOverlay");
    const title = document.getElementById("quickImageModalTitle");
    const galleryGrid = document.getElementById("presetGalleryGrid");
    const urlInput = document.getElementById("quickImageUrlInput");
    const previewImg = document.getElementById("quickImagePreviewImg");

    if (urlInput) urlInput.value = "";
    if (previewImg) previewImg.style.display = "none";

    const isAvatar = targetType === "avatar";
    if (title) title.textContent = isAvatar ? (window.I18n.currentLang === "en" ? "Change Avatar Photo" : "Profil Fotoğrafını Değiştir") : (window.I18n.currentLang === "en" ? "Change Profile Banner" : "Profil Bannerini Değiştir");

    // Populate preset gallery
    const presets = isAvatar ? this.presetAvatars : this.presetBanners;
    if (galleryGrid) {
      galleryGrid.innerHTML = presets.map((p, idx) => `
        <div class="preset-item ${isAvatar ? 'avatar-preset' : 'banner-preset'}" data-url="${p.url}">
          <img src="${p.url}" alt="${p.name}"/>
          <span>${p.name}</span>
        </div>
      `).join("");

      galleryGrid.querySelectorAll(".preset-item").forEach(item => {
        item.addEventListener("click", () => {
          galleryGrid.querySelectorAll(".preset-item").forEach(i => i.classList.remove("selected"));
          item.classList.add("selected");
          this.selectedImageData = item.getAttribute("data-url");
        });
      });
    }

    modal?.classList.add("active");
  }

  bindEvents() {
    // Tab switching in Watchlist section
    document.querySelectorAll(".profile-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".profile-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeFilter = btn.getAttribute("data-filter");
        this.renderWatchlist();
      });
    });

    // Search filter input
    const searchInput = document.getElementById("watchlistSearchInput");
    searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim();
      this.renderWatchlist();
    });

    // Quick scroll to Import Hub
    document.getElementById("openImportHubBtn")?.addEventListener("click", () => {
      const hub = document.getElementById("importHubSection");
      hub?.scrollIntoView({ behavior: "smooth" });
    });

    // AniList Import Form
    const anilistForm = document.getElementById("aniListImportForm");
    anilistForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("importAniListUsername").value.trim();
      if (!username) return;

      const btn = document.getElementById("btnRunAniListImport");
      try {
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div> Aktarılıyor...`;

        const res = await window.API.importAniList(username);
        window.UI.showToast(`✅ ${res.message || 'AniList listesi aktarıldı!'}`);
        this.stats = res.stats;
        await this.loadProfileData();
      } catch (err) {
        window.UI.showToast("İçe aktarma hatası: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Listeyi Senkronize Et & İçe Aktar</span>`;
      }
    });

    // MyAnimeList Import Form
    const malForm = document.getElementById("malImportForm");
    malForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("importMALUsername").value.trim();
      if (!username) return;

      const btn = document.getElementById("btnRunMALImport");
      try {
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div> Aktarılıyor...`;

        const res = await window.API.importMyAnimeList(username);
        window.UI.showToast(`✅ ${res.message || 'MyAnimeList listesi aktarıldı!'}`);
        this.stats = res.stats;
        await this.loadProfileData();
      } catch (err) {
        window.UI.showToast("İçe aktarma hatası: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>MyAnimeList'ten İçe Aktar</span>`;
      }
    });

    // Edit Profile Modal
    const editModal = document.getElementById("editProfileModalOverlay");
    const openEditBtn = document.getElementById("openEditProfileModalBtn");
    const closeEditBtn = document.getElementById("closeEditProfileModalBtn");

    openEditBtn?.addEventListener("click", () => {
      if (!this.user) {
        window.Auth.openAuthModal();
        return;
      }
      document.getElementById("editUsername").value = this.user.username || "";
      document.getElementById("editBio").value = this.user.bio || "";
      document.getElementById("editAvatar").value = this.user.avatar || "";
      document.getElementById("editBanner").value = this.user.banner || "";
      document.getElementById("editAnilistUsername").value = this.user.anilistUsername || "";
      document.getElementById("editMalUsername").value = this.user.malUsername || "";
      editModal?.classList.add("active");
    });

    closeEditBtn?.addEventListener("click", () => {
      editModal?.classList.remove("active");
    });

    editModal?.addEventListener("click", (e) => {
      if (e.target === editModal) editModal.classList.remove("active");
    });

    const editForm = document.getElementById("editProfileForm");
    editForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("saveProfileBtn");

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>`;

        const updates = {
          username: document.getElementById("editUsername").value.trim(),
          bio: document.getElementById("editBio").value.trim(),
          avatar: document.getElementById("editAvatar").value.trim(),
          banner: document.getElementById("editBanner").value.trim(),
          anilistUsername: document.getElementById("editAnilistUsername").value.trim(),
          malUsername: document.getElementById("editMalUsername").value.trim()
        };

        const res = await window.API.updateProfile(updates);
        this.user = res.user;
        this.stats = res.stats;
        window.Auth.currentUser = res.user;
        window.Auth.updateNavbarUser();
        window.UI.showToast("Profil başarıyla güncellendi!");
        editModal?.classList.remove("active");
        this.renderUserHeader();
      } catch (err) {
        window.UI.showToast("Güncelleme hatası: " + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>Değişiklikleri Kaydet</span>`;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.Profile = new ProfileController();
  window.Profile.init();
});

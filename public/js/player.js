/* ==========================================================================
   ANIMERIA — LIQUID GLASS VIDEO PLAYER & IMAGE-2 DECK CONTROLLER
   Clean Transparent Subtitles & Instant Frame Reset on Anime Transition
   ========================================================================== */

class AnimeriaPlayer {
  constructor() {
    this.video = document.getElementById("mainPlayerVideo");
    this.embedIframe = document.getElementById("playerEmbedIframe");
    this.wrapper = document.getElementById("playerWrapper");
    this.loader = document.getElementById("playerLoader");
    this.skipBtn = document.getElementById("skipIntroBtn");
    this.subtitleOverlay = document.getElementById("playerCustomSubtitles");
    
    // Scrubber elements
    this.scrubberContainer = document.getElementById("scrubberContainer");
    this.scrubberProgress = document.getElementById("scrubberProgress");
    this.scrubberBuffer = document.getElementById("scrubberBuffer");
    this.scrubberThumb = document.getElementById("scrubberThumb");
    this.scrubberTooltip = document.getElementById("scrubberTooltip");
    this.markersContainer = document.getElementById("scrubberMarkersContainer");
    
    // Control buttons
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.muteBtn = document.getElementById("muteBtn");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.timeDisplay = document.getElementById("timeDisplay");
    this.theaterBtn = document.getElementById("theaterModeBtn");
    this.pipBtn = document.getElementById("pipBtn");
    this.fullscreenBtn = document.getElementById("fullscreenBtn");
    this.nextEpBtn = document.getElementById("nextEpBtn");
    this.prevEpBtn = document.getElementById("prevEpBtn");
    this.subSettingsBtn = document.getElementById("subSettingsBtn");
    
    // Subtitle Modal Elements
    this.subModalOverlay = document.getElementById("subSettingsModalOverlay");
    this.closeSubModalBtn = document.getElementById("closeSubSettingsBtn");
    this.subPreviewText = document.getElementById("subLivePreviewText");
    
    // Title elements
    this.epTitleEl = document.getElementById("playerEpTitle");
    this.animeTitleEl = document.getElementById("playerAnimeName");
    
    // Image 2 Style Dropdown Triggers & Menus
    this.audioPillBtn = document.getElementById("audioDropdownBtn");
    this.serverPillBtn = document.getElementById("serverDropdownBtn");
    this.audioMenu = document.getElementById("audioDropdownMenu");
    this.serverMenu = document.getElementById("serverDropdownMenu");
    this.serverCountBadge = document.getElementById("serverCountBadge");
    this.currentServerNameEl = document.getElementById("currentServerNameText");
    this.currentAudioNameEl = document.getElementById("currentAudioNameText");
    
    // State
    this.hls = null;
    this.currentAnime = null;

    // Quality selector state
    this.qualityBtn = document.getElementById("qualityBtn");
    this.qualityMenu = document.getElementById("qualityDropdownMenu");
    this.currentQualityLevel = -1; // -1 = Auto
    this.currentEpNumber = 1;
    this.currentProvider = "animedunya";
    this.currentAudio = "sub";
    this.allProvidersData = {};
    this.currentStreamData = null;
    this.availableSubtitles = [];
    this.activeParsedCues = [];
    this.selectedSubUrl = null;
    this.isSeeking = false;
    this.idleTimer = null;
    this.introStart = null;
    this.introEnd = null;
    this.outroStart = null;
    this.outroEnd = null;

    // Subtitle Customization State (Transparent Background as Clean Default)
    this.subConfig = JSON.parse(localStorage.getItem("animeria_sub_customization") || JSON.stringify({
      size: 20,
      weight: "700",
      color: "#ffffff",
      bg: "transparent",
      shadow: "stroke",
      bottom: 60,
      fontFamily: "Outfit"
    }));
    // Merge with defaults so new fields are present in old saves
    const _subDefaults = { size: 20, weight: "700", color: "#ffffff", bg: "transparent", shadow: "stroke", bottom: 60, fontFamily: "Outfit" };
    this.subConfig = Object.assign({}, _subDefaults, this.subConfig);
    // Migrate old "20px" string format to plain number
    if (typeof this.subConfig.size === "string") {
      this.subConfig.size = parseInt(this.subConfig.size) || 20;
    }

    // Anonymized Server Codename Map (Never reveals scraper domains!)
    this.serverCodenameMap = {
      animedunya: { name: "bee", tags: ["S-SUB"], isTr: true },
      reanime:    { name: "pewe", tags: ["H-SUB"], isTr: false },
      "2dhive":   { name: "hop", tags: ["S-SUB"], isTr: false },
      kaa:        { name: "ally", tags: ["DL", "H-SUB"], isTr: false },
      anidbapp:   { name: "kiwi", tags: ["DL", "H-SUB"], isTr: false },
      anikoto:    { name: "bonk", tags: ["DL", "S-SUB"], isTr: false },
      animegg:    { name: "bonk", tags: ["DL", "H-SUB"], isTr: false },
      anineko:    { name: "nun", tags: ["EMBED", "H-SUB"], isTr: false },
      senshi:     { name: "bun", tags: ["EMBED", "S-SUB"], isTr: false },
      mkissa:     { name: "twin", tags: ["EMBED", "H-SUB"], isTr: false }
    };
    // Server failure tracker for automatic fallback
    this.failedServers = new Set();

    // User Playback Preferences (Autoplay, Auto Next, Auto Skip)
    this.prefAutoplay = localStorage.getItem("animeria_pref_autoplay") !== "false";
    this.prefAutoNext = localStorage.getItem("animeria_pref_autonext") !== "false";
    this.prefAutoSkip = localStorage.getItem("animeria_pref_autoskip") !== "false";
    this.autoSkipNotificationShown = false;

    this.initEvents();
    this.initSubtitleCustomizer();
    this.initPlaybackPreferences();
  }

  initEvents() {
    if (!this.video) return;

    // Video playback events
    this.video.addEventListener("play", () => this.updatePlayIcon(true));
    this.video.addEventListener("pause", () => this.updatePlayIcon(false));
    this.video.addEventListener("timeupdate", () => this.onTimeUpdate());
    this.video.addEventListener("progress", () => this.onProgress());
    this.video.addEventListener("waiting", () => this.loader.classList.add("active"));
    this.video.addEventListener("playing", () => this.loader.classList.remove("active"));
    this.video.addEventListener("ended", () => this.onEnded());
    this.video.addEventListener("loadedmetadata", () => {
      this.onMetadataLoaded();
      this.renderScrubberMarkers();
    });
    this.video.addEventListener("durationchange", () => this.renderScrubberMarkers());

    // Play/Pause button
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.video.addEventListener("click", () => this.togglePlay());

    // Scrubber interaction
    this.scrubberContainer.addEventListener("mousedown", (e) => this.startSeek(e));
    window.addEventListener("mousemove", (e) => {
      if (this.isSeeking) this.seek(e);
      this.updateTooltip(e);
    });
    window.addEventListener("mouseup", () => {
      if (this.isSeeking) this.isSeeking = false;
    });

    // Volume
    this.volumeSlider.addEventListener("input", (e) => {
      this.video.volume = parseFloat(e.target.value);
      this.video.muted = (this.video.volume === 0);
      this.updateMuteIcon();
    });
    // Screen modes
    this.theaterBtn?.addEventListener("click", () => this.toggleTheater());
    this.pipBtn?.addEventListener("click", () => this.togglePip());
    this.fullscreenBtn?.addEventListener("click", () => this.toggleFullscreen());

    // Subtitle Customizer Modal Trigger
    if (this.subSettingsBtn && this.subModalOverlay) {
      this.subSettingsBtn.addEventListener("click", () => {
        this.subModalOverlay.classList.add("active");
        this.updateSubtitleSettingsUI();
      });
      this.closeSubModalBtn.addEventListener("click", () => {
        this.subModalOverlay.classList.remove("active");
      });
      this.subModalOverlay.addEventListener("click", (e) => {
        if (e.target === this.subModalOverlay) this.subModalOverlay.classList.remove("active");
      });
    }

    // Next / Prev Episode
    this.nextEpBtn?.addEventListener("click", () => this.changeEpisode(this.currentEpNumber + 1));
    this.prevEpBtn?.addEventListener("click", () => this.changeEpisode(this.currentEpNumber - 1));

    // Skip Intro button
    if (this.skipBtn) {
      this.skipBtn.addEventListener("click", () => {
        if (this.introEnd && this.video.currentTime < this.introEnd) {
          this.video.currentTime = this.introEnd;
          window.UI?.showToast("İntro atlandı ⏭️");
        } else if (this.outroEnd && this.video.currentTime < this.outroEnd) {
          this.video.currentTime = this.outroEnd;
          window.UI?.showToast("Outro atlandı ⏭️");
        } else {
          this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 85);
        }
        this.skipBtn.classList.remove("visible");
      });
    }

    // Dropdown Toggles (Matching Image 2)
    if (this.audioPillBtn && this.audioMenu) {
      this.audioPillBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.audioMenu.classList.contains("open");
        this.closeAllDropdowns();
        if (!isOpen) {
          this.audioMenu.classList.add("open");
          this.audioPillBtn.classList.add("open");
        }
      });
    }

    if (this.serverPillBtn && this.serverMenu) {
      this.serverPillBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.serverMenu.classList.contains("open");
        this.closeAllDropdowns();
        if (!isOpen) {
          this.serverMenu.classList.add("open");
          this.serverPillBtn.classList.add("open");
        }
      });
    }

    // Quality selector dropdown toggle
    if (this.qualityBtn && this.qualityMenu) {
      this.qualityBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.qualityMenu.classList.contains("open");
        this.closeAllDropdowns();
        if (!isOpen) {
          this.qualityMenu.classList.add("open");
          this.qualityBtn.classList.add("open");
        }
      });
    }

    // Close dropdowns on outside click
    window.addEventListener("click", () => this.closeAllDropdowns());

    // Activity / Idle auto-hide
    this.wrapper.addEventListener("mousemove", () => this.resetIdleTimer());
    this.wrapper.addEventListener("mouseleave", () => this.wrapper.classList.add("idle"));

    // Global keyboard shortcuts
    window.addEventListener("keydown", (e) => this.handleKeyboard(e));
  }

  /* Reset Old Anime Frame & Buffers on Transition */
  resetPlayerState() {
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
    }
    if (this.embedIframe) {
      this.embedIframe.src = "";
      this.embedIframe.style.display = "none";
    }
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.clearSubtitleOverlay();
    this.activeParsedCues = [];
    this.selectedSubUrl = null;
    this.currentStreamData = null;
    if (this.loader) this.loader.classList.add("active");
    if (this.skipBtn) this.skipBtn.classList.remove("visible");
    if (this.scrubberProgress) this.scrubberProgress.style.width = "0%";
    if (this.timeDisplay) this.timeDisplay.textContent = "00:00 / 00:00";
    if (this.epTitleEl) this.epTitleEl.textContent = "Yükleniyor...";
    if (this.animeTitleEl) this.animeTitleEl.textContent = "";
    // Reset quality selector state
    this.currentQualityLevel = -1;
    if (this.qualityMenu) this.qualityMenu.innerHTML = "";
    if (this.qualityBtn) this.qualityBtn.style.display = "none";
  }

  /* Subtitle Customizer Manager */
  initSubtitleCustomizer() {
    this.applySubtitleStyles();

    // Bind size pills
    document.querySelectorAll("#subFontSizeRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.size = p.getAttribute("data-size");
        this.saveSubConfig();
      });
    });

    // Bind weight pills
    document.querySelectorAll("#subWeightRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.weight = p.getAttribute("data-weight");
        this.saveSubConfig();
      });
    });

    // Bind color pills
    document.querySelectorAll("#subColorRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.color = p.getAttribute("data-color");
        this.saveSubConfig();
      });
    });

    // Bind bg pills
    document.querySelectorAll("#subBgRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.bg = p.getAttribute("data-bg");
        this.saveSubConfig();
      });
    });

    // Bind shadow pills
    document.querySelectorAll("#subShadowRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.shadow = p.getAttribute("data-shadow");
        this.saveSubConfig();
      });
    });

    // Font size range slider
    const sizeSlider = document.getElementById("subFontSizeSlider");
    const sizeDisplay = document.getElementById("subFontSizeDisplay");
    if (sizeSlider) {
      sizeSlider.value = this.subConfig.size;
      sizeSlider.addEventListener("input", () => {
        this.subConfig.size = parseInt(sizeSlider.value);
        if (sizeDisplay) sizeDisplay.textContent = `${this.subConfig.size}px`;
        this.saveSubConfig();
      });
      if (sizeDisplay) sizeDisplay.textContent = `${this.subConfig.size}px`;
    }

    // Position range slider
    const posSlider = document.getElementById("subPositionSlider");
    const posDisplay = document.getElementById("subPositionDisplay");
    if (posSlider) {
      posSlider.value = Math.min(40, Math.max(4, this.subConfig.bottom));
      posSlider.addEventListener("input", () => {
        this.subConfig.bottom = parseInt(posSlider.value);
        if (posDisplay) posDisplay.textContent = `${this.subConfig.bottom}px`;
        this.saveSubConfig();
      });
      if (posDisplay) posDisplay.textContent = `${this.subConfig.bottom}px`;
    }

    // Font family pills
    document.querySelectorAll("#subFontFamilyRow .setting-pill").forEach(p => {
      p.addEventListener("click", () => {
        this.subConfig.fontFamily = p.getAttribute("data-font");
        this.saveSubConfig();
      });
    });
  }

  saveSubConfig() {
    localStorage.setItem("animeria_sub_customization", JSON.stringify(this.subConfig));
    this.applySubtitleStyles();
    this.updateSubtitleSettingsUI();
  }

  applySubtitleStyles() {
    const root = document.documentElement;
    root.style.setProperty("--sub-size", `${this.subConfig.size}px`);
    root.style.setProperty("--sub-weight", this.subConfig.weight);
    root.style.setProperty("--sub-color", this.subConfig.color);
    root.style.setProperty("--sub-bg", this.subConfig.bg);
    root.style.setProperty("--sub-font", this.subConfig.fontFamily || "Outfit");

    let shadowCss = "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 6px rgba(0,0,0,0.9)";
    if (this.subConfig.shadow === "soft") {
      shadowCss = "0 2px 4px rgba(0, 0, 0, 0.95), 0 0 4px #000000";
    } else if (this.subConfig.shadow === "glow") {
      shadowCss = `0 0 10px ${this.subConfig.color}, 0 2px 4px rgba(0,0,0,0.9)`;
    }
    root.style.setProperty("--sub-shadow", shadowCss);

    // Apply bottom position to subtitle overlay
    if (this.subtitleOverlay) {
      this.subtitleOverlay.style.bottom = `${this.subConfig.bottom}px`;
    }

    // Update live preview pill
    if (this.subPreviewText) {
      this.subPreviewText.style.fontSize = `${this.subConfig.size}px`;
      this.subPreviewText.style.fontFamily = this.subConfig.fontFamily || "Outfit";
      this.subPreviewText.style.fontWeight = this.subConfig.weight;
      this.subPreviewText.style.color = this.subConfig.color;
      this.subPreviewText.style.background = this.subConfig.bg;
      this.subPreviewText.style.textShadow = shadowCss;
    }
  }

  updateSubtitleSettingsUI() {
    document.querySelectorAll("#subFontSizeRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-size") === this.subConfig.size);
    });
    document.querySelectorAll("#subWeightRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-weight") === this.subConfig.weight);
    });
    document.querySelectorAll("#subColorRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-color") === this.subConfig.color);
    });
    document.querySelectorAll("#subBgRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-bg") === this.subConfig.bg);
    });
    document.querySelectorAll("#subShadowRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-shadow") === this.subConfig.shadow);
    });

    // Sync font size slider
    const sizeSlider = document.getElementById("subFontSizeSlider");
    const sizeDisplay = document.getElementById("subFontSizeDisplay");
    if (sizeSlider) sizeSlider.value = this.subConfig.size;
    if (sizeDisplay) sizeDisplay.textContent = `${this.subConfig.size}px`;

    // Sync position slider
    const posSlider = document.getElementById("subPositionSlider");
    const posDisplay = document.getElementById("subPositionDisplay");
    if (posSlider) posSlider.value = Math.min(40, Math.max(4, this.subConfig.bottom));
    if (posDisplay) posDisplay.textContent = `${this.subConfig.bottom}px`;

    // Sync font family pills
    document.querySelectorAll("#subFontFamilyRow .setting-pill").forEach(p => {
      p.classList.toggle("active", p.getAttribute("data-font") === this.subConfig.fontFamily);
    });
  }

  closeAllDropdowns() {
    if (this.audioMenu) this.audioMenu.classList.remove("open");
    if (this.serverMenu) this.serverMenu.classList.remove("open");
    if (this.audioPillBtn) this.audioPillBtn.classList.remove("open");
    if (this.serverPillBtn) this.serverPillBtn.classList.remove("open");
    if (this.qualityMenu) this.qualityMenu.classList.remove("open");
    if (this.qualityBtn) this.qualityBtn.classList.remove("open");
  }

  async loadEpisode(anime, epNumber = 1) {
    // 1. Immediately reset previous anime video buffer and text
    if (this.wrapper) this.wrapper.classList.remove("is-embed-mode");
    this.failedServers.clear();
    this.autoSkipNotificationShown = false;

    this.currentAnime = anime;
    this.currentEpNumber = parseInt(epNumber) || 1;

    // Show watch container & close modals
    const watchEl = document.getElementById("watchContainer");
    if (watchEl) watchEl.classList.add("active");
    const modalEl = document.getElementById("detailsModalOverlay");
    if (modalEl) modalEl.classList.remove("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update titles
    const animeTitle = anime.title?.english || anime.title?.romaji || "Anime";
    if (this.animeTitleEl) this.animeTitleEl.textContent = animeTitle;
    if (this.epTitleEl) this.epTitleEl.textContent = `${window.I18n ? window.I18n.t('episodes') : 'Bölüm'} ${this.currentEpNumber}`;

    // Dispatch global episode changed event for comments and sync
    window.dispatchEvent(new CustomEvent("animeria:episode-changed", {
      detail: { animeId: this.currentAnime.id, epNumber: this.currentEpNumber, anime: this.currentAnime }
    }));

    // Fetch accurate AniSkip opening/ending timestamps in background
    this.fetchSkipTimes(anime.id, this.currentEpNumber);

    // Fetch and render Franchise Chronological Watch Order Timeline
    this.loadWatchOrder(anime.id);

    try {
      // 2. Fetch multi-provider episode list (with instant in-memory client cache)
      if (!this._episodesCache) this._episodesCache = new Map();
      let epData = this._episodesCache.get(anime.id);
      if (!epData) {
        epData = await window.API.getEpisodes(anime.id);
        this._episodesCache.set(anime.id, epData);
      }
      this.allProvidersData = epData;

      // Render episodes sidebar list
      this.renderEpisodesSidebar();

      // Render Image-2 Dropdowns
      this.renderDropdownDeck();

      // 3. Play episode with selected provider
      await this.resolveAndPlay();

      // Save to watch history
      this.saveHistory();
    } catch (err) {
      console.error("Load episode failed:", err);
      window.UI.showToast("Bölüm yüklenirken bir hata oluştu: " + err.message);
      this.loader.classList.remove("active");
    }
  }

  async fetchSkipTimes(animeId, epNumber) {
    this.introStart = null;
    this.introEnd = null;
    this.outroStart = null;
    this.outroEnd = null;
    this.isMixedIntro = false;
    this.isMixedOutro = false;

    try {
      const skipData = await window.API.getSkipTimes(animeId, epNumber);
      if (skipData && skipData.found) {
        if (skipData.introStart !== null && skipData.introStart !== undefined && !skipData.isMixedIntro) {
          this.introStart = parseFloat(skipData.introStart);
          this.introEnd = parseFloat(skipData.introEnd);
        }
        if (skipData.outroStart !== null && skipData.outroStart !== undefined && !skipData.isMixedOutro) {
          this.outroStart = parseFloat(skipData.outroStart);
          this.outroEnd = parseFloat(skipData.outroEnd);
        }
        this.isMixedIntro = Boolean(skipData.isMixedIntro);
        this.isMixedOutro = Boolean(skipData.isMixedOutro);

        if (this.isMixedIntro) {
          console.log(`[AniSkip] Ep ${epNumber} has story-integrated credits (mixed-op) - auto-skip safely disabled.`);
        }
        console.log(`[AniSkip] Active skip times for ep ${epNumber}: Intro [${this.introStart}s -> ${this.introEnd}s], Outro [${this.outroStart}s -> ${this.outroEnd}s]`);
        this.renderScrubberMarkers();
      }
    } catch (e) {
      console.warn("[AniSkip] Error:", e);
    }
  }

  renderScrubberMarkers() {
    if (!this.markersContainer) return;
    this.markersContainer.innerHTML = "";

    const duration = this.video?.duration;
    if (!duration || duration <= 0 || isNaN(duration)) return;

    // 1. Intro Yellow Segment
    if (this.introStart !== null && this.introEnd !== null && this.introEnd > this.introStart) {
      const leftPct = (this.introStart / duration) * 100;
      const widthPct = ((this.introEnd - this.introStart) / duration) * 100;
      const marker = document.createElement("div");
      marker.className = "scrubber-marker intro";
      marker.style.left = `${Math.max(0, Math.min(100, leftPct))}%`;
      marker.style.width = `${Math.max(0.5, Math.min(100 - leftPct, widthPct))}%`;
      marker.title = `İntro (Opening): ${this.formatTime(this.introStart)} - ${this.formatTime(this.introEnd)}`;
      this.markersContainer.appendChild(marker);
    }

    // 2. Outro Yellow Segment
    if (this.outroStart !== null && this.outroEnd !== null && this.outroEnd > this.outroStart) {
      const leftPct = (this.outroStart / duration) * 100;
      const widthPct = ((this.outroEnd - this.outroStart) / duration) * 100;
      const marker = document.createElement("div");
      marker.className = "scrubber-marker outro";
      marker.style.left = `${Math.max(0, Math.min(100, leftPct))}%`;
      marker.style.width = `${Math.max(0.5, Math.min(100 - leftPct, widthPct))}%`;
      marker.title = `Outro (Ending): ${this.formatTime(this.outroStart)} - ${this.formatTime(this.outroEnd)}`;
      this.markersContainer.appendChild(marker);
    }
  }

  async loadWatchOrder(animeId) {
    const sectionEl = document.getElementById("watchOrderSection");
    const railEl = document.getElementById("watchOrderRail");
    const countBadge = document.getElementById("watchOrderCountBadge");
    if (!sectionEl || !railEl) return;

    try {
      const data = await window.API.getFranchiseWatchOrder(animeId);
      const list = data.franchise || [];

      if (!list || list.length <= 1) {
        sectionEl.style.display = "none";
        return;
      }

      sectionEl.style.display = "block";
      if (countBadge) {
        const itemLabel = window.I18n?.currentLang === "en" ? "Entries" : "Sezon / Film";
        countBadge.textContent = `${list.length} ${itemLabel}`;
      }

      this.renderWatchOrderTimeline(list, railEl);
    } catch (err) {
      console.warn("Watch order load failed:", err);
      if (sectionEl) sectionEl.style.display = "none";
    }
  }

  renderWatchOrderTimeline(list, railEl) {
    railEl.innerHTML = "";
    const currentAnimeId = parseInt(this.currentAnime?.id);
    const currentIndex = list.findIndex(item => parseInt(item.id) === currentAnimeId);

    const history = JSON.parse(localStorage.getItem("animeria_history") || "[]");
    const watchedIds = new Set(history.map(h => parseInt(h.animeId || h.id)));

    list.forEach((item, idx) => {
      const isCurrent = parseInt(item.id) === currentAnimeId;
      const isWatched = watchedIds.has(parseInt(item.id)) && !isCurrent;
      const isNext = (idx === currentIndex + 1);

      const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || "Anime";
      const cover = item.coverImage?.large || item.coverImage?.medium || "";
      const year = item.startDate?.year || item.seasonYear || "—";
      const format = item.format || "TV";
      const episodes = item.episodes ? `${item.episodes} ${window.I18n?.currentLang === "en" ? "EP" : "Bölüm"}` : "TBA";
      const orderNum = String(idx + 1).padStart(2, "0");

      let statusBadge = "";
      if (isCurrent) {
        statusBadge = `<span class="watch-order-status current">${window.I18n ? window.I18n.t('watch_order_current') : 'ŞU AN İZLENİYOR'}</span>`;
      } else if (isWatched) {
        statusBadge = `<span class="watch-order-status watched">✓ ${window.I18n ? window.I18n.t('watch_order_watched') : 'İZLENDİ'}</span>`;
      } else if (isNext) {
        statusBadge = `<span class="watch-order-status next">▶ ${window.I18n ? window.I18n.t('watch_order_next') : 'SIRADA'}</span>`;
      }

      const card = document.createElement("div");
      card.className = `watch-order-card ${isCurrent ? 'active' : ''} ${isWatched ? 'watched' : ''}`;
      card.innerHTML = `
        <div class="watch-order-num">${orderNum}</div>
        <div class="watch-order-media">
          <img class="watch-order-img" src="${cover}" alt="${title}" loading="lazy"/>
          <span class="watch-order-format-tag">${format}</span>
        </div>
        <div class="watch-order-info">
          <div class="watch-order-card-title" title="${title}">${title}</div>
          <div class="watch-order-meta">
            <span>${year}</span>
            <span>•</span>
            <span>${episodes}</span>
          </div>
          ${statusBadge}
        </div>
      `;

      card.addEventListener("click", () => {
        if (isCurrent) {
          window.UI?.showToast("Şu an bu sezonu izliyorsunuz");
          return;
        }
        window.location.href = `/watch?id=${item.id}&ep=1`;
      });

      railEl.appendChild(card);
    });

    // Wire horizontal scroll action buttons and smooth drag/wheel physics
    window.UI?.enableSmoothHorizontalScroll?.(railEl);

    const leftBtn = document.getElementById("watchOrderScrollLeft");
    const rightBtn = document.getElementById("watchOrderScrollRight");
    if (leftBtn) leftBtn.onclick = () => railEl.scrollBy({ left: -360, behavior: "smooth" });
    if (rightBtn) rightBtn.onclick = () => railEl.scrollBy({ left: 360, behavior: "smooth" });

    // Auto-scroll rail to active season card without affecting window scroll
    setTimeout(() => {
      const activeCard = railEl.querySelector(".watch-order-card.active");
      if (activeCard) {
        const scrollPos = activeCard.offsetLeft - (railEl.clientWidth / 2) + (activeCard.clientWidth / 2);
        railEl.scrollTo({ left: Math.max(0, scrollPos), behavior: "smooth" });
      }
    }, 200);
  }

  async resolveAndPlay() {
    this.loader.classList.add("active");
    this.skipBtn.classList.remove("visible");
    this.clearSubtitleOverlay();

    // Prefer animedunya (Turkish sub) first, then reanime, 2dhive, etc.
    const availableProviders = Object.keys(this.allProvidersData).filter(k => 
      this.allProvidersData[k] && this.allProvidersData[k].episodes
    );

    if (availableProviders.length === 0) {
      window.UI.showToast("Şu an aktif sunucu yok.");
      this.loader.classList.remove("active");
      return;
    }

    if (!availableProviders.includes(this.currentProvider)) {
      this.currentProvider = availableProviders[0];
    }

    const codename = this.serverCodenameMap[this.currentProvider]?.name || this.currentProvider;
    if (this.currentServerNameEl) {
      this.currentServerNameEl.textContent = codename;
    }

    const providerData = this.allProvidersData[this.currentProvider];
    const episodeList = providerData?.episodes?.[this.currentAudio] || providerData?.episodes?.sub || [];
    
    // Find current episode item
    const epItem = episodeList.find(e => parseInt(e.number) === this.currentEpNumber) || episodeList[0];
    
    if (!epItem) {
      window.UI.showToast(`Seçilen sunucuda Bölüm ${this.currentEpNumber} bulunamadı.`);
      this.loader.classList.remove("active");
      return;
    }

    const epSlug = `${this.currentProvider}-${epItem.number}`;
    const streamCacheKey = `${this.currentProvider}:${this.currentAnime.id}:${this.currentAudio}:${epSlug}`;

    // 1. Cancel previous in-flight watch stream request to prevent race conditions & rate-limits
    if (this._watchAbortController) {
      try { this._watchAbortController.abort(); } catch {}
    }
    this._watchAbortController = new AbortController();
    const currentSignal = this._watchAbortController.signal;

    try {
      if (!this._streamCache) this._streamCache = new Map();
      let watchData = this._streamCache.get(streamCacheKey);

      if (!watchData) {
        watchData = await window.API.getWatchStream(
          this.currentProvider,
          this.currentAnime.id,
          this.currentAudio,
          epSlug,
          currentSignal
        );
        if (watchData) {
          this._streamCache.set(streamCacheKey, watchData);
        }
      }

      this.currentStreamData = watchData;

      // Merge Intro / Outro timestamps from provider (if present)
      if (watchData.intro?.start !== undefined && watchData.intro?.start !== null) {
        this.introStart = parseFloat(watchData.intro.start);
        this.introEnd = parseFloat(watchData.intro.end);
      } else if (watchData.intro_start !== undefined && watchData.intro_start !== null) {
        this.introStart = parseFloat(watchData.intro_start);
        this.introEnd = parseFloat(watchData.intro_end);
      }
      if (watchData.outro?.start !== undefined && watchData.outro?.start !== null) {
        this.outroStart = parseFloat(watchData.outro.start);
        this.outroEnd = parseFloat(watchData.outro.end);
      } else if (watchData.outro_start !== undefined && watchData.outro_start !== null) {
        this.outroStart = parseFloat(watchData.outro_start);
        this.outroEnd = parseFloat(watchData.outro_end);
      }
      this.renderScrubberMarkers();

      // Extract subtitles array
      const subs = watchData.subtitles || watchData.streams?.[0]?.subtitles || [];
      this.availableSubtitles = subs;

      // Auto Subtitle Selection matching current site language
      this.autoSelectSubtitleByLang();

      // Update Subtitle & Server Dropdown menus
      this.renderDropdownDeck();

      // Direct Stream First Policy (Bypasses iframe controls)
      const streams = watchData.streams || [];
      const directHlsStream = streams.find(s => s.type === "hls" && s.url) || 
                              (watchData.stream_url ? { url: watchData.stream_url, type: "hls" } : null);

      if (directHlsStream && directHlsStream.url) {
        const referer = directHlsStream.referer || directHlsStream.headers?.Referer || "";
        const proxyUrl = window.API.getProxyM3U8Url(directHlsStream.url, referer);
        this.playHLS(proxyUrl);
      } else {
        const embedStream = streams.find(s => s.url) || (watchData.embeds && watchData.embeds[0]);
        if (embedStream && embedStream.url) {
          this.playEmbed(embedStream.url);
        } else {
          throw new Error("Yayın akışı bulunamadı");
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return; // Request was aborted due to rapid user switching, ignore safely!
      }
      console.warn(`Primary provider [${this.currentProvider}] failed:`, err);
      return this.fallbackToNextServer("Yayın akışı bulunamadı");
    } finally {
      this.loader.classList.remove("active");
    }
  }

  // Automatic Server Fallback Cascade (Seamlessly switches to next working server)
  fallbackToNextServer(reason = "Sunucu yanıt vermedi") {
    const availableProviders = Object.keys(this.allProvidersData).filter(k => 
      this.allProvidersData[k] && this.allProvidersData[k].episodes
    );

    this.failedServers.add(this.currentProvider);
    const nextProvider = availableProviders.find(p => !this.failedServers.has(p));

    if (nextProvider) {
      const currentMeta = this.serverCodenameMap[this.currentProvider] || { name: this.currentProvider };
      const nextMeta = this.serverCodenameMap[nextProvider] || { name: nextProvider };
      
      window.UI?.showToast(`⚠️ ${currentMeta.name} (${reason}). Otomatik olarak ${nextMeta.name} sunucusuna geçiliyor...`);
      this.currentProvider = nextProvider;
      return this.resolveAndPlay();
    } else {
      window.UI?.showToast("⚠️ Tüm sunucular denendi ancak yayın akışına ulaşılamadı.");
      this.loader?.classList.remove("active");
    }
  }

  // Playback Preferences (Autoplay, Auto Next, Auto Skip)
  initPlaybackPreferences() {
    const autoplayCheck = document.getElementById("prefAutoplayCheck");
    const autoNextCheck = document.getElementById("prefAutoNextCheck");
    const autoSkipCheck = document.getElementById("prefAutoSkipCheck");

    if (autoplayCheck) {
      autoplayCheck.checked = this.prefAutoplay;
      autoplayCheck.addEventListener("change", (e) => {
        this.prefAutoplay = e.target.checked;
        localStorage.setItem("animeria_pref_autoplay", String(this.prefAutoplay));
        window.UI?.showToast(this.prefAutoplay ? "Otomatik oynatma açık" : "Otomatik oynatma kapalı");
      });
    }

    if (autoNextCheck) {
      autoNextCheck.checked = this.prefAutoNext;
      autoNextCheck.addEventListener("change", (e) => {
        this.prefAutoNext = e.target.checked;
        localStorage.setItem("animeria_pref_autonext", String(this.prefAutoNext));
        window.UI?.showToast(this.prefAutoNext ? "Otomatik sonraki bölüm açık" : "Otomatik sonraki bölüm kapalı");
      });
    }

    if (autoSkipCheck) {
      autoSkipCheck.checked = this.prefAutoSkip;
      autoSkipCheck.addEventListener("change", (e) => {
        this.prefAutoSkip = e.target.checked;
        localStorage.setItem("animeria_pref_autoskip", String(this.prefAutoSkip));
        window.UI?.showToast(this.prefAutoSkip ? "Otomatik intro atlama açık" : "Otomatik intro atlama kapalı");
      });
    }
  }

  // Quality Menu Population (1080p FHD, 720p HD, 480p SD, 360p, Auto)
  populateQualityMenu() {
    if (!this.qualityMenu || !this.qualityBtn) return;
    this.qualityMenu.innerHTML = "";

    // Always show quality button when video is active
    this.qualityBtn.style.display = "flex";

    const currentLevel = (this.currentQualityLevel !== undefined)
      ? this.currentQualityLevel
      : (this.hls ? this.hls.currentLevel : -1);

    // 1. Auto Option (Always present)
    const autoItem = document.createElement("div");
    autoItem.className = `deck-menu-item ${currentLevel === -1 ? 'active' : ''}`;
    autoItem.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">Otomatik (Auto)</span>
        ${currentLevel === -1 ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
      <span class="badge-tag tag-ssub">1080p MAX</span>
    `;
    autoItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.currentQualityLevel = -1;
      if (this.hls) this.hls.currentLevel = -1;
      this.populateQualityMenu();
      this.closeAllDropdowns();
      window.UI?.showToast("Kalite: Otomatik (En yüksek 1080p)");
    });
    this.qualityMenu.appendChild(autoItem);

    // 2. If HLS is active with levels
    if (this.hls && Array.isArray(this.hls.levels) && this.hls.levels.length > 0) {
      const levelsWithIdx = this.hls.levels.map((lvl, idx) => {
        let height = lvl.height || 0;
        if (!height && lvl.attrs?.RESOLUTION) {
          const parts = String(lvl.attrs.RESOLUTION).split("x");
          if (parts[1]) height = parseInt(parts[1]);
        }
        if (!height && this.video?.videoHeight) {
          height = this.video.videoHeight;
        }
        if (!height) height = 1080;
        return { lvl, idx, height };
      }).sort((a, b) => b.height - a.height);

      // Deduplicate levels by height
      const seenHeights = new Set();
      const uniqueLevels = [];
      for (const item of levelsWithIdx) {
        if (!seenHeights.has(item.height)) {
          seenHeights.add(item.height);
          uniqueLevels.push(item);
        }
      }

      uniqueLevels.forEach(({ idx, height }) => {
        const label = height >= 1080 ? "1080p FHD" : (height >= 720 ? "720p HD" : (height >= 480 ? "480p SD" : `${height}p`));
        const isCurrent = (currentLevel === idx);

        const item = document.createElement("div");
        item.className = `deck-menu-item ${isCurrent ? 'active' : ''}`;
        item.innerHTML = `
          <div class="menu-item-left">
            <span class="menu-item-name" style="font-family: var(--font-mono);">${label}</span>
            ${isCurrent ? '<span class="menu-item-check">✓</span>' : ''}
          </div>
          ${height >= 1080 ? '<span class="badge-tag tag-tr">1080p FHD</span>' : (height >= 720 ? '<span class="badge-tag tag-dl">720p HD</span>' : '')}
        `;
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.currentQualityLevel = idx;
          if (this.hls) this.hls.currentLevel = idx;
          this.populateQualityMenu();
          this.closeAllDropdowns();
          window.UI?.showToast(`Video kalitesi: ${label}`);
        });
        this.qualityMenu.appendChild(item);
      });
    } else {
      // Direct stream or single stream fallback: 1080p Source Option
      const sourceItem = document.createElement("div");
      const isCurrent = (currentLevel === 0);
      sourceItem.className = `deck-menu-item ${isCurrent ? 'active' : ''}`;
      sourceItem.innerHTML = `
        <div class="menu-item-left">
          <span class="menu-item-name" style="font-family: var(--font-mono);">1080p FHD (Kaynak)</span>
          ${isCurrent ? '<span class="menu-item-check">✓</span>' : ''}
        </div>
        <span class="badge-tag tag-tr">1080p</span>
      `;
      sourceItem.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentQualityLevel = 0;
        this.populateQualityMenu();
        this.closeAllDropdowns();
        window.UI?.showToast("Video kalitesi: 1080p FHD (Kaynak)");
      });
      this.qualityMenu.appendChild(sourceItem);
    }
  }

  // Automatic Subtitle Selection based on site language
  autoSelectSubtitleByLang() {
    if (!this.availableSubtitles || this.availableSubtitles.length === 0) {
      this.loadSubtitleCues(null);
      return;
    }

    const currentLang = window.I18n ? window.I18n.currentLang : "tr";
    let targetSub = null;

    if (currentLang === "tr") {
      targetSub = this.availableSubtitles.find(s => {
        const l = (s.label || s.language || s.srclang || "").toLowerCase();
        return l.includes("tr") || l.includes("turkish");
      });
    } else {
      targetSub = this.availableSubtitles.find(s => {
        const l = (s.label || s.language || s.srclang || "").toLowerCase();
        return l.includes("en") || l.includes("english");
      });
    }

    if (!targetSub && this.availableSubtitles.length > 0) {
      targetSub = this.availableSubtitles[0];
    }

    if (targetSub) {
      this.loadSubtitleCues(targetSub.url);
    }
  }

  playHLS(hlsUrl) {
    if (this.wrapper) {
      this.wrapper.classList.remove("is-embed-mode");
    }
    this.embedIframe.style.display = "none";
    this.embedIframe.src = "";
    this.video.style.display = "block";

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (window.Hls && window.Hls.isSupported()) {
      this.hls = new window.Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        enableWorker: true,
        startLevel: -1,
        autoStartLoad: true,
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: 50000000,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
      });

      this.hls.loadSource(hlsUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        this.populateQualityMenu();
        this.renderScrubberMarkers();
        const savedTime = this.getSavedTime();
        if (savedTime > 10) {
          this.video.currentTime = savedTime;
        }
        if (this.prefAutoplay) {
          this.video.play().catch(() => {});
        }
      });

      this.hls.on(window.Hls.Events.LEVEL_LOADED, () => {
        this.populateQualityMenu();
        this.renderScrubberMarkers();
      });

      this.hls.on(window.Hls.Events.LEVEL_SWITCHED, () => {
        this.populateQualityMenu();
      });

      this.video.addEventListener("loadedmetadata", () => {
        this.populateQualityMenu();
      }, { once: true });

      this.hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              // If network failure happens right at start, trigger auto-fallback to next server
              if (!this.video.currentTime || this.video.currentTime < 5) {
                this.fallbackToNextServer("Ağ hatası");
              } else {
                this.hls.startLoad();
              }
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              this.hls.recoverMediaError();
              break;
            default:
              this.fallbackToNextServer("Medya çözülemedi");
              break;
          }
        }
      });
    } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
      this.video.src = hlsUrl;
      if (this.prefAutoplay) {
        this.video.play().catch(() => {});
      }
    }
  }

  playEmbed(embedUrl) {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.pause();
    this.video.style.display = "none";
    if (this.wrapper) {
      this.wrapper.classList.add("is-embed-mode");
    }
    this.embedIframe.style.display = "block";
    this.embedIframe.src = embedUrl;
    this.loader.classList.remove("active");
    this.clearSubtitleOverlay();
    if (this.skipBtn) this.skipBtn.classList.remove("visible");
    if (this.qualityBtn) this.qualityBtn.style.display = "none";
    if (this.qualityMenu) this.qualityMenu.innerHTML = "";
  }

  // Parse WebVTT text into cue timestamp objects
  parseVttCues(vttText) {
    const cues = [];
    const blocks = vttText.split(/\r?\n\r?\n/);

    for (const block of blocks) {
      const lines = block.trim().split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/);
        if (match) {
          const parseSec = (t) => {
            const parts = t.replace(",", ".").split(":");
            if (parts.length === 3) {
              return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            } else if (parts.length === 2) {
              return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            }
            return parseFloat(t) || 0;
          };

          const start = parseSec(match[1]);
          const end = parseSec(match[2]);
          const text = lines.slice(i + 1).join("<br/>").replace(/<[^>i\/b]>/g, "");

          if (text) {
            cues.push({ start, end, text });
          }
          break;
        }
      }
    }
    return cues;
  }

  async loadSubtitleCues(subUrl) {
    this.selectedSubUrl = subUrl;
    if (!subUrl) {
      this.activeParsedCues = [];
      this.clearSubtitleOverlay();
      return;
    }

    try {
      const proxyUrl = window.API.getProxySubUrl(subUrl);
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Subtitle fetch failed");
      const vttText = await res.text();
      this.activeParsedCues = this.parseVttCues(vttText);
    } catch (err) {
      console.warn("Could not parse subtitle cues:", err);
      this.activeParsedCues = [];
    }
  }

  // Render Image-2 Style Dropdown Menus
  renderDropdownDeck() {
    this.renderServerMenu();
    this.renderAudioMenu();
  }

  renderServerMenu() {
    if (!this.serverMenu) return;
    this.serverMenu.innerHTML = "";

    const ignoreKeys = new Set(["page", "type", "mappings"]);
    const providers = Object.keys(this.allProvidersData || {}).filter(k => 
      !ignoreKeys.has(k) && this.allProvidersData[k] && this.allProvidersData[k].episodes &&
      (Array.isArray(this.allProvidersData[k].episodes?.sub) && this.allProvidersData[k].episodes.sub.length > 0 ||
       Array.isArray(this.allProvidersData[k].episodes?.dub) && this.allProvidersData[k].episodes.dub.length > 0 ||
       Array.isArray(this.allProvidersData[k].episodes) && this.allProvidersData[k].episodes.length > 0)
    );

    if (this.serverCountBadge) {
      this.serverCountBadge.textContent = `(${providers.length})`;
    }

    const currentMeta = this.serverCodenameMap[this.currentProvider] || { name: this.currentProvider, tags: ["S-SUB"] };
    if (this.currentServerNameEl) {
      this.currentServerNameEl.textContent = currentMeta.name;
    }

    providers.forEach(p => {
      const meta = this.serverCodenameMap[p] || { name: p, tags: ["S-SUB"], isTr: false };
      const isActive = (p === this.currentProvider);

      const item = document.createElement("div");
      item.className = `deck-menu-item ${isActive ? 'active' : ''}`;
      
      const badgeHtml = meta.tags.map(t => {
        let tagClass = "tag-ssub";
        if (t === "H-SUB") tagClass = "tag-hsub";
        if (t === "DL") tagClass = "tag-dl";
        if (t === "EMBED") tagClass = "tag-embed";
        return `<span class="badge-tag ${tagClass}">${t}</span>`;
      }).join("");

      item.innerHTML = `
        <div class="menu-item-left">
          <span class="menu-item-name">${meta.name}</span>
          ${isActive ? '<span class="menu-item-check">✓</span>' : ''}
        </div>
        <div class="menu-item-badges">
          ${meta.isTr ? '<span class="badge-tag tag-tr">TR</span>' : ''}
          ${badgeHtml}
        </div>
      `;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
        if (this.currentProvider !== p) {
          this.currentProvider = p;
          window.UI.showToast(`${meta.name} sunucusuna geçiliyor`);
          this.resolveAndPlay();
        }
      });

      this.serverMenu.appendChild(item);
    });
  }

  renderAudioMenu() {
    if (!this.audioMenu) return;
    this.audioMenu.innerHTML = "";

    if (this.currentAudioNameEl) {
      this.currentAudioNameEl.textContent = this.currentAudio === "dub" ? "Dub" : "Sub";
    }

    // Section 1: Audio Tracks
    const audioHead = document.createElement("div");
    audioHead.className = "deck-menu-header";
    audioHead.textContent = "Ses";
    this.audioMenu.appendChild(audioHead);

    const subItem = document.createElement("div");
    subItem.className = `deck-menu-item ${this.currentAudio === 'sub' ? 'active' : ''}`;
    subItem.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">Sub (Orijinal Ses)</span>
        ${this.currentAudio === 'sub' ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
      <span class="badge-tag tag-ssub">JPN</span>
    `;
    subItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeAllDropdowns();
      this.setAudio("sub");
    });
    this.audioMenu.appendChild(subItem);

    const dubItem = document.createElement("div");
    dubItem.className = `deck-menu-item ${this.currentAudio === 'dub' ? 'active' : ''}`;
    dubItem.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">Dub (Dublaj)</span>
        ${this.currentAudio === 'dub' ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
      <span class="badge-tag tag-hsub">DUB</span>
    `;
    dubItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeAllDropdowns();
      this.setAudio("dub");
    });
    this.audioMenu.appendChild(dubItem);

    // Section 2: Subtitle Tracks
    const divider = document.createElement("div");
    divider.className = "deck-menu-divider";
    this.audioMenu.appendChild(divider);

    const subHead = document.createElement("div");
    subHead.className = "deck-menu-header";
    subHead.textContent = "Altyazı";
    this.audioMenu.appendChild(subHead);

    // Off item
    const offItem = document.createElement("div");
    const isOff = (this.selectedSubUrl === null);
    offItem.className = `deck-menu-item ${isOff ? 'active' : ''}`;
    offItem.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">Kapalı / Off</span>
        ${isOff ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
    `;
    offItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeAllDropdowns();
      this.loadSubtitleCues(null);
      this.renderAudioMenu();
      window.UI.showToast("Altyazı kapatıldı");
    });
    this.audioMenu.appendChild(offItem);

    // Subtitle languages list
    this.availableSubtitles.forEach((sub, idx) => {
      const label = sub.label || sub.language || sub.srclang || `Altyazı ${idx + 1}`;
      const isTurkish = label.toLowerCase().includes("tr") || label.toLowerCase().includes("turkish");
      const isEnglish = label.toLowerCase().includes("en") || label.toLowerCase().includes("english");
      const isCurrent = (this.selectedSubUrl === sub.url);

      const item = document.createElement("div");
      item.className = `deck-menu-item ${isCurrent ? 'active' : ''}`;
      item.innerHTML = `
        <div class="menu-item-left">
          <span class="menu-item-name">${isTurkish ? 'Türkçe' : (isEnglish ? 'English' : label)}</span>
          ${isCurrent ? '<span class="menu-item-check">✓</span>' : ''}
        </div>
        <span class="badge-tag ${isTurkish ? 'tag-tr' : 'tag-ssub'}">${label.toUpperCase()}</span>
      `;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
        this.loadSubtitleCues(sub.url);
        this.renderAudioMenu();
        window.UI.showToast(`Altyazı: ${isTurkish ? 'Türkçe' : label}`);
      });

      this.audioMenu.appendChild(item);
    });
  }

  populateQualityMenu() {
    if (!this.qualityMenu || !this.qualityBtn) return;
    if (!this.hls) return;

    const levels = this.hls.levels || [];
    this.qualityMenu.innerHTML = "";

    // Show the quality button now that HLS is active
    this.qualityBtn.style.display = "flex";

    // "Otomatik" (Auto) option — hls.currentLevel = -1 means ABR mode
    const isAuto = (this.currentQualityLevel === -1);
    const autoItem = document.createElement("div");
    autoItem.className = `deck-menu-item ${isAuto ? 'active' : ''}`;
    autoItem.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">Otomatik</span>
        ${isAuto ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
    `;
    autoItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hls.currentLevel = -1;
      this.currentQualityLevel = -1;
      this.closeAllDropdowns();
      this.populateQualityMenu();
    });
    this.qualityMenu.appendChild(autoItem);

    // Sort levels highest to lowest by height
    const sortedLevels = levels
      .map((l, idx) => ({ ...l, originalIndex: idx }))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    sortedLevels.forEach(level => {
      const label = level.height ? `${level.height}p` : `Seviye ${level.originalIndex + 1}`;
      const isActive = (this.currentQualityLevel === level.originalIndex);

      const item = document.createElement("div");
      item.className = `deck-menu-item ${isActive ? 'active' : ''}`;
      item.innerHTML = `
        <div class="menu-item-left">
          <span class="menu-item-name">${label}</span>
          ${isActive ? '<span class="menu-item-check">✓</span>' : ''}
        </div>
      `;
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hls.currentLevel = level.originalIndex;
        this.currentQualityLevel = level.originalIndex;
        this.closeAllDropdowns();
        this.populateQualityMenu();
      });
      this.qualityMenu.appendChild(item);
    });
  }

  clearSubtitleOverlay() {
    if (this.subtitleOverlay) {
      this.subtitleOverlay.innerHTML = "";
      this.subtitleOverlay.style.display = "none";
    }
  }

  renderEpisodesSidebar() {
    const listEl = document.getElementById("episodesSidebarList");
    const countEl = document.getElementById("episodesCountBadge");
    const searchInput = document.getElementById("episodesSearchInput");
    const rangeBtn = document.getElementById("epRangeBtn");
    const rangeBtnText = document.getElementById("epRangeBtnText");
    const rangeMenu = document.getElementById("epRangeMenu");
    const rangeWrapper = document.getElementById("epRangeDropdownWrapper");
    const fillerToggleBtn = document.getElementById("toggleFillerFilterBtn");
    const viewToggleBtn = document.getElementById("toggleEpisodesViewBtn");

    if (!listEl) return;

    // Helper to safely extract episodes array from provider dictionary
    const extractEpisodes = () => {
      if (!this.allProvidersData || typeof this.allProvidersData !== "object") return [];

      const ignoreKeys = new Set(["page", "type", "mappings"]);

      // 1. Try currentProvider
      if (this.currentProvider && this.allProvidersData[this.currentProvider]?.episodes) {
        const pEps = this.allProvidersData[this.currentProvider].episodes;
        const list = pEps[this.currentAudio] || pEps.sub || pEps.dub;
        if (Array.isArray(list) && list.length > 0) return list;
        if (Array.isArray(pEps) && pEps.length > 0) return pEps;
      }

      // 2. Iterate valid providers
      for (const [pKey, pVal] of Object.entries(this.allProvidersData)) {
        if (ignoreKeys.has(pKey)) continue;
        if (pVal && pVal.episodes) {
          const pEps = pVal.episodes;
          const list = pEps[this.currentAudio] || pEps.sub || pEps.dub;
          if (Array.isArray(list) && list.length > 0) {
            this.currentProvider = pKey;
            return list;
          }
          if (Array.isArray(pEps) && pEps.length > 0) {
            this.currentProvider = pKey;
            return pEps;
          }
        }
      }
      return [];
    };

    const episodes = extractEpisodes();

    if (countEl) {
      countEl.textContent = `${episodes.length} ${window.I18n ? window.I18n.t('episodes') : 'Bölüm'}`;
    }

    // Still loading provider data
    if (!this.allProvidersData) {
      listEl.innerHTML = `<div class="spinner" style="margin: 3rem auto;"></div>`;
      return;
    }

    let currentRangeIndex = Math.floor((Math.max(1, this.currentEpNumber) - 1) / 100);
    let viewMode = "grid"; // "grid" or "list"
    let hideFillers = false;

    // Toggle View Mode
    if (viewToggleBtn) {
      viewToggleBtn.onclick = () => {
        viewMode = viewMode === "grid" ? "list" : "grid";
        viewToggleBtn.classList.toggle("active", viewMode === "list");
        render(searchInput?.value.trim() || "");
      };
    }

    // Toggle Filler Visibility / Filter
    if (fillerToggleBtn) {
      fillerToggleBtn.onclick = () => {
        hideFillers = !hideFillers;
        fillerToggleBtn.classList.toggle("active", hideFillers);
        render(searchInput?.value.trim() || "");
      };
    }

    // Range Dropdown Setup
    const totalRanges = Math.max(1, Math.ceil(episodes.length / 100));
    if (currentRangeIndex >= totalRanges) currentRangeIndex = totalRanges - 1;
    if (currentRangeIndex < 0) currentRangeIndex = 0;

    if (rangeWrapper) {
      rangeWrapper.style.display = "block";
    }

    const updateRangeMenu = () => {
      if (!rangeMenu) return;
      rangeMenu.innerHTML = "";

      for (let i = 0; i < totalRanges; i++) {
        const startEp = i * 100 + 1;
        const endEp = Math.max(1, Math.min((i + 1) * 100, episodes.length || 100));
        const itemBtn = document.createElement("button");
        itemBtn.className = `ep-range-item ${i === currentRangeIndex ? 'active' : ''}`;
        itemBtn.textContent = `${startEp} - ${endEp}`;
        itemBtn.type = "button";
        itemBtn.onclick = (e) => {
          e.stopPropagation();
          currentRangeIndex = i;
          if (rangeBtnText) rangeBtnText.textContent = `${startEp} - ${endEp}`;
          rangeMenu.classList.remove("open");
          updateRangeMenu();
          render(searchInput?.value.trim() || "");
        };
        rangeMenu.appendChild(itemBtn);
      }

      const activeStart = currentRangeIndex * 100 + 1;
      const activeEnd = Math.max(1, Math.min((currentRangeIndex + 1) * 100, episodes.length || 100));
      if (rangeBtnText) rangeBtnText.textContent = `${activeStart} - ${activeEnd}`;
    };

    if (rangeBtn && rangeMenu) {
      rangeBtn.onclick = (e) => {
        e.stopPropagation();
        rangeMenu.classList.toggle("open");
      };

      document.addEventListener("click", (e) => {
        if (!rangeWrapper?.contains(e.target)) {
          rangeMenu.classList.remove("open");
        }
      });
    }

    updateRangeMenu();

    const render = (filterText = "") => {
      listEl.innerHTML = "";

      if (episodes.length === 0) {
        listEl.innerHTML = `<div style="grid-column: 1/-1; padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Bölüm bulunamadı veya sunucu yanıt vermedi.</div>`;
        return;
      }

      let listToRender = episodes;

      if (filterText.length > 0) {
        listToRender = episodes.filter(ep => {
          const numStr = String(ep.number);
          const titleStr = (ep.title || "").toLowerCase();
          return numStr.includes(filterText) || titleStr.includes(filterText.toLowerCase());
        });
      } else if (episodes.length > 100) {
        const startIdx = currentRangeIndex * 100;
        const endIdx = Math.min(startIdx + 100, episodes.length);
        listToRender = episodes.slice(startIdx, endIdx);
      }

      if (hideFillers) {
        listToRender = listToRender.filter(ep => !ep.filler);
      }

      if (listToRender.length === 0) {
        listEl.innerHTML = `<div style="grid-column: 1/-1; padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Eşleşen bölüm bulunamadı.</div>`;
        return;
      }

      // VIEW MODE 1: 5-COLUMN COMPACT DENSE GRID (Exact match to screenshot)
      if (viewMode === "grid") {
        listEl.className = "episodes-list grid-container-mode";
        const gridEl = document.createElement("div");
        gridEl.className = "episodes-dense-grid";

        listToRender.forEach(ep => {
          const box = document.createElement("button");
          const isCurrent = parseInt(ep.number) === this.currentEpNumber;
          box.type = "button";
          box.className = `ep-grid-box ${isCurrent ? 'active' : ''} ${ep.filler ? 'filler' : ''}`;
          box.textContent = ep.number;
          box.title = ep.title ? `Bölüm ${ep.number}: ${ep.title}${ep.filler ? ' (Filler)' : ''}` : `Bölüm ${ep.number}`;
          box.onclick = () => this.changeEpisode(ep.number);
          gridEl.appendChild(box);
        });

        listEl.appendChild(gridEl);
        return;
      }

      // VIEW MODE 2: DETAILED LIST
      listEl.className = "episodes-list standard-list";
      const listContainer = document.createElement("div");
      listContainer.style.display = "flex";
      listContainer.style.flexDirection = "column";
      listContainer.style.gap = "0.35rem";

      listToRender.forEach(ep => {
        const item = document.createElement("div");
        const isCurrent = parseInt(ep.number) === this.currentEpNumber;
        item.className = `episode-item ${isCurrent ? 'active' : ''}`;
        item.innerHTML = `
          <div class="ep-num-box" style="${ep.filler ? 'background: #c59b65; color: #fff; border-color: #c59b65;' : ''}">${ep.number}</div>
          <div class="ep-info-col">
            <div class="ep-name">${ep.title || `${window.I18n ? window.I18n.t('episodes') : 'Bölüm'} ${ep.number}`}</div>
            ${ep.filler ? '<span class="ep-filler-tag">Filler</span>' : ''}
          </div>
        `;
        item.onclick = () => this.changeEpisode(ep.number);
        listContainer.appendChild(item);

        if (isCurrent) {
          setTimeout(() => item.scrollIntoView({ block: "nearest", behavior: "smooth" }), 100);
        }
      });

      listEl.appendChild(listContainer);
    };

    render(searchInput?.value.trim() || "");
    if (searchInput) {
      searchInput.oninput = (e) => render(e.target.value.trim());
    }
  }

  changeEpisode(newEpNumber) {
    const n = parseInt(newEpNumber);
    if (!n || n < 1) return;
    this.loadEpisode(this.currentAnime, n);
  }

  setAudio(audio) {
    if (this.currentAudio === audio) return;
    this.currentAudio = audio;
    this.renderEpisodesSidebar();
    this.renderDropdownDeck();
    this.resolveAndPlay();
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play().catch(() => {});
    } else {
      this.video.pause();
    }
  }

  updatePlayIcon(isPlaying) {
    this.playPauseBtn.innerHTML = isPlaying 
      ? `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  }

  onTimeUpdate() {
    if (!this.video.duration || this.isSeeking) return;
    const current = this.video.currentTime;
    const duration = this.video.duration;
    const pct = (current / duration) * 100;

    this.scrubberProgress.style.width = `${pct}%`;
    this.scrubberThumb.style.left = `${pct}%`;
    this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;

    // Custom Subtitle Overlay Real-Time Cue Matcher
    if (this.subtitleOverlay && this.activeParsedCues.length > 0) {
      const activeCue = this.activeParsedCues.find(c => current >= c.start && current <= c.end);
      if (activeCue) {
        this.subtitleOverlay.innerHTML = `<span class="subtitle-text-pill">${activeCue.text}</span>`;
        this.subtitleOverlay.style.display = "flex";
      } else {
        this.subtitleOverlay.style.display = "none";
      }
    }

    // Intro / Outro Skip Button & Auto Skip Logic
    if (this.introStart !== null && this.introEnd !== null && current >= this.introStart && current < this.introEnd) {
      if (this.prefAutoSkip) {
        this.video.currentTime = this.introEnd;
        if (!this.autoSkipNotificationShown) {
          this.autoSkipNotificationShown = true;
          window.UI?.showToast("İntro otomatik atlandı ⏭️");
        }
        if (this.skipBtn) this.skipBtn.classList.remove("visible");
      } else {
        if (this.skipBtn) {
          this.skipBtn.textContent = window.I18n ? window.I18n.t('skip_intro') : "İntroyu Atla →";
          this.skipBtn.classList.add("visible");
        }
      }
    } else if (this.outroStart !== null && this.outroEnd !== null && current >= this.outroStart && current < this.outroEnd) {
      if (this.prefAutoSkip) {
        if (this.prefAutoNext) {
          this.video.currentTime = this.outroEnd;
          if (!this.autoSkipNotificationShown) {
            this.autoSkipNotificationShown = true;
            window.UI?.showToast("Outro otomatik atlandı. Sonraki bölüme geçiliyor...");
          }
          this.changeEpisode(this.currentEpNumber + 1);
        } else {
          this.video.currentTime = this.outroEnd;
        }
        if (this.skipBtn) this.skipBtn.classList.remove("visible");
      } else {
        if (this.skipBtn) {
          this.skipBtn.textContent = window.I18n ? window.I18n.t('skip_outro') : "Outroyu Atla →";
          this.skipBtn.classList.add("visible");
        }
      }
    } else {
      if (this.skipBtn) this.skipBtn.classList.remove("visible");
    }

    // Periodically save progress to localStorage
    if (Math.floor(current) % 5 === 0) {
      this.saveHistory();
    }
  }

  onProgress() {
    if (!this.video.duration || this.video.buffered.length === 0) return;
    const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
    const pct = (bufferedEnd / this.video.duration) * 100;
    this.scrubberBuffer.style.width = `${pct}%`;
  }

  startSeek(e) {
    this.isSeeking = true;
    this.seek(e);
  }

  seek(e) {
    const rect = this.scrubberContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.scrubberProgress.style.width = `${pos * 100}%`;
    this.scrubberThumb.style.left = `${pos * 100}%`;
    if (this.video.duration) {
      this.video.currentTime = pos * this.video.duration;
    }
  }

  updateTooltip(e) {
    const rect = this.scrubberContainer.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right) {
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.scrubberTooltip.style.left = `${pos * 100}%`;
      if (this.video.duration) {
        this.scrubberTooltip.textContent = this.formatTime(pos * this.video.duration);
      }
    }
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.volumeSlider.value = this.video.muted ? 0 : this.video.volume;
    this.updateMuteIcon();
  }

  updateMuteIcon() {
    const isMuted = this.video.muted || this.video.volume === 0;
    this.muteBtn.innerHTML = isMuted
      ? `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
      : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  }

  toggleTheater() {
    const grid = document.querySelector(".watch-grid");
    if (grid) grid.classList.toggle("theater-mode");
  }

  togglePip() {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (this.video.requestPictureInPicture) {
      this.video.requestPictureInPicture();
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.wrapper.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  onEnded() {
    if (this.prefAutoNext) {
      window.UI?.showToast(`Bölüm tamamlandı. Sonraki bölüme geçiliyor (Bölüm ${this.currentEpNumber + 1})...`);
      setTimeout(() => {
        this.changeEpisode(this.currentEpNumber + 1);
      }, 1500);
    } else {
      this.updatePlayIcon(false);
    }
  }

  onMetadataLoaded() {
    this.timeDisplay.textContent = `00:00 / ${this.formatTime(this.video.duration)}`;
  }

  resetIdleTimer() {
    this.wrapper.classList.remove("idle");
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.video.paused) {
        this.wrapper.classList.add("idle");
      }
    }, 3500);
  }

  handleKeyboard(e) {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    if (e.code === "Space") {
      e.preventDefault();
      this.togglePlay();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 5);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      this.video.currentTime = Math.max(0, this.video.currentTime - 5);
    } else if (e.code === "KeyL") {
      this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
    } else if (e.code === "KeyJ") {
      this.video.currentTime = Math.max(0, this.video.currentTime - 10);
    } else if (e.code === "KeyF") {
      this.toggleFullscreen();
    } else if (e.code === "KeyM") {
      this.toggleMute();
    } else if (e.code === "KeyN") {
      this.changeEpisode(this.currentEpNumber + 1);
    } else if (e.code === "KeyP") {
      this.changeEpisode(this.currentEpNumber - 1);
    }
  }

  formatTime(secs) {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  saveHistory() {
    if (!this.currentAnime) return;
    const history = JSON.parse(localStorage.getItem("animeria_history") || "[]");
    const existingIdx = history.findIndex(h => h.id === this.currentAnime.id);

    const item = {
      id: this.currentAnime.id,
      title: this.currentAnime.title,
      coverImage: this.currentAnime.coverImage,
      bannerImage: this.currentAnime.bannerImage,
      epNumber: this.currentEpNumber,
      timestamp: this.video.currentTime || 0,
      duration: this.video.duration || 0,
      updatedAt: Date.now()
    };

    if (existingIdx >= 0) {
      history.splice(existingIdx, 1);
    }
    history.unshift(item);
    localStorage.setItem("animeria_history", JSON.stringify(history.slice(0, 30)));

    // Backend sync
    if (window.API && window.API.syncWatchProgress) {
      window.API.syncWatchProgress({
        animeId: this.currentAnime.id,
        title: this.currentAnime.title,
        coverImage: this.currentAnime.coverImage,
        bannerImage: this.currentAnime.bannerImage,
        epNumber: this.currentEpNumber,
        duration: Math.round((this.video.duration || 1440) / 60) || 24,
        episodesTotal: this.currentAnime.episodes || 0,
        genres: this.currentAnime.genres || []
      });
    }
  }

  getSavedTime() {
    if (!this.currentAnime) return 0;
    const history = JSON.parse(localStorage.getItem("animeria_history") || "[]");
    const item = history.find(h => h.id === this.currentAnime.id && h.epNumber === this.currentEpNumber);
    return item?.timestamp || 0;
  }
}

window.AnimeriaPlayer = AnimeriaPlayer;

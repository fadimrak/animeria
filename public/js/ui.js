/* ==========================================================================
   ANIMERIA — LIQUID GLASS UI CONTROLLER & RENDERING ENGINE
   ========================================================================== */

const UI = {
  currentHeroIndex: 0,
  heroTimer: null,

  t(key) {
    return window.I18n ? window.I18n.t(key) : key;
  },

  // 1. Hero Showcase Carousel
  renderHeroCarousel(animeList) {
    const track = document.getElementById("heroSliderTrack");
    const dotsContainer = document.getElementById("heroDotsContainer");
    if (!track || !dotsContainer || !animeList.length) return;

    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    const topAnime = animeList.slice(0, 5);

    topAnime.forEach((anime, idx) => {
      const banner = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large || "";
      const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || banner;
      const title = anime.title?.english || anime.title?.romaji || "Anime";
      const desc = (anime.description || "").replace(/<[^>]*>?/gm, "").slice(0, 220) + "...";
      const score = anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)}` : "8.5";
      const format = anime.format || "TV";
      const year = anime.seasonYear || anime.startDate?.year || "";

      // Slide item
      const slide = document.createElement("div");
      slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
      slide.setAttribute("data-en-desc", desc);
      slide.setAttribute("data-tr-desc", "");

      slide.innerHTML = `
        <div class="hero-bg" style="background-image: url('${banner || cover}');"></div>
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="hero-info">
            <div class="hero-badges">
              <span class="mono-tag solid">#${idx + 1} TREND</span>
              <span class="mono-tag score">★ ${score}</span>
              <span class="mono-tag outlined">${format} • ${year}</span>
            </div>
            <h1 class="hero-title">${title}</h1>
            <p class="hero-synopsis hero-synopsis-text">${desc}</p>
            <div class="hero-actions">
              <button class="btn btn-primary hero-play-btn" data-id="${anime.id}">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span>${this.t('btn_watch_now')}</span>
              </button>
              <button class="btn btn-secondary hero-info-btn" data-id="${anime.id}">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                <span>${this.t('btn_details')}</span>
              </button>
              <button class="btn-icon bookmark-btn" data-id="${anime.id}" title="${this.t('btn_watchlist')}">
                <svg width="18" height="18" fill="${UI.isBookmarked(anime.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      if (anime.description) {
        window.API.translateText(anime.description, "tr").then(trText => {
          if (trText) {
            const cleanTr = trText.replace(/<[^>]*>?/gm, "").slice(0, 240) + "...";
            slide.setAttribute("data-tr-desc", cleanTr);
            if (window.I18n?.currentLang === "tr") {
              const synEl = slide.querySelector(".hero-synopsis-text");
              if (synEl) synEl.textContent = cleanTr;
            }
          }
        }).catch(() => {});
      }

      // Event listeners for hero buttons
      slide.querySelector(".hero-play-btn").addEventListener("click", () => {
        window.App.playAnime(anime, 1);
      });
      slide.querySelector(".hero-info-btn").addEventListener("click", () => {
        window.App.openDetails(anime.id);
      });
      slide.querySelector(".bookmark-btn").addEventListener("click", (e) => {
        UI.toggleBookmark(anime, e.currentTarget);
      });

      track.appendChild(slide);

      // Dot indicator
      const dot = document.createElement("div");
      dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener("click", () => UI.goToHeroSlide(idx));
      dotsContainer.appendChild(dot);
    });

    this.startHeroAutoplay();
  },

  goToHeroSlide(index) {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".hero-dot");
    if (!slides.length) return;

    this.currentHeroIndex = (index + slides.length) % slides.length;

    slides.forEach((s, i) => s.classList.toggle("active", i === this.currentHeroIndex));
    dots.forEach((d, i) => d.classList.toggle("active", i === this.currentHeroIndex));

    this.startHeroAutoplay();
  },

  startHeroAutoplay() {
    clearInterval(this.heroTimer);
    this.heroTimer = setInterval(() => {
      this.goToHeroSlide(this.currentHeroIndex + 1);
    }, 6500);
  },

  // 2. Card Creation (Full Color Anime Art)
  createAnimeCard(anime, isHistory = false, historyData = null) {
    const title = anime.title?.english || anime.title?.romaji || "Anime";
    const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || "";
    const score = anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)}` : null;
    const epText = isHistory ? `EP ${historyData.epNumber}` : (anime.episodes ? `${anime.episodes} EP` : "SUB/DUB");
    const format = anime.format || "TV";

    const card = document.createElement("div");
    card.className = "anime-card";
    
    let progressHtml = "";
    if (isHistory && historyData && historyData.duration > 0) {
      const pct = Math.min(100, Math.round((historyData.timestamp / historyData.duration) * 100));
      progressHtml = `
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${pct}%"></div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-media">
        <img class="card-img" src="${cover}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80';"/>
        <div class="card-overlay-badges">
          <span class="mono-tag solid" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">${format}</span>
          ${score ? `<span class="mono-tag score" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">★ ${score}</span>` : ''}
        </div>
        <div class="card-quick-play" title="Hemen İzle">
          <div class="play-circle">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        ${progressHtml}
      </div>
      <div class="card-details">
        <div class="card-title" title="${title}">${title}</div>
        <div class="card-meta">
          <span>${epText}</span>
          <span>${anime.genres ? anime.genres[0] : (anime.seasonYear || '')}</span>
        </div>
      </div>
    `;

    // Quick Play Icon Click Handler
    const quickPlay = card.querySelector(".card-quick-play");
    if (quickPlay) {
      quickPlay.addEventListener("click", (e) => {
        e.stopPropagation();
        window.App.playAnime(anime, isHistory && historyData ? historyData.epNumber : 1);
      });
    }

    // Card Body Click Handler
    card.addEventListener("click", () => {
      if (isHistory && historyData) {
        window.App.playAnime(anime, historyData.epNumber);
      } else {
        window.App.openDetails(anime.id);
      }
    });

    return card;
  },

  // 3. Render Shelves
  renderShelf(containerId, mediaList, isHistory = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (!mediaList || mediaList.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">${this.t('empty_history')}</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    mediaList.forEach(anime => {
      const card = this.createAnimeCard(anime, isHistory, isHistory ? anime : null);
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
    this.enableSmoothHorizontalScroll(container);
  },

  // Smooth Horizontal Momentum & Drag Scroll Helper
  enableSmoothHorizontalScroll(el) {
    if (!el || el._smoothScrollBound) return;
    el._smoothScrollBound = true;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragThresholdPassed = false;

    el.addEventListener("mousedown", (e) => {
      if (e.target.closest("button, input, select, a")) return;
      isDown = true;
      dragThresholdPassed = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX);
      if (Math.abs(walk) > 6) {
        dragThresholdPassed = true;
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }
      if (dragThresholdPassed) {
        el.scrollLeft = scrollLeft - (walk * 1.3);
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDown) {
        isDown = false;
        el.style.cursor = "";
        el.style.removeProperty("user-select");
      }
    });

    el.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({
          left: e.deltaY * 1.5,
          behavior: "smooth"
        });
      }
    }, { passive: false });
  },

  // 4. Render Grid for Browse / Search View
  renderGrid(containerId, mediaList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (!mediaList || mediaList.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Sonuç bulunamadı.</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    mediaList.forEach(anime => {
      const card = this.createAnimeCard(anime);
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
  },

  // 5. Genres Pill Bar
  renderGenresBar(genres, onSelect) {
    const container = document.getElementById("genresFilterBar");
    if (!container) return;
    container.innerHTML = "";

    const allPill = document.createElement("button");
    allPill.className = "genre-pill active";
    allPill.textContent = this.t('genre_all');
    allPill.addEventListener("click", () => {
      document.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"));
      allPill.classList.add("active");
      onSelect("ALL");
    });
    container.appendChild(allPill);

    (genres || []).slice(0, 16).forEach(g => {
      const pill = document.createElement("button");
      pill.className = "genre-pill";
      pill.textContent = g;
      pill.addEventListener("click", () => {
        document.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        onSelect(g);
      });
      container.appendChild(pill);
    });
  },

  // 6. Anime Details Modal (Liquid Glass)
  renderDetailsModal(anime) {
    const overlay = document.getElementById("detailsModalOverlay");
    const content = document.getElementById("detailsModalContent");
    if (!overlay || !content) return;

    const title = anime.title.english || anime.title.romaji || "Anime";
    const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || "";
    const banner = anime.bannerImage || cover;
    const desc = anime.description || "Açıklama bulunmuyor.";
    const score = anime.averageScore ? `${(anime.averageScore / 10).toFixed(1)}` : "—";
    const status = anime.status || "UNKNOWN";
    const episodes = anime.episodes || "?";
    const season = `${anime.season || ''} ${anime.seasonYear || ''}`.trim();

    content.innerHTML = `
      <div class="details-banner-bg" style="background-image: url('${banner}');"></div>
      <button class="details-close-btn" id="closeDetailsModalBtn">✕</button>

      <div class="details-body">
        <div class="details-header-row">
          <img class="details-poster" src="${cover}" alt="${title}"/>
          <div class="details-title-col">
            <h2 class="details-anime-title">${title}</h2>
            
            <div class="details-badges">
              <span class="mono-tag score">★ ${score}</span>
              <span class="mono-tag solid">${episodes} ${this.t('episodes')}</span>
              <span class="mono-tag outlined">${status}</span>
              <span class="mono-tag outlined">${season}</span>
            </div>

            <div class="details-tags" style="margin-top: 0.5rem;">
              ${(anime.genres || []).map(g => `<span class="mono-tag">${g}</span>`).join('')}
            </div>

            <div class="details-actions-row">
              <button class="btn btn-primary" id="modalPlayBtn">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                ${this.t('btn_play_ep1')}
              </button>
              <button class="btn btn-secondary" id="modalBookmarkBtn">
                <svg width="18" height="18" fill="${UI.isBookmarked(anime.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                ${UI.isBookmarked(anime.id) ? this.t('btn_in_watchlist') : this.t('btn_watchlist')}
              </button>
              ${anime.trailer?.id ? `
                <button class="btn btn-secondary" id="modalTrailerBtn">
                  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  ${this.t('btn_trailer')}
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="details-section-title">${this.t('modal_synopsis')}</div>
        <p class="details-synopsis" id="detailsSynopsisText">${desc}</p>

        <!-- Characters Section -->
        ${anime.characters?.edges?.length ? `
          <div class="details-section-title">${this.t('modal_characters')}</div>
          <div class="characters-grid">
            ${anime.characters.edges.slice(0, 6).map(c => `
              <div class="character-card">
                <img class="char-avatar" src="${c.node?.image?.medium || ''}" alt="${c.node?.name?.full}" loading="lazy"/>
                <div class="char-info">
                  <div class="char-name">${c.node?.name?.full}</div>
                  <div class="char-role">${c.role} ${c.voiceActors?.[0] ? `• ${c.voiceActors[0].name.full}` : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Related / Recommended Anime -->
        ${anime.recommendations?.nodes?.length ? `
          <div class="details-section-title" style="margin-top: 2rem;">${this.t('modal_recommendations')}</div>
          <div class="shelf-rail" style="padding-top: 0.5rem;">
            ${anime.recommendations.nodes.filter(n => n.mediaRecommendation).slice(0, 6).map(n => {
              const rec = n.mediaRecommendation;
              return `
                <div class="anime-card" onclick="window.App.openDetails(${rec.id})">
                  <div class="card-media">
                    <img class="card-img" src="${rec.coverImage?.large}" alt="${rec.title.english || rec.title.romaji}"/>
                  </div>
                  <div class="card-details">
                    <div class="card-title">${rec.title.english || rec.title.romaji}</div>
                    <div class="card-meta"><span>${rec.format || 'TV'}</span><span>★ ${rec.averageScore ? (rec.averageScore/10).toFixed(1) : ''}</span></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Event handlers
    document.getElementById("closeDetailsModalBtn").addEventListener("click", () => overlay.classList.remove("active"));
    document.getElementById("modalPlayBtn").addEventListener("click", () => {
      overlay.classList.remove("active");
      window.App.playAnime(anime, 1);
    });
    document.getElementById("modalBookmarkBtn").addEventListener("click", (e) => {
      UI.toggleBookmark(anime, e.currentTarget);
      const isBook = UI.isBookmarked(anime.id);
      e.currentTarget.innerHTML = `
        <svg width="18" height="18" fill="${isBook ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        ${isBook ? this.t('btn_in_watchlist') : this.t('btn_watchlist')}
      `;
    });

    if (anime.trailer?.id && document.getElementById("modalTrailerBtn")) {
      document.getElementById("modalTrailerBtn").addEventListener("click", () => {
        window.open(`https://www.youtube.com/watch?v=${anime.trailer.id}`, "_blank");
      });
    }

    const synopsisEl = document.getElementById("detailsSynopsisText");
    if (synopsisEl) {
      synopsisEl.setAttribute("data-en-desc", desc);
      synopsisEl.setAttribute("data-tr-desc", "");
    }

    if (anime.description) {
      window.API.translateText(anime.description, "tr").then(trDesc => {
        if (trDesc && synopsisEl) {
          synopsisEl.setAttribute("data-tr-desc", trDesc);
          if (window.I18n?.currentLang === "tr") {
            synopsisEl.textContent = trDesc;
          }
        }
      }).catch(() => {});
    }

    overlay.classList.add("active");
  },

  // 7. Search Dropdown Results
  renderSearchResults(results, containerEl) {
    containerEl.innerHTML = "";
    if (!results || results.length === 0) {
      containerEl.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Sonuç bulunamadı.</div>`;
      return;
    }

    results.forEach(anime => {
      const item = document.createElement("div");
      item.className = "search-item";
      const title = anime.title.english || anime.title.romaji || "Anime";
      const cover = anime.coverImage?.medium || "";
      const year = anime.seasonYear || anime.startDate?.year || "";
      const format = anime.format || "TV";
      const score = anime.averageScore ? `★ ${(anime.averageScore / 10).toFixed(1)}` : "";

      item.innerHTML = `
        <img class="search-item-img" src="${cover}" alt="${title}"/>
        <div class="search-item-info">
          <div class="search-item-title">${title}</div>
          <div class="search-item-meta">${format} • ${year} ${score ? `• ${score}` : ''} • ${anime.genres ? anime.genres.slice(0, 2).join(', ') : ''}</div>
        </div>
      `;

      item.addEventListener("click", () => {
        document.getElementById("searchModalOverlay").classList.remove("active");
        window.App.playAnime(anime, 1);
      });

      containerEl.appendChild(item);
    });
  },

  // 8. Bookmarks / Watchlist helpers
  isBookmarked(id) {
    const list = JSON.parse(localStorage.getItem("animeria_bookmarks") || "[]");
    return list.some(item => item.id === id);
  },

  toggleBookmark(anime, btnEl = null) {
    let list = JSON.parse(localStorage.getItem("animeria_bookmarks") || "[]");
    const exists = list.some(item => item.id === anime.id);

    if (exists) {
      list = list.filter(item => item.id !== anime.id);
      localStorage.setItem("animeria_bookmarks", JSON.stringify(list));
      UI.showToast(this.t('toast_removed'));
      if (btnEl) {
        const svg = btnEl.querySelector("svg");
        if (svg) svg.setAttribute("fill", "none");
      }
    } else {
      list.unshift({
        id: anime.id,
        title: anime.title,
        coverImage: anime.coverImage,
        format: anime.format,
        averageScore: anime.averageScore,
        genres: anime.genres
      });
      localStorage.setItem("animeria_bookmarks", JSON.stringify(list));
      UI.showToast(this.t('toast_bookmarked'));
      if (btnEl) {
        const svg = btnEl.querySelector("svg");
        if (svg) svg.setAttribute("fill", "currentColor");
      }
    }

    this.renderBookmarksDrawer();
  },

  renderBookmarksDrawer() {
    const body = document.getElementById("bookmarksDrawerBody");
    if (!body) return;
    const list = JSON.parse(localStorage.getItem("animeria_bookmarks") || "[]");
    body.innerHTML = "";

    if (list.length === 0) {
      body.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">${this.t('empty_bookmarks')}</div>`;
      return;
    }

    list.forEach(anime => {
      const item = document.createElement("div");
      item.className = "drawer-item";
      const title = anime.title.english || anime.title.romaji || "Anime";
      item.innerHTML = `
        <img class="drawer-item-img" src="${anime.coverImage?.medium || anime.coverImage?.large}" alt="${title}"/>
        <div class="drawer-item-info">
          <div style="font-weight: 600; font-size: 0.9rem; color: #ffffff;">${title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${anime.format || 'TV'} ${anime.averageScore ? `• ★ ${(anime.averageScore/10).toFixed(1)}` : ''}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        document.getElementById("bookmarksDrawer").classList.remove("open");
        window.App.playAnime(anime, 1);
      });
      body.appendChild(item);
    });
  },

  renderHistoryDrawer() {
    const body = document.getElementById("historyDrawerBody");
    if (!body) return;
    const history = JSON.parse(localStorage.getItem("animeria_history") || "[]");
    body.innerHTML = "";

    if (history.length === 0) {
      body.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">${this.t('empty_history')}</div>`;
      return;
    }

    history.forEach(item => {
      const div = document.createElement("div");
      div.className = "drawer-item";
      const title = item.title?.english || item.title?.romaji || "Anime";
      div.innerHTML = `
        <img class="drawer-item-img" src="${item.coverImage?.medium || item.coverImage?.large}" alt="${title}"/>
        <div class="drawer-item-info">
          <div style="font-weight: 600; font-size: 0.9rem; color: #ffffff;">${title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${this.t('episodes')} ${item.epNumber}</div>
        </div>
      `;
      div.addEventListener("click", () => {
        document.getElementById("historyDrawer").classList.remove("open");
        window.App.playAnime(item, item.epNumber);
      });
      body.appendChild(div);
    });
  },

  // 9. Toast Notification Generator
  showToast(msg, duration = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
      <span>${msg}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

window.UI = UI;

// Global Language Changed Event Listener for Hero and Modal Synopses
window.addEventListener("animeria:lang-changed", (e) => {
  const lang = e.detail?.lang || window.I18n?.currentLang || "tr";

  // 1. Update Hero Carousel Synopses
  document.querySelectorAll(".hero-slide").forEach(slide => {
    const synEl = slide.querySelector(".hero-synopsis-text");
    if (!synEl) return;
    if (lang === "en") {
      const enText = slide.getAttribute("data-en-desc");
      if (enText) synEl.textContent = enText;
    } else {
      const trText = slide.getAttribute("data-tr-desc") || slide.getAttribute("data-en-desc");
      if (trText) synEl.textContent = trText;
    }
  });

  // 2. Update Details Modal Synopsis
  const modalSynEl = document.getElementById("detailsSynopsisText");
  if (modalSynEl) {
    if (lang === "en") {
      const enText = modalSynEl.getAttribute("data-en-desc");
      if (enText) modalSynEl.textContent = enText;
    } else {
      const trText = modalSynEl.getAttribute("data-tr-desc") || modalSynEl.getAttribute("data-en-desc");
      if (trText) modalSynEl.textContent = trText;
    }
  }
});

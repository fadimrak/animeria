/* ==========================================================================
   ANIMERIA — MAIN APPLICATION CONTROLLER
   Clean Page Routing & State Management
   ========================================================================== */

class AnimeriaApp {
  constructor() {
    this.player = null;
    this.searchDebounceTimer = null;
  }

  async init() {
    // 1. Initialize Video Player if on watch page
    if (document.getElementById("mainPlayerVideo")) {
      this.player = new window.AnimeriaPlayer();
      window.Player = this.player;

      const params = new URLSearchParams(window.location.search);
      const animeId = params.get("id");
      const epNum = parseInt(params.get("ep")) || 1;

      if (animeId) {
        try {
          const anime = await window.API.getAnimeDetails(animeId);
          await this.player.loadEpisode(anime, epNum);
        } catch (err) {
          console.error("Watch page initial load failed:", err);
          window.UI.showToast("Bölüm yüklenemedi: " + err.message);
        }
      }
    }

    // 2. Attach Global DOM Events
    this.bindEvents();

    // 3. Load home page data if on index.html
    if (document.getElementById("heroSliderTrack")) {
      await this.loadInitialData();
    }
  }

  bindEvents() {
    // 0. Language Switcher Toggle
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      window.I18n.updateDomTexts();
      langBtn.addEventListener("click", () => {
        const nextLang = window.I18n.currentLang === "tr" ? "en" : "tr";
        window.I18n.setLanguage(nextLang);
        window.UI.showToast(nextLang === "tr" ? "Dil: Türkçe" : "Language: English");
        
        // If player is open, refresh subtitle language matching
        if (this.player && this.player.autoSelectSubtitleByLang) {
          this.player.autoSelectSubtitleByLang();
          this.player.renderDropdownDeck();
        }
      });
    }

    // 1. Navbar Scroll effect
    window.addEventListener("scroll", () => {
      const nav = document.querySelector(".navbar");
      if (nav) {
        if (window.scrollY > 40) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }
      }
    }, { passive: true });

    // 2. Drawers: Bookmarks & History
    const bookmarksDrawer = document.getElementById("bookmarksDrawer");
    const historyDrawer = document.getElementById("historyDrawer");

    document.getElementById("navBookmarksBtn")?.addEventListener("click", () => {
      window.UI.renderBookmarksDrawer();
      bookmarksDrawer?.classList.add("open");
    });
    document.getElementById("closeBookmarksDrawerBtn")?.addEventListener("click", () => {
      bookmarksDrawer?.classList.remove("open");
    });

    document.getElementById("navHistoryBtn")?.addEventListener("click", () => {
      window.UI.renderHistoryDrawer();
      historyDrawer?.classList.add("open");
    });
    document.getElementById("closeHistoryDrawerBtn")?.addEventListener("click", () => {
      historyDrawer?.classList.remove("open");
    });

    // 3. Search Modal Overlay
    const searchModalOverlay = document.getElementById("searchModalOverlay");
    const searchInput = document.getElementById("searchInputBox");
    const searchResultsList = document.getElementById("searchResultsList");

    const openSearch = () => {
      if (!searchModalOverlay) return;
      searchModalOverlay.classList.add("active");
      searchInput.value = "";
      searchResultsList.innerHTML = "";
      setTimeout(() => searchInput.focus(), 100);
    };

    const closeSearch = () => {
      searchModalOverlay?.classList.remove("active");
    };

    document.getElementById("searchTriggerBtn")?.addEventListener("click", openSearch);
    document.getElementById("closeSearchModalBtn")?.addEventListener("click", closeSearch);
    searchModalOverlay?.addEventListener("click", (e) => {
      if (e.target === searchModalOverlay) closeSearch();
    });

    // Live search input with debounce
    searchInput?.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(this.searchDebounceTimer);
      if (q.length < 2) {
        searchResultsList.innerHTML = "";
        return;
      }

      searchResultsList.innerHTML = `<div style="padding: 1.5rem; text-align: center;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

      this.searchDebounceTimer = setTimeout(async () => {
        try {
          const res = await window.API.searchAnime({ q, perPage: 8 });
          window.UI.renderSearchResults(res.media, searchResultsList);
        } catch (err) {
          searchResultsList.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Arama sırasında bir hata oluştu.</div>`;
        }
      }, 350);
    });

    // Details Modal Overlay Click-Outside
    const detailsOverlay = document.getElementById("detailsModalOverlay");
    detailsOverlay?.addEventListener("click", (e) => {
      if (e.target === detailsOverlay) detailsOverlay.classList.remove("active");
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape") {
        closeSearch();
        detailsOverlay?.classList.remove("active");
        bookmarksDrawer?.classList.remove("open");
        historyDrawer?.classList.remove("open");
        document.getElementById("subSettingsModalOverlay")?.classList.remove("active");
      }
    });

    // Shelf navigation buttons
    document.querySelectorAll(".shelf-nav-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetId = e.currentTarget.getAttribute("data-target");
        const dir = e.currentTarget.getAttribute("data-dir");
        const rail = document.getElementById(targetId);
        if (rail) {
          const scrollAmt = dir === "left" ? -480 : 480;
          rail.scrollBy({ left: scrollAmt, behavior: "smooth" });
        }
      });
    });
  }

  async loadInitialData() {
    try {
      // 1. Trending & Hero Showcase
      const trendingData = await window.API.getTrending(1, 16);
      if (trendingData.media && trendingData.media.length > 0) {
        window.UI.renderHeroCarousel(trendingData.media);
        window.UI.renderShelf("trendingShelf", trendingData.media);
      }

      // 2. Genres Bar
      const genres = await window.API.getGenres();
      window.UI.renderGenresBar(genres, (genre) => {
        window.location.href = `/browse`;
      });

      // 3. Continue Watching Shelf
      this.updateContinueWatching();

      // 4. Popular & Top Rated & Recent
      window.API.getPopular(1, 14).then(d => window.UI.renderShelf("popularShelf", d.media || []));
      window.API.getTopRated(1, 14).then(d => window.UI.renderShelf("topShelf", d.media || []));
      window.API.getRecentlyReleased(1, 14).then(d => window.UI.renderShelf("recentShelf", d.media || []));
    } catch (err) {
      console.error("Initial data load error:", err);
    }
  }

  updateContinueWatching() {
    const history = JSON.parse(localStorage.getItem("animeria_history") || "[]");
    const section = document.getElementById("continueWatchingSection");
    if (!section) return;

    if (history.length > 0) {
      section.style.display = "block";
      window.UI.renderShelf("continueWatchingShelf", history, true);
    } else {
      section.style.display = "none";
    }
  }

  playAnime(anime, epNumber = 1) {
    const id = (typeof anime === "object" && anime !== null) ? anime.id : anime;
    if (!id) return;

    if (window.location.pathname.includes("watch")) {
      if (this.player) {
        if (typeof anime === "object") {
          this.player.loadEpisode(anime, epNumber);
        } else {
          window.API.getAnimeDetails(id).then(a => this.player.loadEpisode(a, epNumber));
        }
      }
    } else {
      // Direct navigation to watch page
      window.location.href = `/watch?id=${id}&ep=${epNumber}`;
    }
  }

  async openDetails(animeId) {
    try {
      window.UI.showToast("Anime detayları yükleniyor...");
      const details = await window.API.getAnimeDetails(animeId);
      window.UI.renderDetailsModal(details);
    } catch (err) {
      window.UI.showToast("Detaylar yüklenemedi: " + err.message);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.App = new AnimeriaApp();
  window.App.init();
});

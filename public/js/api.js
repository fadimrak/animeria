/* ==========================================================================
   ANIMERIA — CLIENT API MODULE
   Interacts with AniList, Anivexa, Auth, Watchlist & Import endpoints
   ========================================================================== */

const API = {
  // Auth Token Helper
  getToken() {
    return localStorage.getItem("animeria_auth_token") || "";
  },

  getAuthHeaders() {
    const token = this.getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  },

  // 1. AniList Content Fetchers
  async getTrending(page = 1, perPage = 18) {
    const res = await fetch(`/api/anime/trending?page=${page}&perPage=${perPage}`);
    if (!res.ok) throw new Error("Trend animeler yüklenemedi");
    return res.json();
  },

  async getPopular(page = 1, perPage = 18) {
    const res = await fetch(`/api/anime/popular?page=${page}&perPage=${perPage}`);
    if (!res.ok) throw new Error("Popüler animeler yüklenemedi");
    return res.json();
  },

  async getTop(page = 1, perPage = 18) {
    const res = await fetch(`/api/anime/top?page=${page}&perPage=${perPage}`);
    if (!res.ok) throw new Error("En yüksek puanlı animeler yüklenemedi");
    return res.json();
  },

  // Aliases for compatibility
  async getTopRated(page = 1, perPage = 18) {
    return this.getTop(page, perPage);
  },

  async getRecent(page = 1, perPage = 18) {
    const res = await fetch(`/api/anime/recent?page=${page}&perPage=${perPage}`);
    if (!res.ok) throw new Error("Yeni bölümler yüklenemedi");
    return res.json();
  },

  async getRecentlyReleased(page = 1, perPage = 18) {
    return this.getRecent(page, perPage);
  },

  async getAnimeDetails(id) {
    const res = await fetch(`/api/anime/${id}`);
    if (!res.ok) throw new Error("Anime detayları bulunamadı");
    return res.json();
  },

  async searchAnime(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.genre && params.genre !== "ALL") query.set("genre", params.genre);
    if (params.year) query.set("year", params.year);
    if (params.season && params.season !== "ALL") query.set("season", params.season);
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.sort) query.set("sort", params.sort);
    if (params.page) query.set("page", params.page);
    if (params.perPage) query.set("perPage", params.perPage);

    const res = await fetch(`/api/anime/search?${query.toString()}`);
    if (!res.ok) throw new Error("Arama başarısız oldu");
    return res.json();
  },

  async getGenres() {
    const res = await fetch(`/api/anime-genres`);
    if (!res.ok) return [];
    return res.json();
  },

  // 2. Anivexa Multi-Provider Episode & Stream Fetchers
  async getEpisodes(anilistId) {
    const res = await fetch(`/api/episodes/${anilistId}`);
    if (!res.ok) throw new Error("Bölüm listesi alınamadı");
    return res.json();
  },

  async getWatchStream(provider, anilistId, audio = "sub", epSlug, signal = null) {
    const res = await fetch(`/api/watch/${provider}/${anilistId}/${audio}/${epSlug}`, { signal });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Sunucu yanıt vermedi (${res.status})`);
    }
    return res.json();
  },

  // 3. User Authentication & Profile
  async register(username, email, password) {
    const res = await fetch(`/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Kayıt başarısız oldu");
    return data;
  },

  async login(emailOrUsername, password) {
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Giriş başarısız oldu");
    return data;
  },

  async anilistLogin(anilistUsername) {
    const res = await fetch(`/api/auth/anilist-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anilistUsername })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AniList ile giriş yapılamadı");
    return data;
  },

  async malLogin(malUsername) {
    const res = await fetch(`/api/auth/mal-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ malUsername })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "MyAnimeList ile giriş yapılamadı");
    return data;
  },

  async getMe() {
    const res = await fetch(`/api/auth/me`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error("Oturum süresi dolmuş veya geçersiz");
    return res.json();
  },

  async logout() {
    try {
      await fetch(`/api/auth/logout`, {
        method: "POST",
        headers: this.getAuthHeaders()
      });
    } catch {}
    localStorage.removeItem("animeria_auth_token");
    localStorage.removeItem("animeria_current_user");
  },

  async updateProfile(profileData) {
    const res = await fetch(`/api/auth/profile`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profil güncellenemedi");
    return data;
  },

  // 4. Watchlist & Stats Sync
  async getWatchlist() {
    const res = await fetch(`/api/user/watchlist`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error("İzleme listesi alınamadı");
    return res.json();
  },

  async updateWatchlistItem(entryData) {
    const res = await fetch(`/api/user/watchlist/update`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Liste güncellenemedi");
    return data;
  },

  async removeWatchlistItem(animeId) {
    const res = await fetch(`/api/user/watchlist/${animeId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Öğe silinemedi");
    return data;
  },

  async syncWatchProgress(watchData) {
    if (!this.getToken()) return null;
    try {
      const res = await fetch(`/api/user/sync-watch`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(watchData)
      });
      return await res.json();
    } catch (err) {
      console.warn("Watch progress sync failed:", err.message);
      return null;
    }
  },

  // 5. Watchlist Importers
  async importAniList(username) {
    const res = await fetch(`/api/import/anilist`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AniList içe aktarma başarısız oldu");
    return data;
  },

  async importMyAnimeList(username) {
    const res = await fetch(`/api/import/myanimelist`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "MyAnimeList içe aktarma başarısız oldu");
    return data;
  },

  // 6. Episode Comments & Spoiler
  async getComments(animeId, epNumber = 1) {
    const res = await fetch(`/api/comments/${animeId}/${epNumber}`);
    if (!res.ok) throw new Error("Yorumlar alınamadı");
    return res.json();
  },

  async addComment({ animeId, epNumber = 1, text, isSpoiler = false }) {
    const res = await fetch(`/api/comments`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ animeId, epNumber, text, isSpoiler })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yorum eklenemedi");
    return data;
  },

  async likeComment(commentId) {
    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: "POST",
      headers: this.getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Beğeni işlemi başarısız");
    return data;
  },

  async deleteComment(commentId) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yorum silinemedi");
    return data;
  },

  async getSkipTimes(animeId, epNumber = 1) {
    try {
      const res = await fetch(`/api/skip-times/${animeId}/${epNumber}`);
      if (!res.ok) return { found: false };
      return res.json();
    } catch {
      return { found: false };
    }
  },

  async getFranchiseWatchOrder(animeId) {
    try {
      const res = await fetch(`/api/anime/${animeId}/franchise`);
      if (!res.ok) return { franchise: [], total: 0 };
      return res.json();
    } catch {
      return { franchise: [], total: 0 };
    }
  },

  async translateText(text, target = "tr") {
    if (!text) return "";
    try {
      const res = await fetch(`/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target })
      });
      if (!res.ok) return text;
      const data = await res.json();
      const tr = data.translated || "";
      if (
        tr &&
        !tr.includes("QUERY LENGTH LIMIT") &&
        !tr.includes("MYMEMORY WARNING") &&
        !tr.includes("YOU USED ALL AVAILABLE")
      ) {
        return tr;
      }
      return text;
    } catch {
      return text;
    }
  },

  // 7. Proxy Formatters
  getProxyM3U8Url(streamUrl, referer = "") {
    if (!streamUrl) return "";
    return `/api/proxy/m3u8?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(referer)}`;
  },

  getProxySubUrl(subUrl) {
    if (!subUrl) return "";
    return `/api/proxy/sub?url=${encodeURIComponent(subUrl)}`;
  }
};

window.API = API;

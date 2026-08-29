/* ==========================================================================
   ANIMERIA — EPISODE COMMENTS & SPOILER CONTROLLER
   Full Episode-based Discussions with Spoiler Blurring & Real-time Likes
   ========================================================================== */

class EpisodeCommentsController {
  constructor() {
    this.container = document.getElementById("episodeCommentsSection");
    this.animeId = null;
    this.epNumber = 1;
    this.comments = [];
    this.revealedSpoilers = new Set();
  }

  init() {
    if (!this.container) return;

    // Get initial animeId and epNumber from URL
    const params = new URLSearchParams(window.location.search);
    this.animeId = params.get("id");
    this.epNumber = parseInt(params.get("ep")) || 1;

    // Listen for episode changes from Video Player
    window.addEventListener("animeria:episode-changed", (e) => {
      if (e.detail?.animeId) this.animeId = e.detail.animeId;
      if (e.detail?.epNumber) this.epNumber = parseInt(e.detail.epNumber) || 1;
      this.loadComments();
    });

    // Listen for user changes
    window.addEventListener("animeria:user-changed", () => {
      this.render();
    });

    // Listen for language changes
    window.addEventListener("animeria:lang-changed", () => {
      this.render();
    });

    if (this.animeId) {
      this.loadComments();
    }
  }

  async loadComments() {
    if (!this.animeId) return;

    try {
      const data = await window.API.getComments(this.animeId, this.epNumber);
      this.comments = data.comments || [];
      this.render();
    } catch (err) {
      console.warn("Failed to load episode comments:", err);
      this.comments = [];
      this.render();
    }
  }

  formatTimeAgo(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    const lang = window.I18n.currentLang;

    if (diffSecs < 60) {
      return lang === "en" ? "Just now" : "Az önce";
    }
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `${diffMins} ${lang === "en" ? "minutes ago" : "dakika önce"}`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} ${lang === "en" ? "hours ago" : "saat önce"}`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${lang === "en" ? "days ago" : "gün önce"}`;
  }

  render() {
    if (!this.container) return;

    const currentUser = window.Auth?.currentUser;
    const lang = window.I18n.currentLang;
    const t = (key) => window.I18n.t(key);

    const userAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=guest`;
    const commentsCount = this.comments.length;

    this.container.innerHTML = `
      <div class="comments-deck-header">
        <div class="comments-title-wrap">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h3 class="comments-title">
            <span>${t('comments_header_title')}</span>
            <span class="mono-tag score" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;">EP ${this.epNumber} (${commentsCount})</span>
          </h3>
        </div>
      </div>

      <!-- Community & Spoiler Rule Warning Banner -->
      <div class="comments-rule-warning-card">
        <div class="warning-icon-badge">⚠️</div>
        <div class="warning-text-col">
          <strong data-i18n="comments_rule_title">${t('comments_rule_title')}</strong>
          <span data-i18n="comments_rule_desc">${t('comments_rule_desc')}</span>
        </div>
      </div>

      <!-- Comment Post Box -->
      <div class="comment-input-card">
        ${currentUser ? `
          <div class="comment-input-row">
            <img src="${userAvatar}" alt="${currentUser.username}" class="comment-user-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.username)}'"/>
            <div class="comment-input-body">
              <textarea class="comment-textarea" id="commentTextInput" rows="2" placeholder="${t('comments_input_placeholder')}" data-i18n-placeholder="comments_input_placeholder"></textarea>
              <div class="comment-input-actions">
                <label class="spoiler-toggle-label">
                  <input type="checkbox" id="commentSpoilerCheck" class="spoiler-checkbox"/>
                  <span class="spoiler-indicator">⚠️</span>
                  <span data-i18n="comments_spoiler_checkbox">${t('comments_spoiler_checkbox')}</span>
                </label>
                <button class="btn btn-primary btn-post-comment" id="btnPostComment">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  <span data-i18n="comments_post_btn">${t('comments_post_btn')}</span>
                </button>
              </div>
            </div>
          </div>
        ` : `
          <div class="comment-guest-prompt">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span data-i18n="comments_login_prompt">${t('comments_login_prompt')}</span>
            <button class="btn btn-secondary btn-sm" id="btnCommentLogin" style="margin-left: 0.5rem;">
              <span data-i18n="comments_login_btn">${t('comments_login_btn')}</span>
            </button>
          </div>
        `}
      </div>

      <!-- Comments List -->
      <div class="comments-list-deck" id="commentsListDeck">
        ${commentsCount === 0 ? `
          <div class="empty-comments-box">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity: 0.4;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p data-i18n="comments_empty">${t('comments_empty')}</p>
          </div>
        ` : ''}
      </div>
    `;

    // Bind comment submission & guest login
    if (currentUser) {
      const postBtn = document.getElementById("btnPostComment");
      const textInput = document.getElementById("commentTextInput");
      const spoilerCheck = document.getElementById("commentSpoilerCheck");

      postBtn?.addEventListener("click", async () => {
        const text = textInput.value.trim();
        if (!text) return;

        try {
          postBtn.disabled = true;
          postBtn.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>`;

          const res = await window.API.addComment({
            animeId: this.animeId,
            epNumber: this.epNumber,
            text,
            isSpoiler: spoilerCheck.checked
          });

          this.comments.unshift(res.comment);
          this.render();
          window.UI.showToast(lang === "en" ? "Comment posted!" : "Yorumunuz yayınlandı!");
        } catch (err) {
          window.UI.showToast("Hata: " + err.message);
        } finally {
          postBtn.disabled = false;
        }
      });
    } else {
      document.getElementById("btnCommentLogin")?.addEventListener("click", () => {
        window.Auth.openAuthModal();
      });
    }

    // Render individual comment cards
    const listDeck = document.getElementById("commentsListDeck");
    if (listDeck && commentsCount > 0) {
      listDeck.innerHTML = "";
      const fragment = document.createDocumentFragment();

      this.comments.forEach(comment => {
        const isOwner = currentUser && comment.userId === currentUser.id;
        const isLiked = currentUser && Array.isArray(comment.likes) && comment.likes.includes(currentUser.id);
        const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0;
        const timeAgo = this.formatTimeAgo(comment.createdAt);
        const isRevealed = !comment.isSpoiler || this.revealedSpoilers.has(comment.id);

        const card = document.createElement("div");
        card.className = `comment-card ${comment.isSpoiler ? 'is-spoiler' : ''}`;
        card.id = `comment_${comment.id}`;

        const isBlurred = comment.isSpoiler && !isRevealed;

        const textHtml = `
          <div class="comment-text-container ${isBlurred ? 'spoiler-blurred-wrapper' : ''}" data-id="${comment.id}">
            ${comment.isSpoiler ? `<span class="spoiler-tag-pill">SPOILER</span>` : ''}
            <div class="comment-text ${isBlurred ? 'spoiler-text-blurred' : ''}">${this.escapeHtml(comment.text)}</div>
            ${isBlurred ? `
              <div class="spoiler-click-overlay" data-id="${comment.id}">
                <div class="spoiler-click-badge">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.5L20.3 19H3.7L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                  <span data-i18n="comments_spoiler_hint">${t('comments_spoiler_hint')}</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;

        card.innerHTML = `
          <div class="comment-card-header">
            <div class="comment-author-info">
              <img src="${comment.userAvatar}" alt="${comment.username}" class="comment-card-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.username)}'"/>
              <div>
                <span class="comment-author-name">${this.escapeHtml(comment.username)}</span>
                <span class="comment-timestamp">${timeAgo}</span>
              </div>
            </div>
            ${isOwner ? `
              <button class="btn-icon btn-delete-comment" data-id="${comment.id}" title="${t('comments_delete')}" style="width: 26px; height: 26px; opacity: 0.6;">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>

          <div class="comment-card-content">
            ${textHtml}
          </div>

          <div class="comment-card-footer">
            <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-id="${comment.id}">
              <svg width="14" height="14" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              <span class="like-count">${likesCount}</span>
            </button>
          </div>
        `;

        // Spoiler reveal handler (Click anywhere on blurred comment or badge)
        card.querySelector(".spoiler-blurred-wrapper")?.addEventListener("click", () => {
          this.revealedSpoilers.add(comment.id);
          this.render();
        });

        // Like handler
        card.querySelector(".comment-like-btn")?.addEventListener("click", async (e) => {
          if (!currentUser) {
            window.Auth.openAuthModal();
            return;
          }
          const res = await window.API.likeComment(comment.id);
          if (res.isLiked) {
            comment.likes.push(currentUser.id);
          } else {
            comment.likes = comment.likes.filter(id => id !== currentUser.id);
          }
          this.render();
        });

        // Delete handler
        card.querySelector(".btn-delete-comment")?.addEventListener("click", async () => {
          if (confirm(lang === "en" ? "Delete this comment?" : "Bu yorumu silmek istediğinize emin misiniz?")) {
            await window.API.deleteComment(comment.id);
            this.comments = this.comments.filter(c => c.id !== comment.id);
            this.render();
            window.UI.showToast(lang === "en" ? "Comment deleted." : "Yorum silindi.");
          }
        });

        fragment.appendChild(card);
      });

      listDeck.appendChild(fragment);
    }
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.EpisodeComments = new EpisodeCommentsController();
  window.EpisodeComments.init();
});

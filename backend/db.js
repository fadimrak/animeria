import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const WATCHLISTS_FILE = path.join(DATA_DIR, "watchlists.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data || JSON.stringify(defaultValue));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Password Hashing Helper using native crypto (Scrypt 64-byte + 32-byte salt + timingSafeEqual)
function hashPassword(password, salt = crypto.randomBytes(32).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const checkHash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
  } catch {
    return false;
  }
}

export const DB = {
  // --- USERS ---
  getUsers() {
    return readJsonFile(USERS_FILE, []);
  },

  saveUsers(users) {
    writeJsonFile(USERS_FILE, users);
  },

  findUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserByUsername(username) {
    if (!username) return null;
    const users = this.getUsers();
    return users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  findUserByAniList(anilistUsername) {
    if (!anilistUsername) return null;
    const users = this.getUsers();
    return users.find(u => u.anilistUsername && u.anilistUsername.toLowerCase() === anilistUsername.toLowerCase()) || null;
  },

  findUserByMAL(malUsername) {
    if (!malUsername) return null;
    const users = this.getUsers();
    return users.find(u => u.malUsername && u.malUsername.toLowerCase() === malUsername.toLowerCase()) || null;
  },

  createUser({ username, email, password, avatar, banner, bio, anilistUsername, malUsername }) {
    const users = this.getUsers();
    let pwdData = { hash: "", salt: "" };
    if (password) {
      pwdData = hashPassword(password);
    }

    const newUser = {
      id: "usr_" + crypto.randomBytes(8).toString("hex"),
      username: username.trim(),
      email: email ? email.trim().toLowerCase() : "",
      passwordHash: pwdData.hash,
      passwordSalt: pwdData.salt,
      role: users.length === 0 ? "ADMIN" : "USER", // First user is automatically Admin
      avatar: avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(username),
      banner: banner || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
      bio: bio || "Animeria anime kaşifi 🖤",
      anilistUsername: anilistUsername || null,
      malUsername: malUsername || null,
      failedLogins: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  // Account Lockout: Records failed login attempt and locks account if threshold reached
  recordFailedLogin(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.failedLogins = (user.failedLogins || 0) + 1;
    if (user.failedLogins >= 5) {
      user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
    }
    user.updatedAt = new Date().toISOString();
    this.saveUsers(users);
  },

  // Account Lockout: Resets failed login counter upon successful authentication
  resetFailedLogins(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.failedLogins = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    this.saveUsers(users);
  },

  // Mass Assignment Protection: Only updates whitelisted profile fields
  updateUserProfile(id, { avatar, banner, bio, anilistUsername, malUsername }) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    const allowed = {};
    if (avatar !== undefined) allowed.avatar = avatar;
    if (banner !== undefined) allowed.banner = banner;
    if (bio !== undefined) allowed.bio = bio;
    if (anilistUsername !== undefined) allowed.anilistUsername = anilistUsername;
    if (malUsername !== undefined) allowed.malUsername = malUsername;

    users[idx] = {
      ...users[idx],
      ...allowed,
      updatedAt: new Date().toISOString()
    };
    this.saveUsers(users);
    return users[idx];
  },

  updateUserSecurity(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    users[idx] = {
      ...users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveUsers(users);
    return users[idx];
  },

  // --- SESSIONS & REFRESH TOKEN ROTATION ---
  getSessions() {
    return readJsonFile(SESSIONS_FILE, {});
  },

  saveSessions(sessions) {
    writeJsonFile(SESSIONS_FILE, sessions);
  },

  createSession(userId, token = crypto.randomBytes(32).toString("hex")) {
    const sessions = this.getSessions();
    sessions[token] = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    this.saveSessions(sessions);
    return token;
  },

  getUserByToken(token) {
    if (!token) return null;
    const sessions = this.getSessions();
    const session = sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete sessions[token];
      this.saveSessions(sessions);
      return null;
    }
    return this.findUserById(session.userId);
  },

  // Refresh Token Rotation & Reuse Detection
  rotateSession(oldToken, newToken = crypto.randomBytes(32).toString("hex")) {
    const sessions = this.getSessions();
    const session = sessions[oldToken];
    if (!session) return null; // Old token doesn't exist (potential token reuse attack)

    delete sessions[oldToken];
    sessions[newToken] = {
      userId: session.userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    this.saveSessions(sessions);
    return { newToken, userId: session.userId };
  },

  revokeAllUserSessions(userId) {
    const sessions = this.getSessions();
    for (const [token, session] of Object.entries(sessions)) {
      if (session.userId === userId) {
        delete sessions[token];
      }
    }
    this.saveSessions(sessions);
  },

  deleteSession(token) {
    if (!token) return;
    const sessions = this.getSessions();
    delete sessions[token];
    this.saveSessions(sessions);
  },

  // --- WATCHLISTS ---
  getWatchlists() {
    return readJsonFile(WATCHLISTS_FILE, {});
  },

  saveWatchlists(watchlists) {
    writeJsonFile(WATCHLISTS_FILE, watchlists);
  },

  getUserWatchlist(userId) {
    const watchlists = this.getWatchlists();
    return watchlists[userId] || [];
  },

  saveUserWatchlist(userId, list) {
    const watchlists = this.getWatchlists();
    watchlists[userId] = list;
    this.saveWatchlists(watchlists);
  },

  upsertWatchlistItem(userId, item) {
    const list = this.getUserWatchlist(userId);
    const existingIdx = list.findIndex(entry => String(entry.animeId) === String(item.animeId));

    const updatedEntry = {
      animeId: item.animeId,
      title: item.title || { romaji: "Anime", english: "Anime" },
      coverImage: item.coverImage || {},
      bannerImage: item.bannerImage || null,
      format: item.format || "TV",
      episodesTotal: item.episodesTotal || item.episodes || 0,
      duration: item.duration || 24, // in minutes
      genres: item.genres || [],
      status: item.status || "WATCHING", // WATCHING, COMPLETED, PLANNING, PAUSED, DROPPED
      progress: Math.max(0, parseInt(item.progress) || 0),
      score: Math.max(0, Math.min(10, parseFloat(item.score) || 0)),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...updatedEntry };
    } else {
      list.unshift(updatedEntry);
    }

    this.saveUserWatchlist(userId, list);
    return updatedEntry;
  },

  // Calculate comprehensive statistics for user
  calculateUserStats(userId) {
    const list = this.getUserWatchlist(userId);
    let totalEpisodesWatched = 0;
    let totalMinutesWatched = 0;
    let totalScoreSum = 0;
    let scoredAnimeCount = 0;

    const statusCounts = {
      WATCHING: 0,
      COMPLETED: 0,
      PLANNING: 0,
      PAUSED: 0,
      DROPPED: 0
    };

    const genreCounts = {};

    list.forEach(item => {
      const status = item.status || "WATCHING";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }

      const epWatched = item.progress || (status === "COMPLETED" ? (item.episodesTotal || 12) : 0);
      const epDuration = item.duration || 24; // standard 24 mins if unknown

      totalEpisodesWatched += epWatched;
      totalMinutesWatched += epWatched * epDuration;

      if (item.score && item.score > 0) {
        totalScoreSum += item.score;
        scoredAnimeCount++;
      }

      if (Array.isArray(item.genres)) {
        item.genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    const totalHoursWatched = parseFloat((totalMinutesWatched / 60).toFixed(1));
    const totalDaysWatched = parseFloat((totalHoursWatched / 24).toFixed(1));
    const averageScore = scoredAnimeCount > 0 ? parseFloat((totalScoreSum / scoredAnimeCount).toFixed(1)) : 0;

    // Top genres sorted
    const topGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalAnime: list.length,
      totalCompleted: statusCounts.COMPLETED,
      totalWatching: statusCounts.WATCHING,
      totalPlanning: statusCounts.PLANNING,
      totalPaused: statusCounts.PAUSED,
      totalDropped: statusCounts.DROPPED,
      totalEpisodes: totalEpisodesWatched,
      totalMinutes: totalMinutesWatched,
      totalHours: totalHoursWatched,
      totalDays: totalDaysWatched,
      averageScore,
      statusCounts,
      topGenres
    };
  },

  // --- COMMENTS & SPOILERS ---
  getComments() {
    return readJsonFile(COMMENTS_FILE, []);
  },

  saveComments(comments) {
    writeJsonFile(COMMENTS_FILE, comments);
  },

  getEpisodeComments(animeId, epNumber) {
    const comments = this.getComments();
    return comments
      .filter(c => String(c.animeId) === String(animeId) && Number(c.epNumber) === Number(epNumber))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addComment({ animeId, epNumber, userId, username, userAvatar, text, isSpoiler = false }) {
    const comments = this.getComments();
    const newComment = {
      id: "cmt_" + crypto.randomBytes(8).toString("hex"),
      animeId: String(animeId),
      epNumber: Number(epNumber) || 1,
      userId,
      username: username.trim(),
      userAvatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      text: text.trim(),
      isSpoiler: Boolean(isSpoiler),
      likes: [],
      createdAt: new Date().toISOString()
    };
    comments.unshift(newComment);
    this.saveComments(comments);
    return newComment;
  },

  toggleLikeComment(commentId, userId) {
    const comments = this.getComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return null;

    if (!Array.isArray(comment.likes)) comment.likes = [];
    const idx = comment.likes.indexOf(userId);
    let isLiked = false;

    if (idx >= 0) {
      comment.likes.splice(idx, 1);
      isLiked = false;
    } else {
      comment.likes.push(userId);
      isLiked = true;
    }

    this.saveComments(comments);
    return { isLiked, likesCount: comment.likes.length };
  },

  deleteComment(commentId, userId) {
    const comments = this.getComments();
    const commentIdx = comments.findIndex(c => c.id === commentId);
    if (commentIdx === -1) return false;

    // Only creator can delete
    if (comments[commentIdx].userId !== userId) {
      throw new Error("Bu yorumu silme yetkiniz yok.");
    }

    comments.splice(commentIdx, 1);
    this.saveComments(comments);
    return true;
  },

  verifyPassword,
  hashPassword
};

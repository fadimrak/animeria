import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import anivexaWorker from "./Anivexa-API-main/index.js";
import { getEpisodesResponse, getFilteredEpisodesResponse } from "./Anivexa-API-main/core/episode-cache.js";
import { resolveProviders } from "./Anivexa-API-main/core/episode-strategy.js";
import { mapAnimeIds } from "./Anivexa-API-main/core/mapper.js";
import { getMedia } from "./Anivexa-API-main/core/anilist.js";

import { ENV } from "./backend/security/env.js";
import { configureSecurityHeaders } from "./backend/security/headers.js";
import { globalApiLimiter, authBruteForceLimiter, commentRateLimiter, proxyRateLimiter } from "./backend/security/rateLimiter.js";
import { sanitizePayloadMiddleware, sanitizeText, encodeHtmlEntities } from "./backend/security/sanitizer.js";
import { validateBody, RegisterSchema, LoginSchema, CommentSchema, ProfileUpdateSchema, WatchlistSyncSchema } from "./backend/security/validator.js";
import { validateSafeExternalUrl, isSafeRedirectUrl } from "./backend/security/ssrfGuard.js";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, getCookieOptions } from "./backend/security/jwt.js";
import { setupTwoFactor, verifyTwoFactorCode, verifyAndConsumeBackupCode } from "./backend/security/twoFactor.js";
import { requireRole, checkResourceOwnership, ROLES } from "./backend/security/rbac.js";
import { validateImageBuffer } from "./backend/security/fileUpload.js";
import { auditLogger } from "./backend/security/auditLogger.js";
import { DB } from "./backend/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = ENV.PORT;

// Disable X-Powered-By header to prevent server fingerprinting
app.disable("x-powered-by");

// 1. Trust Proxy for reverse proxies (Cloudflare, Nginx, Render)
app.set("trust proxy", 1);

// 2. Security Headers (Helmet, CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
app.use(configureSecurityHeaders());

// 3. CORS Policy Hardening (Explicit origins, credentials)
const allowedOrigins = ENV.CORS_ORIGIN
  ? ENV.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow in development
    if (!ENV.IS_PROD) return callback(null, true);
    // Allow railway.app subdomains automatically
    if (origin.endsWith(".up.railway.app")) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy violation"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Auth-Token", "Accept"],
}));

// 4. Request Size Limiting (Prevents memory exhaustion)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: false }));
app.use(cookieParser(ENV.SESSION_SECRET));

// 5. Prototype Pollution & NoSQL Injection Sanitization
app.use(sanitizePayloadMiddleware);

// 6. Global Public API Rate Limiting
app.use("/api/", globalApiLimiter);

// 7. Static Assets
app.use(express.static(path.join(__dirname, "public")));

// Auth Token Middleware (Supports JWT + HttpOnly Cookies + Sessions)
function getAuthUser(req) {
  const header = req.headers.authorization || "";
  let token = header.startsWith("Bearer ") ? header.substring(7).trim() : (req.query.token || req.headers["x-auth-token"] || "");

  // Check HttpOnly Cookie fallback
  if (!token && req.cookies?.animeria_access_token) {
    token = req.cookies.animeria_access_token;
  }
  if (!token && req.signedCookies?.animeria_access_token) {
    token = req.signedCookies.animeria_access_token;
  }

  if (!token) return null;

  // Try JWT verification first
  const jwtPayload = verifyAccessToken(token);
  if (jwtPayload?.sub) {
    const user = DB.findUserById(jwtPayload.sub);
    if (user) return user;
  }

  // Fallback to session token in DB
  return DB.getUserByToken(token);
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Giriş yapmanız gerekiyor (Unauthorized)", code: "UNAUTHORIZED" });
  }
  req.user = user;
  next();
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ANILIST_URL = "https://graphql.anilist.co";

// Simple in-memory cache for AniList metadata
const cache = new Map();
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
function setCache(key, data, ttlMs = 15 * 60 * 1000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// AniList GraphQL Fetcher Helper with Auto-Retry & Backoff
async function queryAniList(query, variables = {}, retries = 2) {
  const cacheKey = `al:${JSON.stringify({ query, variables })}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": UA,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
          continue;
        }
        throw new Error(`AniList error HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "AniList GraphQL error");
      }

      const result = json.data;
      setCache(cacheKey, result, 10 * 60 * 1000);
      return result;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      } else {
        throw err;
      }
    }
  }
}

/* =========================================================================
   ANILIST API ROUTES
   ========================================================================= */

// 1. Trending Anime
app.get("/api/anime/trending", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(30, Math.max(1, parseInt(req.query.perPage) || 18));
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            status
            averageScore
            genres
            seasonYear
            season
            format
          }
        }
      }
    `;
    const data = await queryAniList(query, { page, perPage });
    res.json(data.Page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Popular Anime
app.get("/api/anime/popular", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(30, Math.max(1, parseInt(req.query.perPage) || 18));
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            status
            averageScore
            genres
            seasonYear
            season
            format
          }
        }
      }
    `;
    const data = await queryAniList(query, { page, perPage });
    res.json(data.Page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Top Rated Anime
app.get("/api/anime/top", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(30, Math.max(1, parseInt(req.query.perPage) || 18));
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, sort: SCORE_DESC) {
            id
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            status
            averageScore
            genres
            seasonYear
            format
          }
        }
      }
    `;
    const data = await queryAniList(query, { page, perPage });
    res.json(data.Page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Recently Released / Updated
app.get("/api/anime/recent", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(30, Math.max(1, parseInt(req.query.perPage) || 18));
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, status_in: [RELEASING, NOT_YET_RELEASED], sort: START_DATE_DESC) {
            id
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            status
            averageScore
            genres
            seasonYear
            format
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
      }
    `;
    const data = await queryAniList(query, { page, perPage });
    res.json(data.Page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Anime Search & Filters
app.get("/api/anime/search", async (req, res) => {
  try {
    const search = req.query.q ? String(req.query.q).trim() : undefined;
    const genre = req.query.genre ? String(req.query.genre).trim() : undefined;
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const season = req.query.season ? String(req.query.season).toUpperCase() : undefined;
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const sort = req.query.sort ? [String(req.query.sort)] : ["SEARCH_MATCH", "POPULARITY_DESC"];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(30, Math.max(1, parseInt(req.query.perPage) || 18));

    const variables = { page, perPage, sort };
    if (search) variables.search = search;
    if (genre && genre !== "ALL") variables.genre = genre;
    if (year) variables.seasonYear = year;
    if (season && season !== "ALL") variables.season = season;
    if (status && status !== "ALL") variables.status = status;

    const query = `
      query ($page: Int, $perPage: Int, $search: String, $genre: String, $seasonYear: Int, $season: MediaSeason, $status: MediaStatus, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          media(type: ANIME, search: $search, genre: $genre, seasonYear: $seasonYear, season: $season, status: $status, sort: $sort) {
            id
            title { romaji english native }
            coverImage { extraLarge large medium }
            bannerImage
            description(asHtml: false)
            episodes
            status
            averageScore
            genres
            seasonYear
            format
          }
        }
      }
    `;
    const data = await queryAniList(query, variables);
    res.json(data.Page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Anime Details
app.get("/api/anime/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid AniList ID" });

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large medium }
          bannerImage
          description(asHtml: false)
          format
          episodes
          duration
          status
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          synonyms
          studios(isMain: true) {
            nodes { id name }
          }
          trailer { id site thumbnail }
          nextAiringEpisode { episode airingAt timeUntilAiring }
          characters(perPage: 8, sort: ROLE) {
            edges {
              role
              node {
                id
                name { full native }
                image { medium large }
              }
              voiceActors(language: JAPANESE) {
                name { full }
                image { medium }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                title { romaji english }
                coverImage { medium large }
                format
                status
              }
            }
          }
          recommendations(perPage: 7, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                title { romaji english }
                coverImage { medium large }
                averageScore
                format
              }
            }
          }
        }
      }
    `;
    const data = await queryAniList(query, { id });
    if (!data.Media) return res.status(404).json({ error: "Anime not found" });
    res.json(data.Media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Genre list
app.get("/api/anime-genres", async (req, res) => {
  const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
    "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological",
    "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
  ];
  res.json(genres);
});

/* =========================================================================
   ANIVEXA STREAMING API INTEGRATION
   ========================================================================= */

// Episode Aggregator with Instant Caching & Ultra-Fast Provider Set
const FAST_PROVIDERS = new Set(["animedunya", "reanime", "2dhive", "anikoto"]);

function withTimeout(promise, ms = 3500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Provider Timeout")), ms))
  ]);
}

const fillerCache = new Map();

async function getFillersForAnime(titleRomaji, titleEnglish, anilistId) {
  const cacheKey = `filler:${anilistId}`;
  if (fillerCache.has(cacheKey)) return fillerCache.get(cacheKey);

  const slugs = [];
  const clean = (str) => (str || "").toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  if (titleEnglish) slugs.push(clean(titleEnglish));
  if (titleRomaji) slugs.push(clean(titleRomaji));

  // Canonical slug aliases for popular long-running anime
  if (anilistId === 21 || slugs.some(s => s.includes("one-piece"))) slugs.unshift("one-piece");
  if (anilistId === 20 || slugs.some(s => s === "naruto")) slugs.unshift("naruto");
  if (anilistId === 1735 || slugs.some(s => s.includes("shippuden") || s.includes("shippuuden"))) slugs.unshift("naruto-shippuden");
  if (anilistId === 269 || slugs.some(s => s === "bleach")) slugs.unshift("bleach");
  if (anilistId === 235 || slugs.some(s => s.includes("detective-conan") || s.includes("case-closed"))) slugs.unshift("detective-conan");
  if (anilistId === 6702 || slugs.some(s => s.includes("fairy-tail"))) slugs.unshift("fairy-tail");
  if (anilistId === 97940 || slugs.some(s => s.includes("black-clover"))) slugs.unshift("black-clover");
  if (anilistId === 97938 || slugs.some(s => s.includes("boruto"))) slugs.unshift("boruto-naruto-next-generations");
  if (anilistId === 813 || slugs.some(s => s.includes("dragon-ball-z"))) slugs.unshift("dragon-ball-z");
  if (anilistId === 223 || slugs.some(s => s === "dragon-ball")) slugs.unshift("dragon-ball");
  if (anilistId === 21175 || slugs.some(s => s.includes("dragon-ball-super"))) slugs.unshift("dragon-ball-super");
  if (anilistId === 918 || slugs.some(s => s === "gintama")) slugs.unshift("gintama");

  const uniqueSlugs = Array.from(new Set(slugs)).filter(Boolean);

  for (const slug of uniqueSlugs) {
    try {
      const url = `https://www.animefillerlist.com/shows/${slug}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const html = await res.text();
        const fillers = new Set();

        const rowRegex = /<tr class="[^"]*(?:filler|anime_filler|mostly_filler)[^"]*"[^>]*>[\s\S]*?<td class="Number">(\d+)<\/td>/gi;
        let match;
        while ((match = rowRegex.exec(html)) !== null) {
          fillers.add(parseInt(match[1]));
        }

        const spanRegex = /class="filler"[^>]*>[\s\S]*?<span class="Episodes">([\d,\s-]+)<\/span>/gi;
        let spanMatch;
        while ((spanMatch = spanRegex.exec(html)) !== null) {
          const raw = spanMatch[1];
          raw.split(",").forEach(part => {
            part = part.trim();
            if (part.includes("-")) {
              const [s, e] = part.split("-").map(n => parseInt(n.trim()));
              if (!isNaN(s) && !isNaN(e)) {
                for (let i = s; i <= e; i++) fillers.add(i);
              }
            } else {
              const n = parseInt(part);
              if (!isNaN(n)) fillers.add(n);
            }
          });
        }

        if (fillers.size > 0) {
          fillerCache.set(cacheKey, fillers);
          return fillers;
        }
      }
    } catch (err) {}
  }

  const emptySet = new Set();
  fillerCache.set(cacheKey, emptySet);
  return emptySet;
}

async function enrichEpisodesWithFillers(data, anilistId) {
  if (!data || typeof data !== "object") return;
  try {
    let mediaTitle = null;
    try {
      const meta = await queryAniList(
        `query ($id: Int) { Media(id: $id, type: ANIME) { title { romaji english } } }`,
        { id: parseInt(anilistId) }
      );
      mediaTitle = meta?.Media?.title;
    } catch (e) {}

    const fillerSet = await getFillersForAnime(mediaTitle?.romaji, mediaTitle?.english, parseInt(anilistId));
    if (fillerSet && fillerSet.size > 0) {
      for (const provider of Object.values(data)) {
        if (provider?.episodes) {
          for (const list of Object.values(provider.episodes)) {
            if (Array.isArray(list)) {
              for (const ep of list) {
                if (fillerSet.has(parseInt(ep.number))) {
                  ep.filler = true;
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {}
}

app.get("/api/episodes/:anilistId", async (req, res) => {
  const anilistId = req.params.anilistId;
  const cacheKey = `eps:${anilistId}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  let data = null;

  try {
    data = await withTimeout(getFilteredEpisodesResponse(anilistId, FAST_PROVIDERS, true), 8000);
  } catch (err) {
    console.warn(`Fast episode fetch timed out or failed for ${anilistId}, attempting quick fallback:`, err.message);
    try {
      data = await withTimeout(getFilteredEpisodesResponse(anilistId, new Set(["animedunya", "reanime"]), false), 4500);
    } catch (fallbackErr) {
      try {
        data = await getEpisodesResponse(anilistId, {});
      } catch (finalErr) {
        return res.status(500).json({ error: finalErr.message });
      }
    }
  }

  if (data) {
    await enrichEpisodesWithFillers(data, anilistId);
    setCache(cacheKey, data, 60 * 60 * 1000); // 1 hour cache
    res.json(data);
  } else {
    res.status(404).json({ error: "Episodes not found" });
  }
});

// Filtered Episodes
app.get("/api/episodes/:providers/:anilistId", async (req, res) => {
  const { providers, anilistId } = req.params;
  const rawNames = providers.split("/");
  const { resolved, unknown } = resolveProviders(rawNames);
  if (resolved.size === 0) {
    return res.status(400).json({ error: "No valid providers specified", unknown });
  }
  try {
    const data = await getFilteredEpisodesResponse(anilistId, resolved, true);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Watch Resolver for chosen provider (with in-memory cache & rate-limit protection)
app.get("/api/watch/:provider/:id/:audio/:epSlug", async (req, res) => {
  const { provider, id, audio, epSlug } = req.params;
  const cacheKey = `watch:${provider}:${id}:${audio}:${epSlug}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const targetPath = `/watch/${provider}/${id}/${audio}/${epSlug}`;

  try {
    const syntheticReq = new Request(`http://localhost:${PORT}${targetPath}`, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
      },
    });

    const workerRes = await anivexaWorker.fetch(syntheticReq, {});
    const json = await workerRes.json();

    if (json && (json.streams?.length || json.stream_url || json.embeds?.length)) {
      setCache(cacheKey, json, 60 * 60 * 1000); // 1 hour memory cache
    }
    res.status(workerRes.status || 200).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   HLS / TS STREAM & SUBTITLE PROXY (Bypasses CORS & Hotlinking)
   ========================================================================= */

// Proxy Helper to resolve absolute URLs
function resolveUrl(relativeOrAbsolute, base) {
  try {
    return new URL(relativeOrAbsolute, base).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

// 1. M3U8 Playlist Proxy (SSRF Guarded, Rate Limited, Rewrites chunks and keys on the fly)
app.get("/api/proxy/m3u8", proxyRateLimiter, async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer || "";
  const origin = req.query.origin || "";

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target url parameter" });
  }

  // SSRF Protection: Validate target URL
  const ssrfCheck = validateSafeExternalUrl(targetUrl);
  if (!ssrfCheck.valid) {
    auditLogger.security("SSRF_ATTEMPT_M3U8", req, { targetUrl, reason: ssrfCheck.error });
    return res.status(403).json({ error: ssrfCheck.error, code: "SSRF_BLOCKED" });
  }

  try {
    const headers = {
      "User-Agent": UA,
      "Accept": "*/*",
    };
    if (referer) headers["Referer"] = referer;
    if (origin) headers["Origin"] = origin;

    const upstream = await fetch(targetUrl, { headers });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
    }

    const playlistText = await upstream.text();
    const lines = playlistText.split(/\r?\n/);
    const rewrittenLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        rewrittenLines.push(line);
        continue;
      }

      // Handle Key URI rewriting
      if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MAP:")) {
        const rewrittenKeyLine = line.replace(/URI="([^"]+)"/, (match, uri) => {
          const abs = resolveUrl(uri, targetUrl);
          const proxied = `/api/proxy/ts?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}`;
          return `URI="${proxied}"`;
        });
        rewrittenLines.push(rewrittenKeyLine);
        continue;
      }

      // Handle comments and metadata tags
      if (line.startsWith("#")) {
        rewrittenLines.push(line);
        continue;
      }

      // This is a media or playlist URI line
      const absUrl = resolveUrl(line, targetUrl);
      const isSubPlaylist = absUrl.includes(".m3u8");
      
      if (isSubPlaylist) {
        rewrittenLines.push(`/api/proxy/m3u8?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer)}`);
      } else {
        rewrittenLines.push(`/api/proxy/ts?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer)}`);
      }
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(rewrittenLines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: "Proxy hatası", code: "PROXY_ERROR" });
  }
});

// 2. TS / MP4 Segment Proxy (SSRF Guarded, Streams binary video data with range support)
app.get("/api/proxy/ts", proxyRateLimiter, async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer || "";

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target url" });
  }

  // SSRF Protection: Validate target URL
  const ssrfCheck = validateSafeExternalUrl(targetUrl);
  if (!ssrfCheck.valid) {
    auditLogger.security("SSRF_ATTEMPT_TS", req, { targetUrl, reason: ssrfCheck.error });
    return res.status(403).json({ error: ssrfCheck.error, code: "SSRF_BLOCKED" });
  }

  try {
    const headers = {
      "User-Agent": UA,
      "Accept": "*/*",
    };
    if (referer) headers["Referer"] = referer;
    if (req.headers.range) headers["Range"] = req.headers.range;

    const upstream = await fetch(targetUrl, { headers });
    
    res.status(upstream.status);
    
    for (const [key, value] of upstream.headers) {
      if (["content-type", "content-length", "content-range", "accept-ranges"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    if (upstream.body) {
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Segment aktarma hatası", code: "PROXY_ERROR" });
    }
  }
});

// Robust Subtitle Format Converter (ASS / SRT / VTT -> Standard WebVTT)
function convertAssToVtt(assText) {
  const lines = assText.split(/\r?\n/);
  const vtt = ["WEBVTT", ""];
  let inEvents = false;
  let formatFields = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[Events]")) {
      inEvents = true;
      continue;
    }
    if (inEvents && trimmed.startsWith("Format:")) {
      formatFields = trimmed.substring(7).split(",").map(f => f.trim().toLowerCase());
      continue;
    }
    if (inEvents && trimmed.startsWith("Dialogue:")) {
      const rest = trimmed.substring(9).trim();
      const parts = rest.split(",");
      if (parts.length >= formatFields.length) {
        const startIdx = formatFields.indexOf("start");
        const endIdx = formatFields.indexOf("end");
        const textIdx = formatFields.indexOf("text");

        const rawStart = parts[startIdx]?.trim() || "0:00:00.00";
        const rawEnd = parts[endIdx]?.trim() || "0:00:00.00";
        const rawText = parts.slice(textIdx).join(",").trim();

        const formatTime = (t) => {
          const m = t.match(/(\d+):(\d{2}):(\d{2})[.,](\d+)/);
          if (!m) return "00:00:00.000";
          const hh = m[1].padStart(2, "0");
          const mm = m[2];
          const ss = m[3];
          const ms = (m[4] + "000").slice(0, 3);
          return `${hh}:${mm}:${ss}.${ms}`;
        };

        // Strip ASS styling tags like {\an8}, {\pos(x,y)}, \N
        const cleanText = rawText
          .replace(/\{[^}]+\}/g, "")
          .replace(/\\N/g, "\n")
          .replace(/\\n/g, "\n")
          .replace(/\\h/g, " ")
          .trim();

        if (cleanText) {
          vtt.push(`${formatTime(rawStart)} --> ${formatTime(rawEnd)}`);
          vtt.push(cleanText);
          vtt.push("");
        }
      }
    }
  }
  return vtt.join("\n");
}

function convertSrtToVtt(srtText) {
  const normalized = srtText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const formatted = normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return "WEBVTT\n\n" + formatted;
}

// In-memory cache for parsed subtitles
const subCache = new Map();

// 3. Subtitles Proxy (SSRF Guarded, Converts ASS / SRT to WebVTT with In-Memory Caching)
app.get("/api/proxy/sub", proxyRateLimiter, async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Eksik altyazı URL'si" });

  try {
    if (targetUrl.includes("%3A%2F%2F")) {
      targetUrl = decodeURIComponent(targetUrl);
    }
  } catch {}

  // SSRF Protection: Validate target URL does not resolve to private / loopback / metadata IPs
  const ssrfCheck = validateSafeExternalUrl(targetUrl);
  if (!ssrfCheck.valid) {
    auditLogger.security("SSRF_ATTEMPT_SUB_PROXY", req, { targetUrl, reason: ssrfCheck.error });
    return res.status(403).json({ error: ssrfCheck.error, code: "SSRF_BLOCKED" });
  }

  if (subCache.has(targetUrl)) {
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    return res.send(subCache.get(targetUrl));
  }

  try {
    let upstream;
    try {
      upstream = await fetch(targetUrl, {
        headers: {
          "User-Agent": UA,
          "Accept": "*/*",
          "Referer": "https://anime-dunya.com/",
          "Origin": "https://anime-dunya.com"
        }
      });
    } catch {
      upstream = await fetch(targetUrl, { headers: { "User-Agent": UA } });
    }

    if (!upstream || !upstream.ok) {
      return res.status(upstream ? upstream.status : 500).json({ error: "Altyazı kaynağına ulaşılamadı" });
    }

    const text = await upstream.text();
    let resultVtt = "";

    if (text.trim().startsWith("WEBVTT")) {
      resultVtt = text;
    } else if (text.includes("[Script Info]") || text.includes("[Events]") || text.includes("Dialogue:")) {
      resultVtt = convertAssToVtt(text);
    } else {
      resultVtt = convertSrtToVtt(text);
    }

    if (subCache.size > 200) {
      const firstKey = subCache.keys().next().value;
      subCache.delete(firstKey);
    }
    subCache.set(targetUrl, resultVtt);

    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    res.send(resultVtt);
  } catch (err) {
    res.status(500).json({ error: "Altyazı işleme hatası", code: "PROXY_ERROR" });
  }
});

/* =========================================================================
   AUTHENTICATION & USER PROFILE API ROUTES
   ========================================================================= */

// 1. Register with Email & Password (Brute force & input validation protected)
app.post("/api/auth/register", authBruteForceLimiter, validateBody(RegisterSchema), (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (DB.findUserByUsername(username)) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanımda.", code: "USERNAME_TAKEN" });
    }
    if (DB.findUserByEmail(email)) {
      return res.status(400).json({ error: "Bu e-posta adresi ile zaten kayıt olunmuş.", code: "EMAIL_TAKEN" });
    }

    const user = DB.createUser({ username, email, password });
    const accessToken = generateAccessToken(user);
    const refreshToken = DB.createSession(user.id);
    const stats = DB.calculateUserStats(user.id);

    // Set secure HttpOnly cookies
    res.cookie("animeria_access_token", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("animeria_refresh_token", refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000));

    auditLogger.security("USER_REGISTERED", req, { userId: user.id, username: user.username });

    const { passwordHash, passwordSalt, twoFactorSecret, backupCodes, ...safeUser } = user;
    res.json({ success: true, token: accessToken, refreshToken, user: safeUser, stats });
  } catch (err) {
    auditLogger.error("REGISTER_ERROR", err);
    res.status(500).json({ error: "Kayıt işlemi sırasında bir hata oluştu.", code: "SERVER_ERROR" });
  }
});

// 2. Login with Email/Username & Password (Brute Force + Lockout + 2FA + JWT Protected)
app.post("/api/auth/login", authBruteForceLimiter, validateBody(LoginSchema), (req, res) => {
  try {
    const { emailOrUsername, password, twoFactorCode } = req.body;

    const user = DB.findUserByEmail(emailOrUsername) || DB.findUserByUsername(emailOrUsername);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı veya şifre hatalı.", code: "INVALID_CREDENTIALS" });
    }

    // Account Lockout Verification
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const remainingSec = Math.ceil((user.lockedUntil - Date.now()) / 1000);
      auditLogger.security("LOGIN_LOCKED_ACCOUNT_ATTEMPT", req, { userId: user.id, remainingSec });
      return res.status(423).json({
        error: `Çok fazla hatalı giriş denemesi nedeniyle hesabınız kilitlendi. Lütfen ${Math.ceil(remainingSec / 60)} dakika sonra tekrar deneyin.`,
        code: "ACCOUNT_LOCKED",
        retryAfter: remainingSec
      });
    }

    const isValid = DB.verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      DB.recordFailedLogin(user.id);
      auditLogger.security("LOGIN_FAILED_PASSWORD", req, { userId: user.id });
      return res.status(400).json({ error: "Kullanıcı adı veya şifre hatalı.", code: "INVALID_CREDENTIALS" });
    }

    // 2FA TOTP Verification (if enabled)
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          message: "İki adımlı doğrulama (2FA) kodu gereklidir.",
          code: "2FA_REQUIRED"
        });
      }

      const isTotpValid = verifyTwoFactorCode(user.twoFactorSecret, twoFactorCode);
      let isBackupValid = false;

      if (!isTotpValid) {
        const backupResult = verifyAndConsumeBackupCode(user.backupCodes, twoFactorCode);
        if (backupResult.valid) {
          isBackupValid = true;
          DB.updateUserSecurity(user.id, { backupCodes: backupResult.remainingCodes });
          auditLogger.security("2FA_BACKUP_CODE_USED", req, { userId: user.id });
        }
      }

      if (!isTotpValid && !isBackupValid) {
        auditLogger.security("LOGIN_FAILED_2FA", req, { userId: user.id });
        return res.status(400).json({ error: "Geçersiz 2FA doğrulama veya kurtarma kodu.", code: "INVALID_2FA" });
      }
    }

    // Reset failed login counter upon successful authentication
    DB.resetFailedLogins(user.id);

    const accessToken = generateAccessToken(user);
    const refreshToken = DB.createSession(user.id);
    const stats = DB.calculateUserStats(user.id);

    // Set secure HttpOnly cookies
    res.cookie("animeria_access_token", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("animeria_refresh_token", refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000));

    auditLogger.security("LOGIN_SUCCESS", req, { userId: user.id, username: user.username });

    const { passwordHash, passwordSalt, twoFactorSecret, backupCodes, ...safeUser } = user;
    res.json({ success: true, token: accessToken, refreshToken, user: safeUser, stats });
  } catch (err) {
    auditLogger.error("LOGIN_ERROR", err);
    res.status(500).json({ error: "Giriş işlemi sırasında bir hata oluştu.", code: "SERVER_ERROR" });
  }
});

// 2.1 Refresh Token Rotation Endpoint
app.post("/api/auth/refresh", (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.animeria_refresh_token || req.body.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ error: "Yenileme tokenı eksik", code: "REFRESH_TOKEN_MISSING" });
    }

    const rotated = DB.rotateSession(oldRefreshToken);
    if (!rotated) {
      res.clearCookie("animeria_access_token", getCookieOptions(0));
      res.clearCookie("animeria_refresh_token", getCookieOptions(0));
      auditLogger.security("TOKEN_REUSE_DETECTED", req);
      return res.status(401).json({ error: "Geçersiz veya süresi dolmuş oturum", code: "INVALID_SESSION" });
    }

    const user = DB.findUserById(rotated.userId);
    if (!user) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı", code: "USER_NOT_FOUND" });
    }

    const newAccessToken = generateAccessToken(user);
    res.cookie("animeria_access_token", newAccessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("animeria_refresh_token", rotated.newToken, getCookieOptions(30 * 24 * 60 * 60 * 1000));

    res.json({ success: true, token: newAccessToken, refreshToken: rotated.newToken });
  } catch (err) {
    res.status(500).json({ error: "Token yenilenemedi", code: "SERVER_ERROR" });
  }
});

// 2.2 Setup 2FA (Generates QR code & Secret)
app.post("/api/auth/2fa/setup", requireAuth, async (req, res) => {
  try {
    const twoFactorData = await setupTwoFactor(req.user.username);
    DB.updateUserSecurity(req.user.id, {
      tempTwoFactorSecret: twoFactorData.secret,
      tempBackupCodes: twoFactorData.backupCodes
    });

    res.json({
      success: true,
      qrCode: twoFactorData.qrCodeDataUrl,
      secret: twoFactorData.secret,
      backupCodes: twoFactorData.backupCodes,
      message: "Authenticator uygulamanızla QR kodu tarayın ve 6 haneli kodu doğrulayın."
    });
  } catch (err) {
    res.status(500).json({ error: "2FA kurulumu başlatılamadı." });
  }
});

// 2.3 Enable 2FA (Verifies 6-digit code and activates)
app.post("/api/auth/2fa/enable", requireAuth, (req, res) => {
  try {
    const { code } = req.body;
    const secret = req.user.tempTwoFactorSecret;
    if (!secret || !code) {
      return res.status(400).json({ error: "Doğrulama kodu gereklidir." });
    }

    const isValid = verifyTwoFactorCode(secret, code);
    if (!isValid) {
      return res.status(400).json({ error: "Doğrulama kodu hatalı. Lütfen tekrar deneyin." });
    }

    DB.updateUserSecurity(req.user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: req.user.tempBackupCodes || [],
      tempTwoFactorSecret: null,
      tempBackupCodes: null
    });

    auditLogger.security("2FA_ENABLED", req, { userId: req.user.id });
    res.json({ success: true, message: "İki adımlı doğrulama (2FA) başarıyla etkinleştirildi!" });
  } catch (err) {
    res.status(500).json({ error: "2FA etkinleştirilemedi." });
  }
});

// 2.4 Disable 2FA
app.post("/api/auth/2fa/disable", requireAuth, (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Güvenlik için şifrenizi girmeniz gereklidir." });
    }

    const isMatch = DB.verifyPassword(password, req.user.passwordHash, req.user.passwordSalt);
    if (!isMatch) {
      return res.status(400).json({ error: "Şifreniz hatalı." });
    }

    DB.updateUserSecurity(req.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: []
    });

    auditLogger.security("2FA_DISABLED", req, { userId: req.user.id });
    res.json({ success: true, message: "İki adımlı doğrulama devre dışı bırakıldı." });
  } catch (err) {
    res.status(500).json({ error: "2FA devre dışı bırakılamadı." });
  }
});

// 3. AniList Quick Login / Account Link
app.post("/api/auth/anilist-login", async (req, res) => {
  try {
    const { anilistUsername } = req.body;
    if (!anilistUsername || !anilistUsername.trim()) {
      return res.status(400).json({ error: "AniList kullanıcı adı gereklidir." });
    }

    const trimmedName = anilistUsername.trim();

    // Query AniList User Profile
    const query = `
      query ($name: String) {
        User(name: $name) {
          id
          name
          avatar { large medium }
          bannerImage
          about(asHtml: false)
          statistics {
            anime {
              count
              meanScore
              minutesWatched
              episodesWatched
            }
          }
        }
      }
    `;

    let anilistUser = null;
    try {
      const data = await queryAniList(query, { name: trimmedName });
      anilistUser = data.User;
    } catch (apiErr) {
      console.warn("AniList query error, creating user with fallback:", apiErr.message);
    }

    // Check if user already exists
    let user = DB.findUserByAniList(trimmedName) || DB.findUserByUsername(trimmedName);

    if (!user) {
      user = DB.createUser({
        username: trimmedName,
        anilistUsername: trimmedName,
        avatar: anilistUser?.avatar?.large || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedName)}`,
        banner: anilistUser?.bannerImage || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
        bio: anilistUser?.about ? anilistUser.about.slice(0, 160) : `AniList kullanıcısı: @${trimmedName}`
      });
    } else if (!user.anilistUsername) {
      user = DB.updateUser(user.id, {
        anilistUsername: trimmedName,
        avatar: user.avatar || anilistUser?.avatar?.large,
        banner: user.banner || anilistUser?.bannerImage
      });
    }

    const token = DB.createSession(user.id);
    const stats = DB.calculateUserStats(user.id);
    const { passwordHash, passwordSalt, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser,
      anilistData: anilistUser,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. MyAnimeList Quick Login / Account Link
app.post("/api/auth/mal-login", async (req, res) => {
  try {
    const { malUsername } = req.body;
    if (!malUsername || !malUsername.trim()) {
      return res.status(400).json({ error: "MyAnimeList kullanıcı adı gereklidir." });
    }

    const trimmedName = malUsername.trim();
    let malUser = null;

    try {
      const jikanRes = await fetch(`https://api.jikan.moe/v4/users/${encodeURIComponent(trimmedName)}/full`, {
        headers: { "User-Agent": UA }
      });
      if (jikanRes.ok) {
        const jikanData = await jikanRes.json();
        malUser = jikanData.data;
      }
    } catch (jikanErr) {
      console.warn("Jikan fetch failed, proceeding with fallback:", jikanErr.message);
    }

    let user = DB.findUserByMAL(trimmedName) || DB.findUserByUsername(trimmedName);

    if (!user) {
      user = DB.createUser({
        username: trimmedName,
        malUsername: trimmedName,
        avatar: malUser?.images?.jpg?.image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedName)}`,
        banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
        bio: malUser?.about ? malUser.about.slice(0, 160) : `MyAnimeList kullanıcısı: @${trimmedName}`
      });
    } else if (!user.malUsername) {
      user = DB.updateUser(user.id, {
        malUsername: trimmedName,
        avatar: user.avatar || malUser?.images?.jpg?.image_url
      });
    }

    const token = DB.createSession(user.id);
    const stats = DB.calculateUserStats(user.id);
    const { passwordHash, passwordSalt, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser,
      malData: malUser,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Current User Profile & Stats
app.get("/api/auth/me", requireAuth, (req, res) => {
  const stats = DB.calculateUserStats(req.user.id);
  const watchlist = DB.getUserWatchlist(req.user.id);
  const { passwordHash, passwordSalt, ...safeUser } = req.user;
  res.json({ user: safeUser, stats, watchlist });
});

// 6. Logout (Clears Cookies & Deletes Session Token)
app.post("/api/auth/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7).trim() : req.query.token;
  if (token) DB.deleteSession(token);

  res.clearCookie("animeria_access_token", getCookieOptions(0));
  res.clearCookie("animeria_refresh_token", getCookieOptions(0));
  res.json({ success: true, message: "Oturum kapatıldı" });
});

// 7. Update User Profile (Mass Assignment Safe with Strict Whitelist Schema)
app.put("/api/auth/profile", requireAuth, validateBody(ProfileUpdateSchema), (req, res) => {
  try {
    const updated = DB.updateUserProfile(req.user.id, req.body);
    const stats = DB.calculateUserStats(req.user.id);
    const { passwordHash, passwordSalt, twoFactorSecret, backupCodes, ...safeUser } = updated;
    res.json({ success: true, user: safeUser, stats });
  } catch (err) {
    res.status(500).json({ error: "Profil güncellenemedi.", code: "SERVER_ERROR" });
  }
});

/* =========================================================================
   WATCHLIST & REAL-TIME STATS API ROUTES
   ========================================================================= */

// 1. Get Watchlist
app.get("/api/user/watchlist", requireAuth, (req, res) => {
  const watchlist = DB.getUserWatchlist(req.user.id);
  const stats = DB.calculateUserStats(req.user.id);
  res.json({ watchlist, stats });
});

// 2. Add / Update Watchlist Item
app.post("/api/user/watchlist/update", requireAuth, (req, res) => {
  try {
    const { animeId, title, coverImage, bannerImage, format, episodesTotal, duration, genres, status, progress, score } = req.body;
    if (!animeId) return res.status(400).json({ error: "animeId is required" });

    const entry = DB.upsertWatchlistItem(req.user.id, {
      animeId,
      title,
      coverImage,
      bannerImage,
      format,
      episodesTotal,
      duration,
      genres,
      status,
      progress,
      score
    });

    const stats = DB.calculateUserStats(req.user.id);
    res.json({ success: true, entry, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Remove Item from Watchlist
app.delete("/api/user/watchlist/:animeId", requireAuth, (req, res) => {
  try {
    const list = DB.getUserWatchlist(req.user.id);
    const filtered = list.filter(e => String(e.animeId) !== String(req.params.animeId));
    DB.saveUserWatchlist(req.user.id, filtered);
    const stats = DB.calculateUserStats(req.user.id);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Real-time Player Watch Progress Sync
app.post("/api/user/sync-watch", requireAuth, (req, res) => {
  try {
    const { animeId, title, coverImage, bannerImage, epNumber, duration = 24, episodesTotal = 12, genres = [] } = req.body;
    if (!animeId) return res.status(400).json({ error: "animeId required" });

    const list = DB.getUserWatchlist(req.user.id);
    const existing = list.find(e => String(e.animeId) === String(animeId));

    const currentProgress = Math.max(existing?.progress || 0, parseInt(epNumber) || 1);
    const isCompleted = episodesTotal > 0 && currentProgress >= episodesTotal;
    const nextStatus = isCompleted ? "COMPLETED" : (existing?.status || "WATCHING");

    DB.upsertWatchlistItem(req.user.id, {
      animeId,
      title: title || existing?.title,
      coverImage: coverImage || existing?.coverImage,
      bannerImage: bannerImage || existing?.bannerImage,
      episodesTotal: episodesTotal || existing?.episodesTotal,
      duration: duration || existing?.duration || 24,
      genres: genres.length ? genres : (existing?.genres || []),
      status: nextStatus,
      progress: currentProgress,
      score: existing?.score || 0
    });

    const stats = DB.calculateUserStats(req.user.id);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   WATCHLIST IMPORT API ROUTES (AniList & MyAnimeList)
   ========================================================================= */

// 1. AniList Watchlist Import
app.post("/api/import/anilist", requireAuth, async (req, res) => {
  try {
    const userName = req.body.username || req.user.anilistUsername;
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "AniList kullanıcı adı belirtilmelidir." });
    }

    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
          lists {
            name
            isCustomList
            status
            entries {
              id
              status
              score(format: POINT_10_DECIMAL)
              progress
              repeat
              updatedAt
              media {
                id
                idMal
                title { romaji english native }
                coverImage { extraLarge large medium }
                bannerImage
                format
                episodes
                duration
                genres
                averageScore
                status
              }
            }
          }
        }
      }
    `;

    const data = await queryAniList(query, { userName: userName.trim() });
    if (!data.MediaListCollection || !data.MediaListCollection.lists) {
      return res.status(404).json({ error: "AniList listesi bulunamadı veya gizli." });
    }

    const currentWatchlist = DB.getUserWatchlist(req.user.id);
    const mapByAnimeId = new Map();
    currentWatchlist.forEach(item => mapByAnimeId.set(String(item.animeId), item));

    let importedCount = 0;

    data.MediaListCollection.lists.forEach(listGroup => {
      const listStatus = listGroup.status; // CURRENT, COMPLETED, PAUSED, DROPPED, PLANNING
      let normalizedStatus = "WATCHING";
      if (listStatus === "COMPLETED") normalizedStatus = "COMPLETED";
      else if (listStatus === "PLANNING") normalizedStatus = "PLANNING";
      else if (listStatus === "PAUSED") normalizedStatus = "PAUSED";
      else if (listStatus === "DROPPED") normalizedStatus = "DROPPED";
      else if (listStatus === "CURRENT") normalizedStatus = "WATCHING";

      (listGroup.entries || []).forEach(entry => {
        const media = entry.media;
        if (!media || !media.id) return;

        const animeId = media.id;
        const entryScore = entry.score || 0;
        const progress = entry.progress || (normalizedStatus === "COMPLETED" ? (media.episodes || 12) : 0);

        mapByAnimeId.set(String(animeId), {
          animeId,
          title: media.title,
          coverImage: media.coverImage,
          bannerImage: media.bannerImage,
          format: media.format || "TV",
          episodesTotal: media.episodes || 0,
          duration: media.duration || 24,
          genres: media.genres || [],
          status: normalizedStatus,
          progress: progress,
          score: entryScore,
          updatedAt: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString()
        });
        importedCount++;
      });
    });

    const updatedList = Array.from(mapByAnimeId.values());
    DB.saveUserWatchlist(req.user.id, updatedList);

    // Also link AniList username if not already linked
    if (!req.user.anilistUsername) {
      DB.updateUser(req.user.id, { anilistUsername: userName.trim() });
    }

    const stats = DB.calculateUserStats(req.user.id);
    res.json({
      success: true,
      importedCount,
      totalAnime: updatedList.length,
      stats,
      message: `${importedCount} anime AniList hesabından başarıyla aktarıldı!`
    });
  } catch (err) {
    console.error("AniList import error:", err);
    res.status(500).json({ error: `AniList listesi aktarılamadı: ${err.message}` });
  }
});

// 2. MyAnimeList Watchlist Import (via Jikan API)
app.post("/api/import/myanimelist", requireAuth, async (req, res) => {
  try {
    const malUsername = req.body.username || req.user.malUsername;
    if (!malUsername || !malUsername.trim()) {
      return res.status(400).json({ error: "MyAnimeList kullanıcı adı belirtilmelidir." });
    }

    const trimmedName = malUsername.trim();
    let malEntries = [];

    // 1. Fetch directly from official MyAnimeList animelist load.json with pagination
    try {
      let offset = 0;
      let hasMore = true;
      const MAX_PAGES = 10; // Up to 3000 anime
      let pageCount = 0;

      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const malUrl = `https://myanimelist.net/animelist/${encodeURIComponent(trimmedName)}/load.json?offset=${offset}&status=7`;
        const malRes = await fetch(malUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        if (malRes.ok) {
          const chunk = await malRes.json();
          if (Array.isArray(chunk) && chunk.length > 0) {
            malEntries.push(...chunk);
            if (chunk.length < 300) {
              hasMore = false;
            } else {
              offset += 300;
            }
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (directErr) {
      console.warn("Direct MAL fetch error:", directErr.message);
    }

    // 2. Fallback to Jikan if direct MAL endpoint was empty
    if (!malEntries.length) {
      try {
        const jikanUrl = `https://api.jikan.moe/v4/users/${encodeURIComponent(trimmedName)}/useranimelist?status=all`;
        const jikanRes = await fetch(jikanUrl, { headers: { "User-Agent": UA } });
        if (jikanRes.ok) {
          const jikanData = await jikanRes.json();
          malEntries = jikanData.data || [];
        }
      } catch (jikanErr) {
        console.warn("Jikan fallback fetch error:", jikanErr.message);
      }
    }

    if (!malEntries.length) {
      return res.status(404).json({ error: "MyAnimeList listesi alınamadı. Lütfen kullanıcı adını kontrol edin ve listenizin 'Public' (Herkese Açık) olduğundan emin olun." });
    }

    const currentWatchlist = DB.getUserWatchlist(req.user.id);
    const mapByAnimeId = new Map();
    currentWatchlist.forEach(item => mapByAnimeId.set(String(item.animeId), item));

    let importedCount = 0;

    malEntries.forEach(item => {
      // Handles both direct MAL format (anime_id, anime_title, status 1-6) and Jikan format
      const malId = item.anime_id || item.anime?.mal_id || item.mal_id;
      if (!malId) return;

      const rawStatus = item.status !== undefined ? String(item.status).toLowerCase() : (item.watching_status || "").toLowerCase();
      let status = "WATCHING";
      if (rawStatus === "2" || rawStatus.includes("complete")) status = "COMPLETED";
      else if (rawStatus === "6" || rawStatus.includes("plan")) status = "PLANNING";
      else if (rawStatus === "3" || rawStatus.includes("hold")) status = "PAUSED";
      else if (rawStatus === "4" || rawStatus.includes("drop")) status = "DROPPED";
      else if (rawStatus === "1" || rawStatus.includes("watch")) status = "WATCHING";

      const totalEps = item.anime_num_episodes || item.anime?.episodes || 0;
      const watched = item.num_watched_episodes !== undefined 
        ? item.num_watched_episodes 
        : (item.episodes_watched || (status === "COMPLETED" ? (totalEps || 12) : 0));
      const score = item.score || item.user_score || 0;
      const title = item.anime_title_eng || item.anime_title || item.anime?.title || "Anime";
      const romajiTitle = item.anime_title || item.anime?.title || title;
      const cover = item.anime_image_path || item.anime?.images?.jpg?.large_image_url || item.anime?.images?.jpg?.image_url || "";
      const genres = Array.isArray(item.genres) ? item.genres.map(g => g.name || g) : [];

      mapByAnimeId.set(`mal_${malId}`, {
        animeId: `mal_${malId}`,
        malId: malId,
        title: { romaji: romajiTitle, english: title },
        coverImage: { extraLarge: cover, large: cover, medium: cover },
        format: item.anime_media_type_string || item.anime?.type || "TV",
        episodesTotal: totalEps,
        duration: 24,
        genres: genres,
        status: status,
        progress: watched,
        score: score,
        updatedAt: new Date().toISOString()
      });
      importedCount++;
    });

    const updatedList = Array.from(mapByAnimeId.values());
    DB.saveUserWatchlist(req.user.id, updatedList);

    if (!req.user.malUsername) {
      DB.updateUser(req.user.id, { malUsername: trimmedName });
    }

    const stats = DB.calculateUserStats(req.user.id);
    res.json({
      success: true,
      importedCount,
      totalAnime: updatedList.length,
      stats,
      message: `${importedCount} anime MyAnimeList hesabından başarıyla aktarıldı!`
    });
  } catch (err) {
    console.error("MAL import error:", err);
    res.status(500).json({ error: `MyAnimeList listesi aktarılamadı: ${err.message}` });
  }
});

/* =========================================================================
   EPISODE COMMENTS & SPOILER API ROUTES
   ========================================================================= */

// 1. Get comments for a specific anime episode
app.get("/api/comments/:animeId/:epNumber", (req, res) => {
  try {
    const animeId = sanitizeText(String(req.params.animeId));
    const epNumber = Math.max(1, parseInt(req.params.epNumber) || 1);
    const comments = DB.getEpisodeComments(animeId, epNumber);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: "Yorumlar getirilemedi.", code: "SERVER_ERROR" });
  }
});

// 2. Add a new comment (requires auth, rate limited, XSS sanitized, validated)
app.post("/api/comments", requireAuth, commentRateLimiter, validateBody(CommentSchema), (req, res) => {
  try {
    const { animeId, epNumber, text, isSpoiler } = req.body;

    const comment = DB.addComment({
      animeId,
      epNumber,
      userId: req.user.id,
      username: req.user.username,
      userAvatar: req.user.avatar,
      text,
      isSpoiler: Boolean(isSpoiler)
    });

    auditLogger.info("COMMENT_POSTED", { userId: req.user.id, animeId, epNumber });
    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ error: "Yorum eklenirken hata oluştu.", code: "SERVER_ERROR" });
  }
});

// 3. Toggle Like on a comment (requires auth)
app.post("/api/comments/:id/like", requireAuth, (req, res) => {
  try {
    const commentId = sanitizeText(String(req.params.id));
    const result = DB.toggleLikeComment(commentId, req.user.id);
    if (!result) return res.status(404).json({ error: "Yorum bulunamadı.", code: "NOT_FOUND" });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Beğeni kaydedilemedi.", code: "SERVER_ERROR" });
  }
});

// 4. Delete own comment (requires auth & IDOR ownership verification)
app.delete("/api/comments/:id", requireAuth, (req, res) => {
  try {
    const commentId = sanitizeText(String(req.params.id));
    const comments = DB.getComments();
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: "Yorum bulunamadı.", code: "NOT_FOUND" });
    }

    // IDOR Protection: Check resource ownership (creator or admin/mod)
    const canDelete = checkResourceOwnership(comment.userId, req.user.id, req.user.role);
    if (!canDelete) {
      auditLogger.security("IDOR_COMMENT_DELETE_ATTEMPT", req, { commentId, ownerId: comment.userId, userId: req.user.id });
      return res.status(403).json({ error: "Bu yorumu silme yetkiniz bulunmuyor (Forbidden).", code: "FORBIDDEN" });
    }

    DB.deleteComment(commentId, comment.userId);
    auditLogger.info("COMMENT_DELETED", { commentId, deletedBy: req.user.id });
    res.json({ success: true, message: "Yorum silindi." });
  } catch (err) {
    res.status(403).json({ error: err.message || "Yorum silinemedi.", code: "FORBIDDEN" });
  }
});

// 5. AniSkip API Integration: Accurate Opening / Ending skip times
app.get("/api/skip-times/:animeId/:epNumber", async (req, res) => {
  try {
    const { animeId, epNumber } = req.params;
    const epNum = parseInt(epNumber) || 1;

    let malId = animeId;
    if (String(animeId).startsWith("mal_")) {
      malId = animeId.replace("mal_", "");
    } else {
      try {
        const animeData = await queryAniList(
          `query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              idMal
            }
          }`,
          { id: parseInt(animeId) }
        );
        if (animeData?.Media?.idMal) {
          malId = animeData.Media.idMal;
        } else if (animeData?.data?.Media?.idMal) {
          malId = animeData.data.Media.idMal;
        }
      } catch (e) {}
    }

    const aniskipUrl = `https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types[]=op&types[]=ed&types[]=mixed-op&types[]=mixed-ed&types[]=recap&episodeLength=0`;
    const response = await fetch(aniskipUrl);
    if (!response.ok) {
      return res.json({ found: false });
    }

    const data = await response.json();
    if (!data.found || !Array.isArray(data.results)) {
      return res.json({ found: false });
    }

    const hasMixedOp = data.results.some(r => r.skipType === "mixed-op");
    const hasMixedEd = data.results.some(r => r.skipType === "mixed-ed");

    let introStart = null, introEnd = null, outroStart = null, outroEnd = null;
    let isMixedIntro = false, isMixedOutro = false;

    // If episode has mixed-op (story is ongoing while credits roll), NEVER treat as skippable standalone opening!
    if (hasMixedOp) {
      isMixedIntro = true;
    } else {
      const opResult = data.results.find(r => r.skipType === "op" && r.interval);
      if (opResult && opResult.interval) {
        const duration = (opResult.interval.endTime || 0) - (opResult.interval.startTime || 0);
        // Standard standalone openings are between 70s and 105s
        if (duration >= 70 && duration <= 105) {
          introStart = opResult.interval.startTime;
          introEnd = opResult.interval.endTime;
        } else {
          isMixedIntro = true;
        }
      }
    }

    // Outro check
    if (hasMixedEd) {
      isMixedOutro = true;
    } else {
      const edResult = data.results.find(r => r.skipType === "ed" && r.interval);
      if (edResult && edResult.interval) {
        outroStart = edResult.interval.startTime;
        outroEnd = edResult.interval.endTime;
      }
    }

    return res.json({
      found: (introStart !== null || outroStart !== null),
      introStart,
      introEnd,
      outroStart,
      outroEnd,
      isMixedIntro,
      isMixedOutro
    });
  } catch (err) {
    return res.json({ found: false, error: err.message });
  }
});

// 6. Natural Language Synopsis Translation Engine (Auto-Translates anime synopses to Turkish with Chunking)
const translationCache = new Map();

async function translateSynopsisToTurkish(text) {
  if (!text) return "";
  const cleanText = text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  if (!cleanText) return text;
  
  if (translationCache.has(cleanText)) {
    return translationCache.get(cleanText);
  }

  try {
    // Split into sentences and bundle into safe chunks <= 350 chars
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const chunks = [];
    let currentChunk = "";

    for (const s of sentences) {
      if ((currentChunk + " " + s).length > 350) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = s;
      } else {
        currentChunk += (currentChunk ? " " : "") + s;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    // Only translate the first 4 key chunks to stay efficient and accurate
    const translatedChunks = await Promise.all(
      chunks.slice(0, 4).map(async (chunk) => {
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|tr`;
          const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (res.ok) {
            const data = await res.json();
            const tr = data.responseData?.translatedText;
            if (
              tr &&
              !tr.includes("QUERY LENGTH LIMIT") &&
              !tr.includes("MYMEMORY WARNING") &&
              !tr.includes("YOU USED ALL AVAILABLE") &&
              !tr.includes("INVALID")
            ) {
              return tr;
            }
          }
        } catch (err) {}
        return chunk; // Fallback to original chunk if translation service errors
      })
    );

    const fullResult = translatedChunks.join(" ").trim();
    if (fullResult && !fullResult.includes("QUERY LENGTH LIMIT")) {
      translationCache.set(cleanText, fullResult);
      return fullResult;
    }
  } catch (e) {
    console.warn("Translation failed:", e.message);
  }

  return cleanText;
}

app.post("/api/translate", async (req, res) => {
  try {
    const { text, target = "tr" } = req.body;
    if (!text) return res.json({ translated: "" });
    if (target !== "tr") return res.json({ translated: text });

    const translated = await translateSynopsisToTurkish(text);
    res.json({ translated });
  } catch (err) {
    res.json({ translated: req.body?.text || "" });
  }
});

// 7. Franchise & Chronological Watch Order API (Deep Unified Cluster Engine)
const franchiseCache = new Map();

const DEEP_FRANCHISE_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native userPreferred }
    format
    status
    episodes
    seasonYear
    season
    startDate { year month day }
    coverImage { extraLarge large medium }
    bannerImage
    averageScore
    relations {
      edges {
        relationType
        node {
          id
          title { romaji english native userPreferred }
          format
          status
          episodes
          seasonYear
          season
          startDate { year month day }
          coverImage { extraLarge large medium }
          bannerImage
          averageScore
          relations {
            edges {
              relationType
              node {
                id
                title { romaji english native userPreferred }
                format
                status
                episodes
                seasonYear
                season
                startDate { year month day }
                coverImage { extraLarge large medium }
                bannerImage
                averageScore
                relations {
                  edges {
                    relationType
                    node {
                      id
                      title { romaji english native userPreferred }
                      format
                      status
                      episodes
                      seasonYear
                      season
                      startDate { year month day }
                      coverImage { extraLarge large medium }
                      bannerImage
                      averageScore
                      relations {
                        edges {
                          relationType
                          node {
                            id
                            title { romaji english native userPreferred }
                            format
                            status
                            episodes
                            seasonYear
                            season
                            startDate { year month day }
                            coverImage { extraLarge large medium }
                            bannerImage
                            averageScore
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

function findDeepestRelationId(media, relationTypes = ["PREQUEL", "PARENT"]) {
  if (!media) return null;
  let targetId = media.id;
  const visited = new Set([media.id]);

  function inspectNode(node) {
    if (!node) return;
    if (node.relations?.edges) {
      for (const edge of node.relations.edges) {
        if (relationTypes.includes(edge.relationType) && edge.node?.id && !visited.has(edge.node.id)) {
          visited.add(edge.node.id);
          targetId = edge.node.id;
          inspectNode(edge.node);
        }
      }
    }
  }

  inspectNode(media);
  return targetId;
}

async function getFranchiseGraph(animeId) {
  const numId = parseInt(animeId);
  const cacheKey = `franchise:${numId}`;
  if (franchiseCache.has(cacheKey)) {
    return franchiseCache.get(cacheKey);
  }

  try {
    const data = await queryAniList(DEEP_FRANCHISE_QUERY, { id: numId });
    const root = data?.Media;
    if (!root) return [];

    // Step 1: Find the deepest prequel (origin) and deepest sequel (terminal)
    let originId = findDeepestRelationId(root, ["PREQUEL", "PARENT"]);
    let originRoot = root;

    if (originId && originId !== numId) {
      try {
        const originData = await queryAniList(DEEP_FRANCHISE_QUERY, { id: originId });
        if (originData?.Media) originRoot = originData.Media;
      } catch (err) {}
    }

    // Step 2: From origin root, find the ultimate forward terminal sequel leaf
    let terminalId = findDeepestRelationId(originRoot, ["SEQUEL"]);
    let terminalRoot = originRoot;

    if (terminalId && terminalId !== originId) {
      try {
        const terminalData = await queryAniList(DEEP_FRANCHISE_QUERY, { id: terminalId });
        if (terminalData?.Media) terminalRoot = terminalData.Media;
      } catch (err) {}
    }

    const ALLOWED_RELATIONS = new Set(["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE", "SPIN_OFF", "SUMMARY", "ROOT"]);
    const VALID_FORMATS = new Set(["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "TV_SHORT"]);

    const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "with", "by", "for", "from", "at", "as", "season", "part", "movie", "ova", "ona", "special", "tv", "no", "kara", "ni", "wa", "ga", "de", "mo", "to", "da", "ken", "wo", "film", "short", "shorts", "time", "life", "world", "another", "days", "got", "reincarnated", "story", "stories", "nise", "3rd", "2nd", "4th", "second", "third", "fourth"]);
    const getKeywords = (t) => (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));

    const originCombined = `${originRoot.title?.romaji || ''} ${originRoot.title?.english || ''} ${originRoot.title?.userPreferred || ''}`;
    const originKeywords = getKeywords(originCombined);

    const nodesMap = new Map();

    function walk(node, relType = "ROOT") {
      if (!node || !node.id) return;
      if (nodesMap.has(node.id)) return;
      if (!VALID_FORMATS.has(node.format)) return;

      const nodeTitle = `${node.title?.romaji || ''} ${node.title?.english || ''}`.toLowerCase();
      if (nodeTitle.includes("isekai quartet") && !originCombined.toLowerCase().includes("isekai quartet")) return;
      if (nodeTitle.includes("runway") || nodeTitle.includes("waratte") || nodeTitle.includes("smile down")) return;
      if (nodeTitle.includes("nisekoi") && !originCombined.toLowerCase().includes("nisekoi")) return;
      if (nodeTitle.includes("chihayafuru")) return;

      const nodeKeywords = getKeywords(nodeTitle);
      const isDirectCanon = ["PREQUEL", "SEQUEL", "PARENT", "ROOT"].includes(relType);
      const hasKeywordOverlap = originKeywords.some(kw => nodeKeywords.includes(kw));

      if (!isDirectCanon && !hasKeywordOverlap) return;

      nodesMap.set(node.id, {
        id: node.id,
        title: node.title,
        format: node.format,
        status: node.status,
        episodes: node.episodes,
        seasonYear: node.seasonYear,
        season: node.season,
        startDate: node.startDate,
        coverImage: node.coverImage,
        bannerImage: node.bannerImage,
        averageScore: node.averageScore,
        relationType: relType
      });

      if (node.relations?.edges) {
        for (const edge of node.relations.edges) {
          if (ALLOWED_RELATIONS.has(edge.relationType)) {
            walk(edge.node, edge.relationType);
          }
        }
      }
    }

    // Walk origin, terminal, and current node trees to capture 100% complete chronological branches
    walk(originRoot, "ROOT");
    if (terminalRoot !== originRoot) {
      walk(terminalRoot, "ROOT");
    }
    if (root !== originRoot && root !== terminalRoot) {
      walk(root, "ROOT");
    }

    // Step 3: Master Cluster Union Caching
    const masterMap = new Map();
    for (const [id, item] of nodesMap.entries()) {
      masterMap.set(id, item);
    }
    for (const id of masterMap.keys()) {
      const existingList = franchiseCache.get(`franchise:${id}`);
      if (existingList && Array.isArray(existingList)) {
        for (const item of existingList) {
          if (!masterMap.has(item.id)) {
            masterMap.set(item.id, item);
          }
        }
      }
    }

    const unifiedList = Array.from(masterMap.values()).sort((a, b) => {
      const yA = a.startDate?.year || (a.seasonYear || 9999);
      const yB = b.startDate?.year || (b.seasonYear || 9999);
      if (yA !== yB) return yA - yB;

      const mA = a.startDate?.month || 1;
      const mB = b.startDate?.month || 1;
      if (mA !== mB) return mA - mB;

      const dA = a.startDate?.day || 1;
      const dB = b.startDate?.day || 1;
      if (dA !== dB) return dA - dB;

      return a.id - b.id;
    });

    // Populate cluster cache for all members in this franchise so every season returns the identical order!
    for (const item of unifiedList) {
      franchiseCache.set(`franchise:${item.id}`, unifiedList);
    }

    return unifiedList;
  } catch (err) {
    console.warn("Franchise graph query failed:", err.message);
    return [];
  }
}

app.get("/api/anime/:id/franchise", async (req, res) => {
  try {
    const list = await getFranchiseGraph(req.params.id);
    res.json({ franchise: list, total: list.length });
  } catch (err) {
    res.status(500).json({ error: err.message, franchise: [] });
  }
});

// Explicit HTML Page Routes for Clean Modular Structure
app.get("/trending", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "trending.html"));
});

app.get("/top", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "top.html"));
});

app.get("/browse", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "browse.html"));
});

app.get("/watch", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "watch.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/dmca", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dmca.html"));
});

// Fallback to index.html for root and other non-API routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 Handler for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "İstenen API uç noktası bulunamadı", code: "NOT_FOUND" });
});

// Centralized Safe Production Error Handler (Hides stack traces and sensitive error details in production)
app.use((err, req, res, next) => {
  auditLogger.error("UNHANDLED_SERVER_ERROR", err, { path: req.originalUrl, method: req.method });

  const statusCode = err.status || err.statusCode || 500;
  const isProd = ENV.IS_PROD;

  res.status(statusCode).json({
    error: isProd ? "Sunucu tarafında beklenmeyen bir hata oluştu." : (err.message || "Bilinmeyen sunucu hatası"),
    code: err.code || "INTERNAL_SERVER_ERROR",
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// Server Initialization
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🖤 ANIMERIA`);
  console.log(`📡 Local Server Running on: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

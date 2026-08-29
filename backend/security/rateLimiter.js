import rateLimit from "express-rate-limit";

// 1. General Public API Limiter (Prevents scraping & DDoS spikes)
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // max 180 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Çok fazla istek gönderildi. Lütfen biraz bekleyin (Rate limit exceeded).",
    code: "TOO_MANY_REQUESTS",
    retryAfter: 60,
  },
});

// 2. Strict Auth / Login & Register Limiter (Brute-Force Defense)
export const authBruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 auth requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için 15 dakika boyunca erişim sınırlandırıldı.",
    code: "AUTH_RATE_LIMITED",
    retryAfter: 900,
  },
});

// 3. Comments & Spoiler Posting Limiter (Spam Defense)
export const commentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12, // max 12 comments per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Yorum gönderme sınırına ulaştınız. Lütfen 1 dakika bekleyin.",
    code: "COMMENT_RATE_LIMITED",
  },
});

// 4. Proxy Stream Limiter
export const proxyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 240, // max 240 segment requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Yayın isteği sınırı aşıldı.",
    code: "PROXY_RATE_LIMITED",
  },
});

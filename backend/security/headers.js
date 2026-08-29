import helmet from "helmet";

export function configureSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // Needed for Hls.js worker / fallback bundle
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://s4.anilist.co",
          "https://images.unsplash.com",
          "https://api.dicebear.com",
          "https://cdn.myanimelist.net",
          "https://*",
          "http://*",
        ],
        mediaSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://*",
          "http://*",
        ],
        connectSrc: [
          "'self'",
          "blob:",
          "https://graphql.anilist.co",
          "https://api.aniskip.com",
          "https://translate.googleapis.com",
          "https://*",
          "http://*",
        ],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://megacloud.tv",
          "https://rapid-cloud.ru",
          "https://filemoon.sx",
          "https://streamwish.to",
          "https://vidhide.com",
          "https://*",
        ],
        frameAncestors: ["'self'"], // Clickjacking defense
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Allows cross-origin video streaming
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: { action: "sameorigin" }, // Clickjacking defense
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xPoweredBy: false, // Strips "X-Powered-By: Express" banner
  });
}

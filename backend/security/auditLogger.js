// Structured Security & Audit Logger with Sensitive Data Masking
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "passwordsalt",
  "token",
  "authorization",
  "secret",
  "twofactorsecret",
  "backupcodes",
  "refreshtoken",
]);

function maskSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export const auditLogger = {
  info(event, details = {}) {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      event,
      ...maskSensitiveData(details),
    }));
  },

  warn(event, details = {}) {
    console.warn(JSON.stringify({
      level: "WARN",
      timestamp: new Date().toISOString(),
      event,
      ...maskSensitiveData(details),
    }));
  },

  security(event, req, details = {}) {
    const ip = req?.headers["cf-connecting-ip"] || req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || "unknown";
    const userAgent = req?.headers["user-agent"] || "unknown";
    const path = req?.originalUrl || req?.url || "";

    console.warn(JSON.stringify({
      level: "SECURITY",
      timestamp: new Date().toISOString(),
      event,
      ip,
      path,
      userAgent: userAgent.slice(0, 120),
      ...maskSensitiveData(details),
    }));
  },

  error(event, err, details = {}) {
    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      event,
      error: err?.message || String(err),
      ...maskSensitiveData(details),
    }));
  },
};

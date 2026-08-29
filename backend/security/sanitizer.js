import sanitizeHtml from "sanitize-html";

// 1. Prototype Pollution & NoSQL Injection Sanitizer
// Recursively strips dangerous object keys: __proto__, constructor, prototype, $, .
export function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const trimmedKey = key.trim();
    // Block Prototype Pollution
    if (
      trimmedKey === "__proto__" ||
      trimmedKey === "constructor" ||
      trimmedKey === "prototype"
    ) {
      continue;
    }
    // Block NoSQL / MongoDB Operator Injection
    if (trimmedKey.startsWith("$") || trimmedKey.includes(".")) {
      continue;
    }

    clean[trimmedKey] = sanitizeObject(value);
  }
  return clean;
}

// Express Middleware for Deep Request Body / Query Sanitization
export function sanitizePayloadMiddleware(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
}

// 2. XSS (Cross-Site Scripting) HTML Sanitizer
const STRICT_SANITIZE_OPTIONS = {
  allowedTags: [], // Strips all HTML tags by default for comments & bios
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

const FORMATTED_SANITIZE_OPTIONS = {
  allowedTags: ["b", "i", "em", "strong", "span", "code", "br"],
  allowedAttributes: {
    span: ["class"],
  },
  disallowedTagsMode: "discard",
};

export function sanitizeText(dirtyString, allowFormatting = false) {
  if (!dirtyString || typeof dirtyString !== "string") return "";
  const opts = allowFormatting ? FORMATTED_SANITIZE_OPTIONS : STRICT_SANITIZE_OPTIONS;
  return sanitizeHtml(dirtyString.trim(), opts);
}

// 3. Output Encoding (HTML Entities Escaping)
export function encodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 4. ReDoS Safe Regex Runner (prevents CPU lockups on long strings)
export function safeRegexMatch(str, regex, maxExecutionMs = 50) {
  if (!str || typeof str !== "string") return null;
  const start = Date.now();
  const match = regex.exec(str);
  if (Date.now() - start > maxExecutionMs) {
    console.warn("ReDoS Warning: Regex execution exceeded safe threshold");
  }
  return match;
}

import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { ENV } from "./env.js";

const ACCESS_TOKEN_SECRET = ENV.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes short-lived access token

// Standard Cookie Options for JWT & Refresh Tokens
export function getCookieOptions(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true, // Prevents JavaScript XSS theft
    secure: ENV.IS_PROD, // Transmitted only over HTTPS in production
    sameSite: "lax", // CSRF protection
    path: "/",
    maxAge: maxAgeMs,
  };
}

// 1. Generate short-lived JWT access token
export function generateAccessToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role || "USER",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// 2. Generate secure 30-day random refresh token
export function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

// 3. Verify JWT access token
export function verifyAccessToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null; // Expired or invalid signature
  }
}

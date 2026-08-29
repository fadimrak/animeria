import { z } from "zod";
import { sanitizeText } from "./sanitizer.js";

// 1. User Registration Schema
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(24, "Kullanıcı adı en fazla 24 karakter olabilir")
    .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı yalnızca harf, rakam, alt çizgi ve tire içerebilir")
    .transform(val => sanitizeText(val)),
  email: z
    .string()
    .email("Geçerli bir e-posta adresi giriniz")
    .max(100, "E-posta çok uzun")
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .max(128, "Şifre çok uzun")
    .regex(/[a-zA-Z]/, "Şifre en az bir harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
});

// 2. User Login Schema
export const LoginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, "E-posta veya kullanıcı adı gereklidir")
    .max(100)
    .transform(val => sanitizeText(val)),
  password: z
    .string()
    .min(1, "Şifre gereklidir")
    .max(128),
  twoFactorCode: z
    .string()
    .max(10)
    .optional(),
});

// 3. Comment Submission Schema
export const CommentSchema = z.object({
  animeId: z.union([z.string(), z.number()]).transform(val => String(val)),
  epNumber: z.union([z.string(), z.number()]).transform(val => Math.max(1, parseInt(val) || 1)),
  text: z
    .string()
    .min(2, "Yorum en az 2 karakter olmalıdır")
    .max(1500, "Yorum en fazla 1500 karakter olabilir")
    .transform(val => sanitizeText(val, false)),
  isSpoiler: z.boolean().default(false),
});

// 4. User Profile Update Schema (Mass Assignment Defense: Strictly Whitelisted)
export const ProfileUpdateSchema = z.object({
  avatar: z
    .string()
    .url("Geçerli bir görsel URL'si giriniz")
    .max(500)
    .optional()
    .or(z.literal("")),
  banner: z
    .string()
    .url("Geçerli bir görsel URL'si giriniz")
    .max(500)
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(300, "Biyografi en fazla 300 karakter olabilir")
    .transform(val => sanitizeText(val, false))
    .optional(),
  anilistUsername: z
    .string()
    .max(40)
    .regex(/^[a-zA-Z0-9_-]*$/, "Geçersiz AniList kullanıcı adı")
    .optional()
    .nullable(),
  malUsername: z
    .string()
    .max(40)
    .regex(/^[a-zA-Z0-9_-]*$/, "Geçersiz MyAnimeList kullanıcı adı")
    .optional()
    .nullable(),
}).strict(); // Rejects any extra keys (e.g. role, isAdmin, passwordHash)

// 5. Watchlist Item Sync Schema
export const WatchlistSyncSchema = z.object({
  animeId: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.any().optional(),
  coverImage: z.any().optional(),
  bannerImage: z.any().optional(),
  format: z.string().max(20).optional(),
  episodesTotal: z.number().int().nonnegative().optional(),
  duration: z.number().int().nonnegative().optional(),
  genres: z.array(z.string()).optional(),
  status: z.enum(["WATCHING", "COMPLETED", "PLANNING", "PAUSED", "DROPPED"]).default("WATCHING"),
  progress: z.number().int().nonnegative().default(0),
  score: z.number().min(0).max(10).default(0),
});

// Generic Validation Helper Middleware
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errorMsg = issues.map(e => e.message).join(", ") || "Geçersiz veri formatı";
        return res.status(400).json({ error: errorMsg, code: "VALIDATION_ERROR", details: issues });
      }
      req.body = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ error: "Geçersiz veri formatı", code: "VALIDATION_ERROR" });
    }
  };
}

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE = path.join(__dirname, "..", "..", ".env");

// Ensure strong random secrets exist in .env
function initEnvSecrets() {
  let envContent = "";
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, "utf8");
  }

  let updated = false;

  if (!process.env.JWT_SECRET && !envContent.includes("JWT_SECRET=")) {
    const secret = crypto.randomBytes(48).toString("hex");
    envContent += `\nJWT_SECRET=${secret}\n`;
    process.env.JWT_SECRET = secret;
    updated = true;
  }

  if (!process.env.SESSION_SECRET && !envContent.includes("SESSION_SECRET=")) {
    const secret = crypto.randomBytes(48).toString("hex");
    envContent += `\nSESSION_SECRET=${secret}\n`;
    process.env.SESSION_SECRET = secret;
    updated = true;
  }

  if (!process.env.PORT && !envContent.includes("PORT=")) {
    envContent += `\nPORT=3000\n`;
    process.env.PORT = "3000";
    updated = true;
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = process.env.NODE_ENV || "development";
  }

  if (updated) {
    try {
      fs.writeFileSync(ENV_FILE, envContent.trim() + "\n", "utf8");
    } catch (e) {
      console.warn("Could not write to .env:", e.message);
    }
  }
}

initEnvSecrets();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: process.env.NODE_ENV === "production",
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "animeria_default_super_secret_jwt_key_2026",
  SESSION_SECRET: process.env.SESSION_SECRET || "animeria_default_super_secret_session_key_2026",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
};

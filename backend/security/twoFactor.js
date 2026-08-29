import speakeasy from "speakeasy";
import qrcode from "qrcode";
import crypto from "node:crypto";

// 1. Generate 2FA Secret + QR Code + 8 Single-use Backup Codes
export async function setupTwoFactor(username) {
  const secret = speakeasy.generateSecret({
    name: `Animeria (${username})`,
    issuer: "Animeria",
    length: 20,
  });

  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  // Generate 8 cryptographically secure backup recovery codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeDataUrl,
    backupCodes,
  };
}

// 2. Verify 6-digit TOTP code
export function verifyTwoFactorCode(base32Secret, token) {
  if (!base32Secret || !token) return false;
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token: String(token).trim(),
    window: 1, // Allows ±30s clock drift
  });
}

// 3. Verify and consume backup code
export function verifyAndConsumeBackupCode(userBackupCodes, enteredCode) {
  if (!Array.isArray(userBackupCodes) || !enteredCode) {
    return { valid: false, remainingCodes: userBackupCodes || [] };
  }

  const cleanCode = enteredCode.trim().toUpperCase();
  const idx = userBackupCodes.indexOf(cleanCode);

  if (idx !== -1) {
    const updatedCodes = [...userBackupCodes];
    updatedCodes.splice(idx, 1); // Consume the code
    return { valid: true, remainingCodes: updatedCodes };
  }

  return { valid: false, remainingCodes: userBackupCodes };
}

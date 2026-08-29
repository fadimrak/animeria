// File Upload & Magic Bytes Validator
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": { ext: ".jpg", magic: [[0xFF, 0xD8, 0xFF]] },
  "image/png": { ext: ".png", magic: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
  "image/webp": { ext: ".webp", magic: [[0x52, 0x49, 0x46, 0x46]] }, // "RIFF"
};

export function validateImageBuffer(buffer, claimedMimeType = "") {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "Dosya içeriği geçersiz veya boş." };
  }

  // Max 5 MB limit
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: "Dosya boyutu 5 MB sınırını aşıyor." };
  }

  // Inspect Magic Bytes header
  let detectedType = null;

  // 1. Check PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    detectedType = "image/png";
  }
  // 2. Check JPEG
  else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    detectedType = "image/jpeg";
  }
  // 3. Check WEBP (RIFF .... WEBP)
  else if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    detectedType = "image/webp";
  }

  if (!detectedType) {
    return { valid: false, error: "Geçersiz dosya formatı. Yalnızca gerçek PNG, JPEG ve WEBP görselleri kabul edilir." };
  }

  return { valid: true, mimeType: detectedType, ext: ALLOWED_IMAGE_TYPES[detectedType].ext };
}

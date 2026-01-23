import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Ensure the key is 32 bytes (256 bits).
// In production, this should be a properly generated random key stored in env.
// For this implementation, we read from process.env.ENCRYPTION_KEY.
// If the key in env is shorter/longer, we should probably hash it or require a correct length.
// For safety, we'll hash the provided key to ensure 32 bytes.

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }
  // Use sha256 to ensure we have a 32-byte key regardless of input length
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(text: string): string {
  if (!text) return text;

  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return in format iv:encrypted
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;

  // Basic check to see if it's in our format (iv:content)
  const parts = text.split(":");
  if (parts.length !== 2) {
    // Assumption: If it doesn't match the format, it might be unencrypted legacy data.
    // However, if strict security is required, we might want to throw or return as is.
    // Given the "Refactor" context and "NO borres datos", returning as-is allows legacy data to be readable
    // (if it was plain text) until it is re-saved.
    // But if the legacy data *contains* a colon, this is risky.
    // For now, we will treat it as legacy plain text if it lacks the structure.
    return text;
  }

  const [ivHex, encryptedHex] = parts;

  // Verify hex validity (basic)
  if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
    return text;
  }

  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. invalid password, wrong key), we might return null or the original text.
    // Returning original text might leak the encrypted string to UI if not careful,
    // but throwing might crash the app on read.
    console.error("Decryption failed:", error);
    return text; // Fallback to raw text (safe if it was just not encrypted properly)
  }
}

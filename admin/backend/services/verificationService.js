import crypto from "crypto";
import { queryOne, execute } from "../db.js";
import { sendVerificationEmail } from "./emailService.js";

const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_HOURS = 24;

export function generateRawToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createVerification(userId, email, fullName) {
  const raw = generateRawToken();
  const hashed = hashToken(raw);
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  await execute(
    "UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?",
    [hashed, expires, userId]
  );

  await sendVerificationEmail(email, fullName, raw);

  return { sent: true };
}

export async function verifyEmailToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, reason: "invalid" };
  }

  const hashed = hashToken(rawToken);

  const user = await queryOne(
    "SELECT id, full_name, email, email_verified, verification_expires FROM users WHERE verification_token = ?",
    [hashed]
  );

  if (!user) {
    return { valid: false, reason: "invalid" };
  }

  if (user.email_verified === 1) {
    return { valid: false, reason: "already_verified" };
  }

  if (new Date(user.verification_expires) < new Date()) {
    return { valid: false, reason: "expired" };
  }

  await execute(
    "UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?",
    [user.id]
  );

  return { valid: true, user };
}

export async function clearOldTokens(userId) {
  await execute(
    "UPDATE users SET verification_token = NULL, verification_expires = NULL WHERE id = ?",
    [userId]
  );
}

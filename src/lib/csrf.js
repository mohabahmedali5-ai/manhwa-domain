import crypto from "crypto";

const tokens = new Map(); // تخزين مؤقت للـ token لكل session

export function issueCsrf(sessionId) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(sessionId, token);
  return token;
}

export function verifyCsrfToken(sessionId, token) {
  const valid = tokens.get(sessionId) === token;
  return valid;
}

// src/lib/security.js
import sanitizeHtml from "sanitize-html";

export const RATE_BUCKETS = globalThis.__RATE_BUCKETS || new Map();
if (!globalThis.__RATE_BUCKETS) globalThis.__RATE_BUCKETS = RATE_BUCKETS;

export const RATE_CONFIG = { windowMs: 60_000, max: 120 }; // تعديل حسب الحاجة

export function checkRateLimit(key) {
  const now = Date.now();
  const rec = RATE_BUCKETS.get(key) || { count: 0, start: now };
  if (now - rec.start > RATE_CONFIG.windowMs) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  RATE_BUCKETS.set(key, rec);
  return { limited: rec.count > RATE_CONFIG.max, count: rec.count };
}

/** بسيط لكنه آمن نسبياً: يستخدم sanitize-html لإزالة سكربت */
export function sanitizeInput(value) {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [], allowedAttributes: {}
    }).trim();
  }
  if (Array.isArray(value)) return value.map(sanitizeInput);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = sanitizeInput(value[k]);
    return out;
  }
  return value;
}

export function applySecurityHeaders(headers) {
  headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:; script-src 'self'");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
}

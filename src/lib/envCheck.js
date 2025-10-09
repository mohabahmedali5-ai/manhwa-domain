// lib/envCheck.js
import dotenv from "dotenv";
dotenv.config();

const required = [
  "MONGODB_URI",
  "MONGODB_DB",
  "REDIS_URL",
  "ADMIN_JWT_SECRET",
  "ADMIN_PASSWORD_HASH",
  "CSRF_SECRET",
  "ENC_KEY",
  "ALLOWED_ORIGINS"
];

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error("Missing required env vars:", missing.join(", "));
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing environment variables. Abort.");
  } else {
    console.warn("Warning: running in development without all env vars.");
  }
}

export default true;

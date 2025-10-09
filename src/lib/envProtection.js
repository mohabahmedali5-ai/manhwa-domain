// lib/envProtection.js
export function maskEnv(obj) {
  const sensitive = ["key", "secret", "token", "password"];
  const masked = {};

  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.some(s => k.toLowerCase().includes(s))) {
      masked[k] = "****";
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

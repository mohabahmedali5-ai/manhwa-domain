// src/lib/logger.js
export function logSecurityEvent(event, meta = {}) {
  // بسيط: سجل في console. استبدل بملف أو syslog أو external log لاحقًا.
  console.warn("[SECURITY]", event, meta);
}

// lib/validation.js
import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTS = {
  allowedTags: [],
  allowedAttributes: {},
  allowedSchemes: ["http", "https", "data"]
};

export function sanitize(value) {
  if (value == null) return value;
  if (typeof value === "string") return sanitizeHtml(value, SANITIZE_OPTS).trim();
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = sanitize(value[k]);
    return out;
  }
  return value;
}

export function validate(data, schema) {
  const errors = {};
  for (const field of Object.keys(schema)) {
    const rules = schema[field];
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === "")) {
      errors[field] = "required";
      continue;
    }
    if (value == null) continue;
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `must_be_${rules.type}`;
      continue;
    }
    if (rules.minLength && String(value).length < rules.minLength) {
      errors[field] = `minLength_${rules.minLength}`;
    }
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors[field] = `maxLength_${rules.maxLength}`;
    }
    if (rules.pattern && !rules.pattern.test(String(value))) {
      errors[field] = "invalid_format";
    }
    if (rules.in && !rules.in.includes(value)) {
      errors[field] = "invalid_value";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * PII sanitization for user story input.
 * Redacts phone numbers, emails, and addresses.
 */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export function sanitizeText(text: string, allowNames: boolean): string {
  let sanitized = text;

  // Always redact emails, phones, SSNs
  sanitized = sanitized.replace(EMAIL_REGEX, '[email redacted]');
  sanitized = sanitized.replace(SSN_REGEX, '[id redacted]');
  sanitized = sanitized.replace(PHONE_REGEX, '[phone redacted]');

  return sanitized;
}

export function sanitizeStoryInput(
  turningPoints: string,
  innerWorld: string,
  scenes: { location: string; who_was_present: string; what_changed: string }[],
  allowNames: boolean
) {
  return {
    turningPoints: sanitizeText(turningPoints, allowNames),
    innerWorld: sanitizeText(innerWorld, allowNames),
    scenes: scenes.map((s) => ({
      location: sanitizeText(s.location, allowNames),
      who_was_present: sanitizeText(s.who_was_present, allowNames),
      what_changed: sanitizeText(s.what_changed, allowNames),
    })),
  };
}

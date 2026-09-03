// Universal RouterOS sanitization and syntax helpers (safe for both Client and Server)

export function sanitizeRouterOSValue(val: unknown, maxLen = 64): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Strip quotes, command chainers (;), variable expansions ($), subshell brackets ([] and {}), backslashes, newlines
  return str
    .replace(/["\$\\;\r\n\[\]\{\}`|]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeRouterOSIdentifier(val: unknown, fallback = 'default', maxLen = 32): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val);
  const clean = str.replace(/[^a-zA-Z0-9_\-\.]/g, '_').trim().slice(0, maxLen);
  return clean || fallback;
}

export function sanitizeRouterOSComment(val: unknown, maxLen = 80): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/["\$\\;\r\n\[\]\{\}`|]/g, '_')
    .trim()
    .slice(0, maxLen);
}

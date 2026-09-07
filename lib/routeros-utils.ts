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
  const str = String(val).trim();
  if (!str) return fallback;

  // Replace invalid characters with underscore, collapse consecutive underscores, and strip edges
  const clean = str
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim()
    .slice(0, maxLen);

  // If the result has no letters or digits, or consists purely of symbols, fallback immediately
  if (!clean || !/[a-zA-Z0-9]/.test(clean)) {
    return fallback;
  }

  return clean;
}

// Strictly resolves and validates MikroTik Hotspot User Profile names
// Guarantees that Arabic strings, numbers, or corrupt placeholders (e.g. "___" or "____200")
// never break the RouterOS import command, defaulting safely to "default".
export function resolveRouterOSProfile(val: unknown, fallback = 'default'): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;

  // Strict check: if explicitly 'default', return immediately
  if (str.toLowerCase() === 'default') return 'default';

  // Detect underscore placeholders or artifacts like "___", "____200", "_200", etc.
  if (str.includes('__') || /^[_.\-]+/.test(str) || /[_.\-]+$/.test(str)) {
    return fallback;
  }

  // Purely numeric strings (e.g., "200", "500", "1000") represent card prices/denominations,
  // NOT RouterOS user profiles. Default to 'default' so RouterOS doesn't reject import.
  if (/^\d+$/.test(str)) {
    return fallback;
  }

  // If the profile string contains Arabic characters, it's a display/marketing name (e.g. "كرت أبو 200" or "باقة 1 جيجا")
  // In our architecture, speed profiles are handled dynamically on the login page by the user,
  // so every generated voucher MUST strictly default to the standard 'default' profile unless a valid profile name is explicitly assigned.
  if (/[\u0600-\u06FF]/.test(str)) {
    return fallback;
  }

  // Sanitize the identifier
  const sanitized = sanitizeRouterOSIdentifier(str, fallback, 32);

  // RouterOS profile names MUST start with an English letter [a-zA-Z]
  if (!/^[a-zA-Z][a-zA-Z0-9_\-\.]{1,31}$/.test(sanitized)) {
    return fallback;
  }

  // Reject if it's purely underscores or invalid artifacts
  if (/^[_.\-]+$/.test(sanitized)) {
    return fallback;
  }

  return sanitized;
}

export function sanitizeRouterOSComment(val: unknown, maxLen = 80): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/["\$\\;\r\n\[\]\{\}`|]/g, '_')
    .trim()
    .slice(0, maxLen);
}

// Format byte limits into clean numeric bytes for MikroTik RouterOS v7
export function formatByteLimit(raw: number | string | undefined | null): string {
  if (raw === undefined || raw === null) return '0';
  if (typeof raw === 'number') {
    return isNaN(raw) || raw < 0 ? '0' : Math.floor(raw).toString();
  }
  const str = String(raw).trim();
  if (/^\d+$/.test(str)) {
    return str;
  }
  // Extract number and unit: e.g. "1GB", "2.5 GB", "500 MB", "1 جيجابايت", "1G"
  const match = str.match(/([\d.]+)\s*([a-zA-Z\u0621-\u064A]+)?/);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (!isNaN(val)) {
      if (unit.includes('g') || unit.includes('جيجا')) {
        return Math.floor(val * 1024 * 1024 * 1024).toString();
      }
      if (unit.includes('m') || unit.includes('ميجا')) {
        return Math.floor(val * 1024 * 1024).toString();
      }
      if (unit.includes('k') || unit.includes('كيلو')) {
        return Math.floor(val * 1024).toString();
      }
      return Math.floor(val).toString();
    }
  }
  return '0';
}

// Format uptime limits into clean RouterOS duration syntax (e.g. "24h", "1d", "6h", "0s")
export function formatUptimeLimit(raw: string | undefined | null): string {
  if (!raw) return '0s';
  const str = String(raw).trim().toLowerCase();
  if (/^\d+[smhdw]$/.test(str)) {
    return str;
  }
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (str.includes('ساع') || str.includes('hour') || str.includes('h')) {
      return `${num}h`;
    }
    if (str.includes('يوم') || str.includes('day') || str.includes('d')) {
      return `${num}d`;
    }
    if (str.includes('دقيق') || str.includes('min') || str.includes('m')) {
      return `${num}m`;
    }
    if (str.includes('شهر') || str.includes('month')) {
      return `${num * 30}d`;
    }
    return `${num}h`;
  }
  return '0s';
}

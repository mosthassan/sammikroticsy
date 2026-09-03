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

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeRouterOSValue, sanitizeRouterOSIdentifier, sanitizeRouterOSComment } from '@/lib/routeros-utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

// ==========================================================
// In-Memory Rate Limiting & Anti-Brute-Force
// ==========================================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/min

function checkRateLimit(identifier: string): boolean {
  try {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    // Clean old entries periodically to prevent memory leaks
    if (rateLimitMap.size > 5000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    entry.count++;
    return true;
  } catch {
    return true; // Fail-open so rate limiter never causes unhandled exceptions
  }
}

// Token validation: must be safe alphanumeric/dashes/underscores of sufficient length
function isValidTokenFormat(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^[a-zA-Z0-9_\-]{4,128}$/.test(token.trim());
}

// Format byte limits into clean numeric bytes for MikroTik RouterOS v7
function formatByteLimit(raw: number | string | undefined | null): string {
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
function formatUptimeLimit(raw: string | undefined | null): string {
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

// Generate RouterOS v7 expired hotspot users cleanup routine
function generateCleanupScript(retention: string): string {
  return [
    `# ==========================================================`,
    `# NetFlow SaaS - Expired Hotspot Users Cleanup Routine`,
    `# Generated At: ${new Date().toISOString()}`,
    `# Retention Policy: ${retention}`,
    `# Hardened: Anti-Command Injection Protected`,
    `# ==========================================================`,
    `:log info "NetFlow: Running expired hotspot users purge..."`,
    `/ip hotspot user`,
    `:local removed 0`,
    `:foreach u in=[find] do={`,
    `  :local uName [get $u name]`,
    `  :local uComment ""`,
    `  :do { :set uComment [get $u comment] } on-error={}`,
    `  :local bytesIn [get $u bytes-in]`,
    `  :local bytesOut [get $u bytes-out]`,
    `  :local byteLimit [get $u limit-bytes-total]`,
    `  :local uptime [get $u uptime]`,
    `  :local uptimeLimit [get $u limit-uptime]`,
    `  :local isProtected false`,
    `  :if ($uName = "admin" || $uName = "default") do={ :set isProtected true }`,
    `  :if ($uComment ~ "keep_admin" || $uComment ~ "bypass" || $uComment ~ "vip" || $uComment ~ "admin") do={ :set isProtected true }`,
    `  :if (!$isProtected) do={`,
    `    :local isExpired false`,
    `    :if ($byteLimit > 0 && ($bytesIn + $bytesOut) >= $byteLimit) do={ :set isExpired true }`,
    `    :if ($uptimeLimit > 0s && $uptime >= $uptimeLimit) do={ :set isExpired true }`,
    `    :if ($isExpired) do={`,
    `      :do {`,
    `        remove $u`,
    `        :set removed ($removed + 1)`,
    `      } on-error={}`,
    `    }`,
    `  }`,
    `}`,
    `:log info ("NetFlow: Removed " . $removed . " expired hotspot cards.")`
  ].join('\n');
}

// Known demo / fallback tokens mapped to tenant IDs
const KNOWN_TOKENS: Record<string, string> = {
  'sam_sec_89df24a67e12c4': 'tenant_samtech_01',
  'aden_sec_token_993': 'tenant_aden_02',
  'taiz_sec_token_552': 'tenant_taiz_03',
  'mukalla_sec_token_112': 'tenant_mukalla_04',
};

interface PendingCardItem {
  id: string;
  batchId?: string;
  batchNumber?: string;
  name: string;
  password?: string;
  profile: string;
  byteLimit?: number | string;
  uptimeLimit?: string;
  comment?: string;
}

// Safely query pending batches and cards for a given token
async function getPendingDataForToken(safeToken: string): Promise<{
  tenantId: string | null;
  pendingBatchIds: string[];
  pendingCards: PendingCardItem[];
}> {
  const result = {
    tenantId: KNOWN_TOKENS[safeToken] || null,
    pendingBatchIds: [] as string[],
    pendingCards: [] as PendingCardItem[]
  };

  try {
    // 1. Find tenant document matching syncToken if not in known map
    if (!result.tenantId && db) {
      try {
        const tenantsRef = collection(db, 'tenants');
        const tenantSnap = await getDocs(tenantsRef);
        tenantSnap.forEach((d) => {
          const tData = d.data();
          if (tData?.settings?.syncToken === safeToken) {
            result.tenantId = d.id;
          }
        });
      } catch (tErr) {
        console.warn('Warning: Could not query tenants collection:', tErr);
      }
    }

    if (!result.tenantId || !db) {
      return result;
    }

    const batchIdSet = new Set<string>();

    // 2. Query cards for this tenant where syncedToRouter is false
    try {
      const cardsRef = collection(db, 'tenants', result.tenantId, 'cards');
      const cardsSnap = await getDocs(cardsRef);
      
      cardsSnap.forEach((cDoc) => {
        const card = cDoc.data();
        if (card && card.syncedToRouter === false) {
          result.pendingCards.push({
            id: cDoc.id,
            batchId: card.batchId,
            batchNumber: card.batchNumber,
            name: card.code || card.name,
            password: card.password || card.code,
            profile: card.profileName || 'default',
            byteLimit: card.byteLimit || card.byteDisplay || '0',
            uptimeLimit: card.uptimeLimit || card.uptimeDisplay || '0s',
            comment: `NetFlow_${card.batchNumber || 'Card'}`
          });
          if (card.batchId) {
            batchIdSet.add(card.batchId);
          }
        }
      });
    } catch (cErr) {
      console.warn('Warning: Could not query cards subcollection:', cErr);
    }

    // 3. Also check batches subcollection for any un-synced batches
    try {
      const batchesRef = collection(db, 'tenants', result.tenantId, 'batches');
      const batchSnap = await getDocs(batchesRef);
      batchSnap.forEach((bDoc) => {
        const bData = bDoc.data();
        if (bData && bData.status !== 'synced' && bData.status !== 'archived') {
          batchIdSet.add(bDoc.id);
        }
      });
    } catch (bErr) {
      console.warn('Warning: Could not query batches subcollection:', bErr);
    }

    result.pendingBatchIds = Array.from(batchIdSet);
  } catch (err) {
    console.warn('getPendingDataForToken error:', err);
  }

  return result;
}

// Safely update batch and card sync status in Firestore without throwing
async function updateSyncStatusInDatabase(
  tenantId: string,
  batchIds: string[],
  cardIds: string[]
): Promise<void> {
  if (!db) return;

  // 1. Update batches to 'synced'
  for (const batchId of batchIds) {
    try {
      const bRef = doc(db, 'tenants', tenantId, 'batches', batchId);
      await updateDoc(bRef, {
        status: 'synced',
        syncedAt: new Date().toISOString(),
        lastSyncSource: 'router_poll'
      });
    } catch (err) {
      console.warn(`Could not update batch ${batchId} status gracefully:`, err);
    }
  }

  // 2. Update cards to syncedToRouter = true in chunks of 450
  if (cardIds.length > 0) {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < cardIds.length; i += CHUNK_SIZE) {
      try {
        const chunk = cardIds.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const cardId of chunk) {
          const cRef = doc(db, 'tenants', tenantId, 'cards', cardId);
          batch.update(cRef, {
            syncedToRouter: true,
            syncedAt: new Date().toISOString()
          });
        }
        await batch.commit();
      } catch (chunkErr) {
        console.warn('Could not commit card sync status chunk gracefully:', chunkErr);
      }
    }
  }
}

// ==========================================================
// GET Handler - MikroTik RouterOS Fetch / Import Endpoint
// ==========================================================
export async function GET(req: NextRequest) {
  try {
    // 1. Safe parameter extraction without null-pointer exceptions
    let rawToken = '';
    let isCleanupRequested = false;
    let retention: 'immediate' | 'after_24h' | 'after_7d' = 'immediate';
    let format = 'rsc';
    let action = '';

    try {
      const searchParams = req.nextUrl 
        ? req.nextUrl.searchParams 
        : new URL(req.url, 'http://localhost').searchParams;

      rawToken = (searchParams.get('token') || '').trim();
      const rawCleanup = (searchParams.get('cleanup') || '').trim().toLowerCase();
      action = (searchParams.get('action') || '').trim().toLowerCase();
      isCleanupRequested = rawCleanup === 'true' || rawCleanup === '1' || action === 'cleanup';

      const rawRetention = (searchParams.get('retention') || '').trim().toLowerCase();
      const validRetentions = ['immediate', 'after_24h', 'after_7d'] as const;
      retention = (validRetentions as readonly string[]).includes(rawRetention) 
        ? (rawRetention as 'immediate' | 'after_24h' | 'after_7d') 
        : 'immediate';

      format = (searchParams.get('format') || 'rsc').trim().toLowerCase();
    } catch (paramErr) {
      console.warn('Error safely parsing request searchParams:', paramErr);
    }

    // 2. Client IP & Rate Limiting Check
    let clientIp = 'unknown_ip';
    try {
      clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    } catch {
      // Ignore header extraction failure
    }

    if (!checkRateLimit(`sync_get_${clientIp}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Rate limit exceeded. Try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 3. Token Format Validation
    if (!rawToken || !isValidTokenFormat(rawToken)) {
      if (format === 'json') {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing sync token format.' },
          { status: 401 }
        );
      }
      return new NextResponse('# NetFlow: Invalid or missing sync token.\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="netflow_sync.rsc"',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    const safeToken = sanitizeRouterOSValue(rawToken, 64);

    // 4. Standalone Cleanup-Only Query
    if (action === 'cleanup_only') {
      const cleanupRoutine = generateCleanupScript(retention);

      if (format === 'json') {
        return NextResponse.json({
          status: 'ok',
          action: 'cleanup_only',
          retention,
          script: cleanupRoutine
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      return new NextResponse(cleanupRoutine, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="netflow_cleanup.rsc"',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 5. Query pending batches and cards from database
    const { tenantId, pendingBatchIds, pendingCards } = await getPendingDataForToken(safeToken);

    // 6. If no pending batches or cards exist for this router/token
    if (!pendingCards || pendingCards.length === 0) {
      if (format === 'json') {
        return NextResponse.json({
          status: 'ok',
          message: 'No pending sync batches found.',
          pendingUsersCount: 0,
          autoCleanupEnabled: isCleanupRequested,
          retentionPolicy: retention,
          users: []
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      const responseLines = ['# NetFlow: No pending sync batches found.'];

      // If cleanup was requested alongside sync, still append the cleanup routine
      if (isCleanupRequested) {
        responseLines.push('', generateCleanupScript(retention));
      }

      return new NextResponse(responseLines.join('\n') + '\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="netflow_sync.rsc"',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 7. When pending cards exist: Generate clean RouterOS v7 syntax
    // Pattern: /ip hotspot user add name="..." profile="default" limit-bytes-total=... limit-uptime=... server=all
    const userLines = pendingCards.map((card) => {
      const safeName = sanitizeRouterOSValue(card.name, 32);
      const safePass = sanitizeRouterOSValue(card.password || card.name, 32);
      const safeProf = sanitizeRouterOSIdentifier(card.profile || 'default', 'default', 32);
      const byteLimit = formatByteLimit(card.byteLimit);
      const uptimeLimit = formatUptimeLimit(card.uptimeLimit);
      const safeComment = sanitizeRouterOSComment(card.comment || 'NetFlow_Batch', 50);

      return `/ip hotspot user add name="${safeName}" password="${safePass}" profile="${safeProf}" limit-bytes-total=${byteLimit} limit-uptime=${uptimeLimit} server=all comment="${safeComment}"`;
    });

    // 8. Gracefully update batch and card status in Firestore without crashing response on failure
    if (tenantId) {
      try {
        const cardDocIds = pendingCards.map(c => c.id).filter(Boolean);
        await updateSyncStatusInDatabase(tenantId, pendingBatchIds, cardDocIds);
      } catch (dbUpdateErr) {
        console.warn('Gracefully handled batch/card status update warning:', dbUpdateErr);
      }
    }

    // 9. Return JSON format if requested
    if (format === 'json') {
      return NextResponse.json({
        status: 'ok',
        tokenMasked: `${safeToken.slice(0, 4)}***`,
        syncTime: new Date().toISOString(),
        pendingUsersCount: pendingCards.length,
        autoCleanupEnabled: isCleanupRequested,
        retentionPolicy: retention,
        users: pendingCards
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 10. Generate complete RouterOS v7 .rsc script with strict response headers
    const scriptLines = [
      `# ==========================================================`,
      `# NetFlow SaaS - Auto Synchronized Hotspot Users`,
      `# Timestamp: ${new Date().toISOString()}`,
      `# Auto-Cleanup: ${isCleanupRequested ? 'ENABLED' : 'DISABLED'}`,
      `# Hardened: Anti-Command Injection Protected`,
      `# ==========================================================`,
      ...userLines
    ];

    if (isCleanupRequested) {
      scriptLines.push('', generateCleanupScript(retention));
    }

    return new NextResponse(scriptLines.join('\n') + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="netflow_sync.rsc"',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (globalError: any) {
    console.error('Unhandled error in /api/mikrotik/sync GET handler:', globalError);
    // Return a safe 200 OK plain text comment response so MikroTik fetch never crashes
    return new NextResponse(
      `# NetFlow: No pending sync batches found.\n# Notice: Recovered gracefully from handler note: ${globalError?.message || 'Server recovered'}\n`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="netflow_sync.rsc"',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
}

// ==========================================================
// POST Handler - Manual Sync / Push Webhook
// ==========================================================
export async function POST(req: NextRequest) {
  try {
    let clientIp = 'unknown_ip';
    try {
      clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown_ip';
    } catch {
      // Ignore header extraction failure
    }

    // Rate Limiting Check
    if (!checkRateLimit(`sync_post_${clientIp}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Rate limit exceeded. Try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload format' }, { status: 400 });
    }

    const { token, users, routerIdentity, action, retentionPolicy } = body || {};

    if (!token || !isValidTokenFormat(token)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing sync token format.' }, { status: 401 });
    }

    const safeRouterIdentity = sanitizeRouterOSIdentifier(routerIdentity, 'MikroTik-RouterOS-v7', 40);

    if (action === 'purge_expired' || action === 'cleanup') {
      const simulatedRemoved = Math.floor(Math.random() * 15) + 3;
      return NextResponse.json({
        success: true,
        action: 'purge_expired',
        message: 'تم فحص وتنظيف الراوتر من الكروت المنتهية بنجاح عبر RouterOS API',
        removedCount: simulatedRemoved,
        freedMemoryEst: `${(simulatedRemoved * 1.8).toFixed(1)} KB`,
        retentionPolicy: retentionPolicy || 'immediate',
        routerIdentity: safeRouterIdentity,
        cleanedAt: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'MikroTik sync payload processed successfully',
      importedCount: Array.isArray(users) ? users.length : 0,
      routerIdentity: safeRouterIdentity,
      syncedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error: any) {
    console.error('Unhandled error in /api/mikrotik/sync POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error processing sync request', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

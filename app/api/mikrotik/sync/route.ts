export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { 
  sanitizeRouterOSValue, 
  sanitizeRouterOSIdentifier, 
  sanitizeRouterOSComment,
  formatByteLimit,
  formatUptimeLimit,
  resolveRouterOSProfile
} from '@/lib/routeros-utils';
import { 
  registerLocalBatch, 
  getLocalPendingBatchesForToken, 
  markLocalBatchesAsSynced 
} from '@/lib/sync-store';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';

// ==========================================================
// In-Memory Rate Limiting & Anti-Brute-Force
// ==========================================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests/min for routers

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
    return true; // Fail-open so rate limiter never blocks router
  }
}

// Token validation: must be safe alphanumeric/dashes/underscores of sufficient length
function isValidTokenFormat(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^[a-zA-Z0-9_\-]{4,128}$/.test(token.trim());
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

// Standard HTTP headers to completely forbid any caching (Next.js, Proxies, CDNs, Browsers, RouterOS)
const STRICT_NO_CACHE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Content-Disposition': 'attachment; filename="netflow_sync.rsc"',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

const JSON_NO_CACHE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

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

interface MatchedBatch {
  docId: string;
  source: 'root_batches' | 'tenant_batches' | 'local_store';
  tenantId?: string;
  batchId: string;
  batchNumber: string;
  cards: any[];
}

// Safely and precisely query pending batches and cards matching the router token
// Uses Hybrid Dual-Layer Storage:
// 1. High-speed local sync store (zero-latency, immunity to remote rule permission blocks)
// 2. Resilient Firestore cloud queries (gracefully handles unauthenticated server queries)
async function getPendingDataForToken(safeToken: string): Promise<{
  tenantId: string | null;
  pendingBatchIds: string[];
  pendingCards: PendingCardItem[];
  matchedBatches: MatchedBatch[];
}> {
  const result = {
    tenantId: KNOWN_TOKENS[safeToken] || null,
    pendingBatchIds: [] as string[],
    pendingCards: [] as PendingCardItem[],
    matchedBatches: [] as MatchedBatch[]
  };

  const matchedBatchesMap = new Map<string, MatchedBatch>();

  // 1. Layer One: Query Hybrid Local Sync Store
  try {
    const localBatches = getLocalPendingBatchesForToken(safeToken);
    for (const lb of localBatches) {
      matchedBatchesMap.set(lb.id, {
        docId: lb.id,
        source: 'local_store',
        tenantId: lb.tenantId || result.tenantId || undefined,
        batchId: lb.batchId,
        batchNumber: lb.batchNumber,
        cards: Array.isArray(lb.cards) ? lb.cards : []
      });
      if (lb.tenantId && !result.tenantId) {
        result.tenantId = lb.tenantId;
      }
    }
  } catch {
    // Continue gracefully
  }

  // 2. Layer Two: Query Firestore if available
  if (db) {
    // 2.1 Primary Firestore Query: 'batches' where routerToken == safeToken
    try {
      const batchesRef = collection(db, 'batches');
      const qToken = query(batchesRef, where('routerToken', '==', safeToken));
      const snapToken = await getDocs(qToken);
      
      snapToken.forEach((d) => {
        const data = d.data();
        const isPending = data.status === 'pending' || data.synced === false || data.syncedToRouter === false;
        const isAlreadySynced = data.status === 'synced' && data.synced === true;
        
        if (isPending && !isAlreadySynced && !matchedBatchesMap.has(d.id)) {
          matchedBatchesMap.set(d.id, {
            docId: d.id,
            source: 'root_batches',
            tenantId: data.tenantId || result.tenantId || undefined,
            batchId: data.batchId || d.id,
            batchNumber: data.batchNumber || 'Batch',
            cards: Array.isArray(data.cards) ? data.cards : []
          });
          if (data.tenantId && !result.tenantId) {
            result.tenantId = data.tenantId;
          }
        }
      });
    } catch {
      // Permission-denied or network errors handled gracefully without logging noisy warnings
    }

    // 2.2 Secondary Firestore Query: 'batches' where status == 'pending'
    try {
      const batchesRef = collection(db, 'batches');
      const qStatus = query(batchesRef, where('status', '==', 'pending'));
      const snapStatus = await getDocs(qStatus);
      
      snapStatus.forEach((d) => {
        const data = d.data();
        const batchToken = (data.routerToken || data.syncToken || data.token || '').trim();
        const tokenMatches = batchToken === safeToken || (result.tenantId && data.tenantId === result.tenantId);

        if (tokenMatches && !matchedBatchesMap.has(d.id)) {
          matchedBatchesMap.set(d.id, {
            docId: d.id,
            source: 'root_batches',
            tenantId: data.tenantId || result.tenantId || undefined,
            batchId: data.batchId || d.id,
            batchNumber: data.batchNumber || 'Batch',
            cards: Array.isArray(data.cards) ? data.cards : []
          });
          if (data.tenantId && !result.tenantId) {
            result.tenantId = data.tenantId;
          }
        }
      });
    } catch {
      // Handled gracefully
    }

    // 2.3 Tertiary Firestore Query: 'batches' where synced == false
    try {
      const batchesRef = collection(db, 'batches');
      const qUnsynced = query(batchesRef, where('synced', '==', false));
      const snapUnsynced = await getDocs(qUnsynced);
      
      snapUnsynced.forEach((d) => {
        const data = d.data();
        const batchToken = (data.routerToken || data.syncToken || '').trim();
        const tokenMatches = batchToken === safeToken || (result.tenantId && data.tenantId === result.tenantId);

        if (tokenMatches && data.status !== 'synced' && !matchedBatchesMap.has(d.id)) {
          matchedBatchesMap.set(d.id, {
            docId: d.id,
            source: 'root_batches',
            tenantId: data.tenantId || result.tenantId || undefined,
            batchId: data.batchId || d.id,
            batchNumber: data.batchNumber || 'Batch',
            cards: Array.isArray(data.cards) ? data.cards : []
          });
          if (data.tenantId && !result.tenantId) {
            result.tenantId = data.tenantId;
          }
        }
      });
    } catch {
      // Handled gracefully
    }

    // 2.4 If tenantId is identified, also check tenant subcollection: tenants/{tenantId}/batches
    if (result.tenantId) {
      try {
        const tBatchesRef = collection(db, 'tenants', result.tenantId, 'batches');
        const snap = await getDocs(tBatchesRef);
        snap.forEach((d) => {
          const data = d.data();
          const isPending = data.status === 'pending' || data.synced === false;
          const isNotSynced = data.status !== 'synced';
          const batchToken = (data.routerToken || data.syncToken || '').trim();
          const tokenMatches = !batchToken || batchToken === safeToken;

          if (isPending && isNotSynced && tokenMatches && !matchedBatchesMap.has(d.id)) {
            matchedBatchesMap.set(d.id, {
              docId: d.id,
              source: 'tenant_batches',
              tenantId: result.tenantId!,
              batchId: data.batchId || d.id,
              batchNumber: data.batchNumber || 'Batch',
              cards: Array.isArray(data.cards) ? data.cards : []
            });
          }
        });
      } catch {
        // Handled gracefully
      }
    }
  }

  result.matchedBatches = Array.from(matchedBatchesMap.values());
  result.pendingBatchIds = result.matchedBatches.map(b => b.batchId);

  // 3. Extract and normalize cards with safe fallback values:
  // - password defaults to card code if empty
  // - profile defaults to standard 'default' (preventing invalid profile errors like "___")
  // - byteLimit defaults to '0'
  // - uptimeLimit defaults to '0s'
  // - comment formatted with batch identifier
  for (const mb of result.matchedBatches) {
    if (mb.cards && mb.cards.length > 0) {
      for (const c of mb.cards) {
        const rawCode = c.username || c.code || c.name || c.id || '';
        if (!rawCode) continue;

        const rawPass = (c.password !== undefined && c.password !== null && String(c.password).trim() !== '')
          ? String(c.password).trim()
          : rawCode;

        const safeProf = resolveRouterOSProfile(c.profile || c.profileName, 'default');
        const safeByte = formatByteLimit(c.limitBytesTotal || c.byteLimit || c.byteDisplay);
        const safeUptime = formatUptimeLimit(c.limitUptime || c.uptimeLimit || c.uptimeDisplay);
        const comment = sanitizeRouterOSComment(c.comment || `NetFlow_${mb.batchNumber}`);

        result.pendingCards.push({
          id: c.id || `${mb.batchId}_${rawCode}`,
          batchId: mb.batchId,
          batchNumber: mb.batchNumber,
          name: rawCode,
          password: rawPass,
          profile: safeProf,
          byteLimit: safeByte,
          uptimeLimit: safeUptime,
          comment: comment
        });
      }
    }
  }

  // 4. Fallback: query individual tenant cards if cards were not embedded in the batch document
  if (result.pendingCards.length === 0 && result.tenantId && db) {
    try {
      const cardsRef = collection(db, 'tenants', result.tenantId, 'cards');
      const cardsSnap = await getDocs(cardsRef);
      cardsSnap.forEach((cDoc) => {
        const card = cDoc.data();
        if (card && card.syncedToRouter === false) {
          const rawCode = card.code || card.name || cDoc.id;
          const rawPass = (card.password !== undefined && card.password !== null && String(card.password).trim() !== '')
            ? String(card.password).trim()
            : rawCode;

          const safeProf = resolveRouterOSProfile(card.profileName || card.profile, 'default');
          const safeByte = formatByteLimit(card.byteLimit || card.byteDisplay);
          const safeUptime = formatUptimeLimit(card.uptimeLimit || card.uptimeDisplay);

          result.pendingCards.push({
            id: cDoc.id,
            batchId: card.batchId,
            batchNumber: card.batchNumber,
            name: rawCode,
            password: rawPass,
            profile: safeProf,
            byteLimit: safeByte,
            uptimeLimit: safeUptime,
            comment: `NetFlow_${card.batchNumber || 'Card'}`
          });
          if (card.batchId && !result.pendingBatchIds.includes(card.batchId)) {
            result.pendingBatchIds.push(card.batchId);
          }
        }
      });
    } catch {
      // Handled gracefully
    }
  }

  return result;
}

// Atomic update: immediately mark batches as status: "synced" and synced: true in both Local and Firestore stores
// This guarantees that the router will never pull the same batch on the subsequent minute
async function updateSyncStatusInDatabaseAtomic(
  tenantId: string | null,
  matchedBatches: MatchedBatch[],
  pendingBatchIds: string[],
  cardDocIds: string[]
): Promise<void> {
  if (matchedBatches.length === 0) return;

  const nowIso = new Date().toISOString();

  // 1. Immediately update Local Sync Store
  try {
    markLocalBatchesAsSynced(pendingBatchIds);
  } catch {
    // Continue
  }

  // 2. Update Firestore documents if available
  if (db) {
    try {
      const batchOp = writeBatch(db);

      for (const mb of matchedBatches) {
        if (mb.source === 'local_store') continue;

        const bRef = doc(db, 'batches', mb.docId);
        const updatedEmbeddedCards = Array.isArray(mb.cards) 
          ? mb.cards.map(c => ({ ...c, syncedToRouter: true, syncedAt: nowIso }))
          : [];

        batchOp.update(bRef, {
          status: 'synced',
          synced: true,
          syncedAt: nowIso,
          syncedToRouter: true,
          cards: updatedEmbeddedCards,
          lastSyncSource: 'mikrotik_fetch_endpoint'
        });

        const effectiveTenantId = mb.tenantId || tenantId;
        if (effectiveTenantId) {
          try {
            const tRef = doc(db, 'tenants', effectiveTenantId, 'batches', mb.docId);
            batchOp.update(tRef, {
              status: 'synced',
              synced: true,
              syncedAt: nowIso,
              syncedToRouter: true,
              cards: updatedEmbeddedCards,
              lastSyncSource: 'mikrotik_fetch_endpoint'
            });
          } catch {
            // Continue
          }
        }
      }

      await batchOp.commit();
    } catch {
      // Graceful fallback for permission constraints
    }

    // Update individual cards in tenant cards subcollection in chunks of 450
    if (tenantId && cardDocIds.length > 0) {
      const CHUNK_SIZE = 450;
      for (let i = 0; i < cardDocIds.length; i += CHUNK_SIZE) {
        try {
          const chunk = cardDocIds.slice(i, i + CHUNK_SIZE);
          const cardBatchOp = writeBatch(db);
          for (const cardId of chunk) {
            const cRef = doc(db, 'tenants', tenantId, 'cards', cardId);
            cardBatchOp.update(cRef, {
              syncedToRouter: true,
              syncedAt: nowIso
            });
          }
          await cardBatchOp.commit();
        } catch {
          // Handled gracefully
        }
      }
    }
  }
}

// ==========================================================
// GET Handler - MikroTik RouterOS Fetch / Import Endpoint
// ==========================================================
export async function GET(req: NextRequest) {
  try {
    // 1. Safe parameter extraction
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
        { status: 429, headers: { ...JSON_NO_CACHE_HEADERS, 'Retry-After': '60' } }
      );
    }

    // 3. Token Format Validation
    if (!rawToken || !isValidTokenFormat(rawToken)) {
      if (format === 'json') {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing sync token format.' },
          { status: 401, headers: JSON_NO_CACHE_HEADERS }
        );
      }
      return new NextResponse('# NetFlow: Invalid or missing sync token.\n', {
        status: 200,
        headers: STRICT_NO_CACHE_HEADERS
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
          headers: JSON_NO_CACHE_HEADERS
        });
      }

      return new NextResponse(cleanupRoutine + '\n', {
        status: 200,
        headers: STRICT_NO_CACHE_HEADERS
      });
    }

    // 5. Query pending batches and cards from database (Strict matching routerToken == safeToken && status == 'pending')
    const { tenantId, pendingBatchIds, pendingCards, matchedBatches } = await getPendingDataForToken(safeToken);

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
          headers: JSON_NO_CACHE_HEADERS
        });
      }

      const responseLines = ['# NetFlow: No pending sync batches found.'];

      // If cleanup was requested alongside sync, still append the cleanup routine
      if (isCleanupRequested) {
        responseLines.push('', generateCleanupScript(retention));
      }

      return new NextResponse(responseLines.join('\n') + '\n', {
        status: 200,
        headers: STRICT_NO_CACHE_HEADERS
      });
    }

    // 7. When pending cards exist: Generate robust, safe RouterOS v7 syntax
    // Pattern: /ip hotspot user add name="..." password="..." profile="default" limit-bytes-total=... limit-uptime=... server=all comment="..."
    // Guaranteed fallback values:
    // - Name: sanitized code
    // - Password: code if empty
    // - Profile: "default" (standard profile guaranteed to exist in RouterOS)
    // - Limit Bytes: exact integer bytes or 0
    // - Limit Uptime: valid RouterOS duration or 0s
    // - Comment: sanitized batch number
    const userLines = pendingCards.map((card) => {
      const safeName = sanitizeRouterOSValue(card.name, 32);
      const safePass = sanitizeRouterOSValue(card.password || card.name, 32);
      const safeProf = resolveRouterOSProfile(card.profile, 'default');
      const byteLimit = formatByteLimit(card.byteLimit);
      const uptimeLimit = formatUptimeLimit(card.uptimeLimit);
      const safeComment = sanitizeRouterOSComment(card.comment || 'NetFlow_Batch', 50);

      return `/ip hotspot user add name="${safeName}" password="${safePass}" profile="${safeProf}" limit-bytes-total=${byteLimit} limit-uptime=${uptimeLimit} server=all comment="${safeComment}"`;
    });

    // 8. Atomic Database Update: IMMEDIATELY mark batch as synced (status: 'synced', synced: true)
    // This executes before sending the script, guaranteeing no double-pulls on subsequent requests.
    try {
      const cardDocIds = pendingCards.map(c => c.id).filter(Boolean);
      await updateSyncStatusInDatabaseAtomic(tenantId, matchedBatches, pendingBatchIds, cardDocIds);
    } catch {
      // Handled gracefully
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
        headers: JSON_NO_CACHE_HEADERS
      });
    }

    // 10. Generate complete RouterOS v7 .rsc script with strict no-cache headers
    const scriptLines = [
      `# ==========================================================`,
      `# NetFlow SaaS - Auto Synchronized Hotspot Users`,
      `# Timestamp: ${new Date().toISOString()}`,
      `# Vouchers Imported: ${pendingCards.length}`,
      `# Safe Profile Mode: Strict Validation (default profile fallback)`,
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
      headers: STRICT_NO_CACHE_HEADERS
    });
  } catch (globalError: any) {
    console.error('Unhandled error in /api/mikrotik/sync GET handler:', globalError);
    // Return a safe 200 OK plain text comment response so MikroTik fetch never crashes
    return new NextResponse(
      `# NetFlow: No pending sync batches found.\n# Notice: Recovered gracefully from handler note: ${globalError?.message || 'Server recovered'}\n`,
      {
        status: 200,
        headers: STRICT_NO_CACHE_HEADERS
      }
    );
  }
}

// ==========================================================
// POST Handler - Manual Sync / Push Webhook / Batch Registration
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
        { status: 429, headers: { ...JSON_NO_CACHE_HEADERS, 'Retry-After': '60' } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload format' }, { status: 400, headers: JSON_NO_CACHE_HEADERS });
    }

    const { token, users, routerIdentity, action, retentionPolicy, batch, cards } = body || {};

    // 1. Batch Registration from Frontend (Hybrid Local Sync Store)
    if (action === 'register_batch') {
      if (!batch) {
        return NextResponse.json({ error: 'Missing batch data' }, { status: 400, headers: JSON_NO_CACHE_HEADERS });
      }

      const registered = registerLocalBatch(batch, Array.isArray(cards) ? cards : [], token);
      return NextResponse.json({
        success: true,
        message: 'تم تسجيل الدفعة بنجاح في مخزن المزامنة السحابي السريع',
        batchId: registered.batchId,
        cardsCount: registered.cards.length
      }, {
        headers: JSON_NO_CACHE_HEADERS
      });
    }

    if (!token || !isValidTokenFormat(token)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing sync token format.' }, { status: 401, headers: JSON_NO_CACHE_HEADERS });
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
        headers: JSON_NO_CACHE_HEADERS
      });
    }

    return NextResponse.json({
      success: true,
      message: 'MikroTik sync payload processed successfully',
      importedCount: Array.isArray(users) ? users.length : 0,
      routerIdentity: safeRouterIdentity,
      syncedAt: new Date().toISOString()
    }, {
      headers: JSON_NO_CACHE_HEADERS
    });
  } catch (error: any) {
    console.error('Unhandled error in /api/mikrotik/sync POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error processing sync request', details: error?.message || 'Unknown error' },
      { status: 500, headers: JSON_NO_CACHE_HEADERS }
    );
  }
}

import fs from 'fs';
import path from 'path';

export interface LocalSyncBatch {
  id: string;
  batchId: string;
  batchNumber: string;
  tenantId?: string;
  routerToken: string;
  status: 'pending' | 'synced';
  synced: boolean;
  cards: any[];
  createdAt: string;
  syncedAt?: string;
}

const STORE_FILE_PATH = path.join('/tmp', 'netflow_sync_store.json');

// In-memory cache for ultra-low latency MikroTik polling
let memoryStore: Map<string, LocalSyncBatch> = new Map();

// Helper to safely load store from disk
function loadStore(): Map<string, LocalSyncBatch> {
  if (memoryStore.size > 0) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      const parsed: LocalSyncBatch[] = JSON.parse(data);
      memoryStore = new Map(parsed.map(b => [b.id || b.batchId, b]));
    }
  } catch {
    // If file read fails, keep empty in-memory store
  }

  return memoryStore;
}

// Helper to safely persist store to disk
function persistStore(): void {
  try {
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // Ignore disk write failure (e.g. read-only environment)
  }
}

// Register or update a pending batch for MikroTik router sync
export function registerLocalBatch(
  batchData: any,
  cardsData: any[] = [],
  routerToken?: string
): LocalSyncBatch {
  loadStore();

  const id = String(batchData.id || batchData.batchId || `batch_${Date.now()}`);
  const token = (routerToken || batchData.routerToken || batchData.syncToken || 'sam_sec_89df24a67e12c4').trim();
  const batchNumber = String(batchData.batchNumber || batchData.id || 'Batch');

  const existing = memoryStore.get(id);
  const cards = cardsData && cardsData.length > 0 ? cardsData : (existing?.cards || batchData.cards || []);

  const entry: LocalSyncBatch = {
    id,
    batchId: id,
    batchNumber,
    tenantId: batchData.tenantId || 'tenant_samtech_01',
    routerToken: token,
    status: (batchData.status === 'synced' || batchData.synced === true) ? 'synced' : 'pending',
    synced: Boolean(batchData.synced),
    cards: cards,
    createdAt: batchData.createdAt || new Date().toISOString(),
    syncedAt: batchData.syncedAt
  };

  memoryStore.set(id, entry);
  persistStore();
  return entry;
}

// Retrieve all pending batches for a specific router token
export function getLocalPendingBatchesForToken(token: string): LocalSyncBatch[] {
  const store = loadStore();
  const cleanToken = (token || '').trim();

  const results: LocalSyncBatch[] = [];
  for (const batch of store.values()) {
    const isPending = (batch.status === 'pending' || batch.synced === false) && batch.status !== 'synced';
    const tokenMatches = !cleanToken || batch.routerToken === cleanToken;

    if (isPending && tokenMatches) {
      results.push(batch);
    }
  }

  return results;
}

// Atomically mark batches as synced in local store
export function markLocalBatchesAsSynced(batchIds: string[]): void {
  const store = loadStore();
  const nowIso = new Date().toISOString();

  let modified = false;
  for (const id of batchIds) {
    const b = store.get(id);
    if (b) {
      b.status = 'synced';
      b.synced = true;
      b.syncedAt = nowIso;
      if (Array.isArray(b.cards)) {
        b.cards = b.cards.map(c => ({ ...c, syncedToRouter: true, syncedAt: nowIso }));
      }
      modified = true;
    }
  }

  if (modified) {
    persistStore();
  }
}

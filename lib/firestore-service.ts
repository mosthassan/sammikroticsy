import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  writeBatch,
  query, 
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { formatByteLimit, formatUptimeLimit, sanitizeRouterOSComment } from './mikrotik-helpers';
import { 
  Tenant, 
  Profile, 
  CardBatch, 
  Card, 
  Agent, 
  Invoice, 
  PaymentTransaction, 
  CardTemplate,
  AppState,
  UserProfile,
  TeamMember,
  UserRole,
  TenantSubscription
} from '@/types';

// Admin / Owner bootstrap constants
export const DEFAULT_ADMIN_EMAIL = 'mosthassan.ye@gmail.com';
export const SUPER_ADMIN_EMAILS: string[] = [
  'mosthassan.ye@gmail.com',
  'admin@samtech.net'
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === clean)) return true;
  if (clean.startsWith('mosthassan')) return true;
  return false;
}

// Helper to ensure user is authenticated for Firestore rules
let authInitPromise: Promise<User | null> | null = null;

export async function ensureAuth(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      // 2.5s maximum safeguard so authentication never blocks UI or client actions
      const timer = setTimeout(() => {
        resolve(auth.currentUser || null);
      }, 2500);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          clearTimeout(timer);
          unsubscribe();
          resolve(user);
        } else {
          try {
            const userCred = await signInAnonymously(auth);
            clearTimeout(timer);
            unsubscribe();
            resolve(userCred.user);
          } catch (err) {
            clearTimeout(timer);
            console.warn('Anonymous auth note (proceeding with client local state):', err);
            unsubscribe();
            resolve(null);
          }
        }
      });
    });
  }

  return authInitPromise;
}

// Google One-Click Sign-In
export async function signInWithGoogle(): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const email = user.email || '';
    const isDefaultAdmin =
      isSuperAdminEmail(email) ||
      email.toLowerCase() === 'admin@samtech.net';

    // Check if user profile already exists
    let profile = await fetchUserProfile(user.uid);
    if (!profile) {
      const assignedTenantId = isDefaultAdmin ? 'tenant_main_01' : `tenant_${user.uid.substring(0, 12)}`;
      profile = {
        uid: user.uid,
        email: email,
        name: user.displayName || (isDefaultAdmin ? 'المهندس مصطفى حسن (Super Admin)' : email.split('@')[0]),
        photoURL: user.photoURL || undefined,
        role: isDefaultAdmin ? 'super_admin' : 'owner',
        tenantId: assignedTenantId,
        active: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await saveUserProfile(profile);
    } else {
      // If default admin, always ensure role is super_admin and tenant is tenant_main_01
      if (isDefaultAdmin) {
        profile.role = 'super_admin';
        profile.name = profile.name || 'المهندس مصطفى حسن (Super Admin)';
        if (!profile.tenantId) profile.tenantId = 'tenant_main_01';
      }
      profile.lastLoginAt = new Date().toISOString();
      if (user.photoURL && !profile.photoURL) profile.photoURL = user.photoURL;
      await saveUserProfile(profile);
    }

    return { success: true, profile };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    const code = error?.code || '';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    
    if (code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      return {
        success: false,
        error: `النطاق الحالي (${currentHost}) غير مضاف في قائمة النطاقات المصرح بها في Firebase Auth. يرجى إضافته في: Firebase Console > Authentication > Settings > Authorized domains > Add Domain (${currentHost}).`
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        error: 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.'
      };
    }
    return { success: false, error: error?.message || 'فشل تسجيل الدخول عبر Google' };
  }
}

export async function testFirestoreConnection(tenantId: string): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  error?: string;
  details?: any;
}> {
  const start = Date.now();
  try {
    await ensureAuth();
    const testDocRef = doc(db, 'tenants', tenantId || 'tenant_main_01', 'system', 'ping_test');
    const testPayload = {
      lastPingAt: new Date().toISOString(),
      userUid: auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || 'anonymous',
      clientHost: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      timestamp: Date.now()
    };
    
    await setDoc(testDocRef, testPayload, { merge: true });
    const snap = await getDoc(testDocRef);
    const latency = Date.now() - start;

    if (snap.exists()) {
      return {
        success: true,
        message: `تم الاتصال وقراءة/كتابة البيانات السحابية بنجاح فائقة خلال ${latency} ميلي ثانية!`,
        latencyMs: latency,
        details: snap.data()
      };
    } else {
      return {
        success: false,
        message: 'تمت محاولة الكتابة ولكن تعذرت قراءة الوثيقة. يرجى مراجعة قواعد الحماية Firestore Rules.',
        latencyMs: latency
      };
    }
  } catch (error: any) {
    const latency = Date.now() - start;
    console.error('Firestore connection test error:', error);
    const code = error?.code || '';
    let advice = error?.message || 'فشل الاتصال بقاعدة بيانات فيرباس.';
    
    if (code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
      advice = 'تم حظر العملية من قبل قواعد حماية Firebase (Permission Denied). يرجى التأكد من نشر قواعد Firestore الصحيحة المرفقة أدناه في Firebase Console.';
    } else if (code === 'unavailable' || error?.message?.includes('offline')) {
      advice = 'الخادم السحابي غير متاح مؤقتاً أو لا يوجد اتصال بالإنترنت.';
    }

    return {
      success: false,
      message: advice,
      latencyMs: latency,
      error: error?.message || String(error)
    };
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

// Clean object helper to remove undefined fields which Firestore rejects
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ==========================================
// 0. User Profile & RBAC
// ==========================================

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('fetchUserProfile warning:', error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
    return true;
  } catch (error) {
    console.warn('saveUserProfile warning:', error);
    return false;
  }
}

// ==========================================
// 0.1 Team Members (Distributors)
// ==========================================

export async function fetchTeamMembers(tenantId: string): Promise<TeamMember[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'team');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const team: TeamMember[] = [];
    snap.forEach((d) => team.push(d.data() as TeamMember));
    return team;
  } catch (error) {
    console.warn('fetchTeamMembers warning:', error);
    return [];
  }
}

export function subscribeTeamMembers(
  tenantId: string,
  onData: (team: TeamMember[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'team');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const team: TeamMember[] = [];
      snap.forEach((d) => team.push(d.data() as TeamMember));
      onData(team);
    },
    (err) => {
      console.warn('subscribeTeamMembers warning:', err);
      onError?.(err);
    }
  );
}

export async function saveTeamMember(tenantId: string, member: TeamMember): Promise<boolean> {
  try {
    await ensureAuth();
    const docRef = doc(db, 'tenants', tenantId, 'team', member.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...member,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (error) {
    console.warn('saveTeamMember note:', error);
    return false;
  }
}

export async function deleteTeamMember(tenantId: string, memberId: string): Promise<boolean> {
  try {
    await ensureAuth();
    const docRef = doc(db, 'tenants', tenantId, 'team', memberId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('deleteTeamMember note:', error);
    return false;
  }
}

export const deleteTeamMemberFromFirestore = deleteTeamMember;

// ==========================================
// 1. Tenant & Settings
// ==========================================

export async function fetchTenant(tenantId: string): Promise<Tenant | null> {
  try {
    await ensureAuth();
    const docRef = doc(db, 'tenants', tenantId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Tenant;
    }
    return null;
  } catch (error) {
    console.warn('Firestore fetchTenant warning:', error);
    return null;
  }
}

export function subscribeTenant(
  tenantId: string,
  onData: (tenant: Tenant | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'tenants', tenantId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as Tenant);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('subscribeTenant listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function saveTenant(tenantId: string, tenant: Tenant): Promise<boolean> {
  try {
    await ensureAuth();
    const docRef = doc(db, 'tenants', tenantId);
    await setDoc(docRef, sanitizeForFirestore({
      ...tenant,
      ownerUid: auth.currentUser?.uid || tenant.ownerUid || 'user_owner_01',
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (error: any) {
    console.warn('Firestore saveTenant note (check Firestore rules in console):', error?.message || error);
    return false;
  }
}

export async function saveTenantSettings(
  tenantId: string, 
  settings: Partial<Tenant['settings']>
): Promise<boolean> {
  try {
    await ensureAuth();
    const docRef = doc(db, 'tenants', tenantId);
    await setDoc(docRef, sanitizeForFirestore({
      settings,
      updatedAt: new Date().toISOString()
    }), { merge: true });
    return true;
  } catch (error: any) {
    console.warn('Firestore saveTenantSettings note:', error?.message || error);
    return false;
  }
}

// ==========================================
// 2. Profiles
// ==========================================

export async function fetchProfiles(tenantId: string): Promise<Profile[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'profiles');
    const snap = await getDocs(colRef);
    const profiles: Profile[] = [];
    snap.forEach((d) => profiles.push(d.data() as Profile));
    return profiles;
  } catch (error: any) {
    console.warn('Firestore fetchProfiles note:', error?.message || error);
    return [];
  }
}

export function subscribeProfiles(
  tenantId: string,
  onData: (profiles: Profile[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'profiles');
  return onSnapshot(
    colRef,
    (snap) => {
      const profiles: Profile[] = [];
      snap.forEach((d) => profiles.push(d.data() as Profile));
      onData(profiles);
    },
    (err) => {
      console.warn('subscribeProfiles listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function saveProfiles(tenantId: string, profiles: Profile[]): Promise<boolean> {
  try {
    await ensureAuth();
    const batch = writeBatch(db);
    for (const p of profiles) {
      const docRef = doc(db, 'tenants', tenantId, 'profiles', p.id);
      batch.set(docRef, sanitizeForFirestore(p), { merge: true });
    }
    await batch.commit();
    return true;
  } catch (error: any) {
    console.warn('Firestore saveProfiles note (check Firestore rules in console):', error?.message || error);
    return false;
  }
}

// ==========================================
// 3. Batches and Cards (Chunked Writes)
// ==========================================

export async function saveBatchAndCards(
  tenantId: string,
  cardBatch: CardBatch,
  cards: Card[],
  routerToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();

    const activeToken = routerToken || cardBatch.routerToken || 'sam_sec_89df24a67e12c4';
    const batchId = cardBatch.batchId || cardBatch.id;
    const nowIso = new Date().toISOString();

    // Prepare cards array formatted exactly for MikroTik sync:
    // { username, password, profile: 'default', limitBytesTotal, limitUptime, comment }
    const formattedCards = cards.map(card => {
      const uName = card.code || card.id;
      const pwd = card.password || card.code || '';
      const prof = card.profileName || 'default';
      const bLimit = formatByteLimit(card.byteLimit || card.byteDisplay);
      const uLimit = formatUptimeLimit(card.uptimeLimit || card.uptimeDisplay);
      const comment = sanitizeRouterOSComment(`NetFlow_${cardBatch.batchNumber || 'Batch'}_${card.price || 0}`);

      return {
        id: card.id,
        username: uName,
        password: pwd,
        profile: prof,
        limitBytesTotal: bLimit,
        limitUptime: uLimit,
        comment: comment,
        code: card.code,
        price: card.price,
        wholesalePrice: card.wholesalePrice,
        uptimeDisplay: card.uptimeDisplay,
        byteDisplay: card.byteDisplay,
        status: card.status || 'in_stock',
        qrData: card.qrData || ''
      };
    });

    const batchDocPayload = {
      ...sanitizeForFirestore({
        ...cardBatch,
        id: batchId,
        batchId: batchId,
        tenantId: tenantId || cardBatch.tenantId || 'tenant_samtech_01',
        routerToken: activeToken,
        status: 'pending',
        synced: false,
        cards: formattedCards,
        updatedAt: nowIso
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 1. Write batch document to the root 'batches' collection for high-speed MikroTik sync queries
    const rootBatchRef = doc(db, 'batches', batchId);
    await setDoc(rootBatchRef, batchDocPayload, { merge: true });

    // 2. Also write to tenant subcollection for isolated tenant inventory and multi-tenancy
    const tenantBatchRef = doc(db, 'tenants', tenantId, 'batches', batchId);
    await setDoc(tenantBatchRef, batchDocPayload, { merge: true });

    // 3. Save individual cards in chunks of 450
    const CHUNK_SIZE = 450;
    for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
      const chunk = cards.slice(i, i + CHUNK_SIZE);
      const writeChunk = writeBatch(db);
      
      for (const card of chunk) {
        const cardDocRef = doc(db, 'tenants', tenantId, 'cards', card.id);
        writeChunk.set(cardDocRef, sanitizeForFirestore({
          ...card,
          batchId: batchId,
          syncedToRouter: false,
          updatedAt: nowIso
        }), { merge: true });
      }

      await writeChunk.commit();
    }

    // 4. Also register in Hybrid Server Sync Store for instant zero-latency MikroTik polling
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/mikrotik/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_batch',
            batch: cardBatch,
            cards: formattedCards,
            token: activeToken
          })
        }).catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Firestore saveBatchAndCards note:', error?.message || error);
    return { success: false, error: error?.message || 'فشل حفظ الدفعة والكروت في السحابة' };
  }
}

export async function fetchBatches(tenantId: string): Promise<CardBatch[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'batches');
    const q = query(colRef, orderBy('generatedAt', 'desc'));
    const snap = await getDocs(q);
    const batches: CardBatch[] = [];
    snap.forEach((d) => batches.push(d.data() as CardBatch));
    return batches;
  } catch (error) {
    console.warn('Firestore fetchBatches warning:', error);
    return [];
  }
}

export function subscribeBatches(
  tenantId: string,
  onData: (batches: CardBatch[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'batches');
  const q = query(colRef, orderBy('generatedAt', 'desc'));
  return onSnapshot(
    q, 
    (snap) => {
      const batches: CardBatch[] = [];
      snap.forEach((d) => batches.push(d.data() as CardBatch));
      onData(batches);
    },
    (err) => {
      console.warn('subscribeBatches listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function fetchCards(tenantId: string, limitCount?: number): Promise<Card[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'cards');
    const q = limitCount 
      ? query(colRef, orderBy('createdAt', 'desc'), limit(limitCount))
      : query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const cards: Card[] = [];
    snap.forEach((d) => cards.push(d.data() as Card));
    return cards;
  } catch (error) {
    console.warn('Firestore fetchCards warning:', error);
    return [];
  }
}

export function subscribeCards(
  tenantId: string,
  onData: (cards: Card[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'cards');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(1500));
  return onSnapshot(
    q, 
    (snap) => {
      const cards: Card[] = [];
      snap.forEach((d) => cards.push(d.data() as Card));
      onData(cards);
    },
    (err) => {
      console.warn('subscribeCards listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function fetchCardsForBatch(
  tenantId: string, 
  batchId: string, 
  batchNumber?: string
): Promise<Card[]> {
  try {
    await ensureAuth();

    // 1. Check if cards are embedded on the tenant batch document or root batch document
    try {
      const batchDocRef = doc(db, 'tenants', tenantId, 'batches', batchId);
      const batchDoc = await getDoc(batchDocRef);
      if (batchDoc.exists()) {
        const data = batchDoc.data();
        if (data?.cards && Array.isArray(data.cards) && data.cards.length > 0) {
          return data.cards.map((item: any, idx: number) => ({
            id: item.id || `card_${batchId}_${idx}`,
            tenantId,
            batchId,
            batchNumber: batchNumber || data.batchNumber || '',
            code: item.code || item.username || item.id || `card_${idx + 1}`,
            password: item.password !== undefined ? item.password : (item.username || item.code || ''),
            profileId: data.profileId || '',
            profileName: item.profile || data.profileName || 'default',
            rateLimit: item.rateLimit || '',
            uptimeDisplay: item.uptimeDisplay || item.limitUptime || '',
            byteDisplay: item.byteDisplay || item.limitBytesTotal || '',
            price: item.price || data.unitPrice || 0,
            wholesalePrice: item.wholesalePrice || data.wholesalePrice || 0,
            status: item.status || 'in_stock',
            qrData: item.qrData || '',
            createdAt: item.createdAt || data.generatedAt || new Date().toISOString(),
            syncedToRouter: Boolean(item.syncedToRouter)
          })) as Card[];
        }
      }
    } catch (docErr) {
      console.warn('Tenant batch doc cards check note:', docErr);
    }

    // 2. Query tenant cards subcollection by batchId
    try {
      const colRef = collection(db, 'tenants', tenantId, 'cards');
      let q = query(colRef, where('batchId', '==', batchId));
      let snap = await getDocs(q);

      if (snap.empty && batchNumber) {
        q = query(colRef, where('batchNumber', '==', batchNumber));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const cards: Card[] = [];
        snap.forEach((d) => cards.push(d.data() as Card));
        return cards;
      }
    } catch (queryErr) {
      console.warn('Tenant cards query note:', queryErr);
    }

    return [];
  } catch (error) {
    console.warn('fetchCardsForBatch error caught safely:', error);
    return [];
  }
}

export async function deleteBatchAndCards(
  tenantId: string, 
  batchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    // 1. Delete batch doc from tenant subcollection and root collection
    const batchRef = doc(db, 'tenants', tenantId, 'batches', batchId);
    await deleteDoc(batchRef);
    try {
      await deleteDoc(doc(db, 'batches', batchId));
    } catch {}

    // 2. Find associated cards
    const cardsCol = collection(db, 'tenants', tenantId, 'cards');
    const snap = await getDocs(cardsCol);
    const writeChunk = writeBatch(db);
    let count = 0;
    
    snap.forEach((d) => {
      const card = d.data() as Card;
      if (card.batchId === batchId) {
        writeChunk.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await writeChunk.commit();
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Firestore deleteBatch note:', error?.message || error);
    return { success: false, error: error?.message || 'فشل حذف الدفعة' };
  }
}

export async function updateBatchQuantityAndCards(
  tenantId: string,
  batchId: string,
  newQuantity: number,
  cardsToKeep: Card[],
  cardIdsToDelete: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    const nowIso = new Date().toISOString();

    // 1. Fetch current batch document to preserve settings
    const batchRef = doc(db, 'tenants', tenantId, 'batches', batchId);
    const snap = await getDoc(batchRef);
    let existingData: any = {};
    if (snap.exists()) {
      existingData = snap.data();
    }

    const unitPrice = existingData.unitPrice || 0;
    const wholesalePrice = existingData.wholesalePrice || 0;
    const inStockCount = cardsToKeep.filter(c => c.status === 'in_stock').length;
    const distributedCount = cardsToKeep.filter(c => c.status === 'distributed').length;
    const usedCount = cardsToKeep.filter(c => c.status === 'used').length;

    const formattedCards = cardsToKeep.map(c => ({
      id: c.id,
      username: c.code || c.id,
      password: c.password || c.code || '',
      profile: c.profileName || existingData.profileName || 'default',
      limitBytesTotal: formatByteLimit(c.byteLimit || c.byteDisplay),
      limitUptime: formatUptimeLimit(c.uptimeLimit || c.uptimeDisplay),
      comment: sanitizeRouterOSComment(`NetFlow_${existingData.batchNumber || 'Batch'}_${c.price || 0}`),
      code: c.code,
      price: c.price || unitPrice,
      wholesalePrice: c.wholesalePrice || wholesalePrice,
      uptimeDisplay: c.uptimeDisplay,
      byteDisplay: c.byteDisplay,
      status: c.status || 'in_stock',
      qrData: c.qrData || ''
    }));

    const updatePayload = {
      ...existingData,
      quantity: newQuantity,
      totalCards: newQuantity,
      inStockCount,
      distributedCount,
      usedCount,
      totalRetailValue: newQuantity * unitPrice,
      totalWholesaleValue: newQuantity * wholesalePrice,
      cards: formattedCards,
      updatedAt: nowIso
    };

    await setDoc(batchRef, sanitizeForFirestore(updatePayload), { merge: true });
    try {
      await setDoc(doc(db, 'batches', batchId), sanitizeForFirestore(updatePayload), { merge: true });
    } catch {}

    // 2. Delete unwanted card documents in chunks
    if (cardIdsToDelete && cardIdsToDelete.length > 0) {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < cardIdsToDelete.length; i += CHUNK_SIZE) {
        const chunk = cardIdsToDelete.slice(i, i + CHUNK_SIZE);
        const writeChunk = writeBatch(db);
        for (const cId of chunk) {
          const cardDocRef = doc(db, 'tenants', tenantId, 'cards', cId);
          writeChunk.delete(cardDocRef);
        }
        await writeChunk.commit();
      }
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Firestore updateBatchQuantity error:', error?.message || error);
    return { success: false, error: error?.message || 'فشل تحديث كمية الدفعة' };
  }
}

// ==========================================
// 4. Invoices & Transactional Distribution
// ==========================================

export async function saveInvoice(
  tenantId: string,
  invoice: Invoice,
  updatedCards: Card[],
  updatedAgent: Agent
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();

    const invoiceRef = doc(db, 'tenants', tenantId, 'invoices', invoice.id);
    const agentRef = doc(db, 'tenants', tenantId, 'agents', updatedAgent.id);

    // Perform atomic transaction or multi-doc batch write
    const write = writeBatch(db);

    // 1. Save invoice
    write.set(invoiceRef, sanitizeForFirestore(invoice));

    // 2. Update agent debt and purchases
    write.set(agentRef, sanitizeForFirestore(updatedAgent), { merge: true });

    // 3. Update allocated cards to distributed status
    for (const card of updatedCards) {
      const cardRef = doc(db, 'tenants', tenantId, 'cards', card.id);
      write.set(cardRef, sanitizeForFirestore({
        status: card.status,
        assignedToAgentId: card.assignedToAgentId,
        assignedToAgentName: card.assignedToAgentName,
        assignedInvoiceId: card.assignedInvoiceId,
        distributedAt: card.distributedAt || new Date().toISOString()
      }), { merge: true });
    }

    await write.commit();
    return { success: true };
  } catch (error: any) {
    console.warn('Firestore saveInvoice note:', error?.message || error);
    return { success: false, error: error?.message || 'فشل حفظ سند التسليم وتحديث بطاقات المحل' };
  }
}

export async function fetchInvoices(tenantId: string): Promise<Invoice[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'invoices');
    const q = query(colRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const invoices: Invoice[] = [];
    snap.forEach((d) => invoices.push(d.data() as Invoice));
    return invoices;
  } catch (error) {
    console.warn('Firestore fetchInvoices warning:', error);
    return [];
  }
}

export function subscribeInvoices(
  tenantId: string,
  onData: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'invoices');
  const q = query(colRef, orderBy('date', 'desc'));
  return onSnapshot(
    q, 
    (snap) => {
      const invoices: Invoice[] = [];
      snap.forEach((d) => invoices.push(d.data() as Invoice));
      onData(invoices);
    },
    (err) => {
      console.warn('subscribeInvoices listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

// ==========================================
// 5. Agents / POS Points
// ==========================================

export async function fetchAgents(tenantId: string): Promise<Agent[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'agents');
    const snap = await getDocs(colRef);
    const agents: Agent[] = [];
    snap.forEach((d) => agents.push(d.data() as Agent));
    return agents;
  } catch (error) {
    console.warn('Firestore fetchAgents warning:', error);
    return [];
  }
}

export function subscribeAgents(
  tenantId: string,
  onData: (agents: Agent[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'agents');
  return onSnapshot(
    colRef, 
    (snap) => {
      const agents: Agent[] = [];
      snap.forEach((d) => agents.push(d.data() as Agent));
      onData(agents);
    },
    (err) => {
      console.warn('subscribeAgents listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function saveAgent(tenantId: string, agent: Agent): Promise<boolean> {
  try {
    await ensureAuth();
    const agentRef = doc(db, 'tenants', tenantId, 'agents', agent.id);
    await setDoc(agentRef, sanitizeForFirestore(agent), { merge: true });
    return true;
  } catch (error: any) {
    console.warn('Firestore saveAgent note:', error?.message || error);
    return false;
  }
}

// ==========================================
// 6. Payments & Financial Transactions
// ==========================================

export async function savePaymentTransaction(
  tenantId: string,
  payment: PaymentTransaction,
  updatedAgent: Agent
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();

    const paymentRef = doc(db, 'tenants', tenantId, 'payments', payment.id);
    const agentRef = doc(db, 'tenants', tenantId, 'agents', updatedAgent.id);

    const write = writeBatch(db);
    write.set(paymentRef, sanitizeForFirestore(payment));
    write.set(agentRef, sanitizeForFirestore(updatedAgent), { merge: true });

    await write.commit();
    return { success: true };
  } catch (error: any) {
    console.warn('Firestore savePaymentTransaction note:', error?.message || error);
    return { success: false, error: error?.message || 'فشل حفظ سند القبض المالي' };
  }
}

export async function fetchPayments(tenantId: string): Promise<PaymentTransaction[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, 'tenants', tenantId, 'payments');
    const q = query(colRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const payments: PaymentTransaction[] = [];
    snap.forEach((d) => payments.push(d.data() as PaymentTransaction));
    return payments;
  } catch (error) {
    console.warn('Firestore fetchPayments warning:', error);
    return [];
  }
}

export function subscribePayments(
  tenantId: string,
  onData: (payments: PaymentTransaction[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'tenants', tenantId, 'payments');
  const q = query(colRef, orderBy('date', 'desc'));
  return onSnapshot(
    q, 
    (snap) => {
      const payments: PaymentTransaction[] = [];
      snap.forEach((d) => payments.push(d.data() as PaymentTransaction));
      onData(payments);
    },
    (err) => {
      console.warn('subscribePayments listener error:', err);
      onError?.(err);
    }
  );
}

// ==========================================
// 7. Card Templates
// ==========================================

export async function saveTemplateToFirestore(
  tenantId: string,
  template: CardTemplate
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    await ensureAuth();
    const templateDocRef = doc(db, 'tenants', tenantId || 'tenant_main_01', 'templates', template.id);
    
    const cleanData = sanitizeForFirestore({
      ...template,
      updatedAt: new Date().toISOString()
    });

    await setDoc(templateDocRef, cleanData, { merge: true });
    return { success: true, id: template.id };
  } catch (error: any) {
    console.error('Firestore save template error:', error);
    return { success: false, id: template.id, error: error?.message || 'فشل حفظ القالب في قاعدة البيانات' };
  }
}

export async function loadTemplatesFromFirestore(
  tenantId: string
): Promise<CardTemplate[]> {
  try {
    await ensureAuth();
    const templatesColRef = collection(db, 'tenants', tenantId || 'tenant_main_01', 'templates');
    const q = query(templatesColRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    const templates: CardTemplate[] = [];
    snap.forEach((docSnap) => {
      templates.push(docSnap.data() as CardTemplate);
    });

    return templates;
  } catch (error: any) {
    console.warn('Firestore load templates warning:', error?.message);
    return [];
  }
}

export function subscribeTemplates(
  tenantId: string,
  onData: (templates: CardTemplate[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const templatesColRef = collection(db, 'tenants', tenantId || 'tenant_main_01', 'templates');
  const q = query(templatesColRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const templates: CardTemplate[] = [];
      snap.forEach((docSnap) => {
        templates.push(docSnap.data() as CardTemplate);
      });
      onData(templates);
    },
    (err) => {
      console.warn('subscribeTemplates listener note:', err?.message || err);
      onError?.(err);
    }
  );
}

export async function deleteTemplateFromFirestore(
  tenantId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    const templateDocRef = doc(db, 'tenants', tenantId || 'tenant_main_01', 'templates', templateId);
    await deleteDoc(templateDocRef);
    return { success: true };
  } catch (error: any) {
    console.error('Firestore delete template error:', error);
    return { success: false, error: error?.message || 'فشل حذف القالب' };
  }
}

// ==========================================
// 8. Seed Initial Data / Cloud Sync Initializer
// ==========================================

export async function seedInitialDataIfEmpty(
  tenantId: string,
  initialData: AppState
): Promise<boolean> {
  try {
    await ensureAuth();
    const tenantDoc = await fetchTenant(tenantId);
    
    // If tenant doesn't exist in Firestore yet, seed full initial data
    if (!tenantDoc) {
      console.log(`Seeding initial Firestore multi-tenant collections for ${tenantId}...`);
      
      // Save Tenant
      await saveTenant(tenantId, initialData.tenant);
      
      // Save Profiles
      await saveProfiles(tenantId, initialData.profiles);
      
      // Save Agents
      const batch = writeBatch(db);
      for (const agent of initialData.agents) {
        const agentRef = doc(db, 'tenants', tenantId, 'agents', agent.id);
        batch.set(agentRef, sanitizeForFirestore(agent));
      }
      await batch.commit();

      // Save Initial Batches and Cards
      for (const b of initialData.batches) {
        const relatedCards = initialData.cards.filter(c => c.batchId === b.id);
        await saveBatchAndCards(tenantId, b, relatedCards);
      }

      // Save Invoices & Payments
      const finBatch = writeBatch(db);
      for (const inv of initialData.invoices) {
        const invRef = doc(db, 'tenants', tenantId, 'invoices', inv.id);
        finBatch.set(invRef, sanitizeForFirestore(inv));
      }
      for (const pay of initialData.payments) {
        const payRef = doc(db, 'tenants', tenantId, 'payments', pay.id);
        finBatch.set(payRef, sanitizeForFirestore(pay));
      }
      await finBatch.commit();

      console.log('Initial Firestore seed completed successfully.');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Firestore initial seeding note:', error);
    return false;
  }
}

// ==========================================
// 9. Super Admin Services & Multi-Tenant Directory
// ==========================================

export const DEMO_SUPER_ADMIN_TENANTS: Tenant[] = [
  {
    id: 'tenant_main_01',
    businessName: 'شبكة سام تك للإنترنت والواي فاي',
    tagline: 'منظومة سام تك لإدارة وتوزيع كروت الشبكات - خدمة 24/7',
    phone: '777123456',
    currency: 'YER',
    ownerUid: 'user_owner_01',
    ownerName: 'المهندس مصطفى حسن',
    ownerEmail: 'mosthassan.ye@gmail.com',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      planNameArabic: 'الباقة اللامحدودة (Enterprise)',
      status: 'active',
      maxCards: 50000,
      maxDistributors: 50,
      expiresAt: '2027-01-01T00:00:00Z',
      billingPeriod: 'lifetime',
      pricePaid: 250
    },
    settings: {
      routerIp: '10.0.0.1',
      loginDomain: 'wifi.samtech.net',
      autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
      apiHost: '192.168.88.1',
      apiPort: 8728,
      apiUser: 'admin_samtech',
      hotspotServerName: 'hotspot1',
      syncToken: 'sam_sec_89df24a67e12c4'
    },
    createdAt: '2026-01-10T10:00:00Z',
    totalCardsCount: 1420,
    activeDistributorsCount: 4,
    totalRevenueGenerated: 850000
  },
  {
    id: 'tenant_aden_02',
    businessName: 'شبكة النور اللاسلكية - عدن',
    tagline: 'تغطية واسعة وسرعات فائقة في كريتر والمعلا',
    phone: '733445566',
    currency: 'YER',
    ownerUid: 'user_aden_owner',
    ownerName: 'عوض بن سالمين',
    ownerEmail: 'salmeen.aden@gmail.com',
    status: 'active',
    subscription: {
      plan: 'pro',
      planNameArabic: 'باقة المحترفين (Pro)',
      status: 'active',
      maxCards: 10000,
      maxDistributors: 15,
      expiresAt: '2026-10-15T00:00:00Z',
      billingPeriod: 'yearly',
      pricePaid: 120
    },
    settings: {
      routerIp: '10.10.10.1',
      loginDomain: 'aden.net',
      autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
      apiHost: '192.168.1.1',
      apiPort: 8728,
      syncToken: 'aden_sec_token_993'
    },
    createdAt: '2026-02-01T12:00:00Z',
    totalCardsCount: 3200,
    activeDistributorsCount: 6,
    totalRevenueGenerated: 1650000
  },
  {
    id: 'tenant_taiz_03',
    businessName: 'شبكة الأفق الرقمية - تعز',
    tagline: 'إنترنت فائق السرعة عبر الألياف الضوئية',
    phone: '711224488',
    currency: 'YER',
    ownerUid: 'user_taiz_owner',
    ownerName: 'طارق المخلافي',
    ownerEmail: 'tariq.taiz@gmail.com',
    status: 'active',
    subscription: {
      plan: 'starter',
      planNameArabic: 'باقة المبتدئين (Starter)',
      status: 'active',
      maxCards: 3000,
      maxDistributors: 5,
      expiresAt: '2026-05-20T00:00:00Z',
      billingPeriod: 'monthly',
      pricePaid: 15
    },
    settings: {
      routerIp: '10.5.5.1',
      loginDomain: 'taiz.wifi',
      autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
      syncToken: 'taiz_sec_token_552'
    },
    createdAt: '2026-02-15T09:30:00Z',
    totalCardsCount: 850,
    activeDistributorsCount: 2,
    totalRevenueGenerated: 425000
  },
  {
    id: 'tenant_mukalla_04',
    businessName: 'شبكة ساحل حضرموت - المكلا',
    tagline: 'خدمات الإنترنت اللاسلكي السريع',
    phone: '778899001',
    currency: 'SAR',
    ownerUid: 'user_mukalla_owner',
    ownerName: 'عبدالله باوزير',
    ownerEmail: 'bawazir.mukalla@gmail.com',
    status: 'suspended',
    subscription: {
      plan: 'pro',
      planNameArabic: 'باقة المحترفين (Pro)',
      status: 'suspended',
      maxCards: 10000,
      maxDistributors: 15,
      expiresAt: '2026-03-01T00:00:00Z',
      billingPeriod: 'monthly',
      pricePaid: 20
    },
    settings: {
      routerIp: '172.16.0.1',
      loginDomain: 'mukalla.net',
      autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
      syncToken: 'mukalla_sec_token_112'
    },
    createdAt: '2026-01-20T14:00:00Z',
    totalCardsCount: 1950,
    activeDistributorsCount: 3,
    totalRevenueGenerated: 5800
  }
];

export async function fetchAllTenants(): Promise<Tenant[]> {
  try {
    await ensureAuth();
    const tenantsCol = collection(db, 'tenants');
    const snap = await getDocs(tenantsCol);
    if (!snap.empty) {
      const list: Tenant[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.businessName) {
          list.push({ ...data, id: docSnap.id } as Tenant);
        }
      });
      // Merge with demo tenants to ensure rich directory view
      const existingIds = new Set(list.map(t => t.id));
      for (const dt of DEMO_SUPER_ADMIN_TENANTS) {
        if (!existingIds.has(dt.id)) {
          list.push(dt);
        }
      }
      return list;
    }
    return DEMO_SUPER_ADMIN_TENANTS;
  } catch (error) {
    console.warn('Super Admin fetch tenants error fallback:', error);
    return DEMO_SUPER_ADMIN_TENANTS;
  }
}

export async function updateTenantSubscription(
  tenantId: string,
  subscription: TenantSubscription
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { subscription, status: subscription.status }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return { success: false, error: error?.message || 'فشل تحديث بيانات الاشتراك' };
  }
}

export async function updateTenantStatus(
  tenantId: string,
  status: 'active' | 'suspended'
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { status }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Update tenant status error:', error);
    return { success: false, error: error?.message || 'فشل تحديث حالة الشبكة' };
  }
}

// Purge Mock / Demo Data for Clean Slate Onboarding
export async function purgeTenantDemoData(tenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuth();
    const safeTenantId = tenantId || 'tenant_main_01';

    // 1. Delete all cards
    const cardsCol = collection(db, 'tenants', safeTenantId, 'cards');
    const cardsSnap = await getDocs(cardsCol);
    const cardBatches = [];
    let currentBatch = writeBatch(db);
    let count = 0;
    
    cardsSnap.forEach(cDoc => {
      currentBatch.delete(cDoc.ref);
      count++;
      if (count % 450 === 0) {
        cardBatches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
      }
    });
    if (count % 450 !== 0) {
      cardBatches.push(currentBatch.commit());
    }
    await Promise.all(cardBatches);

    // 2. Delete all batches
    const batchesCol = collection(db, 'tenants', safeTenantId, 'batches');
    const batchesSnap = await getDocs(batchesCol);
    const batchOps = writeBatch(db);
    batchesSnap.forEach(bDoc => batchOps.delete(bDoc.ref));
    await batchOps.commit();

    // 3. Delete all invoices
    const invCol = collection(db, 'tenants', safeTenantId, 'invoices');
    const invSnap = await getDocs(invCol);
    const invBatch = writeBatch(db);
    invSnap.forEach(iDoc => invBatch.delete(iDoc.ref));
    await invBatch.commit();

    // 4. Delete all payments
    const payCol = collection(db, 'tenants', safeTenantId, 'payments');
    const paySnap = await getDocs(payCol);
    const payBatch = writeBatch(db);
    paySnap.forEach(pDoc => payBatch.delete(pDoc.ref));
    await payBatch.commit();

    // 5. Delete sample agents (keep custom team or leave empty)
    const agentCol = collection(db, 'tenants', safeTenantId, 'agents');
    const agentSnap = await getDocs(agentCol);
    const agentBatch = writeBatch(db);
    agentSnap.forEach(aDoc => agentBatch.delete(aDoc.ref));
    await agentBatch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Purge tenant demo data error:', error);
    return { success: false, error: error?.message || 'فشل مسح البيانات السحابية' };
  }
}

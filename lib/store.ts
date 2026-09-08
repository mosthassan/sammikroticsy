'use client';

import {
  Tenant,
  Profile,
  CardBatch,
  Card,
  Agent,
  Invoice,
  PaymentTransaction,
  CardTemplate,
  RouterSyncStatus,
  UserProfile,
  TeamMember,
  AppState
} from '@/types';

export type { AppState };
import { DEFAULT_TEMPLATES } from './templates';
import {
  ensureAuth,
  fetchTenant,
  subscribeTenant,
  saveTenant,
  fetchProfiles,
  subscribeProfiles,
  saveProfiles,
  fetchBatches,
  subscribeBatches,
  fetchCards,
  subscribeCards,
  fetchAgents,
  subscribeAgents,
  fetchInvoices,
  subscribeInvoices,
  fetchPayments,
  subscribePayments,
  fetchTeamMembers,
  subscribeTeamMembers,
  fetchUserProfile,
  loadTemplatesFromFirestore,
  subscribeTemplates,
  seedInitialDataIfEmpty,
  DEFAULT_ADMIN_EMAIL
} from './firestore-service';

const STORAGE_KEY = 'netflow_saas_data_v3';

const INITIAL_CURRENT_USER: UserProfile = {
  uid: 'user_owner_01',
  email: DEFAULT_ADMIN_EMAIL,
  name: 'المهندس مصطفى حسن (Super Admin)',
  role: 'super_admin',
  tenantId: 'tenant_main_01',
  phone: '777123456',
  active: true,
  createdAt: '2026-01-10T10:00:00Z',
  lastLoginAt: '2026-03-08T18:00:00Z'
};

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team_01',
    uid: 'user_dist_01',
    tenantId: 'tenant_main_01',
    name: 'أحمد نبيل (موزع القطاع الغربي)',
    email: 'ahmed.distributor@samtech.net',
    phone: '771122334',
    role: 'distributor',
    pinCode: '1234',
    active: true,
    totalInvoicesCreated: 12,
    totalPaymentsCollected: 145000,
    createdAt: '2026-02-01T08:00:00Z',
    lastActiveAt: '2026-03-08T16:30:00Z'
  },
  {
    id: 'team_02',
    uid: 'user_dist_02',
    tenantId: 'tenant_main_01',
    name: 'سالم الكندي (موزع نقاط الجامعة)',
    email: 'salem.distributor@samtech.net',
    phone: '772233445',
    role: 'distributor',
    pinCode: '5678',
    active: true,
    totalInvoicesCreated: 8,
    totalPaymentsCollected: 92000,
    createdAt: '2026-02-15T09:00:00Z',
    lastActiveAt: '2026-03-07T14:15:00Z'
  }
];

const INITIAL_TENANT: Tenant = {
  id: 'tenant_main_01',
  businessName: 'شبكة سام تك للإنترنت والواي فاي',
  tagline: 'منظومة سام تك لإدارة وتوزيع كروت الشبكات - خدمة 24/7',
  phone: '777123456',
  currency: 'YER',
  ownerUid: 'user_owner_01',
  ownerName: 'المهندس مصطفى حسن',
  settings: {
    routerIp: '10.0.0.1',
    loginDomain: 'wifi.samtech.net',
    autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
    apiHost: '192.168.88.1',
    apiPort: 8728,
    apiUser: 'admin_samtech',
    apiPassword: '',
    hotspotServerName: 'hotspot1',
    syncToken: 'sam_sec_89df24a67e12c4'
  },
  createdAt: '2026-01-10T10:00:00Z'
};

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'prof_500',
    tenantId: 'tenant_main_01',
    name: 'باقة 500 ريال (1 جيجا - 12 ساعة)',
    rateLimit: 'عامة (اختيار المشترك)',
    uptimeLimit: '12h',
    uptimeDisplay: '12 ساعة',
    byteLimit: '1073741824',
    byteDisplay: '1 جيجابايت',
    price: 500,
    wholesalePrice: 420,
    validityDays: 3,
    badgeColor: '#3b82f6',
    active: true
  },
  {
    id: 'prof_1000',
    tenantId: 'tenant_main_01',
    name: 'باقة 1000 ريال (2.5 جيجا - 24 ساعة)',
    rateLimit: 'عامة (اختيار المشترك)',
    uptimeLimit: '1d',
    uptimeDisplay: '24 ساعة',
    byteLimit: '2684354560',
    byteDisplay: '2.5 جيجابايت',
    price: 1000,
    wholesalePrice: 850,
    validityDays: 7,
    badgeColor: '#10b981',
    active: true
  },
  {
    id: 'prof_2000',
    tenantId: 'tenant_main_01',
    name: 'باقة 2000 ريال (6 جيجا - 3 أيام)',
    rateLimit: 'عامة (اختيار المشترك)',
    uptimeLimit: '3d',
    uptimeDisplay: '3 أيام',
    byteLimit: '6442450944',
    byteDisplay: '6 جيجابايت',
    price: 2000,
    wholesalePrice: 1700,
    validityDays: 15,
    badgeColor: '#8b5cf6',
    active: true
  },
  {
    id: 'prof_weekly',
    tenantId: 'tenant_main_01',
    name: 'الباقة الأسبوعية المفتوحة (15 جيجا - 7 أيام)',
    rateLimit: 'عامة (اختيار المشترك)',
    uptimeLimit: '7d',
    uptimeDisplay: '7 أيام',
    byteLimit: '16106127360',
    byteDisplay: '15 جيجابايت',
    price: 4500,
    wholesalePrice: 3900,
    validityDays: 30,
    badgeColor: '#f59e0b',
    active: true
  }
];

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_01',
    tenantId: 'tenant_main_01',
    storeName: 'سوبرماركت الأمانة والبركة',
    ownerName: 'أبو عبدالله السالمي',
    phone: '771234990',
    location: 'الشارع العام - بجوار مدرسة الأوائل',
    totalPurchases: 185000,
    totalPaid: 150000,
    currentDebt: 35000,
    discountPercentage: 0,
    status: 'active',
    notes: 'نقطة بيع نشطة جداً وسداد أسبوعي منتظم',
    createdAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'agent_02',
    tenantId: 'tenant_main_01',
    storeName: 'بقالة الوفاء الحديثة',
    ownerName: 'محمد أحمد قاسم',
    phone: '773456789',
    location: 'حي الجامعة - بجانب المستشفى العام',
    totalPurchases: 94000,
    totalPaid: 94000,
    currentDebt: 0,
    discountPercentage: 0,
    status: 'active',
    notes: 'حساب مسدد بالكامل',
    createdAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 'agent_03',
    tenantId: 'tenant_main_01',
    storeName: 'كشك النصر للخدمات الإلكترونية',
    ownerName: 'صادق يحيى',
    phone: '778901234',
    location: 'موقف الفرزة المركزي',
    totalPurchases: 68000,
    totalPaid: 45000,
    currentDebt: 23000,
    discountPercentage: 2,
    status: 'active',
    notes: 'سحب كروت فئة 500 و 1000 بكثرة',
    createdAt: '2026-02-15T14:30:00Z'
  },
  {
    id: 'agent_04',
    tenantId: 'tenant_main_01',
    storeName: 'تموينات الأمل السريعة',
    ownerName: 'ماجد العباسي',
    phone: '770112233',
    location: 'حارة السلام - أمام المسجد الكبير',
    totalPurchases: 42500,
    totalPaid: 20000,
    currentDebt: 22500,
    discountPercentage: 0,
    status: 'active',
    notes: 'عميل جديد',
    createdAt: '2026-03-01T09:00:00Z'
  }
];

import { CodeCharSet } from '@/types';

export function generateVoucherCode(
  length: number = 6, 
  prefix: string = '', 
  charSet: CodeCharSet = 'digits_only'
): string {
  let chars = '0123456789';
  if (charSet === 'alphanumeric_upper') {
    chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  } else if (charSet === 'alphanumeric_lower') {
    chars = '23456789abcdefghijkmnopqrstuvwxyz';
  } else if (charSet === 'alphanumeric_mixed') {
    chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}${result}` : result;
}

export function generatePinCode(length: number = 4): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export function createInitialData(): AppState {
  const cards: Card[] = [];
  const batches: CardBatch[] = [];

  // Seed Batch 1: 500 YER (50 cards)
  const prof500 = INITIAL_PROFILES[0];
  const batch1Cards: Card[] = [];
  for (let i = 1; i <= 50; i++) {
    const code = `NW5-${582100 + i * 17}`;
    const pin = `${1000 + (i * 37) % 9000}`;
    const qr = `http://${INITIAL_TENANT.settings.loginDomain}/login?username=${code}&password=${code}`;
    
    // Some distributed to agent_01
    const isDistributed = i <= 30;
    const isUsed = i <= 10;
    
    const card: Card = {
      id: `card_b1_${i}`,
      tenantId: 'tenant_main_01',
      batchId: 'batch_101',
      batchNumber: 'B-101',
      code,
      password: code,
      profileId: prof500.id,
      profileName: prof500.name,
      rateLimit: prof500.rateLimit,
      uptimeDisplay: prof500.uptimeDisplay,
      byteDisplay: prof500.byteDisplay,
      price: prof500.price,
      wholesalePrice: prof500.wholesalePrice,
      status: isUsed ? 'used' : isDistributed ? 'distributed' : 'in_stock',
      assignedToAgentId: isDistributed ? 'agent_01' : undefined,
      assignedToAgentName: isDistributed ? 'سوبرماركت الأمانة والبركة' : undefined,
      assignedInvoiceId: isDistributed ? 'inv_001' : undefined,
      qrData: qr,
      createdAt: '2026-03-01T10:00:00Z',
      distributedAt: isDistributed ? '2026-03-02T11:00:00Z' : undefined,
      usedAt: isUsed ? '2026-03-03T15:20:00Z' : undefined,
      syncedToRouter: true
    };
    batch1Cards.push(card);
    cards.push(card);
  }

  batches.push({
    id: 'batch_101',
    tenantId: 'tenant_main_01',
    batchNumber: 'B-101',
    profileId: prof500.id,
    profileName: prof500.name,
    quantity: 50,
    prefix: 'NW5-',
    codeLength: 6,
    passwordType: 'same_as_username',
    totalCards: 50,
    inStockCount: 20,
    distributedCount: 20,
    usedCount: 10,
    unitPrice: 500,
    wholesalePrice: 420,
    totalRetailValue: 25000,
    totalWholesaleValue: 21000,
    templateId: 'tpl_modern_dark',
    generatedAt: '2026-03-01T10:00:00Z',
    status: 'active'
  });

  // Seed Batch 2: 1000 YER (40 cards)
  const prof1000 = INITIAL_PROFILES[1];
  for (let i = 1; i <= 40; i++) {
    const code = `NW1-${691200 + i * 23}`;
    const qr = `http://${INITIAL_TENANT.settings.loginDomain}/login?username=${code}&password=${code}`;
    const isDistributed = i <= 20;
    
    const card: Card = {
      id: `card_b2_${i}`,
      tenantId: 'tenant_main_01',
      batchId: 'batch_102',
      batchNumber: 'B-102',
      code,
      password: code,
      profileId: prof1000.id,
      profileName: prof1000.name,
      rateLimit: prof1000.rateLimit,
      uptimeDisplay: prof1000.uptimeDisplay,
      byteDisplay: prof1000.byteDisplay,
      price: prof1000.price,
      wholesalePrice: prof1000.wholesalePrice,
      status: isDistributed ? 'distributed' : 'in_stock',
      assignedToAgentId: isDistributed ? 'agent_03' : undefined,
      assignedToAgentName: isDistributed ? 'كشك النصر للخدمات الإلكترونية' : undefined,
      assignedInvoiceId: isDistributed ? 'inv_002' : undefined,
      qrData: qr,
      createdAt: '2026-03-05T09:00:00Z',
      distributedAt: isDistributed ? '2026-03-06T10:00:00Z' : undefined,
      syncedToRouter: true
    };
    cards.push(card);
  }

  batches.push({
    id: 'batch_102',
    tenantId: 'tenant_main_01',
    batchNumber: 'B-102',
    profileId: prof1000.id,
    profileName: prof1000.name,
    quantity: 40,
    prefix: 'NW1-',
    codeLength: 6,
    passwordType: 'same_as_username',
    totalCards: 40,
    inStockCount: 20,
    distributedCount: 20,
    usedCount: 0,
    unitPrice: 1000,
    wholesalePrice: 850,
    totalRetailValue: 40000,
    totalWholesaleValue: 34000,
    templateId: 'tpl_emerald_pro',
    generatedAt: '2026-03-05T09:00:00Z',
    status: 'active'
  });

  // Seed Invoices
  const invoices: Invoice[] = [
    {
      id: 'inv_001',
      tenantId: 'tenant_main_01',
      invoiceNumber: 'INV-2026-001',
      agentId: 'agent_01',
      agentName: 'سوبرماركت الأمانة والبركة',
      agentPhone: '771234990',
      items: [
        {
          profileId: prof500.id,
          profileName: prof500.name,
          qty: 30,
          retailPrice: 500,
          wholesalePrice: 420,
          subtotalWholesale: 12600,
          subtotalRetail: 15000
        }
      ],
      totalRetail: 15000,
      totalWholesale: 12600,
      paidAmount: 5000,
      remainingDebt: 7600,
      paymentType: 'partial',
      date: '2026-03-02T11:00:00Z',
      notes: 'تم تسليم كروت فئة 500 ريال مع دفع دفعة مقدمة',
      batchIds: ['batch_101']
    },
    {
      id: 'inv_002',
      tenantId: 'tenant_main_01',
      invoiceNumber: 'INV-2026-002',
      agentId: 'agent_03',
      agentName: 'كشك النصر للخدمات الإلكترونية',
      agentPhone: '778901234',
      items: [
        {
          profileId: prof1000.id,
          profileName: prof1000.name,
          qty: 20,
          retailPrice: 1000,
          wholesalePrice: 850,
          subtotalWholesale: 17000,
          subtotalRetail: 20000
        }
      ],
      totalRetail: 20000,
      totalWholesale: 17000,
      paidAmount: 0,
      remainingDebt: 17000,
      paymentType: 'credit',
      date: '2026-03-06T10:00:00Z',
      notes: 'تسليم آجل حتى نهاية الأسبوع',
      batchIds: ['batch_102']
    }
  ];

  const payments: PaymentTransaction[] = [
    {
      id: 'pay_001',
      tenantId: 'tenant_main_01',
      receiptNumber: 'REC-2026-001',
      agentId: 'agent_01',
      agentName: 'سوبرماركت الأمانة والبركة',
      amount: 50000,
      previousBalance: 85000,
      newBalance: 35000,
      paymentMethod: 'cash',
      date: '2026-03-07T16:00:00Z',
      notes: 'سداد نقدي من حساب الكروت السابقة'
    },
    {
      id: 'pay_002',
      tenantId: 'tenant_main_01',
      receiptNumber: 'REC-2026-002',
      agentId: 'agent_02',
      agentName: 'بقالة الوفاء الحديثة',
      amount: 40000,
      previousBalance: 40000,
      newBalance: 0,
      paymentMethod: 'e_wallet',
      referenceNumber: 'KW-9988231',
      date: '2026-03-08T18:30:00Z',
      notes: 'تحويل عبر محفظة كاش/جوالي تسوية كاملة'
    }
  ];

  return {
    tenant: INITIAL_TENANT,
    profiles: INITIAL_PROFILES,
    batches,
    cards,
    agents: INITIAL_AGENTS,
    invoices,
    payments,
    team: INITIAL_TEAM,
    currentUserProfile: null,
    templates: DEFAULT_TEMPLATES,
    selectedTemplateId: 'tpl_modern_dark',
    syncStatus: {
      lastSyncTime: '2026-03-08T18:00:00Z',
      pendingSyncCount: 0,
      totalSyncedCount: 90,
      routerConnectionStatus: 'connected',
      lastLog: 'RouterOS API: successfully synchronized 90 hotspot users to server hotspot1'
    }
  };
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') {
    return createInitialData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    // ensure templates exist and merge default templates with user custom templates
    if (!parsed.templates || parsed.templates.length === 0) {
      parsed.templates = DEFAULT_TEMPLATES;
    } else {
      // Merge: preserve user's custom templates and make sure all default SVG templates are present
      const existingIds = new Set(parsed.templates.map((t: CardTemplate) => t.id));
      for (const defTpl of DEFAULT_TEMPLATES) {
        if (!existingIds.has(defTpl.id)) {
          parsed.templates.push(defTpl);
        } else {
          // Update default templates with latest SVG assets if missing
          const idx = parsed.templates.findIndex((t: CardTemplate) => t.id === defTpl.id);
          if (idx !== -1 && defTpl.svgCode && !parsed.templates[idx].svgCode) {
            parsed.templates[idx] = { ...parsed.templates[idx], ...defTpl };
          }
        }
      }
    }
    return parsed;
  } catch {
    return createInitialData();
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

let memoryState: AppState | null = null;
const storeListeners = new Set<() => void>();

function emitStoreChange() {
  for (const listener of storeListeners) {
    listener();
  }
}

let activeUnsubscribers: (() => void)[] = [];
let isSyncing = false;

export const appStore = {
  getSnapshot(): AppState {
    if (!memoryState) {
      memoryState = loadAppState();
    }
    return memoryState;
  },
  getServerSnapshot(): AppState {
    if (!memoryState) {
      memoryState = createInitialData();
    }
    return memoryState;
  },
  subscribe(listener: () => void) {
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  },
  update(updater: (prev: AppState) => AppState) {
    const current = appStore.getSnapshot();
    const next = updater(current);
    memoryState = next;
    saveAppState(next);
    emitStoreChange();
  },
  setCurrentUser(profile: UserProfile | null) {
    appStore.update(prev => ({
      ...prev,
      currentUserProfile: profile
    }));
  },
  logout() {
    appStore.update(prev => ({
      ...prev,
      currentUserProfile: null
    }));
  },
  reset() {
    const fresh = createInitialData();
    memoryState = fresh;
    saveAppState(fresh);
    emitStoreChange();
  },
  cleanTenantData() {
    const current = appStore.getSnapshot();
    const clean: AppState = {
      ...current,
      batches: [],
      cards: [],
      agents: [],
      invoices: [],
      payments: [],
      syncStatus: {
        lastSyncTime: new Date().toISOString(),
        pendingSyncCount: 0,
        totalSyncedCount: 0,
        routerConnectionStatus: 'connected',
        lastLog: 'تمت تهيئة قاعدة البيانات للإنتاج الفعلي وتصفير السجلات.'
      }
    };
    memoryState = clean;
    saveAppState(clean);
    emitStoreChange();
  },
  /**
   * Initializes real-time two-way Firestore synchronization with optimistic local fallback
   */
  async initFirestoreSync(tenantId: string = 'tenant_main_01'): Promise<() => void> {
    if (typeof window === 'undefined') {
      return () => {};
    }

    // Clear any previous listeners before switching/starting
    activeUnsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    activeUnsubscribers = [];

    try {
      // 1. Ensure user is authenticated for rules
      await ensureAuth();

      // 2. Fetch initial cloud data or seed if new database
      const currentSnap = appStore.getSnapshot();
      await seedInitialDataIfEmpty(tenantId, currentSnap);

      // 3. Fetch tenant, profiles, templates, and entities
      const [
        cloudTenant,
        cloudProfiles,
        cloudTemplates,
        cloudBatches,
        cloudCards,
        cloudAgents,
        cloudInvoices,
        cloudPayments,
        cloudTeam
      ] = await Promise.all([
        fetchTenant(tenantId),
        fetchProfiles(tenantId),
        loadTemplatesFromFirestore(tenantId),
        fetchBatches(tenantId),
        fetchCards(tenantId),
        fetchAgents(tenantId),
        fetchInvoices(tenantId),
        fetchPayments(tenantId),
        fetchTeamMembers(tenantId)
      ]);

      appStore.update(prev => ({
        ...prev,
        tenant: cloudTenant || prev.tenant,
        profiles: (cloudProfiles && cloudProfiles.length > 0) ? cloudProfiles : prev.profiles,
        templates: (cloudTemplates && cloudTemplates.length > 0)
          ? [...cloudTemplates, ...DEFAULT_TEMPLATES.filter(dt => !cloudTemplates.some(ct => ct.id === dt.id))]
          : prev.templates,
        batches: (cloudBatches && cloudBatches.length > 0) ? cloudBatches : (cloudBatches !== null ? cloudBatches : prev.batches),
        cards: (cloudCards && cloudCards.length > 0) ? cloudCards : (cloudCards !== null ? cloudCards : prev.cards),
        agents: (cloudAgents && cloudAgents.length > 0) ? cloudAgents : (cloudAgents !== null ? cloudAgents : prev.agents),
        invoices: (cloudInvoices && cloudInvoices.length > 0) ? cloudInvoices : (cloudInvoices !== null ? cloudInvoices : prev.invoices),
        payments: (cloudPayments && cloudPayments.length > 0) ? cloudPayments : (cloudPayments !== null ? cloudPayments : prev.payments),
        team: (cloudTeam && cloudTeam.length > 0) ? cloudTeam : (cloudTeam !== null ? cloudTeam : prev.team),
        isCloudConnected: true,
        isSyncingWithCloud: false
      }));

      // 4. Attach Real-time Listeners
      const unsubTenant = subscribeTenant(tenantId, (tenant) => {
        if (tenant) {
          appStore.update(prev => ({ ...prev, tenant }));
        }
      });

      const unsubProfiles = subscribeProfiles(tenantId, (profiles) => {
        if (profiles && profiles.length > 0) {
          appStore.update(prev => ({ ...prev, profiles }));
        }
      });

      const unsubTemplates = subscribeTemplates(tenantId, (templates) => {
        if (templates && templates.length > 0) {
          appStore.update(prev => ({
            ...prev,
            templates: [...templates, ...DEFAULT_TEMPLATES.filter(dt => !templates.some(ct => ct.id === dt.id))]
          }));
        }
      });

      const unsubBatches = subscribeBatches(tenantId, (batches) => {
        if (batches) {
          appStore.update(prev => ({ ...prev, batches }));
        }
      });

      const unsubCards = subscribeCards(tenantId, (cards) => {
        if (cards) {
          appStore.update(prev => ({ ...prev, cards }));
        }
      });

      const unsubAgents = subscribeAgents(tenantId, (agents) => {
        if (agents) {
          appStore.update(prev => ({ ...prev, agents }));
        }
      });

      const unsubInvoices = subscribeInvoices(tenantId, (invoices) => {
        if (invoices) {
          appStore.update(prev => ({ ...prev, invoices }));
        }
      });

      const unsubPayments = subscribePayments(tenantId, (payments) => {
        if (payments) {
          appStore.update(prev => ({ ...prev, payments }));
        }
      });

      const unsubTeam = subscribeTeamMembers(tenantId, (team) => {
        if (team) {
          appStore.update(prev => ({ ...prev, team }));
        }
      });

      activeUnsubscribers = [
        unsubTenant,
        unsubProfiles,
        unsubTemplates,
        unsubBatches,
        unsubCards,
        unsubAgents,
        unsubInvoices,
        unsubPayments,
        unsubTeam
      ];

      return () => {
        activeUnsubscribers.forEach(unsub => {
          try { unsub(); } catch { /* ignore */ }
        });
        activeUnsubscribers = [];
      };
    } catch (err) {
      console.warn('Firestore real-time sync note (working in offline resilient mode):', err);
      appStore.update(prev => ({ ...prev, isCloudConnected: false }));
      return () => {};
    }
  }
};

// Batch Generation Logic
export function generateBatchCards(
  params: {
    tenant: Tenant;
    profile: Profile;
    quantity: number;
    prefix: string;
    codeLength: number;
    codeCharSet?: CodeCharSet;
    passwordType: 'same_as_username' | 'separate_pin' | 'no_password';
    templateId: string;
  }
): { batch: CardBatch; cards: Card[] } {
  const batchNum = `B-${Math.floor(100 + Math.random() * 900)}`;
  const batchId = `batch_${Date.now()}`;
  const now = new Date().toISOString();

  const generatedCards: Card[] = [];

  for (let i = 1; i <= params.quantity; i++) {
    const code = generateVoucherCode(params.codeLength, params.prefix, params.codeCharSet || 'digits_only');
    let password = code;
    if (params.passwordType === 'separate_pin') {
      password = generatePinCode(4);
    } else if (params.passwordType === 'no_password') {
      password = '';
    }

    const domain = params.tenant.settings.loginDomain || params.tenant.settings.routerIp || '10.0.0.1';
    let qr = params.tenant.settings.autoLoginUrlPattern || 'http://{domain}/login?username={code}&password={password}';
    qr = qr.replace('{domain}', domain).replace('{code}', code).replace('{password}', password);

    const card: Card = {
      id: `card_${batchId}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenant.id,
      batchId,
      batchNumber: batchNum,
      code,
      password: password || undefined,
      profileId: params.profile.id,
      profileName: params.profile.name,
      rateLimit: params.profile.rateLimit,
      uptimeDisplay: params.profile.uptimeDisplay,
      byteDisplay: params.profile.byteDisplay,
      price: params.profile.price,
      wholesalePrice: params.profile.wholesalePrice,
      status: 'in_stock',
      qrData: qr,
      createdAt: now,
      syncedToRouter: false
    };
    generatedCards.push(card);
  }

  const batch: CardBatch = {
    id: batchId,
    tenantId: params.tenant.id,
    batchNumber: batchNum,
    profileId: params.profile.id,
    profileName: params.profile.name,
    quantity: params.quantity,
    prefix: params.prefix,
    codeLength: params.codeLength,
    codeCharSet: params.codeCharSet || 'digits_only',
    passwordType: params.passwordType,
    totalCards: params.quantity,
    inStockCount: params.quantity,
    distributedCount: 0,
    usedCount: 0,
    unitPrice: params.profile.price,
    wholesalePrice: params.profile.wholesalePrice,
    totalRetailValue: params.quantity * params.profile.price,
    totalWholesaleValue: params.quantity * params.profile.wholesalePrice,
    templateId: params.templateId,
    generatedAt: now,
    routerToken: params.tenant.settings?.syncToken || 'sam_sec_89df24a67e12c4',
    status: 'pending',
    synced: false
  };

  return { batch, cards: generatedCards };
}

// ==========================================================
// RouterOS Script Sanitization & Anti-Injection Defense
// ==========================================================
import {
  sanitizeRouterOSValue,
  sanitizeRouterOSIdentifier,
  sanitizeRouterOSComment,
  formatByteLimit,
  formatLimitBytes,
  formatUptimeLimit,
  resolveRouterOSProfile,
  generateRouterOSTerminalScript
} from './mikrotik-helpers';

export {
  sanitizeRouterOSValue,
  sanitizeRouterOSIdentifier,
  sanitizeRouterOSComment,
  formatByteLimit,
  formatLimitBytes,
  formatUptimeLimit,
  resolveRouterOSProfile,
  generateRouterOSTerminalScript
};


export function generateUserManagerV6Script(cards: Card[], customer: string = 'admin'): string {
  const safeCustomer = sanitizeRouterOSIdentifier(customer, 'admin');
  const lines: string[] = [
    `# ==========================================================`,
    `# NetFlow SaaS - MikroTik User Manager v6 Script (/tool user-manager)`,
    `# Generated At: ${new Date().toLocaleString('ar-EG')}`,
    `# Total Users: ${cards.length}`,
    `# Hardened: RouterOS Injection Protected`,
    `# ==========================================================`,
    `/tool user-manager user`
  ];

  for (const card of cards) {
    const safeCode = sanitizeRouterOSValue(card.code, 40);
    if (!safeCode) continue;

    const rawPwd = card.password !== undefined && card.password !== '' ? card.password : card.code;
    const safePwd = sanitizeRouterOSValue(rawPwd, 40);
    const cleanProf = resolveRouterOSProfile(card.profileName, 'default');
    const comment = sanitizeRouterOSComment(`NetFlow_${card.batchNumber}`);
    
    lines.push(`add customer="${safeCustomer}" username="${safeCode}" password="${safePwd}" comment="${comment}"`);
    lines.push(`create-and-activate-profile numbers="${safeCode}" customer="${safeCustomer}" profile="${cleanProf}"`);
  }

  return lines.join('\n');
}

export function generateUserManagerV7Script(cards: Card[], userGroup: string = 'default'): string {
  const safeGroup = sanitizeRouterOSIdentifier(userGroup, 'default');
  const lines: string[] = [
    `# ==========================================================`,
    `# NetFlow SaaS - MikroTik User Manager v7 Script (RouterOS v7)`,
    `# Generated At: ${new Date().toLocaleString('ar-EG')}`,
    `# Total Users: ${cards.length}`,
    `# Hardened: RouterOS Injection Protected`,
    `# ==========================================================`,
    `/user-manager user`
  ];

  for (const card of cards) {
    const safeCode = sanitizeRouterOSValue(card.code, 40);
    if (!safeCode) continue;

    const rawPwd = card.password !== undefined && card.password !== '' ? card.password : card.code;
    const safePwd = sanitizeRouterOSValue(rawPwd, 40);
    const rawProf = card.profileName.split(' ')[0] || 'default';
    const cleanProf = sanitizeRouterOSIdentifier(rawProf, 'default');
    const comment = sanitizeRouterOSComment(`NetFlow_${card.batchNumber}`);
    
    lines.push(`add name="${safeCode}" password="${safePwd}" group="${safeGroup}" comment="${comment}"`);
    lines.push(`/user-manager user-profile add user="${safeCode}" profile="${cleanProf}"`);
  }

  return lines.join('\n');
}

export function generateRouterOSCleanupScript(
  retentionPolicy: 'immediate' | 'after_24h' | 'after_7d' = 'immediate',
  excludeComments: string = 'admin,keep_admin,bypass,vip'
): string {
  const policyLabelMap = {
    immediate: 'حذف فوري بمجرد انتهاء الرصيد أو الوقت (Immediate on Expiry)',
    after_24h: 'حذف الكروت المنتهية بعد 24 ساعة (Grace 24h)',
    after_7d: 'حذف الكروت المنتهية بعد 7 أيام (Grace 7 Days)'
  };
  const policyLabel = policyLabelMap[retentionPolicy] || policyLabelMap.immediate;

  // Sanitize excludeComments input to prevent regex breakdown or command injection
  const safeExcludeKeywords = (excludeComments || 'admin,keep_admin,bypass,vip')
    .split(',')
    .map(k => sanitizeRouterOSIdentifier(k.trim(), ''))
    .filter(Boolean);

  const excludeChecks = safeExcludeKeywords.length > 0
    ? safeExcludeKeywords.map(k => `$uComment ~ "${k}"`).join(' || ')
    : '$uComment ~ "keep_admin"';

  return `# ==========================================================
# NetFlow SaaS - Expired Hotspot Users Cleanup & Maintenance
# Policy: ${policyLabel}
# Generated At: ${new Date().toISOString()}
# Safe Routine: Excludes Admin & Protected Accounts (Injection Hardened)
# ==========================================================

:log info "NetFlow Maintenance: Starting scan for expired hotspot users..."
/ip hotspot user
:local totalRemoved 0

:foreach u in=[find] do={
  :local uName [get $u name]
  :local uComment ""
  :do { :set uComment [get $u comment] } on-error={}
  :local bytesIn [get $u bytes-in]
  :local bytesOut [get $u bytes-out]
  :local byteLimit [get $u limit-bytes-total]
  :local uptime [get $u uptime]
  :local uptimeLimit [get $u limit-uptime]
  :local isProtected false

  # Protect admin, default accounts, and explicitly tagged users
  :if ($uName = "admin" || $uName = "default") do={ :set isProtected true }
  :if (${excludeChecks}) do={ :set isProtected true }

  :if (!$isProtected) do={
    :local isExpired false

    # Check byte quota exhaustion (Total downloaded + uploaded >= Limit)
    :if ($byteLimit > 0 && ($bytesIn + $bytesOut) >= $byteLimit) do={
      :set isExpired true
    }

    # Check uptime / validity exhaustion
    :if ($uptimeLimit > 0s && $uptime >= $uptimeLimit) do={
      :set isExpired true
    }

    :if ($isExpired) do={
      :do {
        remove $u
        :set totalRemoved ($totalRemoved + 1)
      } on-error={
        :log debug ("NetFlow Maintenance: Skipped user " . $uName)
      }
    }
  }
}

:log info ("NetFlow Maintenance: Completed. Cleaned up " . $totalRemoved . " expired hotspot users.")
`;
}

export function generateRouterOSFetchPollingScript(tenant: Tenant): string {
  const token = tenant.settings.syncToken || 'sam_sec_89df24a67e12c4';
  const autoCleanup = tenant.settings.autoCleanupExpiredUsers ? '&cleanup=true' : '';
  const retention = tenant.settings.cleanupRetentionPolicy ? `&retention=${tenant.settings.cleanupRetentionPolicy}` : '';
  const baseUrl = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost'))
    ? window.location.origin
    : (process.env.APP_URL || 'https://ais-dev-iaagkplbn2n4og7vmqgpia-180820475420.europe-west2.run.app');
  const apiEndpoint = `${baseUrl}/api/mikrotik/sync?token=${token}${autoCleanup}${retention}`;

  return `# ==========================================================
# NetFlow SaaS - Auto-Fetch Polling Script for MikroTik RouterOS
# Run without requiring a Static Public IP!
# Auto-Cleanup Mode: ${tenant.settings.autoCleanupExpiredUsers ? 'ENABLED (تشغيل الصيانة الدورية)' : 'DISABLED'}
# Add to: /system script and schedule every 2-5 minutes in /system scheduler
# ==========================================================

:local scriptUrl "${apiEndpoint}"
:local fileName "netflow_sync.rsc"

:log info "NetFlow: Checking for pending hotspot cards from Cloud API..."

:do {
  /tool fetch url=$scriptUrl mode=https dst-path=$fileName check-certificate=no
  :delay 2s
  
  :if ([/file find name=$fileName] != "") do={
    :log info "NetFlow: New card batch script downloaded. Importing users..."
    /import file-name=$fileName
    /file remove $fileName
    :log info "NetFlow: Hotspot users imported successfully!"
  } else={
    :log info "NetFlow: No new pending users."
  }
} on-error={
  :log warning "NetFlow: Cloud sync fetch failed or server unreachable."
}
`;
}

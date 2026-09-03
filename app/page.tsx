'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import {
  AppState,
  appStore,
  createInitialData
} from '@/lib/store';
import {
  saveBatchAndCards,
  deleteBatchAndCards,
  saveAgent,
  saveInvoice,
  savePaymentTransaction,
  saveTenantSettings,
  saveTenant,
  saveProfiles,
  saveTeamMember,
  deleteTeamMemberFromFirestore,
  saveUserProfile
} from '@/lib/firestore-service';
import {
  Card,
  CardBatch,
  Agent,
  Invoice,
  PaymentTransaction,
  Profile,
  Tenant,
  TeamMember,
  UserProfile
} from '@/types';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/layout/Navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { PosManager } from '@/components/pos/PosManager';
import { InvoicesManager } from '@/components/invoices/InvoicesManager';
import { SettingsManager } from '@/components/settings/SettingsManager';
import { PublicLandingPage } from '@/components/auth/PublicLandingPage';

// Dynamically import heavy tabs and modals to optimize initial bundle and avoid chunk load timeout
const CardStudio = dynamic(() => import('@/components/card-studio/CardStudio').then(m => m.CardStudio), {
  loading: () => <div className="p-12 text-center text-slate-400 font-bold text-sm animate-pulse">جاري تحميل استوديو تصميم الكروت...</div>
});
const HotspotStudio = dynamic(() => import('@/components/hotspot/HotspotStudio').then(m => m.HotspotStudio), {
  loading: () => <div className="p-12 text-center text-slate-400 font-bold text-sm animate-pulse">جاري تحميل استوديو صفحات الهوتسبوت...</div>
});
const MikroTikBridge = dynamic(() => import('@/components/mikrotik/MikroTikBridge').then(m => m.MikroTikBridge), {
  loading: () => <div className="p-12 text-center text-slate-400 font-bold text-sm animate-pulse">جاري تحميل منصة ربط ميكروتك...</div>
});
const SuperAdminDashboard = dynamic(() => import('@/components/admin/SuperAdminDashboard').then(m => m.SuperAdminDashboard), {
  loading: () => <div className="p-12 text-center text-slate-400 font-bold text-sm animate-pulse">جاري تحميل لوحة تحكم الإدارة العليا...</div>
});
const DistributorFieldView = dynamic(() => import('@/components/distributor/DistributorFieldView').then(m => m.DistributorFieldView));
const NewInvoiceModal = dynamic(() => import('@/components/modals/NewInvoiceModal').then(m => m.NewInvoiceModal));
const NewPaymentModal = dynamic(() => import('@/components/modals/NewPaymentModal').then(m => m.NewPaymentModal));
const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(m => m.AuthModal));
const OnboardingWizard = dynamic(() => import('@/components/settings/OnboardingWizard').then(m => m.OnboardingWizard));
const CleanTenantDataModal = dynamic(() => import('@/components/settings/CleanTenantDataModal').then(m => m.CleanTenantDataModal));
const SubscriptionPlansModal = dynamic(() => import('@/components/modals/SubscriptionPlansModal').then(m => m.SubscriptionPlansModal));
import {
  fetchAllTenants,
  signOutUser,
  fetchUserProfile,
  DEFAULT_ADMIN_EMAIL,
  isSuperAdminEmail
} from '@/lib/firestore-service';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Sparkles, Trash2, ShieldCheck, AlertTriangle, X } from 'lucide-react';

export default function Home() {
  const appState = useSyncExternalStore(
    appStore.subscribe,
    appStore.getSnapshot,
    appStore.getServerSnapshot
  );
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isCleanModalOpen, setIsCleanModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isBannerMinimized, setIsBannerMinimized] = useState<boolean>(false);
  const [selectedAgentIdForModal, setSelectedAgentIdForModal] = useState<string | undefined>(undefined);

  // Super Admin & Multi-Tenant Registry State
  const [allTenantsList, setAllTenantsList] = useState<Tenant[]>([]);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [originalTenantBackup, setOriginalTenantBackup] = useState<Tenant | null>(null);

  const updateState = appStore.update;

  // Load all tenants for Super Admin
  const loadTenantsForSuperAdmin = async () => {
    try {
      const list = await fetchAllTenants();
      setAllTenantsList(list);
    } catch (err) {
      console.warn('Load tenants error:', err);
    }
  };

  useEffect(() => {
    loadTenantsForSuperAdmin();
  }, []);

  // Auto-detect Firebase Auth state on page load across all browsers / tabs
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          const email = firebaseUser.email;
          const isMaster =
            isSuperAdminEmail(email) ||
            email.toLowerCase() === 'admin@samtech.net' ||
            email.toLowerCase().startsWith('mosthassan');

          let profile = await fetchUserProfile(firebaseUser.uid);
          const targetTenantId = profile?.tenantId || (isMaster ? 'tenant_main_01' : `tenant_${firebaseUser.uid.substring(0, 12)}`);

          if (!profile) {
            profile = {
              uid: firebaseUser.uid,
              email: email,
              name: firebaseUser.displayName || (isMaster ? 'المهندس مصطفى حسن (Super Admin)' : email.split('@')[0]),
              photoURL: firebaseUser.photoURL || undefined,
              role: isMaster ? 'super_admin' : 'owner',
              tenantId: targetTenantId,
              active: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };
            await saveUserProfile(profile);
          }

          appStore.update(prev => ({
            ...prev,
            currentUserProfile: profile,
            tenant: {
              ...prev.tenant,
              id: targetTenantId,
              ownerEmail: email,
              ownerName: profile.name || prev.tenant.ownerName,
              ownerUid: firebaseUser.uid
            }
          }));

          // Trigger cloud synchronization for this tenant
          appStore.initFirestoreSync(targetTenantId);
        } catch (err) {
          console.warn('Auth auto-restore note:', err);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Initialize real-time Firestore synchronization on mount / tenant change
  const currentTenantId = appState?.tenant?.id || 'tenant_main_01';
  useEffect(() => {
    // Load typography settings
    try {
      const savedFont = localStorage.getItem('netflow_font_family') || 'cairo';
      const savedScale = localStorage.getItem('netflow_font_scale') || 'normal';
      const fontClasses = ['font-cairo', 'font-alexandria', 'font-readex', 'font-tajawal'];
      fontClasses.forEach(cls => document.body.classList.remove(cls));
      document.body.classList.add(`font-${savedFont}`);

      if (savedScale === 'compact') {
        document.documentElement.style.fontSize = '14.5px';
      } else if (savedScale === 'large') {
        document.documentElement.style.fontSize = '17px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    } catch {
      // ignore
    }

    let cleanup: (() => void) | undefined;
    
    appStore.initFirestoreSync(currentTenantId).then(unsub => {
      cleanup = unsub;
    }).catch(err => {
      console.warn('Firestore initial sync notice:', err);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentTenantId]);

  // Current User & Security Authentication state
  const currentUser = appState?.currentUserProfile || null;

  const isSuperAdmin = Boolean(
    currentUser &&
    (currentUser.role === 'super_admin' ||
     isSuperAdminEmail(currentUser.email) ||
     currentUser.email?.toLowerCase() === 'admin@samtech.net')
  );

  const isOwner = Boolean(currentUser && (currentUser.role === 'owner' || isSuperAdmin));

  // Strict role-based route guard
  useEffect(() => {
    if (currentUser) {
      if (!isSuperAdmin && (activeTab === 'super_admin' || activeTab === 'admin')) {
        setActiveTab(isOwner ? 'dashboard' : 'distributor_pos');
      } else if (!isOwner && ['dashboard', 'studio', 'hotspot', 'inventory', 'mikrotik', 'settings', 'super_admin', 'admin'].includes(activeTab)) {
        setActiveTab('distributor_pos');
      }
    }
  }, [currentUser, isSuperAdmin, isOwner, activeTab]);

  // Authentication and Session handlers
  const handleSelectUserProfile = async (profile: UserProfile) => {
    const isMaster =
      profile.role === 'super_admin' ||
      isSuperAdminEmail(profile.email) ||
      profile.email?.toLowerCase() === 'admin@samtech.net' ||
      profile.email?.toLowerCase().startsWith('mosthassan');

    const targetTenantId = profile.tenantId || (isMaster ? 'tenant_main_01' : `tenant_${profile.uid.substring(0, 12)}`);

    appStore.update(prev => ({
      ...prev,
      currentUserProfile: profile,
      tenant: {
        ...prev.tenant,
        id: targetTenantId,
        ownerEmail: profile.email || prev.tenant.ownerEmail,
        ownerName: profile.name || prev.tenant.ownerName,
        ownerUid: profile.uid || prev.tenant.ownerUid
      }
    }));

    if (isMaster || profile.role === 'owner') {
      setActiveTab('dashboard');
    } else if (profile.role === 'distributor') {
      setActiveTab('distributor_pos');
    } else {
      setActiveTab('dashboard');
    }

    saveUserProfile(profile).catch(err => {
      console.warn('Failed to persist user profile:', err);
    });

    // Pull and sync from cloud for this tenant immediately
    appStore.initFirestoreSync(targetTenantId).catch(err => {
      console.warn('Sync on user switch error:', err);
    });
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    appStore.logout();
    setActiveTab('dashboard');
  };

  // Super Admin Impersonation Handlers
  const handleImpersonateTenant = (targetTenant: Tenant) => {
    if (!appState) return;
    setOriginalTenantBackup(appState.tenant);
    setIsImpersonating(true);
    updateState(prev => ({
      ...prev,
      tenant: targetTenant
    }));
    setActiveTab('dashboard');
  };

  const handleExitImpersonation = () => {
    if (originalTenantBackup) {
      updateState(prev => ({
        ...prev,
        tenant: originalTenantBackup
      }));
    }
    setIsImpersonating(false);
    setActiveTab('super_admin');
  };

  // Team Member Handlers
  const handleAddTeamMember = (memberData: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    const newMember: TeamMember = {
      ...memberData,
      id: `member_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    updateState(prev => ({
      ...prev,
      team: [newMember, ...prev.team]
    }));

    saveTeamMember(tenantId, newMember).catch(err => {
      console.error('Failed to save team member to Firestore:', err);
    });
  };

  const handleUpdateTeamMember = (memberId: string, updates: Partial<TeamMember>) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    if (!appState) return;

    const updatedTeam = appState.team.map(m => (m.id === memberId ? { ...m, ...updates } : m));
    const targetMember = updatedTeam.find(m => m.id === memberId);

    updateState(prev => ({
      ...prev,
      team: updatedTeam
    }));

    if (targetMember) {
      saveTeamMember(tenantId, targetMember).catch(err => {
        console.error('Failed to update team member in Firestore:', err);
      });
    }
  };

  const handleDeleteTeamMember = (memberId: string) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    updateState(prev => ({
      ...prev,
      team: prev.team.filter(m => m.id !== memberId)
    }));

    deleteTeamMemberFromFirestore(tenantId, memberId).catch(err => {
      console.error('Failed to delete team member from Firestore:', err);
    });
  };

  // Handlers with Optimistic State + Background Firestore Persistence
  const handleBatchSaved = (batch: CardBatch, newCards: Card[]) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    
    // 1. Optimistic Local Update
    updateState(prev => ({
      ...prev,
      batches: [batch, ...prev.batches],
      cards: [...newCards, ...prev.cards],
      syncStatus: {
        ...prev.syncStatus,
        pendingSyncCount: prev.syncStatus.pendingSyncCount + newCards.length
      }
    }));

    // 2. Persist to Firestore in background
    saveBatchAndCards(tenantId, batch, newCards).catch(err => {
      console.error('Failed to sync batch to Firestore:', err);
    });
  };

  const handleDeleteBatch = (batchId: string) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';

    // 1. Optimistic Local Update
    updateState(prev => ({
      ...prev,
      batches: prev.batches.filter(b => b.id !== batchId),
      cards: prev.cards.filter(c => c.batchId !== batchId)
    }));

    // 2. Delete from Firestore in background
    deleteBatchAndCards(tenantId, batchId).catch(err => {
      console.error('Failed to delete batch from Firestore:', err);
    });
  };

  const handleAddAgent = (
    agentData: Omit<Agent, 'id' | 'tenantId' | 'totalPurchases' | 'totalPaid' | 'currentDebt' | 'createdAt'>
  ) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      tenantId,
      ...agentData,
      totalPurchases: 0,
      totalPaid: 0,
      currentDebt: 0,
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic Local Update
    updateState(prev => ({
      ...prev,
      agents: [newAgent, ...prev.agents]
    }));

    // 2. Persist to Firestore in background
    saveAgent(tenantId, newAgent).catch(err => {
      console.error('Failed to save agent to Firestore:', err);
    });
  };

  const handleCreateInvoice = (invoiceData: {
    agentId: string;
    items: {
      profileId: string;
      profileName: string;
      qty: number;
      retailPrice: number;
      wholesalePrice: number;
      subtotalWholesale: number;
      subtotalRetail: number;
    }[];
    paidAmount: number;
    paymentType: 'cash' | 'credit' | 'partial';
    notes?: string;
  }) => {
    if (!appState) return;

    const agent = appState.agents.find(a => a.id === invoiceData.agentId);
    if (!agent) return;

    const tenantId = appState.tenant.id || 'tenant_main_01';
    const totalWholesale = invoiceData.items.reduce((acc, i) => acc + i.subtotalWholesale, 0);
    const totalRetail = invoiceData.items.reduce((acc, i) => acc + i.subtotalRetail, 0);
    const remainingDebt = Math.max(0, totalWholesale - invoiceData.paidAmount);
    const invoiceId = `inv_${Date.now()}`;
    const invoiceNumber = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Allocate in_stock cards to this agent
    const updatedCards = [...appState.cards];
    const touchedCardsForFirestore: Card[] = [];
    const touchedBatchIds = new Set<string>();

    invoiceData.items.forEach(item => {
      let needed = item.qty;
      for (let i = 0; i < updatedCards.length; i++) {
        if (needed <= 0) break;
        const c = updatedCards[i];
        if (c.profileId === item.profileId && c.status === 'in_stock') {
          const distributedCard: Card = {
            ...c,
            status: 'distributed',
            assignedToAgentId: agent.id,
            assignedToAgentName: agent.storeName,
            assignedInvoiceId: invoiceId,
            distributedAt: now
          };
          updatedCards[i] = distributedCard;
          touchedCardsForFirestore.push(distributedCard);
          touchedBatchIds.add(c.batchId);
          needed--;
        }
      }
    });

    const newInvoice: Invoice = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      agentId: agent.id,
      agentName: agent.storeName,
      agentPhone: agent.phone,
      items: invoiceData.items,
      totalRetail,
      totalWholesale,
      paidAmount: invoiceData.paidAmount,
      remainingDebt,
      paymentType: invoiceData.paymentType,
      date: now,
      notes: invoiceData.notes,
      batchIds: Array.from(touchedBatchIds)
    };

    // Update agent debt
    const updatedAgent: Agent = {
      ...agent,
      totalPurchases: agent.totalPurchases + totalWholesale,
      totalPaid: agent.totalPaid + invoiceData.paidAmount,
      currentDebt: agent.currentDebt + remainingDebt
    };

    const updatedAgents = appState.agents.map(a => a.id === agent.id ? updatedAgent : a);

    // If there was an immediate cash payment, record payment transaction as well
    const updatedPayments = [...appState.payments];
    let upfrontPayment: PaymentTransaction | null = null;
    if (invoiceData.paidAmount > 0) {
      upfrontPayment = {
        id: `pay_${Date.now()}`,
        tenantId,
        receiptNumber: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
        agentId: agent.id,
        agentName: agent.storeName,
        amount: invoiceData.paidAmount,
        previousBalance: agent.currentDebt,
        newBalance: agent.currentDebt + remainingDebt,
        paymentMethod: 'cash',
        date: now,
        notes: `دفعة مقدمة مع سند التسليم ${invoiceNumber}`
      };
      updatedPayments.unshift(upfrontPayment);
    }

    // 1. Optimistic Local Update
    updateState(prev => ({
      ...prev,
      cards: updatedCards,
      invoices: [newInvoice, ...prev.invoices],
      agents: updatedAgents,
      payments: updatedPayments
    }));

    // 2. Transactional Firestore Persistence
    saveInvoice(tenantId, newInvoice, touchedCardsForFirestore, updatedAgent).catch(err => {
      console.error('Failed to sync invoice to Firestore:', err);
    });

    if (upfrontPayment) {
      savePaymentTransaction(tenantId, upfrontPayment, updatedAgent).catch(err => {
        console.error('Failed to sync upfront payment to Firestore:', err);
      });
    }
  };

  const handleCreatePayment = (paymentData: {
    agentId: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'e_wallet' | 'check';
    referenceNumber?: string;
    notes?: string;
  }) => {
    if (!appState) return;
    const agent = appState.agents.find(a => a.id === paymentData.agentId);
    if (!agent) return;

    const tenantId = appState.tenant.id || 'tenant_main_01';
    const previousBalance = agent.currentDebt;
    const newBalance = Math.max(0, previousBalance - paymentData.amount);
    const now = new Date().toISOString();

    const newPayment: PaymentTransaction = {
      id: `pay_${Date.now()}`,
      tenantId,
      receiptNumber: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
      agentId: agent.id,
      agentName: agent.storeName,
      amount: paymentData.amount,
      previousBalance,
      newBalance,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      date: now,
      notes: paymentData.notes
    };

    const updatedAgent: Agent = {
      ...agent,
      totalPaid: agent.totalPaid + paymentData.amount,
      currentDebt: newBalance
    };

    const updatedAgents = appState.agents.map(a => a.id === agent.id ? updatedAgent : a);

    // 1. Optimistic Local Update
    updateState(prev => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
      agents: updatedAgents
    }));

    // 2. Firestore Persistence
    savePaymentTransaction(tenantId, newPayment, updatedAgent).catch(err => {
      console.error('Failed to sync payment to Firestore:', err);
    });
  };

  const handleUpdateTenantSettings = (settings: Partial<Tenant['settings']>) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    updateState(prev => ({
      ...prev,
      tenant: {
        ...prev.tenant,
        settings: {
          ...prev.tenant.settings,
          ...settings
        }
      }
    }));

    saveTenantSettings(tenantId, settings).catch(err => {
      console.error('Failed to update tenant settings in Firestore:', err);
    });
  };

  const handleUpdateTenant = (updated: Partial<Tenant>) => {
    if (!appState) return;
    const tenantId = appState.tenant.id || 'tenant_main_01';
    const mergedTenant = { ...appState.tenant, ...updated };
    
    updateState(prev => ({
      ...prev,
      tenant: mergedTenant
    }));

    saveTenant(tenantId, mergedTenant).catch(err => {
      console.error('Failed to update tenant in Firestore:', err);
    });
  };

  const handleUpdateProfiles = (profiles: Profile[]) => {
    const tenantId = appState?.tenant.id || 'tenant_main_01';
    updateState(prev => ({
      ...prev,
      profiles
    }));

    saveProfiles(tenantId, profiles).catch(err => {
      console.error('Failed to update profiles in Firestore:', err);
    });
  };

  const handleResetData = () => {
    appStore.reset();
    alert('تمت استعادة البيانات التجريبية الأولية بنجاح!');
  };

  const handleSyncCards = () => {
    updateState(prev => ({
      ...prev,
      cards: prev.cards.map(c => ({ ...c, syncedToRouter: true })),
      syncStatus: {
        ...prev.syncStatus,
        lastSyncTime: new Date().toISOString(),
        pendingSyncCount: 0,
        totalSyncedCount: prev.cards.length,
        routerConnectionStatus: 'connected',
        lastLog: `RouterOS API: All ${prev.cards.length} cards verified and synchronized.`
      }
    }));
  };

  // Derived metrics for navbar
  const totalMarketDebt = useMemo(() => {
    if (!appState) return 0;
    return appState.agents.reduce((acc, a) => acc + (a.currentDebt || 0), 0);
  }, [appState]);

  const inStockCardsCount = useMemo(() => {
    if (!appState) return 0;
    return appState.cards.filter(c => c.status === 'in_stock').length;
  }, [appState]);

  if (!appState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans" dir="rtl">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm">جاري تهيئة نظام NetFlow SaaS...</p>
      </div>
    );
  }

  // If user is not authenticated, show public landing page and login portal
  if (!currentUser) {
    return (
      <PublicLandingPage
        tenant={appState.tenant}
        team={appState.team}
        onAuthenticated={handleSelectUserProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white" dir="rtl">
      {/* Main Header / Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tenant={appState.tenant}
        currentUser={currentUser}
        totalMarketDebt={totalMarketDebt}
        inStockCardsCount={inStockCardsCount}
        isCloudConnected={appState.isCloudConnected ?? true}
        isImpersonating={isImpersonating}
        onExitImpersonation={handleExitImpersonation}
        onOpenNewInvoiceModal={() => {
          setSelectedAgentIdForModal(undefined);
          setIsInvoiceModalOpen(true);
        }}
        onOpenNewPaymentModal={() => {
          setSelectedAgentIdForModal(undefined);
          setIsPaymentModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Production Readiness / Clean Slate Setup Banner for Owner */}
        {isOwner && !appState.tenant.isProductionReady && !isBannerMinimized && activeTab !== 'super_admin' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>الشبكة حالياً في الوضع التجريبي (Demo Mode)</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full border border-amber-500/30">
                    بيانات توضيحية
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  هل تريد مسح كافة البيانات التجريبية وبدء شبكتك بسجل نظيف وخالٍ من أي تداخل للإنتاج الفعلي؟
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsCleanModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-950/50 transition transform active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-slate-950" />
                <span>تهيئة الشبكة للإنتاج الفعلي (مسح البيانات)</span>
              </button>

              <button
                onClick={() => setIsOnboardingModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl text-xs font-bold transition border border-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>معالج الإعداد</span>
              </button>

              <button
                onClick={() => setIsBannerMinimized(true)}
                title="تصغير الشريط وإبقاؤه في زاوية الموقع"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Super Admin Central Dashboard - Strictly Protected for Master Super Admin only */}
        {isSuperAdmin && (activeTab === 'admin' || activeTab === 'super_admin') && (
          <SuperAdminDashboard
            currentTenant={appState.tenant}
            onImpersonateTenant={handleImpersonateTenant}
            impersonatedTenantId={isImpersonating ? appState.tenant.id : null}
            onExitImpersonation={handleExitImpersonation}
            onBackToMyNetwork={() => setActiveTab('dashboard')}
          />
        )}

        {/* Dedicated Field Distributor View */}
        {activeTab === 'distributor_pos' && (
          <DistributorFieldView
            tenant={appState.tenant}
            currentUser={currentUser}
            agents={appState.agents}
            invoices={appState.invoices}
            payments={appState.payments}
            profiles={appState.profiles}
            cards={appState.cards}
            onOpenNewInvoiceModal={agentId => {
              setSelectedAgentIdForModal(agentId);
              setIsInvoiceModalOpen(true);
            }}
            onOpenNewPaymentModal={agentId => {
              setSelectedAgentIdForModal(agentId);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

        {/* Owner Dashboard */}
        {isOwner && activeTab === 'dashboard' && (
          <DashboardOverview
            tenant={appState.tenant}
            profiles={appState.profiles}
            batches={appState.batches}
            cards={appState.cards}
            agents={appState.agents}
            invoices={appState.invoices}
            payments={appState.payments}
            onNavigate={setActiveTab}
            isSuperAdmin={isSuperAdmin}
            onOpenNewInvoiceModal={() => {
              setSelectedAgentIdForModal(undefined);
              setIsInvoiceModalOpen(true);
            }}
            onOpenNewPaymentModal={() => {
              setSelectedAgentIdForModal(undefined);
              setIsPaymentModalOpen(true);
            }}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}

        {isOwner && activeTab === 'studio' && (
          <CardStudio
            tenant={appState.tenant}
            profiles={appState.profiles}
            templates={appState.templates}
            onBatchSaved={handleBatchSaved}
            onUpdateProfiles={handleUpdateProfiles}
          />
        )}

        {isOwner && activeTab === 'hotspot' && (
          <HotspotStudio
            tenant={appState.tenant}
          />
        )}

        {isOwner && activeTab === 'inventory' && (
          <InventoryManager
            tenant={appState.tenant}
            batches={appState.batches}
            cards={appState.cards}
            profiles={appState.profiles}
            templates={appState.templates}
            onDeleteBatch={handleDeleteBatch}
          />
        )}

        {activeTab === 'pos' && (
          <PosManager
            tenant={appState.tenant}
            agents={appState.agents}
            invoices={appState.invoices}
            payments={appState.payments}
            profiles={appState.profiles}
            cards={appState.cards}
            onAddAgent={handleAddAgent}
            onOpenNewInvoiceModal={agentId => {
              setSelectedAgentIdForModal(agentId);
              setIsInvoiceModalOpen(true);
            }}
            onOpenNewPaymentModal={agentId => {
              setSelectedAgentIdForModal(agentId);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesManager
            tenant={appState.tenant}
            invoices={appState.invoices}
            payments={appState.payments}
            agents={appState.agents}
            profiles={appState.profiles}
            cards={appState.cards}
            onOpenNewInvoiceModal={() => {
              setSelectedAgentIdForModal(undefined);
              setIsInvoiceModalOpen(true);
            }}
            onOpenNewPaymentModal={() => {
              setSelectedAgentIdForModal(undefined);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

        {isOwner && activeTab === 'mikrotik' && (
          <MikroTikBridge
            tenant={appState.tenant}
            cards={appState.cards}
            batches={appState.batches}
            profiles={appState.profiles}
            onUpdateTenantSettings={handleUpdateTenantSettings}
            onSyncCards={handleSyncCards}
          />
        )}

        {isOwner && activeTab === 'settings' && (
          <SettingsManager
            tenant={appState.tenant}
            profiles={appState.profiles}
            team={appState.team}
            onUpdateTenant={handleUpdateTenant}
            onUpdateProfiles={handleUpdateProfiles}
            onAddTeamMember={handleAddTeamMember}
            onUpdateTeamMember={handleUpdateTeamMember}
            onDeleteTeamMember={handleDeleteTeamMember}
            onResetData={handleResetData}
            onOpenCleanModal={() => setIsCleanModalOpen(true)}
            onOpenOnboardingWizard={() => setIsOnboardingModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500 font-sans no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            نظام <strong>NetFlow SaaS</strong> لإدارة وتوزيع شبكات وكروت المايكروتك الذكية © 2026
          </span>
          <span className="text-slate-600">
            دقة طباعة A4 مليمترية • سحب سحابي ذكي بدون IP ثابت • حسابات البقالات والديون
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <NewInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        tenant={appState.tenant}
        agents={appState.agents}
        profiles={appState.profiles}
        cards={appState.cards}
        preselectedAgentId={selectedAgentIdForModal}
        onSubmitInvoice={handleCreateInvoice}
      />

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenant={appState.tenant}
        agents={appState.agents}
        preselectedAgentId={selectedAgentIdForModal}
        onSubmitPayment={handleCreatePayment}
      />

      {/* One-Click Google Auth & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        tenant={appState.tenant}
        currentUser={currentUser}
        team={appState.team}
        onSelectUserProfile={handleSelectUserProfile}
        onLogout={handleLogout}
      />

      {/* Clean Slate Production Ready Modal */}
      <CleanTenantDataModal
        isOpen={isCleanModalOpen}
        onClose={() => setIsCleanModalOpen(false)}
        tenant={appState.tenant}
        onDataPurged={() => {
          appStore.cleanTenantData();
          handleUpdateTenant({ isProductionReady: true });
        }}
        onStartOnboarding={() => {
          setIsCleanModalOpen(false);
          setIsOnboardingModalOpen(true);
        }}
      />

      {/* 3-Step Setup Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        tenant={appState.tenant}
        profiles={appState.profiles}
        onUpdateTenant={handleUpdateTenant}
        onUpdateProfiles={handleUpdateProfiles}
      />

      {/* Network Owners Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        tenant={appState.tenant}
        onSelectPlan={(plan, billing) => {
          const planNames = {
            starter: 'الخطة المجانية',
            pro: 'الخطة الاحترافية',
            enterprise: 'خطة الشركات والمؤسسات'
          };
          const maxCardsMap = {
            starter: 300,
            pro: 999999,
            enterprise: 9999999
          };
          const maxDistributorsMap = {
            starter: 1,
            pro: 15,
            enterprise: 9999
          };

          handleUpdateTenant({
            subscription: {
              plan,
              planNameArabic: planNames[plan],
              status: 'active',
              maxCards: maxCardsMap[plan],
              maxDistributors: maxDistributorsMap[plan],
              billingPeriod: billing === 'yearly' ? 'yearly' : 'monthly',
              expiresAt: new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
            }
          });
        }}
      />

      {/* Unobtrusive Floating Production Ready / Reset Badge in Corner */}
      {isOwner && activeTab !== 'super_admin' && (
        <aside aria-label="أزرار تهيئة الشبكة السريعة" className="fixed bottom-5 left-5 z-40 flex items-center gap-2 print:hidden">
          {!appState.tenant.isProductionReady ? (
            <button
              onClick={() => setIsCleanModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-2xl shadow-amber-950/80 border border-amber-300/40 transition transform hover:scale-105 active:scale-95"
              title="تهيئة وتصفير بيانات الشبكة للإنتاج الفعلي"
            >
              <Sparkles className="w-4 h-4" />
              <span>تهيئة الشبكة للإنتاج الفعلي</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
              <button
                onClick={() => setIsCleanModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 font-bold rounded-xl text-[11px] transition"
                title="إعادة تصفير وتهيئة السجلات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تصفير السجلات</span>
              </button>

              <button
                onClick={() => setIsOnboardingModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold rounded-xl text-[11px] border border-emerald-500/30 transition"
                title="الشبكة في وضع الإنتاج الفعلي - معالج الإعدادات"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بيئة الإنتاج الفعلي</span>
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}


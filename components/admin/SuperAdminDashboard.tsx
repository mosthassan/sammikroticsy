'use client';

import React, { useState, useEffect } from 'react';
import {
  Tenant,
  TenantSubscription,
  Currency,
  PlatformSettings,
  PlatformPaymentMethod,
  PlatformSubscriptionPlan,
  PlatformContactSettings,
  PlatformAdminUser,
  PaymentMethodCategory
} from '@/types';
import {
  fetchAllTenants,
  updateTenantSubscription,
  updateTenantStatus
} from '@/lib/firestore-service';
import {
  fetchPlatformSettingsFromFirestore,
  savePlatformSettingsToFirestore,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SUBSCRIPTION_PLANS,
  DEFAULT_CONTACT_SETTINGS,
  DEFAULT_ADMINS_LIST
} from '@/lib/platform-service';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Eye,
  Edit3,
  Power,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Server,
  Plus,
  X,
  Lock,
  Globe,
  Sliders,
  DollarSign,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Trash2,
  Check,
  Copy,
  Info,
  Shield,
  Key,
  HelpCircle,
  Megaphone,
  UserCheck,
  UserX,
  Save,
  Tag
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentTenant: Tenant;
  onImpersonateTenant: (tenant: Tenant) => void;
  impersonatedTenantId?: string | null;
  onExitImpersonation?: () => void;
}

type AdminTab = 'tenants' | 'payments' | 'plans' | 'contact' | 'admins';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentTenant,
  onImpersonateTenant,
  impersonatedTenantId,
  onExitImpersonation
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('tenants');

  // Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'starter' | 'pro' | 'enterprise'>('all');

  // Subscription Edit Modal State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'suspended'>('active');
  const [maxCards, setMaxCards] = useState<number>(10000);
  const [maxDistributors, setMaxDistributors] = useState<number>(15);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  // Create Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlan, setNewPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Platform Settings State (Payments, Plans, Contact, Admins)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // Payment Method Modal State (Add / Edit)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PlatformPaymentMethod | null>(null);
  const [payName, setPayName] = useState('');
  const [payCategory, setPayCategory] = useState<PaymentMethodCategory>('bank_transfer');
  const [payAccountNumber, setPayAccountNumber] = useState('');
  const [payAccountHolder, setPayAccountHolder] = useState('');
  const [payCurrency, setPayCurrency] = useState<Currency | 'USD' | 'USDT'>('YER');
  const [payInstructions, setPayInstructions] = useState('');
  const [payFeePercent, setPayFeePercent] = useState<number>(0);
  const [payIsOnline, setPayIsOnline] = useState(false);
  const [payApiKey, setPayApiKey] = useState('');
  const [paySecretKey, setPaySecretKey] = useState('');
  const [payMerchantId, setPayMerchantId] = useState('');
  const [payIsActive, setPayIsActive] = useState(true);

  // Plan Edit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformSubscriptionPlan | null>(null);
  const [planCode, setPlanCode] = useState('custom');
  const [planNameAr, setPlanNameAr] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState(25);
  const [planYearlyPrice, setPlanYearlyPrice] = useState(240);
  const [planDiscountYearly, setPlanDiscountYearly] = useState(20);
  const [planMaxCards, setPlanMaxCards] = useState(10000);
  const [planMaxDistributors, setPlanMaxDistributors] = useState(15);
  const [planMaxRouters, setPlanMaxRouters] = useState(5);
  const [planTrialDays, setPlanTrialDays] = useState(14);
  const [planIsRecommended, setPlanIsRecommended] = useState(false);
  const [planBadgeText, setPlanBadgeText] = useState('');
  const [planFeaturesText, setPlanFeaturesText] = useState('');
  const [planIsActive, setPlanIsActive] = useState(true);

  // Admin User Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'finance_admin' | 'support_admin'>('support_admin');

  // Load initial data
  useEffect(() => {
    loadTenants();
    loadPlatformConfig();
  }, []);

  const loadTenants = async () => {
    setLoadingTenants(true);
    try {
      const list = await fetchAllTenants();
      setTenants(list);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadPlatformConfig = async () => {
    setLoadingSettings(true);
    try {
      const settings = await fetchPlatformSettingsFromFirestore();
      setPlatformSettings(settings);
    } catch (err) {
      console.error('Error loading platform settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async (newSettings: PlatformSettings, successNotice = 'تم حفظ الإعدادات السحابية بنجاح!') => {
    setIsSavingGlobal(true);
    setSaveSettingsStatus(null);
    setPlatformSettings(newSettings);
    const res = await savePlatformSettingsToFirestore(newSettings);
    setIsSavingGlobal(false);
    if (res.success) {
      setSaveSettingsStatus({ success: true, msg: res.error || successNotice });
      setTimeout(() => setSaveSettingsStatus(null), 4000);
    } else {
      setSaveSettingsStatus({ success: false, msg: res.error || 'حدث خطأ أثناء الحفظ' });
    }
  };

  // -------------------------------------------------------------
  // Tenants Handlers
  // -------------------------------------------------------------

  const handleOpenEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    const sub = tenant.subscription || {
      plan: 'pro',
      planNameArabic: 'باقة المحترفين (Pro)',
      status: (tenant.status as any) || 'active',
      maxCards: 10000,
      maxDistributors: 15,
      expiresAt: '2026-12-31T00:00:00Z',
      billingPeriod: 'yearly',
      pricePaid: 120
    };
    setSelectedPlan(sub.plan as any);
    setSelectedStatus(sub.status === 'suspended' ? 'suspended' : 'active');
    setMaxCards(sub.maxCards || 10000);
    setMaxDistributors(sub.maxDistributors || 15);
    setExpiresAt(sub.expiresAt ? sub.expiresAt.substring(0, 10) : '2026-12-31');
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSavingSub(true);
    setSubSuccessMsg('');

    const matchedPlan = platformSettings.subscriptionPlans.find(p => p.code === selectedPlan);
    const planNameArabic = matchedPlan?.nameArabic || (selectedPlan === 'pro' ? 'باقة المحترفين (Pro)' : selectedPlan === 'enterprise' ? 'الباقة اللامحدودة (Enterprise)' : 'باقة المبتدئين (Starter)');

    const updatedSub: TenantSubscription = {
      plan: selectedPlan,
      planNameArabic,
      status: selectedStatus,
      maxCards,
      maxDistributors,
      expiresAt: new Date(expiresAt).toISOString(),
      billingPeriod: editingTenant.subscription?.billingPeriod || 'yearly',
      pricePaid: matchedPlan ? (editingTenant.subscription?.billingPeriod === 'yearly' ? matchedPlan.yearlyPrice : matchedPlan.monthlyPrice) : 25
    };

    const res = await updateTenantSubscription(editingTenant.id, updatedSub);
    if (res.success) {
      setTenants(prev =>
        prev.map(t =>
          t.id === editingTenant.id
            ? { ...t, subscription: updatedSub, status: selectedStatus }
            : t
        )
      );
      setSubSuccessMsg('تم تحديث بيانات الاشتراك بنجاح!');
      setTimeout(() => {
        setEditingTenant(null);
        setSubSuccessMsg('');
      }, 1200);
    } else {
      alert(res.error || 'حدث خطأ أثناء الحفظ');
    }
    setIsSavingSub(false);
  };

  const handleToggleTenantStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg =
      newStatus === 'suspended'
        ? `هل أنت متأكد من تجميد اشتراك شبكة "${tenant.businessName}"؟`
        : `هل أنت متأكد من إعادة تفعيل شبكة "${tenant.businessName}"؟`;

    if (!confirm(confirmMsg)) return;

    const res = await updateTenantStatus(tenant.id, newStatus);
    if (res.success) {
      setTenants(prev =>
        prev.map(t =>
          t.id === tenant.id
            ? {
                ...t,
                status: newStatus,
                subscription: t.subscription ? { ...t.subscription, status: newStatus } : undefined
              }
            : t
        )
      );
    }
  };

  const handleExtendDays = (days: number) => {
    const current = expiresAt ? new Date(expiresAt) : new Date();
    current.setDate(current.getDate() + days);
    setExpiresAt(current.toISOString().substring(0, 10));
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const id = `tenant_${Date.now()}`;
    const matchedPlan = platformSettings.subscriptionPlans.find(p => p.code === newPlan);
    const planNameArabic = matchedPlan?.nameArabic || 'باقة المحترفين (Pro)';
    const maxCardsVal = matchedPlan?.maxCards || 10000;
    const maxDistVal = matchedPlan?.maxDistributors || 15;

    const newTenant: Tenant = {
      id,
      businessName: newBizName.trim(),
      tagline: 'شبكة إنترنت لاسلكية وكروت ذكية',
      phone: newPhone.trim() || '770000000',
      currency: 'YER',
      ownerUid: `user_${id}`,
      ownerName: newOwnerName.trim() || 'مدير الشبكة',
      ownerEmail: newOwnerEmail.trim() || undefined,
      status: 'active',
      subscription: {
        plan: newPlan,
        planNameArabic,
        status: 'active',
        maxCards: maxCardsVal,
        maxDistributors: maxDistVal,
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        billingPeriod: 'yearly',
        pricePaid: matchedPlan?.yearlyPrice || 120
      },
      settings: {
        routerIp: '10.0.0.1',
        loginDomain: 'hotspot.lan',
        autoLoginUrlPattern: 'http://{domain}/login?username={code}&password={password}',
        syncToken: `sec_${Math.random().toString(36).substring(2, 10)}`
      },
      createdAt: new Date().toISOString(),
      totalCardsCount: 0,
      activeDistributorsCount: 0,
      totalRevenueGenerated: 0
    };

    setTenants(prev => [newTenant, ...prev]);
    setIsCreateModalOpen(false);
    setNewBizName('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewPhone('');
  };

  // -------------------------------------------------------------
  // Payment Methods Handlers
  // -------------------------------------------------------------

  const handleOpenPaymentModal = (method?: PlatformPaymentMethod) => {
    if (method) {
      setEditingPaymentMethod(method);
      setPayName(method.name);
      setPayCategory(method.category);
      setPayAccountNumber(method.accountNumber);
      setPayAccountHolder(method.accountHolderName);
      setPayCurrency(method.currency);
      setPayInstructions(method.instructions || '');
      setPayFeePercent(method.transferFeePercent || 0);
      setPayIsOnline(!!method.isOnlineGateway);
      setPayApiKey(method.gatewayApiKey || '');
      setPaySecretKey(method.gatewaySecretKey || '');
      setPayMerchantId(method.gatewayMerchantId || '');
      setPayIsActive(method.isActive);
    } else {
      setEditingPaymentMethod(null);
      setPayName('');
      setPayCategory('bank_transfer');
      setPayAccountNumber('');
      setPayAccountHolder('م. مصطفى حسن');
      setPayCurrency('YER');
      setPayInstructions('يرجى إرسال إشعار التحويل عبر الواتساب للتفعيل الفوري.');
      setPayFeePercent(0);
      setPayIsOnline(false);
      setPayApiKey('');
      setPaySecretKey('');
      setPayMerchantId('');
      setPayIsActive(true);
    }
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payName.trim() || !payAccountNumber.trim()) return;

    const updatedMethod: PlatformPaymentMethod = {
      id: editingPaymentMethod ? editingPaymentMethod.id : `pay_${Date.now()}`,
      name: payName.trim(),
      category: payCategory,
      accountNumber: payAccountNumber.trim(),
      accountHolderName: payAccountHolder.trim() || 'مدير المنصة',
      currency: payCurrency,
      instructions: payInstructions.trim(),
      transferFeePercent: payFeePercent,
      isOnlineGateway: payIsOnline,
      gatewayApiKey: payApiKey.trim() || undefined,
      gatewaySecretKey: paySecretKey.trim() || undefined,
      gatewayMerchantId: payMerchantId.trim() || undefined,
      isActive: payIsActive,
      createdAt: editingPaymentMethod ? editingPaymentMethod.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newMethods: PlatformPaymentMethod[];
    if (editingPaymentMethod) {
      newMethods = platformSettings.paymentMethods.map(m => m.id === editingPaymentMethod.id ? updatedMethod : m);
    } else {
      newMethods = [updatedMethod, ...platformSettings.paymentMethods];
    }

    const updatedSettings: PlatformSettings = {
      ...platformSettings,
      paymentMethods: newMethods
    };

    saveSettings(updatedSettings, 'تم تحديث طرق وبوابات الدفع بنجاح!');
    setIsPaymentModalOpen(false);
  };

  const handleTogglePaymentStatus = (methodId: string) => {
    const updatedMethods = platformSettings.paymentMethods.map(m =>
      m.id === methodId ? { ...m, isActive: !m.isActive, updatedAt: new Date().toISOString() } : m
    );
    saveSettings({ ...platformSettings, paymentMethods: updatedMethods }, 'تم تحديث حالة طريقة الدفع!');
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;
    const updatedMethods = platformSettings.paymentMethods.filter(m => m.id !== methodId);
    saveSettings({ ...platformSettings, paymentMethods: updatedMethods }, 'تم حذف طريقة الدفع بنجاح!');
  };

  // -------------------------------------------------------------
  // Subscription Plans Handlers
  // -------------------------------------------------------------

  const handleOpenPlanModal = (plan?: PlatformSubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanCode(plan.code);
      setPlanNameAr(plan.nameArabic);
      setPlanTagline(plan.tagline);
      setPlanMonthlyPrice(plan.monthlyPrice);
      setPlanYearlyPrice(plan.yearlyPrice);
      setPlanDiscountYearly(plan.discountPercentageYearly || 20);
      setPlanMaxCards(plan.maxCards || 10000);
      setPlanMaxDistributors(plan.maxDistributors || 15);
      setPlanMaxRouters(plan.maxRouters || 5);
      setPlanTrialDays(plan.trialDays || 14);
      setPlanIsRecommended(!!plan.isRecommended);
      setPlanBadgeText(plan.badgeText || '');
      setPlanFeaturesText(plan.features ? plan.features.join('\n') : '');
      setPlanIsActive(plan.isActive);
    } else {
      setEditingPlan(null);
      setPlanCode(`custom_${Date.now()}`);
      setPlanNameAr('');
      setPlanTagline('');
      setPlanMonthlyPrice(20);
      setPlanYearlyPrice(190);
      setPlanDiscountYearly(20);
      setPlanMaxCards(5000);
      setPlanMaxDistributors(10);
      setPlanMaxRouters(3);
      setPlanTrialDays(14);
      setPlanIsRecommended(false);
      setPlanBadgeText('');
      setPlanFeaturesText('طباعة كروت A4 بدقة متناهية\nإدارة الموزعين ونقاط البيع\nمزامنة المايكروتك السحابية\nدعم فني مستمر');
      setPlanIsActive(true);
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planNameAr.trim()) return;

    const featuresList = planFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const updatedPlan: PlatformSubscriptionPlan = {
      id: editingPlan ? editingPlan.id : `plan_${Date.now()}`,
      code: planCode.trim().toLowerCase(),
      nameArabic: planNameAr.trim(),
      nameEnglish: editingPlan ? editingPlan.nameEnglish : planNameAr.trim(),
      tagline: planTagline.trim(),
      monthlyPrice: Number(planMonthlyPrice),
      yearlyPrice: Number(planYearlyPrice),
      currency: 'USD',
      discountPercentageYearly: Number(planDiscountYearly),
      maxCards: Number(planMaxCards),
      maxDistributors: Number(planMaxDistributors),
      maxRouters: Number(planMaxRouters),
      trialDays: Number(planTrialDays),
      isRecommended: planIsRecommended,
      badgeText: planBadgeText.trim() || undefined,
      colorTheme: editingPlan ? editingPlan.colorTheme : 'emerald',
      features: featuresList,
      isActive: planIsActive,
      sortOrder: editingPlan ? editingPlan.sortOrder : platformSettings.subscriptionPlans.length + 1,
      createdAt: editingPlan ? editingPlan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newPlans: PlatformSubscriptionPlan[];
    if (editingPlan) {
      newPlans = platformSettings.subscriptionPlans.map(p => p.id === editingPlan.id ? updatedPlan : p);
    } else {
      newPlans = [...platformSettings.subscriptionPlans, updatedPlan];
    }

    saveSettings({ ...platformSettings, subscriptionPlans: newPlans }, 'تم تحديث خطط وباقات المشتركين بنجاح!');
    setIsPlanModalOpen(false);
  };

  const handleTogglePlanStatus = (planId: string) => {
    const updatedPlans = platformSettings.subscriptionPlans.map(p =>
      p.id === planId ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
    );
    saveSettings({ ...platformSettings, subscriptionPlans: updatedPlans }, 'تم تعديل حالة الباقة!');
  };

  const handleDeletePlan = (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    const updatedPlans = platformSettings.subscriptionPlans.filter(p => p.id !== planId);
    saveSettings({ ...platformSettings, subscriptionPlans: updatedPlans }, 'تم حذف الباقة بنجاح!');
  };

  // -------------------------------------------------------------
  // Contact & Brand Settings Handlers
  // -------------------------------------------------------------

  const handleUpdateContactField = (field: keyof PlatformContactSettings, val: any) => {
    setPlatformSettings(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: val
      }
    }));
  };

  const handleSaveContactSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(platformSettings, 'تم حفظ معلومات التواصل والدعم الفني بنجاح!');
  };

  // -------------------------------------------------------------
  // Platform Admins Handlers
  // -------------------------------------------------------------

  const handleAddAdminUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    const email = newAdminEmail.trim().toLowerCase();
    if (platformSettings.admins.some(a => a.email.toLowerCase() === email)) {
      alert('هذا البريد الإلكتروني مسجل مسبقاً في قائمة المدراء.');
      return;
    }

    const roleArabicMap = {
      super_admin: 'مدير عام كامل الصلاحيات',
      finance_admin: 'مدير المالية والاشتراكات',
      support_admin: 'مدير الدعم الفني والمشتركين'
    };

    const newAdmin: PlatformAdminUser = {
      id: `admin_${Date.now()}`,
      email,
      name: newAdminName.trim() || email.split('@')[0],
      role: newAdminRole,
      roleArabic: roleArabicMap[newAdminRole],
      isActive: true,
      addedBy: 'mosthassan.ye@gmail.com (Super Admin)',
      createdAt: new Date().toISOString()
    };

    const updatedAdmins = [...platformSettings.admins, newAdmin];
    saveSettings({ ...platformSettings, admins: updatedAdmins }, `تم إضافة المدير (${email}) ومنحه الصلاحيات!`);
    setIsAdminModalOpen(false);
    setNewAdminEmail('');
    setNewAdminName('');
  };

  const handleToggleAdminStatus = (adminId: string) => {
    const target = platformSettings.admins.find(a => a.id === adminId);
    if (target?.email.toLowerCase() === 'mosthassan.ye@gmail.com') {
      alert('لا يمكن تجميد أو تعديل حساب السوبر أدمن الرئيسي للمنصة.');
      return;
    }

    const updatedAdmins = platformSettings.admins.map(a =>
      a.id === adminId ? { ...a, isActive: !a.isActive } : a
    );
    saveSettings({ ...platformSettings, admins: updatedAdmins }, 'تم تحديث حالة حساب المدير!');
  };

  const handleDeleteAdmin = (adminId: string) => {
    const target = platformSettings.admins.find(a => a.id === adminId);
    if (target?.email.toLowerCase() === 'mosthassan.ye@gmail.com') {
      alert('لا يمكن حذف المالك والسوبر أدمن الأساسي.');
      return;
    }
    if (!confirm(`هل أنت متأكد من سحب الصلاحيات وحذف المدير "${target?.email}"؟`)) return;

    const updatedAdmins = platformSettings.admins.filter(a => a.id !== adminId);
    saveSettings({ ...platformSettings, admins: updatedAdmins }, 'تم سحب الصلاحيات وحذف المدير بنجاح!');
  };

  // Compute Platform-wide KPIs
  const totalNetworks = tenants.length;
  const activeNetworks = tenants.filter(t => t.status !== 'suspended').length;
  const totalCardsPrinted = tenants.reduce((acc, t) => acc + (t.totalCardsCount || 1200), 0);
  const totalActiveDistributors = tenants.reduce((acc, t) => acc + (t.activeDistributorsCount || 3), 0);
  const totalSubscriptionsMRR = tenants.reduce((acc, t) => {
    const paid = t.subscription?.pricePaid || 15;
    return acc + paid;
  }, 0);

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ownerEmail && t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? t.status !== 'suspended'
        : t.status === 'suspended';

    const matchesPlan =
      planFilter === 'all' ? true : t.subscription?.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Impersonation Banner if Active */}
      {impersonatedTenantId && (
        <div className="p-4 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-2 border-amber-500/80 rounded-2xl text-amber-200 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">
              ⚠️
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-white">
                أنت الآن في وضع الدعم الفني المباشر لشبكة: &quot;{currentTenant.businessName}&quot;
              </div>
              <div className="text-xs text-amber-300">
                يتم عرض بيانات الكروت والموزعين والفواتير الخاصة بالشبكة للتشخيص والدعم الفني.
              </div>
            </div>
          </div>

          <button
            onClick={onExitImpersonation}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-xl transition transform active:scale-95"
          >
            الرجوع إلى لوحة السوبر أدمن 👑
          </button>
        </div>
      )}

      {/* Super Admin Master Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Master Super Admin Control Center • صلاحيات الإدارة الشاملة (mosthassan.ye@gmail.com)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              لوحة تحكم الإدارة العليا لمنظومة NetFlow SaaS
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              تحكم مركزي شامل: إدارة شبكات المشتركين، تعديل وإضافة طرق وبوابات الدفع، أسعار وتفاصيل الباقات، معلومات التواصل والدعم الفني، وتعيين صلاحيات المدراء.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadTenants();
                loadPlatformConfig();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition text-xs font-bold"
              title="تحديث البيانات السحابية"
            >
              <RotateCcw className={`w-4 h-4 ${(loadingTenants || loadingSettings || isSavingGlobal) ? 'animate-spin' : ''}`} />
              <span>مزامنة</span>
            </button>
          </div>
        </div>

        {/* Global Save Status Alert */}
        {saveSettingsStatus && (
          <div
            className={`mt-4 p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in ${
              saveSettingsStatus.success
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveSettingsStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{saveSettingsStatus.msg}</span>
            </div>
            <button onClick={() => setSaveSettingsStatus(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-slate-800/80 pt-4 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
              activeTab === 'tenants'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>شبكات المشتركين ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>طرق وبوابات الدفع ({platformSettings.paymentMethods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>باقات واشتراكات المنصة ({platformSettings.subscriptionPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
              activeTab === 'contact'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>معلومات التواصل والدعم</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>مدراء المنصة والصلاحيات ({platformSettings.admins.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TENANTS & SUBSCRIBERS */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Global KPIs Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">إجمالي الشبكات المشتركة</div>
                <div className="text-2xl font-black text-white mt-1">
                  {totalNetworks}{' '}
                  <span className="text-xs font-normal text-emerald-400">({activeNetworks} نشطة)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">في مختلف المدن والمحافظات</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">إجمالي الكروت المطبوعة</div>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {totalCardsPrinted.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">عبر محرك NetFlow السحابي</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">الموزعين ونقاط البيع</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {totalActiveDistributors} <span className="text-xs font-normal text-slate-400">نقطة</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">تطبيق الموزع الميداني السريع</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">عوائد الاشتراكات التقديرية</div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  ${totalSubscriptionsMRR.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">خطط Starter / Pro / Enterprise</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Directory & Management Table Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="البحث باسم الشبكة، المالك، البريد، أو الهاتف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-9 pl-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة شبكة جديدة</span>
                </button>

                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'active' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    النشطة
                  </button>
                  <button
                    onClick={() => setStatusFilter('suspended')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'suspended' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    المجمدة
                  </button>
                </div>

                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كافة الباقات</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">اسم الشبكة والمالك</th>
                    <th className="py-3 px-3">بيانات الاتصال</th>
                    <th className="py-3 px-3">خطة الاشتراك</th>
                    <th className="py-3 px-3">حدود الكروت والموزعين</th>
                    <th className="py-3 px-3">حالة الحساب</th>
                    <th className="py-3 px-3">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 text-center">إجراءات السوبر أدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        لم يتم العثور على شبكات مطابقة لمعايير البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(tenant => {
                      const isCurrent = tenant.id === currentTenant.id;
                      const isSuspended = tenant.status === 'suspended';
                      const sub = tenant.subscription || {
                        plan: 'starter',
                        planNameArabic: 'Starter',
                        status: 'active',
                        maxCards: 3000,
                        maxDistributors: 5,
                        expiresAt: '2026-12-31T00:00:00Z',
                        billingPeriod: 'monthly'
                      };

                      const planBadgeClass =
                        sub.plan === 'enterprise'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : sub.plan === 'pro'
                          ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700';

                      return (
                        <tr
                          key={tenant.id}
                          className={`hover:bg-slate-800/40 transition ${
                            isCurrent ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                                {tenant.businessName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{tenant.businessName}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-md">
                                      الحالية
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {tenant.ownerName}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-mono text-slate-200">{tenant.phone}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {tenant.ownerEmail || '—'}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${planBadgeClass}`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{sub.planNameArabic || sub.plan}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-[11px]">
                            <div className="text-slate-200">
                              كروت: <span className="font-mono font-bold text-sky-400">{sub.maxCards?.toLocaleString() || '10,000'}</span>
                            </div>
                            <div className="text-slate-400">
                              موزعين: <span className="font-mono font-bold text-emerald-400">{sub.maxDistributors || '15'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isSuspended
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  <span>مجمد</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>نشط</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-[11px] font-mono text-slate-400">
                            {sub.expiresAt ? sub.expiresAt.substring(0, 10) : '2026-12-31'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onImpersonateTenant(tenant)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition text-[11px] font-bold"
                                title="وضع الدعم الفني - تصفح الشبكة بصلاحيات المالك"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>دعم فني</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(tenant)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl transition"
                                title="تعديل الخطة والحدود والانتهاء"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleTenantStatus(tenant)}
                                className={`p-1.5 rounded-xl border transition ${
                                  isSuspended
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                                    : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
                                }`}
                                title={isSuspended ? 'إلغاء التجميد والتفعيل' : 'تجميد الاشتراك'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT METHODS & GATEWAYS */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>طرق وبوابات الدفع الإلكتروني والتحويل</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة وتعديل حسابات التحويل البنكي، المحافظ الإلكترونية، بوابات الدفع، وعناوين الكريبتو USDT المعروضة للمشتركين.
                </p>
              </div>

              <button
                onClick={() => handleOpenPaymentModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-950/50 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طريقة دفع جديدة</span>
              </button>
            </div>

            {/* Methods Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformSettings.paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                    method.isActive
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: method.isActive ? '#10b981' : '#64748b' }}
                          />
                          <span>{method.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 mt-1 inline-block">
                          {method.category === 'bank_transfer'
                            ? 'تحويل بنكي'
                            : method.category === 'e_wallet'
                            ? 'محفظة إلكترونية'
                            : method.category === 'crypto'
                            ? 'عملة رقمية USDT'
                            : method.category === 'online_gateway'
                            ? 'بوابة دفع إلكتروني مباشر'
                            : 'حوالة مصرفية'}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                        {method.currency}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="text-[10px] text-slate-400">رقم الحساب / المحفظة / العنوان:</div>
                      <div className="font-mono font-bold text-sky-400 text-sm select-all break-all">
                        {method.accountNumber}
                      </div>
                      <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-slate-400">المستفيد:</span>
                        <span className="font-bold text-white">{method.accountHolderName}</span>
                      </div>
                    </div>

                    {method.instructions && (
                      <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                        {method.instructions}
                      </div>
                    )}

                    {method.isOnlineGateway && (
                      <div className="p-2 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400" />
                        <span>بوابة تأكيد مباشر (API Active)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePaymentStatus(method.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          method.isActive
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {method.isActive ? 'مفعلة للمشتركين' : 'معطلة'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPaymentModal(method)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl border border-slate-700 transition"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-xl border border-rose-500/30 transition"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUBSCRIPTION PLANS & PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>خطط وباقات اشتراكات المنصة وأسعارها</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تعديل أسعار الباقات الشهرية والسنوية، حدود الكروت والموزعين، وإضافة ميزات جديدة لكل باقة.
                </p>
              </div>

              <button
                onClick={() => handleOpenPlanModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-amber-950/50 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باقة جديدة</span>
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platformSettings.subscriptionPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
                    plan.isRecommended
                      ? 'bg-slate-950 border-amber-500/50 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-lg text-white flex items-center gap-2">
                          <span>{plan.nameArabic}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{plan.code}</span>
                      </div>

                      {plan.badgeText && (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-bold">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {plan.tagline}
                    </p>

                    {/* Pricing */}
                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white font-mono">${plan.monthlyPrice}</span>
                        <span className="text-xs text-slate-400">/ شهرياً</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-amber-400 font-bold border-t border-slate-800 pt-1.5">
                        <span>الاشتراك السنوي:</span>
                        <span className="font-mono text-sm">${plan.yearlyPrice}</span>
                      </div>
                    </div>

                    {/* Limits Specs */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-[10px]">
                      <div>
                        <div className="text-slate-400">كروت شهرياً</div>
                        <div className="font-bold text-sky-400 font-mono text-xs mt-0.5">{plan.maxCards?.toLocaleString()}</div>
                      </div>
                      <div className="border-x border-slate-800">
                        <div className="text-slate-400">الموزعين</div>
                        <div className="font-bold text-emerald-400 font-mono text-xs mt-0.5">{plan.maxDistributors}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">الراوترات</div>
                        <div className="font-bold text-amber-400 font-mono text-xs mt-0.5">{plan.maxRouters}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">الميزات المتضمنة:</span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {plan.features?.slice(0, 5).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                        {plan.features?.length > 5 && (
                          <li className="text-[10px] text-slate-500 font-bold">
                            + {plan.features.length - 5} ميزات إضافية أخرى
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => handleTogglePlanStatus(plan.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                        plan.isActive
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {plan.isActive ? 'متاحة للاشتراك' : 'معطلة مؤقتاً'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPlanModal(plan)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl border border-slate-700 transition"
                        title="تعديل تفاصيل الباقة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-xl border border-rose-500/30 transition"
                        title="حذف الباقة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONTACT & SUPPORT SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-400" />
              <span>معلومات التواصل والدعم الفني والهوية البصرية</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تعديل أرقام الواتساب المباشرة، الهاتف، البريد الإلكتروني، قنوات التلجرام، والشريط الترويجي المعروض لجميع المشتركين.
            </p>
          </div>

          <form onSubmit={handleSaveContactSettings} className="space-y-6 text-xs font-sans">
            {/* Top Announcement Banner Toggle */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-sm">شريط الإعلانات والتنبيهات العلوي للمنصة</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.contact.isNoticeBannerActive}
                    onChange={e => handleUpdateContactField('isNoticeBannerActive', e.target.checked)}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  <span className="text-slate-300 font-bold">تفعيل الشريط العلوي</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نص الرسالة الترويجية / التنبيه:</label>
                <input
                  type="text"
                  value={platformSettings.contact.noticeBannerText || ''}
                  onChange={e => handleUpdateContactField('noticeBannerText', e.target.value)}
                  placeholder="مثال: خصم خاص 25% على الاشتراكات السنوية مع دعم فني VIP مجاني!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Brand & Platform Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المنصة التجاري *</label>
                <input
                  type="text"
                  required
                  value={platformSettings.contact.brandName}
                  onChange={e => handleUpdateContactField('brandName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الشعار والوصف المختصر</label>
                <input
                  type="text"
                  value={platformSettings.contact.brandTagline}
                  onChange={e => handleUpdateContactField('brandTagline', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Contact Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم الواتساب المباشر للدعم *</span>
                </label>
                <input
                  type="text"
                  required
                  value={platformSettings.contact.whatsappNumber}
                  onChange={e => handleUpdateContactField('whatsappNumber', e.target.value)}
                  placeholder="+967 777 123 456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>هاتف الاتصال والخط الساخن</span>
                </label>
                <input
                  type="text"
                  value={platformSettings.contact.phoneCall}
                  onChange={e => handleUpdateContactField('phoneCall', e.target.value)}
                  placeholder="+967 777 123 456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>البريد الإلكتروني الرسمي *</span>
                </label>
                <input
                  type="email"
                  required
                  value={platformSettings.contact.supportEmail}
                  onChange={e => handleUpdateContactField('supportEmail', e.target.value)}
                  placeholder="mosthassan.ye@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Telegram & Web Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط قناة التلجرام</label>
                <input
                  type="text"
                  value={platformSettings.contact.telegramChannel || ''}
                  onChange={e => handleUpdateContactField('telegramChannel', e.target.value)}
                  placeholder="https://t.me/netflow_saas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">معرف تلجرام الدعم الفني</label>
                <input
                  type="text"
                  value={platformSettings.contact.telegramUser || ''}
                  onChange={e => handleUpdateContactField('telegramUser', e.target.value)}
                  placeholder="@NetFlowSupport"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط الموقع الرسمي</label>
                <input
                  type="text"
                  value={platformSettings.contact.websiteUrl}
                  onChange={e => handleUpdateContactField('websiteUrl', e.target.value)}
                  placeholder="https://netflow.samtech.net"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Working Hours & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">أوقات وساعات العمل والدوام</label>
                <input
                  type="text"
                  value={platformSettings.contact.workingHours}
                  onChange={e => handleUpdateContactField('workingHours', e.target.value)}
                  placeholder="السبت - الخميس: 8:00 صباحاً - 10:00 مساءً"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان المقر / المكتب</label>
                <input
                  type="text"
                  value={platformSettings.contact.officeAddress}
                  onChange={e => handleUpdateContactField('officeAddress', e.target.value)}
                  placeholder="اليمن - صنعاء - شارع حدة - مركز التقنية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingGlobal}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-950/50 transition transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingGlobal ? 'جاري الحفظ السحابي...' : 'حفظ معلومات التواصل والدعم'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLATFORM ADMINS & RBAC */}
      {/* ========================================================================= */}
      {activeTab === 'admins' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>إدارة مدراء المنصة وصلاحيات الوصول</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                إضافة مستخدمين وبريد إلكتروني لمنحهم صلاحيات الإدارة العليا أو الدعم الفني، مع تأكيد أمان القواعد السحابية.
              </p>
            </div>

            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-950/50 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مدير جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">اسم المدير</th>
                  <th className="py-3.5 px-3">البريد الإلكتروني</th>
                  <th className="py-3.5 px-3">نوع الصلاحية</th>
                  <th className="py-3.5 px-3">الحالة</th>
                  <th className="py-3.5 px-3">أضيف بواسطة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {platformSettings.admins.map(admin => {
                  const isPrimary = admin.email.toLowerCase() === 'mosthassan.ye@gmail.com';
                  return (
                    <tr key={admin.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <span>{admin.name}</span>
                        {isPrimary && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-bold">
                            Root Owner 👑
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-200">
                        {admin.email}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold">
                          {admin.roleArabic || admin.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          admin.isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                        }`}>
                          {admin.isActive ? 'مفعل نشط' : 'معطل'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-slate-400">
                        {admin.addedBy || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {!isPrimary ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleAdminStatus(admin.id)}
                              className={`p-1.5 rounded-xl border transition ${
                                admin.isActive
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                              }`}
                              title={admin.isActive ? 'تعطيل الصلاحية' : 'تفعيل'}
                            >
                              {admin.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-xl border border-rose-500/40 transition"
                              title="حذف المدير"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">محمي دائم</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PAYMENT METHOD */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingPaymentMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة / بوابة دفع جديدة'}
                  </h2>
                  <p className="text-xs text-slate-400">تخصيص بيانات الحسابات والتحويل للمشتركين</p>
                </div>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم طريقة الدفع / البنك *</label>
                <input
                  type="text"
                  required
                  value={payName}
                  onChange={e => setPayName(e.target.value)}
                  placeholder="مثال: بنك الكريمي / محفظة جوالي / PayPal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">التصنيف</label>
                  <select
                    value={payCategory}
                    onChange={e => setPayCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="bank_transfer">حساب بنكي محلي</option>
                    <option value="e_wallet">محفظة إلكترونية</option>
                    <option value="crypto">عملات رقمية USDT</option>
                    <option value="online_gateway">بوابة دفع إلكتروني دولية</option>
                    <option value="cash_remittance">حوالة صرافة نقدية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">العملة المقبولة</label>
                  <select
                    value={payCurrency}
                    onChange={e => setPayCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USDT">تيذر رقمي (USDT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الحساب / رقم المحفظة / العنوان الرقمي *</label>
                <input
                  type="text"
                  required
                  value={payAccountNumber}
                  onChange={e => setPayAccountNumber(e.target.value)}
                  placeholder="3001234567 / 777123456 / TY7x..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المستفيد / صاحب الحساب</label>
                <input
                  type="text"
                  value={payAccountHolder}
                  onChange={e => setPayAccountHolder(e.target.value)}
                  placeholder="م. مصطفى حسن"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تعليمات التحويل وإرسال الإشعار</label>
                <textarea
                  rows={2}
                  value={payInstructions}
                  onChange={e => setPayInstructions(e.target.value)}
                  placeholder="يرجى إرسال صورة إشعار التحويل عبر الواتساب لتفعيل الاشتراك فوراً."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Online Gateway Keys Toggle */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold">
                  <input
                    type="checkbox"
                    checked={payIsOnline}
                    onChange={e => setPayIsOnline(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span>بوابة دفع إلكتروني مباشر وتأكيد فوري (Online API Gateway)</span>
                </label>

                {payIsOnline && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Merchant ID / معرف التاجر</label>
                      <input
                        type="text"
                        value={payMerchantId}
                        onChange={e => setPayMerchantId(e.target.value)}
                        placeholder="MERCHANT_ID"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">API Key / المفتاح العام</label>
                      <input
                        type="text"
                        value={payApiKey}
                        onChange={e => setPayApiKey(e.target.value)}
                        placeholder="pk_live_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  حفظ طريقة الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUBSCRIPTION PLAN */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingPlan ? `تعديل باقة: ${editingPlan.nameArabic}` : 'إنشاء باقة اشتراك جديدة'}
                  </h2>
                  <p className="text-xs text-slate-400">تحديد الأسعار الشهرية والسنوية وحدود الكروت والموزعين</p>
                </div>
              </div>

              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الباقة بالعربي *</label>
                  <input
                    type="text"
                    required
                    value={planNameAr}
                    onChange={e => setPlanNameAr(e.target.value)}
                    placeholder="مثال: باقة المحترفين (Pro)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رمز الباقة الإنجليزي (Code)</label>
                  <input
                    type="text"
                    required
                    value={planCode}
                    onChange={e => setPlanCode(e.target.value)}
                    placeholder="starter / pro / enterprise"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الوصف المختصر للباقة</label>
                <input
                  type="text"
                  value={planTagline}
                  onChange={e => setPlanTagline(e.target.value)}
                  placeholder="مثال: الخيار الأكثر كفاءة للشبكات المتوسطة والنشطة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">السعر الشهري ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={planMonthlyPrice}
                    onChange={e => setPlanMonthlyPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">السعر السنوي ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={planYearlyPrice}
                    onChange={e => setPlanYearlyPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">أقصى كروت</label>
                  <input
                    type="number"
                    value={planMaxCards}
                    onChange={e => setPlanMaxCards(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">أقصى موزعين</label>
                  <input
                    type="number"
                    value={planMaxDistributors}
                    onChange={e => setPlanMaxDistributors(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">أقصى راوترات</label>
                  <input
                    type="number"
                    value={planMaxRouters}
                    onChange={e => setPlanMaxRouters(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">شارة ترويجية (Badge)</label>
                  <input
                    type="text"
                    value={planBadgeText}
                    onChange={e => setPlanBadgeText(e.target.value)}
                    placeholder="الأكثر طلباً ⭐"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold">
                    <input
                      type="checkbox"
                      checked={planIsRecommended}
                      onChange={e => setPlanIsRecommended(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>تمييز كباقة موصى بها</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">قائمة الميزات (سطر لكل ميزة):</label>
                <textarea
                  rows={4}
                  value={planFeaturesText}
                  onChange={e => setPlanFeaturesText(e.target.value)}
                  placeholder="طباعة حتى 12,000 كرت شهرياً&#10;إدارة 20 نقطة بيع&#10;مزامنة مايكروتك أوفلاين"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  حفظ الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ADMIN USER */}
      {/* ========================================================================= */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">إضافة مدير وصلاحيات جديدة</h2>
                  <p className="text-xs text-slate-400">منح مستخدم صلاحيات الإدارة العليا أو الدعم</p>
                </div>
              </div>

              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdminUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني للمدير (Gmail) *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="admin.support@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المدير / المسمى</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  placeholder="مثال: م. أحمد (دعم فني)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع الصلاحية الممنوحة</label>
                <select
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="super_admin">سوبر أدمن (صلاحيات كاملة لكافة الإعدادات)</option>
                  <option value="finance_admin">مدير مالية (إدارة الباقات وطرق الدفع والاشتراكات)</option>
                  <option value="support_admin">مدير دعم فني (تصفح الشبكات والدعم الفني للمشتركين)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  منح الصلاحيات وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TENANT SUBSCRIPTION & LIMITS */}
      {/* ========================================================================= */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    تعديل اشتراك: {editingTenant.businessName}
                  </h2>
                  <p className="text-xs text-slate-400">إدارة الباقة وتاريخ الصلاحية والحدود القصوى</p>
                </div>
              </div>

              <button
                onClick={() => setEditingTenant(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="p-5 space-y-4 text-xs">
              {subSuccessMsg && (
                <div className="p-3 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{subSuccessMsg}</span>
                </div>
              )}

              {/* Plan Tier Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">فئة الباقة (Plan Tier)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan('starter');
                      setMaxCards(3000);
                      setMaxDistributors(5);
                    }}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedPlan === 'starter'
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Starter</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">3,000 كرت</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan('pro');
                      setMaxCards(10000);
                      setMaxDistributors(15);
                    }}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedPlan === 'pro'
                        ? 'bg-sky-950/60 border-sky-500 text-sky-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Pro</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">10,000 كرت</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan('enterprise');
                      setMaxCards(50000);
                      setMaxDistributors(50);
                    }}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedPlan === 'enterprise'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Enterprise</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">50,000 كرت</div>
                  </button>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">حالة الحساب</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === 'active'}
                      onChange={() => setSelectedStatus('active')}
                      className="accent-emerald-500"
                    />
                    <span>نشط (Active)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === 'suspended'}
                      onChange={() => setSelectedStatus('suspended')}
                      className="accent-rose-500"
                    />
                    <span>تجميد الحساب (Suspended)</span>
                  </label>
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الحد الأقصى للكروت</label>
                  <input
                    type="number"
                    value={maxCards}
                    onChange={e => setMaxCards(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الحد الأقصى للموزعين</label>
                  <input
                    type="number"
                    value={maxDistributors}
                    onChange={e => setMaxDistributors(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Expiration Date & Quick Extension */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">تاريخ انتهاء الاشتراك</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400">تمديد سريع:</span>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(30)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[10px] font-bold"
                  >
                    +30 يوم
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(90)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[10px] font-bold"
                  >
                    +3 أشهر
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(365)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[10px] font-bold"
                  >
                    +سنة كاملة
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingSub}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30 disabled:opacity-50"
                >
                  {isSavingSub ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW TENANT */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">تسجيل شبكة إنترنت جديدة</h2>
                  <p className="text-xs text-slate-400">إضافة مستأجر جديد إلى منصة NetFlow SaaS</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الشبكة التجاري *</label>
                <input
                  type="text"
                  required
                  value={newBizName}
                  onChange={e => setNewBizName(e.target.value)}
                  placeholder="مثال: شبكة الأمل واي فاي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المالك / المدير</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                  placeholder="مثال: م. علي صالح"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newOwnerEmail}
                  onChange={e => setNewOwnerEmail(e.target.value)}
                  placeholder="ali.owner@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="771122334"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">باقة الاشتراك</label>
                <select
                  value={newPlan}
                  onChange={e => setNewPlan(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="starter">باقة المبتدئين (Starter - 3,000 كرت)</option>
                  <option value="pro">باقة المحترفين (Pro - 10,000 كرت)</option>
                  <option value="enterprise">الباقة اللامحدودة (Enterprise - 50,000 كرت)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  إنشاء الشبكة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

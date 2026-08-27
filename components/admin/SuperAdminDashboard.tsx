'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, TenantSubscription, Currency } from '@/types';
import {
  fetchAllTenants,
  updateTenantSubscription,
  updateTenantStatus
} from '@/lib/firestore-service';
import { formatCurrency } from '@/lib/formatters';
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
  DollarSign
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentTenant: Tenant;
  onImpersonateTenant: (tenant: Tenant) => void;
  impersonatedTenantId?: string | null;
  onExitImpersonation?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentTenant,
  onImpersonateTenant,
  impersonatedTenantId,
  onExitImpersonation
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Create Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlan, setNewPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const list = await fetchAllTenants();
      setTenants(list);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

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
    setSelectedPlan(sub.plan);
    setSelectedStatus(sub.status === 'suspended' ? 'suspended' : 'active');
    setMaxCards(sub.maxCards || 10000);
    setMaxDistributors(sub.maxDistributors || 15);
    setExpiresAt(sub.expiresAt ? sub.expiresAt.substring(0, 10) : '2026-12-31');
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    const planNames: Record<string, string> = {
      starter: 'باقة المبتدئين (Starter)',
      pro: 'باقة المحترفين (Pro)',
      enterprise: 'الباقة اللامحدودة (Enterprise)'
    };

    const updatedSub: TenantSubscription = {
      plan: selectedPlan,
      planNameArabic: planNames[selectedPlan] || 'باقة مخصصة',
      status: selectedStatus,
      maxCards,
      maxDistributors,
      expiresAt: new Date(expiresAt).toISOString(),
      billingPeriod: editingTenant.subscription?.billingPeriod || 'yearly',
      pricePaid: editingTenant.subscription?.pricePaid || 0
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
      setSaveSuccessMsg('تم تحديث بيانات الاشتراك وحدود الاستخدام بنجاح!');
      setTimeout(() => {
        setEditingTenant(null);
        setSaveSuccessMsg('');
      }, 1500);
    } else {
      alert(res.error || 'حدث خطأ أثناء الحفظ');
    }
    setIsSaving(false);
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
    const planNames: Record<string, string> = {
      starter: 'باقة المبتدئين (Starter)',
      pro: 'باقة المحترفين (Pro)',
      enterprise: 'الباقة اللامحدودة (Enterprise)'
    };
    const maxCardsMap = { starter: 3000, pro: 10000, enterprise: 50000 };
    const maxDistMap = { starter: 5, pro: 15, enterprise: 50 };

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
        planNameArabic: planNames[newPlan],
        status: 'active',
        maxCards: maxCardsMap[newPlan],
        maxDistributors: maxDistMap[newPlan],
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        billingPeriod: 'yearly',
        pricePaid: newPlan === 'enterprise' ? 250 : newPlan === 'pro' ? 120 : 15
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
              <span>Master Super Admin Control Center • صلاحيات الإدارة الشاملة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              لوحة السوبر أدمن وإدارة المشتركين
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إدارة كافة شبكات الإنترنت المشتركة في المنصة، التحكم بخطط الاشتراكات والصلاحيات، ومتابعة نمو الكروت والموزعين مع ميزة الدعم الفني وانتحال الشخصية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/50 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شبكة جديدة</span>
            </button>

            <button
              onClick={loadTenants}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition"
              title="تحديث البيانات"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Networks */}
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

        {/* KPI 2: Total Hotspot Cards Printed */}
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

        {/* KPI 3: Active Field Distributors */}
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

        {/* KPI 4: Platform Subscriptions MRR */}
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
        {/* Controls: Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
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

            {/* Plan Filter */}
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

        {/* Directory Table */}
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
                      {/* Name & Owner */}
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

                      {/* Contact Info */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-slate-200">{tenant.phone}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {tenant.ownerEmail || '—'}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${planBadgeClass}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{sub.planNameArabic || sub.plan}</span>
                        </span>
                      </td>

                      {/* Limits */}
                      <td className="py-3.5 px-3 text-[11px]">
                        <div className="text-slate-200">
                          كروت: <span className="font-mono font-bold text-sky-400">{sub.maxCards?.toLocaleString() || '10,000'}</span>
                        </div>
                        <div className="text-slate-400">
                          موزعين: <span className="font-mono font-bold text-emerald-400">{sub.maxDistributors || '15'}</span>
                        </div>
                      </td>

                      {/* Status */}
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

                      {/* Expiration */}
                      <td className="py-3.5 px-3 text-[11px] font-mono text-slate-400">
                        {sub.expiresAt ? sub.expiresAt.substring(0, 10) : '2026-12-31'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Impersonate Button */}
                          <button
                            onClick={() => onImpersonateTenant(tenant)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition text-[11px] font-bold"
                            title="وضع الدعم الفني - تصفح الشبكة بصلاحيات المالك"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>دعم فني</span>
                          </button>

                          {/* Edit Subscription */}
                          <button
                            onClick={() => handleOpenEditModal(tenant)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl transition"
                            title="تعديل الخطة والحدود والانتهاء"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status */}
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

      {/* EDIT SUBSCRIPTION & PLAN MODAL */}
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
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
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

                {/* Quick Extend Buttons */}
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

              {/* Modal Actions */}
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
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW TENANT MODAL */}
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

'use client';

import React, { useMemo } from 'react';
import {
  Tenant,
  Profile,
  CardBatch,
  Card,
  Agent,
  Invoice,
  PaymentTransaction
} from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  CreditCard,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PlusCircle,
  Printer,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  Zap,
  Users,
  Crown,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

interface DashboardOverviewProps {
  tenant: Tenant;
  profiles: Profile[];
  batches: CardBatch[];
  cards: Card[];
  agents: Agent[];
  invoices: Invoice[];
  payments: PaymentTransaction[];
  onNavigate: (tab: string) => void;
  onOpenNewInvoiceModal: () => void;
  onOpenNewPaymentModal: () => void;
  onOpenSubscriptionModal?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tenant,
  profiles,
  batches,
  cards,
  agents,
  invoices,
  payments,
  onNavigate,
  onOpenNewInvoiceModal,
  onOpenNewPaymentModal,
  onOpenSubscriptionModal
}) => {
  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCardsCount = cards.length;
    const inStockCards = cards.filter(c => c.status === 'in_stock').length;
    const distributedCards = cards.filter(c => c.status === 'distributed').length;
    const usedCards = cards.filter(c => c.status === 'used').length;

    const totalDebt = agents.reduce((acc, a) => acc + (a.currentDebt || 0), 0);
    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalWholesaleSales = invoices.reduce((acc, i) => acc + (i.totalWholesale || 0), 0);
    const totalRetailValue = cards.reduce((acc, c) => acc + c.price, 0);

    return {
      totalCardsCount,
      inStockCards,
      distributedCards,
      usedCards,
      totalDebt,
      totalCollected,
      totalWholesaleSales,
      totalRetailValue
    };
  }, [cards, agents, payments, invoices]);

  // Chart Data: Status Pie
  const cardStatusData = useMemo(() => {
    return [
      { name: 'في المخزن العام', value: metrics.inStockCards, color: '#38bdf8' },
      { name: 'موزعة عند البقالات', value: metrics.distributedCards, color: '#f59e0b' },
      { name: 'مستخدمة من المشتركين', value: metrics.usedCards, color: '#10b981' }
    ];
  }, [metrics]);

  // Chart Data: Sales per Profile
  const profileSalesData = useMemo(() => {
    return profiles.map(p => {
      const pCards = cards.filter(c => c.profileId === p.id);
      const inStock = pCards.filter(c => c.status === 'in_stock').length;
      const distributed = pCards.filter(c => c.status === 'distributed' || c.status === 'used').length;
      return {
        name: p.name.split('(')[0].trim(),
        'في المخزن': inStock,
        'في السوق': distributed,
        price: p.price
      };
    });
  }, [profiles, cards]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Welcome Bar & Action Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-bold">الشبكة متصلة بنجاح مع المايكروتك</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            لوحة الإحصائيات والرقابة المركزية
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            متابعة فورية للمخزون، نقاط البيع، مديونيات البقالات، ومطابقة الكروت.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="quick-new-batch-btn"
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-900/30 transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            توليد كروت جديدة
          </button>

          <button
            id="quick-delivery-btn"
            onClick={onOpenNewInvoiceModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            سند تسليم لبقالة
          </button>

          <button
            id="quick-payment-btn"
            onClick={onOpenNewPaymentModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/30 transition transform active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            سند قبض مالي
          </button>
        </div>
      </div>

      {/* Network Owner Plan Status & Upgrade Quick Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 hover:border-amber-500/40 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">اشتراك منصة NetFlow SaaS:</span>
              <span className="text-xs font-black text-amber-400">
                {tenant.subscription?.planNameArabic || 'الخطة المجانية (Starter)'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full border border-emerald-500/30 font-bold">
                نشط ومفعل
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              الخطة الاحترافية ($10/شهر أو $50/سنة) وخطة المؤسسات ($20/شهر أو $100/سنة) تمنحك راوترات وموزعين وكروت غير محدودة.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenSubscriptionModal) {
              onOpenSubscriptionModal();
            } else {
              onNavigate('settings');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-950/40 transition shrink-0 transform active:scale-95"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>ترقية وتفاصيل الباقات</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: In Stock Cards */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">كروت في المخزن العام</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics.inStockCards}
            </span>
            <span className="text-xs text-slate-400 font-medium">كرت جاهز للتسليم</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-sky-400 font-semibold tabular-nums">
              {((metrics.inStockCards / (metrics.totalCardsCount || 1)) * 100).toFixed(0)}%
            </span>
            <span>من إجمالي الكروت المطبوعة</span>
          </div>
        </div>

        {/* KPI 2: Distributed in Market */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الكروت في السوق (البقالات)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400 tabular-nums tracking-tight">
              {metrics.distributedCards + metrics.usedCards}
            </span>
            <span className="text-xs text-slate-400 font-medium">كرت تم توزيعه</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold tabular-nums">{metrics.usedCards} كرت</span>
            <span>تم استخدامه وتسجيل دخوله</span>
          </div>
        </div>

        {/* KPI 3: Outstanding Debt */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الديون المعلقة في السوق</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(metrics.totalDebt, tenant.currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>موزعة على</span>
            <span className="text-rose-300 font-bold tabular-nums">
              {agents.filter(a => a.currentDebt > 0).length} بقالات ومحلات
            </span>
          </div>
        </div>

        {/* KPI 4: Total Collected Revenue */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي التحصيلات النقدية</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(metrics.totalCollected, tenant.currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>إجمالي مبيعات الجملة:</span>
            <span className="text-slate-200 tabular-nums font-bold">
              {formatCurrency(metrics.totalWholesaleSales, tenant.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Card Distribution Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                حالة المخزون والسوق حسب فئات الكروت
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة الكروت المتوفرة في المخزن مع الكروت الموزعة في نقاط البيع
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profileSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    direction: 'rtl'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="في المخزن" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="في السوق" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Cards Status Donut (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm sm:text-base">
              دورة حياة الكروت الحالية
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              نسب الكروت (مخزن / نقاط بيع / مستخدم)
            </p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cardStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cardStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    direction: 'rtl'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white font-mono">
                {metrics.totalCardsCount}
              </span>
              <span className="text-[10px] text-slate-400">إجمالي الكروت</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {cardStatusData.map(item => (
              <div key={item.name} className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-400 truncate">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS Agents & Recent Ledger Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agents with Outstanding Debts (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">
                متابعة أرصدة البقالات ونقاط البيع
              </h3>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              عرض جميع البقالات ←
            </button>
          </div>

          <div className="space-y-2.5">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold">
                    {agent.storeName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{agent.storeName}</h4>
                    <p className="text-xs text-slate-400">{agent.ownerName} • {agent.phone}</p>
                  </div>
                </div>

                <div className="text-left">
                  {agent.currentDebt > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-md text-xs font-mono font-bold">
                        متبقي عليه: {formatCurrency(agent.currentDebt, tenant.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        إجمالي السحب: {formatCurrency(agent.totalPurchases, tenant.currency)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>الحساب مسدد بالكامل</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices & Payments (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">آخر الحركات والسندات</h3>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              سجل السندات ←
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.slice(0, 4).map(inv => (
              <div
                key={inv.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400">{inv.invoiceNumber}</span>
                    <span className="text-slate-300 font-semibold">{inv.agentName}</span>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] text-slate-500 mt-0.5 block">
                    {formatDate(inv.date)}
                  </span>
                </div>

                <div className="text-left font-mono">
                  <span className="font-bold text-white block">
                    {formatCurrency(inv.totalWholesale, tenant.currency)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                      inv.paymentType === 'cash'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : inv.paymentType === 'partial'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {inv.paymentType === 'cash' ? 'سداد نقدي' : inv.paymentType === 'partial' ? 'سداد جزئي' : 'آجل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

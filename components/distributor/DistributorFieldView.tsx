'use client';

import React, { useState, useMemo } from 'react';
import {
  Agent,
  Card,
  Invoice,
  PaymentTransaction,
  Profile,
  Tenant,
  UserProfile
} from '@/types';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import {
  ShoppingBag,
  DollarSign,
  Building2,
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  UserCheck,
  ChevronLeft
} from 'lucide-react';

interface DistributorFieldViewProps {
  tenant: Tenant;
  currentUser: UserProfile;
  agents: Agent[];
  invoices: Invoice[];
  payments: PaymentTransaction[];
  profiles: Profile[];
  cards: Card[];
  onOpenNewInvoiceModal: (agentId?: string) => void;
  onOpenNewPaymentModal: (agentId?: string) => void;
}

export const DistributorFieldView: React.FC<DistributorFieldViewProps> = ({
  tenant,
  currentUser,
  agents,
  invoices,
  payments,
  profiles,
  cards,
  onOpenNewInvoiceModal,
  onOpenNewPaymentModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'agents' | 'invoices' | 'payments' | 'stock'>('agents');

  // Filtered Retailers
  const filteredAgents = useMemo(() => {
    return agents.filter(
      a =>
        a.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.phone.includes(searchTerm) ||
        (a.location && a.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [agents, searchTerm]);

  // Today's summary statistics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayInvoices = useMemo(() => {
    return invoices.filter(inv => inv.date && inv.date.startsWith(todayDateStr));
  }, [invoices, todayDateStr]);

  const todayPayments = useMemo(() => {
    return payments.filter(p => p.date && p.date.startsWith(todayDateStr));
  }, [payments, todayDateStr]);

  const todayCollectedAmount = useMemo(() => {
    return todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [todayPayments]);

  const inStockCount = useMemo(() => {
    return cards.filter(c => c.status === 'in_stock').length;
  }, [cards]);

  return (
    <div className="space-y-5 font-sans" dir="rtl">
      {/* Top Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/80 border border-sky-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 p-0.5 shadow-lg flex items-center justify-center text-white text-lg font-bold">
              {currentUser.name ? currentUser.name.charAt(0) : 'م'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white">
                  أهلاً بك، {currentUser.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                  الموزع الميداني
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {tenant.businessName} • بوابة التوزيع والتحصيل المباشر
              </p>
            </div>
          </div>

          {/* Available Cards Badge */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">الكروت الجاهزة للتسليم:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{inStockCount} كرت</span>
          </div>
        </div>
      </div>

      {/* Primary Touch Actions (Huge Buttons for Field Work) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => onOpenNewInvoiceModal()}
          className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-l from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-950/50 transition transform active:scale-98 group text-right"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg">تسليم كروت لبقالة</div>
              <p className="text-xs text-emerald-100/80 mt-0.5">إنشاء سند تسليم رسمي جديد وخصم الكروت</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 opacity-70 group-hover:-translate-x-1 transition" />
        </button>

        <button
          onClick={() => onOpenNewPaymentModal()}
          className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-l from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-2xl shadow-lg shadow-amber-950/50 transition transform active:scale-98 group text-right"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg">سند قبض وسداد نقدي</div>
              <p className="text-xs text-amber-100/80 mt-0.5">تسجيل دفعة نقدية أو تحويل وتصفير الديون</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 opacity-70 group-hover:-translate-x-1 transition" />
        </button>
      </div>

      {/* Field Performance KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 text-xs block mb-1">تحصيل اليوم</span>
          <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
            {formatCurrency(todayCollectedAmount, tenant.currency)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{todayPayments.length} سندات قبض اليوم</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 text-xs block mb-1">تسليمات اليوم</span>
          <span className="text-lg sm:text-xl font-mono font-black text-sky-400">
            {todayInvoices.length} فواتير
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">عمليات تسليم كروت نشطة</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 text-xs block mb-1">نقاط البيع المسجلة</span>
          <span className="text-lg sm:text-xl font-mono font-black text-amber-400">
            {agents.length} بقالة ومحل
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">شبكة المحلات والموزعين</span>
        </div>
      </div>

      {/* Field Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setSelectedTab('agents')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            selectedTab === 'agents'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>نقاط البيع والبقالات</span>
        </button>

        <button
          onClick={() => setSelectedTab('invoices')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            selectedTab === 'invoices'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سندات التسليم ({invoices.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('payments')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            selectedTab === 'payments'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>سندات القبض ({payments.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('stock')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
            selectedTab === 'stock'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>رصيد الكروت</span>
        </button>
      </div>

      {/* Tab Content 1: Agents & Retailers List */}
      {selectedTab === 'agents' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="البحث باسم البقالة، صاحب المحل، الموقع، أو رقم الهاتف..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      {agent.storeName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      المسؤول: {agent.ownerName}
                    </p>
                    {agent.location && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {agent.location}
                      </p>
                    )}
                  </div>

                  {/* Debt Pill */}
                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-slate-400 block">المديونية الحالية:</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        agent.currentDebt > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(agent.currentDebt, tenant.currency)}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons for this Agent */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  <a
                    href={`tel:${agent.phone}`}
                    className="flex items-center justify-center gap-1 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span>اتصال</span>
                  </a>

                  <a
                    href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 p-2 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>واتساب</span>
                  </a>

                  <button
                    onClick={() => onOpenNewInvoiceModal(agent.id)}
                    className="flex items-center justify-center gap-1 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>تسليم</span>
                  </button>

                  <button
                    onClick={() => onOpenNewPaymentModal(agent.id)}
                    className="flex items-center justify-center gap-1 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>قبض</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Delivery Invoices */}
      {selectedTab === 'invoices' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              سجل سندات وفواتير تسليم الكروت
            </h3>
            <button
              onClick={() => onOpenNewInvoiceModal()}
              className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              + تسليم كروت جديد
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 hover:bg-slate-800/30 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 text-xs">{inv.invoiceNumber}</span>
                    <span className="font-bold text-white text-sm">{inv.agentName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatShortDate(inv.date)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="space-x-2 space-x-reverse">
                    {inv.items.map((it, idx) => (
                      <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {it.profileName}: {it.qty} كرت
                      </span>
                    ))}
                  </div>

                  <div className="font-mono font-bold text-amber-400 text-sm">
                    {formatCurrency(inv.totalWholesale, tenant.currency)}
                  </div>
                </div>

                {inv.remainingDebt > 0 ? (
                  <div className="text-[11px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20 inline-block font-mono">
                    المتبقي آجل: {formatCurrency(inv.remainingDebt, tenant.currency)}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 inline-block font-mono">
                    مسدد نقداً بالكامل
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Payments & Collections */}
      {selectedTab === 'payments' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              سجل سندات القبض والتحصيل النقدي
            </h3>
            <button
              onClick={() => onOpenNewPaymentModal()}
              className="px-3 py-1 bg-amber-600 text-white rounded-xl text-xs font-bold"
            >
              + سند قبض جديد
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {payments.map(pay => (
              <div key={pay.id} className="p-4 hover:bg-slate-800/30 transition flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-xs">{pay.receiptNumber}</span>
                    <span className="font-bold text-white text-sm">{pay.agentName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    طريقة السداد: {pay.paymentMethod === 'cash' ? 'نقداً' : pay.paymentMethod === 'e_wallet' ? 'محفظة إلكترونية' : 'تحويل'} • {pay.notes || 'سداد حساب'}
                  </p>
                </div>

                <div className="text-left">
                  <span className="font-mono font-black text-emerald-400 text-base block">
                    {formatCurrency(pay.amount, tenant.currency)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatShortDate(pay.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Available Stock */}
      {selectedTab === 'stock' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            جرد الكروت المتوفرة في المخزن للتسليم الميداني
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {profiles.map(prof => {
              const count = cards.filter(c => c.profileId === prof.id && c.status === 'in_stock').length;
              return (
                <div key={prof.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{prof.name}</span>
                    <span className="font-mono text-xs text-sky-400">{prof.rateLimit}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">الرصيد المتاح:</span>
                    <span className={`font-mono font-black text-base ${count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {count} كرت
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

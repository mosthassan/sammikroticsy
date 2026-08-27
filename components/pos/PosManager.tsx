'use client';

import React, { useState, useMemo } from 'react';
import { Agent, Invoice, PaymentTransaction, Tenant, Profile, Card } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  Building2,
  PlusCircle,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  ShoppingBag,
  History,
  X,
  CreditCard
} from 'lucide-react';

interface PosManagerProps {
  tenant: Tenant;
  agents: Agent[];
  invoices: Invoice[];
  payments: PaymentTransaction[];
  profiles: Profile[];
  cards: Card[];
  onAddAgent: (agentData: Omit<Agent, 'id' | 'tenantId' | 'totalPurchases' | 'totalPaid' | 'currentDebt' | 'createdAt'>) => void;
  onOpenNewInvoiceModal: (agentId?: string) => void;
  onOpenNewPaymentModal: (agentId?: string) => void;
}

export const PosManager: React.FC<PosManagerProps> = ({
  tenant,
  agents,
  invoices,
  payments,
  profiles,
  cards,
  onAddAgent,
  onOpenNewInvoiceModal,
  onOpenNewPaymentModal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgentForStatement, setSelectedAgentForStatement] = useState<Agent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Agent Form State
  const [storeName, setStoreName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.storeName.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    });
  }, [agents, searchQuery]);

  // Aggregate POS Stats
  const stats = useMemo(() => {
    const totalDebt = agents.reduce((acc, a) => acc + (a.currentDebt || 0), 0);
    const totalPurchases = agents.reduce((acc, a) => acc + (a.totalPurchases || 0), 0);
    const totalPaid = agents.reduce((acc, a) => acc + (a.totalPaid || 0), 0);
    const activeCount = agents.filter(a => a.status === 'active').length;
    return { totalDebt, totalPurchases, totalPaid, activeCount };
  }, [agents]);

  // Statement calculations for selected agent
  const agentStatement = useMemo(() => {
    if (!selectedAgentForStatement) return null;
    const agent = selectedAgentForStatement;
    const agentInvoices = invoices.filter(i => i.agentId === agent.id);
    const agentPayments = payments.filter(p => p.agentId === agent.id);

    // Merge transactions chronologically
    type TransactionItem = {
      id: string;
      date: string;
      type: 'invoice' | 'payment';
      title: string;
      docNumber: string;
      debit: number; // مدين (سحب كروت)
      credit: number; // دائن (سداد دفعات)
      notes?: string;
    };

    const combined: TransactionItem[] = [];

    agentInvoices.forEach(inv => {
      combined.push({
        id: inv.id,
        date: inv.date,
        type: 'invoice',
        title: `سند تسليم كروت (${inv.items.map(i => `${i.qty} كرت فئة ${i.profileName.split(' ')[0]}`).join(', ')})`,
        docNumber: inv.invoiceNumber,
        debit: inv.totalWholesale,
        credit: 0,
        notes: inv.notes
      });
      // if invoice had cash payment
      if (inv.paidAmount > 0) {
        combined.push({
          id: `${inv.id}_pay`,
          date: inv.date,
          type: 'payment',
          title: `دفعة مقدمة مع سند التسليم ${inv.invoiceNumber}`,
          docNumber: inv.invoiceNumber,
          debit: 0,
          credit: inv.paidAmount,
          notes: 'دفعة نقدية فورية'
        });
      }
    });

    agentPayments.forEach(pay => {
      combined.push({
        id: pay.id,
        date: pay.date,
        type: 'payment',
        title: `سند قبض وتحصيل نقدي (${pay.paymentMethod === 'cash' ? 'نقداً' : 'حوالة/محفظة'})`,
        docNumber: pay.receiptNumber,
        debit: 0,
        credit: pay.amount,
        notes: pay.notes
      });
    });

    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const itemsWithBalance = combined.map(item => {
      runningBalance += item.debit - item.credit;
      return {
        ...item,
        balance: runningBalance
      };
    });

    return {
      agent,
      transactions: itemsWithBalance,
      finalBalance: runningBalance
    };
  }, [selectedAgentForStatement, invoices, payments]);

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim()) return;

    onAddAgent({
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      discountPercentage,
      status: 'active',
      notes: notes.trim()
    });

    setStoreName('');
    setOwnerName('');
    setPhone('');
    setLocation('');
    setDiscountPercentage(0);
    setNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner & Stats */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-sky-400" />
            إدارة نقاط البيع والبقالات وشبكة التوزيع
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            متابعة حسابات الموزعين، تسليم الكروت، سندات القبض، وكشوفات الحساب المالية.
          </p>
        </div>

        <button
          id="add-new-agent-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-900/30 transition transform active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة بقالة / نقطة بيع جديدة
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-slate-400">إجمالي الديون المعلقة عند البقالات</span>
          <div className="mt-2 text-2xl font-black text-rose-400 font-mono">
            {formatCurrency(stats.totalDebt, tenant.currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            مطلوب تحصيلها من المحلات
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-slate-400">إجمالي المبيعات المسحوبة (جملة)</span>
          <div className="mt-2 text-2xl font-black text-sky-400 font-mono">
            {formatCurrency(stats.totalPurchases, tenant.currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            قيمة جميع الكروت المسلمة
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-slate-400">إجمالي المبالغ المحصلة</span>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {formatCurrency(stats.totalPaid, tenant.currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            المبالغ المدفوعة نقدياً وإلكترونياً
          </span>
        </div>
      </div>

      {/* Agents Table & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            id="search-agents-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم البقالة، صاحب المحل، الهاتف، أو الموقع..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Agents Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              {/* Top Row: Store Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-black text-lg">
                    {agent.storeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {agent.storeName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      المالك: <span className="text-slate-200">{agent.ownerName}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{agent.phone}</span>
                      </span>
                      {agent.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[140px]">{agent.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status / Debt Badge */}
                <div>
                  {agent.currentDebt > 0 ? (
                    <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-xl text-right">
                      <span className="text-[10px] text-rose-300 block font-bold">الرصيد المتبقي (دين)</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {formatCurrency(agent.currentDebt, tenant.currency)}
                      </span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-right flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold">مسدد بالكامل</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">إجمالي المسحوبات (جملة)</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatCurrency(agent.totalPurchases, tenant.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">إجمالي المدفوعات المسددة</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(agent.totalPaid, tenant.currency)}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
                <button
                  onClick={() => setSelectedAgentForStatement(agent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  كشف حساب تفصيلي
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenNewInvoiceModal(agent.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    تسليم كروت
                  </button>

                  <button
                    onClick={() => onOpenNewPaymentModal(agent.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    سند قبض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement of Account Modal */}
      {agentStatement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    كشف حساب: {agentStatement.agent.storeName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    المالك: {agentStatement.agent.ownerName} • {agentStatement.agent.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الكشف
                </button>
                <button
                  onClick={() => setSelectedAgentForStatement(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Content */}
            <div className="p-5 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400">إجمالي المسحوبات</span>
                  <span className="block text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {formatCurrency(agentStatement.agent.totalPurchases, tenant.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">إجمالي المسدد</span>
                  <span className="block text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {formatCurrency(agentStatement.agent.totalPaid, tenant.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">الرصيد المتبقي الحالي</span>
                  <span className="block text-sm font-bold font-mono text-rose-400 mt-0.5">
                    {formatCurrency(agentStatement.finalBalance, tenant.currency)}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">التاريخ</th>
                      <th className="py-2.5 px-3">رقم السند</th>
                      <th className="py-2.5 px-3">البيان والتفاصيل</th>
                      <th className="py-2.5 px-3">مدين (سحب)</th>
                      <th className="py-2.5 px-3">دائن (سداد)</th>
                      <th className="py-2.5 px-3">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {agentStatement.transactions.map((tr, idx) => (
                      <tr key={`${tr.id}_${idx}`} className="hover:bg-slate-800/30">
                        <td suppressHydrationWarning className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {formatDate(tr.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                          {tr.docNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">
                          {tr.title}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                          {tr.debit > 0 ? formatCurrency(tr.debit, tenant.currency) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          {tr.credit > 0 ? formatCurrency(tr.credit, tenant.currency) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-100">
                          {formatCurrency(tr.balance, tenant.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Retailer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                إضافة نقطة بيع / بقالة جديدة
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  اسم البقالة أو المحل التجاري *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="مثال: سوبرماركت التقوى والبركة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    اسم صاحب المحل / المسؤول *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="مثال: عبدالله اليافعي"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    رقم الهاتف / الواتساب
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="مثال: 771234567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  الموقع والعنوان
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="مثال: شارع الستين - بجوار الصيدلية المركزية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  نسبة خصم إضافية للبقالة (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظات حول طريقة السداد ومواعيد التوزيع..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-md shadow-sky-900/30"
                >
                  حفظ نقطة البيع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

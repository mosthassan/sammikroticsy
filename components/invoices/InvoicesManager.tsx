'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, PaymentTransaction, Agent, Profile, Tenant, Card } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  FileText,
  DollarSign,
  PlusCircle,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  ShoppingBag,
  Layers,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface InvoicesManagerProps {
  tenant: Tenant;
  invoices: Invoice[];
  payments: PaymentTransaction[];
  agents: Agent[];
  profiles: Profile[];
  cards: Card[];
  onOpenNewInvoiceModal: () => void;
  onOpenNewPaymentModal: () => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({
  tenant,
  invoices,
  payments,
  agents,
  profiles,
  cards,
  onOpenNewInvoiceModal,
  onOpenNewPaymentModal
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<PaymentTransaction | null>(null);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.agentName.toLowerCase().includes(q) ||
        inv.agentPhone.includes(q)
      );
    });
  }, [invoices, searchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(pay => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        pay.receiptNumber.toLowerCase().includes(q) ||
        pay.agentName.toLowerCase().includes(q) ||
        pay.notes?.toLowerCase().includes(q)
      );
    });
  }, [payments, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Tabs */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-400" />
            سجل السندات المالية (تسليم كروت وقبض)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            أرشفة سندات تسليم الكروت ونقاط البيع وسندات التحصيل المالي المعتمدة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              id="tab-invoices-btn"
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'invoices'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              سندات التسليم ({invoices.length})
            </button>
            <button
              id="tab-payments-btn"
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'payments'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              سندات القبض والتحصيل ({payments.length})
            </button>
          </div>

          <button
            onClick={onOpenNewInvoiceModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            سند تسليم جديد
          </button>

          <button
            onClick={onOpenNewPaymentModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/30 transition transform active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            سند قبض جديد
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        /* Invoices List */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                id="search-invoices-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم السند أو اسم البقالة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              إجمالي مبيعات السندات: <strong className="text-sky-400 font-mono">{formatCurrency(invoices.reduce((acc, i) => acc + i.totalWholesale, 0), tenant.currency)}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">البقالة / نقطة البيع</th>
                  <th className="py-3 px-4">تفاصيل الكروت</th>
                  <th className="py-3 px-4">إجمالي الجملة</th>
                  <th className="py-3 px-4">المسدد نقداً</th>
                  <th className="py-3 px-4">المتبقي (آجل)</th>
                  <th className="py-3 px-4">حالة السداد</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4 text-center">معاينة وطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {inv.agentName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {inv.items.map(i => `${i.qty} كرت (${i.profileName.split(' ')[0]})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {formatCurrency(inv.totalWholesale, tenant.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(inv.paidAmount, tenant.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      {inv.remainingDebt > 0 ? formatCurrency(inv.remainingDebt, tenant.currency) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.paymentType === 'cash' && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-bold">
                          سداد نقدي خالص
                        </span>
                      )}
                      {inv.paymentType === 'partial' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold">
                          سداد جزئي
                        </span>
                      )}
                      {inv.paymentType === 'credit' && (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-bold">
                          آجل بالكامل
                        </span>
                      )}
                    </td>
                    <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(inv.date)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                        className="p-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 border border-sky-500/30 rounded-lg transition text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة السند</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Payments Ledger */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                id="search-payments-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم سند القبض أو اسم المحل..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              إجمالي المقبوضات: <strong className="text-emerald-400 font-mono">{formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0), tenant.currency)}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">رقم سند القبض</th>
                  <th className="py-3 px-4">اسم البقالة / المسلم</th>
                  <th className="py-3 px-4">المبلغ المقبوض</th>
                  <th className="py-3 px-4">الرصيد السابق</th>
                  <th className="py-3 px-4">الرصيد بعد السداد</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">ملاحظات</th>
                  <th className="py-3 px-4 text-center">طباعة الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {pay.agentName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(pay.amount, tenant.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatCurrency(pay.previousBalance, tenant.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {formatCurrency(pay.newBalance, tenant.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">
                        {pay.paymentMethod === 'cash' ? 'نقداً (Cash)' : pay.paymentMethod === 'e_wallet' ? 'محفظة إلكترونية' : 'تحويل بنكي'}
                      </span>
                    </td>
                    <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(pay.date)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {pay.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedPaymentForPrint(pay)}
                        className="p-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 rounded-lg transition text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة السند</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                معاينة سند تسليم الكروت للطباعة
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة السند
                </button>
                <button
                  onClick={() => setSelectedInvoiceForPrint(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Receipt Document */}
            <div className="p-8 bg-white text-slate-900 space-y-6 font-sans text-xs" dir="rtl">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{tenant.businessName}</h2>
                  <p className="text-slate-600 text-xs mt-0.5">{tenant.tagline}</p>
                  <p className="text-slate-600 text-xs">هاتف الشبكة: {tenant.phone}</p>
                </div>
                <div className="text-left">
                  <div className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-sm rounded">
                    سند تسليم كروت
                  </div>
                  <p className="font-mono text-xs font-bold mt-1 text-slate-700">
                    رقم السند: {selectedInvoiceForPrint.invoiceNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    التاريخ: {formatDate(selectedInvoiceForPrint.date)}
                  </p>
                </div>
              </div>

              {/* Agent info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">المستلم / نقطة البيع:</span>
                  <span className="text-sm font-bold text-slate-900">{selectedInvoiceForPrint.agentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">رقم هاتف المستلم:</span>
                  <span className="text-sm font-mono text-slate-900">{selectedInvoiceForPrint.agentPhone}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right border-collapse border border-slate-300">
                <thead className="bg-slate-200 text-slate-800 font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2">#</th>
                    <th className="border border-slate-300 p-2">فئة وباقة الكرت</th>
                    <th className="border border-slate-300 p-2">الكمية المسلمة</th>
                    <th className="border border-slate-300 p-2">سعر الجملة</th>
                    <th className="border border-slate-300 p-2">سعر البيع للجمهور</th>
                    <th className="border border-slate-300 p-2">إجمالي الجملة</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceForPrint.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-2 font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-bold">{item.profileName}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{item.qty} كرت</td>
                      <td className="border border-slate-300 p-2 font-mono">{formatCurrency(item.wholesalePrice, tenant.currency)}</td>
                      <td className="border border-slate-300 p-2 font-mono">{formatCurrency(item.retailPrice, tenant.currency)}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{formatCurrency(item.subtotalWholesale, tenant.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total & Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-600">إجمالي قيمة الجملة:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedInvoiceForPrint.totalWholesale, tenant.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>المسدد نقداً:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedInvoiceForPrint.paidAmount, tenant.currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 border-t border-slate-300 pt-1 font-bold">
                    <span>المتبقي في الذمة (دين):</span>
                    <span className="font-mono">{formatCurrency(selectedInvoiceForPrint.remainingDebt, tenant.currency)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoiceForPrint.notes && (
                <div className="text-[11px] text-slate-600 p-2 bg-slate-50 rounded border border-slate-200">
                  <strong>ملاحظات:</strong> {selectedInvoiceForPrint.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">توقيع مسؤول الشبكة / الموزع</p>
                  <p className="mt-8 text-slate-400">........................................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">توقيع واستلام صاحب نقطة البيع</p>
                  <p className="mt-8 text-slate-400">........................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payment Voucher Modal */}
      {selectedPaymentForPrint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                معاينة سند قبض وتحصيل مالي
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة السند
                </button>
                <button
                  onClick={() => setSelectedPaymentForPrint(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Receipt Document */}
            <div className="p-8 bg-white text-slate-900 space-y-6 font-sans text-xs" dir="rtl">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{tenant.businessName}</h2>
                  <p className="text-slate-600 text-xs">هاتف الشبكة: {tenant.phone}</p>
                </div>
                <div className="text-left">
                  <div className="px-3 py-1 bg-amber-600 text-white font-mono font-bold text-sm rounded">
                    سند قبض مالي
                  </div>
                  <p className="font-mono text-xs font-bold mt-1 text-slate-700">
                    رقم السند: {selectedPaymentForPrint.receiptNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    التاريخ: {formatDate(selectedPaymentForPrint.date)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">استلمنا من الأخ / المحل:</span>
                  <span className="font-bold text-sm text-slate-900">{selectedPaymentForPrint.agentName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-200 pt-2">
                  <span className="text-slate-600">مبلغ وقدره:</span>
                  <span className="font-mono font-black text-base text-emerald-800">
                    {formatCurrency(selectedPaymentForPrint.amount, tenant.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-200 pt-2 text-[11px]">
                  <span className="text-slate-600">طريقة السداد:</span>
                  <span className="font-bold text-slate-800">
                    {selectedPaymentForPrint.paymentMethod === 'cash' ? 'نقداً' : 'حوالة / محفظة إلكترونية'}
                  </span>
                </div>
                {selectedPaymentForPrint.notes && (
                  <div className="border-t border-amber-200 pt-2 text-[11px] text-slate-700">
                    <strong>وذلك عن:</strong> {selectedPaymentForPrint.notes}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded-lg border border-slate-200 text-center font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">الرصيد السابق</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedPaymentForPrint.previousBalance, tenant.currency)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الرصيد الحالي المتبقي</span>
                  <span className="font-black text-rose-700">{formatCurrency(selectedPaymentForPrint.newBalance, tenant.currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">توقيع المستلم (الشبكة)</p>
                  <p className="mt-8 text-slate-400">........................................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">توقيع المسلّم</p>
                  <p className="mt-8 text-slate-400">........................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

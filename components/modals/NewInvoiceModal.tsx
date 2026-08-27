'use client';

import React, { useState, useMemo } from 'react';
import { Agent, Profile, Card, Tenant, Invoice, InvoiceItem } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { ShoppingBag, X, CheckCircle2, AlertCircle, Plus, Minus, Layers } from 'lucide-react';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  agents: Agent[];
  profiles: Profile[];
  cards: Card[];
  preselectedAgentId?: string;
  onSubmitInvoice: (invoiceData: {
    agentId: string;
    items: InvoiceItem[];
    paidAmount: number;
    paymentType: 'cash' | 'credit' | 'partial';
    notes?: string;
  }) => void;
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  tenant,
  agents,
  profiles,
  cards,
  preselectedAgentId,
  onSubmitInvoice
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(preselectedAgentId || agents[0]?.id || '');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'partial'>('credit');
  const [notes, setNotes] = useState<string>('');

  // Pre-calculate in-stock cards for each profile
  const profileStock = useMemo(() => {
    const stockMap: Record<string, number> = {};
    profiles.forEach(p => {
      stockMap[p.id] = cards.filter(c => c.profileId === p.id && c.status === 'in_stock').length;
    });
    return stockMap;
  }, [profiles, cards]);

  // Active agent
  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Invoice calculations
  const invoiceSummary = useMemo(() => {
    const items: InvoiceItem[] = [];
    let totalWholesale = 0;
    let totalRetail = 0;

    profiles.forEach(p => {
      const qty = selectedQuantities[p.id] || 0;
      if (qty > 0) {
        const subWholesale = qty * p.wholesalePrice;
        const subRetail = qty * p.price;
        totalWholesale += subWholesale;
        totalRetail += subRetail;
        items.push({
          profileId: p.id,
          profileName: p.name,
          qty,
          retailPrice: p.price,
          wholesalePrice: p.wholesalePrice,
          subtotalWholesale: subWholesale,
          subtotalRetail: subRetail
        });
      }
    });

    const remainingDebt = Math.max(0, totalWholesale - paidAmount);

    return { items, totalWholesale, totalRetail, remainingDebt };
  }, [profiles, selectedQuantities, paidAmount]);

  if (!isOpen) return null;

  const handleQtyChange = (profileId: string, delta: number) => {
    const maxStock = profileStock[profileId] || 0;
    const current = selectedQuantities[profileId] || 0;
    const next = Math.max(0, Math.min(maxStock, current + delta));
    setSelectedQuantities(prev => ({ ...prev, [profileId]: next }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || invoiceSummary.items.length === 0) return;

    let finalPaymentType = paymentType;
    if (paidAmount >= invoiceSummary.totalWholesale) {
      finalPaymentType = 'cash';
    } else if (paidAmount > 0) {
      finalPaymentType = 'partial';
    } else {
      finalPaymentType = 'credit';
    }

    onSubmitInvoice({
      agentId: selectedAgentId,
      items: invoiceSummary.items,
      paidAmount,
      paymentType: finalPaymentType,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            إنشاء سند تسليم كروت لبقالة / نقطة بيع
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select POS Agent */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              اختر البقالة / نقطة البيع المستلمة
            </label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.storeName} — (المالك: {a.ownerName} | الدين الحالي: {formatCurrency(a.currentDebt, tenant.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Quantities per Profile Selection */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">
              حدد عدد الكروت المسلمة من كل باقة (من المخزن العام):
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {profiles.map(prof => {
                const inStock = profileStock[prof.id] || 0;
                const currentQty = selectedQuantities[prof.id] || 0;

                return (
                  <div
                    key={prof.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-100 truncate">{prof.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>جملة: <strong className="text-emerald-400 font-mono">{prof.wholesalePrice}</strong></span>
                        <span>•</span>
                        <span>متاح بالمخزن: <strong className="text-sky-400 font-mono">{inStock}</strong> كرت</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(prof.id, -10)}
                        disabled={currentQty === 0}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 font-bold"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(prof.id, -1)}
                        disabled={currentQty === 0}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-10 text-center font-mono font-bold text-sm text-white bg-slate-900 py-1 rounded border border-slate-700">
                        {currentQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleQtyChange(prof.id, 1)}
                        disabled={currentQty >= inStock}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(prof.id, 10)}
                        disabled={currentQty >= inStock}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 font-bold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Financial Summary */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span>إجمالي عدد الكروت المسلمة:</span>
              <span className="font-mono font-bold text-sky-400">
                {invoiceSummary.items.reduce((acc, i) => acc + i.qty, 0)} كرت
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>إجمالي قيمة الجملة للبقالة:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(invoiceSummary.totalWholesale, tenant.currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  المبلغ المدفوع نقداً الآن
                </label>
                <input
                  type="number"
                  min={0}
                  max={invoiceSummary.totalWholesale}
                  value={paidAmount}
                  onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  المتبقي في الذمة (دين آجل)
                </label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-rose-400 font-bold text-sm">
                  {formatCurrency(invoiceSummary.remainingDebt, tenant.currency)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              ملاحظات السند
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: تسليم كروت أسبوعي - يتم السداد يوم الخميس"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={invoiceSummary.items.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition shadow-md shadow-emerald-900/30"
            >
              اعتماد وتسليم الكروت
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

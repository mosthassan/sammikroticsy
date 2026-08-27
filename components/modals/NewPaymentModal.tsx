'use client';

import React, { useState, useMemo } from 'react';
import { Agent, Tenant, PaymentTransaction } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { DollarSign, X, CheckCircle2, Wallet, Building2, CreditCard } from 'lucide-react';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  agents: Agent[];
  preselectedAgentId?: string;
  onSubmitPayment: (paymentData: {
    agentId: string;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'e_wallet' | 'check';
    referenceNumber?: string;
    notes?: string;
  }) => void;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  isOpen,
  onClose,
  tenant,
  agents,
  preselectedAgentId,
  onSubmitPayment
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(preselectedAgentId || agents[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'e_wallet' | 'check'>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  if (!isOpen) return null;

  const currentDebt = selectedAgent?.currentDebt || 0;
  const newBalance = Math.max(0, currentDebt - amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || amount <= 0) return;

    onSubmitPayment({
      agentId: selectedAgentId,
      amount,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            تسجيل سند قبض وتحصيل مالي
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              اختر البقالة / المسلم
            </label>
            <select
              value={selectedAgentId}
              onChange={e => {
                setSelectedAgentId(e.target.value);
                const ag = agents.find(a => a.id === e.target.value);
                if (ag) setAmount(ag.currentDebt || 0);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.storeName} — (الرصيد المتبقي: {formatCurrency(a.currentDebt, tenant.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Current Debt Alert */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">الدين الحالي المستحق:</span>
            <span className="font-mono font-black text-rose-400 text-sm">
              {formatCurrency(currentDebt, tenant.currency)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold">
                المبلغ المقبوض (المدفوع) *
              </label>
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentDebt)}
                  className="text-[11px] text-amber-400 font-semibold hover:underline"
                >
                  سداد كامل المبلغ ({currentDebt})
                </button>
              )}
            </div>
            <input
              type="number"
              min={1}
              required
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              طريقة السداد
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2 rounded-xl border text-center transition ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                نقداً (كاش)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('e_wallet')}
                className={`p-2 rounded-xl border text-center transition ${
                  paymentMethod === 'e_wallet'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                محفظة إلكترونية
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-2 rounded-xl border text-center transition ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                تحويل بنكي
              </button>
            </div>
          </div>

          {paymentMethod !== 'cash' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                رقم الحوالة / الإشعار المرجعي
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="مثال: REF-9832104"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              ملاحظات / البيان
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: سداد دفعة عن كروت الأسبوع الماضي"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* New Balance Preview */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
            <span className="text-slate-300">الرصيد المتبقي بعد هذا السداد:</span>
            <span className="font-mono font-black text-emerald-300 text-sm">
              {formatCurrency(newBalance, tenant.currency)}
            </span>
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
              disabled={amount <= 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl font-bold transition shadow-md shadow-amber-900/30"
            >
              حفظ واعتماد سند القبض
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

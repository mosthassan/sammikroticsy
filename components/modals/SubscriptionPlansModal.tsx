'use client';

import React from 'react';
import { Tenant } from '@/types';
import { SubscriptionPlansCard } from '@/components/settings/SubscriptionPlansCard';
import { X, Sparkles, ShieldCheck } from 'lucide-react';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onSelectPlan?: (plan: 'starter' | 'pro' | 'enterprise', billing: 'monthly' | 'yearly') => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSelectPlan
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-100 flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>باقات واشتراكات أصحاب الشبكات</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono border border-slate-700">
                  {tenant.businessName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ترقية وتجديد الاشتراك في منصة NetFlow SaaS السحابية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <SubscriptionPlansCard
            tenant={tenant}
            onSelectPlan={(plan, billing) => {
              if (onSelectPlan) {
                onSelectPlan(plan as 'starter' | 'pro' | 'enterprise', billing);
              }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

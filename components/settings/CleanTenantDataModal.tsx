'use client';

import React, { useState } from 'react';
import { Tenant } from '@/types';
import { purgeTenantDemoData } from '@/lib/firestore-service';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface CleanTenantDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onDataPurged: () => void;
  onStartOnboarding: () => void;
}

export const CleanTenantDataModal: React.FC<CleanTenantDataModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onDataPurged,
  onStartOnboarding
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleExecutePurge = async () => {
    setIsPurging(true);
    setErrorMsg('');
    try {
      // 1. Purge from Firestore
      const res = await purgeTenantDemoData(tenant.id);
      if (!res.success) {
        console.warn('Firestore purge note:', res.error);
      }

      // 2. Trigger local state clean
      onDataPurged();
      setIsDone(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء تصفير البيانات');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans" dir="rtl">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                تهيئة الشبكة للإنتاج الفعلي (مسح البيانات التجريبية)
              </h2>
              <p className="text-xs text-rose-300">Clean Slate Production Ready</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {!isDone ? (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيه هام قبل بدء التشغيل الفعلي:</span>
                </div>
                <p className="leading-relaxed">
                  سيقوم هذا الإجراء بمسح كافة كروت الواي فاي التجريبية، البقالات وسندات الدين الوهمية المسبقة لتبدأ شبكتك بسجل نظيف تماماً وجاهز للربط مع راوتر المايكروتك.
                </p>
              </div>

              {/* What will be purged vs kept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-rose-900/30 space-y-2">
                  <div className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ما سيتم حذفه وتصفيره:</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li>كافة كروت الهوتسبوت والدفعات السابقة</li>
                    <li>حسابات البقالات والموزعين التجريبية</li>
                    <li>فواتير المبيعات وسندات السداد السابقة</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-900/30 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ما سيتم الحفاظ عليه:</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li>اسم الشبكة ومعلومات الاتصال والعملة</li>
                    <li>باقات وسرعات الإنترنت (Profiles)</li>
                    <li>قوالب الكروت المخصصة وإعدادات الراوتر</li>
                  </ul>
                </div>
              </div>

              {/* Confirmation check */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-slate-300 font-bold">
                  اكتب كلمة <span className="font-mono text-rose-400 font-bold select-all">&quot;تصفير&quot;</span> للتأكيد:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="تصفير"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-center font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={confirmText.trim() !== 'تصفير' || isPurging}
                  onClick={handleExecutePurge}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-lg shadow-rose-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPurging ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التصفير السحابي...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>مسح البيانات وبدء التشغيل الفعلي</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success & Onboarding Prompt */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">تم تصفير وتهيئة الشبكة بنجاح!</h3>
                <p className="text-slate-300 text-xs mt-1">
                  أصبحت قاعدة بيانات شبكتك جاهزة ونظيفة للبدء في توليد كروت المشتركين الحقيقية.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onStartOnboarding();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-900/30 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>معالج التهيئة السريعة (3 خطوات)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  إغلاق والمتابعة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

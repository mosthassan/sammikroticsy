'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  X,
  Sparkles,
  Zap,
  Wifi,
  ChevronLeft,
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isMobile,
    isIOS,
    isFirstMobileVisit,
    hasDismissed,
    install,
    dismiss
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Trigger popup after a smooth 1.5s delay for first-time mobile visitors
  useEffect(() => {
    if (!isInstalled && isMobile && isFirstMobileVisit && !hasDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isMobile, isFirstMobileVisit, hasDismissed]);

  // Hide completely if already running in standalone/installed mode
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (isInstallable) {
      const result = await install();
      if (result === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsVisible(false);
          dismiss(true);
        }, 2200);
      }
    } else {
      // Fallback for Android/Chrome when beforeinstallprompt event is not available
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismiss(true); // Remember dismissal in localStorage
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          id="pwa-install-container"
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none flex justify-center items-end"
          dir="rtl"
        >
          {/* Backdrop blur on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"
            onClick={handleDismiss}
          />

          {/* Main Card */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md pointer-events-auto rounded-3xl bg-slate-900/95 border border-sky-500/30 p-5 shadow-2xl shadow-sky-950/80 backdrop-blur-xl text-slate-100 overflow-hidden"
          >
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-emerald-400" />
            
            {/* Dismiss Button */}
            <button
              id="pwa-dismiss-btn"
              onClick={handleDismiss}
              aria-label="إغلاق الإشعار"
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!showIOSInstructions ? (
              // Normal View: App Pitch and Action Buttons
              <div className="space-y-4">
                {/* Header with App Icon */}
                <div className="flex items-center gap-3.5 pr-1">
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-sky-500/40 p-1.5 shadow-lg shadow-sky-900/40 flex items-center justify-center shrink-0">
                    <img
                      src="/pwa-192x192.png"
                      alt="سام تك"
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        // Fallback if image failed
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900 shadow">
                      <Wifi className="w-3 h-3 text-slate-950" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        تطبيق رسمي للشاشة
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-1 leading-tight truncate">
                      سام تك لإدارة الشبكات
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ثبّت التطبيق للوصول السريع بدون متصفح
                    </p>
                  </div>
                </div>

                {/* Value Propositions */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] leading-snug">
                      <div className="font-bold text-slate-200">شاشة كاملة</div>
                      <div className="text-slate-400 text-[10px]">استخدام أسرع وسلس</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] leading-snug">
                      <div className="font-bold text-slate-200">أيقونة الشاشة</div>
                      <div className="text-slate-400 text-[10px]">دخول فوري بضغطة زر</div>
                    </div>
                  </div>
                </div>

                {/* Feedback / Success State */}
                {installSuccess ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    تم تثبيت التطبيق بنجاح! جاري الفتح...
                  </div>
                ) : (
                  /* Action Buttons */
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="pwa-install-action-btn"
                      onClick={handleInstallClick}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 hover:opacity-95 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      تثبيت التطبيق في الجوال
                    </button>

                    <button
                      id="pwa-later-action-btn"
                      onClick={handleDismiss}
                      className="py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-700/60 transition-colors"
                    >
                      لاحقاً
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Guided View (Especially for iOS Safari / Manual Steps)
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {isIOS ? 'طريقة التثبيت على آيفون (iOS)' : 'طريقة الإضافة إلى الشاشة'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        اتبع هذه الخطوات البسيطة لإضافة أيقونة التطبيق
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                  >
                    <span>رجوع</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  {isIOS ? (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">
                            اضغط على زر المشاركة{' '}
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-400 mx-1">
                              <Share className="w-3 h-3 inline" />
                            </span>{' '}
                            في شريط المتصفح أسفل شاشة الآيفون.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">
                            مرر القائمة لأسفل ثم اضغط على{' '}
                            <span className="inline-flex items-center gap-1 font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                              <PlusSquare className="w-3 h-3 text-sky-400" />
                              إضافة إلى الصفحة الرئيسية
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">
                            اضغط على <span className="font-bold text-emerald-400">إضافة (Add)</span> في الزاوية العلوية ليظهر التطبيق فوراً على شاشتك.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">
                            اضغط على قائمة المتصفح (الثلاث نقاط <span className="font-mono font-bold text-white">⋮</span>) في أعلى أو أسفل الشاشة.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">
                            اختر <span className="font-bold text-emerald-400">&quot;تثبيت التطبيق&quot;</span> أو <span className="font-bold text-sky-400">&quot;الإضافة إلى الشاشة الرئيسية&quot;</span>.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <ArrowDown className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                    <span>انظر إلى شريط المتصفح لتنفيذ الخطوات</span>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs transition-colors"
                  >
                    فهمت ذلك
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

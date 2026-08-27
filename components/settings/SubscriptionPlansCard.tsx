'use client';

import React, { useState } from 'react';
import { Tenant, TenantSubscription } from '@/types';
import {
  Sparkles,
  Check,
  Zap,
  Crown,
  ShieldCheck,
  Radio,
  Layers,
  Building2,
  Palette,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Gift,
  CheckCircle2,
  Lock,
  CreditCard,
  QrCode,
  Users
} from 'lucide-react';

interface SubscriptionPlansCardProps {
  tenant: Tenant;
  onSelectPlan?: (plan: 'starter' | 'pro' | 'enterprise', billing: 'monthly' | 'yearly') => void;
  isCompact?: boolean;
}

export const SubscriptionPlansCard: React.FC<SubscriptionPlansCardProps> = ({
  tenant,
  onSelectPlan,
  isCompact = false
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<string | null>(null);

  const currentPlan = tenant?.subscription?.plan || 'starter';

  const PLANS = [
    {
      id: 'starter' as const,
      name: 'الخطة المجانية',
      nameEn: 'Starter Free',
      tagline: 'مناسبة للشبكات الناشئة والمبتدئة لتجربة المنظومة',
      badge: 'مجانية للأبد',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      priceMonthly: 0,
      priceYearly: 0,
      monthlyEquivalent: 0,
      icon: Layers,
      iconBg: 'from-slate-700 to-slate-800 text-slate-300',
      accentBorder: 'border-slate-800 hover:border-slate-700',
      accentGlow: '',
      popular: false,
      features: [
        { text: '1 راوتر مايكروتك (MikroTik Router)', included: true },
        { text: 'حتى 300 كرت نشط شهرياً', included: true },
        { text: '1 نقطة بيع / بقالة للتوزيع', included: true },
        { text: 'قالب كروت قياسي أساسي (A4 Grid)', included: true },
        { text: 'سجل السندات والتحصيل النقدي', included: true },
        { text: 'مزامنة الكروت يدوياً للراوتر', included: true },
        { text: 'استوديو تصميم صفحات الهوتسبوت', included: false },
        { text: 'دعم الذكاء الاصطناعي لتصميم الكروت', included: false },
        { text: 'تخصيص العلامة التجارية (White-label)', included: false },
        { text: 'دعم فني مخصص ذو أولوية', included: false }
      ],
      ctaText: currentPlan === 'starter' ? 'خطتك الحالية' : 'اختيار الخطة المجانية',
      ctaStyle: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
    },
    {
      id: 'pro' as const,
      name: 'الخطة الاحترافية',
      nameEn: 'Professional',
      tagline: 'الخيار الأفضل لأصحاب الشبكات وموزعي الأحياء والقرى',
      badge: 'الأكثر طلباً ⭐',
      badgeColor: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 font-bold',
      priceMonthly: 10,
      priceYearly: 50,
      monthlyEquivalent: 4.16,
      savingsPercent: 58,
      icon: Zap,
      iconBg: 'from-amber-500 to-orange-600 text-slate-950',
      accentBorder: 'border-amber-500/50 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30',
      accentGlow: 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900',
      popular: true,
      features: [
        { text: 'حتى 5 راوترات مايكروتك مع مزامنة سريعة', included: true },
        { text: 'توليد كروت وطباعة A4 غير محدودة نهائياً', included: true },
        { text: 'حتى 15 نقطة بيع وبقالة مع دفتر ديون وفواتير', included: true },
        { text: 'استوديو تصميم الكروت الكامل + قوالب النيون والفايبر', included: true },
        { text: 'استوديو صفحات الهوتسبوت وتعديل الواجهات الحية', included: true },
        { text: 'مولد رمز الاستجابة السريعة (QR Auto-Login)', included: true },
        { text: 'تصدير سكربتات MikroTik v7 بنقرة واحدة', included: true },
        { text: 'دعم الذكاء الاصطناعي في تصميم الكروت', included: true },
        { text: 'فريق عمل متعدد (حتى 3 حسابات)', included: true },
        { text: 'أولوية في الدعم الفني المباشر عبر واتساب', included: true }
      ],
      ctaText: currentPlan === 'pro' ? 'خطتك الحالية' : 'ترقية إلى الخطة الاحترافية ⚡',
      ctaStyle: 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-950/50 transform active:scale-95'
    },
    {
      id: 'enterprise' as const,
      name: 'خطة الشركات والمؤسسات',
      nameEn: 'Enterprise & ISP',
      tagline: 'للمزودين الكبار (WISP) والشبكات الضخمة متعددة الفروع',
      badge: 'أقصى أداء وقوة 👑',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold',
      priceMonthly: 20,
      priceYearly: 100,
      monthlyEquivalent: 8.33,
      savingsPercent: 58,
      icon: Crown,
      iconBg: 'from-purple-500 to-indigo-600 text-white',
      accentBorder: 'border-purple-500/40 hover:border-purple-500/70 shadow-lg shadow-purple-950/30',
      accentGlow: 'bg-gradient-to-b from-purple-500/10 via-slate-900 to-slate-900',
      popular: false,
      features: [
        { text: 'عدد غير محدود من راوترات المايكروتك (Unlimited)', included: true },
        { text: 'عدد غير محدود من نقاط البيع والبقالات والموزعين', included: true },
        { text: 'توليد وطباعة الكروت بكميات ضخمة دون سقف', included: true },
        { text: 'إدارة فريق العمل الكاملة بصلاحيات مخصصة (RBAC)', included: true },
        { text: 'تخصيص كامل للعلامة التجارية والاسم والشعار (White-label)', included: true },
        { text: 'ربط مباشر عبر REST API و Webhooks', included: true },
        { text: 'استعادة ونسخ احتياطي سحابي تلقائي مستمر', included: true },
        { text: 'تقارير مالية وتحليل أرباح متقدم مع رسوم بيانية', included: true },
        { text: 'سيرفر مخصص وفائق السرعة واستقرار 99.9%', included: true },
        { text: 'دعم فني VIP مدار على مدار الساعة 24/7 مع مدير حساب', included: true }
      ],
      ctaText: currentPlan === 'enterprise' ? 'خطتك الحالية' : 'ترقية لمستوى المؤسسات 👑',
      ctaStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-950/50 transform active:scale-95'
    }
  ];

  const handlePlanAction = (planId: 'starter' | 'pro' | 'enterprise') => {
    if (onSelectPlan) {
      onSelectPlan(planId, billingCycle);
    } else {
      // Open WhatsApp direct contact with pre-filled activation message
      const planName = planId === 'pro' ? 'الخطة الاحترافية ($' + (billingCycle === 'yearly' ? '50/سنوياً' : '10/شهرياً') + ')' : planId === 'enterprise' ? 'خطة المؤسسات ($' + (billingCycle === 'yearly' ? '100/سنوياً' : '20/شهرياً') + ')' : 'الخطة المجانية';
      const msg = encodeURIComponent(
        `السلام عليكم، أود تفعيل/ترقية اشتراك شبكتي في منصة NetFlow SaaS:\n` +
        `اسم الشبكة: ${tenant.businessName}\n` +
        `معرف الشبكة: ${tenant.id}\n` +
        `الخطة المطلوبة: ${planName}\n` +
        `دورة الدفع: ${billingCycle === 'yearly' ? 'سنوي (خصم خاص)' : 'شهري'}\n` +
        `يرجى تزويدي بحساب التحويل والتفعيل الفوري.`
      );
      window.open(`https://wa.me/967770000000?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 via-amber-500/20 to-purple-500/20 border border-sky-500/30 text-xs font-bold text-sky-300 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>باقات واشتراكات منصة NetFlow SaaS السحابية</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          اختر الخطة المناسبة لحجم ونمو شبكتك
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
          نظام متكامل لإدارة وتوزيع كروت المايكروتك، نقاط البيع، والتحصيل المالي السحابي. بدون قيود خفية وتفعيل فوري.
        </p>

        {/* Billing Switch (Monthly / Annually) */}
        <div className="flex items-center justify-center pt-3">
          <div className="relative p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              دفع شهري
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>دفع سنوي</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                billingCycle === 'yearly' ? 'bg-slate-950/80 text-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                وفر 58% 🔥
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const displayPrice = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const periodText = billingCycle === 'yearly' ? 'سنوياً' : 'شهرياً';

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                plan.accentBorder
              } ${plan.accentGlow || 'bg-slate-900/90'} ${
                plan.popular ? 'md:-translate-y-2' : ''
              }`}
            >
              {/* Popular Highlight Banner */}
              {plan.popular && (
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 text-[11px] font-black text-center py-1.5 shadow-md">
                  الخيار الأكثر شعبية وطلباً بين أصحاب الشبكات ⭐
                </div>
              )}

              <div className="p-6 sm:p-7 space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{plan.name}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] rounded-full border border-sky-500/30 font-bold">
                          نشطة حالياً
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal min-h-[32px]">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${plan.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Pricing Block */}
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      ${displayPrice}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ {periodText}</span>
                  </div>

                  {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span>ما يعادل ~${plan.monthlyEquivalent?.toFixed(1)} شهرياً فقط (وفر {plan.savingsPercent}%)</span>
                    </div>
                  )}

                  {billingCycle === 'monthly' && plan.priceMonthly > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      أو وفر $70 عند اختيار الاشتراك السنوي بـ ${plan.priceYearly} فقط
                    </div>
                  )}

                  {plan.priceMonthly === 0 && (
                    <div className="mt-2 text-[11px] text-sky-400 font-bold">
                      مجانية للاستخدام الدائم بدون أي بطاقة ائتمان
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-1">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    الميزات المشمولة في الباقة:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className={`text-xs flex items-start gap-2.5 ${
                          feat.included ? 'text-slate-200' : 'text-slate-600 opacity-60'
                        }`}
                      >
                        {feat.included ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className={feat.included ? 'font-medium' : 'line-through'}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action CTA */}
              <div className="p-6 sm:p-7 pt-0">
                <button
                  type="button"
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition ${
                    isCurrent
                      ? 'bg-slate-800/80 text-slate-400 cursor-default border border-slate-700'
                      : plan.ctaStyle
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  {!isCurrent && <ArrowRight className="w-4 h-4 rotate-180" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Gateways & Guarantees */}
      <div className="mt-8 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">طرق دفع محلية ودولية سهلة ومباشرة</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ندعم التحويل عبر الكريمي (حساب / صرافة)، ون كاش، فلوسك، جيب، USDT (TRC20/BEP20)، والبطاقات البنكية.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-bold">
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">بنك الكريمي</span>
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">ون كاش OneCash</span>
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">فلوسك / جيب</span>
          <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400">USDT Crypto</span>
        </div>
      </div>
    </div>
  );
};

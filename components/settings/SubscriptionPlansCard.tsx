'use client';

import React, { useState, useEffect } from 'react';
import { Tenant, PlatformSubscriptionPlan, PlatformPaymentMethod, PlatformContactSettings } from '@/types';
import {
  fetchPlatformSettingsFromFirestore,
  DEFAULT_SUBSCRIPTION_PLANS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_CONTACT_SETTINGS
} from '@/lib/platform-service';
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
  Users,
  ExternalLink,
  Phone,
  Mail,
  Copy
} from 'lucide-react';

interface SubscriptionPlansCardProps {
  tenant: Tenant;
  onSelectPlan?: (plan: 'starter' | 'pro' | 'enterprise' | string, billing: 'monthly' | 'yearly') => void;
  isCompact?: boolean;
}

export const SubscriptionPlansCard: React.FC<SubscriptionPlansCardProps> = ({
  tenant,
  onSelectPlan,
  isCompact = false
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [plans, setPlans] = useState<PlatformSubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [paymentMethods, setPaymentMethods] = useState<PlatformPaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [contact, setContact] = useState<PlatformContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformSettingsFromFirestore().then(settings => {
      if (settings.subscriptionPlans?.length) setPlans(settings.subscriptionPlans.filter(p => p.isActive));
      if (settings.paymentMethods?.length) setPaymentMethods(settings.paymentMethods.filter(p => p.isActive));
      if (settings.contact) setContact(settings.contact);
    });
  }, []);

  const currentPlan = tenant?.subscription?.plan || 'starter';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlanAction = (plan: PlatformSubscriptionPlan) => {
    if (onSelectPlan) {
      onSelectPlan(plan.code, billingCycle);
    } else {
      const price = billingCycle === 'yearly' ? `$${plan.yearlyPrice}/سنوياً` : `$${plan.monthlyPrice}/شهرياً`;
      const msg = encodeURIComponent(
        `السلام عليكم، أود تفعيل/ترقية اشتراك شبكتي في منصة ${contact.brandName}:\n` +
        `اسم الشبكة: ${tenant.businessName}\n` +
        `معرف الشبكة: ${tenant.id}\n` +
        `الخطة المطلوبة: ${plan.nameArabic} (${price})\n` +
        `دورة الدفع: ${billingCycle === 'yearly' ? 'سنوي (خصم خاص)' : 'شهري'}\n` +
        `يرجى تزويدي بحساب التحويل والتفعيل الفوري.`
      );
      const cleanPhone = contact.whatsappNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone || '967777123456'}?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" dir="rtl">
      {/* Notice Banner if active */}
      {contact.isNoticeBannerActive && contact.noticeBannerText && (
        <div className="p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{contact.noticeBannerText}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 via-amber-500/20 to-purple-500/20 border border-sky-500/30 text-xs font-bold text-sky-300 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>باقات واشتراكات {contact.brandName}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          اختر الخطة المناسبة لحجم ونمو شبكتك
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
          {contact.brandTagline || 'نظام متكامل لإدارة وتوزيع كروت المايكروتك، نقاط البيع، والتحصيل المالي السحابي مع دعم فني مستمر.'}
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
                وفر حتى 25% 🔥
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.code;
          const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const periodText = billingCycle === 'yearly' ? 'سنوياً' : 'شهرياً';
          const monthlyEq = billingCycle === 'yearly' && plan.yearlyPrice > 0 ? (plan.yearlyPrice / 12).toFixed(1) : null;

          const isPro = plan.code === 'pro' || plan.isRecommended;
          const isEnterprise = plan.code === 'enterprise';

          const accentBorder = isPro
            ? 'border-amber-500/50 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30'
            : isEnterprise
            ? 'border-purple-500/40 hover:border-purple-500/70 shadow-lg shadow-purple-950/30'
            : 'border-slate-800 hover:border-slate-700';

          const accentGlow = isPro
            ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900'
            : isEnterprise
            ? 'bg-gradient-to-b from-purple-500/10 via-slate-900 to-slate-900'
            : 'bg-slate-900/90';

          const iconBg = isPro
            ? 'from-amber-500 to-orange-600 text-slate-950'
            : isEnterprise
            ? 'from-purple-500 to-indigo-600 text-white'
            : 'from-slate-700 to-slate-800 text-slate-300';

          const ctaStyle = isPro
            ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-950/50 transform active:scale-95'
            : isEnterprise
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-950/50 transform active:scale-95'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700';

          const IconComponent = isPro ? Zap : isEnterprise ? Crown : Layers;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${accentBorder} ${accentGlow} ${
                plan.isRecommended ? 'md:-translate-y-2' : ''
              }`}
            >
              {/* Popular Highlight Banner */}
              {plan.isRecommended && (
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 text-[11px] font-black text-center py-1.5 shadow-md">
                  {plan.badgeText || 'الخيار الأكثر شعبية وطلباً بين أصحاب الشبكات ⭐'}
                </div>
              )}

              <div className="p-6 sm:p-7 space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{plan.nameArabic}</h3>
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

                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                    <IconComponent className="w-6 h-6" />
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

                  {monthlyEq && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span>ما يعادل ~${monthlyEq} شهرياً فقط (وفر {plan.discountPercentageYearly || 20}%)</span>
                    </div>
                  )}

                  {billingCycle === 'monthly' && plan.yearlyPrice > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      أو وفر ${plan.monthlyPrice * 12 - plan.yearlyPrice} عند اختيار الاشتراك السنوي بـ ${plan.yearlyPrice} فقط
                    </div>
                  )}

                  {displayPrice === 0 && (
                    <div className="mt-2 text-[11px] text-sky-400 font-bold">
                      مجانية للاستخدام الدائم بدون أي بطاقة ائتمان
                    </div>
                  )}
                </div>

                {/* Limits Specs */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center text-[10px]">
                  <div>
                    <div className="text-slate-400">كروت شهرياً</div>
                    <div className="font-bold text-sky-400 font-mono text-xs mt-0.5">{plan.maxCards?.toLocaleString() || 'غير محدود'}</div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-slate-400">الموزعين</div>
                    <div className="font-bold text-emerald-400 font-mono text-xs mt-0.5">{plan.maxDistributors || '15'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">الراوترات</div>
                    <div className="font-bold text-amber-400 font-mono text-xs mt-0.5">{plan.maxRouters || '5'}</div>
                  </div>
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
                        className="text-xs flex items-start gap-2.5 text-slate-200"
                      >
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action CTA */}
              <div className="p-6 sm:p-7 pt-0">
                <button
                  type="button"
                  onClick={() => handlePlanAction(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition ${
                    isCurrent
                      ? 'bg-slate-800/80 text-slate-400 cursor-default border border-slate-700'
                      : ctaStyle
                  }`}
                >
                  <span>{isCurrent ? 'خطتك الحالية' : `اختيار ${plan.nameArabic}`}</span>
                  {!isCurrent && <ArrowRight className="w-4 h-4 rotate-180" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Gateways & Bank Accounts */}
      <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">طرق وبوابات الدفع المعتمدة للمنصة</h4>
              <p className="text-xs text-slate-400">
                يمكنك التحويل عبر أي من الحسابات أو المحافظ المعتمدة أدناه وإرسال الإشعار للتفعيل الفوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-full font-bold">
              تأكيد وتفعيل فوري
            </span>
          </div>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map(method => (
            <div
              key={method.id}
              className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {method.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                  {method.currency}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="text-[10px] text-slate-400">رقم الحساب / المحفظة:</div>
                  <div className="font-mono font-bold text-sky-400 truncate">{method.accountNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(method.accountNumber, method.id)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition shrink-0"
                  title="نسخ رقم الحساب"
                >
                  {copiedId === method.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                المستفيد: <span className="text-slate-200 font-bold">{method.accountHolderName}</span>
              </div>

              {method.instructions && (
                <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/60 pt-2">
                  {method.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Direct Contact & Support Footer */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">هل تحتاج إلى مساعدة أو خطة مخصصة لشبكتك؟</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              فريق الدعم الفني والمبيعات متاح على مدار الساعة للإجابة عن استفساراتك وتخصيص الباقة المناسبة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={contact.whatsappSupportUrl || `https://wa.me/${contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-950/50 transition transform active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل عبر واتساب ({contact.whatsappNumber})</span>
          </a>

          {contact.supportEmail && (
            <a
              href={`mailto:${contact.supportEmail}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs border border-slate-700 transition"
            >
              <Mail className="w-4 h-4" />
              <span>{contact.supportEmail}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

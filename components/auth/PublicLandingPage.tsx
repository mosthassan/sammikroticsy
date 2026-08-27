'use client';

import React, { useState } from 'react';
import { UserProfile, Tenant, TeamMember } from '@/types';
import { signInWithGoogle } from '@/lib/firestore-service';
import {
  Wifi,
  Shield,
  ShieldCheck,
  LogIn,
  Sparkles,
  Smartphone,
  Layers,
  Building2,
  Radio,
  CheckCircle2,
  Lock,
  KeyRound,
  MonitorSmartphone,
  DollarSign,
  Users,
  AlertCircle,
  PlayCircle,
  QrCode,
  Zap,
  Globe
} from 'lucide-react';

interface PublicLandingPageProps {
  tenant: Tenant;
  team: TeamMember[];
  onAuthenticated: (profile: UserProfile) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  tenant,
  team,
  onAuthenticated
}) => {
  const [activeAuthTab, setActiveAuthTab] = useState<'google' | 'pin' | 'demo'>('google');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google One-Click Auth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithGoogle();
      if (res.success && res.profile) {
        onAuthenticated(res.profile);
      } else {
        setErrorMsg(res.error || 'تعذر تسجيل الدخول عبر Google. يرجى المحاولة مجدداً أو استخدام الدخول السريع.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال بخدمات Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Distributor PIN Auth
  const handlePinSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneOrEmail.trim() || !pinCode.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف أو البريد ورمز الـ PIN');
      return;
    }

    const member = team.find(
      m =>
        (m.phone === phoneOrEmail.trim() || m.email?.toLowerCase() === phoneOrEmail.trim().toLowerCase()) &&
        m.pinCode === pinCode.trim()
    );

    if (member) {
      if (!member.active) {
        setErrorMsg('هذا الحساب معطل حالياً من قبل إدارة الشبكة.');
        return;
      }

      const distProfile: UserProfile = {
        uid: member.uid || `user_${member.id}`,
        email: member.email || `${member.phone}@distributor.samtech.net`,
        name: member.name,
        phone: member.phone,
        role: member.role,
        tenantId: tenant.id,
        pinCode: member.pinCode,
        active: true,
        createdAt: member.createdAt,
        lastLoginAt: new Date().toISOString()
      };

      onAuthenticated(distProfile);
    } else {
      setErrorMsg('بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف ورمز الـ PIN المعتمدين.');
    }
  };

  // Quick Demo Access (Owner or Distributor)
  const handleDemoAccess = (role: 'owner' | 'distributor') => {
    const isOwner = role === 'owner';
    const profile: UserProfile = {
      uid: isOwner ? 'user_demo_owner' : 'user_demo_dist',
      email: isOwner ? 'owner.demo@samtech.net' : 'distributor.demo@samtech.net',
      name: isOwner ? 'مدير الشبكة التجريبي (Owner Demo)' : 'أحمد نبيل (موزع ميداني تجريبي)',
      role: isOwner ? 'owner' : 'distributor',
      tenantId: tenant.id,
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString()
    };
    onAuthenticated(profile);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-950/50 flex items-center justify-center text-white">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">سام تك • NetFlow SaaS</span>
              <span className="hidden sm:inline-block mr-2 text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                إدارة شبكات وكروت الواي فاي
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveAuthTab('google');
                const authCard = document.getElementById('auth-gateway-card');
                authCard?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950/40 transition transform active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <section className="relative overflow-hidden py-12 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background glow accents */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Text & Features */}
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-sky-400 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>المنظومة السحابية المتكاملة لمدراء وموزعي شبكات المايكروتك</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              أدر شبكتك، صمم واطبع كروتك، وتتبع ديونك السحابية بدقة متناهية
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              نظام سحابي متكامل يجمع بين استوديو تصميم وطباعة كروت A4 الدقيقة، الربط الذكي مع أجهزة MikroTik RouterOS بدون IP ثابت، إدارة نقاط البيع والبقالات، وتطبيق التوزيع الميداني السريع.
            </p>

            {/* Quick value props list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">طباعة كروت A4 مليمترية</h4>
                  <p className="text-[11px] text-slate-400">توليد دفعات وتصدير PDF دقيق بباركود QR</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">حسابات البقالات والديون</h4>
                  <p className="text-[11px] text-slate-400">سندات تسليم وقبض ومطابقات مالية دقيقة</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">جسر مايكروتك السحابي</h4>
                  <p className="text-[11px] text-slate-400">تزامن وسحب كروت فوري بدون حاجة لـ Static IP</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">تطبيق الموزع الميداني</h4>
                  <p className="text-[11px] text-slate-400">واجهة سريعة خفيفة للتسليم برمز PIN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Secure Auth Box */}
          <div className="lg:col-span-5" id="auth-gateway-card">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-950 backdrop-blur-xl relative overflow-hidden">
              {/* Header inside card */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">بوابة تسجيل الدخول</h3>
                    <p className="text-[11px] text-slate-400">سحابي ومحمي بصلاحيات مشددة (RBAC)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
                  <Lock className="w-3 h-3" />
                  <span>آمن 100%</span>
                </div>
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div className="mb-4 p-3.5 bg-rose-950/90 border border-rose-500/50 rounded-2xl text-rose-200 text-xs space-y-2 text-right">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>تنبيه في عملية تسجيل الدخول</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-rose-200/90">{errorMsg}</p>

                  {errorMsg.includes('Firebase') || errorMsg.includes('unauthorized-domain') || errorMsg.includes('النطاق') ? (
                    <div className="pt-2 border-t border-rose-500/30 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">يمكنك الدخول التجريبي المباشر:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAuthTab('demo');
                          setErrorMsg('');
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold transition"
                      >
                        تجربة المنظومة فوراً
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Tabs for Login Type */}
              <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAuthTab('google');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition ${
                    activeAuthTab === 'google'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  حساب Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAuthTab('pin');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition ${
                    activeAuthTab === 'pin'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  دخول الموزع (PIN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAuthTab('demo');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition ${
                    activeAuthTab === 'demo'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  تجربة سريعة (Demo)
                </button>
              </div>

              {/* TAB 1: Google One-Click Auth */}
              {activeAuthTab === 'google' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed text-right">
                    تسجيل الدخول الآمن بنقرة واحدة بحساب Google. يتم ربط حسابك ببيانات شبكتك وتحديد الصلاحيات تلقائياً.
                  </p>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 p-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm shadow-xl transition transform active:scale-98 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                    <span>{isLoading ? 'جاري الاتصال بحساب Google...' : 'تسجيل الدخول عبر Google بنقرة واحدة'}</span>
                  </button>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-right space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>حماية السوبر أدمن وإدارة الشبكات</span>
                    </div>
                    <p>
                      حسابات السوبر أدمن ومدراء الشبكات المعتمدين يحصلون على صلاحيات الإشراف العام تلقائياً فور التحقق السحابي عبر Google.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Field Distributor PIN Login */}
              {activeAuthTab === 'pin' && (
                <form onSubmit={handlePinSignIn} className="space-y-3 text-xs text-right">
                  <p className="text-slate-300 leading-relaxed">
                    مخصص للموزعين الميدانيين لتسجيل الدخول السريع عبر الهاتف ورمز الـ PIN:
                  </p>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم الهاتف أو البريد الإلكتروني *</label>
                    <input
                      type="text"
                      required
                      value={phoneOrEmail}
                      onChange={e => setPhoneOrEmail(e.target.value)}
                      placeholder="مثال: 771122334"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رمز PIN السريع (4 أرقام) *</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-900/30 transition mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>دخول الموزع الميداني</span>
                  </button>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                    رمز الـ PIN يتم توليده واعتماده من خلال مدير الشبكة في قسم فريق التوزيع.
                  </div>
                </form>
              )}

              {/* TAB 3: Quick Demo Mode */}
              {activeAuthTab === 'demo' && (
                <div className="space-y-3 text-xs text-right">
                  <p className="text-slate-300 leading-relaxed">
                    استكشف ميزات المنظومة فورياً بنقرة واحدة باستخدام أحد الأدوار التجريبية:
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleDemoAccess('owner')}
                      className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-right transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                          🛡️
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-amber-300">دخول كمدير شبكة (Owner Demo)</div>
                          <div className="text-[11px] text-slate-400">استوديو الكروت، إدارة المايكروتك، والباقات</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                    </button>

                    <button
                      onClick={() => handleDemoAccess('distributor')}
                      className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-right transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
                          🛵
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-sky-300">دخول كموزع ميداني (Distributor Demo)</div>
                          <div className="text-[11px] text-slate-400">تسليم الكروت، سندات القبض، ومطابقة الصندوق</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Deep Feature Highlights */}
      <section className="py-16 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">حلول هندسية مصممة خصيصاً لشبكات الواي فاي</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              كل ميزة تم بناؤها لتوفير الوقت، منع ضياع المبالغ المالية، وتسهيل طباعة وتوزيع الكروت بأعلى دقة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">استوديو طباعة A4 دقيق</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                قوالب جاهزة ومتجاوبة، كود باركود QR لتسجيل الدخول التلقائي فور المسح بكاميرا الهاتف، وتصدير PDF مليمتر بدون أي إزاحة في الطباعة.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">دفتر حسابات وديون البقالات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تتبع كروت كل نقطة بيع، كم استلمت وكم سددت، مع كشوف حساب تفصيلية وسندات قبض فورية بصيغة احترافية.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">ربط وسحب كروت مايكروتك</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                سكربتات RouterOS ذكية تسحب الكروت النشطة والمنتهية تلقائياً وترفعها للسحابة بدون الحاجة لدفع تكاليف IP ثابت أو فتح منافذ غير آمنة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-slate-400">سام تك NetFlow SaaS © 2026</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            لوحة السوبر أدمن محمية بصلاحيات مشددة • جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
};

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

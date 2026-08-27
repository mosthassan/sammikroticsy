'use client';

import React, { useState } from 'react';
import { TeamMember, Tenant, UserProfile, UserRole } from '@/types';
import { signInWithGoogle } from '@/lib/firestore-service';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  X,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  currentUser: UserProfile;
  team: TeamMember[];
  onSelectUserProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  tenant,
  currentUser,
  team,
  onSelectUserProfile,
  onLogout
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'pin' | 'demo_roles'>('google');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithGoogle();
      if (res.success && res.profile) {
        onSelectUserProfile(res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'تعذر تسجيل الدخول عبر Google. يمكنك استخدام الدخول السريع برمز PIN.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneOrEmail.trim() || !pinCode.trim()) {
      setErrorMsg('يرجى كتابة رقم الهاتف ورمز PIN الخاص بك');
      return;
    }

    // Match team member
    const member = team.find(
      m =>
        (m.phone === phoneOrEmail.trim() || m.email?.toLowerCase() === phoneOrEmail.trim().toLowerCase()) &&
        m.pinCode === pinCode.trim()
    );

    if (member) {
      if (!member.active) {
        setErrorMsg('هذا الحساب معطل من قبل مدير الشبكة. تواصل مع الإدارة.');
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

      onSelectUserProfile(distProfile);
      onClose();
    } else {
      setErrorMsg('بيانات الدخول غير صحيحة. تحقق من رقم الهاتف ورمز الـ PIN');
    }
  };

  const handleQuickSwitchRole = (role: UserRole, targetName?: string, targetEmail?: string) => {
    const isOwner = role === 'owner';
    const profile: UserProfile = {
      uid: isOwner ? 'user_owner_01' : 'user_dist_quick',
      email: isOwner ? (tenant.ownerEmail || 'owner@samtech.net') : (targetEmail || 'distributor@samtech.net'),
      name: isOwner ? (tenant.ownerName || 'مدير الشبكة') : (targetName || 'أحمد نبيل (موزع ميداني)'),
      role,
      tenantId: tenant.id,
      active: true,
      createdAt: '2026-01-10T10:00:00Z',
      lastLoginAt: new Date().toISOString()
    };
    onSelectUserProfile(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans" dir="rtl">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تسجيل الدخول وإدارة الحسابات</h2>
              <p className="text-xs text-slate-400">نظام الصلاحيات الموحد NetFlow RBAC</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Profile Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 truncate">
            <User className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-400">الحالي:</span>
            <span className="font-bold text-white truncate max-w-[140px]">{currentUser.name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                currentUser.role === 'super_admin'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                  : currentUser.role === 'owner'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  : 'bg-sky-950/60 text-sky-300 border-sky-500/30'
              }`}
            >
              {currentUser.role === 'super_admin'
                ? '👑 سوبر أدمن'
                : currentUser.role === 'owner'
                ? '🛡️ مدير'
                : '🛵 موزع'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold shrink-0 transition"
              title="تسجيل الخروج والعودة للصفحة الرئيسية العامة"
            >
              <LogOut className="w-3 h-3" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex p-1.5 bg-slate-950 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setAuthMode('google')}
            className={`flex-1 py-2 rounded-xl transition ${
              authMode === 'google' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جوجل بنقرة واحدة
          </button>
          <button
            onClick={() => setAuthMode('pin')}
            className={`flex-1 py-2 rounded-xl transition ${
              authMode === 'pin' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            دخول الموزع (PIN)
          </button>
          <button
            onClick={() => setAuthMode('demo_roles')}
            className={`flex-1 py-2 rounded-xl transition ${
              authMode === 'demo_roles' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تبديل الصلاحية السريع
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Google Sign In */}
          {authMode === 'google' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300 leading-relaxed">
                تسجيل الدخول الآمن بحساب Google. يتم التحقق من الصلاحيات السحابية تلقائياً وتوجيه المشرف المعتمد مباشرة للوحة الإدارة.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 p-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm shadow-xl transition transform active:scale-98 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>{isLoading ? 'جاري الاتصال بجوجل...' : 'الدخول السريع بحساب Google'}</span>
              </button>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-right space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>التحقق الفوري والربط السحابي</span>
                </div>
                <p>يتم حفظ جلسة الدخول وتعيين الصلاحيات تلقائياً بحسب بيانات الحساب المعتمدة.</p>
              </div>
            </div>
          )}

          {/* TAB 2: Field PIN Sign In */}
          {authMode === 'pin' && (
            <form onSubmit={handlePinSignIn} className="space-y-3 text-xs">
              <p className="text-slate-300">
                مخصص للموزعين الميدانيين لتسجيل الدخول السريع عبر الهاتف ورمز الـ PIN:
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف أو البريد *</label>
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
            </form>
          )}

          {/* TAB 3: Quick Role Switcher (Simulator) */}
          {authMode === 'demo_roles' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                تبديل الدور فورياً لتجربة واجهة مدير الشبكة مقابل واجهة الموزع الميداني:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Switch to Super Admin */}
                <button
                  onClick={() => handleQuickSwitchRole('super_admin', 'المشرف العام (Super Admin)', 'admin@samtech.net')}
                  className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
                    currentUser.role === 'super_admin'
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-inner'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                      👑
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">المشرف العام (Super Admin)</div>
                      <div className="text-[11px] text-purple-400">حساب الإدارة السحابية والتحكم بكافة الشبكات</div>
                      <div className="text-[10px] text-purple-300 mt-0.5">لوحة السوبر أدمن وإدارة المشتركين</div>
                    </div>
                  </div>
                  {currentUser.role === 'super_admin' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                </button>

                {/* Switch to Owner */}
                <button
                  onClick={() => handleQuickSwitchRole('owner')}
                  className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
                    currentUser.role === 'owner'
                      ? 'bg-amber-950/40 border-amber-500/50 shadow-inner'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                      🛡️
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">مدير الشبكة الحالي (Owner)</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tenant.ownerName} • {tenant.businessName}</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">إدارة كروت وباقات وفواتير الشبكة المعينة</div>
                    </div>
                  </div>
                  {currentUser.role === 'owner' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                </button>

                {/* Team Distributors List */}
                {team.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleQuickSwitchRole('distributor', member.name, member.email)}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
                      currentUser.role === 'distributor' && currentUser.name === member.name
                        ? 'bg-sky-950/40 border-sky-500/50 shadow-inner'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
                        🛵
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{member.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{member.phone} • PIN: {member.pinCode}</div>
                        <div className="text-[10px] text-sky-400 mt-0.5">واجهة التوزيع الميداني وتسليم الكروت</div>
                      </div>
                    </div>
                    {currentUser.role === 'distributor' && currentUser.name === member.name && (
                      <CheckCircle2 className="w-5 h-5 text-sky-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

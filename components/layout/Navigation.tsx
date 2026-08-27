'use client';

import React from 'react';
import { Tenant, UserProfile } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import {
  LayoutDashboard,
  Palette,
  Layers,
  Building2,
  FileText,
  Radio,
  Settings,
  Wifi,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Bell,
  Menu,
  X,
  AlertCircle,
  MonitorSmartphone,
  Cloud,
  CloudCheck,
  User,
  Shield,
  ShieldCheck,
  Smartphone,
  LogOut,
  Crown,
  Zap
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tenant: Tenant;
  currentUser: UserProfile;
  totalMarketDebt: number;
  inStockCardsCount: number;
  isCloudConnected?: boolean;
  isImpersonating?: boolean;
  onExitImpersonation?: () => void;
  onOpenNewInvoiceModal: () => void;
  onOpenNewPaymentModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSubscriptionModal?: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  tenant,
  currentUser,
  totalMarketDebt,
  inStockCardsCount,
  isCloudConnected = true,
  isImpersonating = false,
  onExitImpersonation,
  onOpenNewInvoiceModal,
  onOpenNewPaymentModal,
  onOpenAuthModal,
  onOpenSubscriptionModal,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isSuperAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.email?.toLowerCase() === 'mosthassan.ye@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'admin@samtech.net';

  const isOwner = currentUser?.role === 'owner' || isSuperAdmin;

  // Role-Based Navigation Filter
  const navItems = isOwner
    ? [
        ...(isSuperAdmin ? [{ id: 'admin', label: 'لوحة السوبر أدمن 👑', icon: ShieldCheck }] : []),
        { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
        { id: 'studio', label: 'استوديو وتصميم الكروت', icon: Palette },
        { id: 'hotspot', label: 'صفحات الهوتسبوت', icon: MonitorSmartphone },
        { id: 'inventory', label: 'المخزن والدفعات', icon: Layers, badge: inStockCardsCount },
        { id: 'pos', label: 'نقاط البيع والبقالات', icon: Building2 },
        { id: 'invoices', label: 'سجل السندات والتحصيل', icon: FileText },
        { id: 'mikrotik', label: 'جسر المايكروتك', icon: Radio },
        { id: 'settings', label: 'الإعدادات والباقات', icon: Settings }
      ]
    : [
        { id: 'distributor_pos', label: 'التوزيع الميداني السريع', icon: Smartphone },
        { id: 'pos', label: 'نقاط البيع والبقالات', icon: Building2 },
        { id: 'invoices', label: 'سجل السندات والتحصيل', icon: FileText }
      ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md" dir="rtl">
      {/* Impersonation Mode Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-indigo-700 to-purple-800 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            <span>
              وضع الدعم الفني المباشر (Impersonation): أنت تتصفح وتدير حالياً شبكة &ldquo;{tenant.businessName}&rdquo;
            </span>
          </div>
          {onExitImpersonation && (
            <button
              onClick={onExitImpersonation}
              className="px-3 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-black transition border border-white/30"
            >
              الرجوع للوحة السوبر أدمن 👑
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo & Network Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-950/50 flex items-center justify-center text-white">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">سام تك</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded">
                  {isOwner ? 'لوحة المالك' : 'توزيع ميداني'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                {tenant.businessName}
              </p>
            </div>
          </div>

          {/* Center / Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-sky-300 rounded-full font-bold tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Badges & Header Actions */}
          <div className="flex items-center gap-2">
            {/* User Profile Pill / One-Click Google Auth */}
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                isSuperAdmin
                  ? 'bg-purple-950/40 hover:bg-purple-950/70 text-purple-300 border-purple-500/40'
                  : isOwner
                  ? 'bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 border-amber-500/30'
                  : 'bg-sky-950/40 hover:bg-sky-950/70 text-sky-300 border-sky-500/30'
              }`}
              title="تغيير الحساب أو إدارة الصلاحيات"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-bold text-white border border-slate-700">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-white text-[11px] leading-tight truncate max-w-[90px]">{currentUser.name}</div>
                <div className="text-[9px] opacity-80 leading-none">
                  {isSuperAdmin ? '👑 سوبر أدمن' : isOwner ? '🛡️ مدير الشبكة' : '🛵 موزع ميداني'}
                </div>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition shadow-sm"
              title="تسجيل الخروج والعودة للصفحة الرئيسية"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {/* Cloud Real-time Status Badge */}
            <div 
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                isCloudConnected 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
              title={isCloudConnected ? "متصل مباشرة مع Cloud Firestore (تزامن لحظي)" : "العمل في وضع التخزين المحلي الآمن"}
            >
              {isCloudConnected ? <CloudCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Cloud className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isCloudConnected ? "مزامنة سحابية" : "أوفلاين"}</span>
            </div>

            {/* Market Debt Alert Pill */}
            {isOwner && totalMarketDebt > 0 && (
              <div
                onClick={() => onTabChange('pos')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold tabular-nums cursor-pointer hover:bg-rose-950 transition"
                title="إجمالي الديون المعلقة في السوق"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>ديون السوق: {formatCurrency(totalMarketDebt, tenant.currency)}</span>
              </div>
            )}

            {/* Subscription Plan Badge for Owners */}
            {isOwner && onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/25"
                title="عرض باقات واشتراكات المنصة أو ترقية الحساب"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">
                  {tenant.subscription?.planNameArabic || 'الخطة المجانية'}
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-md text-[10px] font-black">
                  ترقية ⚡
                </span>
              </button>
            )}

            {/* Quick Action Button: New Delivery */}
            <button
              onClick={onOpenNewInvoiceModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition transform active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسليم كروت</span>
            </button>

            {/* Quick Action Button: New Payment */}
            <button
              onClick={onOpenNewPaymentModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/30 transition transform active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">سند قبض</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800/80 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-sky-300 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile Account Switcher */}
            <button
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-amber-300 mt-2"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>حسابك: {currentUser.name} ({isSuperAdmin ? 'سوبر أدمن' : isOwner ? 'مدير' : 'موزع'})</span>
              </div>
              <span className="text-[10px] text-sky-400 underline">تبديل</span>
            </button>

            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 mt-2 hover:bg-rose-900/80 transition"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>تسجيل الخروج والعودة للرئيسية</span>
              </div>
              <span className="text-[10px] text-rose-300">خروج</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};


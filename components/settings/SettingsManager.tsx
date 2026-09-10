'use client';

import React, { useState, useEffect } from 'react';
import { Currency, Profile, TeamMember, Tenant, TenantSubscription } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import {
  Settings,
  Globe,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Database,
  Building,
  DollarSign,
  Users,
  Type,
  Maximize2,
  Eye,
  Check,
  Pencil,
  Edit3,
  Crown,
  Cloud,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TeamManager } from './TeamManager';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { SubscriptionPlansCard } from './SubscriptionPlansCard';
import { testFirestoreConnection } from '@/lib/firestore-service';
import { formatUptimeLimit } from '@/lib/mikrotik-helpers';
import { appStore } from '@/lib/store';

interface SettingsManagerProps {
  tenant: Tenant;
  profiles: Profile[];
  team: TeamMember[];
  onUpdateTenant: (updated: Partial<Tenant>) => void;
  onUpdateProfiles: (profiles: Profile[]) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  onUpdateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onDeleteTeamMember: (memberId: string) => void;
  onResetData: () => void;
  onOpenCleanModal?: () => void;
  onOpenOnboardingWizard?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  tenant,
  profiles,
  team,
  onUpdateTenant,
  onUpdateProfiles,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  onResetData,
  onOpenCleanModal,
  onOpenOnboardingWizard
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'network' | 'team' | 'appearance' | 'subscriptions' | 'cloud'>('subscriptions');
  const [businessName, setBusinessName] = useState<string>(tenant.businessName);
  const [tagline, setTagline] = useState<string>(tenant.tagline);
  const [phone, setPhone] = useState<string>(tenant.phone);
  const [currency, setCurrency] = useState<Currency>(tenant.currency);
  const [ownerName, setOwnerName] = useState<string>(tenant.ownerName);

  // Cloud Diagnostics State
  const [isTestingCloud, setIsTestingCloud] = useState<boolean>(false);
  const [cloudTestResult, setCloudTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  const handleTestCloudSync = async () => {
    setIsTestingCloud(true);
    setCloudTestResult(null);
    try {
      const result = await testFirestoreConnection(tenant.id);
      setCloudTestResult(result);
      if (result.success) {
        // Trigger a fresh sync pull
        await appStore.initFirestoreSync(tenant.id);
      }
    } catch (err: any) {
      setCloudTestResult({
        success: false,
        message: 'حدث خطأ غير متوقع أثناء فحص الاتصال.',
        error: err?.message || String(err)
      });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  // Typography & Appearance State
  const [selectedFont, setSelectedFont] = useState<string>('cairo');
  const [fontScale, setFontScale] = useState<string>('normal');

  useEffect(() => {
    const savedFont = localStorage.getItem('netflow_font_family') || 'cairo';
    const savedScale = localStorage.getItem('netflow_font_scale') || 'normal';
    setSelectedFont(savedFont);
    setFontScale(savedScale);
    applyFontSettings(savedFont, savedScale);
  }, []);

  const applyFontSettings = (font: string, scale: string) => {
    const fontClasses = ['font-cairo', 'font-alexandria', 'font-readex', 'font-tajawal'];
    fontClasses.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(`font-${font}`);

    // Adjust scaling
    if (scale === 'compact') {
      document.documentElement.style.fontSize = '14.5px';
    } else if (scale === 'large') {
      document.documentElement.style.fontSize = '17px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    localStorage.setItem('netflow_font_family', font);
    applyFontSettings(font, fontScale);
  };

  const handleScaleChange = (scale: string) => {
    setFontScale(scale);
    localStorage.setItem('netflow_font_scale', scale);
    applyFontSettings(selectedFont, scale);
  };

  // Profile Editing & Modal State
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isNewProfileModal, setIsNewProfileModal] = useState<boolean>(false);

  // New Profile form
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newRateLimit, setNewRateLimit] = useState<string>('5M/2M');
  const [newUptime, setNewUptime] = useState<string>('24 ساعة');
  const [newByte, setNewByte] = useState<string>('2 جيجابايت');
  const [newPrice, setNewPrice] = useState<number>(1000);
  const [newWholesale, setNewWholesale] = useState<number>(850);
  const [newValidity, setNewValidity] = useState<number>(7);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      businessName,
      tagline,
      phone,
      currency,
      ownerName
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const isUnlimited =
      !newUptime.trim() ||
      /غير\s*محد[ود]/i.test(newUptime) ||
      /مفتوح/i.test(newUptime) ||
      newUptime.trim() === '0';
    const computedUptimeDisplay = isUnlimited ? 'غير محدد' : newUptime.trim();
    const computedUptimeLimit = isUnlimited ? '0s' : (formatUptimeLimit(newUptime) || '1d');

    const newProf: Profile = {
      id: `prof_${Date.now()}`,
      tenantId: tenant.id,
      name: newProfileName.trim(),
      rateLimit: 'عامة (اختيار المشترك)',
      uptimeLimit: computedUptimeLimit,
      uptimeDisplay: computedUptimeDisplay,
      byteLimit: '2147483648',
      byteDisplay: newByte,
      price: newPrice,
      wholesalePrice: newWholesale,
      validityDays: newValidity,
      badgeColor: '#3b82f6',
      active: true
    };

    onUpdateProfiles([...profiles, newProf]);
    setNewProfileName('');
    setNewPrice(1000);
    setNewWholesale(850);
  };

  const handleOpenEditProfileModal = (prof: Profile) => {
    setEditingProfile(prof);
    setIsNewProfileModal(false);
    setIsEditModalOpen(true);
  };

  const handleOpenNewProfileModal = () => {
    setEditingProfile(null);
    setIsNewProfileModal(true);
    setIsEditModalOpen(true);
  };

  const handleSaveModalProfile = (savedProf: Profile) => {
    if (isNewProfileModal) {
      onUpdateProfiles([...profiles, savedProf]);
    } else {
      onUpdateProfiles(profiles.map(p => (p.id === savedProf.id ? savedProf : p)));
    }
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('يجب أن تحتوي الشبكة على باقة واحدة على الأقل!');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      onUpdateProfiles(profiles.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Sub Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition relative ${
            activeSubTab === 'subscriptions'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-950/40'
              : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>باقات واشتراكات المنصة</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            ترقية ⚡
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'team'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة فريق العمل والموزعين ({team.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('network')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'network'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>هوية الشبكة والباقات والأسعار</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'appearance'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>الخطوط والمظهر العام للواجهة</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cloud')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'cloud'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>المزامنة السحابية و Firebase</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* TAB 1: Team & Staff Management (RBAC) */}
      {activeSubTab === 'team' && (
        <TeamManager
          tenant={tenant}
          team={team}
          onAddMember={onAddTeamMember}
          onUpdateMember={onUpdateTeamMember}
          onDeleteMember={onDeleteTeamMember}
        />
      )}

      {/* TAB 2: Network Profile & Speed Profiles */}
      {activeSubTab === 'network' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-sky-400" />
              إعدادات الشبكة وباقات الإنترنت
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              تخصيص هوية الشبكة، العملة الرسمية، إدارة باقات وسرعات الكروت والأسعار.
            </p>
          </div>

          {/* Network Profile Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-400" />
                الهوية التجارية والعملة
              </h2>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الشبكة الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المالك / المدير</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">شعار وسلوجان الشبكة</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="أسرع تغطية واي فاي في المنطقة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم هاتف الدعم الفني / المبيعات</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">عملة النظام والحسابات</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  className="w-full max-w-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="YER">ريال يمني (ر.ي)</option>
                  <option value="SAR">ريال سعودي (ر.س)</option>
                  <option value="EGP">جنيه مصري (ج.م)</option>
                  <option value="USD">دولار أمريكي ($)</option>
                  <option value="IQD">دينار عراقي (د.ع)</option>
                  <option value="AED">درهم إماراتي (د.إ)</option>
                  <option value="OMR">ريال عماني (ر.ع)</option>
                  <option value="KWD">دينار كويتي (د.ك)</option>
                </select>
              </div>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ بيانات الشبكة بنجاح!</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-md shadow-sky-900/30"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>

          {/* Internet Profiles Management */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-white text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  باقات وسعات الإنترنت (Profiles)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  حدد فئات الكروت، حجم البيانات، والوقت المتاح مع أسعار الجملة والتجزئة. (الكروت عامة وسرعة التصفح يحددها الزبون من صفحة الدخول).
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewProfileModal}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باقة جديدة</span>
              </button>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">اسم الباقة</th>
                    <th className="py-2.5 px-3">نظام السرعة</th>
                    <th className="py-2.5 px-3">الوقت المتاح</th>
                    <th className="py-2.5 px-3">حجم البيانات</th>
                    <th className="py-2.5 px-3">سعر الجملة للبقالة</th>
                    <th className="py-2.5 px-3">سعر البيع للجمهور</th>
                    <th className="py-2.5 px-3">الصلاحية</th>
                    <th className="py-2.5 px-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {profiles.map(prof => (
                    <tr key={prof.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: prof.badgeColor || '#0ea5e9' }}
                        />
                        <span>{prof.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-bold inline-flex items-center gap-1">
                          ⚡ عامة (يحددها الزبون)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-300">
                        {prof.uptimeDisplay}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-emerald-400">
                        {prof.byteDisplay}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {formatCurrency(prof.wholesalePrice, currency)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-amber-400">
                        {formatCurrency(prof.price, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {prof.validityDays} يوم
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProfileModal(prof)}
                            title="تعديل بيانات الباقة والأسعار"
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(prof.id)}
                            title="حذف الباقة"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Profile Form */}
            <form onSubmit={handleAddProfile} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  إضافة فئة باقة جديدة
                </h3>
                <span className="text-[11px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                  كروت عامة موحدة • السرعة يحددها المشترك عند تسجيل الدخول
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">اسم الباقة *</label>
                  <input
                    type="text"
                    required
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    placeholder="مثال: باقة 1500 (3 جيجا - يومين)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 text-xs font-medium">الوقت المتاح للمشترك</label>
                    {(newUptime === 'غير محدد' || /غير\s*محد[ود]/i.test(newUptime) || newUptime === 'مفتوح') && (
                      <span className="text-[10px] text-emerald-400 font-medium">مفتوح بدون حد</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newUptime}
                    onChange={e => setNewUptime(e.target.value)}
                    placeholder="مثال: 24 ساعة أو غير محدد"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none text-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: 'غير محدد', val: 'غير محدد' },
                      { label: '6 ساعات', val: '6 ساعات' },
                      { label: '12 ساعة', val: '12 ساعة' },
                      { label: '24 ساعة', val: '24 ساعة' },
                      { label: '3 أيام', val: '3 أيام' },
                      { label: '7 أيام', val: '7 أيام' }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setNewUptime(p.val)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          newUptime === p.val
                            ? p.val === 'غير محدد'
                              ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                              : 'bg-amber-600 text-white border-amber-500 font-bold'
                            : p.val === 'غير محدد'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">حجم البيانات (جيجابايت)</label>
                  <input
                    type="text"
                    value={newByte}
                    onChange={e => setNewByte(e.target.value)}
                    placeholder="مثال: 3 جيجابايت"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">سعر الجملة للبقالة *</label>
                  <input
                    type="number"
                    required
                    value={newWholesale}
                    onChange={e => setNewWholesale(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">سعر البيع للجمهور *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">فترة الصلاحية (بالأيام)</label>
                  <input
                    type="number"
                    value={newValidity}
                    onChange={e => setNewValidity(parseInt(e.target.value) || 7)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-md shadow-emerald-900/30"
                >
                  إضافة الباقة للقائمة
                </button>
              </div>
            </form>
          </div>

          {/* System Reset & Clean Slate Production Mode */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                إدارة قاعدة البيانات وتهيئة الإنتاج الفعلي (Clean Slate)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                خيارات تصفير السجلات والبدء بسجل نظيف أو إعادة ملء البيانات التجريبية لتجربة الميزات.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {onOpenCleanModal && (
                <button
                  type="button"
                  onClick={onOpenCleanModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تهيئة للإنتاج الفعلي (مسح الكروت والبقالات الوهمية)</span>
                </button>
              )}

              {onOpenOnboardingWizard && (
                <button
                  type="button"
                  onClick={onOpenOnboardingWizard}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold transition"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>معالج التهيئة السريع (3 خطوات)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات التجريبية؟')) {
                    onResetData();
                  }
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
              >
                إعادة تحميل النموذج الافتراضي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Typography & UI Appearance */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Type className="w-6 h-6 text-sky-400" />
              تخصيص الخطوط والمظهر العام للواجهة
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              اختر الخط العربي الأنسب لعينيك من بين أرقى الخطوط الرقمية المعتمدة في تصميم واجهات الأنظمة والداشبورد، مع التحكم بحجم النصوص وتناسق الأرقام.
            </p>
          </div>

          {/* Font Family Cards Grid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                نوع الخط العربي الأساسي (Font Family)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يتم تطبيق الخط المختار فوراً على كامل أجزاء النظام مع حفظه في المتصفح.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Font 1: Cairo */}
              <button
                type="button"
                onClick={() => handleFontChange('cairo')}
                className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative group ${
                  selectedFont === 'cairo'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-200 ring-2 ring-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-bold text-sky-400 font-cairo">
                      ك
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white font-cairo">خط كايرو (Cairo)</div>
                      <div className="text-[11px] text-slate-400">الخط القياسي الأكثر توازناً في أنظمة الويب الحديثة</div>
                    </div>
                  </div>
                  {selectedFont === 'cairo' && (
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 w-full font-cairo">
                  <div className="text-xs font-semibold text-slate-200">
                    سام تك لإدارة شبكات المايكروتك وتوزيع الكروت الذكية
                  </div>
                  <div className="text-[11px] text-sky-400 mt-1 flex items-center justify-between">
                    <span>90,000 ر.ي رصيد</span>
                    <span className="text-slate-400">كروت 500 و 1000 ر.ي</span>
                  </div>
                </div>
              </button>

              {/* Font 2: Alexandria */}
              <button
                type="button"
                onClick={() => handleFontChange('alexandria')}
                className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative group ${
                  selectedFont === 'alexandria'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-200 ring-2 ring-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 font-alexandria">
                      س
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white font-alexandria">خط الإسكندرية (Alexandria)</div>
                      <div className="text-[11px] text-slate-400">تصميم هندسي فائق الأناقة والوضوح للأنظمة السحابية</div>
                    </div>
                  </div>
                  {selectedFont === 'alexandria' && (
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 w-full font-alexandria">
                  <div className="text-xs font-semibold text-slate-200">
                    سام تك لإدارة شبكات المايكروتك وتوزيع الكروت الذكية
                  </div>
                  <div className="text-[11px] text-purple-400 mt-1 flex items-center justify-between">
                    <span>90,000 ر.ي رصيد</span>
                    <span className="text-slate-400">كروت 500 و 1000 ر.ي</span>
                  </div>
                </div>
              </button>

              {/* Font 3: Readex Pro */}
              <button
                type="button"
                onClick={() => handleFontChange('readex')}
                className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative group ${
                  selectedFont === 'readex'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-200 ring-2 ring-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 font-readex">
                      ر
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white font-readex">خط ريدكس برو (Readex Pro)</div>
                      <div className="text-[11px] text-slate-400">أعلى درجات المقروئية والوضوح للشاشات وبطاقات الطباعة</div>
                    </div>
                  </div>
                  {selectedFont === 'readex' && (
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 w-full font-readex">
                  <div className="text-xs font-semibold text-slate-200">
                    سام تك لإدارة شبكات المايكروتك وتوزيع الكروت الذكية
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-between">
                    <span>90,000 ر.ي رصيد</span>
                    <span className="text-slate-400">كروت 500 و 1000 ر.ي</span>
                  </div>
                </div>
              </button>

              {/* Font 4: Tajawal */}
              <button
                type="button"
                onClick={() => handleFontChange('tajawal')}
                className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between gap-3 relative group ${
                  selectedFont === 'tajawal'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-200 ring-2 ring-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 font-tajawal">
                      ت
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white font-tajawal">خط تجوال (Tajawal)</div>
                      <div className="text-[11px] text-slate-400">خط عربي ناعم وسلس مريح للعين أثناء العمل الطويل</div>
                    </div>
                  </div>
                  {selectedFont === 'tajawal' && (
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 w-full font-tajawal">
                  <div className="text-xs font-semibold text-slate-200">
                    سام تك لإدارة شبكات المايكروتك وتوزيع الكروت الذكية
                  </div>
                  <div className="text-[11px] text-amber-400 mt-1 flex items-center justify-between">
                    <span>90,000 ر.ي رصيد</span>
                    <span className="text-slate-400">كروت 500 و 1000 ر.ي</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Scale & Spacing Options */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-sky-400" />
                كثافة وحجم نصوص الواجهة (UI Scaling)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                التحكم بمقاس خطوط النظام بما يتناسب مع حجم شاشتك ومجال رؤيتك.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleScaleChange('compact')}
                className={`p-3.5 rounded-xl border text-center transition ${
                  fontScale === 'compact'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">مدمج ومكثف للبيانات</div>
                <div className="text-[11px] text-slate-500 mt-0.5">مناسب للشاشات الصغيرة ولعرض جداول كثيفة</div>
              </button>

              <button
                type="button"
                onClick={() => handleScaleChange('normal')}
                className={`p-3.5 rounded-xl border text-center transition ${
                  fontScale === 'normal'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">قياسي ومريح (الافتراضي)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">توازن مثالي بين الوضوح والمساحات</div>
              </button>

              <button
                type="button"
                onClick={() => handleScaleChange('large')}
                className={`p-3.5 rounded-xl border text-center transition ${
                  fontScale === 'large'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">كبير وبارز</div>
                <div className="text-[11px] text-slate-500 mt-0.5">راحة تامة للعين ونصوص واضحة من مسافة</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Platform Subscriptions for Network Owners */}
      {activeSubTab === 'subscriptions' && (
        <div className="space-y-6">
          <SubscriptionPlansCard
            tenant={tenant}
            onSelectPlan={(plan, billing) => {
              const planNames = {
                starter: 'الخطة المجانية',
                pro: 'الخطة الاحترافية',
                enterprise: 'خطة الشركات والمؤسسات'
              };
              const maxCardsMap = {
                starter: 300,
                pro: 999999,
                enterprise: 9999999
              };
              const maxDistributorsMap = {
                starter: 1,
                pro: 15,
                enterprise: 9999
              };

              const updatedSub: TenantSubscription = {
                plan,
                planNameArabic: planNames[plan],
                status: 'active',
                maxCards: maxCardsMap[plan],
                maxDistributors: maxDistributorsMap[plan],
                billingPeriod: billing === 'yearly' ? 'yearly' : 'monthly',
                expiresAt: new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
              };

              onUpdateTenant({
                subscription: updatedSub
              });

              alert(`تم بنجاح تحديث وتفعيل ${planNames[plan]} بنظام الدفع ${billing === 'yearly' ? 'السنوي' : 'الشهري'}!`);
            }}
          />
        </div>
      )}

      {/* TAB 5: Cloud Synchronization & Firebase Rules Diagnostics */}
      {activeSubTab === 'cloud' && (
        <div className="space-y-6">
          {/* Cloud Connection Live Status Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    حالة المزامنة السحابية (Firebase Cloud Firestore)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      متصل ومفعل
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    يتم حفظ كافة كروت الشبكة، الباقات، السندات، الحسابات، وقوالب الطباعة تلقائياً في السحابة ومزامنتها لحظياً عبر جميع الأجهزة.
                  </p>
                </div>
              </div>

              {/* Action Button: Live Ping Test */}
              <button
                type="button"
                onClick={handleTestCloudSync}
                disabled={isTestingCloud}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/40"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingCloud ? 'animate-spin' : ''}`} />
                <span>{isTestingCloud ? 'جاري فحص الاتصال...' : 'اختبار الاتصال والكتابة السحابية الآن'}</span>
              </button>
            </div>

            {/* Test Result Alert Banner */}
            {cloudTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 transition ${
                  cloudTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {cloudTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-bold text-sm">
                    {cloudTestResult.success ? '✅ نجح اختبار السحابة!' : '⚠️ تنبيه في إعدادات فيرباس'}
                  </div>
                  <div>{cloudTestResult.message}</div>
                  {cloudTestResult.latencyMs && (
                    <div className="text-[11px] opacity-80">
                      سرعة الاستجابة: <span className="font-mono font-bold">{cloudTestResult.latencyMs}ms</span>
                    </div>
                  )}
                  {cloudTestResult.error && (
                    <div className="p-2 bg-slate-950/60 rounded border border-rose-500/30 font-mono text-[10px] text-rose-300 mt-2 break-all" dir="ltr">
                      {cloudTestResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tenant Cloud Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="text-[11px] text-slate-400">معرّف نطاق الشبكة السحابي (Tenant ID):</div>
                <div className="text-xs font-mono font-bold text-sky-400 mt-1 truncate" dir="ltr">
                  {tenant.id}
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="text-[11px] text-slate-400">البريد الإلكتروني لمالك الشبكة:</div>
                <div className="text-xs font-bold text-slate-200 mt-1 truncate" dir="ltr">
                  {tenant.ownerEmail || 'mosthassan.ye@gmail.com'}
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="text-[11px] text-slate-400">نظام المزامنة:</div>
                <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  مزامنة تلقائية متزامنة لحظياً
                </div>
              </div>
            </div>
          </div>

          {/* Firebase Console Setup Guide & Rules Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                دليل إعدادات Firebase المطلوبة في حسابك (Firebase Console)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                لضمان عمل المزامنة السحابية وتخزين البيانات وقراءتها عند الدخول من أي متصفح أو جهاز آخر، تأكد من ضبط الإعدادات التالية في مشروع Firebase الخاص بك:
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    تفعيل قاعدة بيانات Cloud Firestore
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    من لوحة تحكم Firebase: اذهب إلى <strong className="text-slate-200">Build &gt; Firestore Database</strong> وتأكد من إنشاء قاعدة البيانات (في وضع Production أو Test mode).
                  </p>
                </div>
              </div>

              {/* Item 2: Firestore Rules */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>قواعد الحماية (Firestore Rules)</span>
                    <button
                      type="button"
                      onClick={handleCopyRules}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[11px] font-bold transition border border-slate-700"
                    >
                      {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRules ? 'تم نسخ القواعد!' : 'نسخ القواعد'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    انسخ القواعد التالية والصقها في <strong className="text-slate-200">Firestore Database &gt; Rules</strong> ثم اضغط <strong className="text-emerald-400">Publish</strong> للسماح بحفظ الكروت والبيانات دون أي قيود صلاحيات:
                  </p>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto" dir="ltr">
                    {FIRESTORE_RULES_SNIPPET}
                  </pre>
                </div>
              </div>

              {/* Item 3: Google Sign-In */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    تفعيل تسجيل الدخول عبر Google (Authentication)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    من لوحة Firebase: اذهب إلى <strong className="text-slate-200">Build &gt; Authentication &gt; Sign-in method</strong> وتأكد من تفعيل <strong className="text-sky-400">Google</strong> و <strong className="text-slate-300">Anonymous</strong>.
                  </p>
                </div>
              </div>

              {/* Item 4: Authorized Domains */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    إضافة النطاق المصرّح به (Authorized Domains)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    من لوحة Firebase: اذهب إلى <strong className="text-slate-200">Authentication &gt; Settings &gt; Authorized domains</strong> وأضف عنوان الموقع أو النطاق الحالي الذي تفتح منه التطبيق ليسمح بالدخول عبر حساب Google بسلاسة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/New Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={editingProfile}
        tenant={tenant}
        onSaveProfile={handleSaveModalProfile}
        isNew={isNewProfileModal}
      />
    </div>
  );
};


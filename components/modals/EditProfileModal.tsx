'use client';

import React, { useState, useEffect } from 'react';
import { Profile, Tenant } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import {
  X,
  Sliders,
  Sparkles,
  Zap,
  Clock,
  HardDrive,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  Palette
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  tenant: Tenant;
  onSaveProfile: (profile: Profile) => void;
  isNew?: boolean;
}

const SPEED_PRESETS = [
  { label: '1 ميجا', val: '1M/512k' },
  { label: '2 ميجا', val: '2M/1M' },
  { label: '3 ميجا', val: '3M/1.5M' },
  { label: '5 ميجا', val: '5M/2M' },
  { label: '8 ميجا', val: '8M/3M' },
  { label: '10 ميجا', val: '10M/4M' },
  { label: '20 ميجا', val: '20M/5M' },
  { label: 'مفتوح', val: '0/0' }
];

const DATA_PRESETS = [
  { label: '500 ميجا', val: '500 ميجابايت', bytes: '524288000' },
  { label: '1 جيجا', val: '1 جيجابايت', bytes: '1073741824' },
  { label: '2 جيجا', val: '2 جيجابايت', bytes: '2147483648' },
  { label: '3 جيجا', val: '3 جيجابايت', bytes: '3221225472' },
  { label: '5 جيجا', val: '5 جيجابايت', bytes: '5368709120' },
  { label: '10 جيجا', val: '10 جيجابايت', bytes: '10737418240' },
  { label: 'مفتوح', val: 'غير محدود', bytes: '0' }
];

const UPTIME_PRESETS = [
  { label: '2 ساعة', val: '2 ساعة', limit: '2h' },
  { label: '6 ساعات', val: '6 ساعات', limit: '6h' },
  { label: '12 ساعة', val: '12 ساعة', limit: '12h' },
  { label: '24 ساعة', val: '24 ساعة', limit: '1d' },
  { label: '3 أيام', val: '3 أيام', limit: '3d' },
  { label: '7 أيام', val: '7 أيام', limit: '7d' },
  { label: 'شهر', val: '30 يوم', limit: '30d' }
];

const COLOR_PRESETS = [
  { name: 'أزرق سماوي', color: '#0ea5e9' },
  { name: 'أخضر زمردي', color: '#10b981' },
  { name: 'أصفر كهرماني', color: '#f59e0b' },
  { name: 'بنفسجي ملكي', color: '#8b5cf6' },
  { name: 'وردي ياقوتي', color: '#f43f5e' },
  { name: 'نيلي داكن', color: '#6366f1' },
  { name: 'رمادي فضي', color: '#64748b' }
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  tenant,
  onSaveProfile,
  isNew = false
}) => {
  const [name, setName] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<string>('5M/2M');
  const [uptimeDisplay, setUptimeDisplay] = useState<string>('24 ساعة');
  const [uptimeLimit, setUptimeLimit] = useState<string>('1d');
  const [byteDisplay, setByteDisplay] = useState<string>('1 جيجابايت');
  const [byteLimit, setByteLimit] = useState<string>('1073741824');
  const [price, setPrice] = useState<number>(500);
  const [wholesalePrice, setWholesalePrice] = useState<number>(400);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [badgeColor, setBadgeColor] = useState<string>('#0ea5e9');
  const [active, setActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setRateLimit(profile.rateLimit || '5M/2M');
      setUptimeDisplay(profile.uptimeDisplay || '24 ساعة');
      setUptimeLimit(profile.uptimeLimit || '1d');
      setByteDisplay(profile.byteDisplay || '1 جيجابايت');
      setByteLimit(profile.byteLimit || '1073741824');
      setPrice(profile.price || 500);
      setWholesalePrice(profile.wholesalePrice || 400);
      setValidityDays(profile.validityDays || 7);
      setBadgeColor(profile.badgeColor || '#0ea5e9');
      setActive(profile.active !== false);
      setError(null);
    } else {
      setName('');
      setRateLimit('5M/2M');
      setUptimeDisplay('24 ساعة');
      setUptimeLimit('1d');
      setByteDisplay('1 جيجابايت');
      setByteLimit('1073741824');
      setPrice(500);
      setWholesalePrice(400);
      setValidityDays(7);
      setBadgeColor('#0ea5e9');
      setActive(true);
      setError(null);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const profitMargin = Math.max(0, price - wholesalePrice);
  const profitPercentage = wholesalePrice > 0 ? Math.round((profitMargin / wholesalePrice) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم الباقة');
      return;
    }
    if (price < 0 || wholesalePrice < 0) {
      setError('لا يمكن أن تكون الأسعار أقل من صفر');
      return;
    }
    if (wholesalePrice > price) {
      setError('تنبيه: سعر الجملة للبقالة أعلى من سعر البيع للجمهور!');
    }

    const updatedProfile: Profile = {
      id: profile ? profile.id : `prof_${Date.now()}`,
      tenantId: tenant.id,
      name: name.trim(),
      rateLimit: 'عامة (اختيار المشترك)',
      uptimeDisplay: uptimeDisplay.trim() || '24 ساعة',
      uptimeLimit: uptimeLimit.trim() || '1d',
      byteDisplay: byteDisplay.trim() || '1 جيجابايت',
      byteLimit: byteLimit.trim() || '1073741824',
      price: Number(price),
      wholesalePrice: Number(wholesalePrice),
      validityDays: Number(validityDays) || 7,
      badgeColor,
      active
    };

    onSaveProfile(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-100" dir="rtl">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: badgeColor }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{isNew ? 'إضافة باقة إنترنت جديدة' : 'تعديل بيانات الباقة'}</span>
                {!isNew && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {profile?.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل الأسعار والسرعات وحجم البيانات المخصص للمشتركين وراوترات المايكروتك.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Badge Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                <span>اسم وتوصيف الباقة *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: باقة 500 (1 جيجا - 24 ساعة)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>لون تمييز الباقة</span>
              </label>
              <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-700">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.name}
                    onClick={() => setBadgeColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-lg transition transform ${
                      badgeColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Section (Retail & Wholesale) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>التسعير والأرباح ({tenant.currency})</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                ربح البقالة للكرت: {formatCurrency(profitMargin, tenant.currency)} ({profitPercentage}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  سعر البيع النهائي للجمهور *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute left-3 top-2 text-[11px] text-slate-500 font-bold">{tenant.currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  سعر الجملة للبقالات والموزعين *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    value={wholesalePrice}
                    onChange={e => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold text-sm focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute left-3 top-2 text-[11px] text-slate-500 font-bold">{tenant.currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  صلاحية الكرت بعد التفعيل (بالأيام)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={e => setValidityDays(parseInt(e.target.value, 10) || 7)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold text-sm focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute left-3 top-2 text-[11px] text-slate-500 font-bold">أيام</span>
                </div>
              </div>
            </div>
          </div>

          {/* MikroTik Network Limits (Speed dynamic note, Uptime, Bytes) */}
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-300">الكروت عامة وسرعة التصفح ديناميكية</h4>
              <p className="text-[11px] text-slate-300">
                لا يتم تقييد السرعة مسبقاً على الكرت، بل يقوم المشترك باختيار سرعته المفضلة (فائق السرعة / متوازن / موفر بيانات) مباشرة من صفحة تسجيل الدخول (Hotspot Portal).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Uptime Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>الوقت المتاح للمشترك</span>
              </label>
              <input
                type="text"
                value={uptimeDisplay}
                onChange={e => setUptimeDisplay(e.target.value)}
                placeholder="24 ساعة"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {UPTIME_PRESETS.slice(0, 4).map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      setUptimeDisplay(p.val);
                      setUptimeLimit(p.limit);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                      uptimeDisplay === p.val
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>حجم البيانات (جيجابايت)</span>
              </label>
              <input
                type="text"
                value={byteDisplay}
                onChange={e => setByteDisplay(e.target.value)}
                placeholder="1 جيجابايت"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {DATA_PRESETS.slice(0, 4).map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      setByteDisplay(p.val);
                      setByteLimit(p.bytes);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                      byteDisplay === p.val
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-slate-200">تفعيل هذه الباقة في القوائم وتوليد الكروت</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-900/40 transition transform active:scale-95"
            >
              {isNew ? 'إضافة الباقة وحفظها' : 'حفظ التعديلات على الباقة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Tenant, Profile, Currency } from '@/types';
import {
  Sparkles,
  Building,
  Sliders,
  Router,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Zap,
  Globe,
  DollarSign
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  profiles: Profile[];
  onUpdateTenant: (updates: Partial<Tenant>) => void;
  onUpdateProfiles: (profiles: Profile[]) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  tenant,
  profiles,
  onUpdateTenant,
  onUpdateProfiles
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Network Profile State
  const [businessName, setBusinessName] = useState(tenant.businessName);
  const [phone, setPhone] = useState(tenant.phone);
  const [currency, setCurrency] = useState<Currency>(tenant.currency);
  const [tagline, setTagline] = useState(tenant.tagline);

  // Step 2: Profiles State
  const [wizardProfiles, setWizardProfiles] = useState<Profile[]>(profiles);

  // Step 3: Router Config State
  const [routerIp, setRouterIp] = useState(tenant.settings.routerIp || '10.0.0.1');
  const [loginDomain, setLoginDomain] = useState(tenant.settings.loginDomain || 'wifi.net');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStep === 1) {
      onUpdateTenant({
        businessName,
        phone,
        currency,
        tagline
      });
      setCurrentStep(2);
    } else if (currentStep === 2) {
      onUpdateProfiles(wizardProfiles);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      onUpdateTenant({
        settings: {
          ...tenant.settings,
          routerIp,
          loginDomain,
          autoLoginUrlPattern: `http://${loginDomain}/login?username={code}&password={password}`
        }
      });
      onClose();
    }
  };

  const handleUpdateProfilePrice = (id: string, price: number, wholesalePrice: number) => {
    setWizardProfiles(prev =>
      prev.map(p => (p.id === id ? { ...p, price, wholesalePrice } : p))
    );
  };

  const copyRouterQuickScript = () => {
    const script = `# ==============================================
# NetFlow SaaS - Setup Hotspot Server Profile
# ==============================================
/ip hotspot profile
set [find default=yes] login-by=http-chap,http-pap dns-name="${loginDomain}"
/ip hotspot user profile
${wizardProfiles
  .map(
    p =>
      `add name="${p.name.split(' ')[0]}" rate-limit="${p.rateLimit}" session-timeout="${
        p.uptimeLimit || '1d'
      }"`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Wizard Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">معالج تهيئة الشبكة السريع</h2>
              <p className="text-xs text-slate-400">إعداد شبكتك للإنتاج الفعلي في 3 خطوات بسيطة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-around text-xs">
          <div
            className={`flex items-center gap-2 ${
              currentStep === 1
                ? 'text-sky-400 font-bold'
                : currentStep > 1
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 1
                  ? 'bg-sky-500 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </span>
            <span>هوية الشبكة والعملة</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-800" />

          <div
            className={`flex items-center gap-2 ${
              currentStep === 2
                ? 'text-sky-400 font-bold'
                : currentStep > 2
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 2
                  ? 'bg-sky-500 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </span>
            <span>باقات وسرعات الكروت</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-800" />

          <div
            className={`flex items-center gap-2 ${
              currentStep === 3
                ? 'text-sky-400 font-bold'
                : 'text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 3
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </span>
            <span>الربط مع المايكروتك</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 text-xs space-y-4 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: Network Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Building className="w-4 h-4 text-sky-400" />
                <span>الخطوة 1: ضبط اسم الشبكة وبيانات الاتصال والعملة</span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الشبكة الرسمي *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم هاتف الدعم الفني</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">عملة النظام والحسابات</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as Currency)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
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
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">سلوجان أو عبارة الترحيب</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="أسرع تغطية واي فاي في منطقتك"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Profiles Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>الخطوة 2: ضبط أسعار باقات الكروت (سعر الجملة للبقالات وسعر البيع)</span>
              </div>

              <div className="space-y-2.5">
                {wizardProfiles.map(prof => (
                  <div
                    key={prof.id}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{prof.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        السرعة: {prof.rateLimit} • الوقت: {prof.uptimeDisplay}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-400">سعر الجملة:</span>
                        <input
                          type="number"
                          value={prof.wholesalePrice}
                          onChange={e =>
                            handleUpdateProfilePrice(
                              prof.id,
                              prof.price,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono text-center font-bold"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400">سعر البيع:</span>
                        <input
                          type="number"
                          value={prof.price}
                          onChange={e =>
                            handleUpdateProfilePrice(
                              prof.id,
                              parseFloat(e.target.value) || 0,
                              prof.wholesalePrice
                            )
                          }
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: MikroTik DNS / IP */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>الخطوة 3: عنوان صفحة تسجيل الدخول لشبكتك (Hotspot DNS)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">دومين تسجيل الدخول (DNS Name) *</label>
                  <input
                    type="text"
                    required
                    value={loginDomain}
                    onChange={e => setLoginDomain(e.target.value)}
                    placeholder="wifi.net أو login.lan"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    يستخدم لتوليد باركود QR للدخول التلقائي فور مسح الكاميرا
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">عنوان IP الهوتسبوت الداخلي</label>
                  <input
                    type="text"
                    value={routerIp}
                    onChange={e => setRouterIp(e.target.value)}
                    placeholder="10.0.0.1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Quick MikroTik Script Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>سكربت تهيئة بروفايلات المايكروتك السريع:</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyRouterQuickScript}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-bold transition"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ للترمنال</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl font-mono text-[11px] text-sky-300 overflow-x-auto select-all">
                  /ip hotspot profile set [find default=yes] dns-name=&quot;{loginDomain}&quot;
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-900/30 transition transform active:scale-95"
          >
            <span>{currentStep === 3 ? 'إنهاء التهيئة وبدء الاستخدام' : 'متابعة الخطوة التالية'}</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

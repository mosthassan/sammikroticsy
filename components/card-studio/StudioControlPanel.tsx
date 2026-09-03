'use client';

import React, { useState } from 'react';
import { Card, CardTemplate, Profile, Tenant, CodeCharSet } from '@/types';
import { PREBUILT_TEMPLATES_LIBRARY } from '@/lib/templates';
import { formatCurrency } from '@/lib/formatters';
import { CARD_GRID_PRESETS, computeCardAutoScale } from '@/lib/utils';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import {
  Zap,
  Palette,
  Sliders,
  Layers,
  Terminal,
  FileSpreadsheet,
  FileDown,
  Sparkles,
  Wand2,
  ImagePlus,
  Trash2,
  Check,
  CheckCircle,
  CheckCircle2,
  Cloud,
  Loader2,
  Hash,
  Type,
  KeyRound,
  Lock,
  QrCode,
  Lightbulb,
  UploadCloud,
  Pencil,
  Plus,
  Minus,
  Calendar,
  Maximize2,
  Ruler,
  LayoutGrid,
  Tag,
  Box,
  Paintbrush
} from 'lucide-react';

interface StudioControlPanelProps {
  tenant: Tenant;
  profiles: Profile[];
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  selectedProfile: Profile | undefined;
  onUpdateProfiles?: (profiles: Profile[]) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  prefix: string;
  setPrefix: (p: string) => void;
  codeLength: number;
  setCodeLength: (l: number) => void;
  codeCharSet: CodeCharSet;
  setCodeCharSet: (c: CodeCharSet) => void;
  passwordType: 'same_as_username' | 'separate_pin' | 'no_password';
  setPasswordType: (t: 'same_as_username' | 'separate_pin' | 'no_password') => void;
  templates: CardTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  currentTemplate: CardTemplate;
  handleUpdateTemplate: (updates: Partial<CardTemplate>) => void;
  handleSaveTemplateToFirestore: () => void;
  isSavingToFirestore: boolean;
  isSavedInFirestore: boolean;
  aiPrompt: string;
  setAiPrompt: (p: string) => void;
  isGeneratingAiTemplate: boolean;
  aiGenerationStep: string;
  aiError: string | null;
  setAiError: (err: string | null) => void;
  handleGenerateAiTemplate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveCustomTemplate: () => void;
  activeCards: Card[];
  scriptFlavor: 'hotspot_v7' | 'hotspot_v6' | 'userman_v7' | 'userman_v6';
  setScriptFlavor: (f: 'hotspot_v7' | 'hotspot_v6' | 'userman_v7' | 'userman_v6') => void;
  copiedScript: boolean;
  handleCopyMikroTikScript: () => void;
  handleDownloadRsc: () => void;
  handleExportCsv: () => void;
}

export const StudioControlPanel: React.FC<StudioControlPanelProps> = ({
  tenant,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  selectedProfile,
  onUpdateProfiles,
  quantity,
  setQuantity,
  prefix,
  setPrefix,
  codeLength,
  setCodeLength,
  codeCharSet,
  setCodeCharSet,
  passwordType,
  setPasswordType,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  currentTemplate,
  handleUpdateTemplate,
  handleSaveTemplateToFirestore,
  isSavingToFirestore,
  isSavedInFirestore,
  aiPrompt,
  setAiPrompt,
  isGeneratingAiTemplate,
  aiGenerationStep,
  aiError,
  setAiError,
  handleGenerateAiTemplate,
  fileInputRef,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileUpload,
  handleRemoveCustomTemplate,
  activeCards,
  scriptFlavor,
  setScriptFlavor,
  copiedScript,
  handleCopyMikroTikScript,
  handleDownloadRsc,
  handleExportCsv
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'styling' | 'elements' | 'layout' | 'scripts'>('generator');

  // Profile Edit & Create State in Studio
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState<boolean>(false);

  const handleSaveProfileFromStudio = (savedProf: Profile) => {
    if (onUpdateProfiles) {
      if (isNewProfileModalOpen) {
        onUpdateProfiles([...profiles, savedProf]);
        setSelectedProfileId(savedProf.id);
      } else {
        onUpdateProfiles(profiles.map(p => (p.id === savedProf.id ? savedProf : p)));
      }
    }
  };

  const AI_PROMPT_SUGGESTIONS = [
    { title: '🎮 نيون سايبربانك', prompt: 'قالب نيون سيبراني داكن لشبكة ألعاب وكافيهات مع موجات رقمية متوهجة' },
    { title: '💼 كلاسيكي فايبر أزرق', prompt: 'قالب كحلي ملكي راقي لشبكة فايبر سريعة مع لمسات ذهبية أنيقة' },
    { title: '📄 اقتصادي موفر للحبر', prompt: 'قالب أبيض وأسود نظيف واقتصادي جداً في استهلاك حبر الطابعات العادية' },
    { title: '⚡ سرعات تيربو نارية', prompt: 'قالب تيربو سريع بتدرجات برتقالية وحمراء تعبر عن السرعة الفائقة' }
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Studio Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl overflow-x-auto shadow-md">
        <button
          type="button"
          id="tab-generator-btn"
          onClick={() => setActiveTab('generator')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'generator'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>التوليد والأكواد</span>
        </button>

        <button
          type="button"
          id="tab-styling-btn"
          onClick={() => setActiveTab('styling')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'styling'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>القوالب وAI</span>
        </button>

        <button
          type="button"
          id="tab-elements-btn"
          onClick={() => setActiveTab('elements')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'elements'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>عناصر الكرت</span>
        </button>

        <button
          type="button"
          id="tab-layout-btn"
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'layout'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ورقة A4 والقص</span>
        </button>

        <button
          type="button"
          id="tab-scripts-btn"
          onClick={() => setActiveTab('scripts')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'scripts'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>المايكروتك</span>
        </button>
      </div>

      {/* TAB 1: GENERATOR */}
      {activeTab === 'generator' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-white text-base">معايير وتوليد الدفعة</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              الإجمالي: {quantity * (selectedProfile?.price || 0)} {tenant.currency}
            </span>
          </div>

          {/* Profile Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                باقة وسرعة الإنترنت
              </label>

              <div className="flex items-center gap-1.5">
                {selectedProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProfileModalOpen(false);
                      setIsEditProfileModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg text-xs font-semibold transition"
                    title="تعديل تفاصيل هذه الباقة (الأسعار، السرعة، الصلاحية)"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>تعديل الباقة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsNewProfileModalOpen(true);
                    setIsEditProfileModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition"
                  title="إنشاء باقة جديدة"
                >
                  <Plus className="w-3 h-3" />
                  <span>باقة جديدة</span>
                </button>
              </div>
            </div>

            <select
              id="select-profile"
              value={selectedProfileId}
              onChange={e => setSelectedProfileId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition font-sans"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — سعر الجمهور: {p.price} {tenant.currency} (جملة: {p.wholesalePrice})
                </option>
              ))}
            </select>

            {/* Profile Quick Spec Card */}
            {selectedProfile && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-500/15 text-sky-300 font-medium rounded-md text-[11px] flex items-center gap-1">
                    ⚡ كروت عامة (السرعة بصفحة الدخول)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 font-medium rounded-md text-[11px]">
                    الحجم: {selectedProfile.byteDisplay}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 font-medium rounded-md text-[11px]">
                    الوقت: {selectedProfile.uptimeDisplay}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 font-mono font-bold rounded-md text-[11px]">
                    السعر: {formatCurrency(selectedProfile.price, tenant.currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewProfileModalOpen(false);
                    setIsEditProfileModalOpen(true);
                  }}
                  className="text-sky-400 hover:text-sky-300 text-[11px] underline font-bold flex items-center gap-1"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>تعديل المعايير</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="bg-slate-950/90 border border-sky-500/30 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>نماذج سريعة جاهزة (مطابقة للمايكروتك واليوزر مانجر):</span>
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCodeCharSet('digits_only');
                  setPasswordType('same_as_username');
                  setPrefix('');
                  setCodeLength(6);
                }}
                className={`p-2 rounded-lg border text-right transition flex flex-col justify-between ${
                  codeCharSet === 'digits_only' && passwordType === 'same_as_username' && prefix === ''
                    ? 'bg-sky-600/25 border-sky-400 text-sky-200 ring-1 ring-sky-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">👑 أرقام فقط (يوزر مانجر)</div>
                <div className="text-[9.5px] text-slate-400 mt-1">كود برقم واحد • الأسهل للزبون</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeCharSet('digits_only');
                  setPasswordType('same_as_username');
                  setPrefix(`${selectedProfile?.price || 500}-`);
                  setCodeLength(5);
                }}
                className={`p-2 rounded-lg border text-right transition flex flex-col justify-between ${
                  codeCharSet === 'digits_only' && passwordType === 'same_as_username' && prefix.includes('-')
                    ? 'bg-sky-600/25 border-sky-400 text-sky-200 ring-1 ring-sky-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">🔢 بادئة مع السعر</div>
                <div className="text-[9.5px] text-slate-400 mt-1">مثال: {selectedProfile?.price || 500}-94812</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeCharSet('alphanumeric_upper');
                  setPasswordType('separate_pin');
                  setPrefix('NW-');
                  setCodeLength(6);
                }}
                className={`p-2 rounded-lg border text-right transition flex flex-col justify-between ${
                  passwordType === 'separate_pin'
                    ? 'bg-sky-600/25 border-sky-400 text-sky-200 ring-1 ring-sky-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">🔐 مستخدم + PIN منفصل</div>
                <div className="text-[9.5px] text-slate-400 mt-1">حماية وأمان مضاعف لمنع التخمين</div>
              </button>
            </div>
          </div>

          {/* Quantity Selector with Custom Number Input Box up to 5000+ */}
          <div className="bg-slate-950/95 border-2 border-sky-500/50 rounded-2xl p-4 shadow-xl space-y-3.5">
            {/* Header & A4 Page Count Badge */}
            <div className="flex items-center justify-between">
              <label htmlFor="custom-quantity-input" className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>عدد الكروت المطلوب توليدها:</span>
              </label>
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950 px-2.5 py-1 rounded-lg border border-sky-500/40">
                  {quantity.toLocaleString('en-US')} كرت • {Math.ceil(quantity / ((currentTemplate.cardsPerRow || 3) * (currentTemplate.cardsPerCol || 8)))} ورقة A4
                </span>
              </div>
            </div>

            {/* Direct Input Field for Custom Number + Stepper Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                <span>✏️ اكتب العدد المطلوب مباشرة (مثال: 500، 1000، 5000):</span>
                <span className="text-[10px] text-slate-400 font-mono">مرونة من 1 حتى 10,000 كرت</span>
              </div>
              
              <div className="bg-slate-900 border-2 border-sky-500/70 focus-within:border-sky-400 rounded-xl p-2 flex items-center gap-2 shadow-inner transition">
                <div className="relative flex-1">
                  <input
                    id="custom-quantity-input"
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={quantity}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        setQuantity(Math.min(10000, val));
                      } else if (e.target.value === '') {
                        setQuantity(1);
                      }
                    }}
                    className="w-full bg-transparent border-0 text-center font-mono font-black text-2xl text-sky-300 focus:outline-none focus:ring-0"
                    placeholder="5000"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    كرت
                  </span>
                </div>

                {/* Stepper Buttons for Instant Adjustments */}
                <div className="flex items-center gap-1 border-r border-slate-700/80 pr-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 24))}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition"
                    title="إنقاص ورقة A4 كاملة (24 كرت)"
                  >
                    -24
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(10000, prev + 24))}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition"
                    title="إضافة ورقة A4 كاملة (24 كرت)"
                  >
                    +24
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(10000, prev + 100))}
                    className="px-2 py-1.5 bg-sky-950 hover:bg-sky-900 active:bg-sky-800 text-sky-300 rounded-lg text-xs font-bold border border-sky-700 transition"
                    title="إضافة 100 كرت"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(10000, prev + 500))}
                    className="px-2 py-1.5 bg-sky-950 hover:bg-sky-900 active:bg-sky-800 text-sky-300 rounded-lg text-xs font-bold border border-sky-700 transition"
                    title="إضافة 500 كرت"
                  >
                    +500
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets: Standard & Commercial (Large Batches) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">أزرار سريعة للأعداد الشائعة:</span>
              </div>

              {/* Row 1: Standard A4 Sheet Presets (24 - 120 cards) */}
              <div className="grid grid-cols-5 gap-1.5">
                {[24, 48, 72, 96, 120].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      quantity === qty
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-1 ring-sky-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>

              {/* Row 2: Large Commercial Quantities (240 to 5000 cards) */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {[240, 500, 1000, 2500, 5000].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      quantity === qty
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900 text-amber-300/90 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/40 hover:text-amber-200'
                    }`}
                  >
                    {qty >= 1000 ? `${qty.toLocaleString('en-US')}` : `${qty}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Range Slider - Scaled smoothly up to 5000 */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 كرت</span>
                <span>2,500 كرت</span>
                <span>5,000 كرت</span>
              </div>
              <input
                id="quantity-slider"
                type="range"
                min={1}
                max={5000}
                step={1}
                value={Math.min(5000, quantity)}
                onChange={e => setQuantity(parseInt(e.target.value) || 24)}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Profile Financial Estimates for the chosen quantity */}
            {selectedProfile && (
              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] flex flex-wrap items-center justify-between gap-1 text-slate-300">
                <span className="text-slate-400 font-medium">تقدير مالي للدفعة:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold font-mono">
                    تجزئة: {formatCurrency(quantity * selectedProfile.price, tenant.currency)}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold font-mono">
                    جملة: {formatCurrency(quantity * selectedProfile.wholesalePrice, tenant.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* High Volume Commercial Notice */}
            {quantity >= 500 && (
              <div className="p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
                <span className="text-amber-400 text-sm mt-0.5">⚡</span>
                <div className="space-y-0.5">
                  <span className="font-bold">كمية ضخمة للشبكات ({quantity.toLocaleString('en-US')} كرت):</span>
                  <p className="text-amber-300/80 text-[10px] leading-relaxed">
                    جاهزة لتوليد سكريبت مايكروتك كامل بضغطة زر وتخزينها في المخزن العام فوراً. لطباعة PDF ستحتاج إلى {Math.ceil(quantity / ((currentTemplate.cardsPerRow || 3) * (currentTemplate.cardsPerCol || 8)))} ورقة A4.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Code Character Set Options */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>نوع ونمط محارف الكود (Character Set)</span>
              <span className="text-[10px] text-sky-400 font-mono">
                {codeCharSet === 'digits_only' ? 'أرقام 0-9' : codeCharSet === 'alphanumeric_upper' ? 'حروف كبيرة وأرقام' : codeCharSet === 'alphanumeric_lower' ? 'حروف صغيرة وأرقام' : 'مختلط'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="charset-digits-btn"
                onClick={() => setCodeCharSet('digits_only')}
                className={`p-2 rounded-xl border text-right transition flex items-center gap-2 ${
                  codeCharSet === 'digits_only'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Hash className="w-4 h-4 shrink-0 text-sky-400" />
                <div>
                  <div className="text-xs font-bold">أرقام فقط (0 - 9)</div>
                  <div className="text-[10px] text-slate-400">الأسهل في الإدخال بالهاتف</div>
                </div>
              </button>

              <button
                type="button"
                id="charset-upper-btn"
                onClick={() => setCodeCharSet('alphanumeric_upper')}
                className={`p-2 rounded-xl border text-right transition flex items-center gap-2 ${
                  codeCharSet === 'alphanumeric_upper'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Type className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <div className="text-xs font-bold">أرقام وحروف كبيرة</div>
                  <div className="text-[10px] text-slate-400">A-Z + 0-9 (أمان أعلى)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Prefix & Code Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  بادئة الرمز (Prefix)
                </label>
                {prefix && (
                  <button
                    type="button"
                    onClick={() => setPrefix('')}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    مسح
                  </button>
                )}
              </div>
              <input
                id="prefix-input"
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                placeholder="مثال: NW- (أو اتركه فارغاً)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                طول خانات الكود
              </label>
              <input
                id="code-length-input"
                type="number"
                min={3}
                max={20}
                value={codeLength}
                onChange={e => setCodeLength(Math.max(3, Math.min(20, parseInt(e.target.value) || 6)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Password Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              نوع كلمة المرور (Password Type)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPasswordType('same_as_username')}
                className={`p-2 rounded-xl border text-center text-xs font-medium transition ${
                  passwordType === 'same_as_username'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">نفس المستخدم</div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">User = Password</div>
              </button>

              <button
                type="button"
                onClick={() => setPasswordType('separate_pin')}
                className={`p-2 rounded-xl border text-center text-xs font-medium transition ${
                  passwordType === 'separate_pin'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">PIN منفصل</div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">كلمة سر مخصصة</div>
              </button>

              <button
                type="button"
                onClick={() => setPasswordType('no_password')}
                className={`p-2 rounded-xl border text-center text-xs font-medium transition ${
                  passwordType === 'no_password'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">بدون كلمة سر</div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">اسم مستخدم فقط</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STYLING & AI */}
      {activeTab === 'styling' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white text-base">تصميم وقوالب الكرت</h2>
            </div>
            <button
              type="button"
              id="save-template-firestore-btn"
              onClick={handleSaveTemplateToFirestore}
              disabled={isSavingToFirestore}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                isSavedInFirestore
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-sky-600 hover:bg-sky-500 border-sky-500 text-white shadow-md'
              }`}
              title="حفظ القالب الحالي في Firestore"
            >
              {isSavingToFirestore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : isSavedInFirestore ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>محفوظ سحابياً</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>حفظ القالب سحابياً</span>
                </>
              )}
            </button>
          </div>

          {/* AI Card Template Generator */}
          <div className="bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  <span>توليد قوالب بالذكاء الاصطناعي</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gemini SVG
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  اكتب فكرة القالب وسيقوم الذكاء الاصطناعي بإنشاء خلفية فيكتور عالية الدقة
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <textarea
                  id="ai-template-prompt-input"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="مثال: قالب نيون داكن لشبكة كافيه مع تموجات ضوئية زرقاء وبنفسجية..."
                  rows={2}
                  className="w-full bg-slate-950 border border-indigo-500/40 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none transition shadow-sm font-sans"
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {AI_PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAiPrompt(item.prompt)}
                    className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-slate-300 transition"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {aiError && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between">
                  <span>⚠️ {aiError}</span>
                  <button type="button" onClick={() => setAiError(null)}>✕</button>
                </div>
              )}

              <button
                type="button"
                id="generate-ai-template-btn"
                onClick={handleGenerateAiTemplate}
                disabled={isGeneratingAiTemplate}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAiTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{aiGenerationStep || 'جاري التوليد...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>توليد القالب بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre-built Templates */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              مكتبة القوالب الجاهزة (Pre-built Styles)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PREBUILT_TEMPLATES_LIBRARY.map(tpl => {
                const isSelected = tpl.id === currentTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between h-20 relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/50 ring-2 ring-sky-500/30'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10 w-full">
                      <span className="text-[11px] font-bold text-slate-100 truncate">
                        {tpl.name.split('(')[0]}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {tpl.themeStyle === 'cyber_neon' ? 'نيون داكن 🟣' : tpl.themeStyle === 'clean_white' ? 'أبيض اقتصادي ⚪' : tpl.themeStyle === 'royal_gold' ? 'رياضي تيربو 🟠' : 'أزرق كلاسيكي 🔵'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Image Upload */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-slate-600 rounded-xl p-3 text-center cursor-pointer transition bg-slate-950/70 flex flex-col items-center justify-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <ImagePlus className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-semibold text-sky-400">
              رفع صورة خلفية خاصة من جهازك
            </span>
            <span className="text-[10px] text-slate-500">يدعم PNG, JPG, WEBP بدقة عالية</span>
          </div>
        </div>
      )}

      {/* TAB 3: ELEMENTS & SCRATCH FOIL */}
      {activeTab === 'elements' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-white text-base">العناصر والبيانات المعروضة</h2>
            </div>
            <span className="text-xs text-slate-400">تخصيص الحقول</span>
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showNetworkName}
                onChange={e => handleUpdateTemplate({ showNetworkName: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">اسم الشبكة</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showProfileName}
                onChange={e => handleUpdateTemplate({ showProfileName: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">اسم الباقة</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showPrice}
                onChange={e => handleUpdateTemplate({ showPrice: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">شارة السعر</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showQr}
                onChange={e => handleUpdateTemplate({ showQr: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">باركود QR للاتصال</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showUptime}
                onChange={e => handleUpdateTemplate({ showUptime: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">مدة الصلاحية</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showByteLimit}
                onChange={e => handleUpdateTemplate({ showByteLimit: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">رصيد الميغابايت</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showSerialNumber}
                onChange={e => handleUpdateTemplate({ showSerialNumber: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">الرقم التسلسلي (SN)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showBatchNumber}
                onChange={e => handleUpdateTemplate({ showBatchNumber: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">رقم الدفعة (Batch)</span>
            </label>
          </div>

          {/* Card Creation Date Field */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>تأريخ إنشاء الكرت (Created At)</span>
              </span>
              <input
                type="checkbox"
                checked={currentTemplate.showCreatedAt}
                onChange={e => handleUpdateTemplate({ showCreatedAt: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
            </label>
            {currentTemplate.showCreatedAt && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] text-slate-400">صيغة عرض التأريخ</label>
                <select
                  value={currentTemplate.createdAtFormat || 'date_only'}
                  onChange={e => handleUpdateTemplate({ createdAtFormat: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="date_only">تأريخ فقط (مثال: 2026/03/08)</option>
                  <option value="date_time">تأريخ ووقت كامل (مثال: 2026/03/08 14:30)</option>
                  <option value="short">تأريخ مختصر (مثال: 08/03/26)</option>
                </select>
              </div>
            )}
          </div>

          {/* Scratch-off Card Options */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>نمط كروت الخدش الفضية (Scratch Foil)</span>
              </span>
              <input
                type="checkbox"
                checked={currentTemplate.showScratchGuide}
                onChange={e => handleUpdateTemplate({ showScratchGuide: e.target.checked })}
                className="accent-amber-500 rounded w-4 h-4"
              />
            </label>
            {currentTemplate.showScratchGuide && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] text-slate-400">النص المكتوب على منطقة الخدش</label>
                <input
                  type="text"
                  value={currentTemplate.scratchText || 'أكشط بلطف لرؤية الرمز'}
                  onChange={e => handleUpdateTemplate({ scratchText: e.target.value })}
                  placeholder="أكشط بلطف لرؤية الرمز"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Support Phone */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-200">عرض هاتف الدعم الفني / الواتساب</span>
              <input
                type="checkbox"
                checked={currentTemplate.showSupportPhone}
                onChange={e => handleUpdateTemplate({ showSupportPhone: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
            </label>
            {currentTemplate.showSupportPhone && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] text-slate-400">رقم الهاتف أو الواتساب للدعم</label>
                <input
                  type="text"
                  value={currentTemplate.supportPhoneText || tenant.phone || ''}
                  onChange={e => handleUpdateTemplate({ supportPhoneText: e.target.value })}
                  placeholder="مثال: 770000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            )}
          </div>

          {/* Custom Footer */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              تذييل الكرت (تعليمات الاستخدام)
            </label>
            <input
              type="text"
              value={currentTemplate.customFooter || ''}
              onChange={e => handleUpdateTemplate({ customFooter: e.target.value })}
              placeholder="اتصل بالشبكة وسجل الدخول"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* ADVANCED ELEMENT SHAPES & STYLING CONTROLS */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-amber-400" />
                <span>أشكال وتنسيق العناصر داخل الكرت (Element Shapes & Styles)</span>
              </span>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                احترافي
              </span>
            </div>

            {/* 1. Code Box Shape & Styling */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  <span>شكل صندوق الكود (Code Box Style)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTemplate.codeBoxStyle || 'modern_box'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'modern_box', label: 'مستطيل ناعم' },
                  { id: 'pill_badge', label: 'كبسولة دائرية' },
                  { id: 'ticket_dashed', label: 'تذكرة منقطة' },
                  { id: 'neon_glow', label: 'توهج نيون' },
                  { id: 'minimal_clean', label: 'مسطح نقي' },
                  { id: 'split_pin', label: 'تقسيم الرمز' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleUpdateTemplate({ codeBoxStyle: s.id as any })}
                    className={`px-2 py-2 rounded-lg border text-center text-[11px] font-medium transition ${
                      (currentTemplate.codeBoxStyle || 'modern_box') === s.id
                        ? 'bg-sky-600/30 border-sky-500 text-sky-200 font-bold ring-1 ring-sky-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Code Box Colors */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">خلفية الصندوق</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.codeBoxBg || '#0f172a'}
                      onChange={e => handleUpdateTemplate({ codeBoxBg: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.codeBoxBg || 'تلقائي'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">إطار الصندوق</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.codeBoxBorderColor || '#0284c7'}
                      onChange={e => handleUpdateTemplate({ codeBoxBorderColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.codeBoxBorderColor || 'تلقائي'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">لون نص الكود</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.codeBoxTextColor || '#ffffff'}
                      onChange={e => handleUpdateTemplate({ codeBoxTextColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.codeBoxTextColor || 'تلقائي'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Price Tag Shape & Styling */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>شكل شارة السعر (Price Badge Style)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTemplate.priceTagStyle || 'pill'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'pill', label: 'كبسولة دائرية' },
                  { id: 'ribbon', label: 'شريط زاوية' },
                  { id: 'stamp', label: 'ختم رسمي' },
                  { id: 'glow', label: 'توهج نيون' },
                  { id: 'minimal', label: 'مسطح ناعم' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleUpdateTemplate({ priceTagStyle: p.id as any })}
                    className={`px-2 py-2 rounded-lg border text-center text-[11px] font-medium transition ${
                      (currentTemplate.priceTagStyle || 'pill') === p.id
                        ? 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold ring-1 ring-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Price Tag Colors */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">خلفية شارة السعر</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.badgeBg || '#f59e0b'}
                      onChange={e => handleUpdateTemplate({ badgeBg: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.badgeBg || '#f59e0b'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">لون رقم السعر</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.badgeTextColor || '#000000'}
                      onChange={e => handleUpdateTemplate({ badgeTextColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.badgeTextColor || '#000000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. QR Code Frame & Colors */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إطار وألوان باركود QR (QR Code Styling)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTemplate.qrFrameStyle || 'card_rounded'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'card_rounded', label: 'بطاقة ناعمة' },
                  { id: 'circular', label: 'دائري كامل' },
                  { id: 'clean_flat', label: 'مسطح نقي' },
                  { id: 'accent_border', label: 'إطار ملون' }
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleUpdateTemplate({ qrFrameStyle: q.id as any })}
                    className={`px-2 py-2 rounded-lg border text-center text-[11px] font-medium transition ${
                      (currentTemplate.qrFrameStyle || 'card_rounded') === q.id
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* QR Colors */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">لون نقاط الباركود (Dark)</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.qrDarkColor || '#000000'}
                      onChange={e => handleUpdateTemplate({ qrDarkColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.qrDarkColor || '#000000'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">لون خلفية الباركود (Light)</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.qrLightColor || '#ffffff'}
                      onChange={e => handleUpdateTemplate({ qrLightColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300 truncate">
                      {currentTemplate.qrLightColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Text & Typography Colors */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                <span>ألوان نصوص الكرت المخصصة (Typography Colors)</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 truncate">اسم الشبكة</label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.networkNameColor || '#ffffff'}
                      onChange={e => handleUpdateTemplate({ networkNameColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[9px] font-mono text-slate-300 truncate">
                      {currentTemplate.networkNameColor || 'تلقائي'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 truncate">اسم الباقة</label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.profileNameColor || '#38bdf8'}
                      onChange={e => handleUpdateTemplate({ profileNameColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[9px] font-mono text-slate-300 truncate">
                      {currentTemplate.profileNameColor || 'تلقائي'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 truncate">الصلاحية والفوتر</label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.metaIconsColor || '#94a3b8'}
                      onChange={e => handleUpdateTemplate({ metaIconsColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[9px] font-mono text-slate-300 truncate">
                      {currentTemplate.metaIconsColor || 'تلقائي'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 truncate">تأريخ الإنشاء</label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                    <input
                      type="color"
                      value={currentTemplate.dateBadgeColor || '#0284c7'}
                      onChange={e => handleUpdateTemplate({ dateBadgeColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[9px] font-mono text-slate-300 truncate">
                      {currentTemplate.dateBadgeColor || 'تلقائي'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LAYOUT, DIMENSIONS & CUT LINES */}
      {activeTab === 'layout' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-white text-base">تخطيط ومقاسات كروت ورقة A4</h2>
            </div>
            <span className="text-xs text-sky-400 font-mono font-bold bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded-lg">
              {(currentTemplate.cardsPerRow || 3) * (currentTemplate.cardsPerCol || 8)} كرت/ورقة
            </span>
          </div>

          {/* Quick Preset Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-sky-400" />
                <span>نماذج ومقاسات شبكية جاهزة (A4 Presets)</span>
              </label>
              <span className="text-[10px] text-slate-400">تكيف تلقائي فوري</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CARD_GRID_PRESETS.map((preset, idx) => {
                const isSelected = 
                  currentTemplate.cardsPerRow === preset.cols && 
                  currentTemplate.cardsPerCol === preset.rows;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUpdateTemplate({
                      cardWidthMm: preset.widthMm,
                      cardHeightMm: preset.heightMm,
                      cardsPerRow: preset.cols,
                      cardsPerCol: preset.rows,
                      gridGapXMm: preset.gapXMm,
                      gridGapYMm: preset.gapYMm,
                      marginX: preset.marginX,
                      marginY: preset.marginY,
                      elementScale: preset.elementScale || 1.0
                    })}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-950/70 border-sky-500 text-sky-200 shadow-md ring-1 ring-sky-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xs font-bold text-slate-100">{preset.name}</p>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {preset.widthMm} × {preset.heightMm} مم ({preset.cardsPerPage} كرت/صفحة)
                    </p>
                    <span className="text-[9px] text-sky-400/80 mt-1 truncate">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Scaling & Flexibility Indicator */}
          <div className="bg-gradient-to-r from-sky-950/60 to-indigo-950/40 p-3.5 rounded-xl border border-sky-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>مرونة تناسق العناصر التلقائي (Auto-Scale)</span>
              </span>
              <span className="text-[11px] font-mono text-sky-300 font-bold bg-sky-900/60 px-2 py-0.5 rounded-md border border-sky-700/50">
                {Math.round(
                  computeCardAutoScale(
                    currentTemplate.cardsPerRow || 3,
                    currentTemplate.cardsPerCol || 8,
                    currentTemplate.cardWidthMm || 63,
                    currentTemplate.cardHeightMm || 33,
                    currentTemplate.elementScale || 1.0
                  ) * 100
                )}%
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              عند التبديل بين 42 كرت أو 32 كرت تتكيف خطوط الباركود وحجم الخطوط وصناديق الأكواد تلقائياً لمنع أي تداخل وضمان وضوح فائق للطباعة.
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>تعديل يدوي لحجم وتناسق العناصر:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {Math.round((currentTemplate.elementScale || 1.0) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.70}
                  max={1.30}
                  step={0.05}
                  value={currentTemplate.elementScale || 1.0}
                  onChange={e => handleUpdateTemplate({ elementScale: parseFloat(e.target.value) })}
                  className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                {(currentTemplate.elementScale && currentTemplate.elementScale !== 1.0) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateTemplate({ elementScale: 1.0 })}
                    className="text-[10px] text-sky-400 hover:text-sky-300 underline px-1 whitespace-nowrap"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Precise Card Dimensions (Width x Height) */}
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تعديل مقاس الكرت المخصص (بالمليمتر mm)</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {currentTemplate.cardWidthMm || 63} × {currentTemplate.cardHeightMm || 33} مم
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  عرض الكرت (Width mm)
                </label>
                <input
                  type="number"
                  min={30}
                  max={200}
                  step={0.5}
                  value={currentTemplate.cardWidthMm || 63}
                  onChange={e => handleUpdateTemplate({ cardWidthMm: parseFloat(e.target.value) || 63 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  ارتفاع الكرت (Height mm)
                </label>
                <input
                  type="number"
                  min={20}
                  max={200}
                  step={0.5}
                  value={currentTemplate.cardHeightMm || 33}
                  onChange={e => handleUpdateTemplate({ cardHeightMm: parseFloat(e.target.value) || 33 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Grid Columns & Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                عدد الأعمدة في الورقة (Columns)
              </label>
              <select
                value={currentTemplate.cardsPerRow || 3}
                onChange={e => handleUpdateTemplate({ cardsPerRow: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value={2}>2 أعمدة</option>
                <option value={3}>3 أعمدة (الافتراضي)</option>
                <option value={4}>4 أعمدة</option>
                <option value={5}>5 أعمدة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                عدد الصفوف في الورقة (Rows)
              </label>
              <select
                value={currentTemplate.cardsPerCol || 8}
                onChange={e => handleUpdateTemplate({ cardsPerCol: parseInt(e.target.value) || 8 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value={4}>4 صفوف</option>
                <option value={5}>5 صفوف</option>
                <option value={6}>6 صفوف</option>
                <option value={7}>7 صفوف</option>
                <option value={8}>8 صفوف (الافتراضي)</option>
                <option value={9}>9 صفوف</option>
                <option value={10}>10 صفوف</option>
              </select>
            </div>
          </div>

          {/* Spacing & Gaps in Millimeters */}
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                <span>تعديل مسافات التباعد بين الكروت (Gaps)</span>
              </span>
              <span className="text-[11px] font-mono text-sky-400">
                X: {currentTemplate.gridGapXMm ?? 1.5}mm | Y: {currentTemplate.gridGapYMm ?? 1.5}mm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  المسافة الأفقية بين الكروت (مم)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  step={0.5}
                  value={currentTemplate.gridGapXMm !== undefined ? currentTemplate.gridGapXMm : 1.5}
                  onChange={e => handleUpdateTemplate({ gridGapXMm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={currentTemplate.gridGapXMm !== undefined ? currentTemplate.gridGapXMm : 1.5}
                  onChange={e => handleUpdateTemplate({ gridGapXMm: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-sky-500 mt-1.5 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  المسافة الرأسية بين الكروت (مم)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  step={0.5}
                  value={currentTemplate.gridGapYMm !== undefined ? currentTemplate.gridGapYMm : 1.5}
                  onChange={e => handleUpdateTemplate({ gridGapYMm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={currentTemplate.gridGapYMm !== undefined ? currentTemplate.gridGapYMm : 1.5}
                  onChange={e => handleUpdateTemplate({ gridGapYMm: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-sky-500 mt-1.5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">هوامش أطراف الورقة (Page Margins mm)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الهامش الجانبي (X mm)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={currentTemplate.marginX !== undefined ? currentTemplate.marginX : 6}
                  onChange={e => handleUpdateTemplate({ marginX: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">الهامش العلوي والسفلي (Y mm)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={currentTemplate.marginY !== undefined ? currentTemplate.marginY : 8}
                  onChange={e => handleUpdateTemplate({ marginY: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cut Line Style */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              نمط خطوط القص (Cut Lines Style)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'dashed', name: 'متقطع ✂️' },
                { id: 'solid', name: 'خط مستمر 📏' },
                { id: 'corner', name: 'علامات زوايا 📐' },
                { id: 'none', name: 'بدون خطوط 🚫' }
              ].map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleUpdateTemplate({ cutLineStyle: style.id as any })}
                  className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition ${
                    (currentTemplate.cutLineStyle || 'dashed') === style.id
                      ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Page Header / Footer text */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">عنوان ترويسة الورقة</label>
              <input
                type="text"
                value={currentTemplate.pageHeaderTitle || tenant.businessName}
                onChange={e => handleUpdateTemplate({ pageHeaderTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">نص تذييل الورقة المطبوعة</label>
              <input
                type="text"
                value={currentTemplate.pageFooterText || ''}
                onChange={e => handleUpdateTemplate({ pageFooterText: e.target.value })}
                placeholder="تم إنشاء وتوليد الكروت عبر نظام NetFlow SaaS"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MIKROTIK SCRIPTS */}
      {activeTab === 'scripts' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">سكربتات وتصدير المايكروتك</h2>
            </div>
            <span className="text-xs text-slate-400">{activeCards.length} كرت جاهز</span>
          </div>

          {/* Flavor Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              نوع نظام الراوتر واليوزر مانجر
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'hotspot_v7', name: 'RouterOS v7 Hotspot', desc: '/ip hotspot user' },
                { id: 'hotspot_v6', name: 'RouterOS v6 Hotspot', desc: 'إصدارات v6 السابقة' },
                { id: 'userman_v7', name: 'User Manager v7', desc: '/user-manager' },
                { id: 'userman_v6', name: 'User Manager v6', desc: '/tool user-manager' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScriptFlavor(item.id as any)}
                  className={`p-2 rounded-xl border text-right transition ${
                    scriptFlavor === item.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="copy-mikrotik-script-btn"
              onClick={handleCopyMikroTikScript}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Terminal className="w-4 h-4" />
              <span>{copiedScript ? 'تم النسخ بنجاح!' : 'نسخ السكربت للحافظة'}</span>
            </button>

            <button
              type="button"
              id="download-rsc-btn"
              onClick={handleDownloadRsc}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>تنزيل ملف .rsc</span>
            </button>
          </div>

          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCsv}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير كملف إكسل / CSV</span>
          </button>
        </div>
      )}

      {/* Edit/Create Profile Modal in Studio */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={isNewProfileModalOpen ? null : (selectedProfile || null)}
        tenant={tenant}
        onSaveProfile={handleSaveProfileFromStudio}
        isNew={isNewProfileModalOpen}
      />
    </div>
  );
};

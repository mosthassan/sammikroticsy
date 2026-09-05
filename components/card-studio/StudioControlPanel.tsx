'use client';

import React, { useState } from 'react';
import { Card, CardTemplate, Profile, Tenant, CodeCharSet } from '@/types';
import { PREBUILT_TEMPLATES_LIBRARY, COLOR_SCHEME_PRESETS, CARD_SHAPE_PRESETS, ColorSchemePreset } from '@/lib/templates';
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
  Paintbrush,
  Download,
  Image as ImageIcon,
  Camera,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Move,
  RefreshCw,
  AlignRight,
  AlignCenter,
  AlignLeft,
  RotateCcw,
  Eye,
  EyeOff,
  Phone,
  MessageSquare,
  Clock,
  HardDrive,
  Wifi
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
  onOpenSaveModal?: (mode?: 'new' | 'update') => void;
  onDeleteCustomTemplate?: (templateId: string, name: string) => void;
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
  onExportCardImage?: () => void;
  onExportBackgroundImage?: () => void;
  isExportingImage?: boolean;
  previewMode?: 'single' | 'a4' | 'designer';
  setPreviewMode?: (m: 'single' | 'a4' | 'designer') => void;
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
  onOpenSaveModal,
  onDeleteCustomTemplate,
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
  handleExportCsv,
  onExportCardImage,
  onExportBackgroundImage,
  isExportingImage = false,
  previewMode,
  setPreviewMode
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'styling' | 'elements' | 'layout' | 'scripts'>('generator');
  const [templateCategory, setTemplateCategory] = useState<'all' | 'dark' | 'luxury' | 'light' | 'vibrant'>('all');
  const [showAiSection, setShowAiSection] = useState<boolean>(false);

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

  const applyColorScheme = (preset: ColorSchemePreset) => {
    handleUpdateTemplate({
      bgColor: preset.bgColor,
      bgGradientStart: preset.bgGradientStart,
      bgGradientEnd: preset.bgGradientEnd,
      bgType: 'gradient',
      bgImage: undefined,
      svgCode: undefined,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
      badgeBg: preset.badgeBg,
      badgeTextColor: preset.badgeTextColor,
      codeBoxBg: preset.codeBoxBg,
      codeBoxBorderColor: preset.codeBoxBorderColor,
      codeBoxTextColor: preset.codeBoxTextColor,
      borderColor: preset.borderColor,
      borderWidth: 1.5,
      themeStyle: preset.id as any
    });
  };

  const applyShapePreset = (radius: number) => {
    handleUpdateTemplate({
      borderRadius: radius
    });
  };

  // Element Position & Size Inspector State
  const [inspectorElement, setInspectorElement] = useState<string>('code');
  const [showInspectorDetails, setShowInspectorDetails] = useState<boolean>(true);

  const INSPECTOR_ELEMENTS = [
    { key: 'code', label: 'كود الدخول (Code)', icon: Hash },
    { key: 'pin', label: 'الرمز السري (PIN)', icon: KeyRound },
    { key: 'networkName', label: 'اسم الشبكة', icon: Wifi },
    { key: 'price', label: 'شارة السعر', icon: Tag },
    { key: 'qr', label: 'رمز الاستجابة (QR)', icon: QrCode },
    { key: 'profileName', label: 'اسم الباقة / الفئة', icon: Sparkles },
    { key: 'uptime', label: 'الصلاحية (Uptime)', icon: Clock },
    { key: 'byteLimit', label: 'رصيد الميغابايت', icon: HardDrive },
    { key: 'supportPhone', label: 'هاتف الدعم (رقم الجوال)', icon: Phone },
    { key: 'footerText', label: 'شريط التذييل (تغطية واسعة...)', icon: MessageSquare },
    { key: 'serial', label: 'الرقم التسلسلي (SN)', icon: Hash },
    { key: 'createdAt', label: 'تأريخ الطباعة', icon: Calendar }
  ];

  const getElementVisibility = (key: string): boolean => {
    switch (key) {
      case 'code': return currentTemplate.showCode !== false;
      case 'pin': return currentTemplate.showPin !== false;
      case 'networkName': return currentTemplate.showNetworkName !== false;
      case 'price': return currentTemplate.showPrice !== false;
      case 'qr': return currentTemplate.showQr !== false;
      case 'profileName': return currentTemplate.showProfileName !== false;
      case 'uptime': return currentTemplate.showUptime !== false;
      case 'byteLimit': return currentTemplate.showByteLimit !== false;
      case 'supportPhone': return currentTemplate.showSupportPhone !== false;
      case 'footerText': return currentTemplate.showCustomFooter !== false && !!(currentTemplate.customFooter && currentTemplate.customFooter.trim());
      case 'serial': return currentTemplate.showSerialNumber !== false;
      case 'createdAt': return currentTemplate.showCreatedAt !== false;
      default: return true;
    }
  };

  const toggleElementVisibility = (key: string) => {
    const current = getElementVisibility(key);
    switch (key) {
      case 'code': handleUpdateTemplate({ showCode: !current }); break;
      case 'pin': handleUpdateTemplate({ showPin: !current }); break;
      case 'networkName': handleUpdateTemplate({ showNetworkName: !current }); break;
      case 'price': handleUpdateTemplate({ showPrice: !current }); break;
      case 'qr': handleUpdateTemplate({ showQr: !current }); break;
      case 'profileName': handleUpdateTemplate({ showProfileName: !current }); break;
      case 'uptime': handleUpdateTemplate({ showUptime: !current }); break;
      case 'byteLimit': handleUpdateTemplate({ showByteLimit: !current }); break;
      case 'supportPhone': handleUpdateTemplate({ showSupportPhone: !current }); break;
      case 'footerText':
        handleUpdateTemplate({
          showCustomFooter: !current,
          ...(!current && !currentTemplate.customFooter ? { customFooter: 'تغطية واسعة وسرعات تحميل وتنزيل فائقة' } : {})
        });
        break;
      case 'serial': handleUpdateTemplate({ showSerialNumber: !current }); break;
      case 'createdAt': handleUpdateTemplate({ showCreatedAt: !current }); break;
    }
  };

  const updateElementPos = (key: string, updates: Partial<{ x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' }>) => {
    const currentPositions = (currentTemplate.positions as any) || {};
    const existing = currentPositions[key] || {};
    const updated = {
      ...currentPositions,
      [key]: {
        ...existing,
        ...updates
      }
    };
    handleUpdateTemplate({ positions: updated });
  };

  const handleSmartAutoFit = (newWidthMm?: number, newHeightMm?: number) => {
    const w = newWidthMm !== undefined ? newWidthMm : (currentTemplate.cardWidthMm || 63);
    const h = newHeightMm !== undefined ? newHeightMm : (currentTemplate.cardHeightMm || 33);
    const isStrip = h <= 25;
    const ratio = w / h;
    const scale = Math.min(1.4, Math.max(0.65, (w * h) / (63 * 33)));

    let newPositions: Record<string, any> = {};

    if (isStrip) {
      newPositions = {
        networkName: { x: 3, y: 10, fontSize: Math.round(9 * scale), align: 'right' },
        price: { x: 50, y: 50, fontSize: Math.round(8.5 * scale), align: 'center' },
        qr: { x: 80, y: 12, fontSize: 10 },
        code: { x: 15, y: 52, fontSize: Math.round(11 * scale), align: 'center' },
        profileName: { x: 3, y: 75, fontSize: Math.round(7.5 * scale), align: 'right' },
        uptime: { x: 35, y: 75, fontSize: Math.round(7 * scale), align: 'center' }
      };
    } else if (ratio < 1.3) {
      newPositions = {
        networkName: { x: 5, y: 5, fontSize: Math.round(12 * scale), align: 'right' },
        price: { x: 70, y: 5, fontSize: Math.round(11 * scale), align: 'center' },
        profileName: { x: 5, y: 22, fontSize: Math.round(10 * scale), align: 'right' },
        qr: { x: 32, y: 35, fontSize: 10 },
        code: { x: 10, y: 68, fontSize: Math.round(13.5 * scale), align: 'center' },
        pin: { x: 10, y: 84, fontSize: Math.round(9 * scale), align: 'center' },
        uptime: { x: 5, y: 92, fontSize: Math.round(8 * scale), align: 'right' },
        byteLimit: { x: 55, y: 92, fontSize: Math.round(8 * scale), align: 'left' }
      };
    } else {
      newPositions = {
        networkName: { x: 5, y: 6, fontSize: Math.round(11 * scale), align: 'right' },
        price: { x: 74, y: 6, fontSize: Math.round(10.5 * scale), align: 'center' },
        createdAt: { x: 50, y: 7, fontSize: Math.round(7.5 * scale), align: 'center' },
        qr: { x: 6, y: 26, fontSize: 10 },
        profileName: { x: 42, y: 26, fontSize: Math.round(10 * scale), align: 'right' },
        serial: { x: 78, y: 27, fontSize: Math.round(7.5 * scale), align: 'center' },
        code: { x: 40, y: 44, fontSize: Math.round(13.5 * scale), align: 'center' },
        pin: { x: 40, y: 68, fontSize: Math.round(8.5 * scale), align: 'center' },
        uptime: { x: 5, y: 88, fontSize: Math.round(8 * scale), align: 'right' },
        byteLimit: { x: 32, y: 88, fontSize: Math.round(8 * scale), align: 'center' },
        supportPhone: { x: 60, y: 88, fontSize: Math.round(7.5 * scale), align: 'left' }
      };
    }

    const recommendedCols = Math.max(1, Math.min(6, Math.floor(200 / (w + 2))));
    const recommendedRows = Math.max(1, Math.min(15, Math.floor(285 / (h + 2))));

    handleUpdateTemplate({
      cardWidthMm: w,
      cardHeightMm: h,
      cardsPerRow: recommendedCols,
      cardsPerCol: recommendedRows,
      elementScale: scale,
      positions: newPositions
    });
  };

  // User custom templates (saved by name or generated)
  const customSavedTemplates = templates.filter(
    t => t.isCustom || t.savedByUser || t.id.startsWith('tpl_user_') || t.id.startsWith('tpl_custom_') || t.isAiGenerated
  );

  const filteredTemplates = PREBUILT_TEMPLATES_LIBRARY.filter(t => {
    if (templateCategory === 'all') return true;
    if (templateCategory === 'dark') {
      return ['tpl_cyber_neon_svg', 'tpl_corporate_blue_svg', 'tpl_stealth_carbon_svg', 'tpl_executive_slate_svg'].includes(t.id);
    }
    if (templateCategory === 'luxury') {
      return ['tpl_royal_gold_svg', 'tpl_cosmic_violet_svg'].includes(t.id);
    }
    if (templateCategory === 'light') {
      return ['tpl_clean_minimal_svg'].includes(t.id);
    }
    if (templateCategory === 'vibrant') {
      return ['tpl_sport_speed_svg', 'tpl_emerald_pro_svg', 'tpl_geometric_prism_svg', 'tpl_pure_cyan_svg', 'tpl_sunset_coral_svg'].includes(t.id);
    }
    return true;
  });

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
          <span>عناصر ومقاس الكرت</span>
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

          {/* Quick Template Selector for Package */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 hover:border-sky-500/40 rounded-xl p-3.5 space-y-2.5 transition shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">قالب الكرت وتنسيق المظهر للباقة:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {currentTemplate.isCustom ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>💎 قالب مخصص سحابياً</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    قالب قياسي
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('styling')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1"
                >
                  <Palette className="w-3 h-3" />
                  <span>استوديو المظهر</span>
                </button>
              </div>
            </div>

            {/* Template Selector Dropdown & Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                id="select-package-template"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition font-sans"
              >
                {customSavedTemplates.length > 0 && (
                  <optgroup label="🌟 قوالبي المحفوظة المخصصة للباقات">
                    {customSavedTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        ⭐ {t.name} {t.linkedProfileName ? `(مرتبط بـ ${t.linkedProfileName})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🎨 مكتبة القوالب الجاهزة">
                  {PREBUILT_TEMPLATES_LIBRARY.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              <button
                type="button"
                id="quick-save-named-template-btn"
                onClick={() => onOpenSaveModal?.(currentTemplate.isCustom ? 'update' : 'new')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer active:scale-95"
                title="تسمية وحفظ هذا التنسيق كقالب للباقة ليتم مزامنته سحابياً واستخدامه دائماً"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{currentTemplate.isCustom ? 'تحديث / حفظ باسم' : 'حفظ وتسمية القالب للباقة'}</span>
              </button>
            </div>

            {/* Current Template Status Indicator */}
            <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5">
              <span className="truncate">
                التصميم المفعل: <strong className="text-slate-200">{currentTemplate.name}</strong>
              </span>
              <span className="text-emerald-400 font-mono">
                {currentTemplate.cardsPerRow * currentTemplate.cardsPerCol} كرت/صفحة A4
              </span>
            </div>
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
                onClick={() => {
                  setCodeCharSet('digits_only');
                  // If prefix contains letters (like NW- or any alphabets), clear it so user gets pure digits!
                  if (/[a-zA-Z\u0600-\u06FF]/.test(prefix)) {
                    setPrefix('');
                  }
                }}
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
                placeholder={codeCharSet === 'digits_only' ? 'اتركه فارغاً لأرقام صافية 100%' : 'مثال: NW- (أو اتركه فارغاً)'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />

              {/* Proactive Help & Warning for Digits Only Mode */}
              {codeCharSet === 'digits_only' && (
                <>
                  {/[a-zA-Z\u0600-\u06FF]/.test(prefix) ? (
                    <div className="mt-1.5 p-2 bg-amber-500/15 border border-amber-500/40 rounded-lg text-[10.5px] text-amber-200 flex items-center justify-between gap-1 animate-in fade-in">
                      <span className="flex items-center gap-1">
                        <span>⚠️</span>
                        <span>البادئة تحتوي أحرفاً ({prefix}) فستظهر على الكرت!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrefix('')}
                        className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[10px] hover:bg-amber-400 shrink-0"
                      >
                        مسح الأحرف
                      </button>
                    </div>
                  ) : prefix ? (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      بادئة رقمية للكرت: <span className="font-mono text-sky-300">{prefix}XXXXXX</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                      <span>✓</span>
                      <span>أرقام صافية 100% بدون أي حروف (مطابق لليوزر مانجر)</span>
                    </span>
                  )}
                </>
              )}
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

      {/* TAB 2: STYLING & TEMPLATES LIBRARY */}
      {activeTab === 'styling' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5 animate-in fade-in duration-150">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-bold text-white text-base">مكتبة القوالب وتخصيص المظهر</h2>
                <p className="text-[11px] text-slate-400">تحكم يدوي كامل في شكل ولون وتصميم الكروت بدون تعقيد</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Export Image Dropdown / Direct Button */}
              {onExportCardImage && (
                <button
                  type="button"
                  id="quick-export-card-img-btn"
                  onClick={onExportCardImage}
                  disabled={isExportingImage}
                  className="px-3 py-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  title="حفظ الكرت الحالي كصورة عالية الدقة في جهازك"
                >
                  {isExportingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>حفظ كصورة</span>
                </button>
              )}

              {/* Save Template to Firestore with Custom Name */}
              <button
                type="button"
                id="save-template-named-btn"
                onClick={() => onOpenSaveModal?.(currentTemplate.isCustom ? 'update' : 'new')}
                disabled={isSavingToFirestore}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="تسمية وحفظ هذا القالب للباقة وتخزينه سحابياً"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>{currentTemplate.isCustom ? 'حفظ التعديلات / باسم جديد' : '💾 حفظ وتسمية القالب'}</span>
              </button>
            </div>
          </div>

          {/* USER CUSTOM SAVED TEMPLATES SECTION */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  قوالبي المجهزة مسبقاً للباقات ({customSavedTemplates.length})
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  سحابي ☁️
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentTemplate.isCustom && (
                  <button
                    type="button"
                    onClick={() => onOpenSaveModal?.('update')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="تحديث هذا القالب بتعديلاتك الأخيرة"
                  >
                    <Check className="w-3 h-3" />
                    <span>تحديث التعديلات</span>
                  </button>
                )}

                <button
                  type="button"
                  id="open-save-template-modal-btn"
                  onClick={() => onOpenSaveModal?.('new')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="حفظ التنسيق والشكل الحالي باسم مخصص (مثال: قالب كرت أبو 200) وتخزينه سحابياً"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>حفظ التنسيق الحالي كقالب للباقة</span>
                </button>
              </div>
            </div>

            {customSavedTemplates.length === 0 ? (
              <div className="p-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-xl text-center space-y-1.5">
                <p className="text-xs text-slate-300 font-medium">
                  لم تقم بحفظ أي قالب مخصص حتى الآن
                </p>
                <p className="text-[11px] text-slate-400 max-w-lg mx-auto leading-relaxed">
                  قم باختيار الألوان والخطوط والشكل المناسب للباقة التي تريدها، ثم اضغط على <strong className="text-amber-300 font-bold">&quot;حفظ التنسيق الحالي كقالب للباقة&quot;</strong> وسَمِّه (مثال: <span className="text-sky-300 font-mono">قالب كرت أبو 200</span>). سيتم حفظه سحابياً ليظهر هنا دائماً ويتم مزامنته تلقائياً عند اختيار باقته!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {customSavedTemplates.map(tpl => {
                  const isSelected = tpl.id === currentTemplate.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`p-3 rounded-xl border text-right transition relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-500/40 shadow-lg'
                          : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Top Row: Name and Actions */}
                      <div className="flex items-start justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className="flex-1 text-right focus:outline-none cursor-pointer"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{tpl.name}</span>
                          </div>
                          {tpl.linkedProfileName && (
                            <span className="inline-block text-[10px] text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.5 rounded-md mt-1">
                              🏷️ باقة: {tpl.linkedProfileName}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black" title="القالب النشط حالياً">
                              ✓
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomTemplate?.(tpl.id, tpl.name);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition cursor-pointer"
                            title="حذف هذا القالب من السحابة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Color swatch bar */}
                      <div className="w-full h-2 rounded-full overflow-hidden flex border border-slate-800/80 my-2.5">
                        <div className="flex-1" style={{ backgroundColor: tpl.bgGradientStart || tpl.bgColor || '#0f172a' }} />
                        <div className="flex-1" style={{ backgroundColor: tpl.bgGradientEnd || '#1e293b' }} />
                        <div className="w-2" style={{ backgroundColor: tpl.accentColor || '#38bdf8' }} />
                        <div className="w-2" style={{ backgroundColor: tpl.badgeBg || '#f59e0b' }} />
                      </div>

                      {/* Bottom row: Load Button */}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="text-slate-400 font-mono">
                          {tpl.cardsPerRow * tpl.cardsPerCol} كرت/A4
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isSelected ? 'مفعل حالياً' : 'تطبيق ومزامنة'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1. Pre-built Templates Library (12 Diverse High-Res Designs) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-sky-400" />
                <span>مكتبة القوالب الجاهزة ({PREBUILT_TEMPLATES_LIBRARY.length} قالباً متكاملاً)</span>
              </label>
              <span className="text-[10px] bg-sky-500/10 border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-mono font-bold">
                SVG فيكتور 300DPI
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'الكل (12)', icon: '🌟' },
                { id: 'dark', label: 'نيون وداكن', icon: '🟣' },
                { id: 'luxury', label: 'ملكي VIP', icon: '👑' },
                { id: 'vibrant', label: 'سرعة وتيربو', icon: '⚡' },
                { id: 'light', label: 'موفر للحبر', icon: '⚪' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTemplateCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                    templateCategory === cat.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Templates Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredTemplates.map(tpl => {
                const isSelected = tpl.id === currentTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between h-24 relative overflow-hidden group ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-500/40 shadow-lg'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Top Row: Name and Checkmark */}
                    <div className="flex items-center justify-between relative z-10 w-full gap-1">
                      <span className="text-[11px] font-bold text-slate-100 truncate group-hover:text-sky-300">
                        {tpl.name.replace(/\(.*?\)/, '').trim()}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0">
                          ✓
                        </span>
                      ) : (
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${tpl.bgGradientStart || '#0f172a'}, ${tpl.bgGradientEnd || '#1e293b'})`
                          }}
                        />
                      )}
                    </div>

                    {/* Middle: Color Swatch preview bar */}
                    <div className="w-full h-2 rounded-full overflow-hidden flex border border-slate-800/80 my-1">
                      <div className="flex-1" style={{ backgroundColor: tpl.bgGradientStart || tpl.bgColor || '#0f172a' }} />
                      <div className="flex-1" style={{ backgroundColor: tpl.bgGradientEnd || '#1e293b' }} />
                      <div className="w-2" style={{ backgroundColor: tpl.accentColor || '#38bdf8' }} />
                      <div className="w-2" style={{ backgroundColor: tpl.badgeBg || '#f59e0b' }} />
                    </div>

                    {/* Bottom: Theme Badge */}
                    <span className="text-[9.5px] text-slate-400 truncate">
                      {tpl.themeStyle === 'cyber_neon' && 'نيون سيبراني 🟣'}
                      {tpl.themeStyle === 'corporate_blue' && 'فايبر أزرق 🔵'}
                      {tpl.themeStyle === 'royal_gold' && 'ذهب ملكي 👑'}
                      {tpl.themeStyle === 'sport_speed' && 'تيربو ناري ⚡'}
                      {tpl.themeStyle === 'clean_white' && 'أبيض اقتصادي ⚪'}
                      {tpl.themeStyle === 'emerald_pro' && 'زمردي راقي 🟢'}
                      {tpl.themeStyle === 'stealth_carbon' && 'كربون رياضي 🖤'}
                      {tpl.themeStyle === 'cosmic_violet' && 'بنفسجي كوني ✨'}
                      {tpl.themeStyle === 'geometric_prism' && 'موشور هندسي 📐'}
                      {tpl.themeStyle === 'sunset_coral' && 'غروب مرجاني 🌅'}
                      {tpl.themeStyle === 'executive_slate' && 'رمادي تنفيذي 🏢'}
                      {tpl.themeStyle === 'pure_cyan' && 'سماوي فايبر 🌊'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 1-Click Color Scheme Presets */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                <span>تدرجات وألوان متناسقة جاهزة بنقرة واحدة (1-Click Color Schemes)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-sans">10 أنماط مجهزة</span>
            </div>

            <p className="text-[10.5px] text-slate-400">
              اختر أي تشكيلة ألوان لتطبيقها فوراً على خلفية الكرت واللمسات وشارة السعر وصندوق الكود:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
              {COLOR_SCHEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyColorScheme(preset)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-right transition flex items-center gap-2 group"
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${preset.bgGradientStart}, ${preset.bgGradientEnd})`
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Card Shape & Border Radius Controls */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-sky-400" />
                <span>شكل واستدارة زوايا الكرت (Corner Radius & Border)</span>
              </label>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                {currentTemplate.borderRadius ?? 14}px
              </span>
            </div>

            {/* Quick Shape Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'مربع حاد', radius: 0, desc: '0px' },
                { label: 'كلاسيكي', radius: 8, desc: '8px' },
                { label: 'عصري دائري', radius: 14, desc: '14px' },
                { label: 'كبسولة ناعمة', radius: 24, desc: '24px' }
              ].map((s) => (
                <button
                  key={s.radius}
                  type="button"
                  onClick={() => applyShapePreset(s.radius)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition flex flex-col items-center ${
                    (currentTemplate.borderRadius ?? 14) === s.radius
                      ? 'bg-sky-600/30 border-sky-500 text-sky-200 font-bold ring-1 ring-sky-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold">{s.label}</span>
                  <span className="text-[9px] text-slate-500">{s.desc}</span>
                </button>
              ))}
            </div>

            {/* Slider for exact corner radius */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>تعديل يدوي دقيق لاستدارة الحواف:</span>
                <span className="font-mono">{currentTemplate.borderRadius ?? 14} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="1"
                value={currentTemplate.borderRadius ?? 14}
                onChange={e => handleUpdateTemplate({ borderRadius: parseInt(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Border Width & Color */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[10.5px] text-slate-400 mb-1">سمك إطار الكرت الخارجي</label>
                <select
                  value={currentTemplate.borderWidth ?? 1}
                  onChange={e => handleUpdateTemplate({ borderWidth: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value={0}>بدون إطار (0px)</option>
                  <option value={1}>إطار دقيق (1px)</option>
                  <option value={1.5}>إطار متناسق (1.5px)</option>
                  <option value={2}>إطار بارز (2px)</option>
                  <option value={3}>إطار سميك (3px)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-400 mb-1">لون إطار الكرت</label>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <input
                    type="color"
                    value={currentTemplate.borderColor || '#38bdf8'}
                    onChange={e => handleUpdateTemplate({ borderColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {currentTemplate.borderColor || '#38bdf8'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Manual Background & Colors Customizer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>تخصيص ألوان الخلفية والنصوص يدوياً (Manual Palette)</span>
              </label>
              <span className="text-[10px] text-slate-400">تعديل مباشر</span>
            </div>

            {/* Background Type Toggle */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'gradient', label: 'تدرج لوني' },
                { id: 'solid', label: 'لون موحد' },
                { id: 'image', label: 'صورة خاصة' }
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => handleUpdateTemplate({ bgType: bg.id as any })}
                  className={`py-1.5 px-2 rounded-lg border text-center text-[11px] font-bold transition ${
                    (currentTemplate.bgType || 'gradient') === bg.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>

            {/* Colors Pickers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">لون بداية التدرج</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <input
                    type="color"
                    value={currentTemplate.bgGradientStart || currentTemplate.bgColor || '#0f172a'}
                    onChange={e => handleUpdateTemplate({ bgGradientStart: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {currentTemplate.bgGradientStart || '#0f172a'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">لون نهاية التدرج</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <input
                    type="color"
                    value={currentTemplate.bgGradientEnd || '#1e293b'}
                    onChange={e => handleUpdateTemplate({ bgGradientEnd: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {currentTemplate.bgGradientEnd || '#1e293b'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">لون اللمسات (Accent)</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <input
                    type="color"
                    value={currentTemplate.accentColor || '#38bdf8'}
                    onChange={e => handleUpdateTemplate({ accentColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {currentTemplate.accentColor || '#38bdf8'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">لون النص الرئيسي</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <input
                    type="color"
                    value={currentTemplate.textColor || '#ffffff'}
                    onChange={e => handleUpdateTemplate({ textColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">
                    {currentTemplate.textColor || '#ffffff'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Image Upload if selected or for custom branding */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-slate-600 rounded-xl p-3 text-center cursor-pointer transition bg-slate-950/70 flex flex-col items-center justify-center gap-1"
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
                رفع صورة خلفية مخصصة من جهازك (PNG / JPG / SVG)
              </span>
              <span className="text-[10px] text-slate-500">يمكنك استخدام تصاميمك المصممة بالفوتوشوب أو الإلستريتور كخلفية</span>
            </div>
          </div>

          {/* 5. Save Template as Image on Device */}
          <div className="bg-gradient-to-r from-sky-950/50 via-slate-950 to-indigo-950/50 border border-sky-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white">حفظ وتصدير القالب كصورة في الجهاز (PNG)</h3>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded font-mono font-bold">
                300 DPI عالية الدقة
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              يمكنك تصدير كرت العينة الحالي أو خلفية القالب كاملة كصورة PNG بدون تشويش لاستخدامها في المطابع أو مشاركتها:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="export-card-sample-img-btn"
                onClick={onExportCardImage}
                disabled={isExportingImage || !onExportCardImage}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                {isExportingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>حفظ كرت العينة كصورة (PNG)</span>
              </button>

              <button
                type="button"
                id="export-bg-blank-img-btn"
                onClick={onExportBackgroundImage}
                disabled={isExportingImage || !onExportBackgroundImage}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {isExportingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                )}
                <span>حفظ خلفية القالب فارغة (للمطابع)</span>
              </button>
            </div>
          </div>

          {/* 6. AI Generator (Optional Secondary Tool) */}
          <div className="bg-slate-950/60 border border-indigo-500/20 rounded-xl overflow-hidden">
            <button
              type="button"
              id="toggle-ai-section-btn"
              onClick={() => setShowAiSection(!showAiSection)}
              className="w-full p-3 flex items-center justify-between text-right hover:bg-indigo-950/20 transition"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>توليد بالذكاء الاصطناعي (أداة مساعدة إضافية)</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/20">
                      اختياري
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    لست ملزماً باستخدامه، يمكنك الاعتماد كلياً على مكتبة القوالب والألوان أعلاه
                  </p>
                </div>
              </div>

              <div className="text-slate-400">
                {showAiSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAiSection && (
              <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80 mt-2">
                <div className="relative pt-2">
                  <textarea
                    id="ai-template-prompt-input"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="اكتب فكرتك للقالب، مثلاً: كرت نيون سيبراني بنفسجي وأزرق متوهج لشبكة كافيهات..."
                    rows={2}
                    className="w-full bg-slate-900 border border-indigo-500/30 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none transition shadow-sm font-sans"
                  />
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  {AI_PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt(item.prompt)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-[10px] text-slate-300 transition"
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
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
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
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ELEMENTS & DIMENSIONS */}
      {activeTab === 'elements' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-white text-base">مقاس الكرت والعناصر ومواقعها</h2>
            </div>
            <span className="text-xs text-sky-400 font-mono font-bold bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded-lg">
              {currentTemplate.cardWidthMm || 63} × {currentTemplate.cardHeightMm || 33} مم
            </span>
          </div>

          {/* 1. SECTION: Manual Dimension Control (عرض وطول الكرت يدوياً) */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>تحديد عرض الكرت وطوله يدوياً (بالمليمتر mm)</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md font-mono">
                تناسب {((currentTemplate.cardWidthMm || 63) / (currentTemplate.cardHeightMm || 33)).toFixed(2)} : 1
              </span>
            </div>

            {/* Dimension Sliders & Inputs */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Width */}
              <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    عرض الكرت (Width)
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {currentTemplate.cardWidthMm || 63} مم
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={120}
                  step={0.5}
                  value={currentTemplate.cardWidthMm || 63}
                  onChange={e => handleUpdateTemplate({ cardWidthMm: parseFloat(e.target.value) || 63 })}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={25}
                    max={120}
                    step={0.5}
                    value={currentTemplate.cardWidthMm || 63}
                    onChange={e => handleUpdateTemplate({ cardWidthMm: parseFloat(e.target.value) || 63 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400">مم</span>
                </div>
              </div>

              {/* Height */}
              <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    طول/ارتفاع الكرت (Height)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {currentTemplate.cardHeightMm || 33} مم
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={0.5}
                  value={currentTemplate.cardHeightMm || 33}
                  onChange={e => handleUpdateTemplate({ cardHeightMm: parseFloat(e.target.value) || 33 })}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={15}
                    max={90}
                    step={0.5}
                    value={currentTemplate.cardHeightMm || 33}
                    onChange={e => handleUpdateTemplate({ cardHeightMm: parseFloat(e.target.value) || 33 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400">مم</span>
                </div>
              </div>
            </div>

            {/* Quick Dimension Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-medium block">
                مقاسات سريعة وشائعة لشبكات الإنترنت:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  { label: '63 × 33 مم (قياسي)', w: 63, h: 33 },
                  { label: '63 × 19 مم (شريط توفير)', w: 63, h: 19 },
                  { label: '70 × 35 مم (قسيمة عريضة)', w: 70, h: 35 },
                  { label: '85 × 54 مم (بطاقة بلاستيك)', w: 85, h: 54 },
                  { label: '55 × 25 مم (شريط ميني)', w: 55, h: 25 },
                  { label: '48 × 28 مم (كروت مدمجة)', w: 48, h: 28 }
                ].map(dim => {
                  const isCurrent =
                    Math.abs((currentTemplate.cardWidthMm || 63) - dim.w) < 0.5 &&
                    Math.abs((currentTemplate.cardHeightMm || 33) - dim.h) < 0.5;

                  return (
                    <button
                      key={dim.label}
                      type="button"
                      onClick={() => {
                        handleUpdateTemplate({ cardWidthMm: dim.w, cardHeightMm: dim.h });
                        handleSmartAutoFit(dim.w, dim.h);
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-mono transition ${
                        isCurrent
                          ? 'bg-sky-600 text-white border-sky-400 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {dim.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Auto-Fit & Visual Drag & Drop */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleSmartAutoFit()}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                title="إعادة موازنة مقاسات الخطوط وصناديق الأكواد والباركود تلقائياً لتناسب المساحة الحالية"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>موازنة وتكييف تلقائي</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setPreviewMode) {
                    setPreviewMode('designer');
                  }
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                  previewMode === 'designer'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-amber-900/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-600/40'
                }`}
                title="فتح لوحة السحب والإفلات لتحريك العناصر بحرية بالماوس"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>مصمم السحب بالماوس</span>
              </button>
            </div>
          </div>

          {/* 2. SECTION: Element Position & Size Control (التحكم بالعناصر ومواقعها وأحجامها داخل الكرت) */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>التحكم الدقيق بمواقع وأحجام عناصر الكرت</span>
              </span>
              <button
                type="button"
                onClick={() => setShowInspectorDetails(!showInspectorDetails)}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {showInspectorDetails ? 'طي الخيارات' : 'توسيع الخيارات'}
              </button>
            </div>

            {/* Element Selector Dropdown / Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">
                اختر العنصر المراد ضبط موقعه وحجمه:
              </label>
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
                {INSPECTOR_ELEMENTS.map(item => {
                  const IconComp = item.icon;
                  const isSelected = inspectorElement === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setInspectorElement(item.key);
                        setShowInspectorDetails(true);
                      }}
                      className={`p-1.5 rounded-lg border text-right transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-950 border-sky-500 text-sky-200 font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <IconComp className={`w-3 h-3 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span className="text-[10px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Element Controls */}
            {showInspectorDetails && (() => {
              const curPositions = (currentTemplate.positions as any) || {};
              const curElementPos = curPositions[inspectorElement] || {};
              const currentX = curElementPos.x !== undefined ? curElementPos.x : 50;
              const currentY = curElementPos.y !== undefined ? curElementPos.y : 50;
              const currentFontSize = curElementPos.fontSize !== undefined ? curElementPos.fontSize : 12;
              const currentAlign = curElementPos.align || 'center';
              const activeItemMeta = INSPECTOR_ELEMENTS.find(i => i.key === inspectorElement);
              const isElementVisible = getElementVisibility(inspectorElement);

              return (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      {activeItemMeta?.icon && <activeItemMeta.icon className="w-3.5 h-3.5 text-sky-400" />}
                      <span>تعديل: {activeItemMeta?.label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newPositions = { ...(currentTemplate.positions as any) };
                        delete newPositions[inspectorElement];
                        handleUpdateTemplate({ positions: newPositions });
                      }}
                      className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                      title="استعادة الموقع الافتراضي للعنصر"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إعادة ضبط الموضع</span>
                    </button>
                  </div>

                  {/* 1. Element Visibility Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {isElementVisible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="text-[11px] font-medium text-slate-200">
                        حالة ظهور العنصر في الكرت:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleElementVisibility(inspectorElement)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isElementVisible
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{isElementVisible ? 'ظاهر ومفعّل' : 'مخفي (معطّل)'}</span>
                    </button>
                  </div>

                  {/* 2. Specific Custom Content Editor for Footer Text */}
                  {inspectorElement === 'footerText' && (
                    <div className="space-y-2 p-2.5 bg-slate-950/80 rounded-xl border border-sky-900/40">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>نص شريط التذييل / العبارة الترويجية:</span>
                        </label>
                        {currentTemplate.customFooter && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTemplate({ customFooter: '', showCustomFooter: false })}
                            className="text-[10px] text-red-400 hover:text-red-300"
                          >
                            مسح النص وإخفاء
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentTemplate.customFooter ?? ''}
                        onChange={e => handleUpdateTemplate({ customFooter: e.target.value, showCustomFooter: true })}
                        placeholder="مثال: تغطية واسعة وسرعات تحميل وتنزيل فائقة (أو اتركه فارغاً)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-slate-400 w-full">عبارات سريعة بنقرة واحدة:</span>
                        {[
                          'تغطية واسعة وسرعات تحميل وتنزيل فائقة',
                          'امسح الرمز أو سجل الدخول بالمتصفح',
                          'خدمة إنترنت سريعة ومستقرة 24 ساعة',
                          'الرمز صالح للاستخدام على جهاز واحد فقط'
                        ].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleUpdateTemplate({ customFooter: preset, showCustomFooter: true })}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 pt-1.5 border-t border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentTemplate.includePhoneInFooter || false}
                          onChange={e => handleUpdateTemplate({ includePhoneInFooter: e.target.checked })}
                          className="accent-sky-500 rounded w-3.5 h-3.5"
                        />
                        <span className="text-[10px] text-slate-300">
                          دمج رقم الهاتف تلقائياً في نهاية شريط التذييل
                        </span>
                      </label>
                    </div>
                  )}

                  {/* 3. Specific Custom Content Editor for Support Phone */}
                  {inspectorElement === 'supportPhone' && (
                    <div className="space-y-2 p-2.5 bg-slate-950/80 rounded-xl border border-amber-900/40">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>رقم هاتف الدعم الفني / الواتساب:</span>
                        </label>
                        {tenant.phone && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTemplate({ supportPhoneText: tenant.phone, showSupportPhone: true })}
                            className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30"
                          >
                            استخدام رقم المنشأة ({tenant.phone})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentTemplate.supportPhoneText !== undefined ? currentTemplate.supportPhoneText : (tenant.phone || '')}
                        onChange={e => handleUpdateTemplate({ supportPhoneText: e.target.value, showSupportPhone: true })}
                        placeholder="مثال: 770446040"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono text-left focus:outline-none focus:border-amber-500"
                        dir="ltr"
                      />
                    </div>
                  )}

                  {/* 4. Specific Custom Content Editor for Created At */}
                  {inspectorElement === 'createdAt' && (
                    <div className="space-y-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                      <label className="text-[11px] font-bold text-sky-300 block">صيغة عرض التأريخ:</label>
                      <select
                        value={currentTemplate.createdAtFormat || 'short'}
                        onChange={e => handleUpdateTemplate({ createdAtFormat: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100"
                      >
                        <option value="short">مختصر (05/09/26)</option>
                        <option value="date_only">تأريخ فقط (2026/09/05)</option>
                        <option value="date_time">تأريخ ووقت كامل (2026/09/05 14:30)</option>
                      </select>
                    </div>
                  )}

                  {/* Horizontal X Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">الموقع الأفقي (X - من اليمين إلى اليسار):</span>
                      <span className="font-mono text-sky-400 font-bold">{Math.round(currentX)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      step={1}
                      value={currentX}
                      onChange={e => updateElementPos(inspectorElement, { x: parseFloat(e.target.value) })}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Vertical Y Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">الموقع الرأسي (Y - من الأعلى إلى الأسفل):</span>
                      <span className="font-mono text-emerald-400 font-bold">{Math.round(currentY)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      step={1}
                      value={currentY}
                      onChange={e => updateElementPos(inspectorElement, { y: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">حجم الخط / العنصر:</span>
                      <span className="font-mono text-amber-400 font-bold">{currentFontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={32}
                      step={0.5}
                      value={currentFontSize}
                      onChange={e => updateElementPos(inspectorElement, { fontSize: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Alignment buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-300">محاذاة النص:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      {[
                        { align: 'right', label: 'يمين', icon: AlignRight },
                        { align: 'center', label: 'وسط', icon: AlignCenter },
                        { align: 'left', label: 'يسار', icon: AlignLeft }
                      ].map(a => (
                        <button
                          key={a.align}
                          type="button"
                          onClick={() => updateElementPos(inspectorElement, { align: a.align as any })}
                          className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                            currentAlign === a.align
                              ? 'bg-sky-600 text-white font-bold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={`محاذاة ${a.label}`}
                        >
                          <a.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 3. SECTION: Toggles Grid for Visible Fields */}
          <div className="border-t border-slate-800 pt-3">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              تفعيل أو إخفاء حقول وبيانات الكرت:
            </span>
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

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showSupportPhone !== false}
                onChange={e => handleUpdateTemplate({ showSupportPhone: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">هاتف الدعم (رقم الجوال)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={currentTemplate.showCustomFooter !== false && !!(currentTemplate.customFooter && currentTemplate.customFooter.trim())}
                onChange={e => handleUpdateTemplate({
                  showCustomFooter: e.target.checked,
                  ...(e.target.checked && !currentTemplate.customFooter ? { customFooter: 'تغطية واسعة وسرعات تحميل وتنزيل فائقة' } : {})
                })}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span className="text-slate-200">شريط التذييل (العبارة)</span>
            </label>
          </div>

          {/* Icons & Visual Symbols Master Toggle */}
          <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-sky-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">عرض الرموز والأيقونات التوضيحية</span>
                <span className="text-[10px] text-slate-400 block">
                  إظهار أيقونات متطابقة في المعاينة والطباعة (🕒 الصلاحية، 💾 الرصيد، 📶 الشبكة، 📞 الهاتف)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateTemplate({ showIcons: currentTemplate.showIcons === false ? true : false })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentTemplate.showIcons !== false
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              {currentTemplate.showIcons !== false ? 'مفعّلة ومطابقة' : 'نص فقط بدون رموز'}
            </button>
          </div>
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
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>عرض هاتف الدعم الفني / رقم الجوال</span>
              </span>
              <input
                type="checkbox"
                checked={currentTemplate.showSupportPhone !== false}
                onChange={e => handleUpdateTemplate({ showSupportPhone: e.target.checked })}
                className="accent-sky-500 rounded w-4 h-4"
              />
            </label>
            {currentTemplate.showSupportPhone !== false && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-slate-400">رقم الهاتف أو الواتساب</label>
                  {tenant.phone && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTemplate({ supportPhoneText: tenant.phone })}
                      className="text-[10px] text-amber-400 hover:text-amber-300"
                    >
                      استعادة رقم المنشأة ({tenant.phone})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={currentTemplate.supportPhoneText !== undefined ? currentTemplate.supportPhoneText : (tenant.phone || '')}
                  onChange={e => handleUpdateTemplate({ supportPhoneText: e.target.value })}
                  placeholder="مثال: 770446040"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono text-left focus:outline-none focus:border-amber-500"
                  dir="ltr"
                />
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTemplate.includePhoneInFooter || false}
                    onChange={e => handleUpdateTemplate({ includePhoneInFooter: e.target.checked })}
                    className="accent-sky-500 rounded w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-slate-300">
                    إلحاق رقم الهاتف بشريط التذييل السفلي
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Custom Footer / Slogan */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>شريط التذييل (العبارة والتعليمات)</span>
              </span>
              <input
                type="checkbox"
                checked={currentTemplate.showCustomFooter !== false && !!(currentTemplate.customFooter && currentTemplate.customFooter.trim())}
                onChange={e => handleUpdateTemplate({
                  showCustomFooter: e.target.checked,
                  ...(e.target.checked && !currentTemplate.customFooter ? { customFooter: 'تغطية واسعة وسرعات تحميل وتنزيل فائقة' } : {})
                })}
                className="accent-sky-500 rounded w-4 h-4"
              />
            </label>

            {currentTemplate.showCustomFooter !== false && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">نص العبارة الترويجية أو التعليمات:</span>
                  {currentTemplate.customFooter && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTemplate({ customFooter: '', showCustomFooter: false })}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      إفراغ النص وإخفاء التذييل
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={currentTemplate.customFooter ?? ''}
                  onChange={e => handleUpdateTemplate({ customFooter: e.target.value, showCustomFooter: true })}
                  placeholder="مثال: تغطية واسعة وسرعات تحميل وتنزيل فائقة"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    'تغطية واسعة وسرعات تحميل وتنزيل فائقة',
                    'امسح الرمز أو سجل الدخول بالمتصفح',
                    'خدمة إنترنت سريعة ومستقرة 24 ساعة',
                    'الرمز صالح للاستخدام على جهاز واحد فقط'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleUpdateTemplate({ customFooter: preset, showCustomFooter: true })}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

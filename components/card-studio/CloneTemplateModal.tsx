'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CardTemplate, Profile, Tenant } from '@/types';
import { COLOR_SCHEME_PRESETS, ColorSchemePreset } from '@/lib/templates';
import { formatCurrency } from '@/lib/formatters';
import {
  Copy,
  Sparkles,
  X,
  Check,
  CheckCircle2,
  Layers,
  Palette,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Tag,
  Sliders,
  Move,
  QrCode,
  RefreshCw
} from 'lucide-react';

interface CloneTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CardTemplate[];
  currentTemplate: CardTemplate;
  initialSourceTemplateId?: string;
  profiles: Profile[];
  selectedProfileId: string;
  tenant: Tenant;
  onConfirmClone: (params: {
    sourceTemplateId: string;
    targetProfileId?: string;
    newTemplateName: string;
    colorPresetId?: string;
  }) => Promise<void>;
  isCloning: boolean;
}

export const CloneTemplateModal: React.FC<CloneTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  currentTemplate,
  initialSourceTemplateId,
  profiles,
  selectedProfileId,
  tenant,
  onConfirmClone,
  isCloning
}) => {
  // Selected source template
  const [sourceId, setSourceId] = useState<string>(initialSourceTemplateId || currentTemplate.id);
  
  // Selected target profile
  const [targetProfId, setTargetProfId] = useState<string>(selectedProfileId || profiles[0]?.id || '');
  
  // Cloned template custom name
  const [clonedName, setClonedName] = useState<string>('');
  
  // Color scheme adjustment: 'keep_original' or preset ID
  const [selectedColorPreset, setSelectedColorPreset] = useState<string>('keep_original');

  // Find source template
  const sourceTemplate = useMemo(() => {
    return templates.find(t => t.id === sourceId) || currentTemplate;
  }, [templates, sourceId, currentTemplate]);

  // Find target profile
  const targetProfile = useMemo(() => {
    return profiles.find(p => p.id === targetProfId) || profiles[0];
  }, [profiles, targetProfId]);

  // Update source if initialSourceTemplateId changes
  useEffect(() => {
    if (initialSourceTemplateId) {
      setSourceId(initialSourceTemplateId);
    } else {
      setSourceId(currentTemplate.id);
    }
  }, [initialSourceTemplateId, currentTemplate.id, isOpen]);

  // Auto-suggest intelligent template name whenever target profile or source changes
  useEffect(() => {
    if (!isOpen) return;
    
    if (targetProfile) {
      if (targetProfile.price) {
        setClonedName(`قالب كرت أبو ${targetProfile.price}`);
      } else {
        setClonedName(`قالب كرت باقة ${targetProfile.name}`);
      }
    } else {
      setClonedName(`${sourceTemplate.name} (نسخة جديدة)`);
    }
  }, [targetProfile, sourceTemplate, isOpen]);

  if (!isOpen) return null;

  const customSavedTemplates = templates.filter(
    t => t.isCustom || t.savedByUser || t.id.startsWith('tpl_user_') || t.id.startsWith('tpl_custom_') || t.isAiGenerated
  );
  const otherTemplates = templates.filter(
    t => !customSavedTemplates.some(ct => ct.id === t.id)
  );

  const handleClone = async () => {
    const trimmed = clonedName.trim();
    if (!trimmed) {
      alert('يرجى تحديد اسم للقالب المستنسخ الجديد');
      return;
    }

    await onConfirmClone({
      sourceTemplateId: sourceId,
      targetProfileId: targetProfId || undefined,
      newTemplateName: trimmed,
      colorPresetId: selectedColorPreset !== 'keep_original' ? selectedColorPreset : undefined
    });
  };

  // Preview colors depending on choice
  const activeColorPreset = COLOR_SCHEME_PRESETS.find(p => p.id === selectedColorPreset);
  const previewColors = activeColorPreset
    ? {
        bgStart: activeColorPreset.bgGradientStart,
        bgEnd: activeColorPreset.bgGradientEnd,
        accent: activeColorPreset.accentColor,
        badge: activeColorPreset.badgeBg,
        text: activeColorPreset.textColor
      }
    : {
        bgStart: sourceTemplate.bgGradientStart || sourceTemplate.bgColor || '#0f172a',
        bgEnd: sourceTemplate.bgGradientEnd || '#1e293b',
        accent: sourceTemplate.accentColor || '#38bdf8',
        badge: sourceTemplate.badgeBg || '#f59e0b',
        text: sourceTemplate.textColor || '#ffffff'
      };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-900/30">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  استنساخ تصميم وتنسيق القالب لباقة أخرى
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  مرونة احترافية ⚡
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                انسخ كافة مواضع وأحجام وتنسيقات قالب جاهز وطبّقها مباشرة على فئة ثانية مع إمكانية تعديل الألوان بسهولة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* STEP 1: Select Source Template */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                <span>القالب المصدر (الذي تريد استنساخ شكله ومواضع عناصره):</span>
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {sourceTemplate.cardsPerRow * sourceTemplate.cardsPerCol} كرت/ورقة A4
              </span>
            </label>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <select
                id="source-template-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 font-bold focus:outline-none focus:border-sky-500 transition font-sans"
              >
                {customSavedTemplates.length > 0 && (
                  <optgroup label="🌟 قوالبي المخصصة المحفوظة للباقات">
                    {customSavedTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        ⭐ {t.name} {t.linkedProfileName ? `(باقة: ${t.linkedProfileName})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🎨 مكتبة القوالب الجاهزة">
                  {otherTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Source Template Specs Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">القالب المختار:</span>
                  <span className="font-bold text-white">{sourceTemplate.name}</span>
                  {sourceTemplate.linkedProfileName && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-semibold text-[10px] border border-amber-500/30">
                      مرتبط بـ {sourceTemplate.linkedProfileName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10.5px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مواضع السحب بالماوس جاهزة</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Select Target Profile */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                <span>الفئة أو الباقة المستهدفة (التي سينتقل إليها هذا التصميم):</span>
              </span>
              <span className="text-[11px] text-sky-400">
                سيتم تفعيله تلقائياً فور اختيار هذه الفئة
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profiles.map(p => {
                const isSelected = p.id === targetProfId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetProfId(p.id)}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-400 ring-2 ring-sky-500/40 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-sky-400" />
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-mono">
                        السعر: {formatCurrency(p.price, tenant.currency)} • {p.uptimeDisplay}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-black">
                        ✓
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: New Template Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                <span>اسم القالب المستنسخ الجديد:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                مثال: قالب كرت أبو 500
              </span>
            </label>

            <input
              type="text"
              id="cloned-template-name-input"
              value={clonedName}
              onChange={(e) => setClonedName(e.target.value)}
              placeholder="اكتب اسم القالب الجديد..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none transition shadow-inner"
            />

            {/* Quick Name Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10.5px] text-slate-400">اقتراحات سريعة:</span>
              {targetProfile?.price && (
                <button
                  type="button"
                  onClick={() => setClonedName(`قالب كرت أبو ${targetProfile.price}`)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                >
                  قالب كرت أبو {targetProfile.price}
                </button>
              )}
              {targetProfile?.name && (
                <button
                  type="button"
                  onClick={() => setClonedName(`قالب كرت باقة ${targetProfile.name}`)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
                >
                  قالب كرت باقة {targetProfile.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => setClonedName(`${sourceTemplate.name} (نسخة ${targetProfile?.name || 'جديدة'})`)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                نسخة من {sourceTemplate.name}
              </button>
            </div>
          </div>

          {/* STEP 4: Color Adjustment / Keep Original */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                <span>تعديل لون القالب لتمييز الفئة (اختياري وسريع):</span>
              </label>
              <span className="text-[11px] text-slate-400">
                يمكنك أيضاً تعديل الألوان لاحقاً في أي وقت
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Option A: Keep Original Colors */}
              <button
                type="button"
                onClick={() => setSelectedColorPreset('keep_original')}
                className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                  selectedColorPreset === 'keep_original'
                    ? 'bg-amber-600/20 border-amber-400 ring-1 ring-amber-500/40 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>🎨 ألوان القالب الأصلية</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  نفس التدرج واللون الأصلي بدون تغيير
                </div>
              </button>

              {/* Quick Distinct Presets for Different Profile Tiers */}
              {COLOR_SCHEME_PRESETS.slice(0, 7).map(preset => {
                const isSelected = selectedColorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedColorPreset(preset.id)}
                    className={`p-2 rounded-xl border text-right transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-400 ring-1 ring-sky-500/40 text-sky-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold truncate">{preset.name}</span>
                      <div
                        className="w-3 h-3 rounded-full border border-slate-700 shrink-0"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                    {/* Swatch Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex border border-slate-800 mt-1.5">
                      <div className="flex-1" style={{ backgroundColor: preset.bgGradientStart }} />
                      <div className="flex-1" style={{ backgroundColor: preset.bgGradientEnd }} />
                      <div className="w-2" style={{ backgroundColor: preset.accentColor }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Color Swatch Strip */}
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>معاينة شريط ألوان القالب الناتج:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-28 rounded-md overflow-hidden flex border border-slate-700 shadow-inner">
                  <div className="flex-1" style={{ backgroundColor: previewColors.bgStart }} />
                  <div className="flex-1" style={{ backgroundColor: previewColors.bgEnd }} />
                  <div className="w-3" style={{ backgroundColor: previewColors.accent }} />
                  <div className="w-3" style={{ backgroundColor: previewColors.badge }} />
                </div>
              </div>
            </div>
          </div>

          {/* Cloning Summary Notice */}
          <div className="p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-2xl text-xs space-y-1.5">
            <div className="font-bold text-sky-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ما الذي سيتم استنساخه بالضبط؟</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside leading-relaxed">
              <li>كافة مواضع العناصر المسحوبة بالماوس بدقة (X, Y) وأحجام النصوص والخطوط.</li>
              <li>شكل الباركود أو الـ QR كود، وحالة إظهار العناصر (الرقم التسلسلي، الشعار، التذييل).</li>
              <li>توزيع الكروت في ورقة A4 ({sourceTemplate.cardsPerRow} × {sourceTemplate.cardsPerCol}) والهوامش والقص.</li>
              <li>الربط التلقائي بالباقة المستهدفة ({targetProfile?.name}) ومزامنته سحابياً ومحلياً.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 sm:p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            id="confirm-clone-template-btn"
            onClick={handleClone}
            disabled={isCloning || !clonedName.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-sky-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isCloning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>جاري الاستنساخ والمزامنة السحابية...</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-200" />
                <span>استنساخ وتطبيق القالب الآن</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

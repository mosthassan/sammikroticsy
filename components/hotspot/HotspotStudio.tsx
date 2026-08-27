'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Tenant, HotspotPortalTemplate } from '@/types';
import {
  PREBUILT_HOTSPOT_TEMPLATES,
  DEFAULT_ARABIC_ERRORS_TXT
} from '@/lib/hotspot-templates';
import {
  downloadHotspotZipPackage,
  parseUploadedHotspotZip
} from '@/lib/hotspot-packager';
import { HotspotLivePreview } from './HotspotLivePreview';
import {
  Sparkles,
  Layers,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Code,
  Palette,
  FileText,
  Phone,
  MessageSquare,
  Flame,
  Zap,
  FolderArchive,
  RefreshCw,
  Eye,
  Sliders,
  FileArchive,
  ChevronRight
} from 'lucide-react';

interface HotspotStudioProps {
  tenant: Tenant;
}

export const HotspotStudio: React.FC<HotspotStudioProps> = ({ tenant }) => {
  // Active Creation Mode Tab: 'ai' | 'gallery' | 'upload'
  const [creationMode, setCreationMode] = useState<'ai' | 'gallery' | 'upload'>('gallery');

  // Active Template State
  const [templates, setTemplates] = useState<HotspotPortalTemplate[]>(PREBUILT_HOTSPOT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PREBUILT_HOTSPOT_TEMPLATES[0].id);

  // Active sub-page in preview: 'login' | 'status' | 'alogin' | 'logout' | 'errors'
  const [activePage, setActivePage] = useState<'login' | 'status' | 'alogin' | 'logout' | 'errors'>('login');

  // AI Generator Form State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiStylePreset, setAiStylePreset] = useState<string>('cyber_neon');
  const [aiLoginType, setAiLoginType] = useState<'single_code' | 'username_password'>('single_code');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('');

  // Editor View Mode: 'visual' | 'code'
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');

  // Custom ZIP Upload State
  const [isDraggingZip, setIsDraggingZip] = useState<boolean>(false);
  const [uploadedZipStats, setUploadedZipStats] = useState<{
    fileName: string;
    filesCount: number;
    hasLogin: boolean;
    hasStatus: boolean;
    hasErrors: boolean;
  } | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Notifications & UI feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Memoized Current Template
  const currentTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Update field on current template
  const handleUpdateTemplateField = <K extends keyof HotspotPortalTemplate>(
    field: K,
    value: HotspotPortalTemplate[K]
  ) => {
    setTemplates(prev =>
      prev.map(t => {
        if (t.id === currentTemplate.id) {
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  };

  // AI Prompt Suggestions
  const AI_PROMPT_SUGGESTIONS = [
    {
      title: '🎮 نيون ألعاب ومقاهي (Cyberpunk Gaming)',
      prompt: 'صفحة هوتسبوت داكنة بتأثيرات نيون زجاجية وبنفسجية لشبكة مقاهي إنترنت مع عدادات سرعة وبطاقة كرت مضيئة'
    },
    {
      title: '🏢 فايبر كلاسيكي رسمي (Corporate Fiber)',
      prompt: 'صفحة زرقاء رسمية واحترافية لشبكات الألياف الضوئية المنزلية مع أزرار تواصل واتساب ودعم فني'
    },
    {
      title: '⚡ فائق السرعة وخفيف جداً (Ultra-Light)',
      prompt: 'صفحة هوتسبوت بيضاء خفيفة جداً وسريعة التحميل للأماكن ذات التغطية الضعيفة والهواتف البسيطة'
    },
    {
      title: '👑 ذهبي ملكي للمطاعم والفنادق (VIP Gold)',
      prompt: 'تصميم راقي باللون الذهبي الداكن مخصص لضيوف الفنادق والمطاعم الفاخرة مع تجربة مجانية'
    }
  ];

  // Handler: Generate with AI
  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage('يرجى كتابة وصف لصفحة الهوتسبوت المطلوبة في الحقل النصي.');
      return;
    }

    setIsAiGenerating(true);
    setErrorMessage(null);
    setAiGenerationStep('جاري الاتصال بمحرك Gemini AI وتصميم الواجهات...');

    try {
      setAiGenerationStep('جاري بناء كود HTML5 وCSS المتوافق مع راوترات MikroTik RouterOS...');
      const res = await fetch('/api/gemini/generate-hotspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          networkName: tenant.businessName,
          themeStyle: aiStylePreset,
          loginType: aiLoginType,
          supportPhone: tenant.phone
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في توليد صفحة الهوتسبوت عبر الذكاء الاصطناعي');
      }

      setAiGenerationStep('جاري تجميع حزمة الملفات والتعريب العربي...');
      const data: HotspotPortalTemplate = await res.json();

      const newTemplateId = data.id || `tpl_hotspot_ai_${data.name?.slice(0, 10) || 'gen'}`;
      const newTemplate: HotspotPortalTemplate = {
        ...data,
        id: newTemplateId,
        isAiGenerated: true
      };

      setTemplates(prev => [newTemplate, ...prev.filter(t => t.id !== newTemplateId)]);
      setSelectedTemplateId(newTemplateId);
      setSuccessMessage(`تم توليد صفحة الهوتسبوت بالذكاء الاصطناعي بنجاح: "${newTemplate.name}"!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('AI Hotspot Generation Error:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء التوليد بالذكاء الاصطناعي');
    } finally {
      setIsAiGenerating(false);
      setAiGenerationStep('');
    }
  };

  // Handler: Upload Custom ZIP
  const processUploadedZipFile = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('يرجى اختيار ملف مضغوط صالح بصيغة ZIP (.zip)');
      return;
    }

    setErrorMessage(null);
    try {
      const parsed = await parseUploadedHotspotZip(file);
      if (!parsed.htmlLogin && !parsed.htmlStatus) {
        throw new Error('لم يتم العثور على ملف login.html أو status.html داخل حزمة الـ ZIP المرفوعة');
      }

      const customId = `tpl_hotspot_zip_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${file.size}`;
      const newCustomTemplate: HotspotPortalTemplate = {
        ...currentTemplate,
        id: customId,
        name: `قالب مخصص: ${file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name}`,
        description: `قالب هوتسبوت مستورد من ملف ZIP خارجي يحتوي على ${parsed.detectedFilesCount} ملفات`,
        themeStyle: 'custom',
        htmlLogin: parsed.htmlLogin || currentTemplate.htmlLogin,
        htmlStatus: parsed.htmlStatus || currentTemplate.htmlStatus,
        htmlAlogin: parsed.htmlAlogin || currentTemplate.htmlAlogin,
        htmlLogout: parsed.htmlLogout || currentTemplate.htmlLogout,
        errorsTxt: parsed.errorsTxt || currentTemplate.errorsTxt || DEFAULT_ARABIC_ERRORS_TXT
      };

      setTemplates(prev => [newCustomTemplate, ...prev.filter(t => t.id !== customId)]);
      setSelectedTemplateId(customId);
      setUploadedZipStats({
        fileName: file.name,
        filesCount: parsed.detectedFilesCount,
        hasLogin: !!parsed.htmlLogin,
        hasStatus: !!parsed.htmlStatus,
        hasErrors: !!parsed.errorsTxt
      });
      setSuccessMessage(`تم فك واستيراد قالب الهوتسبوت من ملف "${file.name}" بنجاح!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('ZIP extraction error:', err);
      setErrorMessage(err.message || 'فشل في قراءة ملف الـ ZIP');
    }
  };

  // Handler: Export ZIP
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadHotspotZipPackage(currentTemplate, tenant.businessName);
      setSuccessMessage(`تم تحميل حزمة المايكروتك كاملة جاهزة للتركيب بنجاح!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export ZIP error:', err);
      setErrorMessage('حدث خطأ أثناء تجميع وتحميل ملف الـ ZIP');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12" dir="rtl">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة وتخصيص صفحات الهوتسبوت (Hotspot Portal Studio)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            صمم، ولّد بالذكاء الاصطناعي، أو ارفع قوالب تسجيل الدخول لشبكات MikroTik RouterOS مع تصدير حزم ZIP جاهزة للـ WinBox.
          </p>
        </div>

        {/* Global Download Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-download-hotspot-zip"
            type="button"
            onClick={handleExportZip}
            disabled={isExportingZip}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            {isExportingZip ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري بناء الـ ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تحميل حزمة المايكروتك ZIP 📦</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Controls & Creator (5 cols) / Right Interactive Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Creation Modes & Customizer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Creation Mode Navigation Tabs */}
          <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-md">
            <button
              id="tab-mode-ai"
              type="button"
              onClick={() => setCreationMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                creationMode === 'ai'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-300" />
              <span>توليد بالذكاء الاصطناعي</span>
            </button>

            <button
              id="tab-mode-gallery"
              type="button"
              onClick={() => setCreationMode('gallery')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                creationMode === 'gallery'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-300" />
              <span>معرض القوالب والتعديل</span>
            </button>

            <button
              id="tab-mode-upload"
              type="button"
              onClick={() => setCreationMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                creationMode === 'upload'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-4 h-4 text-sky-300" />
              <span>رفع ملف ZIP</span>
            </button>
          </div>

          {/* TAB 1: AI Prompt Generator */}
          {creationMode === 'ai' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">توليد صفحة هوتسبوت ذكية عبر Gemini AI</h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اكتب وصف الصفحة المطلوبة (Prompt):
                </label>
                <textarea
                  id="input-ai-hotspot-prompt"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="مثال: صمم صفحة هوتسبوت نيون داكنة احترافية لشبكة كافيهات مع أزرار باقات الكروت وشعار شبكة متوهج..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none"
                />
              </div>

              {/* Quick AI Suggestions */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 mb-2">أفكار ونماذج سريعة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AI_PROMPT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAiPrompt(sug.prompt)}
                      className="text-right p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/50 text-[11.5px] text-slate-300 transition"
                    >
                      <div className="font-bold text-white mb-0.5">{sug.title}</div>
                      <div className="text-[10.5px] text-slate-400 line-clamp-1">{sug.prompt}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Style & Options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">النمط البصري:</label>
                  <select
                    value={aiStylePreset}
                    onChange={e => setAiStylePreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="cyber_neon">نيون مستقبلي داكن (Cyber Neon)</option>
                    <option value="corporate_blue">أزرق فايبر كلاسيكي (Fiber Blue)</option>
                    <option value="minimal_light">أبيض اقتصادي خفيف (Minimal Light)</option>
                    <option value="luxury_gold">ذهبي ملكي للمطاعم (VIP Gold)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">طريقة تسجيل الدخول:</label>
                  <select
                    value={aiLoginType}
                    onChange={e => setAiLoginType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="single_code">كود الكرت فقط (Voucher PIN Only)</option>
                    <option value="username_password">اسم مستخدم وكلمة مرور</option>
                  </select>
                </div>
              </div>

              {/* Generate AI Button */}
              <button
                id="btn-trigger-ai-hotspot-gen"
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-black text-sm shadow-lg shadow-sky-950/50 transition disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{aiGenerationStep || 'جاري التوليد بالذكاء الاصطناعي...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>توليد صفحة الهوتسبوت بالذكاء الاصطناعي ⚡</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Pre-built Templates Gallery & Editor */}
          {creationMode === 'gallery' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>اختر من القوالب الجاهزة المعتمدة:</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {templates.length} قوالب متاحة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templates.map(tpl => {
                    const isSelected = tpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`text-right p-3 rounded-xl border transition relative overflow-hidden ${
                          isSelected
                            ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: tpl.primaryColor }}
                            ></span>
                            <span className="font-bold text-xs text-white truncate max-w-[140px]">
                              {tpl.name}
                            </span>
                          </div>
                          {tpl.isAiGenerated && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Tabs: Visual Customizer vs Code Editor */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorMode('visual')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        editorMode === 'visual'
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>تخصيص بصري</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('code')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        editorMode === 'code'
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>محرر الأكواد المباشر</span>
                    </button>
                  </div>
                </div>

                {editorMode === 'visual' ? (
                  /* Visual Controls */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        عنوان الترحيب الرئيسي:
                      </label>
                      <input
                        type="text"
                        value={currentTemplate.welcomeHeadline || ''}
                        onChange={e => handleUpdateTemplateField('welcomeHeadline', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                        placeholder="أهلاً بك في شبكتنا"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        الوصف الترحيبي الفرعي:
                      </label>
                      <input
                        type="text"
                        value={currentTemplate.welcomeSubheadline || ''}
                        onChange={e => handleUpdateTemplateField('welcomeSubheadline', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                        placeholder="أدخل رمز الكرت لبدء التصفح الفائق"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          اللون الرئيسي:
                        </label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
                          <input
                            type="color"
                            value={currentTemplate.primaryColor}
                            onChange={e => handleUpdateTemplateField('primaryColor', e.target.value)}
                            className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                          />
                          <span className="text-xs font-mono text-slate-300">{currentTemplate.primaryColor}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          هاتف الدعم:
                        </label>
                        <input
                          type="text"
                          value={currentTemplate.supportPhone || ''}
                          onChange={e => handleUpdateTemplateField('supportPhone', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                          placeholder="770000000"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={currentTemplate.showFreeTrial}
                          onChange={e => handleUpdateTemplateField('showFreeTrial', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0"
                        />
                        <span>تفعيل زر التجربة المجانية (Trial)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={currentTemplate.showVoucherRates}
                          onChange={e => handleUpdateTemplateField('showVoucherRates', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0"
                        />
                        <span>عرض قائمة أسعار الباقات</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Code Editor View */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>تعديل كود الملف المحدد ({activePage}.html):</span>
                      <span className="font-mono text-sky-400">MikroTik Tags Enabled</span>
                    </div>
                    <textarea
                      rows={12}
                      value={
                        activePage === 'login'
                          ? currentTemplate.htmlLogin
                          : activePage === 'status'
                          ? currentTemplate.htmlStatus
                          : activePage === 'alogin'
                          ? currentTemplate.htmlAlogin
                          : activePage === 'logout'
                          ? currentTemplate.htmlLogout
                          : currentTemplate.errorsTxt
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (activePage === 'login') handleUpdateTemplateField('htmlLogin', val);
                        else if (activePage === 'status') handleUpdateTemplateField('htmlStatus', val);
                        else if (activePage === 'alogin') handleUpdateTemplateField('htmlAlogin', val);
                        else if (activePage === 'logout') handleUpdateTemplateField('htmlLogout', val);
                        else if (activePage === 'errors') handleUpdateTemplateField('errorsTxt', val);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none resize-none leading-relaxed"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Upload Custom ZIP */}
          {creationMode === 'upload' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <FolderArchive className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">رفع صفحة هوتسبوت مخصصة (ملف ZIP)</h2>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                ارفع أي ملف ZIP لصفحة هوتسبوت موجودة مسبقاً لديك. سيقوم النظام بفك الملفات تلقائياً ومعاينتها حياً مع إتاحة تعديلها وتحميلها مجدداً.
              </p>

              {/* Hidden File Input */}
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) processUploadedZipFile(file);
                }}
              />

              {/* Drag & Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDraggingZip(true); }}
                onDragLeave={() => setIsDraggingZip(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDraggingZip(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUploadedZipFile(file);
                }}
                onClick={() => zipInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDraggingZip
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                  <FileArchive className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">
                    اسحب وأفلت ملف الـ ZIP هنا، أو اضغط للاختيار
                  </p>
                  <p className="text-[11px] text-slate-400">
                    يدعم حزم صفحات MikroTik Hotspot القياسية التي تحتوي على login.html
                  </p>
                </div>
              </div>

              {/* Uploaded Zip Summary Badge */}
              {uploadedZipStats && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>الملف: {uploadedZipStats.fileName}</span>
                    <span className="text-emerald-400 font-mono">{uploadedZipStats.filesCount} ملفات مستخرجة</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded ${uploadedZipStats.hasLogin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {uploadedZipStats.hasLogin ? '✓ login.html جاهز' : '✗ لا يوجد login.html'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${uploadedZipStats.hasStatus ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {uploadedZipStats.hasStatus ? '✓ status.html جاهز' : 'توليد status افتراضي'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Device Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-20">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>المعاينة الحية التفاعلية (Live Simulation):</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {currentTemplate.name}
            </span>
          </div>

          <HotspotLivePreview
            template={currentTemplate}
            networkName={tenant.businessName}
            activePage={activePage}
            onActivePageChange={setActivePage}
          />
        </div>
      </div>
    </div>
  );
};

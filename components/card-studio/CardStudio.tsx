'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardBatch, CardTemplate, Profile, Tenant, CodeCharSet } from '@/types';
import { DEFAULT_TEMPLATES, svgToDataUri } from '@/lib/templates';
import { CardPreview } from './CardPreview';
import { A4SheetPreview } from './A4SheetPreview';
import { InteractiveCardCanvas } from './InteractiveCardCanvas';
import { StudioControlPanel } from './StudioControlPanel';
import { generateBatchCards, generateRouterOSTerminalScript } from '@/lib/store';
import { generateCardsPdf } from '@/lib/pdf-generator';
import { saveTemplateToFirestore, loadTemplatesFromFirestore } from '@/lib/firestore-service';
import {
  FileDown,
  Printer,
  CheckCircle,
  Eye,
  RefreshCw,
  Move
} from 'lucide-react';

interface CardStudioProps {
  tenant: Tenant;
  profiles: Profile[];
  templates: CardTemplate[];
  onBatchSaved: (batch: CardBatch, cards: Card[]) => void;
  onUpdateProfiles?: (profiles: Profile[]) => void;
}

export const CardStudio: React.FC<CardStudioProps> = ({
  tenant,
  profiles,
  templates: initialTemplates,
  onBatchSaved,
  onUpdateProfiles
}) => {
  // Generator State
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(24);
  const [prefix, setPrefix] = useState<string>('NW-');
  const [codeLength, setCodeLength] = useState<number>(6);
  const [codeCharSet, setCodeCharSet] = useState<CodeCharSet>('digits_only');
  const [passwordType, setPasswordType] = useState<'same_as_username' | 'separate_pin' | 'no_password'>('same_as_username');

  // Template State
  const [templates, setTemplates] = useState<CardTemplate[]>(initialTemplates || DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl_cyber_neon_svg');
  const currentTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
  }, [templates, selectedTemplateId]);

  // AI Template Generator State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiStylePreset] = useState<string>('modern_dark');
  const [isGeneratingAiTemplate, setIsGeneratingAiTemplate] = useState<boolean>(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Firestore Save Template State
  const [isSavingToFirestore, setIsSavingToFirestore] = useState<boolean>(false);
  const [isSavedInFirestore, setIsSavedInFirestore] = useState<boolean>(false);

  // Load custom templates from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    loadTemplatesFromFirestore(tenant.id).then(savedTpls => {
      if (isMounted && savedTpls.length > 0) {
        setTemplates(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newOnes = savedTpls.filter(t => !existingIds.has(t.id));
          return [...newOnes, ...prev];
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  // File Upload & Drag-and-Drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processUploadedFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const customId = `tpl_custom_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${file.size}`;
      const newCustomTemplate: CardTemplate = {
        ...currentTemplate,
        id: customId,
        name: `قالب مخصص (${file.name.length > 12 ? file.name.slice(0, 12) + '...' : file.name})`,
        bgType: 'image',
        bgImage: dataUrl,
        textColor: '#ffffff',
        accentColor: '#38bdf8',
        badgeBg: '#f59e0b',
        badgeTextColor: '#000000',
        themeStyle: 'modern_dark'
      };

      setTemplates(prev => [newCustomTemplate, ...prev.filter(t => t.id !== customId)]);
      setSelectedTemplateId(customId);
      setSuccessMessage('تم رفع القالب المخصص وتطبيقه بنجاح على التصميم!');
      setTimeout(() => setSuccessMessage(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleRemoveCustomTemplate = () => {
    handleUpdateTemplate({ bgType: 'gradient', bgImage: undefined, svgCode: undefined });
    setSuccessMessage('تمت إزالة القالب المخصص والرجوع للنمط التلقائي');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // AI Template Generator Handler
  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiError('يرجى كتابة وصف القالب المطلوب أولاً');
      return;
    }
    setAiError(null);
    setIsGeneratingAiTemplate(true);
    setAiGenerationStep('جاري تحليل الفكرة وتصميم الهيكل الهندسي عبر Gemini AI...');

    try {
      const res = await fetch('/api/gemini/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          networkName: tenant.businessName,
          stylePreset: aiStylePreset
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في توليد القالب عبر الذكاء الاصطناعي');
      }

      setAiGenerationStep('جاري بناء وتجهيز كود الفيكتور SVG عالي الدقة...');
      const data = await res.json();

      const newTemplateId = data.id || `tpl_ai_${data.name?.slice(0, 10) || 'generated'}`;
      const newAiTemplate: CardTemplate = {
        ...currentTemplate,
        id: newTemplateId,
        name: data.name || `قالب AI: ${aiPrompt.slice(0, 18)}...`,
        bgType: 'image',
        bgImage: data.svgDataUri || svgToDataUri(data.svgCode),
        svgCode: data.svgCode,
        textColor: data.textColor || '#ffffff',
        accentColor: data.accentColor || '#38bdf8',
        badgeBg: data.badgeBg || '#f59e0b',
        badgeTextColor: data.badgeTextColor || '#000000',
        bgColor: data.bgColor || '#0f172a',
        themeStyle: data.themeStyle || 'cyber_neon',
        isAiGenerated: true
      };

      setTemplates(prev => [newAiTemplate, ...prev.filter(t => t.id !== newTemplateId)]);
      setSelectedTemplateId(newTemplateId);
      setIsSavedInFirestore(false);
      setSuccessMessage(`تم توليد القالب بالذكاء الاصطناعي بنجاح: "${newAiTemplate.name}"!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('AI Template Generation Error:', err);
      let friendlyError = err.message || 'حدث خطأ أثناء توليد القالب بالذكاء الاصطناعي';
      if (typeof friendlyError === 'string' && friendlyError.includes('GEMINI_API_KEY')) {
        friendlyError = 'مفتاح GEMINI_API_KEY غير مهيأ في بيئة العمل، يرجى إضافته في إعدادات المنصة';
      } else if (typeof friendlyError === 'string' && (friendlyError.includes('quota') || friendlyError.includes('RESOURCE_EXHAUSTED'))) {
        friendlyError = 'تم استنفاد الحصة المؤقتة لمفتاح Gemini، يرجى المحاولة بعد دقيقة أو استخدام نمط جاهز';
      }
      setAiError(friendlyError);
    } finally {
      setIsGeneratingAiTemplate(false);
      setAiGenerationStep('');
    }
  };

  // Firestore Save Template Handler
  const handleSaveTemplateToFirestore = async () => {
    setIsSavingToFirestore(true);
    try {
      const res = await saveTemplateToFirestore(tenant.id, currentTemplate);
      if (res.success) {
        setIsSavedInFirestore(true);
        setSuccessMessage(`تم حفظ القالب "${currentTemplate.name}" بنجاح في Firestore!`);
        setTimeout(() => setSuccessMessage(null), 4500);
      } else {
        alert(res.error || 'فشل حفظ القالب في قاعدة البيانات');
      }
    } catch (err) {
      console.error('Save template error:', err);
      alert('حدث خطأ أثناء حفظ القالب');
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  // View state
  const [scriptFlavor, setScriptFlavor] = useState<'hotspot_v7' | 'hotspot_v6' | 'userman_v7' | 'userman_v6'>('hotspot_v7');
  const [previewMode, setPreviewMode] = useState<'a4' | 'single' | 'designer'>('a4');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Active profile
  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedProfileId) || profiles[0];
  }, [profiles, selectedProfileId]);

  // Generate live sample cards for preview
  const previewBatchData = useMemo(() => {
    if (!selectedProfile) return { batch: null, cards: [] };
    return generateBatchCards({
      tenant,
      profile: selectedProfile,
      quantity,
      prefix,
      codeLength,
      codeCharSet,
      passwordType,
      templateId: currentTemplate.id
    });
  }, [tenant, selectedProfile, quantity, prefix, codeLength, codeCharSet, passwordType, currentTemplate.id]);

  const activeCards = previewBatchData.cards;

  // Custom template updates
  const handleUpdateTemplate = (updates: Partial<CardTemplate>) => {
    setTemplates(prev =>
      prev.map(t => (t.id === currentTemplate.id ? { ...t, ...updates } : t))
    );
    setIsSavedInFirestore(false);
  };

  // Export PDF
  const handleDownloadPdf = async () => {
    if (activeCards.length === 0) return;
    setIsGeneratingPdf(true);
    const totalPages = Math.ceil(activeCards.length / ((currentTemplate.cardsPerRow || 3) * (currentTemplate.cardsPerCol || 8)));
    setPdfProgress({ current: 1, total: totalPages });
    try {
      const blob = await generateCardsPdf(activeCards, currentTemplate, tenant, (current, total) => {
        setPdfProgress({ current, total });
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NetFlow_Cards_${selectedProfile?.name || 'Batch'}_${quantity}cards.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMessage(`تم توليد وتنزيل ملف PDF بنجاح (${quantity} كرت في ${totalPages} صفحة A4 عالية الدقة)!`);
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err) {
      console.error('PDF generation error', err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // Direct Print
  const handleDirectPrint = () => {
    window.print();
  };

  // Save batch into Inventory
  const handleSaveToInventory = () => {
    if (!previewBatchData.batch) return;
    onBatchSaved(previewBatchData.batch, previewBatchData.cards);
    setSuccessMessage(`تم حفظ الدفعة (${previewBatchData.batch.batchNumber}) بنجاح في المخزن العام بعدد ${quantity} كرت!`);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeCards.length === 0) return;
    const headers = ['Code,Password,Profile,Price,WholesalePrice,Uptime,ByteLimit,QR_Login_URL\n'];
    const rows = activeCards.map(c => 
      `"${c.code}","${c.password || ''}","${c.profileName}",${c.price},${c.wholesalePrice},"${c.uptimeDisplay}","${c.byteDisplay}","${c.qrData}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + headers.concat(rows.join('\n'));
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NetFlow_Cards_${selectedProfile?.name || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MikroTik Script Generator by flavor
  const getMikroTikScript = (flavor: string, cards: Card[], profileName?: string) => {
    const pName = profileName || 'default';
    if (flavor === 'userman_v7') {
      let script = `# NetFlow SaaS - MikroTik RouterOS v7 User Manager Script\n`;
      script += `# Total Vouchers: ${cards.length} | Profile: ${pName} | Date: ${new Date().toISOString()}\n\n`;
      cards.forEach(c => {
        script += `/user-manager user add name="${c.code}" password="${c.password || c.code}" group="${pName}" comment="NetFlow-${c.batchNumber || 'B-101'}"\n`;
      });
      return script;
    }
    if (flavor === 'userman_v6') {
      let script = `# NetFlow SaaS - MikroTik RouterOS v6 User Manager Script\n`;
      script += `# Total Vouchers: ${cards.length} | Profile: ${pName} | Date: ${new Date().toISOString()}\n\n`;
      cards.forEach(c => {
        script += `/tool user-manager user add username="${c.code}" password="${c.password || c.code}" customer=admin comment="NetFlow-${c.batchNumber || 'B-101'}"\n`;
        script += `/tool user-manager user create-and-activate-profile "${c.code}" profile="${pName}" customer=admin\n`;
      });
      return script;
    }
    if (flavor === 'hotspot_v6') {
      let script = `# NetFlow SaaS - MikroTik RouterOS v6 Hotspot Script\n`;
      script += `# Total Vouchers: ${cards.length} | Profile: ${pName} | Date: ${new Date().toISOString()}\n\n`;
      cards.forEach(c => {
        script += `/ip hotspot user add name="${c.code}" password="${c.password || c.code}" profile="${pName}" comment="NetFlow-${c.batchNumber || 'B-101'}"\n`;
      });
      return script;
    }
    // Default: RouterOS v7 Hotspot
    return generateRouterOSTerminalScript(cards, pName);
  };

  // Copy MikroTik Script
  const handleCopyMikroTikScript = () => {
    const script = getMikroTikScript(scriptFlavor, activeCards, selectedProfile?.name);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setSuccessMessage('تم نسخ أوامر وسكريبت المايكروتك بنجاح!');
    setTimeout(() => {
      setCopiedScript(false);
      setSuccessMessage(null);
    }, 3000);
  };

  // Download .rsc file for MikroTik
  const handleDownloadRsc = () => {
    const script = getMikroTikScript(scriptFlavor, activeCards, selectedProfile?.name);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netflow_${selectedProfile?.name || 'cards'}_${scriptFlavor}.rsc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage('تم تنزيل ملف أوامر المايكروتك .rsc بنجاح!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                استوديو التصميم الذكي للطباعة
              </span>
              <span className="text-slate-400 text-xs">• دقة الطباعة A4 المليمترية</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              توليد وتصميم كروت الإنترنت وطباعتها
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              قم بتحديد الباقة والكمية وتخصيص المظهر وتصدير ملفات PDF جاهزة مع كود QR للدخول السريع التلقائي.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="save-batch-btn"
              onClick={handleSaveToInventory}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition transform active:scale-95 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              حفظ الدفعة في المخزن
            </button>

            <button
              id="download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-sky-900/30 transition transform active:scale-95 text-sm"
            >
              {isGeneratingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isGeneratingPdf
                ? (pdfProgress ? `صفحة ${pdfProgress.current} من ${pdfProgress.total}...` : 'جاري إنشاء PDF...')
                : `تحميل PDF (${quantity} كرت)`}
            </button>

            <button
              id="direct-print-btn"
              onClick={handleDirectPrint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/60 rounded-xl font-semibold transition text-sm"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              طباعة
            </button>
          </div>
        </div>

        {/* Live PDF Progress Bar */}
        {isGeneratingPdf && pdfProgress && (
          <div className="mt-4 p-3 bg-sky-950/80 border border-sky-500/40 rounded-xl space-y-1.5 animate-in fade-in">
            <div className="flex justify-between text-xs text-sky-200 font-bold">
              <span>جاري رندرة وتوليد صفحات الطباعة بدقة 300 DPI عالية الوضوح...</span>
              <span className="font-mono">صفحة {pdfProgress.current} من {pdfProgress.total} ({Math.round((pdfProgress.current / pdfProgress.total) * 100)}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-500 h-2 transition-all duration-150 ease-out"
                style={{ width: `${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Controls (Left/Right) & Live Canvas/Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabbed Studio Control Panel (5 Cols) */}
        <div className="lg:col-span-5">
          <StudioControlPanel
            tenant={tenant}
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            selectedProfile={selectedProfile}
            onUpdateProfiles={onUpdateProfiles}
            quantity={quantity}
            setQuantity={setQuantity}
            prefix={prefix}
            setPrefix={setPrefix}
            codeLength={codeLength}
            setCodeLength={setCodeLength}
            codeCharSet={codeCharSet}
            setCodeCharSet={setCodeCharSet}
            passwordType={passwordType}
            setPasswordType={setPasswordType}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            currentTemplate={currentTemplate}
            handleUpdateTemplate={handleUpdateTemplate}
            handleSaveTemplateToFirestore={handleSaveTemplateToFirestore}
            isSavingToFirestore={isSavingToFirestore}
            isSavedInFirestore={isSavedInFirestore}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            isGeneratingAiTemplate={isGeneratingAiTemplate}
            aiGenerationStep={aiGenerationStep}
            aiError={aiError}
            setAiError={setAiError}
            handleGenerateAiTemplate={handleGenerateAiTemplate}
            fileInputRef={fileInputRef}
            isDragging={isDragging}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileUpload={handleFileUpload}
            handleRemoveCustomTemplate={handleRemoveCustomTemplate}
            activeCards={activeCards}
            scriptFlavor={scriptFlavor}
            setScriptFlavor={setScriptFlavor}
            copiedScript={copiedScript}
            handleCopyMikroTikScript={handleCopyMikroTikScript}
            handleDownloadRsc={handleDownloadRsc}
            handleExportCsv={handleExportCsv}
          />
        </div>

        {/* Right Column: Live Interactive Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Mode Switcher & Tools */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">المعاينة الحية للكروت</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="preview-a4-btn"
                onClick={() => setPreviewMode('a4')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  previewMode === 'a4'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ورقة A4 كاملة للطباعة
              </button>
              <button
                type="button"
                id="preview-single-btn"
                onClick={() => setPreviewMode('single')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  previewMode === 'single'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                معاينة كرت مفرد
              </button>
              <button
                type="button"
                id="preview-designer-btn"
                onClick={() => setPreviewMode('designer')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  previewMode === 'designer'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                    : 'text-sky-400 hover:text-sky-300'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>استوديو السحب بالماوس 🖱️</span>
              </button>
            </div>
          </div>

          {/* Render Area */}
          {previewMode === 'designer' ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-inner">
              {activeCards[0] && (
                <InteractiveCardCanvas
                  card={activeCards[0]}
                  template={currentTemplate}
                  tenant={tenant}
                  onUpdateTemplate={handleUpdateTemplate}
                />
              )}
            </div>
          ) : previewMode === 'single' ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[480px] shadow-inner">
              <div className="mb-4 text-center">
                <span className="text-xs text-slate-400 font-medium">
                  المقاس الواقعي: 63 مم × 33 مم (A4 Grid {(currentTemplate.cardsPerRow || 3)}x{(currentTemplate.cardsPerCol || 8)})
                </span>
              </div>
              {activeCards[0] && (
                <CardPreview
                  card={activeCards[0]}
                  template={currentTemplate}
                  tenant={tenant}
                  isZoomed={true}
                />
              )}
            </div>
          ) : (
            <A4SheetPreview
              cards={activeCards}
              template={currentTemplate}
              tenant={tenant}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

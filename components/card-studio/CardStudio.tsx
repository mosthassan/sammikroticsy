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
import { saveTemplateToFirestore, loadTemplatesFromFirestore, deleteTemplateFromFirestore } from '@/lib/firestore-service';
import { exportCardElementAsPng, exportTemplateBackgroundAsPng } from '@/lib/export-image';
import { formatByteLimit, formatUptimeLimit, sanitizeRouterOSComment } from '@/lib/routeros-utils';
import {
  FileDown,
  Printer,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Move,
  Camera,
  Download,
  Image as ImageIcon,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Cloud,
  Sparkles,
  Tag,
  X
} from 'lucide-react';

interface CardStudioProps {
  tenant: Tenant;
  profiles: Profile[];
  templates: CardTemplate[];
  onBatchSaved: (batch: CardBatch, cards: Card[]) => Promise<any> | void;
  onUpdateProfiles?: (profiles: Profile[]) => void;
  onSaveTemplate?: (template: CardTemplate) => Promise<any> | void;
  onDeleteTemplate?: (templateId: string) => Promise<any> | void;
}

export const CardStudio: React.FC<CardStudioProps> = ({
  tenant,
  profiles,
  templates: initialTemplates,
  onBatchSaved,
  onUpdateProfiles,
  onSaveTemplate,
  onDeleteTemplate
}) => {
  // Generator State
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(24);
  const [prefix, setPrefix] = useState<string>('');
  const [codeLength, setCodeLength] = useState<number>(6);
  const [codeCharSet, setCodeCharSet] = useState<CodeCharSet>('digits_only');
  const [passwordType, setPasswordType] = useState<'same_as_username' | 'separate_pin' | 'no_password'>('same_as_username');

  // Local storage cache key for instant recovery
  const LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY = `netflow_custom_templates_${tenant.id}`;

  // Template State
  const [templates, setTemplates] = useState<CardTemplate[]>(initialTemplates || DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl_cyber_neon_svg');
  const currentTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
  }, [templates, selectedTemplateId]);

  // Saved Template Naming Modal State
  const [isNamingModalOpen, setIsNamingModalOpen] = useState<boolean>(false);
  const [customTemplateName, setCustomTemplateName] = useState<string>('');
  const [templateLinkedProfileId, setTemplateLinkedProfileId] = useState<string>('');
  const [saveAsMode, setSaveAsMode] = useState<'new' | 'update'>('new');
  const [isSavingCustomTemplate, setIsSavingCustomTemplate] = useState<boolean>(false);

  // AI Template Generator State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiStylePreset] = useState<string>('modern_dark');
  const [isGeneratingAiTemplate, setIsGeneratingAiTemplate] = useState<boolean>(false);
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Image Export State
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [showImageExportDropdown, setShowImageExportDropdown] = useState<boolean>(false);

  // Firestore Save Template State
  const [isSavingToFirestore, setIsSavingToFirestore] = useState<boolean>(false);
  const [isSavedInFirestore, setIsSavedInFirestore] = useState<boolean>(false);

  // Instant load from localStorage cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY);
      if (cached) {
        const parsed: CardTemplate[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newOnes = parsed.filter(t => !existingIds.has(t.id));
            return [...newOnes, ...prev];
          });
        }
      }
    } catch (e) {
      console.warn('Could not read cached templates from localStorage', e);
    }
  }, [tenant.id]);

  // Load custom templates from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    loadTemplatesFromFirestore(tenant.id).then(savedTpls => {
      if (isMounted && savedTpls.length > 0) {
        setTemplates(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newOnes = savedTpls.filter(t => !existingIds.has(t.id));
          const merged = [...newOnes, ...prev];
          try {
            const customs = merged.filter(t => t.isCustom || t.savedByUser);
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(customs));
          } catch (e) {}
          return merged;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [tenant.id]);

  // Auto-switch to the template linked to this profile if available
  useEffect(() => {
    if (!selectedProfileId) return;
    const linkedTpl = templates.find(t => t.linkedProfileId === selectedProfileId);
    if (linkedTpl && linkedTpl.id !== selectedTemplateId) {
      setSelectedTemplateId(linkedTpl.id);
      setIsSavedInFirestore(true);
      const prof = profiles.find(p => p.id === selectedProfileId);
      setSuccessMessage(`تم تفعيل القالب المعتمد تلقائياً: "${linkedTpl.name}" لباقة ${prof?.name || ''}`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  }, [selectedProfileId, templates]);

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

  // Open Save & Naming Modal
  const handleOpenSaveModal = (mode: 'new' | 'update' = 'new') => {
    setSaveAsMode(mode);
    if (mode === 'update' && currentTemplate.isCustom) {
      setCustomTemplateName(currentTemplate.name);
      setTemplateLinkedProfileId(currentTemplate.linkedProfileId || selectedProfileId || '');
    } else {
      // Auto-suggest name based on selected profile
      const prof = profiles.find(p => p.id === selectedProfileId);
      const suggested = prof
        ? (prof.price ? `قالب كرت أبو ${prof.price}` : `قالب باقة ${prof.name}`)
        : `قالب كرت مخصص ${templates.filter(t => t.isCustom).length + 1}`;
      setCustomTemplateName(suggested);
      setTemplateLinkedProfileId(selectedProfileId || '');
    }
    setIsNamingModalOpen(true);
  };

  // Save Custom Named Template to Cloud and Local Cache
  const handleSaveCustomNamedTemplate = async () => {
    const trimmedName = customTemplateName.trim();
    if (!trimmedName) {
      alert('يرجى إدخال اسم للقالب أولاً (مثال: قالب كرت أبو 200)');
      return;
    }

    setIsSavingCustomTemplate(true);
    try {
      const isUpdating = saveAsMode === 'update' && currentTemplate.isCustom;
      const tplId = isUpdating
        ? currentTemplate.id
        : `tpl_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const linkedProf = profiles.find(p => p.id === templateLinkedProfileId);

      const templateToSave: CardTemplate = {
        ...currentTemplate,
        id: tplId,
        name: trimmedName,
        isCustom: true,
        savedByUser: true,
        linkedProfileId: templateLinkedProfileId || undefined,
        linkedProfileName: linkedProf?.name || undefined,
        updatedAt: new Date().toISOString(),
        createdAt: isUpdating ? (currentTemplate.createdAt || new Date().toISOString()) : new Date().toISOString()
      };

      // 1. Update local state
      setTemplates(prev => {
        const next = [templateToSave, ...prev.filter(t => t.id !== tplId)];
        try {
          const customs = next.filter(t => t.isCustom || t.savedByUser);
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(customs));
        } catch (err) {}
        return next;
      });

      setSelectedTemplateId(tplId);
      setIsSavedInFirestore(true);

      // 2. Persist to Firestore
      const res = await saveTemplateToFirestore(tenant.id, templateToSave);
      if (!res.success) {
        console.warn('Firestore template save warning:', res.error);
      }

      // 3. Notify parent if handler passed
      if (onSaveTemplate) {
        await onSaveTemplate(templateToSave);
      }

      setIsNamingModalOpen(false);
      setSuccessMessage(`تم حفظ القالب بنجاح باسم "${trimmedName}" ومزامنته سحابياً!`);
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Error saving custom template:', err);
      alert(err?.message || 'حدث خطأ أثناء حفظ القالب');
    } finally {
      setIsSavingCustomTemplate(false);
    }
  };

  // Delete Custom Template from Cloud
  const handleDeleteCustomTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف القالب "${templateName}" من السحابة؟`)) {
      return;
    }

    try {
      // 1. Local state update
      setTemplates(prev => {
        const next = prev.filter(t => t.id !== templateId);
        try {
          const customs = next.filter(t => t.isCustom || t.savedByUser);
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(customs));
        } catch (e) {}
        return next;
      });

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
      }

      // 2. Delete from Firestore
      await deleteTemplateFromFirestore(tenant.id, templateId);

      // 3. Notify parent
      if (onDeleteTemplate) {
        await onDeleteTemplate(templateId);
      }

      setSuccessMessage(`تم حذف القالب "${templateName}" بنجاح.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error deleting custom template:', err);
      alert('فشل حذف القالب');
    }
  };

  // View state
  const [scriptFlavor, setScriptFlavor] = useState<'hotspot_v7' | 'hotspot_v6' | 'userman_v7' | 'userman_v6'>('hotspot_v7');
  const [previewMode, setPreviewMode] = useState<'a4' | 'single' | 'designer'>('a4');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);
  const [batchSaveError, setBatchSaveError] = useState<string | null>(null);
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

  // Export Card Sample as Image (PNG 300 DPI)
  const handleExportCardAsImage = async () => {
    setIsExportingImage(true);
    setShowImageExportDropdown(false);
    try {
      const cleanName = (currentTemplate.name || 'Card').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
      const success = await exportCardElementAsPng('main-card-preview-container', `NetFlow_${cleanName}_Card.png`, 3);
      if (success) {
        setSuccessMessage('تم حفظ الكرت كصورة عالية الدقة (300 DPI) على جهازك بنجاح!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to export card image:', err);
      alert('حدث خطأ أثناء حفظ الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Export Template Blank Background as Image (for print houses)
  const handleExportBackgroundAsImage = async () => {
    setIsExportingImage(true);
    setShowImageExportDropdown(false);
    try {
      const cleanName = (currentTemplate.name || 'Template').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
      const success = await exportTemplateBackgroundAsPng(currentTemplate, `NetFlow_${cleanName}_Blank_Background.png`);
      if (success) {
        setSuccessMessage('تم حفظ خلفية القالب كصورة فارغة للمطابع بدقة فائقة على جهازك بنجاح!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to export background image:', err);
      alert('حدث خطأ أثناء حفظ خلفية القالب.');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Save batch into Inventory & Cloud Firestore with Pending status for MikroTik API sync
  const handleSaveToInventory = async () => {
    if (!previewBatchData.batch || isSavingBatch) return;
    setIsSavingBatch(true);
    setBatchSaveError(null);
    setSuccessMessage(null);

    try {
      const activeRouterToken = tenant.settings?.syncToken || 'sam_sec_89df24a67e12c4';
      const batchId = previewBatchData.batch.id;
      const batchNumber = previewBatchData.batch.batchNumber;

      // Transform cards to include required MikroTik sync properties:
      // { username, password, profile: 'default', limitBytesTotal, limitUptime, comment }
      const formattedCards = previewBatchData.cards.map(c => {
        const uName = c.code;
        const pwd = c.password || c.code;
        const prof = selectedProfile?.name || c.profileName || 'default';
        const bLimit = formatByteLimit(selectedProfile?.byteLimit || c.byteDisplay);
        const uLimit = formatUptimeLimit(selectedProfile?.uptimeLimit || c.uptimeDisplay);
        const comment = sanitizeRouterOSComment(`NetFlow_${batchNumber}_${c.price || 0}`);

        return {
          ...c,
          username: uName,
          password: pwd,
          profile: prof,
          limitBytesTotal: bLimit,
          limitUptime: uLimit,
          comment: comment
        };
      });

      const batchToSave: CardBatch = {
        ...previewBatchData.batch,
        id: batchId,
        batchId: batchId,
        tenantId: tenant.id,
        routerToken: activeRouterToken,
        status: 'pending',
        synced: false,
        cards: formattedCards,
        createdAt: new Date().toISOString()
      };

      // Call onBatchSaved and await the Promise to resolve completely before showing success
      await onBatchSaved(batchToSave, previewBatchData.cards);

      // Explicit success feedback ONLY after the Firestore write promise resolves
      setSuccessMessage(`تم حفظ الدفعة (${batchNumber}) بعدد ${quantity} كرت بنجاح في قاعدة بيانات Firestore والمخزن العام! حالة الدفعة الآن: معلقة للمزامنة (Pending) وبانتظار سحبها عبر توكن المايكروتك.`);
      setTimeout(() => setSuccessMessage(null), 7000);
    } catch (err: any) {
      console.error('Error saving batch to Firestore:', err);
      setBatchSaveError(err?.message || 'فشل حفظ الدفعة في قاعدة البيانات السحابية. يرجى التأكد من الاتصال والمحاولة مجدداً.');
      setTimeout(() => setBatchSaveError(null), 7000);
    } finally {
      setIsSavingBatch(false);
    }
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
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">
                توليد وطباعة الكروت، وتخصيص قوالب الباقات وحفظها سحابياً لمزامنتها في أي وقت.
              </p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs">
                <span className="text-slate-400">القالب النشط:</span>
                <strong className="text-amber-300 font-bold">{currentTemplate.name}</strong>
                {currentTemplate.isCustom && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    💎 سحابي
                  </span>
                )}
                {currentTemplate.linkedProfileName && (
                  <span className="text-[10px] text-sky-300 bg-sky-950 border border-sky-800 px-1.5 py-0.2 rounded-full font-mono">
                    باقة: {currentTemplate.linkedProfileName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Save Template Modal Trigger */}
            <button
              id="topbar-save-template-btn"
              type="button"
              onClick={() => handleOpenSaveModal(currentTemplate.isCustom ? 'update' : 'new')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-950/30 transition transform active:scale-95 text-sm cursor-pointer"
              title="تسمية وحفظ هذا القالب للباقة وتخزينه سحابياً"
            >
              <BookmarkPlus className="w-4 h-4 text-slate-950" />
              <span>{currentTemplate.isCustom ? 'تحديث / حفظ باسم' : 'حفظ وتسمية القالب'}</span>
            </button>

            <button
              id="save-batch-btn"
              onClick={handleSaveToInventory}
              disabled={isSavingBatch}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition transform active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isSavingBatch ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isSavingBatch ? 'جاري الحفظ في السحابة...' : 'حفظ الدفعة في المخزن'}</span>
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

            {/* Save As Image Dropdown */}
            <div className="relative">
              <button
                id="save-image-dropdown-btn"
                type="button"
                onClick={() => setShowImageExportDropdown(!showImageExportDropdown)}
                disabled={isExportingImage}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-950/40 transition transform active:scale-95 text-sm"
                title="حفظ القالب أو الكرت كصورة عالية الدقة PNG على جهازك"
              >
                {isExportingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Camera className="w-4 h-4 text-indigo-200" />
                )}
                <span>حفظ كصورة 🖼️</span>
              </button>

              {showImageExportDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                  <button
                    type="button"
                    onClick={handleExportCardAsImage}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-right flex items-center gap-2.5 transition text-xs text-slate-200 font-bold"
                  >
                    <Camera className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div>حفظ كرت العينة كصورة (PNG)</div>
                      <div className="text-[10px] text-slate-400 font-normal">كرت كامل بالبيانات والكود 300 DPI</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBackgroundAsImage}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-right flex items-center gap-2.5 transition text-xs text-slate-200 font-bold"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>حفظ خلفية القالب فارغة (PNG)</div>
                      <div className="text-[10px] text-slate-400 font-normal">خلفية بدون بيانات مناسبة للمطابع</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
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

        {/* Batch Save Error Alert */}
        {batchSaveError && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{batchSaveError}</span>
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
            onOpenSaveModal={handleOpenSaveModal}
            onDeleteCustomTemplate={handleDeleteCustomTemplate}
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
            onExportCardImage={handleExportCardAsImage}
            onExportBackgroundImage={handleExportBackgroundAsImage}
            isExportingImage={isExportingImage}
          />
        </div>

        {/* Right Column: Live Interactive Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Mode Switcher & Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">المعاينة الحية للكروت</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
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

              <div className="h-4 w-px bg-slate-800 mx-0.5" />

              <button
                type="button"
                id="preview-quick-export-img-btn"
                onClick={handleExportCardAsImage}
                disabled={isExportingImage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 transition disabled:opacity-50"
                title="تنزيل الكرت كصورة PNG عالية الدقة"
              >
                {isExportingImage ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>حفظ كصورة</span>
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
                <div id="main-card-preview-container" className="flex justify-center w-full">
                  <CardPreview
                    id="main-card-preview-element"
                    card={activeCards[0]}
                    template={currentTemplate}
                    tenant={tenant}
                    isZoomed={true}
                  />
                </div>
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

          {/* Offscreen element for reliable image export even when preview is in A4 or Designer mode */}
          {activeCards[0] && (
            <div
              id="offscreen-card-export-target"
              style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '380px', pointerEvents: 'none' }}
              aria-hidden="true"
            >
              <CardPreview
                card={activeCards[0]}
                template={currentTemplate}
                tenant={tenant}
                isZoomed={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal for Naming and Saving Custom Template to Cloud */}
      {isNamingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-right"
            dir="rtl"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600/20 via-slate-800 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    حفظ وتسمية قالب الكرت (مزامنة سحابية)
                  </h3>
                  <p className="text-xs text-slate-400">
                    احفظ التنسيق والألوان بالاسم الذي تريده لترجع له بنقرة واحدة في أي وقت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNamingModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* If updating existing custom template, offer choice */}
              {currentTemplate.isCustom && (
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveAsMode('update');
                      setCustomTemplateName(currentTemplate.name);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold transition cursor-pointer ${
                      saveAsMode === 'update'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    تحديث القالب الحالي ("{currentTemplate.name}")
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveAsMode('new');
                      setCustomTemplateName(`${currentTemplate.name} (نسخة)`);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold transition cursor-pointer ${
                      saveAsMode === 'new'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    حفظ كقالب جديد باسم مختلف
                  </button>
                </div>
              )}

              {/* Template Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>اسم القالب المميز:</span>
                  <span className="text-[11px] text-amber-400 font-normal">مثال: قالب كرت أبو 200</span>
                </label>
                <input
                  type="text"
                  id="custom-template-name-input"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  placeholder="مثال: قالب كرت أبو 200 أو قالب VIP سرعة عالية..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition"
                  autoFocus
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">اقتراحات سريعة للأسماء:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile && (
                    <button
                      type="button"
                      onClick={() => setCustomTemplateName(`قالب كرت باقة ${selectedProfile.name}`)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition cursor-pointer"
                    >
                      قالب كرت باقة {selectedProfile.name}
                    </button>
                  )}
                  {selectedProfile?.price && (
                    <button
                      type="button"
                      onClick={() => setCustomTemplateName(`قالب كرت أبو ${selectedProfile.price}`)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                    >
                      قالب كرت أبو {selectedProfile.price}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCustomTemplateName('قالب كرت VIP فايبر')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    قالب كرت VIP فايبر
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTemplateName('قالب كرت سهرة موفر')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    قالب كرت سهرة موفر
                  </button>
                </div>
              </div>

              {/* Link with Profile / Package (Optional) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>ربط القالب بباقة معينة (مزامنة تلقائية):</span>
                  <span className="text-[10px] text-slate-400">سيتم تفعيله فور اختيار هذه الباقة</span>
                </label>
                <select
                  value={templateLinkedProfileId}
                  onChange={(e) => setTemplateLinkedProfileId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition font-sans"
                >
                  <option value="">-- قالب عام (متاح لكل الباقات) --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      ربط بباقة: {p.name} (سعر {p.price} {tenant.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Template Specs Preview */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>توزيع الورقة:</span>
                  <span className="font-mono text-amber-400">
                    {currentTemplate.cardsPerRow} × {currentTemplate.cardsPerCol} = {currentTemplate.cardsPerRow * currentTemplate.cardsPerCol} كرت في صفحة A4
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>نوع الرمز:</span>
                  <span className="text-sky-300">
                    {currentTemplate.qrType === 'both' ? 'باركود وQR كود' : currentTemplate.qrType === 'qr_only' ? 'QR كود سريع' : 'باركود شريطي'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>حالة التخزين:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>تخزين سحابي مباشر ومحلي دائم</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950/90 border-t border-slate-800 p-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNamingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                id="confirm-save-custom-template-btn"
                onClick={handleSaveCustomNamedTemplate}
                disabled={isSavingCustomTemplate || !customTemplateName.trim()}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingCustomTemplate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>جاري الحفظ في السحابة...</span>
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-slate-950" />
                    <span>حفظ القالب سحابياً الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

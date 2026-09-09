'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardBatch, Profile, Tenant, CardTemplate } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { generateCardsPdf } from '@/lib/pdf-generator';
import { generateRouterOSTerminalScript, chunkCards, reconcileCardsWithRouter } from '@/lib/mikrotik-helpers';
import { DEFAULT_TEMPLATES } from '@/lib/store';
import { copyTextToClipboard, downloadTextFile } from '@/lib/utils';
import {
  Layers,
  Search,
  Filter,
  FileDown,
  Printer,
  Terminal,
  CreditCard,
  Building2,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  QrCode,
  Tag,
  ShieldCheck,
  CheckCircle2,
  CircleDot,
  Copy,
  AlertCircle,
  FileCode,
  Download,
  AlertTriangle,
  HelpCircle,
  CheckSquare,
  ShieldAlert,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  SplitSquareVertical,
  Check
} from 'lucide-react';

interface InventoryManagerProps {
  tenant: Tenant;
  batches: CardBatch[];
  cards: Card[];
  profiles: Profile[];
  templates: CardTemplate[];
  onDeleteBatch: (batchId: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  tenant,
  batches,
  cards,
  profiles,
  templates,
  onDeleteBatch
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'cards'>('batches');
  const [selectedBatchId, setSelectedBatchId] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'distributed' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const [copiedBatchScript, setCopiedBatchScript] = useState<string | null>(null);
  const [isDownloadingRsc, setIsDownloadingRsc] = useState<string | null>(null);
  const [isCopyingScript, setIsCopyingScript] = useState<string | null>(null);
  const [scriptModalData, setScriptModalData] = useState<{
    batch: CardBatch;
    cards: Card[];
    count: number;
  } | null>(null);
  const [scriptViewMode, setScriptViewMode] = useState<'rsc_file' | 'terminal_chunks'>('rsc_file');
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [excludeExpiredToggle, setExcludeExpiredToggle] = useState<boolean>(true);
  const [copiedChunkIndex, setCopiedChunkIndex] = useState<number | null>(null);
  const [copiedImportCommand, setCopiedImportCommand] = useState<boolean>(false);

  // Reconcile / Audit with MikroTik State
  const [reconcileModalData, setReconcileModalData] = useState<{
    batch: CardBatch;
    cards: Card[];
  } | null>(null);
  const [reconcileFilterMode, setReconcileFilterMode] = useState<'batch' | 'in_router_script' | 'profile' | 'all'>('batch');
  const [reconcileInput, setReconcileInput] = useState<string>('');
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconcileResult, setReconcileResult] = useState<{
    foundCodes: string[];
    missingCards: Card[];
    totalChecked: number;
  } | null>(null);
  const [copiedMissingScript, setCopiedMissingScript] = useState<boolean>(false);

  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Helper function to reliably match a card to its batch across all ID formats
  const matchCardToBatch = (c: Card, batch: CardBatch): boolean => {
    if (!c || !batch) return false;

    const bId = String(batch.id || '').trim();
    const bBatchId = String(batch.batchId || '').trim();
    const bNum = String(batch.batchNumber || '').trim();
    const bNumClean = bNum.replace(/^B-?/i, '').trim();

    const cBatchId = String(c.batchId || '').trim();
    const cBatchNum = String(c.batchNumber || '').trim();
    const cBatchNumClean = cBatchNum.replace(/^B-?/i, '').trim();
    const cId = String(c.id || '').trim();

    // 1. Direct ID matches
    if (bId && (cBatchId === bId || cBatchNum === bId)) return true;
    if (bBatchId && (cBatchId === bBatchId || cBatchNum === bBatchId)) return true;

    // 2. Batch number match (case-insensitive)
    if (bNum) {
      const bNumLower = bNum.toLowerCase();
      if (
        cBatchNum.toLowerCase() === bNumLower ||
        cBatchId.toLowerCase() === bNumLower ||
        cBatchId.toLowerCase() === `batch_${bNumLower}` ||
        cBatchId.toLowerCase() === `batch_${bId.toLowerCase()}`
      ) {
        return true;
      }
    }

    // 3. Clean numeric match (e.g. 714 in B-714)
    if (bNumClean && bNumClean.length >= 2) {
      if (cBatchNumClean === bNumClean || cBatchId.includes(bNumClean) || cId.includes(bNumClean)) {
        return true;
      }
    }

    // 4. Card ID prefix matching
    if (bId && cId.startsWith(`card_${bId}_`)) return true;
    if (bNum && cId.includes(`_${bNum}_`)) return true;

    return false;
  };

  // Synchronous, zero-latency card resolver to preserve browser user gestures (clipboard & download)
  const resolveBatchCardsSync = (batch: CardBatch): Card[] => {
    // Tier 1: Search in loaded memory cards array
    const matched = cards.filter(c => matchCardToBatch(c, batch));
    if (matched.length > 0) {
      return matched;
    }

    // Tier 2: Check embedded cards within the batch object
    if (batch.cards && Array.isArray(batch.cards) && batch.cards.length > 0) {
      return (batch.cards as any[]).map((c, i) => ({
        id: c.id || `card_${batch.id}_${i}`,
        tenantId: batch.tenantId || tenant.id || 'tenant_main_01',
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        code: c.code || c.username || c.id || `c_${batch.batchNumber}_${i + 1}`,
        password: c.password !== undefined && c.password !== '' ? c.password : (c.username || c.code || ''),
        profileId: batch.profileId || '',
        profileName: c.profile || batch.profileName || 'default',
        rateLimit: c.rateLimit || '',
        uptimeDisplay: c.uptimeDisplay || c.limitUptime || '',
        byteDisplay: c.byteDisplay || c.limitBytesTotal || '',
        price: c.price || batch.unitPrice || 0,
        wholesalePrice: c.wholesalePrice || batch.wholesalePrice || 0,
        status: c.status || 'in_stock',
        qrData: c.qrData || '',
        createdAt: c.createdAt || batch.generatedAt || new Date().toISOString(),
        syncedToRouter: Boolean(c.syncedToRouter)
      }));
    }

    // Tier 3: Deterministic fallback reconstruction based on batch metadata (Instant 0ms)
    const count = batch.quantity || batch.totalCards || 1;
    const prefix = batch.prefix || '';
    const codeLen = batch.codeLength || 6;
    const fallbackCards: Card[] = [];
    for (let i = 1; i <= count; i++) {
      const numPart = String(i).padStart(Math.max(codeLen - prefix.length, 3), '0');
      const code = `${prefix}${numPart}`;
      fallbackCards.push({
        id: `card_${batch.id}_${i}`,
        tenantId: batch.tenantId || tenant.id || 'tenant_main_01',
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        code: code,
        password: batch.passwordType === 'same_as_username' ? code : code,
        profileId: batch.profileId || '',
        profileName: batch.profileName || 'default',
        rateLimit: '',
        uptimeDisplay: '',
        byteDisplay: '',
        price: batch.unitPrice || 0,
        wholesalePrice: batch.wholesalePrice || 0,
        status: 'in_stock',
        qrData: code,
        createdAt: batch.generatedAt || new Date().toISOString(),
        syncedToRouter: false
      });
    }
    return fallbackCards;
  };

  // Filtered Cards with resilient null checks
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (selectedBatchId !== 'all') {
        const selBatch = batches.find(b => b.id === selectedBatchId || b.batchNumber === selectedBatchId);
        if (selBatch) {
          if (!matchCardToBatch(c, selBatch)) return false;
        } else if (c.batchId !== selectedBatchId && c.batchNumber !== selectedBatchId) {
          return false;
        }
      }
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = c.code ? String(c.code).toLowerCase().includes(q) : false;
        const matchBatch = c.batchNumber ? String(c.batchNumber).toLowerCase().includes(q) : false;
        const matchAgent = c.assignedToAgentName ? String(c.assignedToAgentName).toLowerCase().includes(q) : false;
        const matchProfile = c.profileName ? String(c.profileName).toLowerCase().includes(q) : false;
        return matchCode || matchBatch || matchAgent || matchProfile;
      }
      return true;
    });
  }, [cards, batches, selectedBatchId, statusFilter, searchQuery]);

  // Handle Export Batch PDF
  const handleExportBatchPdf = async (batch: CardBatch) => {
    setIsExportingPdf(batch.id);
    try {
      const batchCards = resolveBatchCardsSync(batch);
      const tpl = templates.find(t => t.id === batch.templateId) || templates[0] || DEFAULT_TEMPLATES[0];
      const blob = await generateCardsPdf(batchCards, tpl, tenant);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NetFlow_Batch_${batch.batchNumber || batch.id}_${batchCards.length}cards.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastNotification({
        message: `تم تنزيل ملف PDF للدفعة (${batch.batchNumber}) بنجاح!`,
        type: 'success'
      });
      setTimeout(() => setToastNotification(null), 4000);
    } catch (e: any) {
      console.error('Export PDF error:', e);
      setToastNotification({
        message: `حدث خطأ أثناء إنشاء ملف PDF: ${e?.message || 'يرجى المحاولة مجدداً'}`,
        type: 'error'
      });
      setTimeout(() => setToastNotification(null), 5000);
    } finally {
      setIsExportingPdf(null);
    }
  };

  // Copy MikroTik script for specific batch (executed directly within user interaction)
  const handleCopyBatchScript = async (batch: CardBatch) => {
    setIsCopyingScript(batch.id);
    try {
      const batchCards = resolveBatchCardsSync(batch);
      const script = generateRouterOSTerminalScript(batchCards, batch.profileName);
      const success = await copyTextToClipboard(script);
      if (success) {
        setCopiedBatchScript(batch.id);
        setToastNotification({
          message: `تم نسخ سكربت المايكروتك للدفعة (${batch.batchNumber}) بنجاح! جاهز للصق في تيرمينال الراوتر (${batchCards.length} كرت).`,
          type: 'success'
        });
        setTimeout(() => {
          setCopiedBatchScript(null);
          setToastNotification(null);
        }, 4000);
      } else {
        setScriptModalData({
          batch,
          script,
          count: batchCards.length
        });
        setToastNotification({
          message: 'تم فتح نافذة الأوامر لنسخ السكربت يدوياً.',
          type: 'warning'
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    } catch (err: any) {
      console.error('Copy script error:', err);
      const batchCards = resolveBatchCardsSync(batch);
      const script = generateRouterOSTerminalScript(batchCards, batch.profileName);
      setScriptModalData({
        batch,
        script,
        count: batchCards.length
      });
    } finally {
      setIsCopyingScript(null);
    }
  };

  // Download .rsc script file for specific batch (immediate download, no blocking)
  const handleDownloadBatchRsc = (batch: CardBatch) => {
    setIsDownloadingRsc(batch.id);
    try {
      const batchCards = resolveBatchCardsSync(batch);
      const script = generateRouterOSTerminalScript(batchCards, batch.profileName);
      const fileName = `mikrotik_batch_${batch.batchNumber || batch.id}_${batchCards.length}cards.rsc`;
      const ok = downloadTextFile(fileName, script);

      if (ok) {
        setToastNotification({
          message: `تم تنزيل ملف أوامر المايكروتك (${fileName}) بنجاح! لعدد ${batchCards.length} كرت.`,
          type: 'success'
        });
        setTimeout(() => setToastNotification(null), 3500);
      } else {
        setScriptModalData({
          batch,
          cards: batchCards,
          count: batchCards.length
        });
        setToastNotification({
          message: 'تم فتح نافذة أوامر المايكروتك نظراً لقيام المتصفح بحظر التنزيل التلقائي.',
          type: 'warning'
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    } catch (err) {
      console.error('Download RSC error:', err);
      const batchCards = resolveBatchCardsSync(batch);
      setScriptModalData({
        batch,
        cards: batchCards,
        count: batchCards.length
      });
    } finally {
      setIsDownloadingRsc(null);
    }
  };

  // Open interactive script viewer modal
  const handleOpenScriptModal = (batch: CardBatch) => {
    const batchCards = resolveBatchCardsSync(batch);
    setScriptModalData({
      batch,
      cards: batchCards,
      count: batchCards.length
    });
    // For large batches (over 60 cards), default to safe RSC file import view
    setScriptViewMode(batchCards.length > 60 ? 'rsc_file' : 'terminal_chunks');
    setActiveChunkIndex(0);
    setCopiedChunkIndex(null);
    setCopiedImportCommand(false);
  };

  // Open live MikroTik cards audit and reconciler modal
  const handleOpenReconcileModal = (batch: CardBatch) => {
    const batchCards = resolveBatchCardsSync(batch);
    setReconcileModalData({
      batch,
      cards: batchCards
    });
    setReconcileFilterMode('batch');
    setReconcileInput('');
    setReconcileResult(null);
    setCopiedMissingScript(false);
  };

  // Execute reconciliation between batch cards and MikroTik output
  const handleRunReconciliation = () => {
    if (!reconcileModalData || !reconcileInput.trim()) {
      setToastNotification({
        message: 'يرجى لصق ناتج استعلام مستخدمي المايكروتك أولاً لإجراء الفحص.',
        type: 'warning'
      });
      setTimeout(() => setToastNotification(null), 4000);
      return;
    }

    setIsReconciling(true);
    try {
      const result = reconcileCardsWithRouter(reconcileModalData.cards, reconcileInput);
      setReconcileResult(result as any);
      if (result.missingCards.length === 0) {
        setToastNotification({
          message: 'رائع جداً! كافة كروت الدفعة موجودة ومطابقة 100% في راوتر المايكروتك.',
          type: 'success'
        });
      } else {
        setToastNotification({
          message: `تم اكتشاف ${result.missingCards.length} كرت مفقود في المايكروتك! يمكنك الآن نسخ سكربت الكروت المفقودة فقط.`,
          type: 'warning'
        });
      }
      setTimeout(() => setToastNotification(null), 5000);
    } catch (e: any) {
      console.error('Reconciliation error:', e);
      setToastNotification({
        message: 'حدث خطأ أثناء فحص ومطابقة الكروت.',
        type: 'error'
      });
      setTimeout(() => setToastNotification(null), 4000);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fade-in shadow-lg ${
            toastNotification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : toastNotification.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastNotification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastNotification.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toastNotification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span className="font-medium">{toastNotification.message}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-sky-400" />
            المخزن العام وإدارة دفعات الكروت
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            متابعة الدفعات المولدة، رصيد الكروت الجاهزة، وأرشيف الكروت الموزعة.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            id="tab-batches-btn"
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'batches'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            دفعات الكروت ({batches.length})
          </button>
          <button
            id="tab-cards-btn"
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'cards'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مستكشف الكروت الفردية ({cards.length})
          </button>
        </div>
      </div>

      {activeTab === 'batches' ? (
        /* Batches List Table */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-base">سجل الدفعات المولدة والمخزنة</h2>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي الكروت المخزونة: {cards.filter(c => c.status === 'in_stock').length} كرت
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">رقم الدفعة</th>
                  <th className="py-3 px-4">الباقة والسرعة</th>
                  <th className="py-3 px-4">الكمية</th>
                  <th className="py-3 px-4">حالة المخزون</th>
                  <th className="py-3 px-4">قيمة الجملة</th>
                  <th className="py-3 px-4">قيمة التجزئة</th>
                  <th className="py-3 px-4">تاريخ التوليد</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {batches.map(batch => {
                  const bCards = cards.filter(c => c.batchId === batch.id);
                  const inStock = bCards.filter(c => c.status === 'in_stock').length;
                  const distributed = bCards.filter(c => c.status === 'distributed').length;
                  const used = bCards.filter(c => c.status === 'used').length;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {batch.profileName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {batch.quantity} كرت
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-mono font-bold">
                            {inStock} مخزن
                          </span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">
                            {distributed} موزع
                          </span>
                          {used > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                              {used} مستخدم
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(batch.totalWholesaleValue, tenant.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {formatCurrency(batch.totalRetailValue, tenant.currency)}
                      </td>
                      <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(batch.generatedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Re-export PDF */}
                          <button
                            onClick={() => handleExportBatchPdf(batch)}
                            disabled={isExportingPdf === batch.id}
                            title="إعادة تحميل ملف PDF للطباعة"
                            className="p-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 border border-sky-500/30 rounded-lg transition disabled:opacity-50"
                          >
                            {isExportingPdf === batch.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* One-click Copy MikroTik Script */}
                          <button
                            onClick={() => handleCopyBatchScript(batch)}
                            disabled={isCopyingScript === batch.id}
                            title={copiedBatchScript === batch.id ? "تم نسخ السكربت بنجاح!" : "نسخ سكريبت المايكروتك لهذه الدفعة"}
                            className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                              copiedBatchScript === batch.id
                                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isCopyingScript === batch.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : copiedBatchScript === batch.id ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-300 hidden xl:inline">منسوخ!</span>
                              </>
                            ) : (
                              <Terminal className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Preview / View Script Modal */}
                          <button
                            onClick={() => handleOpenScriptModal(batch)}
                            title="معاينة وقراءة أوامر المايكروتك للدفعة (مع التجزئة الآمنة)"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg transition"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Audit & Reconcile Cards with MikroTik */}
                          <button
                            onClick={() => handleOpenReconcileModal(batch)}
                            title="فحص ومطابقة كروت الدفعة مع المايكروتك واكتشاف الكروت الناقصة"
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-lg transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Download .rsc file */}
                          <button
                            onClick={() => handleDownloadBatchRsc(batch)}
                            disabled={isDownloadingRsc === batch.id}
                            title="تنزيل ملف أوامر المايكروتك لهذه الدفعة (.rsc)"
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg transition disabled:opacity-50"
                          >
                            {isDownloadingRsc === batch.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* View Cards */}
                          <button
                            onClick={() => {
                              setSelectedBatchId(batch.id);
                              setActiveTab('cards');
                            }}
                            title="استعراض كروت الدفعة"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Batch */}
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الدفعة ${batch.batchNumber} وكروتها من المخزن؟`)) {
                                onDeleteBatch(batch.id);
                              }
                            }}
                            title="حذف الدفعة"
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Individual Cards Explorer Table */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input (5 cols) */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                id="search-cards-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث برمز الكرت، رقم الدفعة، أو اسم البقالة..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Batch Filter (4 cols) */}
            <div className="sm:col-span-4">
              <select
                id="filter-batch-select"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">جميع الدفعات ({batches.length})</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} - {b.profileName} ({b.quantity} كرت)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (3 cols) */}
            <div className="sm:col-span-3">
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="in_stock">في المخزن العام</option>
                <option value="distributed">موزعة للبقالات</option>
                <option value="used">مستخدمة من المشتركين</option>
              </select>
            </div>
          </div>

          {/* Cards Count Banner */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>النتائج المعروضة: <strong className="text-sky-400 font-mono">{filteredCards.length}</strong> كرت</span>
            {selectedBatchId !== 'all' && (
              <button
                onClick={() => setSelectedBatchId('all')}
                className="text-sky-400 hover:underline"
              >
                إلغاء فلتر الدفعة
              </button>
            )}
          </div>

          {/* Cards Table */}
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">كود الكرت (Username)</th>
                  <th className="py-2.5 px-3">كلمة السر (Password)</th>
                  <th className="py-2.5 px-3">الباقة</th>
                  <th className="py-2.5 px-3">السعر</th>
                  <th className="py-2.5 px-3">رقم الدفعة</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3">نقطة البيع / البقالة</th>
                  <th className="py-2.5 px-3">المزامنة مع الراوتر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredCards.slice(0, 100).map(card => (
                  <tr key={card.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                      {card.code}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {card.password || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {(card.profileName || 'افتراضي').split('(')[0]}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {card.price} {tenant.currency}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {card.batchNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      {card.status === 'in_stock' && (
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-bold">
                          في المخزن
                        </span>
                      )}
                      {card.status === 'distributed' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold">
                          عند البقالة
                        </span>
                      )}
                      {card.status === 'used' && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-bold">
                          مستخدم
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {card.assignedToAgentName || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {card.syncedToRouter ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> متزامن
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <CircleDot className="w-3.5 h-3.5 text-amber-400" /> قيد المزامنة
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced MikroTik Script Viewer & Safe Import Modal */}
      {scriptModalData && (() => {
        const rawBatchCards = scriptModalData.cards || [];
        const activeCards = excludeExpiredToggle
          ? rawBatchCards.filter(c => c && c.status !== 'used' && c.status !== 'expired' && c.status !== 'archived')
          : rawBatchCards;
        const expiredCount = rawBatchCards.length - activeCards.length;
        const chunks = chunkCards(activeCards, 50);
        const currentChunk = chunks[activeChunkIndex] || activeCards;
        const fullScript = generateRouterOSTerminalScript(activeCards, scriptModalData.batch.profileName, {
          activeOnly: excludeExpiredToggle,
          safeDeduplication: true
        });
        const currentChunkScript = generateRouterOSTerminalScript(currentChunk, scriptModalData.batch.profileName, {
          activeOnly: excludeExpiredToggle,
          safeDeduplication: true
        });
        const rscFileName = `netflow_${scriptModalData.batch.batchNumber || scriptModalData.batch.id}_${activeCards.length}cards.rsc`;
        const importTerminalCommand = `/import file-name="${rscFileName}"`;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      أوامر المايكروتك للدفعة:
                      <span className="font-mono text-sky-400 font-bold">{scriptModalData.batch.batchNumber}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      إجمالي كروت الدفعة: {rawBatchCards.length} كرت | الكروت الصالحة للرفع: <span className="text-emerald-400 font-bold">{activeCards.length}</span> | البروفايل: {scriptModalData.batch.profileName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScriptModalData(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>

              {/* Safety & Expired Cards Protection Banner */}
              <div className="mt-3 bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>نظام حماية الشبكة النشط:</strong> يمنع إعادة الكروت المنتهية أو المستهلكة للراوتر.
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={excludeExpiredToggle}
                    onChange={e => setExcludeExpiredToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-slate-800 border-slate-700"
                  />
                  <span>استبعاد الكروت المستهلكة/المنتهية ({expiredCount})</span>
                </label>
              </div>

              {/* Import Method Tabs */}
              <div className="mt-4 flex border-b border-slate-800">
                <button
                  onClick={() => setScriptViewMode('rsc_file')}
                  className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                    scriptViewMode === 'rsc_file'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>الطريقة الموصى بها للأعداد الكبيرة (ملف .rsc عبر Files)</span>
                  <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded text-[10px]">
                    الأضمن 100% لـ 300+ كرت
                  </span>
                </button>

                <button
                  onClick={() => setScriptViewMode('terminal_chunks')}
                  className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                    scriptViewMode === 'terminal_chunks'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <SplitSquareVertical className="w-4 h-4" />
                  <span>النسخ المباشر للتيرمينال (مع التجزئة الآمنة)</span>
                  {chunks.length > 1 && (
                    <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                      {chunks.length} أجزاء
                    </span>
                  )}
                </button>
              </div>

              {/* Method 1: RSC File Import View */}
              {scriptViewMode === 'rsc_file' ? (
                <div className="py-4 flex-1 overflow-y-auto space-y-4">
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      لماذا نوصي بملف .rsc عند طباعة أو استيراد 300 كرت؟
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      نافذة <strong>New Terminal</strong> في WinBox تمتلك سعة ذاكرة محدودة (Buffer)، وعند لصق 300 سطر دفعة واحدة تسقط أسطر في المنتصف وتصل الكروت ناقصة.
                      أما استيراد الملف عبر <strong>Files</strong> فهو الطريقة الرسمية من شركة MikroTik، ويقبل <strong>آلاف الكروت دفعة واحدة في ثانية واحدة دون سقوط كرت واحد!</strong>
                    </p>

                    <div className="pt-2 border-t border-emerald-900/60 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-bold text-emerald-400 block mb-1">1. نزّل الملف:</span>
                        اضغط الزر الأخضر لتنزيل ملف ({rscFileName}).
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-bold text-emerald-400 block mb-1">2. ارفعه للراوتر:</span>
                        افتح Winbox، وافتح قائمة <strong>Files</strong> واسحب الملف إليها.
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-bold text-emerald-400 block mb-1">3. نفّذ أمر الاستيراد:</span>
                        في New Terminal الصق الأمر أدناه واضغط Enter.
                      </div>
                    </div>
                  </div>

                  {/* Terminal Import Command Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium">أمر الاستيراد الفوري في New Terminal:</span>
                      <span className="text-emerald-400 text-[11px]">يستورد الـ {activeCards.length} كرت فوراً</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
                      <span className="flex-1 select-all">{importTerminalCommand}</span>
                      <button
                        onClick={async () => {
                          const ok = await copyTextToClipboard(importTerminalCommand);
                          if (ok) {
                            setCopiedImportCommand(true);
                            setTimeout(() => setCopiedImportCommand(false), 3000);
                          }
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 transition shrink-0"
                      >
                        {copiedImportCommand ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الأمر</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Download Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        downloadTextFile(rscFileName, fullScript);
                        setToastNotification({
                          message: `تم تنزيل ملف أوامر المايكروتك ${rscFileName} بنجاح!`,
                          type: 'success'
                        });
                        setTimeout(() => setToastNotification(null), 3500);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                    >
                      <Download className="w-4 h-4" />
                      تنزيل ملف .rsc للدفعة بالكامل ({activeCards.length} كرت)
                    </button>

                    <button
                      onClick={() => handleOpenReconcileModal(scriptModalData.batch)}
                      className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium rounded-xl border border-indigo-500/30 flex items-center gap-2 transition text-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      مطابقة وتأكيد الكروت في الراوتر
                    </button>
                  </div>
                </div>
              ) : (
                /* Method 2: Direct Terminal Chunks View */
                <div className="py-4 flex-1 overflow-hidden flex flex-col space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      لتجنب سقوط الأوامر في التيرمينال، تم تقسيم الكروت إلى أجزاء آمنة (50 كرت/جزء):
                    </span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      محمي ضد التكرار (:do on-error)
                    </span>
                  </div>

                  {/* Chunk Selector Buttons */}
                  {chunks.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {chunks.map((chunk, idx) => {
                        const start = idx * 50 + 1;
                        const end = Math.min((idx + 1) * 50, activeCards.length);
                        const isCopied = copiedChunkIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveChunkIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1.5 border ${
                              activeChunkIndex === idx
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <span>الجزء {idx + 1} ({start}-{end})</span>
                            {isCopied && <Check className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Script Text Area */}
                  <textarea
                    readOnly
                    dir="ltr"
                    value={currentChunkScript}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 leading-relaxed focus:outline-none focus:border-amber-500 select-all resize-none overflow-y-auto"
                    rows={10}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />

                  {/* Chunk Action Bar */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={async () => {
                        const success = await copyTextToClipboard(currentChunkScript);
                        if (success) {
                          setCopiedChunkIndex(activeChunkIndex);
                          setToastNotification({
                            message: `تم نسخ أوامر الجزء ${activeChunkIndex + 1} (${currentChunk.length} كرت) بنجاح!`,
                            type: 'success'
                          });
                          setTimeout(() => {
                            setCopiedChunkIndex(null);
                            setToastNotification(null);
                          }, 3500);
                        }
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition text-xs"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ أوامر الجزء الحالي ({currentChunk.length} كرت)
                    </button>

                    <button
                      onClick={async () => {
                        const success = await copyTextToClipboard(fullScript);
                        if (success) {
                          setToastNotification({
                            message: `تم نسخ كافة أوامر الدفعة (${activeCards.length} كرت) إلى الحافظة!`,
                            type: 'success'
                          });
                          setTimeout(() => setToastNotification(null), 3500);
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl flex items-center gap-2 border border-slate-700 transition text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      نسخ جميع الكروت دفعة واحدة
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => setScriptModalData(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium rounded-xl transition text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Live MikroTik Cards Audit & Reconciler Modal */}
      {reconcileModalData && (() => {
        const batchNum = reconcileModalData.batch.batchNumber || reconcileModalData.batch.id || '';
        const cleanBatchNum = batchNum.replace(/^B-?/i, '').trim();
        const profileName = reconcileModalData.batch.profileName || 'default';

        // 1. Specific command by batch comment (excludes all other router users):
        const batchSpecificCmd = `/ip hotspot user print terse where comment~"${cleanBatchNum || batchNum}"`;

        // 2. Specific command by profile:
        const profileSpecificCmd = `/ip hotspot user print terse where profile="${profileName}"`;

        // 3. All router users command:
        const allUsersCmd = `/ip hotspot user print terse`;

        // 4. In-router live self-audit diagnostic script (checks batch users directly inside RouterOS):
        const batchCodes = reconcileModalData.cards.map(c => c.code || c.username).filter(Boolean);
        const inRouterScript = `:local tot ${batchCodes.length}; :local miss 0; :foreach u in={${batchCodes.map(c => `"${c}"`).join(',')}} do={ :if ([:len [/ip hotspot user find name=$u]] = 0) do={ :set miss ($miss + 1); :put ("MISSING: " . $u) } }; :if ($miss = 0) do={ :put ("SUCCESS: All " . $tot . " cards exist in MikroTik!") } else={ :put ("ALERT: " . $miss . " cards are MISSING!") };`;

        let activeCommandToRun = batchSpecificCmd;
        if (reconcileFilterMode === 'profile') activeCommandToRun = profileSpecificCmd;
        else if (reconcileFilterMode === 'in_router_script') activeCommandToRun = inRouterScript;
        else if (reconcileFilterMode === 'all') activeCommandToRun = allUsersCmd;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] animate-scale-up space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      أداة فحص ومطابقة كروت الدفعة:
                      <span className="font-mono text-sky-400 font-bold">{batchNum}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      مطابقة دقيقة ومخصصة لكروت الدفعة فقط لعزل أي نقص واستخراج سكربت الكروت المفقودة.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReconcileModalData(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>

              {/* Filtering Mode Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  اختر طريقة استعلام المايكروتك المرغوبة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setReconcileFilterMode('batch')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1 border text-right ${
                      reconcileFilterMode === 'batch'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>فلترة برقم الدفعة</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      يجلب كروت {batchNum} فقط ويستبعد البقية
                    </span>
                  </button>

                  <button
                    onClick={() => setReconcileFilterMode('in_router_script')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1 border text-right ${
                      reconcileFilterMode === 'in_router_script'
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span>فحص فوري داخل الراوتر</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      المايكروتك يفحص الدفعة ويطبع النتيجة
                    </span>
                  </button>

                  <button
                    onClick={() => setReconcileFilterMode('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-start gap-1 border text-right col-span-2 sm:col-span-1 ${
                      reconcileFilterMode === 'all'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <CircleDot className="w-3.5 h-3.5 text-sky-400" />
                      <span>سرد كافة المستخدمين</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      المنصة تعزل وتفحص {batchNum} فقط
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Step Guide with LTR Code Preview */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span>الخطوة 1: شغّل هذا الأمر في New Terminal بالمايكروتك:</span>
                    {reconcileFilterMode === 'batch' && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        مخصص للدفعة {batchNum} فقط
                      </span>
                    )}
                  </span>
                  <button
                    onClick={async () => {
                      const ok = await copyTextToClipboard(activeCommandToRun);
                      if (ok) {
                        setToastNotification({
                          message: 'تم نسخ أمر المايكروتك إلى الحافظة بنجاح!',
                          type: 'success'
                        });
                        setTimeout(() => setToastNotification(null), 3000);
                      }
                    }}
                    className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded text-[11px] hover:bg-indigo-900 transition flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    نسخ الأمر
                  </button>
                </div>

                {/* Explicit LTR Left-Aligned Code Box */}
                <div
                  dir="ltr"
                  className="bg-slate-900 p-2.5 rounded-lg font-mono text-indigo-300 text-xs text-left select-all overflow-x-auto whitespace-pre-wrap break-all border border-slate-800"
                >
                  {activeCommandToRun}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    {reconcileFilterMode === 'in_router_script'
                      ? 'الخطوة 2: الصق السكربت واضغط Enter، وسيخبرك المايكروتك فوراً هل جميع الكروت موجودة أم مفقودة.'
                      : 'الخطوة 2: انسخ الناتج من شاشة المايكروتك والصقه أدناه، ثم اضغط "بدء فحص ومطابقة الكروت".'}
                  </span>
                  <span className="text-emerald-400/90 font-medium">
                    (تطابق حصري مع كروت الدفعة {batchNum})
                  </span>
                </div>
              </div>

              {/* Input Textarea (Hidden if in-router script is selected, or optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>ألصق هنا ناتج شاشة المايكروتك لمطابقته وفصل الكروت المفقودة:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (حتى لو لُصقت أسماء كل مستخدمي الراوتر، المنصة ستبحث فقط عن كروت {batchNum})
                  </span>
                </label>
                <textarea
                  dir="ltr"
                  value={reconcileInput}
                  onChange={e => setReconcileInput(e.target.value)}
                  placeholder={`0 R name="1001" comment="NetFlow-${cleanBatchNum || 'B-714'}" ...\n1 R name="1002" comment="NetFlow-${cleanBatchNum || 'B-714'}" ...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-24"
                />
              </div>

              {/* Run Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleRunReconciliation}
                  disabled={isReconciling || !reconcileInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-indigo-600/20 transition"
                >
                  {isReconciling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الفحص والمطابقة...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      بدء فحص ومطابقة الكروت الآن
                    </>
                  )}
                </button>

                {reconcileResult && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">إجمالي كروت الدفعة: {reconcileResult.totalChecked}</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      موجود: {reconcileResult.foundCodes.length}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded border ${
                      reconcileResult.missingCards.length === 0
                        ? 'text-slate-400 bg-slate-800 border-slate-700'
                        : 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                    }`}>
                      مفقود: {reconcileResult.missingCards.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Results Display */}
              {reconcileResult && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {reconcileResult.missingCards.length === 0 ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          كافة كروت الدفعة {batchNum} موجودة بنسبة 100% في المايكروتك!
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          تم التأكد من وجود جميع الكروت ({reconcileResult.foundCodes.length} كرت). يمكنك طباعة وتوزيع الكروت بأمان تام واطمئنان.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                          <h4 className="text-sm font-bold text-rose-300">
                            تم اكتشاف {reconcileResult.missingCards.length} كرت مفقود من أصل {reconcileResult.totalChecked} كرت!
                          </h4>
                        </div>
                        <button
                          onClick={async () => {
                            const missingScript = generateRouterOSTerminalScript(
                              reconcileResult.missingCards,
                              reconcileModalData.batch.profileName,
                              { activeOnly: true, safeDeduplication: true }
                            );
                            const ok = await copyTextToClipboard(missingScript);
                            if (ok) {
                              setCopiedMissingScript(true);
                              setToastNotification({
                                message: `تم نسخ أوامر الكروت المفقودة فقط (${reconcileResult.missingCards.length} كرت) بنجاح!`,
                                type: 'success'
                              });
                              setTimeout(() => {
                                setCopiedMissingScript(false);
                                setToastNotification(null);
                              }, 3500);
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedMissingScript ? 'تم النسخ!' : 'نسخ سكربت الكروت المفقودة فقط'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        هذه الميزة تحميك من تكرار الكروت أو إعادة الكروت المنتهية: يمكنك الآن ببساطة نسخ سكربت الكروت المفقودة فقط ولصقه في المايكروتك لإكمال النقص دون أي تأثير على بقية الكروت!
                      </p>

                      {/* Preview of missing codes */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 max-h-24 overflow-y-auto font-mono text-[11px] text-amber-300 flex flex-wrap gap-1.5">
                        {reconcileResult.missingCards.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {c.code || c.username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Close */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setReconcileModalData(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition text-xs font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardBatch, Profile, Tenant, CardTemplate } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { generateCardsPdf } from '@/lib/pdf-generator';
import { generateRouterOSTerminalScript } from '@/lib/store';
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
  CircleDot
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

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (selectedBatchId !== 'all' && c.batchId !== selectedBatchId) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchBatch = c.batchNumber.toLowerCase().includes(q);
        const matchAgent = c.assignedToAgentName?.toLowerCase().includes(q);
        const matchProfile = c.profileName.toLowerCase().includes(q);
        return matchCode || matchBatch || matchAgent || matchProfile;
      }
      return true;
    });
  }, [cards, selectedBatchId, statusFilter, searchQuery]);

  // Handle Export Batch PDF
  const handleExportBatchPdf = async (batch: CardBatch) => {
    const batchCards = cards.filter(c => c.batchId === batch.id);
    if (batchCards.length === 0) return;
    
    setIsExportingPdf(batch.id);
    try {
      const tpl = templates.find(t => t.id === batch.templateId) || templates[0];
      const blob = await generateCardsPdf(batchCards, tpl, tenant);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NetFlow_Batch_${batch.batchNumber}_${batchCards.length}cards.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(null);
    }
  };

  // Copy MikroTik script for specific batch
  const handleCopyBatchScript = (batch: CardBatch) => {
    const batchCards = cards.filter(c => c.batchId === batch.id);
    const script = generateRouterOSTerminalScript(batchCards, batch.profileName);
    navigator.clipboard.writeText(script);
    setCopiedBatchScript(batch.id);
    setTimeout(() => setCopiedBatchScript(null), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleExportBatchPdf(batch)}
                            disabled={isExportingPdf === batch.id}
                            title="إعادة تحميل ملف PDF"
                            className="p-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 border border-sky-500/30 rounded-lg transition"
                          >
                            {isExportingPdf === batch.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleCopyBatchScript(batch)}
                            title="نسخ سكريبت المايكروتك لهذه الدفعة"
                            className="p-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 rounded-lg transition"
                          >
                            {copiedBatchScript === batch.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Terminal className="w-3.5 h-3.5" />
                            )}
                          </button>

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
                      {card.profileName.split('(')[0]}
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
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Card, CardTemplate, Tenant } from '@/types';
import { CardPreview } from './CardPreview';
import { Printer, ZoomIn, ZoomOut, Scissors, Sparkles, Layers } from 'lucide-react';

interface A4SheetPreviewProps {
  cards: Card[];
  template: CardTemplate;
  tenant: Tenant;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
}

export const A4SheetPreview: React.FC<A4SheetPreviewProps> = ({
  cards,
  template,
  tenant,
  currentPage,
  onPageChange,
  scale: initialScale = 1
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(initialScale);
  const cols = template.cardsPerRow || 3;
  const rows = template.cardsPerCol || 8;
  const cardsPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(cards.length / cardsPerPage));

  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCards = cards.slice(startIndex, startIndex + cardsPerPage);

  // Pad remaining empty slots on sheet for realistic preview
  const displayCards: (Card | null)[] = [...currentCards];
  while (displayCards.length < cardsPerPage) {
    if (currentCards.length > 0) {
      const sample = currentCards[0];
      displayCards.push({
        ...sample,
        id: `mock_pad_${displayCards.length}`,
        code: `NW-${882000 + displayCards.length * 13}`
      });
    } else {
      break;
    }
  }

  const gapX = template.gridGapXMm !== undefined ? template.gridGapXMm * 3.78 : 8; // mm to px approx
  const gapY = template.gridGapYMm !== undefined ? template.gridGapYMm * 3.78 : 8;
  const padX = template.marginX !== undefined ? `${template.marginX * 3.78}px` : '20px';
  const padY = template.marginY !== undefined ? `${template.marginY * 3.78}px` : '20px';

  return (
    <div className="flex flex-col items-center gap-4 w-full" dir="rtl">
      {/* Page Navigation & Specs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-3xl px-4 py-2.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 text-xs text-slate-300 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">
            ورقة A4 (210 × 297 مم)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-sky-400 font-mono font-bold">
            {cols} أعمدة × {rows} صفوف ({cardsPerPage} كرت/ورقة)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            أبعاد الكرت: {template.cardWidthMm || 63} × {template.cardHeightMm || 33} مم
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              title="تصغير المعاينة"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              title="تكبير المعاينة"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                id="prev-page-btn"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-200 font-medium transition"
              >
                السابق
              </button>
              <span className="font-mono text-slate-300 text-[11px] px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                id="next-page-btn"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-200 font-medium transition"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="overflow-auto max-w-full p-4 flex justify-center bg-slate-950/60 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div
          id="a4-sheet-render-area"
          style={{
            width: '794px', // Standard 96DPI A4 width
            minHeight: '1123px', // Standard 96DPI A4 height
            backgroundColor: '#ffffff',
            paddingLeft: padX,
            paddingRight: padX,
            paddingTop: padY,
            paddingBottom: padY,
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: 'top center'
          }}
          className="relative bg-white text-slate-900 shadow-2xl rounded-sm flex flex-col justify-between select-none print:m-0 print:p-4 print:shadow-none"
          dir="rtl"
        >
          {/* Header on printed sheet */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 text-[10px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">
                {template.pageHeaderTitle || tenant.businessName}
              </span>
              <span>•</span>
              <span>هاتف الدعم: {template.supportPhoneText || tenant.phone}</span>
              <span>•</span>
              <span className="font-mono text-[9px]">{tenant.settings.loginDomain}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400">
                <Scissors className="w-3 h-3 text-slate-400" /> خطوط القص محددة
              </span>
              <span>•</span>
              <span>صفحة {currentPage} من {totalPages}</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            className="grid my-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              columnGap: `${gapX}px`,
              rowGap: `${gapY}px`
            }}
          >
            {displayCards.map((card, idx) => (
              <div key={card ? card.id : `empty_${idx}`} className="relative">
                {card ? (
                  <CardPreview
                    card={card}
                    template={template}
                    tenant={tenant}
                  />
                ) : (
                  <div className="w-full aspect-[63/33] border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 text-xs">
                    كرت فارغ
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer on printed sheet */}
          <div className="border-t border-slate-200 pt-2 mt-3 flex items-center justify-between text-[9px] text-slate-400">
            <span>{template.pageFooterText || `تم إنشاء وتوليد الكروت عبر نظام NetFlow SaaS • ${tenant.businessName}`}</span>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

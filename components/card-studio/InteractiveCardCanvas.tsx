'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardTemplate, Tenant, ElementPosition } from '@/types';
import { 
  Wifi, 
  Clock, 
  HardDrive, 
  Phone, 
  Sparkles, 
  Calendar, 
  Move, 
  RotateCcw,
  Sliders,
  Type,
  Maximize2,
  Lock,
  Layers,
  Sparkle
} from 'lucide-react';

export type EditableElementKey = 
  | 'networkName'
  | 'price'
  | 'profileName'
  | 'code'
  | 'pin'
  | 'qr'
  | 'uptime'
  | 'byteLimit'
  | 'serial'
  | 'createdAt'
  | 'supportPhone'
  | 'footerText';

interface InteractiveCardCanvasProps {
  card: Card;
  template: CardTemplate;
  tenant: Tenant;
  onUpdateTemplate: (updates: Partial<CardTemplate>) => void;
  scale?: number;
}

export const InteractiveCardCanvas: React.FC<InteractiveCardCanvasProps> = ({
  card,
  template,
  tenant,
  onUpdateTemplate,
  scale = 1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<EditableElementKey | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elemStartX: number; elemStartY: number }>({
    x: 0,
    y: 0,
    elemStartX: 0,
    elemStartY: 0
  });

  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(card.qrData, {
      margin: 1,
      width: 250,
      color: {
        dark: template.themeStyle === 'clean_white' ? '#0f172a' : '#000000',
        light: '#ffffff'
      }
    }).then(url => {
      if (isMounted) setQrUrl(url);
    }).catch(err => {
      console.error(err);
    });

    return () => {
      isMounted = false;
    };
  }, [card.qrData, template.themeStyle]);

  // Dynamic automatic scale factor based on card count / dimensions
  const cardsPerPage = (template.cardsPerRow || 3) * (template.cardsPerCol || 8);
  const autoScale = cardsPerPage >= 32 ? 0.78 : cardsPerPage >= 28 ? 0.88 : cardsPerPage <= 12 ? 1.25 : 1.0;

  // Helper to retrieve position (with sensible defaults in % coordinates: 0-100)
  const getPos = (key: EditableElementKey): ElementPosition => {
    const saved = template.positions?.[key as keyof typeof template.positions];
    if (saved) return saved;

    // Default positions if not custom-positioned yet
    switch (key) {
      case 'networkName':
        return { x: 5, y: 5, fontSize: Math.round(11 * autoScale), visible: template.showNetworkName, align: 'right' };
      case 'price':
        return { x: 74, y: 5, fontSize: Math.round(11 * autoScale), visible: template.showPrice, align: 'center' };
      case 'createdAt':
        return { x: 52, y: 6, fontSize: Math.round(7.5 * autoScale), visible: template.showCreatedAt, align: 'center' };
      case 'qr':
        return { x: 6, y: 26, fontSize: Math.round(14 * autoScale), visible: template.showQr, align: 'center' };
      case 'profileName':
        return { x: 42, y: 26, fontSize: Math.round(10 * autoScale), visible: template.showProfileName, align: 'right' };
      case 'serial':
        return { x: 78, y: 27, fontSize: Math.round(7.5 * autoScale), visible: template.showSerialNumber, align: 'left' };
      case 'code':
        return { x: 40, y: 44, fontSize: Math.round(14 * autoScale), visible: template.showCode, align: 'center' };
      case 'pin':
        return { x: 40, y: 68, fontSize: Math.round(8.5 * autoScale), visible: template.showPin, align: 'right' };
      case 'uptime':
        return { x: 5, y: 88, fontSize: Math.round(8 * autoScale), visible: template.showUptime, align: 'right' };
      case 'byteLimit':
        return { x: 30, y: 88, fontSize: Math.round(8 * autoScale), visible: template.showByteLimit, align: 'right' };
      case 'supportPhone':
        return { x: 55, y: 88, fontSize: Math.round(7.5 * autoScale), visible: template.showSupportPhone, align: 'right' };
      case 'footerText':
        return { x: 78, y: 88, fontSize: Math.round(7 * autoScale), visible: true, align: 'left' };
      default:
        return { x: 10, y: 10, fontSize: 10, visible: true, align: 'right' };
    }
  };

  const updateElementPos = (key: EditableElementKey, updates: Partial<ElementPosition>) => {
    const currentPos = getPos(key);
    const newPositions = {
      ...(template.positions || {}),
      [key]: { ...currentPos, ...updates }
    };
    onUpdateTemplate({ positions: newPositions as any });
  };

  const handleMouseDown = (e: React.MouseEvent, key: EditableElementKey) => {
    e.stopPropagation();
    setSelectedElement(key);
    setIsDragging(true);

    const pos = getPos(key);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elemStartX: pos.x ?? 0,
      elemStartY: pos.y ?? 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    // Constrain within card bounds (0% to 95%)
    const newX = Math.max(0, Math.min(92, Math.round(dragStart.elemStartX + deltaX)));
    const newY = Math.max(0, Math.min(92, Math.round(dragStart.elemStartY + deltaY)));

    updateElementPos(selectedElement, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset all element coordinates to automatic layout
  const handleResetPositions = () => {
    onUpdateTemplate({ positions: undefined });
    setSelectedElement(null);
  };

  const isDark = template.themeStyle !== 'clean_white';
  const supportNumber = template.supportPhoneText || tenant.phone || '77xxxxxxx';

  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (template.createdAtFormat === 'date_time') {
        return `${year}/${month}/${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      if (template.createdAtFormat === 'short') {
        return `${day}/${month}/${String(year).slice(-2)}`;
      }
      return `${year}/${month}/${day}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatCardDate(card.createdAt || (card as any).generatedAt || new Date().toISOString());

  // Selected element position control
  const activePos = selectedElement ? getPos(selectedElement) : null;

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" onMouseUp={handleMouseUp}>
      {/* Interactive Tool Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border border-sky-500/30 rounded-2xl text-xs shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Move className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>الاستوديو المرن للسحب والإفلات وتغيير الحقول بالماوس</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/20 text-sky-300 font-mono">
                Interactive Drag & Drop
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              انقر على أي عنصر أو نص داخل الكرت واسحبه بالماوس إلى أي موضع، وعدل حجم الخط بدقة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template.positions && Object.keys(template.positions).length > 0 && (
            <button
              type="button"
              onClick={handleResetPositions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-bold transition border border-rose-500/30"
              title="إعادة تعيين مواقع الحقول للوضع التلقائي"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للموضع التلقائي</span>
            </button>
          )}

          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
            التنسيق التلقائي لـ {cardsPerPage} كرت: مقاس الخط ×{autoScale}
          </div>
        </div>
      </div>

      {/* Selected Element Quick Property Inspector Toolbar */}
      {selectedElement && activePos && (
        <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-sky-500/40 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white">
              خصائص العنصر المحدد:{' '}
              <span className="text-sky-300 font-mono">
                {selectedElement === 'networkName' ? 'اسم الشبكة' :
                 selectedElement === 'price' ? 'شارة السعر' :
                 selectedElement === 'profileName' ? 'اسم الباقة' :
                 selectedElement === 'code' ? 'رمز الكرت (Code)' :
                 selectedElement === 'pin' ? 'الرمز السري (PIN)' :
                 selectedElement === 'qr' ? 'باركود QR' :
                 selectedElement === 'uptime' ? 'مدة الصلاحية' :
                 selectedElement === 'byteLimit' ? 'رصيد البيانات' :
                 selectedElement === 'createdAt' ? 'تأريخ الإنشاء' :
                 selectedElement === 'supportPhone' ? 'هاتف الدعم' : 'تذييل الكرت'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Font Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">حجم الخط:</span>
              <input
                type="range"
                min={6}
                max={24}
                step={0.5}
                value={activePos.fontSize || 10}
                onChange={e => updateElementPos(selectedElement, { fontSize: parseFloat(e.target.value) })}
                className="w-24 accent-sky-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-sky-400 w-8 text-left">{activePos.fontSize || 10}px</span>
            </div>

            {/* Position X / Y inputs */}
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-slate-400">X:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={activePos.x ?? 0}
                onChange={e => updateElementPos(selectedElement, { x: parseFloat(e.target.value) || 0 })}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-slate-100"
              />
              <span className="text-slate-400 mr-2">Y:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={activePos.y ?? 0}
                onChange={e => updateElementPos(selectedElement, { y: parseFloat(e.target.value) || 0 })}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-slate-100"
              />
            </div>

            {/* Text Align */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => updateElementPos(selectedElement, { align: 'right' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${activePos.align === 'right' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                يمين
              </button>
              <button
                type="button"
                onClick={() => updateElementPos(selectedElement, { align: 'center' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${activePos.align === 'center' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                وسط
              </button>
              <button
                type="button"
                onClick={() => updateElementPos(selectedElement, { align: 'left' })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${activePos.align === 'left' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                يسار
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedElement(null)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Stage Container */}
      <div className="flex justify-center items-center p-6 bg-slate-950/70 border border-slate-800 rounded-3xl min-h-[460px] overflow-hidden select-none">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={() => setSelectedElement(null)}
          style={{
            width: '460px',
            aspectRatio: `${template.cardWidthMm || 63}/${template.cardHeightMm || 33}`,
            backgroundColor: template.bgColor || '#090d16',
            backgroundImage: template.bgType === 'gradient'
              ? `linear-gradient(135deg, ${template.bgGradientStart || '#0f172a'}, ${template.bgGradientEnd || '#1e293b'})`
              : template.bgType === 'image' && template.bgImage
              ? `url(${template.bgImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: template.textColor || '#ffffff'
          }}
          className="relative rounded-2xl border-2 border-slate-700/80 shadow-2xl overflow-hidden cursor-crosshair group/stage transition-all"
        >
          {/* Subtle Grid Background for Precision Alignment */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* 1. Network Name */}
          {template.showNetworkName && (() => {
            const p = getPos('networkName');
            const isSelected = selectedElement === 'networkName';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'networkName')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 11}px`
                }}
                className={`flex items-center gap-1 font-bold text-white cursor-move px-1.5 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/30 z-30 shadow-lg' : 'hover:ring-1 hover:ring-white/40'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate max-w-[200px]">{tenant.businessName}</span>
              </div>
            );
          })()}

          {/* 2. Price Badge */}
          {template.showPrice && (() => {
            const p = getPos('price');
            const isSelected = selectedElement === 'price';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'price')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  backgroundColor: template.badgeBg || '#0284c7',
                  color: template.badgeTextColor || '#ffffff',
                  fontSize: `${p.fontSize || 11}px`
                }}
                className={`px-2.5 py-0.5 rounded-full font-black cursor-move shadow-md flex items-center gap-0.5 tabular-nums transition ${
                  isSelected ? 'ring-2 ring-amber-400 bg-amber-500 scale-105 z-30' : 'hover:ring-1 hover:ring-white/50'
                }`}
              >
                <span>{card.price}</span>
                <span className="text-[9px] font-normal">{tenant.currency}</span>
              </div>
            );
          })()}

          {/* 3. Created At Date */}
          {template.showCreatedAt && formattedDate && (() => {
            const p = getPos('createdAt');
            const isSelected = selectedElement === 'createdAt';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'createdAt')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 8}px`
                }}
                className={`px-1.5 py-0.5 rounded bg-white/10 text-sky-200 font-mono flex items-center gap-1 cursor-move transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/30 z-30' : 'hover:ring-1 hover:ring-white/30'
                }`}
              >
                <Calendar className="w-2.5 h-2.5 text-sky-300" />
                <span>{formattedDate}</span>
              </div>
            );
          })()}

          {/* 4. QR Code */}
          {template.showQr && (() => {
            const p = getPos('qr');
            const isSelected = selectedElement === 'qr';
            const qrPixel = Math.round((template.qrSizeMm || 18) * 4 * autoScale);
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'qr')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`
                }}
                className={`flex flex-col items-center cursor-move p-1 bg-white rounded-xl shadow-lg border border-slate-200 transition ${
                  isSelected ? 'ring-2 ring-sky-500 scale-105 z-30' : 'hover:ring-1 hover:ring-sky-400/50'
                }`}
              >
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR"
                    style={{ width: `${qrPixel}px`, height: `${qrPixel}px` }}
                    className="object-contain rounded"
                  />
                ) : (
                  <div style={{ width: `${qrPixel}px`, height: `${qrPixel}px` }} className="bg-slate-200 animate-pulse rounded" />
                )}
                <span className="text-[7.5px] text-slate-800 font-bold mt-0.5">امسح للاتصال</span>
              </div>
            );
          })()}

          {/* 5. Profile Name */}
          {template.showProfileName && (() => {
            const p = getPos('profileName');
            const isSelected = selectedElement === 'profileName';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'profileName')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 10}px`
                }}
                className={`font-bold text-sky-400 cursor-move px-1 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 z-30' : 'hover:ring-1 hover:ring-sky-300/40'
                }`}
              >
                {card.profileName}
              </div>
            );
          })()}

          {/* 6. Serial Number */}
          {template.showSerialNumber && (() => {
            const p = getPos('serial');
            const isSelected = selectedElement === 'serial';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'serial')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 7.5}px`
                }}
                className={`font-mono text-slate-400 cursor-move px-1 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 z-30' : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                SN: {card.id.replace('card_', '')}
              </div>
            );
          })()}

          {/* 7. Voucher Code Box */}
          {template.showCode && (() => {
            const p = getPos('code');
            const isSelected = selectedElement === 'code';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'code')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 14}px`
                }}
                className={`cursor-move rounded-xl px-4 py-1.5 font-mono font-bold tracking-wider shadow-inner text-center flex items-center justify-center gap-1 transition ${
                  isDark
                    ? 'bg-slate-900/90 text-sky-300 border border-sky-500/50'
                    : 'bg-slate-100 text-slate-900 border border-slate-300'
                } ${isSelected ? 'ring-2 ring-emerald-400 scale-105 z-30 shadow-xl' : 'hover:ring-1 hover:ring-sky-400/50'}`}
              >
                <span>{card.code}</span>
                {template.showScratchGuide && (
                  <span className="text-[8px] text-amber-400 font-sans mr-1 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> (خدش)
                  </span>
                )}
              </div>
            );
          })()}

          {/* 8. PIN Code */}
          {template.showPin && card.password && card.password !== card.code && (() => {
            const p = getPos('pin');
            const isSelected = selectedElement === 'pin';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'pin')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 8.5}px`
                }}
                className={`cursor-move px-2 py-0.5 rounded bg-white/10 border border-white/10 flex items-center gap-1 text-amber-300 font-mono transition ${
                  isSelected ? 'ring-2 ring-amber-400 z-30' : 'hover:ring-1 hover:ring-white/30'
                }`}
              >
                <span className="text-slate-400 font-sans text-[8px]">PIN:</span>
                <span>{card.password}</span>
              </div>
            );
          })()}

          {/* 9. Uptime Limit */}
          {template.showUptime && (() => {
            const p = getPos('uptime');
            const isSelected = selectedElement === 'uptime';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'uptime')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 8}px`
                }}
                className={`flex items-center gap-1 text-slate-300 cursor-move px-1 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 z-30' : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                <span>{card.uptimeDisplay}</span>
              </div>
            );
          })()}

          {/* 10. Byte Limit */}
          {template.showByteLimit && (() => {
            const p = getPos('byteLimit');
            const isSelected = selectedElement === 'byteLimit';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'byteLimit')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 8}px`
                }}
                className={`flex items-center gap-1 text-slate-300 cursor-move px-1 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-emerald-400 bg-emerald-500/20 z-30' : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                <HardDrive className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>{card.byteDisplay}</span>
              </div>
            );
          })()}

          {/* 11. Support Phone */}
          {template.showSupportPhone && (() => {
            const p = getPos('supportPhone');
            const isSelected = selectedElement === 'supportPhone';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'supportPhone')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 7.5}px`
                }}
                className={`flex items-center gap-0.5 text-amber-300 font-mono cursor-move px-1 py-0.5 rounded transition ${
                  isSelected ? 'ring-2 ring-amber-400 bg-amber-500/20 z-30' : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                <Phone className="w-2 h-2 text-amber-400" />
                <span>{supportNumber}</span>
              </div>
            );
          })()}

          {/* 12. Footer / Login Instructions */}
          {(() => {
            const p = getPos('footerText');
            const isSelected = selectedElement === 'footerText';
            return (
              <div
                onMouseDown={e => handleMouseDown(e, 'footerText')}
                style={{
                  position: 'absolute',
                  right: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.fontSize || 7}px`
                }}
                className={`text-slate-400 font-light cursor-move px-1 py-0.5 rounded truncate max-w-[180px] transition ${
                  isSelected ? 'ring-2 ring-sky-400 bg-sky-500/20 z-30' : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                {template.customFooter || 'اتصل بالشبكة وسجل الدخول'}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardTemplate, Tenant, ElementPosition } from '@/types';
import { Wifi, Clock, HardDrive, Phone, Sparkles, Calendar } from 'lucide-react';

interface CardPreviewProps {
  card: Card;
  template: CardTemplate;
  tenant: Tenant;
  scale?: number;
  className?: string;
  isZoomed?: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  template,
  tenant,
  scale = 1,
  className = '',
  isZoomed = false
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(card.qrData, {
      margin: 1,
      width: 200,
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

  const bgStyle: React.CSSProperties = {
    backgroundColor: template.bgColor || '#090d16',
    backgroundImage: template.bgType === 'gradient' 
      ? `linear-gradient(135deg, ${template.bgGradientStart || '#0f172a'}, ${template.bgGradientEnd || '#1e293b'})`
      : template.bgType === 'image' && template.bgImage
      ? `url(${template.bgImage})`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: template.textColor || '#ffffff'
  };

  const isDark = template.themeStyle !== 'clean_white';
  const supportNumber = template.supportPhoneText || tenant.phone || '77xxxxxxx';
  const cutStyle = template.cutLineStyle || (template.showCutLines ? 'dashed' : 'none');

  // Dynamic automatic scale factor based on card count / dimensions
  const cardsPerPage = (template.cardsPerRow || 3) * (template.cardsPerCol || 8);
  const autoScale = cardsPerPage >= 32 ? 0.78 : cardsPerPage >= 28 ? 0.88 : cardsPerPage <= 12 ? 1.25 : 1.0;

  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');

      if (template.createdAtFormat === 'date_time') {
        return `${year}/${month}/${day} ${hours}:${mins}`;
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

  // Check if custom absolute positions are defined
  const hasCustomPositions = template.positions && Object.keys(template.positions).length > 0;

  if (hasCustomPositions) {
    const getPos = (key: string): ElementPosition => {
      const saved = template.positions?.[key as keyof typeof template.positions];
      if (saved) return saved;
      // Fallback
      switch (key) {
        case 'networkName': return { x: 5, y: 5, fontSize: Math.round(11 * autoScale) };
        case 'price': return { x: 74, y: 5, fontSize: Math.round(11 * autoScale) };
        case 'createdAt': return { x: 52, y: 6, fontSize: Math.round(7.5 * autoScale) };
        case 'qr': return { x: 6, y: 26 };
        case 'profileName': return { x: 42, y: 26, fontSize: Math.round(10 * autoScale) };
        case 'serial': return { x: 78, y: 27, fontSize: Math.round(7.5 * autoScale) };
        case 'code': return { x: 40, y: 44, fontSize: Math.round(14 * autoScale) };
        case 'pin': return { x: 40, y: 68, fontSize: Math.round(8.5 * autoScale) };
        case 'uptime': return { x: 5, y: 88, fontSize: Math.round(8 * autoScale) };
        case 'byteLimit': return { x: 30, y: 88, fontSize: Math.round(8 * autoScale) };
        case 'supportPhone': return { x: 55, y: 88, fontSize: Math.round(7.5 * autoScale) };
        case 'footerText': return { x: 78, y: 88, fontSize: Math.round(7 * autoScale) };
        default: return { x: 10, y: 10, fontSize: 10 };
      }
    };

    return (
      <div
        id={`card-${card.id}`}
        style={{
          ...bgStyle,
          width: isZoomed ? '350px' : '100%',
          aspectRatio: `${template.cardWidthMm || 63}/${template.cardHeightMm || 33}`,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top right'
        }}
        className={`relative overflow-hidden rounded-xl border border-slate-700/50 shadow-md select-none text-right transition-all duration-200 ${className}`}
        dir="rtl"
      >
        {/* Cut lines mark */}
        {cutStyle === 'dashed' && (
          <div className="absolute inset-0 border border-dashed border-slate-400/40 rounded-xl pointer-events-none z-20" />
        )}
        {cutStyle === 'solid' && (
          <div className="absolute inset-0 border border-slate-400/30 rounded-xl pointer-events-none z-20" />
        )}
        {cutStyle === 'corner' && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-slate-400/60" />
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-slate-400/60" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-slate-400/60" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-slate-400/60" />
          </div>
        )}

        {/* 1. Network Name */}
        {template.showNetworkName && (() => {
          const p = getPos('networkName');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 11) * autoScale}px`
              }}
              className="flex items-center gap-1 font-bold text-white z-10 drop-shadow-sm"
            >
              <Wifi className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate max-w-[140px]">{tenant.businessName}</span>
            </div>
          );
        })()}

        {/* 2. Price Badge */}
        {template.showPrice && (() => {
          const p = getPos('price');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: template.badgeBg || '#0284c7',
                color: template.badgeTextColor || '#ffffff',
                fontSize: `${(p.fontSize || 10) * autoScale}px`
              }}
              className="px-2 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5 tabular-nums z-10"
            >
              <span>{card.price}</span>
              <span className="text-[7.5px] font-normal">{tenant.currency}</span>
            </div>
          );
        })()}

        {/* 3. Created At Date */}
        {template.showCreatedAt && formattedDate && (() => {
          const p = getPos('createdAt');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 7.5) * autoScale}px`
              }}
              className="px-1.5 py-0.5 rounded bg-white/10 text-sky-200 font-mono flex items-center gap-0.5 z-10"
            >
              <Calendar className="w-2 h-2 text-sky-300" />
              <span>{formattedDate}</span>
            </div>
          );
        })()}

        {/* 4. QR Code */}
        {template.showQr && (() => {
          const p = getPos('qr');
          const qrPixel = Math.round((template.qrSizeMm || 18) * 2.8 * autoScale);
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`
              }}
              className="flex flex-col items-center p-0.5 bg-white rounded-lg shadow-sm border border-slate-200/40 z-10"
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
            </div>
          );
        })()}

        {/* 5. Profile Name */}
        {template.showProfileName && (() => {
          const p = getPos('profileName');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 10) * autoScale}px`
              }}
              className="font-bold text-sky-400 z-10 truncate max-w-[120px]"
            >
              {card.profileName}
            </div>
          );
        })()}

        {/* 6. Serial Number */}
        {template.showSerialNumber && (() => {
          const p = getPos('serial');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 7.5) * autoScale}px`
              }}
              className="font-mono text-slate-400 z-10"
            >
              SN: {card.id.replace('card_', '')}
            </div>
          );
        })()}

        {/* 7. Voucher Code Box */}
        {template.showCode && (() => {
          const p = getPos('code');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 13) * autoScale}px`
              }}
              className={`rounded-md px-2.5 py-0.5 font-mono font-bold tracking-wider shadow-inner text-center flex items-center justify-center gap-1 z-10 ${
                isDark
                  ? 'bg-slate-950/95 text-white border border-sky-400/60 shadow-sky-950/40'
                  : 'bg-slate-50 text-slate-950 border border-slate-400'
              }`}
            >
              <span>{card.code}</span>
              {template.showScratchGuide && (
                <span className="text-[7.5px] text-amber-400 font-sans mr-0.5 flex items-center gap-0.5">
                  <Sparkles className="w-2 h-2" /> (خدش)
                </span>
              )}
            </div>
          );
        })()}

        {/* 8. PIN Code */}
        {template.showPin && card.password && card.password !== card.code && (() => {
          const p = getPos('pin');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 8.5) * autoScale}px`
              }}
              className="px-1.5 py-0.5 rounded bg-black/40 border border-amber-500/30 flex items-center gap-1 text-amber-300 font-mono font-bold z-10"
            >
              <span className="text-slate-300 font-sans text-[7.5px]">PIN:</span>
              <span>{card.password}</span>
            </div>
          );
        })()}

        {/* 9. Uptime */}
        {template.showUptime && (() => {
          const p = getPos('uptime');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 8) * autoScale}px`
              }}
              className={`flex items-center gap-0.5 font-bold z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" />
              <span>{card.uptimeDisplay}</span>
            </div>
          );
        })()}

        {/* 10. Byte Limit */}
        {template.showByteLimit && (() => {
          const p = getPos('byteLimit');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 8) * autoScale}px`
              }}
              className={`flex items-center gap-0.5 font-bold z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              <HardDrive className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>{card.byteDisplay}</span>
            </div>
          );
        })()}

        {/* 11. Support Phone */}
        {template.showSupportPhone && (() => {
          const p = getPos('supportPhone');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 7.5) * autoScale}px`
              }}
              className="flex items-center gap-0.5 text-amber-300 font-bold font-mono z-10"
            >
              <Phone className="w-2 h-2 text-amber-400" />
              <span>{supportNumber}</span>
            </div>
          );
        })()}

        {/* 12. Footer */}
        {(() => {
          const p = getPos('footerText');
          return (
            <div
              style={{
                position: 'absolute',
                right: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${(p.fontSize || 7) * autoScale}px`
              }}
              className={`font-medium truncate max-w-[140px] z-10 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
            >
              {template.customFooter || 'اتصل بالشبكة وسجل الدخول'}
            </div>
          );
        })()}
      </div>
    );
  }

  // Default Standard Fluid Card Layout (Scaled to match 32/24/18 cards per sheet)
  return (
    <div
      id={`card-${card.id}`}
      style={{
        ...bgStyle,
        width: isZoomed ? '350px' : '100%',
        aspectRatio: `${template.cardWidthMm || 63}/${template.cardHeightMm || 33}`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top right'
      }}
      className={`relative overflow-hidden rounded-xl border border-slate-700/50 shadow-md p-2 flex flex-col justify-between select-none text-right transition-all duration-200 ${className}`}
      dir="rtl"
    >
      {/* Decorative subtle ambient pattern & overlay */}
      {template.svgCode ? (
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      ) : template.bgType === 'image' && template.bgImage ? (
        <div className="absolute inset-0 bg-slate-950/35 backdrop-brightness-95 pointer-events-none" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
      )}
      
      {/* Cut lines mark */}
      {cutStyle === 'dashed' && (
        <div className="absolute inset-0 border border-dashed border-slate-400/40 rounded-xl pointer-events-none" />
      )}
      {cutStyle === 'solid' && (
        <div className="absolute inset-0 border border-slate-400/30 rounded-xl pointer-events-none" />
      )}
      {cutStyle === 'corner' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-slate-400/60" />
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-slate-400/60" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-slate-400/60" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-slate-400/60" />
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-1 border-b border-white/10 pb-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-4 h-4 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Wifi className="w-2.5 h-2.5" />
          </div>
          {template.showNetworkName && (
            <span 
              style={{ fontSize: `${Math.round(10.5 * autoScale)}px` }}
              className="font-bold truncate tracking-tight text-white drop-shadow-sm"
            >
              {tenant.businessName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {template.showCreatedAt && formattedDate && (
            <span 
              style={{ fontSize: `${Math.round(7 * autoScale)}px` }}
              className="px-1 py-0.5 rounded bg-white/10 text-sky-200 font-mono flex items-center gap-0.5" 
              title="تأريخ الإنشاء"
            >
              <Calendar className="w-2 h-2 text-sky-300" />
              <span>{formattedDate}</span>
            </span>
          )}
          {template.showBatchNumber && (
            <span 
              style={{ fontSize: `${Math.round(7.5 * autoScale)}px` }}
              className="px-1 py-0.5 rounded bg-white/10 text-slate-300 font-mono"
            >
              {card.batchNumber || 'B-101'}
            </span>
          )}
          {template.showPrice && (
            <div 
              style={{ 
                backgroundColor: template.badgeBg || '#0284c7', 
                color: template.badgeTextColor || '#ffffff',
                fontSize: `${Math.round(9.5 * autoScale)}px`
              }}
              className="px-1.5 py-0.5 rounded-full font-black shrink-0 shadow-sm flex items-center gap-0.5 tracking-tight tabular-nums"
            >
              <span>{card.price}</span>
              <span className="text-[7px] font-normal">{tenant.currency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Content: QR Code + Voucher Details */}
      <div className="relative z-10 grid grid-cols-12 gap-1.5 items-center my-auto">
        {/* QR Code Section */}
        {template.showQr && (
          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className="bg-white p-0.5 rounded-lg shadow-sm border border-slate-200/40 relative group">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Login"
                  style={{
                    width: `${Math.round(48 * autoScale)}px`,
                    height: `${Math.round(48 * autoScale)}px`
                  }}
                  className="object-contain rounded"
                />
              ) : (
                <div 
                  style={{
                    width: `${Math.round(48 * autoScale)}px`,
                    height: `${Math.round(48 * autoScale)}px`
                  }}
                  className="bg-slate-200 animate-pulse rounded" 
                />
              )}
            </div>
            <span 
              style={{ fontSize: `${Math.round(7 * autoScale)}px` }}
              className="mt-0.5 text-slate-300 font-medium tracking-tight"
            >
              امسح للاتصال
            </span>
          </div>
        )}

        {/* Voucher Code and Limits */}
        <div className={`${template.showQr ? 'col-span-8' : 'col-span-12'} flex flex-col gap-0.5`}>
          {template.showProfileName && (
            <div className="flex items-center justify-between gap-1">
              <span 
                style={{ fontSize: `${Math.round(9.5 * autoScale)}px` }}
                className="font-bold text-sky-400 truncate"
              >
                {card.profileName}
              </span>
              {template.showSerialNumber && (
                <span 
                  style={{ fontSize: `${Math.round(7 * autoScale)}px` }}
                  className="text-slate-400 font-mono"
                >
                  SN: {card.id.replace('card_', '')}
                </span>
              )}
            </div>
          )}

          {/* Voucher Code Box with Scratch Guide Option */}
          {template.showCode && (
            <div className="relative">
              <div 
                style={{ fontSize: `${Math.round((template.fontSizeCode || 13) * autoScale)}px` }}
                className={`py-0.5 px-1.5 rounded font-mono font-bold text-center tracking-wider shadow-inner transition-colors flex items-center justify-center gap-1 ${
                  isDark 
                    ? 'bg-slate-950/95 text-white border border-sky-400/60 shadow-sky-950/40' 
                    : 'bg-slate-50 text-slate-950 border border-slate-400'
                }`}
              >
                <span>{card.code}</span>
              </div>

              {/* Scratch Mask Area simulation overlay */}
              {template.showScratchGuide && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded border border-slate-500 shadow-md flex items-center justify-center text-[7.5px] text-slate-900 font-extrabold tracking-wide select-none">
                  <span className="drop-shadow-sm flex items-center gap-0.5">
                    <Sparkles className="w-2 h-2 text-amber-600 animate-pulse" />
                    {template.scratchText || 'أكشط بلطف لرؤية الرمز'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PIN code if separate */}
          {template.showPin && card.password && card.password !== card.code && (
            <div 
              style={{ fontSize: `${Math.round(8 * autoScale)}px` }}
              className="flex items-center justify-between px-1 bg-black/40 rounded border border-amber-500/30 font-bold"
            >
              <span className="text-slate-300 font-normal">PIN:</span>
              <span className="font-mono text-amber-400">{card.password}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Limits (Time, Data, Speed) & Instructions */}
      <div 
        style={{ fontSize: `${Math.round(7.5 * autoScale)}px` }}
        className={`relative z-10 flex items-center justify-between border-t border-white/10 pt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
      >
        <div className="flex items-center gap-1.5 font-bold">
          {template.showUptime && (
            <div className="flex items-center gap-0.5">
              <Clock className="w-2 h-2 text-sky-400" />
              <span>{card.uptimeDisplay}</span>
            </div>
          )}
          {template.showByteLimit && (
            <div className="flex items-center gap-0.5">
              <HardDrive className="w-2 h-2 text-emerald-400" />
              <span>{card.byteDisplay}</span>
            </div>
          )}
          {template.showSupportPhone && (
            <div className="flex items-center gap-0.5 text-amber-300">
              <Phone className="w-2 h-2 text-amber-400" />
              <span className="font-mono">{supportNumber}</span>
            </div>
          )}
        </div>

        <div className={`font-medium truncate max-w-[110px] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {template.customFooter || 'اتصل بالشبكة وسجل الدخول'}
        </div>
      </div>
    </div>
  );
};

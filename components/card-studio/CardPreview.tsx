'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardTemplate, Tenant } from '@/types';
import { Wifi, Clock, HardDrive, Phone, Sparkles, Hash, Calendar } from 'lucide-react';

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
      className={`relative overflow-hidden rounded-xl border border-slate-700/50 shadow-md p-2.5 flex flex-col justify-between select-none text-right transition-all duration-200 ${className}`}
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
      <div className="relative z-10 flex items-center justify-between gap-1 border-b border-white/10 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Wifi className="w-3 h-3" />
          </div>
          {template.showNetworkName && (
            <span className="font-bold text-[11px] truncate tracking-tight text-white drop-shadow-sm">
              {tenant.businessName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {template.showCreatedAt && formattedDate && (
            <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-white/10 text-sky-200 font-mono flex items-center gap-0.5" title="تأريخ الإنشاء">
              <Calendar className="w-2 h-2 text-sky-300" />
              <span>{formattedDate}</span>
            </span>
          )}
          {template.showBatchNumber && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              {card.batchNumber || 'B-101'}
            </span>
          )}
          {template.showPrice && (
            <div 
              style={{ backgroundColor: template.badgeBg || '#0284c7', color: template.badgeTextColor || '#ffffff' }}
              className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 shadow-sm flex items-center gap-0.5 tracking-tight tabular-nums"
            >
              <span>{card.price}</span>
              <span className="text-[8px] font-normal">{tenant.currency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Content: QR Code + Voucher Details */}
      <div className="relative z-10 grid grid-cols-12 gap-2 items-center my-auto">
        {/* QR Code Section */}
        {template.showQr && (
          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200/40 relative group">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Login"
                  className="w-14 h-14 object-contain rounded"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-200 animate-pulse rounded" />
              )}
            </div>
            <span className="text-[7.5px] mt-0.5 text-slate-300 font-medium tracking-tight">
              امسح للاتصال
            </span>
          </div>
        )}

        {/* Voucher Code and Limits */}
        <div className={`${template.showQr ? 'col-span-8' : 'col-span-12'} flex flex-col gap-1`}>
          {template.showProfileName && (
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold text-sky-400 truncate">
                {card.profileName}
              </span>
              {template.showSerialNumber && (
                <span className="text-[7.5px] text-slate-400 font-mono">
                  SN: {card.id.replace('card_', '')}
                </span>
              )}
            </div>
          )}

          {/* Voucher Code Box with Scratch Guide Option */}
          {template.showCode && (
            <div className="relative">
              <div 
                className={`py-1 px-2 rounded-md font-mono font-bold text-center tracking-wider text-sm shadow-inner transition-colors flex items-center justify-center gap-1 ${
                  isDark 
                    ? 'bg-slate-900/90 text-sky-300 border border-sky-500/40' 
                    : 'bg-slate-100 text-slate-900 border border-slate-300'
                }`}
              >
                <span>{card.code}</span>
              </div>

              {/* Scratch Mask Area simulation overlay */}
              {template.showScratchGuide && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-md border-2 border-slate-500 shadow-md flex items-center justify-center text-[8.5px] text-slate-900 font-extrabold tracking-wide select-none">
                  <span className="drop-shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                    {template.scratchText || 'أكشط بلطف لرؤية الرمز'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PIN code if separate */}
          {template.showPin && card.password && card.password !== card.code && (
            <div className="flex items-center justify-between text-[9px] px-1 bg-white/5 rounded border border-white/5">
              <span className="text-slate-400 font-normal">الرقم السري (PIN):</span>
              <span className="font-mono font-bold text-amber-400">{card.password}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Limits (Time, Data, Speed) & Instructions */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-1 text-[8.5px] text-slate-300">
        <div className="flex items-center gap-2">
          {template.showUptime && (
            <div className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 text-sky-400" />
              <span>{card.uptimeDisplay}</span>
            </div>
          )}
          {template.showByteLimit && (
            <div className="flex items-center gap-0.5">
              <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
              <span>{card.byteDisplay}</span>
            </div>
          )}
          {template.showSupportPhone && (
            <div className="flex items-center gap-0.5 text-[8px] text-amber-300">
              <Phone className="w-2 h-2 text-amber-400" />
              <span className="font-mono">{supportNumber}</span>
            </div>
          )}
        </div>

        <div className="text-[7.5px] text-slate-400 font-light truncate max-w-[120px]">
          {template.customFooter || 'اتصل بالشبكة وسجل الدخول'}
        </div>
      </div>
    </div>
  );
};


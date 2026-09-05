'use client';

import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Card, CardTemplate, Tenant } from '@/types';

/**
 * Downloads a Blob as a file in the browser.
 */
export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export interface ExportCardOptions {
  card?: Card;
  template?: CardTemplate;
  tenant?: Tenant;
  elementOrId?: HTMLElement | string;
  fileName?: string;
  scale?: number;
}

/**
 * Capture an existing HTML element or fallback seamlessly to Canvas 2D rendering,
 * guaranteeing 100% reliable PNG download at 300 DPI print-ready quality.
 */
export async function exportCardElementAsPng(
  elementOrId: HTMLElement | string = 'universal-card-export-target',
  fileName: string = 'NetFlow_Card.png',
  scale: number = 3,
  fallbackOptions?: { card?: Card; template?: CardTemplate; tenant?: Tenant }
): Promise<boolean> {
  try {
    let targetElement = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;

    if (!targetElement) {
      targetElement = document.getElementById('universal-card-export-target')
        || document.getElementById('main-card-preview-element')
        || document.getElementById('main-card-preview-container')
        || (document.querySelector('[data-card-preview="true"]') as HTMLElement)
        || (document.querySelector('.card-preview-item') as HTMLElement)
        || (document.querySelector('[id^="card-"]') as HTMLElement);
    }

    if (targetElement) {
      try {
        const canvas = await html2canvas(targetElement, {
          scale: Math.max(2, scale), // 3x scale ensures 300 DPI crispness
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc, clonedEl) => {
            if (clonedEl) {
              clonedEl.style.transform = 'none';
              clonedEl.style.opacity = '1';
              clonedEl.style.visibility = 'visible';
              clonedEl.style.position = 'relative';
              clonedEl.style.left = '0';
              clonedEl.style.top = '0';
            }
          }
        });

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });

        if (blob && blob.size > 200) {
          triggerFileDownload(blob, fileName.endsWith('.png') ? fileName : `${fileName}.png`);
          return true;
        }
      } catch (domCaptureErr) {
        console.warn('DOM html2canvas capture failed, attempting Canvas 2D fallback:', domCaptureErr);
      }
    }

    // Fallback directly to Canvas 2D if html2canvas had issues or element was not reachable
    if (fallbackOptions?.card && fallbackOptions?.template && fallbackOptions?.tenant) {
      return await exportCardDirectCanvas(
        fallbackOptions.card,
        fallbackOptions.template,
        fallbackOptions.tenant,
        fileName
      );
    }

    throw new Error('Target element could not be rendered and fallback data was missing');
  } catch (error) {
    console.error('Error exporting card element as PNG:', error);
    // If fallback options exist, try one last attempt with pure canvas
    if (fallbackOptions?.card && fallbackOptions?.template && fallbackOptions?.tenant) {
      try {
        return await exportCardDirectCanvas(
          fallbackOptions.card,
          fallbackOptions.template,
          fallbackOptions.tenant,
          fileName
        );
      } catch (canvasErr) {
        console.error('Canvas direct fallback also failed:', canvasErr);
      }
    }
    throw error;
  }
}

/**
 * Universal Card Export with guaranteed Canvas fallback.
 */
export async function exportCardWithFallback(options: ExportCardOptions): Promise<boolean> {
  const {
    card,
    template,
    tenant,
    elementOrId = 'universal-card-export-target',
    fileName = 'NetFlow_Card.png',
    scale = 3
  } = options;

  return await exportCardElementAsPng(
    elementOrId,
    fileName,
    scale,
    { card, template, tenant }
  );
}

/**
 * Direct Canvas 2D Renderer for cards (Zero DOM dependencies, ultra-fast, 100% reliable).
 */
export async function exportCardDirectCanvas(
  card: Card,
  template: CardTemplate,
  tenant: Tenant,
  fileName: string = 'NetFlow_Card.png'
): Promise<boolean> {
  try {
    const widthMm = template.cardWidthMm || 63;
    const heightMm = template.cardHeightMm || 33;
    const ratio = heightMm / widthMm;

    const width = 1260; // 300 DPI for standard card width
    const height = Math.round(width * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get Canvas 2D context');

    // 1. Draw rounded background
    drawFallbackGradient(ctx, template, width, height);

    // 2. Generate QR Code image
    let qrImg: HTMLImageElement | null = null;
    try {
      const qrDataUrl = await QRCode.toDataURL(card.qrData || card.code, {
        margin: 1,
        width: 350,
        color: {
          dark: template.qrDarkColor || (template.themeStyle === 'clean_white' ? '#0f172a' : '#000000'),
          light: template.qrLightColor || '#ffffff'
        }
      });
      qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        if (!qrImg) return resolve();
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('QR Code generation failed in canvas export:', e);
    }

    const isDark = template.themeStyle !== 'clean_white';
    const isCompact = heightMm <= 25;

    ctx.save();
    ctx.direction = 'rtl';

    if (isCompact) {
      // --- COMPACT STRIP LAYOUT ---
      const padding = Math.round(width * 0.03);

      // QR Code on Left
      const qrSize = Math.round(height * 0.85);
      if (qrImg) {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, padding, (height - qrSize) / 2, qrSize, qrSize, 12);
        ctx.fill();
        ctx.drawImage(qrImg, padding + 4, (height - qrSize) / 2 + 4, qrSize - 8, qrSize - 8);
      }

      // Network Name Top Right
      ctx.fillStyle = template.networkNameColor || (isDark ? '#ffffff' : '#0f172a');
      ctx.font = `bold ${Math.round(height * 0.22)}px "Segoe UI", Tahoma, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(tenant.businessName || 'شبكة الإنترنت', width - padding, padding + Math.round(height * 0.22));

      // Code Box Center Right
      const codeBoxW = Math.round(width * 0.45);
      const codeBoxH = Math.round(height * 0.42);
      const codeBoxX = width - padding - codeBoxW;
      const codeBoxY = Math.round(height * 0.45);

      ctx.fillStyle = template.codeBoxBg || (isDark ? 'rgba(2, 6, 23, 0.9)' : '#f8fafc');
      roundRect(ctx, codeBoxX, codeBoxY, codeBoxW, codeBoxH, 10);
      ctx.fill();
      ctx.strokeStyle = template.codeBoxBorderColor || '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = template.codeBoxTextColor || (isDark ? '#38bdf8' : '#0284c7');
      ctx.font = `bold ${Math.round(codeBoxH * 0.55)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(card.code, codeBoxX + codeBoxW / 2, codeBoxY + codeBoxH * 0.68);

      // Price Tag Middle Left
      if (template.showPrice) {
        const priceBoxW = Math.round(width * 0.22);
        const priceBoxH = Math.round(height * 0.42);
        const priceBoxX = padding + qrSize + Math.round(width * 0.02);
        const priceBoxY = Math.round(height * 0.45);

        ctx.fillStyle = template.badgeBg || '#0284c7';
        roundRect(ctx, priceBoxX, priceBoxY, priceBoxW, priceBoxH, 8);
        ctx.fill();

        ctx.fillStyle = template.badgeTextColor || '#ffffff';
        ctx.font = `bold ${Math.round(priceBoxH * 0.5)}px "Segoe UI", Tahoma, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${card.price} ${tenant.currency || 'ريال'}`, priceBoxX + priceBoxW / 2, priceBoxY + priceBoxH * 0.68);
      }
    } else {
      // --- STANDARD LANDSCAPE / PORTRAIT LAYOUT ---
      const padding = Math.round(width * 0.05);

      // Header: Network Name (Right) + Price Tag (Left)
      if (template.showNetworkName) {
        ctx.fillStyle = template.networkNameColor || (isDark ? '#ffffff' : '#0f172a');
        ctx.font = `bold ${Math.round(width * 0.038)}px "Segoe UI", Tahoma, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(tenant.businessName || 'شبكة الإنترنت', width - padding, padding + Math.round(width * 0.035));
      }

      // Price Badge
      if (template.showPrice) {
        const priceText = `${card.price} ${tenant.currency || 'ريال'}`;
        ctx.font = `bold ${Math.round(width * 0.034)}px "Segoe UI", Tahoma, sans-serif`;
        const textMetrics = ctx.measureText(priceText);
        const priceBadgeW = Math.round(textMetrics.width + 36);
        const priceBadgeH = Math.round(width * 0.065);

        ctx.fillStyle = template.badgeBg || '#0284c7';
        roundRect(ctx, padding, padding, priceBadgeW, priceBadgeH, 12);
        ctx.fill();

        ctx.fillStyle = template.badgeTextColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(priceText, padding + priceBadgeW / 2, padding + priceBadgeH * 0.68);
      }

      // Profile Name Subtitle
      if (template.showProfileName) {
        ctx.fillStyle = template.profileNameColor || '#38bdf8';
        ctx.font = `bold ${Math.round(width * 0.032)}px "Segoe UI", Tahoma, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(card.profileName || 'باقة الإنترنت', width - padding, padding + Math.round(width * 0.08));
      }

      // Body: QR Code (Left) & Code/Password (Right)
      const qrSize = Math.round(Math.min(width * 0.32, height * 0.52));
      const qrY = Math.round(height * 0.32);

      if (qrImg) {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, padding, qrY, qrSize, qrSize, 14);
        ctx.fill();
        ctx.drawImage(qrImg, padding + 6, qrY + 6, qrSize - 12, qrSize - 12);
      }

      // Code Box
      const codeBoxX = padding + qrSize + Math.round(width * 0.03);
      const codeBoxW = width - codeBoxX - padding;
      const codeBoxH = Math.round(height * 0.26);

      ctx.fillStyle = template.codeBoxBg || (isDark ? 'rgba(2, 6, 23, 0.85)' : '#f1f5f9');
      roundRect(ctx, codeBoxX, qrY, codeBoxW, codeBoxH, 14);
      ctx.fill();
      ctx.strokeStyle = template.codeBoxBorderColor || '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // "كود الدخول" Label & Code
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(codeBoxH * 0.22)}px "Segoe UI", Tahoma, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('كود الدخول (PIN / Code)', codeBoxX + codeBoxW / 2, qrY + codeBoxH * 0.32);

      ctx.fillStyle = template.codeBoxTextColor || (isDark ? '#38bdf8' : '#0284c7');
      ctx.font = `bold ${Math.round(codeBoxH * 0.42)}px monospace`;
      ctx.fillText(card.code, codeBoxX + codeBoxW / 2, qrY + codeBoxH * 0.76);

      // PIN if separate
      if (card.password && card.password !== card.code) {
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = `bold ${Math.round(width * 0.026)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`الرمز السري: ${card.password}`, codeBoxX + codeBoxW / 2, qrY + codeBoxH + Math.round(width * 0.035));
      }

      // Footer: Uptime limit & Byte quota & Support phone
      const footerY = height - padding;
      ctx.fillStyle = template.metaIconsColor || '#94a3b8';
      ctx.font = `${Math.round(width * 0.025)}px "Segoe UI", Tahoma, sans-serif`;

      const footerParts = [];
      if (template.showUptime && card.uptimeDisplay) footerParts.push(`⏱ الصلاحية: ${card.uptimeDisplay}`);
      if (template.showByteLimit && card.byteDisplay) footerParts.push(`💾 الرصيد: ${card.byteDisplay}`);
      if (template.showSupportPhone && (template.supportPhoneText || tenant.phone)) {
        footerParts.push(`📞 الدعم: ${template.supportPhoneText || tenant.phone}`);
      }

      if (footerParts.length > 0) {
        ctx.textAlign = 'right';
        ctx.fillText(footerParts.join('  |  '), width - padding, footerY);
      }
    }

    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) throw new Error('Failed to convert canvas to blob');

    triggerFileDownload(blob, fileName.endsWith('.png') ? fileName : `${fileName}.png`);
    return true;
  } catch (err) {
    console.error('Error in exportCardDirectCanvas:', err);
    throw err;
  }
}

/**
 * Render the template background directly (SVG, gradient, or solid) to an ultra-high-res Canvas
 * (300 DPI matching exact cardWidthMm x cardHeightMm ratio) and download as a clean PNG image.
 */
export async function exportTemplateBackgroundAsPng(
  template: CardTemplate,
  fileName: string = 'NetFlow_Template_Background.png'
): Promise<boolean> {
  try {
    const widthMm = template.cardWidthMm || 63;
    const heightMm = template.cardHeightMm || 33;
    const ratio = heightMm / widthMm;

    const width = 1700; // 300 DPI ultra-crisp resolution
    const height = Math.round(1700 * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    // 1. If template has SVG code or bgImage
    if (template.bgImage || template.svgCode) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const imgSrc = template.bgImage || (template.svgCode ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(template.svgCode)}` : '');

      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve();
        };
        img.onerror = () => {
          drawFallbackGradient(ctx, template, width, height);
          resolve();
        };
        img.src = imgSrc;
      });
    } else {
      drawFallbackGradient(ctx, template, width, height);
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) throw new Error('Failed to convert canvas to blob');

    triggerFileDownload(blob, fileName.endsWith('.png') ? fileName : `${fileName}.png`);
    return true;
  } catch (err) {
    console.error('Error exporting template background:', err);
    throw err;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawFallbackGradient(
  ctx: CanvasRenderingContext2D,
  template: CardTemplate,
  width: number,
  height: number
) {
  const r = Math.min(width * 0.05, (template.borderRadius || 20) * 2);
  ctx.save();
  
  // Rounded clipping
  roundRect(ctx, 0, 0, width, height, r);
  ctx.clip();

  if (template.bgType === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, template.bgGradientStart || '#0f172a');
    grad.addColorStop(1, template.bgGradientEnd || '#1e293b');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = template.bgColor || '#0f172a';
  }
  ctx.fillRect(0, 0, width, height);

  // Border if defined
  if (template.borderColor && (template.borderWidth || 0) > 0) {
    ctx.strokeStyle = template.borderColor;
    ctx.lineWidth = (template.borderWidth || 1) * 2;
    ctx.stroke();
  }

  ctx.restore();
}

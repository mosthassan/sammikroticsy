'use client';

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Card, CardTemplate, Tenant, ElementPosition } from '@/types';

// Helper to draw rounded rectangle on Canvas
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean = true,
  stroke: boolean = false
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Helper to draw dashed cut lines on Canvas
function drawDashedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dash: number[] = [6, 6],
  color: string = '#cbd5e1'
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(dash);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export async function generateCardsPdf(
  cards: Card[],
  template: CardTemplate,
  tenant: Tenant
): Promise<Blob> {
  // A4 Standard Dimensions in mm
  const pageWidthMm = 210;
  const pageHeightMm = 297;

  // Render scale for High-DPI Canvas (approx 300 DPI: ~11.81 pixels per mm)
  const dpiScale = 11.81;
  const canvasWidth = Math.round(pageWidthMm * dpiScale); // ~2480 px
  const canvasHeight = Math.round(pageHeightMm * dpiScale); // ~3508 px

  const cols = template.cardsPerRow || 3;
  const rows = template.cardsPerCol || 8;
  const cardsPerPage = cols * rows;

  // Dynamic automatic scale factor based on cards per sheet
  const autoScale = cardsPerPage >= 32 ? 0.78 : cardsPerPage >= 28 ? 0.88 : cardsPerPage <= 12 ? 1.25 : 1.0;

  const marginX = (template.marginX || 8) * dpiScale;
  const marginY = (template.marginY || 8) * dpiScale;

  const gapX = (template.gridGapXMm || 1.5) * dpiScale;
  const gapY = (template.gridGapYMm || 1.5) * dpiScale;

  const availableWidth = canvasWidth - marginX * 2 - (cols - 1) * gapX;
  const availableHeight = canvasHeight - marginY * 2 - (rows - 1) * gapY;

  const cardWidth = availableWidth / cols;
  const cardHeight = availableHeight / rows;

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  // Pre-generate QR Code HTML Images (if QR is enabled)
  const qrImageCache = new Map<string, HTMLImageElement>();
  if (template.showQr) {
    for (const card of cards) {
      if (!qrImageCache.has(card.qrData)) {
        try {
          const qrDataUrl = await QRCode.toDataURL(card.qrData, {
            margin: 1,
            width: 300,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });

          const img = new Image();
          img.src = qrDataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          qrImageCache.set(card.qrData, img);
        } catch (err) {
          console.error('QR creation error:', err);
        }
      }
    }
  }

  // Pre-load custom background template image if present
  let customBgImg: HTMLImageElement | null = null;
  if (template.bgType === 'image' && template.bgImage) {
    try {
      const img = new Image();
      img.src = template.bgImage;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      customBgImg = img;
    } catch (err) {
      console.error('Custom background image load error:', err);
    }
  }

  // Initialize jsPDF A4 Document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const fontStack = "'Cairo', 'Tajawal', 'Segoe UI', 'Tahoma', 'Arial', sans-serif";

  // Check if custom absolute positions are defined
  const hasCustomPositions = template.positions && Object.keys(template.positions).length > 0;

  // Render each page to an offscreen Canvas and add to PDF
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage();
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvasWidth;
    pageCanvas.height = canvasHeight;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Page Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Page Header Info in Arabic
    ctx.save();
    ctx.direction = 'rtl';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${Math.round(2.6 * dpiScale)}px ${fontStack}`;
    ctx.textAlign = 'right';
    const headerTitle = template.pageHeaderTitle || tenant.businessName;
    ctx.fillText(`${headerTitle} - صفحة ${pageIdx + 1} من ${totalPages}`, canvasWidth - marginX, marginY * 0.7);
    ctx.textAlign = 'left';
    ctx.fillText(`NetFlow SaaS - إدارة وتوزيع كروت المايكروتك`, marginX, marginY * 0.7);
    ctx.restore();

    const startIndex = pageIdx * cardsPerPage;
    const pageCards = cards.slice(startIndex, startIndex + cardsPerPage);

    // Draw each card on the Canvas
    for (let idx = 0; idx < pageCards.length; idx++) {
      const card = pageCards[idx];
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const cellX = marginX + col * (cardWidth + gapX);
      const cellY = marginY + row * (cardHeight + gapY);

      const cardX = cellX;
      const cardY = cellY;
      const cardW = cardWidth;
      const cardH = cardHeight;
      const cornerRadius = (template.borderRadius || 6) * (dpiScale / 3.77);
      const cutStyle = template.cutLineStyle || (template.showCutLines ? 'dashed' : 'none');

      // 1. Cut Lines
      if (cutStyle === 'dashed') {
        drawDashedRect(ctx, cellX, cellY, cardWidth, cardHeight, [6, 6], '#cbd5e1');
      } else if (cutStyle === 'solid') {
        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cardWidth, cardHeight);
        ctx.restore();
      } else if (cutStyle === 'corner') {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const cl = 4 * dpiScale;
        ctx.beginPath(); ctx.moveTo(cellX, cellY + cl); ctx.lineTo(cellX, cellY); ctx.lineTo(cellX + cl, cellY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cellX + cardWidth - cl, cellY); ctx.lineTo(cellX + cardWidth, cellY); ctx.lineTo(cellX + cardWidth, cellY + cl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cellX, cellY + cardHeight - cl); ctx.lineTo(cellX, cellY + cardHeight); ctx.lineTo(cellX + cl, cellY + cardHeight); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cellX + cardWidth - cl, cellY + cardHeight); ctx.lineTo(cellX + cardWidth, cellY + cardHeight); ctx.lineTo(cellX + cardWidth, cellY + cardHeight - cl); ctx.stroke();
        ctx.restore();
      }

      // 2. Card Background
      ctx.save();
      if (customBgImg) {
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cornerRadius, false, false);
        ctx.clip();
        ctx.drawImage(customBgImg, cardX, cardY, cardW, cardH);
      } else if (template.bgType === 'gradient' && template.bgGradientStart && template.bgGradientEnd) {
        const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        grad.addColorStop(0, template.bgGradientStart);
        grad.addColorStop(1, template.bgGradientEnd);
        ctx.fillStyle = grad;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cornerRadius, true, false);
      } else {
        ctx.fillStyle = template.bgColor || '#0f172a';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cornerRadius, true, false);
      }
      ctx.restore();

      // 3. Card Border
      ctx.strokeStyle = template.borderColor || '#334155';
      ctx.lineWidth = (template.borderWidth || 1) * (dpiScale / 3.77);
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cornerRadius, false, true);

      const isDarkCard = template.themeStyle !== 'clean_white';

      // Parse Creation Date string
      let formattedDateStr = '';
      if (template.showCreatedAt) {
        const rawDate = card.createdAt || (card as any).generatedAt || new Date().toISOString();
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            if (template.createdAtFormat === 'date_time') {
              formattedDateStr = `${year}/${month}/${day} ${hours}:${mins}`;
            } else if (template.createdAtFormat === 'short') {
              formattedDateStr = `${day}/${month}/${String(year).slice(-2)}`;
            } else {
              formattedDateStr = `${year}/${month}/${day}`;
            }
          }
        } catch {
          formattedDateStr = rawDate;
        }
      }

      // If user customized positions via Interactive Drag & Drop Studio:
      if (hasCustomPositions) {
        const getCustomPos = (key: string): ElementPosition => {
          return template.positions?.[key as keyof typeof template.positions] || {};
        };

        // Network Name
        if (template.showNetworkName) {
          const p = getCustomPos('networkName');
          const posX = cardX + cardW - ((p.x ?? 5) / 100) * cardW;
          const posY = cardY + ((p.y ?? 5) / 100) * cardH;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = isDarkCard ? '#ffffff' : '#0f172a';
          ctx.font = `700 ${Math.round((p.fontSize || 11) * 0.38 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.fillText(tenant.businessName, posX, posY + 3 * dpiScale, cardW * 0.55);
          ctx.restore();
        }

        // Price Badge
        if (template.showPrice) {
          const p = getCustomPos('price');
          const badgeW = 20 * dpiScale * autoScale;
          const badgeH = 6 * dpiScale * autoScale;
          const posX = cardX + cardW - ((p.x ?? 74) / 100) * cardW - badgeW;
          const posY = cardY + ((p.y ?? 5) / 100) * cardH;

          ctx.save();
          ctx.fillStyle = template.badgeBg || '#f59e0b';
          drawRoundedRect(ctx, posX, posY, badgeW, badgeH, 2.5 * dpiScale, true, false);
          ctx.fillStyle = template.badgeTextColor || '#000000';
          ctx.font = `800 ${Math.round(3.0 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.direction = 'rtl';
          const currencyText = tenant.currency === 'YER' ? 'ر.ي' : tenant.currency;
          ctx.fillText(`${card.price} ${currencyText}`, posX + badgeW / 2, posY + badgeH / 2);
          ctx.restore();
        }

        // Created At
        if (template.showCreatedAt && formattedDateStr) {
          const p = getCustomPos('createdAt');
          const posX = cardX + cardW - ((p.x ?? 52) / 100) * cardW;
          const posY = cardY + ((p.y ?? 6) / 100) * cardH;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = isDarkCard ? '#7dd3fc' : '#0284c7';
          ctx.font = `500 ${Math.round((p.fontSize || 7.5) * 0.35 * dpiScale * autoScale)}px monospace, ${fontStack}`;
          ctx.fillText(formattedDateStr, posX, posY + 2.5 * dpiScale);
          ctx.restore();
        }

        // QR Code
        if (template.showQr && qrImageCache.has(card.qrData)) {
          const p = getCustomPos('qr');
          const qrImg = qrImageCache.get(card.qrData)!;
          const qrPx = (template.qrSizeMm || 15) * dpiScale * autoScale;
          const posX = cardX + cardW - ((p.x ?? 6) / 100) * cardW - qrPx;
          const posY = cardY + ((p.y ?? 26) / 100) * cardH;

          ctx.save();
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, posX, posY, qrPx, qrPx, 2.5 * dpiScale, true, false);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, posX, posY, qrPx, qrPx, 2.5 * dpiScale, false, true);
          ctx.drawImage(qrImg, posX + 1 * dpiScale, posY + 1 * dpiScale, qrPx - 2 * dpiScale, qrPx - 2 * dpiScale);
          ctx.restore();
        }

        // Profile Name
        if (template.showProfileName) {
          const p = getCustomPos('profileName');
          const posX = cardX + cardW - ((p.x ?? 42) / 100) * cardW;
          const posY = cardY + ((p.y ?? 26) / 100) * cardH;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.font = `700 ${Math.round((p.fontSize || 10) * 0.36 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.fillText(card.profileName, posX, posY + 2.5 * dpiScale, cardW * 0.5);
          ctx.restore();
        }

        // Serial Number
        if (template.showSerialNumber) {
          const p = getCustomPos('serial');
          const posX = cardX + cardW - ((p.x ?? 78) / 100) * cardW;
          const posY = cardY + ((p.y ?? 27) / 100) * cardH;
          ctx.save();
          ctx.textAlign = 'left';
          ctx.fillStyle = isDarkCard ? '#94a3b8' : '#64748b';
          ctx.font = `500 ${Math.round((p.fontSize || 7.5) * 0.35 * dpiScale * autoScale)}px monospace`;
          ctx.fillText(`SN:${card.id.replace('card_', '')}`, posX, posY + 2.5 * dpiScale);
          ctx.restore();
        }

        // Voucher Code Box
        if (template.showCode) {
          const p = getCustomPos('code');
          const codeW = cardW * 0.52;
          const codeH = 7 * dpiScale * autoScale;
          const posX = cardX + cardW - ((p.x ?? 40) / 100) * cardW - codeW;
          const posY = cardY + ((p.y ?? 44) / 100) * cardH;

          ctx.save();
          ctx.fillStyle = isDarkCard ? '#1e293b' : '#f1f5f9';
          drawRoundedRect(ctx, posX, posY, codeW, codeH, 2.5 * dpiScale, true, false);
          ctx.strokeStyle = isDarkCard ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, posX, posY, codeW, codeH, 2.5 * dpiScale, false, true);

          ctx.fillStyle = isDarkCard ? '#ffffff' : '#0f172a';
          ctx.font = `800 ${Math.round((p.fontSize || 13) * 0.36 * dpiScale * autoScale)}px 'Courier New', monospace, ${fontStack}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(card.code, posX + codeW / 2, posY + codeH / 2);
          ctx.restore();

          if (template.showScratchGuide) {
            ctx.save();
            const silverGrad = ctx.createLinearGradient(posX, posY, posX + codeW, posY + codeH);
            silverGrad.addColorStop(0, '#94a3b8');
            silverGrad.addColorStop(0.5, '#e2e8f0');
            silverGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = silverGrad;
            drawRoundedRect(ctx, posX, posY, codeW, codeH, 2.5 * dpiScale, true, false);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, posX, posY, codeW, codeH, 2.5 * dpiScale, false, true);

            ctx.fillStyle = '#0f172a';
            ctx.font = `800 ${Math.round(2.1 * dpiScale * autoScale)}px ${fontStack}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.direction = 'rtl';
            ctx.fillText(template.scratchText || 'أكشط بلطف لرؤية الرمز', posX + codeW / 2, posY + codeH / 2);
            ctx.restore();
          }
        }

        // PIN
        if (template.showPin && card.password && card.password !== card.code) {
          const p = getCustomPos('pin');
          const posX = cardX + cardW - ((p.x ?? 40) / 100) * cardW;
          const posY = cardY + ((p.y ?? 68) / 100) * cardH;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fbbf24';
          ctx.font = `600 ${Math.round((p.fontSize || 8.5) * 0.35 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.fillText(`الرمز السري PIN: ${card.password}`, posX, posY + 2.5 * dpiScale);
          ctx.restore();
        }

        // Uptime & Byte Limit
        if (template.showUptime || template.showByteLimit) {
          const p = getCustomPos('uptime');
          const posX = cardX + cardW - ((p.x ?? 5) / 100) * cardW;
          const posY = cardY + ((p.y ?? 88) / 100) * cardH;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = isDarkCard ? '#94a3b8' : '#475569';
          ctx.font = `500 ${Math.round((p.fontSize || 8) * 0.34 * dpiScale * autoScale)}px ${fontStack}`;
          const metaText = `الصلاحية: ${card.uptimeDisplay} | الرصيد: ${card.byteDisplay}`;
          ctx.fillText(metaText, posX, posY + 2 * dpiScale);
          ctx.restore();
        }

        // Support Phone / Footer
        const pFoot = getCustomPos('footerText');
        const footX = cardX + cardW / 2;
        const footY = cardY + ((pFoot.y ?? 94) / 100) * cardH;
        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = isDarkCard ? '#64748b' : '#94a3b8';
        ctx.font = `400 ${Math.round(1.8 * dpiScale * autoScale)}px ${fontStack}`;
        const phoneText = template.supportPhoneText || tenant.phone;
        const footerText = template.customFooter 
          ? `${template.customFooter} • هاتف: ${phoneText}`
          : `تسجيل الدخول: ${tenant.settings.loginDomain} • هاتف الدعم: ${phoneText}`;
        ctx.fillText(footerText, footX, footY, cardW - 4 * dpiScale);
        ctx.restore();

      } else {
        // Standard Auto-Layout with Dynamic Scaling for 32/24 cards
        const topPadding = 2.8 * dpiScale * autoScale;
        const innerLeft = cardX + 2.8 * dpiScale * autoScale;
        const innerRight = cardX + cardW - 2.8 * dpiScale * autoScale;
        const topY = cardY + topPadding;

        // Price Badge (Top Left in RTL)
        if (template.showPrice) {
          const badgeW = 20 * dpiScale * autoScale;
          const badgeH = 6 * dpiScale * autoScale;
          const badgeX = innerLeft;
          const badgeY = topY;

          ctx.save();
          ctx.fillStyle = template.badgeBg || '#f59e0b';
          drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 2.5 * dpiScale, true, false);
          ctx.fillStyle = template.badgeTextColor || '#000000';
          ctx.font = `800 ${Math.round(3.0 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.direction = 'rtl';
          const currencyText = tenant.currency === 'YER' ? 'ر.ي' : tenant.currency;
          ctx.fillText(`${card.price} ${currencyText}`, badgeX + badgeW / 2, badgeY + badgeH / 2);
          ctx.restore();
        }

        // Network Name (Top Right in RTL)
        if (template.showNetworkName) {
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = isDarkCard ? '#ffffff' : '#0f172a';
          ctx.font = `700 ${Math.round((template.fontSizeTitle || 11) * 0.36 * dpiScale * autoScale)}px ${fontStack}`;
          const titleX = innerRight;
          const titleY = topY + 3.2 * dpiScale * autoScale;
          ctx.fillText(tenant.businessName, titleX, titleY, cardW * 0.56);
          ctx.restore();
        }

        // Card Creation Date & Batch Info
        if (template.showCreatedAt && formattedDateStr) {
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = isDarkCard ? '#7dd3fc' : '#0284c7';
          ctx.font = `500 ${Math.round(1.9 * dpiScale * autoScale)}px monospace, ${fontStack}`;
          ctx.fillText(`تأريخ: ${formattedDateStr}`, innerRight, topY + 6.2 * dpiScale * autoScale, cardW * 0.45);
          ctx.restore();
        }

        // 5. Body Area: QR Code on Left, Voucher Info on Right
        const bodyY = topY + 7.5 * dpiScale * autoScale;
        const qrSizeMm = (template.qrSizeMm || 15) * autoScale;
        const qrSizePx = qrSizeMm * dpiScale;
        const qrX = innerLeft;
        const qrY = bodyY;

        // Draw QR Code if enabled
        if (template.showQr && qrImageCache.has(card.qrData)) {
          const qrImg = qrImageCache.get(card.qrData)!;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, qrX, qrY, qrSizePx, qrSizePx, 2.5 * dpiScale, true, false);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, qrX, qrY, qrSizePx, qrSizePx, 2.5 * dpiScale, false, true);
          ctx.drawImage(qrImg, qrX + 1 * dpiScale, qrY + 1 * dpiScale, qrSizePx - 2 * dpiScale, qrSizePx - 2 * dpiScale);
          ctx.restore();
        }

        // Voucher Details Area
        const contentRight = innerRight;
        const contentLeft = template.showQr ? qrX + qrSizePx + 2.5 * dpiScale * autoScale : innerLeft;
        const contentWidth = contentRight - contentLeft;
        let currentItemY = bodyY;

        // Profile Name Badge & Serial Number
        if (template.showProfileName) {
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.font = `700 ${Math.round(2.6 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.fillText(card.profileName, contentRight, currentItemY + 2.2 * dpiScale * autoScale, contentWidth * 0.7);

          if (template.showSerialNumber) {
            ctx.textAlign = 'left';
            ctx.fillStyle = isDarkCard ? '#94a3b8' : '#64748b';
            ctx.font = `500 ${Math.round(1.9 * dpiScale * autoScale)}px monospace`;
            ctx.fillText(`SN:${card.id.replace('card_', '')}`, contentLeft, currentItemY + 2.2 * dpiScale * autoScale);
          }
          ctx.restore();
          currentItemY += 4.0 * dpiScale * autoScale;
        }

        // Voucher Code Box
        if (template.showCode) {
          const codeBoxH = 7.0 * dpiScale * autoScale;
          const codeBoxY = currentItemY;

          ctx.save();
          ctx.fillStyle = isDarkCard ? '#1e293b' : '#f1f5f9';
          drawRoundedRect(ctx, contentLeft, codeBoxY, contentWidth, codeBoxH, 2.5 * dpiScale, true, false);
          
          ctx.strokeStyle = isDarkCard ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, contentLeft, codeBoxY, contentWidth, codeBoxH, 2.5 * dpiScale, false, true);

          // Code Text
          ctx.fillStyle = isDarkCard ? '#ffffff' : '#0f172a';
          ctx.font = `800 ${Math.round((template.fontSizeCode || 13) * 0.36 * dpiScale * autoScale)}px 'Courier New', monospace, ${fontStack}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(card.code, contentLeft + contentWidth / 2, codeBoxY + codeBoxH / 2);
          ctx.restore();

          // Scratch Guide Foil (if enabled)
          if (template.showScratchGuide) {
            ctx.save();
            const silverGrad = ctx.createLinearGradient(contentLeft, codeBoxY, contentLeft + contentWidth, codeBoxY + codeBoxH);
            silverGrad.addColorStop(0, '#94a3b8');
            silverGrad.addColorStop(0.5, '#e2e8f0');
            silverGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = silverGrad;
            drawRoundedRect(ctx, contentLeft, codeBoxY, contentWidth, codeBoxH, 2.5 * dpiScale, true, false);
            
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, contentLeft, codeBoxY, contentWidth, codeBoxH, 2.5 * dpiScale, false, true);

            ctx.fillStyle = '#0f172a';
            ctx.font = `800 ${Math.round(2.1 * dpiScale * autoScale)}px ${fontStack}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.direction = 'rtl';
            ctx.fillText(template.scratchText || 'أكشط بلطف لرؤية الرمز', contentLeft + contentWidth / 2, codeBoxY + codeBoxH / 2);
            ctx.restore();
          }

          currentItemY += codeBoxH + 2.0 * dpiScale * autoScale;
        }

        // PIN Code (if separate from code)
        if (template.showPin && card.password && card.password !== card.code) {
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fbbf24';
          ctx.font = `600 ${Math.round(2.3 * dpiScale * autoScale)}px ${fontStack}`;
          ctx.fillText(`الرمز السري PIN: ${card.password}`, contentRight, currentItemY + 1.8 * dpiScale * autoScale, contentWidth);
          ctx.restore();
          currentItemY += 3.2 * dpiScale * autoScale;
        }

        // Limits: Time & Quota
        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.fillStyle = isDarkCard ? '#94a3b8' : '#475569';
        ctx.font = `500 ${Math.round(2.1 * dpiScale * autoScale)}px ${fontStack}`;
        const metaText = `الصلاحية: ${card.uptimeDisplay} | الرصيد: ${card.byteDisplay}`;
        ctx.fillText(metaText, contentRight, currentItemY + 1.8 * dpiScale * autoScale, contentWidth);
        ctx.restore();

        // Bottom Bar / Footer info inside card
        const footerY = cardY + cardH - 2.2 * dpiScale * autoScale;
        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = isDarkCard ? '#64748b' : '#94a3b8';
        ctx.font = `400 ${Math.round(1.8 * dpiScale * autoScale)}px ${fontStack}`;
        const phoneText = template.supportPhoneText || tenant.phone;
        const footerText = template.customFooter 
          ? `${template.customFooter} • هاتف: ${phoneText}`
          : `تسجيل الدخول: ${tenant.settings.loginDomain} • هاتف الدعم: ${phoneText}`;
        ctx.fillText(footerText, cardX + cardW / 2, footerY, cardW - 4 * dpiScale);
        ctx.restore();
      }
    }

    // Convert Canvas to High Quality JPEG image and add to PDF
    const pageDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(pageDataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  }

  return pdf.output('blob');
}

'use client';

import html2canvas from 'html2canvas';
import { CardTemplate } from '@/types';

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

/**
 * Capture an existing HTML element (such as the single card preview or canvas)
 * and download it directly as a crisp PNG image (300 DPI high resolution).
 */
export async function exportCardElementAsPng(
  elementOrId: HTMLElement | string,
  fileName: string = 'NetFlow_Card.png',
  scale: number = 3
): Promise<boolean> {
  try {
    let targetElement = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;

    if (!targetElement && typeof elementOrId === 'string') {
      targetElement = document.getElementById('main-card-preview-element')
        || document.getElementById('offscreen-card-export-target')
        || document.querySelector('[data-card-preview="true"]') as HTMLElement
        || document.querySelector('.card-preview-item') as HTMLElement;
    }

    if (!targetElement) {
      throw new Error(`Target element not found for export: ${elementOrId}`);
    }

    const canvas = await html2canvas(targetElement, {
      scale: Math.max(2, scale), // 3x scale ensures 300 DPI quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure fonts and RTL layout are properly preserved in cloned tree
        const clonedEl = clonedDoc.getElementById(typeof elementOrId === 'string' ? elementOrId : '') || clonedDoc.body;
        if (clonedEl) {
          clonedEl.style.transform = 'none';
        }
      }
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) {
      throw new Error('Failed to generate PNG blob from canvas');
    }

    triggerFileDownload(blob, fileName.endsWith('.png') ? fileName : `${fileName}.png`);
    return true;
  } catch (error) {
    console.error('Error exporting card element as PNG:', error);
    throw error;
  }
}

/**
 * Render the template background directly (SVG, gradient, or solid) to an ultra-high-res Canvas
 * (1700x1000px, 300 DPI) and download as a clean PNG image.
 * This is especially useful for owners who want to print pre-designed blank cards at printing houses!
 */
export async function exportTemplateBackgroundAsPng(
  template: CardTemplate,
  fileName: string = 'NetFlow_Template_Background.png'
): Promise<boolean> {
  try {
    const width = 1700; // 850 * 2 for ultra crisp printing
    const height = 1000; // 500 * 2
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

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve();
        };
        img.onerror = () => {
          // Fallback if image fails to load
          drawFallbackGradient(ctx, template, width, height);
          resolve();
        };
        img.src = imgSrc;
      });
    } else {
      // 2. Draw gradient or solid color
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

function drawFallbackGradient(
  ctx: CanvasRenderingContext2D,
  template: CardTemplate,
  width: number,
  height: number
) {
  const r = (template.borderRadius || 24) * 2;
  ctx.save();
  
  // Rounded clipping
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(width, 0, width, height, r);
  ctx.arcTo(width, height, 0, height, r);
  ctx.arcTo(0, height, 0, 0, r);
  ctx.arcTo(0, 0, width, 0, r);
  ctx.closePath();
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

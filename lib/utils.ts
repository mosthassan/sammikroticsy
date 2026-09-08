import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CardGridPreset {
  id: string;
  name: string;
  description: string;
  cardsCount: number;
  cols: number;
  rows: number;
  widthMm: number;
  heightMm: number;
  gapXMm: number;
  gapYMm: number;
  marginX: number;
  marginY: number;
  recommendedQrMm: number;
}

export const CARD_GRID_PRESETS: CardGridPreset[] = [
  {
    id: 'preset_24_standard',
    name: 'القياسي الشائع (24 كرت)',
    description: 'المقاس المعتمد الأكثر استخداماً في شبكات المايكروتك',
    cardsCount: 24,
    cols: 3,
    rows: 8,
    widthMm: 63,
    heightMm: 33,
    gapXMm: 1.5,
    gapYMm: 1.5,
    marginX: 7.5,
    marginY: 8,
    recommendedQrMm: 15
  },
  {
    id: 'preset_32_economy',
    name: 'اقتصادي موفر (32 كرت)',
    description: 'توفير 33% من ورق الطباعة مع وضوح ممتاز للباركود والرمز',
    cardsCount: 32,
    cols: 4,
    rows: 8,
    widthMm: 47,
    heightMm: 33,
    gapXMm: 1.2,
    gapYMm: 1.2,
    marginX: 6,
    marginY: 7,
    recommendedQrMm: 12
  },
  {
    id: 'preset_42_strip',
    name: 'فائق التوفير (42 كرت - شرائط)',
    description: '3 أعمدة × 14 صفاً - شريط عريض أنيق وموفر جداً للورق',
    cardsCount: 42,
    cols: 3,
    rows: 14,
    widthMm: 63,
    heightMm: 19,
    gapXMm: 1.2,
    gapYMm: 1.0,
    marginX: 6.5,
    marginY: 6,
    recommendedQrMm: 10
  },
  {
    id: 'preset_42_compact',
    name: 'ميني مدمج (42 كرت - 6×7)',
    description: '6 أعمدة × 7 صفوف - كروت عمودية مدمجة وسريعة القص',
    cardsCount: 42,
    cols: 6,
    rows: 7,
    widthMm: 31,
    heightMm: 38,
    gapXMm: 1.0,
    gapYMm: 1.2,
    marginX: 5.5,
    marginY: 6.5,
    recommendedQrMm: 10
  },
  {
    id: 'preset_36_grid',
    name: 'متوازن عالي الكثافة (36 كرت)',
    description: '4 أعمدة × 9 صفوف - تناسق رائع بين الحجم وسعر الورقة',
    cardsCount: 36,
    cols: 4,
    rows: 9,
    widthMm: 47,
    heightMm: 29,
    gapXMm: 1.2,
    gapYMm: 1.2,
    marginX: 6,
    marginY: 6.5,
    recommendedQrMm: 11
  },
  {
    id: 'preset_40_grid',
    name: 'كثافة تجارية (40 كرت)',
    description: '4 أعمدة × 10 صفوف - أقصى استغلال اقتصادي للورقة',
    cardsCount: 40,
    cols: 4,
    rows: 10,
    widthMm: 47,
    heightMm: 26,
    gapXMm: 1.0,
    gapYMm: 1.0,
    marginX: 6,
    marginY: 6,
    recommendedQrMm: 10
  },
  {
    id: 'preset_48_micro',
    name: 'مايكرو مكثف (48 كرت)',
    description: '4 أعمدة × 12 صفاً - أعلى عدد كروت ممكن في صفحة A4 واحدة',
    cardsCount: 48,
    cols: 4,
    rows: 12,
    widthMm: 47,
    heightMm: 21.5,
    gapXMm: 1.0,
    gapYMm: 1.0,
    marginX: 5.5,
    marginY: 5.5,
    recommendedQrMm: 9
  },
  {
    id: 'preset_18_large',
    name: 'حجم بارز مميز (18 كرت)',
    description: '3 أعمدة × 6 صفوف - خطوط وأيقونات كبيرة وواضحة جداً',
    cardsCount: 18,
    cols: 3,
    rows: 6,
    widthMm: 63,
    heightMm: 44,
    gapXMm: 1.5,
    gapYMm: 1.5,
    marginX: 7.5,
    marginY: 8,
    recommendedQrMm: 18
  },
  {
    id: 'preset_8_badge',
    name: 'بطاقة VIP فاخرة (8 كروت)',
    description: 'مقاس بطاقة الهوية والفيزا (ID-1) مع خلفية فخمة',
    cardsCount: 8,
    cols: 2,
    rows: 4,
    widthMm: 85.6,
    heightMm: 54,
    gapXMm: 4,
    gapYMm: 4,
    marginX: 12,
    marginY: 15,
    recommendedQrMm: 22
  }
];

/**
 * Computes an adaptive scale factor for elements inside a card
 * based on grid density (e.g., 18, 24, 32, 40, 42, 48 cards per A4 page)
 * and physical dimensions of the card.
 */
export function computeCardAutoScale(
  cardsPerRow: number = 3,
  cardsPerCol: number = 8,
  cardWidthMm: number = 63,
  cardHeightMm: number = 33,
  manualScale: number = 1.0
): number {
  const cardsPerPage = (cardsPerRow || 3) * (cardsPerCol || 8);
  
  // Base reference is 24 cards (63mm x 33mm)
  const baseArea = 63 * 33; // ~2079 mm²
  const currentArea = (cardWidthMm || 63) * (cardHeightMm || 33);
  const areaRatio = Math.sqrt(currentArea / baseArea);
  
  let densityFactor = 1.0;
  if (cardsPerPage >= 48) {
    densityFactor = 0.60;
  } else if (cardsPerPage >= 42) {
    densityFactor = 0.67;
  } else if (cardsPerPage >= 36) {
    densityFactor = 0.74;
  } else if (cardsPerPage >= 32) {
    densityFactor = 0.81;
  } else if (cardsPerPage >= 28) {
    densityFactor = 0.88;
  } else if (cardsPerPage <= 8) {
    densityFactor = 1.35;
  } else if (cardsPerPage <= 12) {
    densityFactor = 1.25;
  } else if (cardsPerPage <= 18) {
    densityFactor = 1.15;
  }

  // Combined smooth metric
  const rawScale = (areaRatio * 0.45 + densityFactor * 0.55);
  // Clamped between 0.50 (very compact) and 1.45 (large badges)
  const clampedScale = Math.min(1.45, Math.max(0.50, rawScale));
  
  return Number((clampedScale * (manualScale || 1.0)).toFixed(2));
}

/**
 * Robust cross-browser clipboard copy function with fallback for iframes and restrictive environments.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, falling back to textarea execCommand:', err);
    }
  }

  // 2. Robust fallback via hidden textarea and document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('Cross-browser fallback copy failed:', fallbackErr);
    return false;
  }
}

/**
 * Triggers a download of a text file (.rsc, .txt, .json) with robust fallback
 */
export function downloadTextFile(filename: string, content: string): boolean {
  if (typeof window === 'undefined' || !content) return false;
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {}
    }, 1200);
    return true;
  } catch (blobErr) {
    console.warn('Blob download failed, trying data URI:', blobErr);
    try {
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch {}
      }, 1200);
      return true;
    } catch (dataUriErr) {
      console.error('All download methods failed:', dataUriErr);
      return false;
    }
  }
}


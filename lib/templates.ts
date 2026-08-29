import { CardTemplate } from '@/types';

export const svgToDataUri = (svgString: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
};

// 1. نمط نيون عصري داكن (Cyberpunk / Dark Neon)
export const SVG_CYBER_NEON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080318" />
      <stop offset="50%" stop-color="#12062b" />
      <stop offset="100%" stop-color="#04010e" />
    </linearGradient>
    <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="100%" stop-color="#7000ff" />
    </linearGradient>
    <linearGradient id="neon-pink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="100%" stop-color="#ff00ff" />
    </linearGradient>
    <pattern id="cyber-grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#00f0ff" stroke-width="0.75" stroke-opacity="0.09" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="850" height="500" rx="28" fill="url(#cyber-bg)" />
  <rect width="850" height="500" rx="28" fill="url(#cyber-grid)" />

  <!-- Outer Cyber Border -->
  <rect x="8" y="8" width="834" height="484" rx="22" fill="none" stroke="url(#neon-cyan)" stroke-width="2" stroke-opacity="0.7" />
  
  <!-- Cyber Corner Tech Decors -->
  <path d="M 8 50 L 50 8 M 850 50 L 808 8 M 8 450 L 50 492 M 850 450 L 808 492" stroke="#ff007f" stroke-width="3" stroke-opacity="0.6" />
  
  <!-- Circuit Accent Lines -->
  <path d="M 30 75 L 260 75 L 290 95 L 820 95" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.4" />
  <circle cx="260" cy="75" r="4" fill="#00f0ff" />
  <circle cx="820" cy="95" r="4" fill="#ff007f" />

  <!-- Neon Glowing Accents -->
  <circle cx="780" cy="50" r="50" fill="#ff007f" fill-opacity="0.12" />
  <circle cx="70" cy="430" r="60" fill="#00f0ff" fill-opacity="0.12" />
</svg>`;

// 2. نمط أزرق كلاسيكي نظيف (Corporate Blue)
export const SVG_CORPORATE_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="corp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071322" />
      <stop offset="50%" stop-color="#0f2744" />
      <stop offset="100%" stop-color="#040b14" />
    </linearGradient>
    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.08" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="850" height="500" rx="28" fill="url(#corp-bg)" />

  <!-- Elegant Diagonal Waves -->
  <path d="M 0 360 Q 250 240 500 330 T 850 280 L 850 500 L 0 500 Z" fill="url(#wave-grad)" />
  <path d="M 0 430 Q 300 340 600 410 T 850 380 L 850 500 L 0 500 Z" fill="#000000" fill-opacity="0.3" />

  <!-- Sleek Border -->
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.5" />
  
  <!-- Header Divider Line -->
  <line x1="30" y1="85" x2="820" y2="85" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.3" />

  <!-- Security Microdots -->
  <circle cx="45" cy="460" r="3" fill="#38bdf8" fill-opacity="0.6" />
  <circle cx="60" cy="460" r="3" fill="#38bdf8" fill-opacity="0.4" />
  <circle cx="75" cy="460" r="3" fill="#38bdf8" fill-opacity="0.2" />
</svg>`;

// 3. نمط اقتصادي مخصص للطابعات ذات الحبر الأحادي (Clean Light / Minimal Mono)
export const SVG_CLEAN_MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
    </pattern>
  </defs>

  <!-- Clean White Background -->
  <rect width="850" height="500" rx="28" fill="#ffffff" />
  <rect width="850" height="500" rx="28" fill="url(#dot-grid)" opacity="0.35" />

  <!-- High-Contrast Clean Border -->
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#0f172a" stroke-width="2" />
  <rect x="18" y="18" width="814" height="464" rx="14" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 4" />

  <!-- Header Separator -->
  <line x1="30" y1="80" x2="820" y2="80" stroke="#0f172a" stroke-width="1.5" />
</svg>`;

// 4. نمط تدرجات رياضية نشطة (Sport / Speed Gradients)
export const SVG_SPORT_SPEED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="speed-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141418" />
      <stop offset="60%" stop-color="#202028" />
      <stop offset="100%" stop-color="#0a0a0d" />
    </linearGradient>
    <linearGradient id="speed-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#e11d48" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="850" height="500" rx="28" fill="url(#speed-bg)" />

  <!-- Aerodynamic Dynamic Slanted Stripes -->
  <path d="M 300 0 L 450 0 L 250 500 L 100 500 Z" fill="url(#speed-accent)" fill-opacity="0.14" />
  <path d="M 470 0 L 580 0 L 380 500 L 270 500 Z" fill="url(#speed-accent)" fill-opacity="0.25" />
  <path d="M 600 0 L 630 0 L 430 500 L 400 500 Z" fill="#f59e0b" fill-opacity="0.65" />

  <!-- Border -->
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="url(#speed-accent)" stroke-width="2" stroke-opacity="0.75" />

  <!-- Velocity Indicators -->
  <polygon points="780,45 810,45 795,70" fill="#ea580c" />
  <polygon points="750,45 775,45 760,70" fill="#f59e0b" />
</svg>`;

export const PREBUILT_TEMPLATES_LIBRARY: CardTemplate[] = [
  {
    id: 'tpl_cyber_neon_svg',
    name: 'نمط نيون عصري داكن (Cyberpunk / Dark Neon)',
    bgType: 'image',
    bgColor: '#090414',
    bgGradientStart: '#090414',
    bgGradientEnd: '#16082f',
    bgImage: svgToDataUri(SVG_CYBER_NEON),
    svgCode: SVG_CYBER_NEON,
    textColor: '#fdf4ff',
    accentColor: '#00f0ff',
    badgeBg: '#ff007f',
    badgeTextColor: '#ffffff',
    showQr: true,
    showCode: true,
    showPin: true,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: false,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'شبكة الإنترنت السيبرانية فائقة السرعة',
    customFooter: 'امسح الرمز أو ادخل الكود في صفحة الهوتسبوت',
    themeStyle: 'cyber_neon'
  },
  {
    id: 'tpl_corporate_blue_svg',
    name: 'نمط أزرق كلاسيكي نظيف (Corporate Blue)',
    bgType: 'image',
    bgColor: '#0b192c',
    bgGradientStart: '#0b192c',
    bgGradientEnd: '#1e3e62',
    bgImage: svgToDataUri(SVG_CORPORATE_BLUE),
    svgCode: SVG_CORPORATE_BLUE,
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    badgeBg: '#f59e0b',
    badgeTextColor: '#000000',
    showQr: true,
    showCode: true,
    showPin: true,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: false,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'خدمة إنترنت احترافية ومستقرة',
    customFooter: 'تغطية واسعة وسرعات تحميل فائقة',
    themeStyle: 'modern_dark'
  },
  {
    id: 'tpl_clean_minimal_svg',
    name: 'نمط اقتصادي موفر للحبر (Clean Light / Minimal)',
    bgType: 'image',
    bgColor: '#ffffff',
    bgGradientStart: '#ffffff',
    bgGradientEnd: '#f8fafc',
    bgImage: svgToDataUri(SVG_CLEAN_MINIMAL),
    svgCode: SVG_CLEAN_MINIMAL,
    textColor: '#0f172a',
    accentColor: '#0284c7',
    badgeBg: '#0f172a',
    badgeTextColor: '#ffffff',
    showQr: true,
    showCode: true,
    showPin: true,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: true,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'بطاقة إنترنت سريعة وموفرة',
    customFooter: 'الرمز صالح للاستخدام على جهاز واحد',
    themeStyle: 'clean_white'
  },
  {
    id: 'tpl_sport_speed_svg',
    name: 'نمط تدرجات رياضية نشطة (Sport / Speed Gradients)',
    bgType: 'image',
    bgColor: '#18181b',
    bgGradientStart: '#18181b',
    bgGradientEnd: '#27272a',
    bgImage: svgToDataUri(SVG_SPORT_SPEED),
    svgCode: SVG_SPORT_SPEED,
    textColor: '#ffffff',
    accentColor: '#ea580c',
    badgeBg: '#f59e0b',
    badgeTextColor: '#000000',
    showQr: true,
    showCode: true,
    showPin: false,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: false,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'باقة الألعاب والسرعات الفائقة Turbo',
    customFooter: 'بنج منخفض وسرعة استجابة عالية للألعاب',
    themeStyle: 'royal_gold'
  }
];

export const DEFAULT_TEMPLATES: CardTemplate[] = [
  ...PREBUILT_TEMPLATES_LIBRARY,
  {
    id: 'tpl_modern_dark',
    name: 'المظهر الليلي الحديث (Modern Dark)',
    bgType: 'gradient',
    bgColor: '#0f172a',
    bgGradientStart: '#0f172a',
    bgGradientEnd: '#1e293b',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    badgeBg: '#38bdf8',
    badgeTextColor: '#0f172a',
    showQr: true,
    showCode: true,
    showPin: true,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: false,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'شبكة إنترنت فائقة السرعة',
    customFooter: 'امسح الكود أو ادخل الرمز في صفحة الدخول',
    themeStyle: 'modern_dark'
  },
  {
    id: 'tpl_emerald_pro',
    name: 'الزمرد الأخضر التجاري (Emerald Pro)',
    bgType: 'gradient',
    bgColor: '#064e3b',
    bgGradientStart: '#064e3b',
    bgGradientEnd: '#047857',
    textColor: '#ffffff',
    accentColor: '#34d399',
    badgeBg: '#fbbf24',
    badgeTextColor: '#78350f',
    showQr: true,
    showCode: true,
    showPin: true,
    showPrice: true,
    showProfileName: true,
    showUptime: true,
    showByteLimit: true,
    showNetworkName: true,
    showCutLines: true,
    showScratchGuide: false,
    showCreatedAt: true,
    createdAtFormat: 'date_only',
    gridGapXMm: 1.5,
    gridGapYMm: 1.5,
    marginX: 8,
    marginY: 8,
    qrSizeMm: 18,
    cardsPerRow: 3,
    cardsPerCol: 8,
    cardWidthMm: 63,
    cardHeightMm: 33,
    fontSizeTitle: 11,
    fontSizeCode: 14,
    fontSizePrice: 12,
    fontSizeMeta: 9,
    customHeader: 'خدمة واي فاي موثوقة ومستقرة',
    customFooter: 'تصفح غير محدود وسرعات فائقة',
    themeStyle: 'emerald_pro'
  }
];

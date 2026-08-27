import { CardTemplate } from '@/types';

export const svgToDataUri = (svgString: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
};

// 1. نمط نيون عصري داكن (Cyberpunk / Dark Neon)
export const SVG_CYBER_NEON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090414" />
      <stop offset="50%" stop-color="#16082f" />
      <stop offset="100%" stop-color="#050014" />
    </linearGradient>
    <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="100%" stop-color="#7000ff" />
    </linearGradient>
    <linearGradient id="neon-pink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="100%" stop-color="#ff00ff" />
    </linearGradient>
    <pattern id="cyber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f0ff" stroke-width="0.75" stroke-opacity="0.08" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="850" height="500" rx="28" fill="url(#cyber-bg)" />
  <rect width="850" height="500" rx="28" fill="url(#cyber-grid)" />

  <!-- Outer Cyber Border -->
  <rect x="8" y="8" width="834" height="484" rx="22" fill="none" stroke="url(#neon-cyan)" stroke-width="2" stroke-opacity="0.6" />
  
  <!-- Cyber Corner Tech Decors -->
  <path d="M 8 60 L 60 8 M 850 60 L 798 8 M 8 440 L 60 492 M 850 440 L 798 492" stroke="#ff007f" stroke-width="3" stroke-opacity="0.5" />
  
  <!-- Circuit Accent Lines -->
  <path d="M 40 90 L 280 90 L 310 120 L 810 120" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.35" />
  <circle cx="280" cy="90" r="4" fill="#00f0ff" />
  <circle cx="810" cy="120" r="4" fill="#ff007f" />

  <!-- QR Frame Placeholder -->
  <rect x="40" y="140" width="220" height="220" rx="16" fill="#000000" fill-opacity="0.4" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="8 4" />

  <!-- Voucher Code Container Frame -->
  <rect x="290" y="195" width="520" height="90" rx="14" fill="#0c041f" stroke="url(#neon-cyan)" stroke-width="2" />
  <rect x="294" y="199" width="512" height="82" rx="10" fill="#000000" fill-opacity="0.5" />

  <!-- Neon Glowing Accents -->
  <circle cx="780" cy="60" r="45" fill="#ff007f" fill-opacity="0.08" filter="blur(20px)" />
  <circle cx="90" cy="420" r="50" fill="#00f0ff" fill-opacity="0.08" filter="blur(20px)" />
</svg>`;

// 2. نمط أزرق كلاسيكي نظيف (Corporate Blue)
export const SVG_CORPORATE_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="corp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b192c" />
      <stop offset="50%" stop-color="#1e3e62" />
      <stop offset="100%" stop-color="#001f3f" />
    </linearGradient>
    <linearGradient id="gold-badge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="850" height="500" rx="28" fill="url(#corp-bg)" />

  <!-- Elegant Diagonal Security Waves -->
  <path d="M 0 350 Q 250 220 500 320 T 850 260 L 850 500 L 0 500 Z" fill="url(#wave-grad)" />
  <path d="M 0 420 Q 300 320 600 400 T 850 360 L 850 500 L 0 500 Z" fill="#000000" fill-opacity="0.2" />

  <!-- Sleek Border -->
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.4" />
  
  <!-- Header Divider Line -->
  <line x1="40" y1="95" x2="810" y2="95" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.25" />

  <!-- QR Frame Placeholder -->
  <rect x="40" y="140" width="220" height="220" rx="16" fill="#ffffff" fill-opacity="0.05" stroke="#38bdf8" stroke-width="1.5" />

  <!-- Voucher Code Frame -->
  <rect x="290" y="195" width="520" height="90" rx="14" fill="#071324" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.8" />
  
  <!-- Security Microdots -->
  <circle cx="45" cy="455" r="3" fill="#38bdf8" fill-opacity="0.5" />
  <circle cx="60" cy="455" r="3" fill="#38bdf8" fill-opacity="0.3" />
  <circle cx="75" cy="455" r="3" fill="#38bdf8" fill-opacity="0.2" />
</svg>`;

// 3. نمط اقتصادي مخصص للطابعات ذات الحبر الأحادي (Clean Light / Minimal Mono)
export const SVG_CLEAN_MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
    </pattern>
  </defs>

  <!-- Clean White Background -->
  <rect width="850" height="500" rx="28" fill="#ffffff" />
  <rect width="850" height="500" rx="28" fill="url(#dot-grid)" opacity="0.4" />

  <!-- High-Contrast Clean Border -->
  <rect x="12" y="12" width="826" height="476" rx="20" fill="none" stroke="#0f172a" stroke-width="2" />
  <rect x="20" y="20" width="810" height="460" rx="14" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 4" />

  <!-- Header Separator -->
  <line x1="40" y1="90" x2="810" y2="90" stroke="#0f172a" stroke-width="1.5" />

  <!-- QR Frame Box -->
  <rect x="40" y="135" width="225" height="225" rx="14" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />

  <!-- High Contrast Voucher Code Box (Ink Efficient) -->
  <rect x="295" y="190" width="515" height="95" rx="12" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" />

  <!-- Minimal Tech Accents -->
  <line x1="40" y1="415" x2="810" y2="415" stroke="#cbd5e1" stroke-width="1" />
</svg>`;

// 4. نمط تدرجات رياضية نشطة (Sport / Speed Gradients)
export const SVG_SPORT_SPEED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="speed-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="60%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
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
  <path d="M 300 0 L 450 0 L 250 500 L 100 500 Z" fill="url(#speed-accent)" fill-opacity="0.12" />
  <path d="M 470 0 L 580 0 L 380 500 L 270 500 Z" fill="url(#speed-accent)" fill-opacity="0.22" />
  <path d="M 600 0 L 630 0 L 430 500 L 400 500 Z" fill="#f59e0b" fill-opacity="0.6" />

  <!-- Border -->
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="url(#speed-accent)" stroke-width="2" stroke-opacity="0.7" />

  <!-- QR Frame Placeholder with sporty angle -->
  <rect x="40" y="140" width="220" height="220" rx="16" fill="#000000" fill-opacity="0.6" stroke="#ea580c" stroke-width="1.5" />

  <!-- Voucher Code Frame -->
  <rect x="290" y="195" width="520" height="90" rx="14" fill="#09090b" stroke="url(#speed-accent)" stroke-width="2" />

  <!-- Velocity Indicators -->
  <polygon points="780,50 810,50 795,75" fill="#ea580c" />
  <polygon points="750,50 775,50 760,75" fill="#f59e0b" />
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

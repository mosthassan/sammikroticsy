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

  <rect width="850" height="500" rx="28" fill="url(#cyber-bg)" />
  <rect width="850" height="500" rx="28" fill="url(#cyber-grid)" />
  <rect x="8" y="8" width="834" height="484" rx="22" fill="none" stroke="url(#neon-cyan)" stroke-width="2" stroke-opacity="0.7" />
  
  <path d="M 8 50 L 50 8 M 850 50 L 808 8 M 8 450 L 50 492 M 850 450 L 808 492" stroke="#ff007f" stroke-width="3" stroke-opacity="0.6" />
  <path d="M 30 75 L 260 75 L 290 95 L 820 95" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.4" />
  <circle cx="260" cy="75" r="4" fill="#00f0ff" />
  <circle cx="820" cy="95" r="4" fill="#ff007f" />
  <circle cx="780" cy="50" r="50" fill="#ff007f" fill-opacity="0.12" />
  <circle cx="70" cy="430" r="60" fill="#00f0ff" fill-opacity="0.12" />
</svg>`;

// 2. نمط أزرق فايبر كلاسيكي (Corporate Fiber Blue)
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

  <rect width="850" height="500" rx="28" fill="url(#corp-bg)" />
  <path d="M 0 360 Q 250 240 500 330 T 850 280 L 850 500 L 0 500 Z" fill="url(#wave-grad)" />
  <path d="M 0 430 Q 300 340 600 410 T 850 380 L 850 500 L 0 500 Z" fill="#000000" fill-opacity="0.3" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.5" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.3" />
  <circle cx="45" cy="460" r="3" fill="#38bdf8" fill-opacity="0.6" />
  <circle cx="60" cy="460" r="3" fill="#38bdf8" fill-opacity="0.4" />
  <circle cx="75" cy="460" r="3" fill="#38bdf8" fill-opacity="0.2" />
</svg>`;

// 3. نمط اقتصادي موفر للحبر (Clean Light / Minimal Mono)
export const SVG_CLEAN_MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
    </pattern>
  </defs>

  <rect width="850" height="500" rx="28" fill="#ffffff" />
  <rect width="850" height="500" rx="28" fill="url(#dot-grid)" opacity="0.35" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#0f172a" stroke-width="2" />
  <rect x="18" y="18" width="814" height="464" rx="14" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 4" />
  <line x1="30" y1="80" x2="820" y2="80" stroke="#0f172a" stroke-width="1.5" />
</svg>`;

// 4. نمط تدرجات رياضية نشطة (Sport Speed / Turbo Blaze)
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

  <rect width="850" height="500" rx="28" fill="url(#speed-bg)" />
  <path d="M 300 0 L 450 0 L 250 500 L 100 500 Z" fill="url(#speed-accent)" fill-opacity="0.14" />
  <path d="M 470 0 L 580 0 L 380 500 L 270 500 Z" fill="url(#speed-accent)" fill-opacity="0.25" />
  <path d="M 600 0 L 630 0 L 430 500 L 400 500 Z" fill="#f59e0b" fill-opacity="0.65" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="url(#speed-accent)" stroke-width="2" stroke-opacity="0.75" />
  <polygon points="780,45 810,45 795,70" fill="#ea580c" />
  <polygon points="750,45 775,45 760,70" fill="#f59e0b" />
</svg>`;

// 5. نمط الذهب الملكي الفاخر (Royal Gold / VIP Luxury)
export const SVG_ROYAL_GOLD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="gold-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0a09" />
      <stop offset="40%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
    <linearGradient id="gold-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="25%" stop-color="#eab308" />
      <stop offset="50%" stop-color="#ca8a04" />
      <stop offset="75%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#fef08a" />
    </linearGradient>
    <pattern id="gold-mesh" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 0 15 L 15 0 L 30 15 L 15 30 Z" fill="none" stroke="#ca8a04" stroke-width="0.75" stroke-opacity="0.08" />
    </pattern>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#gold-bg)" />
  <rect width="850" height="500" rx="28" fill="url(#gold-mesh)" />
  <rect x="12" y="12" width="826" height="476" rx="20" fill="none" stroke="url(#gold-border)" stroke-width="2" />
  <rect x="20" y="20" width="810" height="460" rx="14" fill="none" stroke="#ca8a04" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="4 4" />

  <!-- Corner Gold Decors -->
  <path d="M 12 40 L 40 12 M 838 40 L 810 12 M 12 460 L 40 488 M 838 460 L 810 488" stroke="url(#gold-border)" stroke-width="2.5" />
  <circle cx="50" cy="50" r="3" fill="#eab308" />
  <circle cx="800" cy="50" r="3" fill="#eab308" />
  <circle cx="50" cy="450" r="3" fill="#eab308" />
  <circle cx="800" cy="450" r="3" fill="#eab308" />
  <path d="M 30 85 L 820 85" stroke="url(#gold-border)" stroke-width="1" stroke-opacity="0.5" />
</svg>`;

// 6. نمط الزمرد الأخضر التجاري (Emerald Pro / Telecom Green)
export const SVG_EMERALD_PRO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="emerald-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="50%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="emerald-wave" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.1" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#emerald-bg)" />
  <path d="M 0 350 C 200 280 400 420 850 300 L 850 500 L 0 500 Z" fill="url(#emerald-wave)" />
  <path d="M 0 420 C 300 360 550 450 850 380 L 850 500 L 0 500 Z" fill="#047857" fill-opacity="0.25" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#34d399" stroke-width="1.5" stroke-opacity="0.6" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#34d399" stroke-width="1" stroke-opacity="0.35" />

  <!-- Network Radar Waves in Corner -->
  <circle cx="80" cy="80" r="25" fill="none" stroke="#34d399" stroke-width="1" stroke-opacity="0.3" />
  <circle cx="80" cy="80" r="45" fill="none" stroke="#34d399" stroke-width="1" stroke-opacity="0.2" />
  <circle cx="80" cy="80" r="65" fill="none" stroke="#34d399" stroke-width="1" stroke-opacity="0.1" />
</svg>`;

// 7. نمط كربوني عسكري متطور (Carbon Fiber / Stealth Tech)
export const SVG_STEALTH_CARBON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <pattern id="carbon-pat" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#14181f" />
      <rect x="6" width="6" height="6" fill="#0d1117" />
      <rect y="6" width="6" height="6" fill="#0d1117" />
      <rect x="6" y="6" width="6" height="6" fill="#181d24" />
    </pattern>
    <linearGradient id="neon-tech" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="#0b0e14" />
  <rect width="850" height="500" rx="28" fill="url(#carbon-pat)" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="url(#neon-tech)" stroke-width="1.8" stroke-opacity="0.8" />
  
  <!-- Technical Chamfer Corners -->
  <polygon points="10,40 40,10 10,10" fill="#10b981" fill-opacity="0.3" />
  <polygon points="840,40 810,10 840,10" fill="#06b6d4" fill-opacity="0.3" />
  <polygon points="10,460 40,490 10,490" fill="#06b6d4" fill-opacity="0.3" />
  <polygon points="840,460 810,490 840,490" fill="#10b981" fill-opacity="0.3" />

  <!-- Traces -->
  <line x1="30" y1="85" x2="820" y2="85" stroke="#10b981" stroke-width="1.5" stroke-opacity="0.5" />
  <circle cx="45" cy="85" r="4" fill="#10b981" />
  <circle cx="805" cy="85" r="4" fill="#06b6d4" />
</svg>`;

// 8. نمط السديم البنفسجي الكوني (Cosmic Nebula / Violet)
export const SVG_COSMIC_VIOLET = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cosmic-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d041e" />
      <stop offset="50%" stop-color="#21083f" />
      <stop offset="100%" stop-color="#0a0217" />
    </linearGradient>
    <radialGradient id="nebula-glow" cx="80%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#c084fc" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#a855f7" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#21083f" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="nebula-glow-2" cx="20%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0a0217" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#cosmic-bg)" />
  <rect width="850" height="500" rx="28" fill="url(#nebula-glow)" />
  <rect width="850" height="500" rx="28" fill="url(#nebula-glow-2)" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-opacity="0.65" />

  <!-- Starlight Microdots -->
  <circle cx="120" cy="140" r="1.5" fill="#ffffff" opacity="0.8" />
  <circle cx="340" cy="60" r="1.2" fill="#f472b6" opacity="0.7" />
  <circle cx="560" cy="180" r="1.5" fill="#ffffff" opacity="0.9" />
  <circle cx="720" cy="120" r="2" fill="#c084fc" opacity="0.9" />
  <circle cx="210" cy="390" r="1.3" fill="#ffffff" opacity="0.6" />
  <circle cx="680" cy="420" r="1.5" fill="#f472b6" opacity="0.8" />

  <!-- Smooth Orbital Arc -->
  <path d="M 20 400 Q 400 150 830 350" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="8 6" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#c084fc" stroke-width="1" stroke-opacity="0.3" />
</svg>`;

// 9. نمط الأشكال الهندسية الحديثة (Poly Prism / Modern Geometric)
export const SVG_GEOMETRIC_PRISM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="prism-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#prism-bg)" />

  <!-- 3D Geometric Facets -->
  <polygon points="0,0 280,0 160,240 0,180" fill="#1e293b" fill-opacity="0.4" />
  <polygon points="280,0 520,0 420,200 160,240" fill="#312e81" fill-opacity="0.3" />
  <polygon points="520,0 850,0 720,220 420,200" fill="#1e3a8a" fill-opacity="0.35" />
  <polygon points="720,220 850,0 850,300" fill="#0284c7" fill-opacity="0.2" />
  <polygon points="160,240 420,200 360,500 0,500" fill="#0f172a" fill-opacity="0.6" />
  <polygon points="420,200 720,220 620,500 360,500" fill="#1e1b4b" fill-opacity="0.5" />
  <polygon points="720,220 850,300 850,500 620,500" fill="#0369a1" fill-opacity="0.35" />

  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.6" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.4" />
</svg>`;

// 10. نمط رمادي إداري احترافي (Executive Slate / Monochrome Pro)
export const SVG_EXECUTIVE_SLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="slate-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#141c2e" />
      <stop offset="100%" stop-color="#080c14" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#slate-bg)" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#475569" stroke-width="1.5" />
  <rect x="16" y="16" width="818" height="468" rx="16" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="3 3" />

  <line x1="30" y1="85" x2="820" y2="85" stroke="#64748b" stroke-width="1" stroke-opacity="0.5" />
  <circle cx="425" cy="85" r="4" fill="#38bdf8" />
</svg>`;

// 11. نمط أزرق سماوي نقي (Cloud Sky / Pure Cyan)
export const SVG_PURE_CYAN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cyan-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#082f49" />
      <stop offset="60%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="cyan-wave" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.1" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#cyan-bg)" />
  <path d="M 0 320 C 300 240 500 400 850 280 L 850 500 L 0 500 Z" fill="url(#cyan-wave)" />
  <path d="M 0 400 C 250 340 550 440 850 360 L 850 500 L 0 500 Z" fill="#0c4a6e" fill-opacity="0.4" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.8" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#bae6fd" stroke-width="1.2" stroke-opacity="0.4" />
</svg>`;

// 12. نمط التدرج الوردي المشرق (Sunset Coral / Vibrant Retail)
export const SVG_SUNSET_CORAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
  <defs>
    <linearGradient id="sunset-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b071a" />
      <stop offset="50%" stop-color="#500724" />
      <stop offset="100%" stop-color="#1f0310" />
    </linearGradient>
    <linearGradient id="sunset-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#fb7185" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#fb923c" stop-opacity="0.05" />
    </linearGradient>
  </defs>

  <rect width="850" height="500" rx="28" fill="url(#sunset-bg)" />
  <path d="M 0 360 Q 250 240 500 340 T 850 260 L 850 500 L 0 500 Z" fill="url(#sunset-grad)" />
  <rect x="10" y="10" width="830" height="480" rx="20" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-opacity="0.7" />
  <line x1="30" y1="85" x2="820" y2="85" stroke="#fb7185" stroke-width="1.2" stroke-opacity="0.4" />
</svg>`;

// ==========================================
// 12 PREBUILT TEMPLATES LIBRARY
// ==========================================
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
    name: 'نمط أزرق فايبر كلاسيكي (Corporate Fiber Blue)',
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
    customHeader: 'خدمة إنترنت فايبر احترافية ومستقرة',
    customFooter: 'تغطية واسعة وسرعات تحميل وتنزيل فائقة',
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
    customHeader: 'بطاقة إنترنت موفرة وسريعة',
    customFooter: 'الرمز صالح للاستخدام على جهاز واحد فقط',
    themeStyle: 'clean_white'
  },
  {
    id: 'tpl_sport_speed_svg',
    name: 'نمط تدرجات رياضية نشطة (Sport Speed / Turbo Blaze)',
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
  },
  {
    id: 'tpl_royal_gold_svg',
    name: 'نمط الذهب الملكي الفاخر (Royal Gold / VIP Luxury)',
    bgType: 'image',
    bgColor: '#0c0a09',
    bgGradientStart: '#0c0a09',
    bgGradientEnd: '#1c1917',
    bgImage: svgToDataUri(SVG_ROYAL_GOLD),
    svgCode: SVG_ROYAL_GOLD,
    textColor: '#fef08a',
    accentColor: '#eab308',
    badgeBg: '#ca8a04',
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
    customHeader: 'باقة كبار الشخصيات VIP الممتازة',
    customFooter: 'خدمة اتصال متميزة بسرعة مخصصة ودعم فوري',
    themeStyle: 'royal_gold'
  },
  {
    id: 'tpl_emerald_pro_svg',
    name: 'نمط الزمرد الأخضر التجاري (Emerald Pro / Telecom)',
    bgType: 'image',
    bgColor: '#022c22',
    bgGradientStart: '#022c22',
    bgGradientEnd: '#064e3b',
    bgImage: svgToDataUri(SVG_EMERALD_PRO),
    svgCode: SVG_EMERALD_PRO,
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
    customHeader: 'خدمة واي فاي موثوقة ومستقرة 24/7',
    customFooter: 'تصفح غير محدود وسرعات تحميل وتنزيل عالية',
    themeStyle: 'emerald_pro'
  },
  {
    id: 'tpl_stealth_carbon_svg',
    name: 'نمط كربوني عسكري متطور (Carbon Fiber / Stealth Tech)',
    bgType: 'image',
    bgColor: '#0b0e14',
    bgGradientStart: '#0b0e14',
    bgGradientEnd: '#161b22',
    bgImage: svgToDataUri(SVG_STEALTH_CARBON),
    svgCode: SVG_STEALTH_CARBON,
    textColor: '#f8fafc',
    accentColor: '#10b981',
    badgeBg: '#10b981',
    badgeTextColor: '#022c22',
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
    customHeader: 'شبكة السرعة الموجهة العسكرية فائقة الأمان',
    customFooter: 'اتصال مشفر عالي الاستقرار ضد التقطيع',
    themeStyle: 'stealth_carbon'
  },
  {
    id: 'tpl_cosmic_violet_svg',
    name: 'نمط السديم البنفسجي الكوني (Cosmic Nebula / Violet)',
    bgType: 'image',
    bgColor: '#0d041e',
    bgGradientStart: '#0d041e',
    bgGradientEnd: '#21083f',
    bgImage: svgToDataUri(SVG_COSMIC_VIOLET),
    svgCode: SVG_COSMIC_VIOLET,
    textColor: '#f5f3ff',
    accentColor: '#c084fc',
    badgeBg: '#f472b6',
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
    customHeader: 'شبكة الإنترنت الكونية - ترفيه وسرعة بلا حدود',
    customFooter: 'امسح الباركود للاتصال الفوري والسريع بالشبكة',
    themeStyle: 'cosmic_violet'
  },
  {
    id: 'tpl_geometric_prism_svg',
    name: 'نمط الأشكال الهندسية الحديثة (Poly Prism / Geometric)',
    bgType: 'image',
    bgColor: '#0b1120',
    bgGradientStart: '#0b1120',
    bgGradientEnd: '#1e1b4b',
    bgImage: svgToDataUri(SVG_GEOMETRIC_PRISM),
    svgCode: SVG_GEOMETRIC_PRISM,
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    badgeBg: '#0284c7',
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
    customHeader: 'خدمة إنترنت الجيل الحديث عالية السرعة',
    customFooter: 'سرعات تحميل متماثلة واستقرار دائم',
    themeStyle: 'geometric_prism'
  },
  {
    id: 'tpl_executive_slate_svg',
    name: 'نمط رمادي إداري احترافي (Executive Slate / Monochrome)',
    bgType: 'image',
    bgColor: '#090d16',
    bgGradientStart: '#090d16',
    bgGradientEnd: '#141c2e',
    bgImage: svgToDataUri(SVG_EXECUTIVE_SLATE),
    svgCode: SVG_EXECUTIVE_SLATE,
    textColor: '#f1f5f9',
    accentColor: '#94a3b8',
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
    customHeader: 'إنترنت عالي الجودة للفنادق والمؤسسات',
    customFooter: 'اتصال مباشر وسهل عبر إدخال الكود أو مسح QR',
    themeStyle: 'executive_slate'
  },
  {
    id: 'tpl_pure_cyan_svg',
    name: 'نمط أزرق سماوي نقي (Cloud Sky / Pure Cyan)',
    bgType: 'image',
    bgColor: '#082f49',
    bgGradientStart: '#082f49',
    bgGradientEnd: '#0284c7',
    bgImage: svgToDataUri(SVG_PURE_CYAN),
    svgCode: SVG_PURE_CYAN,
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
    customHeader: 'شبكة السماء السريعة - إنترنت متواصل',
    customFooter: 'تغطية واسعة في كل الأرجاء والساحات',
    themeStyle: 'pure_cyan'
  },
  {
    id: 'tpl_sunset_coral_svg',
    name: 'نمط التدرج الوردي المشرق (Sunset Coral / Retail)',
    bgType: 'image',
    bgColor: '#3b071a',
    bgGradientStart: '#3b071a',
    bgGradientEnd: '#500724',
    bgImage: svgToDataUri(SVG_SUNSET_CORAL),
    svgCode: SVG_SUNSET_CORAL,
    textColor: '#ffffff',
    accentColor: '#fb7185',
    badgeBg: '#f43f5e',
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
    customHeader: 'بطاقة إنترنت للكافيهات والمطاعم',
    customFooter: 'استمتع بأسرع تصفح وسوشيال ميديا وألعاب',
    themeStyle: 'sunset_coral'
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

// ==========================================
// READY-MADE COLOR SCHEME PRESETS (1-CLICK)
// ==========================================
export interface ColorSchemePreset {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'vibrant' | 'luxury';
  badge: string;
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
  badgeTextColor: string;
  codeBoxBg: string;
  codeBoxBorderColor: string;
  codeBoxTextColor: string;
  borderColor: string;
}

export const COLOR_SCHEME_PRESETS: ColorSchemePreset[] = [
  {
    id: 'fiber_blue',
    name: 'أزرق فايبر الملكي',
    category: 'dark',
    badge: '🔵 الأكثر طلباً',
    bgColor: '#071322',
    bgGradientStart: '#071322',
    bgGradientEnd: '#0f2744',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    badgeBg: '#f59e0b',
    badgeTextColor: '#000000',
    codeBoxBg: '#0f172a',
    codeBoxBorderColor: '#38bdf8',
    codeBoxTextColor: '#ffffff',
    borderColor: '#38bdf8'
  },
  {
    id: 'cyber_neon',
    name: 'نيون سيبراني متوهج',
    category: 'dark',
    badge: '🟣 كافيهات وألعاب',
    bgColor: '#080318',
    bgGradientStart: '#080318',
    bgGradientEnd: '#16082f',
    textColor: '#fdf4ff',
    accentColor: '#00f0ff',
    badgeBg: '#ff007f',
    badgeTextColor: '#ffffff',
    codeBoxBg: '#12062b',
    codeBoxBorderColor: '#00f0ff',
    codeBoxTextColor: '#00f0ff',
    borderColor: '#00f0ff'
  },
  {
    id: 'royal_gold',
    name: 'الذهب الفاخر VIP',
    category: 'luxury',
    badge: '👑 باقات VIP',
    bgColor: '#0c0a09',
    bgGradientStart: '#0c0a09',
    bgGradientEnd: '#1c1917',
    textColor: '#fef08a',
    accentColor: '#eab308',
    badgeBg: '#ca8a04',
    badgeTextColor: '#000000',
    codeBoxBg: '#1c1917',
    codeBoxBorderColor: '#eab308',
    codeBoxTextColor: '#fef08a',
    borderColor: '#eab308'
  },
  {
    id: 'emerald_green',
    name: 'الزمرد الأخضر التجاري',
    category: 'dark',
    badge: '🟢 رسمي تجاري',
    bgColor: '#022c22',
    bgGradientStart: '#022c22',
    bgGradientEnd: '#064e3b',
    textColor: '#ffffff',
    accentColor: '#34d399',
    badgeBg: '#fbbf24',
    badgeTextColor: '#78350f',
    codeBoxBg: '#064e3b',
    codeBoxBorderColor: '#34d399',
    codeBoxTextColor: '#ffffff',
    borderColor: '#34d399'
  },
  {
    id: 'turbo_blaze',
    name: 'تيربو ناري رياضي',
    category: 'vibrant',
    badge: '⚡ سرعات فائقة',
    bgColor: '#141418',
    bgGradientStart: '#141418',
    bgGradientEnd: '#291515',
    textColor: '#ffffff',
    accentColor: '#ea580c',
    badgeBg: '#f59e0b',
    badgeTextColor: '#000000',
    codeBoxBg: '#1c1414',
    codeBoxBorderColor: '#ea580c',
    codeBoxTextColor: '#ffffff',
    borderColor: '#ea580c'
  },
  {
    id: 'cosmic_purple',
    name: 'البنفسجي السديمي',
    category: 'vibrant',
    badge: '🔮 شبابي حديث',
    bgColor: '#0d041e',
    bgGradientStart: '#0d041e',
    bgGradientEnd: '#21083f',
    textColor: '#f5f3ff',
    accentColor: '#c084fc',
    badgeBg: '#f472b6',
    badgeTextColor: '#ffffff',
    codeBoxBg: '#21083f',
    codeBoxBorderColor: '#c084fc',
    codeBoxTextColor: '#f5f3ff',
    borderColor: '#c084fc'
  },
  {
    id: 'stealth_carbon',
    name: 'كربوني عسكري داكن',
    category: 'dark',
    badge: '🛡️ ألياف كربون',
    bgColor: '#0b0e14',
    bgGradientStart: '#0b0e14',
    bgGradientEnd: '#161b22',
    textColor: '#f8fafc',
    accentColor: '#10b981',
    badgeBg: '#10b981',
    badgeTextColor: '#022c22',
    codeBoxBg: '#161b22',
    codeBoxBorderColor: '#10b981',
    codeBoxTextColor: '#f8fafc',
    borderColor: '#10b981'
  },
  {
    id: 'clean_white',
    name: 'أبيض اقتصادي موفر للحبر',
    category: 'light',
    badge: '⚪ توفير حبر 100%',
    bgColor: '#ffffff',
    bgGradientStart: '#ffffff',
    bgGradientEnd: '#f8fafc',
    textColor: '#0f172a',
    accentColor: '#0284c7',
    badgeBg: '#0f172a',
    badgeTextColor: '#ffffff',
    codeBoxBg: '#f1f5f9',
    codeBoxBorderColor: '#0f172a',
    codeBoxTextColor: '#0f172a',
    borderColor: '#0f172a'
  },
  {
    id: 'ocean_cyan',
    name: 'سماوي محيطي مشرق',
    category: 'vibrant',
    badge: '🌊 سياحي منعش',
    bgColor: '#082f49',
    bgGradientStart: '#082f49',
    bgGradientEnd: '#0284c7',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    badgeBg: '#f59e0b',
    badgeTextColor: '#000000',
    codeBoxBg: '#0c4a6e',
    codeBoxBorderColor: '#38bdf8',
    codeBoxTextColor: '#ffffff',
    borderColor: '#38bdf8'
  },
  {
    id: 'sunset_coral',
    name: 'غروب مرجاني دافئ',
    category: 'vibrant',
    badge: '🌅 كافيهات ومطاعم',
    bgColor: '#3b071a',
    bgGradientStart: '#3b071a',
    bgGradientEnd: '#500724',
    textColor: '#ffffff',
    accentColor: '#fb7185',
    badgeBg: '#f43f5e',
    badgeTextColor: '#ffffff',
    codeBoxBg: '#500724',
    codeBoxBorderColor: '#fb7185',
    codeBoxTextColor: '#ffffff',
    borderColor: '#f43f5e'
  }
];

// ==========================================
// CARD CORNER SHAPE PRESETS (BORDER RADIUS)
// ==========================================
export const CARD_SHAPE_PRESETS = [
  { id: 'sharp', label: 'مربع حاد', radius: 0, desc: 'زوايا 0 مم (قص مستقيم حاد)' },
  { id: 'classic', label: 'كلاسيكي ناعم', radius: 8, desc: 'زوايا 2.5 مم كلاسيكية' },
  { id: 'modern', label: 'دائري عصري', radius: 16, desc: 'زوايا 5 مم عصرية ناعمة' },
  { id: 'pill', label: 'كبسولة دائرية', radius: 26, desc: 'زوايا كروية ناعمة جداً' }
];

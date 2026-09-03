export type Currency = 'YER' | 'SAR' | 'EGP' | 'USD' | 'IQD' | 'OMR' | 'KWD' | 'AED';

export type CleanupRetentionPolicy = 'immediate' | 'after_24h' | 'after_7d';

export interface TenantSettings {
  routerIp: string; // e.g. "10.0.0.1" or "192.168.88.1"
  loginDomain: string; // e.g. "wifi.net" or "hotspot.lan"
  autoLoginUrlPattern: string; // e.g. "http://{domain}/login?username={code}&password={password}"
  apiHost?: string;
  apiPort?: number;
  apiUser?: string;
  apiPassword?: string;
  hotspotServerName?: string;
  syncToken: string;
  // Expired Hotspot Users Cleanup & Maintenance
  autoCleanupExpiredUsers?: boolean;
  cleanupRetentionPolicy?: CleanupRetentionPolicy;
  lastCleanupAt?: string;
  cleanedCardsCount?: number;
  cleanupExcludeComments?: string;
}

export interface TenantSubscription {
  plan: 'starter' | 'pro' | 'enterprise';
  planNameArabic: string;
  status: 'active' | 'suspended' | 'trial';
  maxCards: number;
  maxDistributors: number;
  expiresAt: string;
  billingPeriod: 'monthly' | 'yearly' | 'lifetime';
  pricePaid?: number;
}

export interface Tenant {
  id: string;
  businessName: string;
  tagline: string;
  phone: string;
  currency: Currency;
  ownerUid: string;
  ownerName: string;
  ownerEmail?: string;
  subscription?: TenantSubscription;
  status?: 'active' | 'suspended';
  isProductionReady?: boolean;
  settings: TenantSettings;
  createdAt: string;
  totalCardsCount?: number;
  activeDistributorsCount?: number;
  totalRevenueGenerated?: number;
}

export interface Profile {
  id: string;
  tenantId: string;
  name: string; // e.g. "1 جيجا - 24 ساعة"
  rateLimit: string; // e.g. "5M/2M" or "2M/1M"
  uptimeLimit: string; // e.g. "1d" or "12h"
  uptimeDisplay: string; // e.g. "24 ساعة"
  byteLimit: string; // e.g. "1073741824" (1GB) or "2147483648" (2GB)
  byteDisplay: string; // e.g. "1 جيجابايت"
  price: number; // Retail price (سعر البيع للجمهور)
  wholesalePrice: number; // Wholesale price for POS/agents (سعر الجملة للبقالات)
  validityDays: number; // الصلاحية بالأيام
  badgeColor: string; // e.g. "#3b82f6"
  active: boolean;
}

export type CardStatus = 'in_stock' | 'distributed' | 'used' | 'expired';

export interface Card {
  id: string;
  tenantId: string;
  batchId: string;
  batchNumber: string;
  code: string;
  password?: string;
  profileId: string;
  profileName: string;
  rateLimit: string;
  uptimeDisplay: string;
  byteDisplay: string;
  price: number;
  wholesalePrice: number;
  status: CardStatus;
  assignedToAgentId?: string;
  assignedToAgentName?: string;
  assignedInvoiceId?: string;
  qrData: string;
  createdAt: string;
  distributedAt?: string;
  usedAt?: string;
  syncedToRouter: boolean;
}

export type CodeCharSet = 
  | 'digits_only' 
  | 'alphanumeric_upper' 
  | 'alphanumeric_lower' 
  | 'alphanumeric_mixed';

export interface CardBatch {
  id: string;
  tenantId: string;
  batchNumber: string;
  profileId: string;
  profileName: string;
  quantity: number;
  prefix: string;
  codeLength: number;
  codeCharSet?: CodeCharSet;
  passwordType: 'same_as_username' | 'separate_pin' | 'no_password';
  totalCards: number;
  inStockCount: number;
  distributedCount: number;
  usedCount: number;
  unitPrice: number;
  wholesalePrice: number;
  totalRetailValue: number;
  totalWholesaleValue: number;
  templateId: string;
  generatedAt: string;
  status: 'active' | 'archived';
}

export interface Agent {
  id: string;
  tenantId: string;
  storeName: string; // اسم البقالة أو المحل
  ownerName: string; // اسم صاحب البقالة
  phone: string;
  location: string;
  totalPurchases: number; // إجمالي المسحوبات (بالسعر الجملة)
  totalPaid: number; // إجمالي المدفوعات المسددة
  currentDebt: number; // الرصيد المتبقي (الدين الحالي)
  discountPercentage: number; // نسبة الخصم الإضافي % إن وجدت
  status: 'active' | 'suspended';
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  profileId: string;
  profileName: string;
  qty: number;
  retailPrice: number;
  wholesalePrice: number;
  subtotalWholesale: number;
  subtotalRetail: number;
}

export type PaymentType = 'cash' | 'credit' | 'partial';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  items: InvoiceItem[];
  totalRetail: number;
  totalWholesale: number;
  paidAmount: number;
  remainingDebt: number;
  paymentType: PaymentType;
  date: string;
  notes?: string;
  batchIds: string[];
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  receiptNumber: string;
  agentId: string;
  agentName: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'e_wallet' | 'check';
  date: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ElementPosition {
  x?: number; // percentage (0-100) or offset
  y?: number; // percentage (0-100) or offset
  fontSize?: number; // in px
  color?: string;
  visible?: boolean;
  fontWeight?: 'normal' | 'semibold' | 'bold' | 'black';
  align?: 'right' | 'center' | 'left';
  prefix?: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  bgType: 'color' | 'gradient' | 'image' | 'pattern';
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  bgImage?: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
  badgeTextColor: string;
  showQr: boolean;
  showCode: boolean;
  showPin: boolean;
  showPrice: boolean;
  showProfileName: boolean;
  showUptime: boolean;
  showByteLimit: boolean;
  showNetworkName: boolean;
  showCutLines: boolean;
  showScratchGuide: boolean;
  showSerialNumber?: boolean;
  showBatchNumber?: boolean;
  showSupportPhone?: boolean;
  showCreatedAt?: boolean;
  createdAtFormat?: 'date_only' | 'date_time' | 'short';
  supportPhoneText?: string;
  scratchText?: string;
  scratchFoilWidthMm?: number;
  scratchFoilHeightMm?: number;
  cutLineStyle?: 'dashed' | 'solid' | 'corner' | 'none';
  gridGapXMm?: number;
  gridGapYMm?: number;
  pageHeaderTitle?: string;
  pageFooterText?: string;
  showPageNumbers?: boolean;
  qrSizeMm: number;
  cardsPerRow: number; // e.g. 3 or 4
  cardsPerCol: number; // e.g. 8 or 10
  cardWidthMm: number; // e.g. 63mm
  cardHeightMm: number; // e.g. 33mm
  fontSizeTitle: number;
  fontSizeCode: number;
  fontSizePrice: number;
  fontSizeMeta: number;
  customHeader?: string;
  customFooter?: string;
  themeStyle: 'modern_dark' | 'cyber_neon' | 'clean_white' | 'emerald_pro' | 'royal_gold' | 'sky_blue' | 'stealth_carbon' | 'cosmic_violet' | 'geometric_prism' | 'sunset_coral' | 'executive_slate' | 'pure_cyan';
  marginX?: number;
  marginY?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  svgCode?: string;
  isAiGenerated?: boolean;
  createdAt?: string;
  // Element-Level Styling & Layout Shape Customization
  elementScale?: number; // Custom scale multiplier (default 1.0)
  codeBoxStyle?: 'modern_box' | 'pill_badge' | 'ticket_dashed' | 'neon_glow' | 'minimal_clean' | 'split_pin';
  codeBoxBg?: string;
  codeBoxBorderColor?: string;
  codeBoxTextColor?: string;
  priceTagStyle?: 'pill' | 'ribbon' | 'stamp' | 'glow' | 'minimal';
  qrFrameStyle?: 'card_rounded' | 'circular' | 'clean_flat' | 'accent_border';
  qrDarkColor?: string;
  qrLightColor?: string;
  headerStyle?: 'transparent' | 'banner_solid' | 'divider_line' | 'floating_chip';
  networkNameColor?: string;
  profileNameColor?: string;
  metaIconsColor?: string;
  dateBadgeColor?: string;
  dateBadgeTextColor?: string;
  positions?: {
    networkName?: ElementPosition;
    profileName?: ElementPosition;
    price?: ElementPosition;
    code?: ElementPosition;
    pin?: ElementPosition;
    qr?: ElementPosition;
    uptime?: ElementPosition;
    byteLimit?: ElementPosition;
    serial?: ElementPosition;
    scratchFoil?: ElementPosition;
    supportPhone?: ElementPosition;
    footerText?: ElementPosition;
  };
}

export type UserRole = 'super_admin' | 'owner' | 'distributor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  tenantId: string;
  name: string;
  phone?: string;
  photoURL?: string;
  pinCode?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TeamMember {
  id: string;
  uid?: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pinCode: string;
  active: boolean;
  totalInvoicesCreated?: number;
  totalPaymentsCollected?: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface RouterSyncStatus {
  lastSyncTime?: string;
  pendingSyncCount: number;
  totalSyncedCount: number;
  routerConnectionStatus: 'connected' | 'offline' | 'unconfigured' | 'pending';
  lastLog?: string;
}

export interface AppState {
  tenant: Tenant;
  profiles: Profile[];
  batches: CardBatch[];
  cards: Card[];
  agents: Agent[];
  invoices: Invoice[];
  payments: PaymentTransaction[];
  team: TeamMember[];
  currentUserProfile: UserProfile | null;
  templates: CardTemplate[];
  selectedTemplateId: string;
  syncStatus: RouterSyncStatus;
  isCloudConnected?: boolean;
  isSyncingWithCloud?: boolean;
}

export interface HotspotPortalTemplate {
  id: string;
  name: string;
  description: string;
  themeStyle: 'cyber_neon' | 'corporate_blue' | 'minimal_light' | 'luxury_gold' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  loginType: 'single_code' | 'username_password';
  showVoucherRates: boolean;
  showSupportContact: boolean;
  showSpeedtestLink: boolean;
  showFreeTrial: boolean;
  welcomeHeadline: string;
  welcomeSubheadline: string;
  supportPhone?: string;
  whatsappNumber?: string;
  htmlLogin: string;
  htmlStatus: string;
  htmlAlogin: string;
  htmlLogout: string;
  errorsTxt: string;
  customCss?: string;
  isAiGenerated?: boolean;
  createdAt?: string;
}

// -------------------------------------------------------------
// Super Admin Platform Configuration Types
// -------------------------------------------------------------

export type PaymentMethodCategory = 
  | 'bank_transfer' 
  | 'e_wallet' 
  | 'online_gateway' 
  | 'crypto' 
  | 'cash_remittance';

export interface PlatformPaymentMethod {
  id: string;
  name: string; // e.g. "حساب بنك الكريمي", "محفظة جوالي", "PayPal"
  category: PaymentMethodCategory;
  accountNumber: string; // رقم الحساب أو الآيبان أو المعرف
  accountHolderName: string; // اسم صاحب الحساب / المستفيد
  currency: Currency | 'USD' | 'USDT';
  transferFeePercent?: number; // رسوم التحويل إن وجدت
  instructions: string; // تعليمات إرسال إشعار السداد
  badgeColor?: string;
  logoUrl?: string;
  isActive: boolean;
  isOnlineGateway?: boolean;
  gatewayApiKey?: string;
  gatewaySecretKey?: string;
  gatewayMerchantId?: string;
  qrCodeImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlatformSubscriptionPlan {
  id: string; // e.g. "starter", "pro", "enterprise", or custom ID
  code: 'starter' | 'pro' | 'enterprise' | string;
  nameArabic: string;
  nameEnglish: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency | 'USD';
  discountPercentageYearly: number;
  maxCards: number;
  maxDistributors: number;
  maxRouters: number;
  trialDays: number;
  isRecommended?: boolean;
  badgeText?: string; // e.g. "الأكثر طلباً", "للشركات الكبرى"
  colorTheme: 'blue' | 'emerald' | 'purple' | 'amber' | 'sky';
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlatformContactSettings {
  brandName: string;
  brandTagline: string;
  whatsappNumber: string;
  whatsappSupportUrl?: string;
  phoneCall: string;
  supportEmail: string;
  telegramChannel?: string;
  telegramUser?: string;
  workingHours: string;
  officeAddress: string;
  websiteUrl: string;
  facebookUrl?: string;
  noticeBannerText?: string;
  isNoticeBannerActive?: boolean;
  updatedAt: string;
}

export interface PlatformAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'finance_admin' | 'support_admin';
  roleArabic: string;
  isActive: boolean;
  addedBy: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PlatformSettings {
  paymentMethods: PlatformPaymentMethod[];
  subscriptionPlans: PlatformSubscriptionPlan[];
  contact: PlatformContactSettings;
  admins: PlatformAdminUser[];
  updatedAt: string;
}


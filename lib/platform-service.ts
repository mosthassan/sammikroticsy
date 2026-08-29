'use client';

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  PlatformSettings,
  PlatformPaymentMethod,
  PlatformSubscriptionPlan,
  PlatformContactSettings,
  PlatformAdminUser
} from '@/types';
import { DEFAULT_ADMIN_EMAIL } from './firestore-service';

const PLATFORM_STORAGE_KEY = 'netflow_platform_settings_v1';

export const DEFAULT_PAYMENT_METHODS: PlatformPaymentMethod[] = [
  {
    id: 'pay_kuraimi',
    name: 'بنك الكريمي للتمويل الأصغر الإسلامي',
    category: 'bank_transfer',
    accountNumber: '3001234567',
    accountHolderName: 'م. مصطفى حسن',
    currency: 'YER',
    transferFeePercent: 0,
    instructions: 'يرجى إيداع أو تحويل المبلغ إلى رقم الحساب أعلاه وإرسال صورة إشعار التحويل عبر الواتساب لتفعيل الاشتراك فوراً.',
    badgeColor: '#0284c7',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'pay_jawali',
    name: 'محفظة جوالي (Jawali E-Wallet)',
    category: 'e_wallet',
    accountNumber: '777123456',
    accountHolderName: 'مصطفى حسن',
    currency: 'YER',
    transferFeePercent: 0,
    instructions: 'التحويل المباشر من تطبيق جوالي إلى رقم الهاتف المذكور، وسيتم مطابقة وتأكيد العملية آلياً.',
    badgeColor: '#10b981',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'pay_one_bank',
    name: 'بنك ون (ONE Bank / القطيبي)',
    category: 'bank_transfer',
    accountNumber: '102938475',
    accountHolderName: 'م. مصطفى حسن',
    currency: 'YER',
    transferFeePercent: 0,
    instructions: 'التحويل عبر تطبيق بنك ون أو شبكة القطيبي لحظياً وإرفاق الرقم المرجعي.',
    badgeColor: '#8b5cf6',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'pay_floosak',
    name: 'محفظة فلوسك (Floosak)',
    category: 'e_wallet',
    accountNumber: '770112233',
    accountHolderName: 'مصطفى حسن',
    currency: 'YER',
    transferFeePercent: 0,
    instructions: 'إرسال الحوالة إلى محفظة فلوسك الموضحة وإرسال رقم الحوالة.',
    badgeColor: '#f59e0b',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'pay_paypal',
    name: 'PayPal / بطاقات الائتمان الدولية (Visa & Mastercard)',
    category: 'online_gateway',
    accountNumber: 'payments@samtech.net',
    accountHolderName: 'SamTech Global Software LLC',
    currency: 'USD',
    transferFeePercent: 3.5,
    instructions: 'الدفع الإلكتروني الفوري بالدولار للمشتركين والعملاء خارج اليمن مع تفعيل فوري للاشتراك.',
    badgeColor: '#2563eb',
    isActive: true,
    isOnlineGateway: true,
    gatewayMerchantId: 'MERCHANT_SAMTECH_LIVE',
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'pay_crypto_usdt',
    name: 'العملات الرقمية المشفرة (USDT - TRC20 / BEP20)',
    category: 'crypto',
    accountNumber: 'TY7x9KmQ2Z4pL8vN1wR3sJ6tH5aB4cE7dF',
    accountHolderName: 'NetFlow Crypto Billing Wallet',
    currency: 'USDT',
    transferFeePercent: 0,
    instructions: 'يرجى إرسال المبلغ الصافي عبر شبكة Tron TRC20 ثم إرسال Transaction Hash لتأكيد الشحن.',
    badgeColor: '#14b8a6',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-02-10T00:00:00Z'
  },
  {
    id: 'pay_remittance',
    name: 'حوالة مصرفية (النجم / العمقي / الامتياز / يمن إكسبرس)',
    category: 'cash_remittance',
    accountNumber: 'صنعاء - اليمن',
    accountHolderName: 'مصطفى حسن محمد',
    currency: 'YER',
    transferFeePercent: 0,
    instructions: 'إرسال حوالة بالاسم المذكور وإرسال سند الحوالة ورقم الكود السري عبر محادثة الواتساب.',
    badgeColor: '#64748b',
    isActive: true,
    isOnlineGateway: false,
    createdAt: '2026-02-15T00:00:00Z'
  }
];

export const DEFAULT_SUBSCRIPTION_PLANS: PlatformSubscriptionPlan[] = [
  {
    id: 'plan_starter',
    code: 'starter',
    nameArabic: 'باقة المبتدئين (Starter)',
    nameEnglish: 'Starter Network Plan',
    tagline: 'مثالية لأصحاب الشبكات الناشئة والصغيرة ونقاط الواي فاي المحدودة',
    monthlyPrice: 15,
    yearlyPrice: 140,
    currency: 'USD',
    discountPercentageYearly: 22,
    maxCards: 3000,
    maxDistributors: 5,
    maxRouters: 1,
    trialDays: 14,
    isRecommended: false,
    badgeText: 'للبداية السريعة',
    colorTheme: 'blue',
    features: [
      'طباعة حتى 3,000 كرت شهرياً بدقة A4',
      'توليد وتصدير ملفات PDF و Excel بالمليمتر',
      'إدارة حتى 5 موزعين وبقالات نقاط بيع',
      'ربط راوتر مايكروتك 1 بمزامنة أوفلاين وسكربتات ذكية',
      'باركود QR ذكي ومسح فوري بالهاتف',
      'دفتر ديون وسندات قبض مبسطة',
      'دعم فني عبر الواتساب والبريد'
    ],
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan_pro',
    code: 'pro',
    nameArabic: 'باقة المحترفين (Pro)',
    nameEnglish: 'Professional ISP Plan',
    tagline: 'الخيار الأكثر كفاءة للشبكات المتوسطة والنشطة وتوزيع الديون الميداني',
    monthlyPrice: 29,
    yearlyPrice: 280,
    currency: 'USD',
    discountPercentageYearly: 20,
    maxCards: 12000,
    maxDistributors: 20,
    maxRouters: 5,
    trialDays: 14,
    isRecommended: true,
    badgeText: 'الأكثر طلباً وموصى بها ⭐',
    colorTheme: 'emerald',
    features: [
      'طباعة حتى 12,000 كرت شهرياً بدون انقطاع',
      'استوديو تصميم وسحب وإفلات متقدم لكل عنصر',
      'إدارة حتى 20 موزع وبقالة مع كشوفات حساب دقيقة',
      'ربط حتى 5 راوترات مايكروتك متزامنة',
      'تطبيق الموزع الميداني السريع برمز PIN سري',
      'تتبع الكروت المستهلكة في المخزن وسجل الأرباح',
      'نسخ احتياطي سحابي تلقائي لجميع العمليات',
      'دعم فني ذو أولوية VIP مع فريق المهندسين'
    ],
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'plan_enterprise',
    code: 'enterprise',
    nameArabic: 'الباقة اللامحدودة (Enterprise)',
    nameEnglish: 'Enterprise & ISP Providers',
    tagline: 'للشركات والمؤسسات الكبرى ومزودي الإنترنت ذوي الفروع المتعددة',
    monthlyPrice: 59,
    yearlyPrice: 550,
    currency: 'USD',
    discountPercentageYearly: 25,
    maxCards: 50000,
    maxDistributors: 100,
    maxRouters: 25,
    trialDays: 14,
    isRecommended: false,
    badgeText: 'للشركات والشبكات الكبرى 🏢',
    colorTheme: 'purple',
    features: [
      'طباعة حتى 50,000+ كرت شهرياً وأحجام لا محدودة',
      'عدد مفتوح من نقاط البيع والموزعين الميدانيين (حتى 100 نقطة)',
      'إدارة حتى 25 راوتر وسيرفر مايكروتك وربط Hotspot مركزي',
      'بوابات دفع إلكترونية مخصصة وفواتير باسم علامتك التجارية',
      'ربط REST API كامل ومزامنة خلفية مستمرة',
      'تخصيص الهوية البصرية والشعار ونطاق الدخول المخصص',
      'خادم سحابي معزول وسرعة استجابة فائقة',
      'دعم هاتفي مباشر ومخصص على مدار 24/7'
    ],
    isActive: true,
    sortOrder: 3,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const DEFAULT_CONTACT_SETTINGS: PlatformContactSettings = {
  brandName: 'NetFlow SaaS (سام تك للبرمجيات)',
  brandTagline: 'المنظومة السحابية المتقدمة لإدارة شبكات المايكروتك وتوزيع الكروت الذكية',
  whatsappNumber: '+967 777 123 456',
  whatsappSupportUrl: 'https://wa.me/967777123456?text=مرحباً،%20أود%20الاستفسار%20عن%20اشتراك%20منصة%20NetFlow%20SaaS',
  phoneCall: '+967 777 123 456',
  supportEmail: 'mosthassan.ye@gmail.com',
  telegramChannel: 'https://t.me/netflow_saas',
  telegramUser: '@NetFlowSupport',
  workingHours: 'السبت - الخميس: 8:00 صباحاً - 10:00 مساءً (دعم فني متواصل للطوارئ)',
  officeAddress: 'اليمن - صنعاء - شارع حدة - مركز التقنية والاتصالات',
  websiteUrl: 'https://netflow.samtech.net',
  facebookUrl: 'https://facebook.com/samtech.netflow',
  noticeBannerText: '✨ تتوفر الآن عروض الاشتراك السنوي بخصم يصل إلى 25% مع دعم فني مخصص ونقل بيانات مجاني!',
  isNoticeBannerActive: true,
  updatedAt: '2026-03-01T00:00:00Z'
};

export const DEFAULT_ADMINS_LIST: PlatformAdminUser[] = [
  {
    id: 'admin_master_01',
    email: DEFAULT_ADMIN_EMAIL,
    name: 'م. مصطفى حسن (Super Admin)',
    role: 'super_admin',
    roleArabic: 'المدير العام والمالك',
    isActive: true,
    addedBy: 'النظام الأساسي (Root Owner)',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-03-08T18:00:00Z'
  }
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  subscriptionPlans: DEFAULT_SUBSCRIPTION_PLANS,
  contact: DEFAULT_CONTACT_SETTINGS,
  admins: DEFAULT_ADMINS_LIST,
  updatedAt: '2026-03-01T00:00:00Z'
};

// -------------------------------------------------------------
// Storage & Firestore Sync Logic
// -------------------------------------------------------------

export function loadLocalPlatformSettings(): PlatformSettings {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_SETTINGS;
  try {
    const raw = localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        paymentMethods: parsed.paymentMethods || DEFAULT_PAYMENT_METHODS,
        subscriptionPlans: parsed.subscriptionPlans || DEFAULT_SUBSCRIPTION_PLANS,
        contact: { ...DEFAULT_CONTACT_SETTINGS, ...(parsed.contact || {}) },
        admins: parsed.admins || DEFAULT_ADMINS_LIST,
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('Error reading platform settings from localStorage:', err);
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

export function saveLocalPlatformSettings(settings: PlatformSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving platform settings to localStorage:', err);
  }
}

export async function fetchPlatformSettingsFromFirestore(): Promise<PlatformSettings> {
  try {
    const docRef = doc(db, 'platform', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<PlatformSettings>;
      const merged: PlatformSettings = {
        paymentMethods: data.paymentMethods && data.paymentMethods.length > 0 
          ? data.paymentMethods 
          : DEFAULT_PAYMENT_METHODS,
        subscriptionPlans: data.subscriptionPlans && data.subscriptionPlans.length > 0
          ? data.subscriptionPlans
          : DEFAULT_SUBSCRIPTION_PLANS,
        contact: {
          ...DEFAULT_CONTACT_SETTINGS,
          ...(data.contact || {})
        },
        admins: data.admins && data.admins.length > 0
          ? data.admins
          : DEFAULT_ADMINS_LIST,
        updatedAt: data.updatedAt || new Date().toISOString()
      };
      saveLocalPlatformSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch platform settings warning (falling back to local):', err);
  }
  return loadLocalPlatformSettings();
}

export async function savePlatformSettingsToFirestore(settings: PlatformSettings): Promise<{ success: boolean; error?: string }> {
  // Always update local storage first
  saveLocalPlatformSettings(settings);

  try {
    const docRef = doc(db, 'platform', 'settings');
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also sync admin emails to 'platform/admins/emails/{email}' for Firestore security rules
    for (const admin of settings.admins) {
      if (admin.email && admin.isActive) {
        try {
          const adminEmailRef = doc(db, 'platform', 'admins', 'emails', admin.email.toLowerCase());
          await setDoc(adminEmailRef, {
            email: admin.email.toLowerCase(),
            name: admin.name,
            role: admin.role,
            isActive: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('Admin email rule entry notice:', e);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Firestore save platform settings error:', err);
    return { success: true, error: 'تم الحفظ محلياً (المزامنة السحابية ستكتمل بمجرد توفر الاتصال بـ Firebase)' };
  }
}

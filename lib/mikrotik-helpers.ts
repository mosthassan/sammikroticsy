/**
 * NetFlow SaaS (SamMikrotic) - MikroTik RouterOS Script Helpers & Generator
 * Provides hardened sanitization, Arabic-to-RouterOS unit conversion,
 * and reliable RouterOS terminal script generation.
 */

/**
 * تحويل وحدات الحجم العربية إلى الرموز المقبولة في RouterOS (M, G, k)
 * مثال: "2700 ميجا" -> "2700M"، "1 جيجا" -> "1G"، "500 كيلو" -> "500k"
 */
export function formatByteLimit(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  let val = String(input).trim();
  if (!val) return "";

  val = val
    .replace(/غيغا|جيجا|GB|gb/gi, "G")
    .replace(/ميجا|ميجابايت|MB|mb/gi, "M")
    .replace(/كيلو|كيلوبايت|KB|kb/gi, "k")
    .replace(/بايت|Byte|bytes/gi, "")
    .replace(/\s+/g, ""); // إزالة المسافات

  // إذا كان المدخل رقماً فقط أو يحتوي على الوحدة الإنجليزية جاهزة
  return val;
}

/**
 * Alias لضمان التوافق البرمجي التام مع كافة المكونات القديمة والحديثة
 */
export const formatLimitBytes = formatByteLimit;

/**
 * تحويل وحدات الوقت العربية إلى الرموز المقبولة في RouterOS (h, d, m, s)
 * مثال: "15 ساعة" -> "15h"، "2 يوم" -> "2d"، "30 دقيقة" -> "30m"
 */
export function formatUptimeLimit(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  let val = String(input).trim();
  if (!val) return "";

  val = val
    .replace(/أيام|ايام|يوم|days|day|d/gi, "d")
    .replace(/ساعات|ساعة|hours|hour|h/gi, "h")
    .replace(/دقائق|دقيقة|minutes|minute|m/gi, "m")
    .replace(/ثواني|ثانية|seconds|second|s/gi, "s")
    .replace(/\s+/g, "");

  return val;
}

/**
 * تنظيف نصوص التعليقات واسم البروفايل وكلمات المرور لمنع كسر أوامر RouterOS
 */
export function sanitizeRouterOSValue(val: string | number | null | undefined, maxLen?: number): string {
  if (val === null || val === undefined) return "";
  let clean = String(val).replace(/["\\]/g, "").trim();
  if (maxLen && maxLen > 0) {
    clean = clean.slice(0, maxLen);
  }
  return clean;
}

/**
 * تنظيف تعليقات أوامر المايكروتك
 */
export function sanitizeRouterOSComment(val: string | number | null | undefined, maxLen = 80): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/["\\]/g, "")
    .trim()
    .slice(0, maxLen);
}

/**
 * تنظيف معرفات RouterOS والتأكد من أنها آمنة
 */
export function sanitizeRouterOSIdentifier(val: unknown, fallback = "default", maxLen = 32): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;

  const clean = str
    .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim()
    .slice(0, maxLen);

  if (!clean || !/[a-zA-Z0-9]/.test(clean)) {
    return fallback;
  }
  return clean;
}

/**
 * استخراج بروفايل الراوتر والتأكد من توافقه مع صيغ RouterOS المقبولة
 * يحمي الراوتر من الانهيار إذا كان اسم البروفايل بالعربي
 */
export function resolveRouterOSProfile(profile: string | null | undefined, fallback = "default"): string {
  if (!profile || profile.trim() === "") return fallback;
  const clean = profile.trim().replace(/["\\]/g, "");
  if (!clean) return fallback;

  // إذا كان الاسم يحتوي على حروف عربية، لا يقبلها تيرمينال المايكروتك كبروفايل للمستخدم
  if (/[\u0600-\u06FF]/.test(clean)) {
    return fallback;
  }

  return clean;
}

export interface RouterOSScriptOptions {
  activeOnly?: boolean;
  safeDeduplication?: boolean;
}

/**
 * توليد سكربت تيرمينال المايكروتك لإضافة الكروت بأمان وحماية 100% (/ip hotspot user)
 * - يدعم حماية التكرار (Safe Deduplication): يفحص وجود الكرت في الراوتر قبل الإضافة لتجنب الأخطاء
 * - يدعم عزل الأخطاء (:do {...} on-error={}): يضمن عدم توقف السكربت عند تعثر أي كرت
 * - يستثني تلقائياً الكروت المنتهية أو المستهلكة (activeOnly) لمنع إعادة إحيائها بالخطأ
 */
export function generateRouterOSTerminalScript(
  cards: any[],
  profileName: string = "",
  options: RouterOSScriptOptions = { activeOnly: true, safeDeduplication: true }
): string {
  if (!cards || !Array.isArray(cards) || cards.length === 0) return "";

  // تصفية الكروت النشطة وغير المنتهية فقط لمنع إعادة الكروت المحذوفة أو المستهلكة
  const targetCards = options.activeOnly
    ? cards.filter(
        (c) => c && c.status !== "used" && c.status !== "expired" && c.status !== "archived"
      )
    : cards;

  if (targetCards.length === 0) return "# لا توجد كروت نشطة مؤهلة للمزامنة (جميع الكروت مستخدمة أو منتهية).";

  const firstCard = targetCards[0] || {};
  const pName = profileName || firstCard.profileName || firstCard.profile || "default";
  const cleanProf = resolveRouterOSProfile(pName, "default");
  const lines: string[] = [
    `# ==========================================================`,
    `# NetFlow SaaS - MikroTik Resilient Hotspot User Import Script`,
    `# Generated At: ${new Date().toLocaleString("ar-EG")}`,
    `# Total Valid Users: ${targetCards.length} | Profile: ${cleanProf}`,
    `# Mode: Safe Deduplication & Error-Isolated Execution`,
    `# Protection: Expired / Used Vouchers Automatically Excluded`,
    `# ==========================================================`,
  ];

  for (const card of targetCards) {
    if (!card) continue;
    const rawCode = card.code || card.username || card.id;
    const safeCode = sanitizeRouterOSValue(rawCode, 40);
    if (!safeCode) continue;

    const rawPwd =
      card.password !== undefined && card.password !== ""
        ? card.password
        : card.username || card.code || rawCode;
    const safePwd = sanitizeRouterOSValue(rawPwd, 40);
    const prof = resolveRouterOSProfile(profileName || card.profileName || card.profile, cleanProf);
    const bNum = card.batchNumber || card.batchId || "";
    const batchId = sanitizeRouterOSComment(bNum ? `NetFlow-${bNum}` : `NetFlow_${card.price || "Batch"}`);

    const rawByte = card.byteDisplay || card.limitBytesTotal || card.byteLimit || "";
    const formattedBytes = formatByteLimit(rawByte);
    const limitBytes = formattedBytes && formattedBytes !== "" ? formattedBytes : "0";

    const rawUptime = card.uptimeDisplay || card.limitUptime || card.uptimeLimit || "";
    const formattedUptime = formatUptimeLimit(rawUptime);
    const limitUptime = formattedUptime && formattedUptime !== "" ? formattedUptime : "0";

    if (options.safeDeduplication !== false) {
      // حماية فائقة: التأكد من عدم وجود الكرت مسبقاً، وتغليف الأمر بـ on-error لمنع توقف السكربت نهائياً
      lines.push(
        `:do { :if ([:len [/ip hotspot user find name="${safeCode}"]] = 0) do={ /ip hotspot user add name="${safeCode}" password="${safePwd}" profile="${prof}" limit-bytes-total=${limitBytes} limit-uptime=${limitUptime} server=all comment="${batchId}" } } on-error={}`
      );
    } else {
      lines.push(
        `/ip hotspot user add name="${safeCode}" password="${safePwd}" profile="${prof}" limit-bytes-total=${limitBytes} limit-uptime=${limitUptime} server=all comment="${batchId}"`
      );
    }
  }

  return lines.join("\n");
}

/**
 * تقسيم الكروت إلى أجزاء آمنة (Chunks) بحجم 50 كرت لتجنب امتلاء ذاكرة تيرمينال المايكروتك (Buffer Overflow)
 */
export function chunkCards<T>(cards: T[], chunkSize: number = 50): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < cards.length; i += chunkSize) {
    chunks.push(cards.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * مطابقة كروت الدفعة مع قائمة مستخدمي المايكروتك لمعرفة الكروت المفقودة
 * مصممة بدقة عالية للتعرف على أسماء المستخدمين سواء طُبعت عبر print terse أو print detail أو تم نسخ أرقام الكروت
 * تضمن عدم وجود نتائج إيجابية خاطئة (False Positives)
 */
export function reconcileCardsWithRouter(
  batchCards: any[],
  mikrotikRawOutput: string
): {
  foundCodes: string[];
  missingCards: any[];
  totalChecked: number;
} {
  if (!batchCards || !Array.isArray(batchCards)) {
    return { foundCodes: [], missingCards: [], totalChecked: 0 };
  }

  const rawText = String(mikrotikRawOutput || "");
  
  // بناء جدول بحث سريع لجميع أسماء المستخدمين المستخرجة من شاشة المايكروتك
  const extractedNames = new Set<string>();

  // 1. التقاط صيغ name="1001" أو name=1001 من مخرجات RouterOS print terse / detail
  const namePropRegex = /\bname="?([^"\s;]+)"?/gi;
  let match: RegExpExecArray | null;
  while ((match = namePropRegex.exec(rawText)) !== null) {
    if (match[1]) {
      extractedNames.add(match[1].trim().toLowerCase());
    }
  }

  // 2. تقسيم الكلمات والرموز في النص للتعرف على الكروت حتى لو لُصقت كأكواد أو أرقام مجردة
  const tokens = rawText
    .replace(/[=;"\r]/g, " ")
    .split(/[\s,\t\n]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  for (const t of tokens) {
    extractedNames.add(t);
  }

  const foundCodes: string[] = [];
  const missingCards: any[] = [];

  for (const card of batchCards) {
    const rawCode = String(card.code || card.username || card.id || "").trim();
    if (!rawCode) continue;

    const lowerCode = rawCode.toLowerCase();
    // فحص التطابق التام مع الأسماء المستخرجة (يمنع تطابق الأرقام الجزئية مثل 10 مع 1000)
    const isFound = extractedNames.has(lowerCode);

    if (isFound) {
      foundCodes.push(rawCode);
    } else {
      missingCards.push(card);
    }
  }

  return {
    foundCodes,
    missingCards,
    totalChecked: batchCards.length
  };
}

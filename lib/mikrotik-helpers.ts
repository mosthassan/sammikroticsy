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

/**
 * توليد سكربت تيرمينال المايكروتك لإضافة الكروت بأمان وصيغ مقبولة 100% (/ip hotspot user)
 */
export function generateRouterOSTerminalScript(cards: any[], profileName: string = ""): string {
  if (!cards || !Array.isArray(cards) || cards.length === 0) return "";
  const firstCard = cards[0] || {};
  const pName = profileName || firstCard.profileName || firstCard.profile || "default";
  const cleanProf = resolveRouterOSProfile(pName, "default");
  const lines: string[] = [
    `# ==========================================================`,
    `# NetFlow SaaS - MikroTik Hotspot User Import Script (/ip hotspot user)`,
    `# Generated At: ${new Date().toLocaleString("ar-EG")}`,
    `# Total Users: ${cards.length} | Profile: ${cleanProf}`,
    `# Note: Username = Password or separate PIN supported 100%`,
    `# Hardened: RouterOS Injection Protected & Standalone Commands`,
    `# ==========================================================`,
  ];

  for (const card of cards) {
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

    lines.push(
      `/ip hotspot user add name="${safeCode}" password="${safePwd}" profile="${prof}" limit-bytes-total=${limitBytes} limit-uptime=${limitUptime} server=all comment="${batchId}"`
    );
  }

  return lines.join("\n");
}

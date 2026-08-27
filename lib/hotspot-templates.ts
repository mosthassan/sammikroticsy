import { HotspotPortalTemplate } from '@/types';

export const DEFAULT_ARABIC_ERRORS_TXT = `# ترجمة رسائل الخطأ العربية لمنظومة مايكروتك هوتسبوت (MikroTik Hotspot Arabic Errors)
internal-error = خطأ داخلي في نظام الشبكة، يرجى إعادة المحاولة
config-error = خطأ في إعدادات الشبكة، يرجى مراجعة إدارة الشبكة
not-logged-in = أنت لست مسجلاً للدخول بعد
already-logged-in = هذا الكرت مستخدم ومسجل حالياً على جهاز آخر
invalid-username = كود الكرت أو اسم المستخدم غير صحيح! تأكد من إدخال الأرقام بشكل سليم
invalid-password = كلمة المرور غير صحيحة
uptime-limit = عذراً، لقد انتهى رصيد الوقت المتاح لهذا الكرت
traffic-limit = عذراً، لقد استهلكت كامل رصيد البيانات (جيجابايت) لهذا الكرت
radius-timeout = الخادم لا يستجيب في الوقت الحالي، يرجى المحاولة بعد لحظات
auth-in-progress = جاري التحقق من بيانات الكرت وتسجيل الدخول...
session-timeout = انتهت صلاحية جلسة الاتصال، يرجى تسجيل الدخول مجدداً
`;

export const STANDARD_MD5_JS = `// MikroTik Hotspot CHAP MD5 Library
function hexMD5(str) {
  var hexcase = 0;
  var b64pad  = "";
  var chrsz   = 8;
  function core_md5(x, len) {
    x[len >> 5] |= 0x80 << ((len) % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    var a =  1732584193, b = -271733879, c = -1732584194, d =  271733878;
    for(var i = 0; i < x.length; i += 16) {
      var olda = a, oldb = b, oldc = c, oldd = d;
      a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
      d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
      c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
      b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
      a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
      d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
      c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
      b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
      a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
      d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
      c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
      b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
      a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
      d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
      c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
      b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
      a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
      d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
      c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
      b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
      a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
      d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
      c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
      b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
      a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
      d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
      c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
      b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
      a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
      d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
      c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
      b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
      a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
      d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
      c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
      b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
      a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
      d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
      c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
      b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
      a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
      d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
      c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
      b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
      a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
      d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
      c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
      b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
      a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
      d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
      c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
      b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
      a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
      d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
      c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
      b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
      a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
      d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
      c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
      b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
      a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
      d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
      c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
      b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
      a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd);
    }
    return [a, b, c, d];
  }
  function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
  }
  function md5_ff(a, b, c, d, x, s, t) { return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function md5_gg(a, b, c, d, x, s, t) { return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function md5_hh(a, b, c, d, x, s, t) { return md5_cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5_ii(a, b, c, d, x, s, t) { return md5_cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  function bit_rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function rstr2binl(input) {
    var output = Array(input.length >> 2);
    for(var i = 0; i < output.length; i++) output[i] = 0;
    for(var i = 0; i < input.length * 8; i += 8) output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
    return output;
  }
  function binl2hex(binarray) {
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for(var i = 0; i < binarray.length * 4; i++) {
      str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) + hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
    }
    return str;
  }
  return binl2hex(core_md5(rstr2binl(str), str.length * 8));
}
`;

export const PREBUILT_HOTSPOT_TEMPLATES: HotspotPortalTemplate[] = [
  {
    id: 'tpl_hotspot_cyber_neon',
    name: 'نيون سايبر داكن (Cyberpunk Dark Neon)',
    description: 'قالب مستقبلي داكن بتأثيرات زجاجية وإضاءات نيون جذابة لشبكات المقاهي ومراكز الألعاب.',
    themeStyle: 'cyber_neon',
    primaryColor: '#0ea5e9',
    secondaryColor: '#8b5cf6',
    bgColor: '#090d16',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    loginType: 'single_code',
    showVoucherRates: true,
    showSupportContact: true,
    showSpeedtestLink: true,
    showFreeTrial: true,
    welcomeHeadline: 'أهلاً بك في شبكتنا فائقة السرعة',
    welcomeSubheadline: 'أدخل كود الكرت واستمتع بإنترنت صاروخي ومستقر',
    supportPhone: '770000000',
    whatsappNumber: '967770000000',
    htmlLogin: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>تسجيل الدخول إلى الشبكة | NetFlow Hotspot</title>
  <style>
    :root {
      --primary: #0ea5e9;
      --secondary: #8b5cf6;
      --bg: #090d16;
      --card-bg: rgba(15, 23, 42, 0.75);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(56, 189, 248, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .portal-card {
      width: 100%;
      max-width: 400px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(14, 165, 233, 0.1);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .portal-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
    }
    .logo-container {
      width: 68px;
      height: 68px;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.2));
      border: 1px solid var(--border);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px auto;
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
    }
    .logo-icon { width: 34px; height: 34px; fill: var(--primary); }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 6px; color: #ffffff; letter-spacing: -0.5px; }
    p.subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
    
    .alert-box {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 12px;
      border-radius: 14px;
      font-size: 12.5px;
      margin-bottom: 18px;
      line-height: 1.5;
    }
    
    .input-group { margin-bottom: 16px; text-align: right; }
    .input-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
    .input-field {
      width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border: 1.5px solid rgba(148, 163, 184, 0.2);
      border-radius: 14px;
      padding: 14px 16px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-align: center;
      transition: all 0.2s ease;
      outline: none;
    }
    .input-field:focus {
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.35);
      background: #020617;
    }
    
    .btn-login {
      width: 100%;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 14px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      margin-top: 6px;
    }
    .btn-login:active { transform: scale(0.98); }
    
    .free-trial-btn {
      display: inline-block;
      margin-top: 14px;
      color: var(--primary);
      text-decoration: none;
      font-size: 12.5px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }
    
    .quick-badges {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 22px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 18px;
    }
    .badge-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 10px;
      font-size: 11.5px;
    }
    .badge-title { font-weight: 800; color: #ffffff; margin-bottom: 2px; }
    .badge-desc { font-size: 10px; color: var(--text-muted); }
    
    .footer-support {
      margin-top: 20px;
      font-size: 11px;
      color: var(--text-muted);
    }
    .support-link { color: #38bdf8; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>

  <div class="portal-card">
    <div class="logo-container">
      <svg class="logo-icon" viewBox="0 0 24 24">
        <path d="M12 3C6.95 3 3.1 4.85 0 6.69L12 21.31 24 6.69C20.9 4.85 17.05 3 12 3zm0 4c3.48 0 6.27 1.05 8.44 2.19L12 19.46 3.56 9.19C5.73 8.05 8.52 7 12 7z"/>
      </svg>
    </div>

    <h1>شبكة نت فلو الذكية</h1>
    <p class="subtitle">أدخل رمز الكرت لبدء تصفح الإنترنت الفائق</p>

    $(if error)
    <div class="alert-box">
      ⚠️ $(error)
    </div>
    $(endif)

    <form name="sendin" action="$(link-login-only)" method="post">
      <input type="hidden" name="username" />
      <input type="hidden" name="password" />
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
    </form>

    <form name="login" action="$(link-login-only)" method="post" onSubmit="return doLogin()">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />

      <div class="input-group">
        <label class="input-label">كود كرت الإنترنت (PIN / Code):</label>
        <input 
          type="text" 
          name="username" 
          id="username" 
          value="$(username)" 
          class="input-field" 
          placeholder="000000" 
          autocomplete="off" 
          autofocus 
          required 
        />
      </div>

      <input type="hidden" name="password" id="password" />

      <button type="submit" class="btn-login">
        تسجيل الدخول الآن ⚡
      </button>
    </form>

    $(if trial == 'yes')
    <a href="$(link-login-only)?dst=$(link-orig-esc)&amp;username=T-$(mac-esc)" class="free-trial-btn">
      🎁 تجربة مجانية سريعة (5 دقائق)
    </a>
    $(endif)

    <div class="quick-badges">
      <div class="badge-item">
        <div class="badge-title">🚀 سرعة تيربو</div>
        <div class="badge-desc">ألياف ضوئية فائقة الاستقرار</div>
      </div>
      <div class="badge-item">
        <div class="badge-title">🛡️ حماية مشفرة</div>
        <div class="badge-desc">اتصال آمن ومستمر 24/7</div>
      </div>
    </div>

    <div class="footer-support">
      لطلب الكروت والدعم الفني: <a href="tel:770000000" class="support-link">770000000</a>
    </div>
  </div>

  <script type="text/javascript" src="js/md5.js"></script>
  <script type="text/javascript">
    function doLogin() {
      var user = document.login.username.value.trim();
      document.login.username.value = user;
      document.login.password.value = user;
      
      $(if chap-id)
      document.sendin.username.value = user;
      document.sendin.password.value = hexMD5('$(chap-id)' + user + '$(chap-challenge)');
      document.sendin.submit();
      return false;
      $(endif)
      return true;
    }
  </script>
</body>
</html>`,
    htmlStatus: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>حالة الاتصال بالإنترنت | NetFlow Hotspot</title>
  $(if refresh-timeout)
  <meta http-equiv="refresh" content="$(refresh-timeout)">
  $(endif)
  <style>
    :root {
      --primary: #0ea5e9;
      --secondary: #8b5cf6;
      --bg: #090d16;
      --card-bg: rgba(15, 23, 42, 0.85);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(56, 189, 248, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .status-card {
      width: 100%;
      max-width: 420px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 26px 22px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.8);
      text-align: center;
    }
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 14px;
    }
    .status-dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 10px #34d399; }
    h1 { font-size: 19px; font-weight: 800; margin-bottom: 4px; }
    p.user-display { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
      text-align: right;
    }
    .stat-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 12px;
    }
    .stat-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600; }
    .stat-val { font-size: 14px; font-weight: 800; color: #38bdf8; font-family: monospace; }
    
    .btn-logout {
      width: 100%;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 12px;
      border-radius: 12px;
      font-weight: 800;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn-logout:hover { background: rgba(239, 68, 68, 0.25); color: #ffffff; }
  </style>
</head>
<body>
  <div class="status-card">
    <div class="badge-status">
      <span class="status-dot"></span>
      متصل بالإنترنت بنجاح
    </div>
    
    <h1>حالة اشتراك الكرت</h1>
    <p class="user-display">كود المستخدم: <strong>$(username)</strong></p>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">الوقت المستهلك:</div>
        <div class="stat-val">$(uptime)</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">الوقت المتبقي:</div>
        <div class="stat-val">$(session-time-left)</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">التحميل (تنزيل):</div>
        <div class="stat-val">$(bytes-in-nice)</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">الرفع (إرسال):</div>
        <div class="stat-val">$(bytes-out-nice)</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">عنوان IP:</div>
        <div class="stat-val">$(ip)</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">عنوان MAC:</div>
        <div class="stat-val">$(mac)</div>
      </div>
    </div>

    <form action="$(link-logout)" name="logout" onSubmit="return openLogout()">
      <button type="submit" class="btn-logout">
        قطع الاتصال وتسجيل الخروج 🚪
      </button>
    </form>
  </div>
</body>
</html>`,
    htmlAlogin: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>جاري تحويلك إلى الإنترنت...</title>
  <meta http-equiv="refresh" content="2; url=$(link-redirect)">
  <style>
    body {
      background: #090d16;
      color: #ffffff;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(14, 165, 233, 0.2);
      border-top-color: #0ea5e9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 20px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>تم تسجيل الدخول بنجاح!</h2>
  <p>جاري تحويلك إلى صفحتك المطلوبة خلال لحظات...</p>
  <script>location.href = '$(link-redirect)';</script>
</body>
</html>`,
    htmlLogout: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تم تسجيل الخروج | NetFlow Hotspot</title>
  <style>
    body {
      background: #090d16;
      color: #ffffff;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 16px;
    }
    .card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 380px;
      width: 100%;
    }
    .btn-return {
      display: inline-block;
      margin-top: 20px;
      background: #0ea5e9;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 12px;">👋</div>
    <h2 style="margin-bottom: 8px;">تم تسجيل الخروج بنجاح</h2>
    <p style="color: #94a3b8; font-size: 13px;">شكراً لاستخدامك شبكتنا. يمكنك إعادة تسجيل الدخول في أي وقت.</p>
    <a href="$(link-login)" class="btn-return">تسجيل الدخول من جديد</a>
  </div>
</body>
</html>`,
    errorsTxt: DEFAULT_ARABIC_ERRORS_TXT,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl_hotspot_corporate_blue',
    name: 'أزرق شبكات الفايبر (Corporate Fiber Blue)',
    description: 'تصميم كلاسيكي نظيف ومؤسسي باللون الأزرق لشبكات الفايبر المنزلية والمكتبية.',
    themeStyle: 'corporate_blue',
    primaryColor: '#2563eb',
    secondaryColor: '#0284c7',
    bgColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#60a5fa',
    loginType: 'single_code',
    showVoucherRates: true,
    showSupportContact: true,
    showSpeedtestLink: false,
    showFreeTrial: false,
    welcomeHeadline: 'بوابة الاتصال بشبكة الإنترنت',
    welcomeSubheadline: 'أدخل كود الاشتراك لتسجيل الدخول الفوري',
    supportPhone: '771234567',
    whatsappNumber: '967771234567',
    htmlLogin: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوابة تسجيل الدخول | Fiber Network</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body {
      background: #0f172a;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .login-container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 18px;
      padding: 30px 24px;
      max-width: 390px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    .header-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(37, 99, 235, 0.2);
      color: #60a5fa;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    h1 { font-size: 21px; margin-bottom: 6px; font-weight: 800; }
    p.desc { font-size: 13px; color: #94a3b8; margin-bottom: 22px; }
    .err-msg { background: #7f1d1d; color: #fecaca; padding: 10px; border-radius: 10px; font-size: 12px; margin-bottom: 16px; }
    .input-box {
      width: 100%;
      padding: 14px;
      background: #0f172a;
      border: 1.5px solid #475569;
      border-radius: 12px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 16px;
      outline: none;
    }
    .input-box:focus { border-color: #3b82f6; }
    .submit-btn {
      width: 100%;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 15px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <span class="header-tag">🌐 اتصال فايبر مستقر</span>
    <h1>شبكة الألياف الضوئية</h1>
    <p class="desc">أدخل رمز البطاقة للمتابعة إلى الإنترنت</p>

    $(if error)
    <div class="err-msg">$(error)</div>
    $(endif)

    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
      <input type="text" name="username" class="input-box" placeholder="كود الكرت (PIN)" required />
      <input type="hidden" name="password" />
      <button type="submit" class="submit-btn" onclick="document.login.password.value=document.login.username.value">دخول فوري</button>
    </form>
  </div>
</body>
</html>`,
    htmlStatus: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>حالة الاتصال</title>
  <style>
    body { background: #0f172a; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .box { background: #1e293b; padding: 24px; border-radius: 16px; width: 360px; text-align: center; }
  </style>
</head>
<body>
  <div class="box">
    <h2>أنت متصل بالإنترنت</h2>
    <p style="color: #94a3b8; margin: 12px 0;">المستخدم: $(username)</p>
    <p>الوقت المستهلك: $(uptime)</p>
    <form action="$(link-logout)" style="margin-top: 16px;">
      <button type="submit" style="padding: 10px 20px; background: #dc2626; color: #fff; border: none; border-radius: 8px; cursor: pointer;">تسجيل الخروج</button>
    </form>
  </div>
</body>
</html>`,
    htmlAlogin: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2; url=$(link-redirect)"></head><body style="background:#0f172a;color:#fff;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الدخول بنجاح!</h2><p>جاري تحويلك...</p></body></html>`,
    htmlLogout: `<!DOCTYPE html><html><head></head><body style="background:#0f172a;color:#fff;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الخروج</h2><a href="$(link-login)" style="color:#60a5fa;">تسجيل الدخول مجدداً</a></body></html>`,
    errorsTxt: DEFAULT_ARABIC_ERRORS_TXT,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl_hotspot_minimal_light',
    name: 'أبيض اقتصادي فائق السرعة (Minimal Light)',
    description: 'قالب خفيف جداً بحجم أقل من 5 كيلوبايت، مناسب للأجهزة الضعيفة والأماكن ذات التغطية الضعيفة.',
    themeStyle: 'minimal_light',
    primaryColor: '#0284c7',
    secondaryColor: '#475569',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    accentColor: '#0369a1',
    loginType: 'single_code',
    showVoucherRates: false,
    showSupportContact: true,
    showSpeedtestLink: false,
    showFreeTrial: false,
    welcomeHeadline: 'تسجيل الدخول للشبكة',
    welcomeSubheadline: 'أدخل كود الكرت في الخانة أدناه',
    supportPhone: '770000000',
    whatsappNumber: '967770000000',
    htmlLogin: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تسجيل الدخول</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body { background: #f1f5f9; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
    p { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .err { background: #fee2e2; color: #991b1b; padding: 8px; border-radius: 8px; font-size: 12px; margin-bottom: 14px; }
    input { width: 100%; padding: 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 14px; outline: none; }
    input:focus { border-color: #0284c7; }
    button { width: 100%; background: #0284c7; color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 800; font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>تسجيل الدخول</h1>
    <p>أدخل رمز الكرت لبدء التصفح</p>
    $(if error)<div class="err">$(error)</div>$(endif)
    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
      <input type="text" name="username" placeholder="رمز الكرت" required />
      <input type="hidden" name="password" />
      <button type="submit" onclick="document.login.password.value=document.login.username.value">دخول</button>
    </form>
  </div>
</body>
</html>`,
    htmlStatus: `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الحالة</title><style>body{background:#f1f5f9;font-family:sans-serif;text-align:center;padding-top:20vh;}</style></head><body><h2>أنت متصل بالإنترنت</h2><p>المستخدم: $(username)</p><p>الوقت: $(uptime)</p><form action="$(link-logout)"><button style="margin-top:15px;padding:8px 16px;">خروج</button></form></body></html>`,
    htmlAlogin: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2; url=$(link-redirect)"></head><body style="background:#f1f5f9;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الدخول</h2><p>جاري تحويلك...</p></body></html>`,
    htmlLogout: `<!DOCTYPE html><html><head></head><body style="background:#f1f5f9;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الخروج</h2><a href="$(link-login)">دخول مجدداً</a></body></html>`,
    errorsTxt: DEFAULT_ARABIC_ERRORS_TXT,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl_hotspot_luxury_gold',
    name: 'ذهبي ملكي للفنادق والمقاهي (Luxury VIP Gold)',
    description: 'طابع راقي بألوان ذهبية داكنة ومناسب للمطاعم والكافيهات الفاخرة والفنادق.',
    themeStyle: 'luxury_gold',
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    bgColor: '#141108',
    textColor: '#fef08a',
    accentColor: '#facc15',
    loginType: 'single_code',
    showVoucherRates: true,
    showSupportContact: true,
    showSpeedtestLink: false,
    showFreeTrial: true,
    welcomeHeadline: 'أهلاً بكم في واحة الإنترنت الفاخر',
    welcomeSubheadline: 'يسعدنا خدمتكم بأسرع اتصال لاسلكي وأعلى درجات الراحة',
    supportPhone: '770000000',
    whatsappNumber: '967770000000',
    htmlLogin: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Guest Portal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body {
      background: #141108;
      background-image: radial-gradient(circle at center, rgba(234, 179, 8, 0.1) 0%, transparent 70%);
      color: #fef08a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .gold-card {
      background: #1c180d;
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: 20px;
      padding: 30px 24px;
      max-width: 390px;
      width: 100%;
      text-align: center;
      box-shadow: 0 15px 35px rgba(0,0,0,0.7), 0 0 20px rgba(234, 179, 8, 0.1);
    }
    .crown { font-size: 32px; margin-bottom: 8px; }
    h1 { font-size: 20px; font-weight: 800; color: #fef9c3; margin-bottom: 6px; }
    p { font-size: 13px; color: #a1a1aa; margin-bottom: 22px; }
    .err-box { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 10px; border-radius: 10px; font-size: 12px; margin-bottom: 16px; }
    .gold-input {
      width: 100%;
      padding: 14px;
      background: #0f0d06;
      border: 1.5px solid rgba(234, 179, 8, 0.4);
      border-radius: 12px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 16px;
      outline: none;
    }
    .gold-input:focus { border-color: #eab308; box-shadow: 0 0 10px rgba(234, 179, 8, 0.3); }
    .gold-btn {
      width: 100%;
      background: linear-gradient(135deg, #eab308, #ca8a04);
      color: #000000;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-weight: 900;
      font-size: 15px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="gold-card">
    <div class="crown">👑</div>
    <h1>بوابة ضيوفنا الكرام</h1>
    <p>أدخل رمز الدخول للاستمتاع بإنترنت فائق السرعة</p>
    $(if error)<div class="err-box">$(error)</div>$(endif)
    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
      <input type="text" name="username" class="gold-input" placeholder="رمز الكرت" required />
      <input type="hidden" name="password" />
      <button type="submit" class="gold-btn" onclick="document.login.password.value=document.login.username.value">دخول فوري ⚡</button>
    </form>
  </div>
</body>
</html>`,
    htmlStatus: `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الحالة</title><style>body{background:#141108;color:#fef08a;font-family:sans-serif;text-align:center;padding-top:20vh;}</style></head><body><h2>أهلاً بك - أنت متصل</h2><p>المستخدم: $(username)</p><p>الوقت: $(uptime)</p><form action="$(link-logout)"><button style="margin-top:15px;padding:8px 16px;background:#eab308;color:#000;border:none;border-radius:8px;font-weight:bold;">خروج</button></form></body></html>`,
    htmlAlogin: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2; url=$(link-redirect)"></head><body style="background:#141108;color:#fef08a;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الدخول بنجاح</h2><p>جاري تحويلك...</p></body></html>`,
    htmlLogout: `<!DOCTYPE html><html><head></head><body style="background:#141108;color:#fef08a;text-align:center;padding-top:20vh;font-family:sans-serif;"><h2>تم تسجيل الخروج</h2><a href="$(link-login)" style="color:#facc15;">تسجيل الدخول مجدداً</a></body></html>`,
    errorsTxt: DEFAULT_ARABIC_ERRORS_TXT,
    createdAt: new Date().toISOString()
  }
];

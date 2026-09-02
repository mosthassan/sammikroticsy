import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_ARABIC_ERRORS_TXT } from "@/lib/hotspot-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, networkName, themeStyle, loginType, supportPhone } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'يرجى إدخال وصف صفحة الهوتسبوت المطلوبة' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'مفتاح GEMINI_API_KEY غير مهيأ' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a Senior Frontend UI/UX Architect and MikroTik RouterOS Hotspot Captive Portal Specialist.
Your mission is to generate a state-of-the-art, fully responsive, lightweight, mobile-first Arabic RTL MikroTik Hotspot portal package (HTML, CSS, JS).

CRITICAL MIKROTIK PORTAL REQUIREMENTS:
1. Standard MikroTik RouterOS Variables MUST be embedded accurately in login.html:
   - Form action MUST be: action="$(link-login-only)" method="post"
   - Hidden inputs: name="dst" value="$(link-orig)" and name="popup" value="true"
   - Username input: name="username" type="text" value="$(username)"
   - Password input: name="password" type="password" (or auto-assigned from username if voucher mode)
   - Error container: \`$(if error)<div class="error-box">⚠️ $(error)</div>$(endif)\`
   - CHAP MD5 block:
     \`$(if chap-id)\`
     \`<form name="sendin" action="$(link-login-only)" method="post">\`
     \`<input type="hidden" name="username" />\`
     \`<input type="hidden" name="password" />\`
     \`<input type="hidden" name="dst" value="$(link-orig)" />\`
     \`<input type="hidden" name="popup" value="true" />\`
     \`</form>\`
     \`<script type="text/javascript" src="js/md5.js"></script>\`
     \`<script type="text/javascript">\`
     \`function doLogin() { var u = document.login.username.value.trim(); document.login.username.value = u; document.login.password.value = u; $(if chap-id) document.sendin.username.value = u; document.sendin.password.value = hexMD5('$(chap-id)' + u + '$(chap-challenge)'); document.sendin.submit(); return false; $(endif) return true; }\`
     \`</script>\`
     \`$(endif)\`

2. status.html requirements:
   - Meta refresh: \`$(if refresh-timeout)<meta http-equiv="refresh" content="$(refresh-timeout)">$(endif)\`
   - Variables displayed in stylish cards: \`$(username)\`, \`$(uptime)\`, \`$(session-time-left)\`, \`$(bytes-in-nice)\`, \`$(bytes-out-nice)\`, \`$(ip)\`, \`$(mac)\`
   - Logout form: \`<form action="$(link-logout)" name="logout"><button type="submit">تسجيل الخروج</button></form>\`

3. Design & Styling (RTL Arabic):
   - Standalone single-file styles inside <style> for ultra-fast rendering on all mobile phones and routers.
   - Glassmorphism, modern rounded borders (18-24px), glowing subtle gradients, high contrast text, responsive touch targets (48px min).
   - Clean, professional Arabic typography (dir="rtl", lang="ar").

4. Output MUST adhere strictly to the JSON schema without any markdown formatting.`;

    const userPrompt = `Generate a complete MikroTik Hotspot portal based on:
Prompt: "${prompt}"
Network Name: "${networkName || 'NetFlow Smart WiFi'}"
Theme Direction: "${themeStyle || 'cyber_neon'}"
Login Mode: "${loginType || 'single_code'}"
Support Phone: "${supportPhone || '770000000'}"`;

    // Multi-model resilience: try gemini-3.7-flash then fallback models
    let rawText = '';
    const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-pro-preview"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }]
            }
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Creative Arabic portal template name (e.g. نيون الفضاء الذكي)" },
                description: { type: Type.STRING, description: "Short Arabic description of the portal style" },
                themeStyle: {
                  type: Type.STRING,
                  enum: ['cyber_neon', 'corporate_blue', 'minimal_light', 'luxury_gold', 'custom']
                },
                primaryColor: { type: Type.STRING, description: "Primary hex color" },
                secondaryColor: { type: Type.STRING, description: "Secondary accent hex color" },
                bgColor: { type: Type.STRING, description: "Background hex color" },
                textColor: { type: Type.STRING, description: "Main text hex color" },
                accentColor: { type: Type.STRING, description: "Accent highlight hex color" },
                welcomeHeadline: { type: Type.STRING, description: "Arabic welcome headline" },
                welcomeSubheadline: { type: Type.STRING, description: "Arabic welcome subheadline" },
                htmlLogin: { type: Type.STRING, description: "Complete, standalone HTML5 string for login.html" },
                htmlStatus: { type: Type.STRING, description: "Complete, standalone HTML5 string for status.html" },
                htmlAlogin: { type: Type.STRING, description: "Complete, standalone HTML5 string for alogin.html" },
                htmlLogout: { type: Type.STRING, description: "Complete, standalone HTML5 string for logout.html" }
              },
              required: [
                "name",
                "description",
                "themeStyle",
                "primaryColor",
                "secondaryColor",
                "bgColor",
                "textColor",
                "accentColor",
                "welcomeHeadline",
                "welcomeSubheadline",
                "htmlLogin",
                "htmlStatus",
                "htmlAlogin",
                "htmlLogout"
              ]
            }
          }
        });
        if (response.text) {
          rawText = response.text;
          break;
        }
      } catch (mErr: any) {
        lastError = mErr;
        console.warn(`Hotspot model ${modelName} failed, attempting next candidate...`, mErr.message);
      }
    }

    if (!rawText && lastError) {
      throw lastError;
    }

    const parsed = JSON.parse(rawText || '{}');

    return NextResponse.json({
      id: `tpl_hotspot_ai_${Date.now()}`,
      ...parsed,
      errorsTxt: DEFAULT_ARABIC_ERRORS_TXT,
      isAiGenerated: true,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating Hotspot portal with AI:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء توليد صفحة الهوتسبوت بالذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}

import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, networkName, stylePreset } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال وصف القالب المطلوب' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'مفتاح GEMINI_API_KEY غير مهيأ في بيئة العمل' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an elite vector graphics UI/UX designer and SVG engineer specializing in modern MikroTik WiFi Hotspot internet voucher cards (standard 850x500 aspect ratio, 63x33 mm printable card grid).
Your task is to generate a gorgeous, high-contrast, production-grade standalone SVG card template based on the user's description and style preset.

STRICT DESIGN SPECIFICATIONS:
1. Root element MUST be exactly:
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 500" width="100%" height="100%">
2. The SVG MUST be valid standalone XML with no external fonts or raster dependencies.
3. Rich visual architecture:
   - <defs> containing rich linear/radial gradients, glow filters, circuit patterns, or cyber grids.
   - Background rect with rx="28" filled with gradient or dark/tech texture.
   - Outer stylized border (rx="22", stroke-width="2" or "3").
   - Corner tech decors, circuit accent lines, geometric shapes, or aerodynamic wave lines.
4. Designated empty geometric placeholders/frames:
   - Header area: Top margin (y: 20-80) for Network Brand Title and Price Badge.
   - QR Code Box: Left side frame (x="40" y="130" width="220" height="220" rx="16" with subtle border or fill-opacity).
   - Voucher / PIN Code Box: Center/Right frame (x="290" y="130" width="520" height="220" rx="16") with inner illuminated code container (x="310" y="190" width="480" height="85" rx="12").
   - Footer area: Bottom area (y: 380-470) for Expiration / Limits / Support contacts.
5. NO actual hardcoded numbers, fake codes, or dynamic text strings; ONLY stylistic background graphics, gradient defs, cyber borders, tech lines, and placeholder boxes.
6. The SVG must be clean, responsive, and render crisply inside both web previews and A4 print engines.`;

    const userPrompt = `Generate a high-grade SVG internet card template.
Description / Prompt: "${prompt}"
Network Name: "${networkName || 'سام تك لإدارة الشبكات'}"
Style Preset: "${stylePreset || 'cyber_neon'}"

Return JSON matching the schema with creative Arabic name, full SVG code, and harmonized color palette.`;

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
                name: {
                  type: Type.STRING,
                  description: "Short creative Arabic title for the template (e.g. نيون الفضاء السيبراني)"
                },
                svgCode: {
                  type: Type.STRING,
                  description: "Clean valid standalone SVG string with viewBox 0 0 850 500"
                },
                textColor: {
                  type: Type.STRING,
                  description: "Primary text hex color code (e.g. #ffffff)"
                },
                accentColor: {
                  type: Type.STRING,
                  description: "Accent highlight hex color (e.g. #38bdf8)"
                },
                badgeBg: {
                  type: Type.STRING,
                  description: "Price badge background hex color (e.g. #f59e0b)"
                },
                badgeTextColor: {
                  type: Type.STRING,
                  description: "Price badge text hex color (e.g. #000000)"
                },
                bgColor: {
                  type: Type.STRING,
                  description: "Dominant background hex color (e.g. #0f172a)"
                },
                themeStyle: {
                  type: Type.STRING,
                  enum: ['cyber_neon', 'modern_dark', 'clean_white', 'royal_gold', 'sky_blue', 'emerald_pro']
                }
              },
              required: [
                "name",
                "svgCode",
                "textColor",
                "accentColor",
                "badgeBg",
                "badgeTextColor",
                "bgColor",
                "themeStyle"
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
        console.warn(`Model ${modelName} failed, attempting next candidate...`, mErr.message);
      }
    }

    if (!rawText && lastError) {
      throw lastError;
    }

    const parsed = JSON.parse(rawText || '{}');

    // Clean up SVG string
    let cleanSvg = parsed.svgCode || '';
    cleanSvg = cleanSvg
      .replace(/^```svg\s*/i, '')
      .replace(/^```xml\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Ensure root SVG tag has required attributes
    if (!cleanSvg.includes('xmlns=')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!cleanSvg.includes('viewBox=')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg viewBox="0 0 850 500"');
    }

    // Generate Base64 Data URI
    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;

    return NextResponse.json({
      success: true,
      id: `tpl_ai_${Date.now()}`,
      name: parsed.name || 'قالب ذكي بالذكاء الاصطناعي',
      svgCode: cleanSvg,
      svgDataUri,
      textColor: parsed.textColor || '#ffffff',
      accentColor: parsed.accentColor || '#38bdf8',
      badgeBg: parsed.badgeBg || '#f59e0b',
      badgeTextColor: parsed.badgeTextColor || '#000000',
      bgColor: parsed.bgColor || '#0f172a',
      themeStyle: parsed.themeStyle || stylePreset || 'cyber_neon'
    });
  } catch (error: any) {
    console.error('Error generating AI template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء توليد القالب بالذكاء الاصطناعي'
      },
      { status: 500 }
    );
  }
}

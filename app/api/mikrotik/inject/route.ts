export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { executeAutoInjectionPipeline, RouterConfig } from '@/lib/mikrotik-api';
import { CardInjectionItem, MikroTikInjectionAudit } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch_id, batchId, cards, routerConfig } = body;

    const effectiveBatchId = batch_id || batchId || 'NetFlow-B-001';

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        {
          batch_id: effectiveBatchId,
          total_cards: 0,
          successfully_added: 0,
          already_exist: 0,
          failed_cards: 0,
          errors_details: [{ card: 'NONE', error: 'لم يتم إرسال أي كروت للحقن' }],
          status: 'failed'
        } as MikroTikInjectionAudit,
        { status: 400 }
      );
    }

    // Clean and validate card list
    const preparedCards: CardInjectionItem[] = cards.map((c: any) => ({
      name: String(c.name || c.code || c.username || '').trim(),
      password: String(c.password || c.code || c.name || '').trim(),
      profile: 'default', // Strictly enforced rule: always "default"
      limitBytesTotal: c.limitBytesTotal || c.byteLimit || undefined,
      comment: effectiveBatchId
    })).filter(c => c.name.length > 0);

    // Environment variables fallback for MikroTik REST API
    // Connection & Port Target:
    // process.env.MIKROTIK_HOST (Router domain or IP)
    // process.env.MIKROTIK_USER (Authorized user: mosthassan)
    // process.env.MIKROTIK_PASS (API encrypted password)
    // Dedicated port: 8081 (to avoid conflict with internal hotspot port 80)
    // Target: http://<ROUTER_HOST>:8081/rest/ip/hotspot/user
    const envHost = process.env.MIKROTIK_HOST?.trim();
    const envUser = process.env.MIKROTIK_USER?.trim() || 'mosthassan';
    const envPass = process.env.MIKROTIK_PASS || '';
    const envPort = 8081;

    // Resolve effective host and credentials with robust fallbacks
    const effectiveHost = routerConfig?.host?.trim() || routerConfig?.routerIp?.trim() || envHost || '192.168.88.1';
    const effectiveUser = routerConfig?.username?.trim() || routerConfig?.apiUser?.trim() || envUser;
    const effectivePass = (routerConfig?.password !== undefined && routerConfig.password !== '') 
      ? routerConfig.password 
      : envPass;

    // Prepare router configuration with safe defaults
    const effectiveConfig: RouterConfig = {
      host: effectiveHost,
      port: envPort,
      username: effectiveUser,
      password: effectivePass,
      useHttps: false, // Strictly HTTP on dedicated port 8081
      timeoutMs: routerConfig?.timeoutMs ? Number(routerConfig.timeoutMs) : 5000,
      mockSimulation: Boolean(routerConfig?.mockSimulation)
    };

    // Execute the auto-injection pipeline
    const auditResult: MikroTikInjectionAudit = await executeAutoInjectionPipeline(
      preparedCards,
      effectiveBatchId,
      effectiveConfig
    );

    return NextResponse.json(auditResult, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/mikrotik/inject:', error);
    return NextResponse.json(
      {
        batch_id: 'UNKNOWN',
        total_cards: 0,
        successfully_added: 0,
        already_exist: 0,
        failed_cards: 0,
        errors_details: [{ card: 'SYSTEM', error: error?.message || 'خطأ داخلي في معالجة طلب الحقن' }],
        status: 'failed'
      } as MikroTikInjectionAudit,
      { status: 500 }
    );
  }
}

/**
 * Diagnostic GET endpoint to verify connection settings and target route
 * http://<ROUTER_HOST>:8081/rest/ip/hotspot/user
 */
export async function GET() {
  const host = process.env.MIKROTIK_HOST || '192.168.88.1';
  const port = 8081;
  const user = process.env.MIKROTIK_USER || 'mosthassan';
  const hasPass = Boolean(process.env.MIKROTIK_PASS);
  const targetUrl = `http://${host}:${port}/rest/ip/hotspot/user`;

  return NextResponse.json({
    status: 'ready',
    target_endpoint: targetUrl,
    method: 'PUT /rest/ip/hotspot/user',
    dedicated_port: port,
    default_user: user,
    host_configured: Boolean(process.env.MIKROTIK_HOST),
    pass_configured: hasPass,
    router_host: host,
    info: 'جميع طلبات الـ REST API تتم حصراً عبر المنفذ المخصص (8081) لتفادي تعارض منفذ الهوتسبوت الداخلي 80'
  });
}

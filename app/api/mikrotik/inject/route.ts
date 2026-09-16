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

    // Prepare router configuration with safe defaults
    const effectiveConfig: RouterConfig = {
      host: routerConfig?.host || routerConfig?.routerIp || '10.0.0.1',
      port: routerConfig?.port ? Number(routerConfig.port) : 443,
      username: routerConfig?.username || routerConfig?.apiUser || 'admin',
      password: routerConfig?.password || routerConfig?.apiPassword || '',
      useHttps: routerConfig?.useHttps ?? true,
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

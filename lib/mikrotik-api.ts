import http from 'http';
import https from 'https';
import { CardInjectionItem, InjectionErrorDetail, MikroTikInjectionAudit } from '@/types';

export interface RouterConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  useHttps?: boolean;
  timeoutMs?: number;
  mockSimulation?: boolean;
}

export interface SingleCardInjectionResult {
  card: string;
  status: 'added' | 'already_exists' | 'failed';
  id?: string;
  error?: string;
  httpStatus?: number;
}

/**
 * Checks if an IP address is in RFC1918 private space
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  if (clean === 'localhost' || clean === '127.0.0.1') return true;
  if (/^10\./.test(clean)) return true;
  if (/^192\.168\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  return false;
}

/**
 * Executes an HTTP/HTTPS REST request to MikroTik RouterOS v7
 */
function sendMikroTikHttpRequest(
  method: 'PUT' | 'POST' | 'GET',
  path: string,
  payload: Record<string, any> | null,
  config: RouterConfig
): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const isHttps = config.useHttps ?? (config.port === 443 || !config.port);
    const client = isHttps ? https : http;
    const defaultPort = isHttps ? 443 : 80;
    const port = config.port || defaultPort;
    const timeout = config.timeoutMs || 6000;

    const authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password || ''}`).toString('base64');
    const postData = payload ? JSON.stringify(payload) : '';

    const options: https.RequestOptions = {
      hostname: config.host,
      port,
      path,
      method,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      // RouterOS uses self-signed certificates by default for www-ssl
      rejectUnauthorized: false
    };

    const req = client.request(options, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          data: responseBody
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Connection to MikroTik at ${config.host}:${port} timed out after ${timeout}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Injects a single card into MikroTik RouterOS v7 REST API
 * Strictly enforces:
 * - profile: "default"
 * - clean payload with quota-only limit-bytes-total
 * - no limit-uptime if volume only
 */
export async function injectSingleCard(
  card: CardInjectionItem,
  batchComment: string,
  config: RouterConfig
): Promise<SingleCardInjectionResult> {
  // Construct clean, compliant JSON payload
  const payload: Record<string, any> = {
    name: card.name,
    password: card.password || card.name,
    profile: 'default', // Strictly enforced rule: always "default"
    comment: batchComment
  };

  if (card.limitBytesTotal) {
    payload['limit-bytes-total'] = String(card.limitBytesTotal);
  }

  // Handle Mock Simulation mode (when testing without physical router connectivity)
  if (config.mockSimulation) {
    // Deterministic simulation for preview/testing
    if (card.name.endsWith('EXISTS')) {
      return {
        card: card.name,
        status: 'already_exists',
        httpStatus: 400,
        error: 'already exists'
      };
    }
    return {
      card: card.name,
      status: 'added',
      id: `*sim_${Math.random().toString(36).substring(2, 8)}`,
      httpStatus: 201
    };
  }

  try {
    // Preferred RouterOS v7 method: PUT /rest/ip/hotspot/user
    let response = await sendMikroTikHttpRequest('PUT', '/rest/ip/hotspot/user', payload, config);

    // If 404 or method not allowed, try POST /rest/ip/hotspot/user/add
    if (response.statusCode === 404 || response.statusCode === 405) {
      response = await sendMikroTikHttpRequest('POST', '/rest/ip/hotspot/user/add', payload, config);
    }

    const { statusCode, data } = response;
    let parsedData: any = {};
    try {
      if (data) parsedData = JSON.parse(data);
    } catch {
      parsedData = { raw: data };
    }

    // Check for success (201 Created or 200 with ID/ret)
    if (statusCode === 201 || statusCode === 200) {
      const generatedId = parsedData['.id'] || parsedData['ret'] || `*${card.name}`;
      return {
        card: card.name,
        status: 'added',
        id: generatedId,
        httpStatus: statusCode
      };
    }

    // Check for "already exists" (400 Bad Request or 409 Conflict)
    const lowerBody = (data || '').toLowerCase();
    if (
      statusCode === 400 && 
      (lowerBody.includes('already exists') || lowerBody.includes('already have user') || lowerBody.includes('duplicate'))
    ) {
      return {
        card: card.name,
        status: 'already_exists',
        httpStatus: statusCode,
        error: 'مستخدم مضاف مسبقاً (already exists)'
      };
    }

    // Other API errors (e.g. 401 Unauthorized, 403 Forbidden, 400 Bad Payload)
    const errorMessage = parsedData.detail || parsedData.message || parsedData.error || data || `HTTP Error ${statusCode}`;
    return {
      card: card.name,
      status: 'failed',
      httpStatus: statusCode,
      error: `رفض الراوتر [${statusCode}]: ${errorMessage}`
    };

  } catch (err: any) {
    const isTimeout = err?.message?.includes('timed out') || err?.code === 'ETIMEDOUT';
    const isConnRefused = err?.code === 'ECONNREFUSED';
    const isUnreachable = err?.code === 'EHOSTUNREACH' || err?.code === 'ENETUNREACH';

    let errorDetail = err?.message || 'خطأ غير معروف في الاتصال';
    if (isTimeout) {
      errorDetail = `انتهت مهلة الاتصال بالراوتر (${config.host}:${config.port || 443})`;
    } else if (isConnRefused) {
      errorDetail = `تم رفض الاتصال من الراوتر (${config.host}:${config.port || 443}) - تأكد من تفعيل خدمة www/www-ssl`;
    } else if (isUnreachable) {
      errorDetail = `تعذر الوصول لعنوان الراوتر (${config.host})`;
    }

    return {
      card: card.name,
      status: 'failed',
      error: errorDetail
    };
  }
}

/**
 * Auto-Injection Pipeline:
 * Processes cards in concurrent batches, audits each card individually,
 * and returns the exact statistical audit response object.
 */
export async function executeAutoInjectionPipeline(
  cards: CardInjectionItem[],
  batchComment: string,
  routerConfig: RouterConfig
): Promise<MikroTikInjectionAudit> {
  const totalCards = cards.length;
  let successfullyAdded = 0;
  let alreadyExist = 0;
  let failedCards = 0;
  const errorsDetails: InjectionErrorDetail[] = [];

  // Check if router IP is private and likely unreachable from cloud
  const isPrivate = isPrivateIp(routerConfig.host);

  // Process cards in chunks of 4 for optimal concurrency without overwhelming router
  const CHUNK_SIZE = 4;
  for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
    const chunk = cards.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(card => injectSingleCard(card, batchComment, routerConfig));
    const results = await Promise.all(promises);

    for (const res of results) {
      if (res.status === 'added') {
        successfullyAdded++;
      } else if (res.status === 'already_exists') {
        alreadyExist++;
      } else {
        failedCards++;
        errorsDetails.push({
          card: res.card,
          error: res.error || 'فشلت الإضافة لسبب غير محدد',
          code: res.httpStatus
        });
      }
    }

    // If first chunk all failed with network reachability error on a private IP,
    // abort early to avoid making the user wait for 100 cards to timeout sequentially.
    if (i === 0 && failedCards === chunk.length && (isPrivate || routerConfig.host === '10.0.0.1')) {
      const firstError = errorsDetails[0]?.error || '';
      if (firstError.includes('مهلة الاتصال') || firstError.includes('تعذر الوصول') || firstError.includes('رفض الاتصال') || firstError.includes('timed out')) {
        // Mark remaining cards with clear explanation
        const remainingCards = cards.slice(CHUNK_SIZE);
        for (const rem of remainingCards) {
          failedCards++;
          errorsDetails.push({
            card: rem.name,
            error: `تم تخطي الكرت لأن الراوتر (${routerConfig.host}) غير متاح للاتصال المباشر`,
            code: 504
          });
        }
        break;
      }
    }
  }

  let finalStatus: 'completed' | 'partial' | 'failed' = 'completed';
  if (failedCards > 0) {
    finalStatus = successfullyAdded > 0 ? 'partial' : 'failed';
  }

  return {
    batch_id: batchComment,
    total_cards: totalCards,
    successfully_added: successfullyAdded,
    already_exist: alreadyExist,
    failed_cards: failedCards,
    errors_details: errorsDetails,
    status: finalStatus,
    connection_type: routerConfig.mockSimulation ? 'mock_simulation' : (isPrivate ? 'private_lan' : 'public_rest_v7'),
    router_ip: routerConfig.host,
    timestamp: new Date().toISOString()
  };
}

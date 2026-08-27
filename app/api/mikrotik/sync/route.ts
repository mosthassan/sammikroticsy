import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const format = searchParams.get('format') || 'rsc';

  if (!token) {
    return NextResponse.json({ error: 'Missing sync token' }, { status: 401 });
  }

  // Sample pending batch script for RouterOS /tool fetch or REST API
  const sampleUsers = [
    { name: 'NW-942812', password: '942812', profile: '1GB_24H', comment: 'NetFlow_Cloud_Batch' },
    { name: 'NW-731904', password: '731904', profile: '2.5GB_24H', comment: 'NetFlow_Cloud_Batch' }
  ];

  if (format === 'json') {
    return NextResponse.json({
      status: 'ok',
      syncTime: new Date().toISOString(),
      pendingUsersCount: sampleUsers.length,
      users: sampleUsers
    });
  }

  // Return MikroTik .rsc executable script file format
  const scriptContent = [
    `# NetFlow SaaS - Auto Synchronized Hotspot Users`,
    `# Timestamp: ${new Date().toISOString()}`,
    `/ip hotspot user`,
    ...sampleUsers.map(u => `add name="${u.name}" password="${u.password}" profile="${u.profile}" comment="${u.comment}"`)
  ].join('\n');

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="netflow_sync.rsc"'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, users, routerIdentity } = body;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'MikroTik sync payload processed successfully',
      importedCount: Array.isArray(users) ? users.length : 0,
      routerIdentity: routerIdentity || 'MikroTik-RouterOS-v7',
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

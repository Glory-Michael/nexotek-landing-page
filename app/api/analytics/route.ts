import { NextResponse } from 'next/server';

const BASE = 'https://vercel.com/api/web/insights';

async function fetchStats(type: string, params: URLSearchParams, token: string) {
  const url = `${BASE}/stats/${type}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Analytics fetch failed: ${type} ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json();
}

async function fetchTimeseries(params: URLSearchParams, token: string) {
  const res = await fetch(`${BASE}/timeseries?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Analytics timeseries failed: ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json();
}

export async function GET(request: Request) {
  const token = process.env.ANALYTICS_API_TOKEN;
  const projectId = process.env.ANALYTICS_PROJECT_ID;
  const teamId = process.env.ANALYTICS_TEAM_ID;

  if (!token || !projectId) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';
  const debug = searchParams.get('debug') === '1';

  // Debug mode: test a single API call and return the raw response
  if (debug) {
    const testParams = new URLSearchParams({
      projectId,
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
      environment: 'production',
      limit: '5',
      ...(teamId ? { teamId } : {}),
    });
    const res = await fetch(`${BASE}/stats/path?${testParams}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const body = await res.text();
    return NextResponse.json({
      status: res.status,
      tokenPrefix: token.slice(0, 8) + '...',
      projectId,
      teamId,
      url: `${BASE}/stats/path?${testParams}`,
      body: body.slice(0, 500),
    });
  }

  const now = new Date();
  let from: Date;
  switch (period) {
    case '24h':
      from = new Date(now.getTime() - 86400000);
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 86400000);
      break;
    default:
      from = new Date(now.getTime() - 7 * 86400000);
  }

  const baseParams = new URLSearchParams({
    projectId,
    from: from.toISOString(),
    to: now.toISOString(),
    environment: 'production',
    limit: '20',
    ...(teamId ? { teamId } : {}),
  });

  try {
    const [pages, countries, browsers, os, devices, referrers, timeseries] = await Promise.all([
      fetchStats('path', baseParams, token),
      fetchStats('country', baseParams, token),
      fetchStats('client_name', baseParams, token),
      fetchStats('os_name', baseParams, token),
      fetchStats('device_type', baseParams, token),
      fetchStats('referrer_hostname', baseParams, token),
      fetchTimeseries(baseParams, token),
    ]);

    // Compute totals — API returns { key, total, devices }
    let totalPageViews = 0;
    let totalVisitors = 0;
    if (pages?.data) {
      for (const entry of pages.data) {
        totalPageViews += entry.total ?? 0;
        totalVisitors += entry.devices ?? 0;
      }
    }

    const normalize = (raw: unknown) =>
      Array.isArray(raw)
        ? raw.map((e: { key?: string; total?: number; devices?: number }) => ({
            key: e.key || 'Unknown',
            total: e.total ?? 0,
            devices: e.devices ?? 0,
          }))
        : [];

    return NextResponse.json({
      period,
      summary: { pageViews: totalPageViews, visitors: totalVisitors },
      timeseries: normalize(timeseries?.data),
      countries: normalize(countries?.data),
      browsers: normalize(browsers?.data),
      os: normalize(os?.data),
      devices: normalize(devices?.data),
      pages: normalize(pages?.data),
      referrers: normalize(referrers?.data),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

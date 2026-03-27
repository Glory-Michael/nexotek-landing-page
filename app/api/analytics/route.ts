import { NextResponse } from 'next/server';

const VERCEL_API = 'https://vercel.com/api/web/insights';

async function fetchAnalytics(path: string, params: URLSearchParams, token: string) {
  const res = await fetch(`${VERCEL_API}/${path}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: Request) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';

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
    ...(teamId ? { teamId } : {}),
  });

  try {
    const [
      timeseries,
      countries,
      browsers,
      os,
      devices,
      pages,
      referrers,
    ] = await Promise.all([
      fetchAnalytics('stats/path', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '100'); return p; })(), token),
      fetchAnalytics('stats/country', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '20'); return p; })(), token),
      fetchAnalytics('stats/browser', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '10'); return p; })(), token),
      fetchAnalytics('stats/os', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '10'); return p; })(), token),
      fetchAnalytics('stats/device', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '10'); return p; })(), token),
      fetchAnalytics('stats/path', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '10'); return p; })(), token),
      fetchAnalytics('stats/referrer', (() => { const p = new URLSearchParams(baseParams); p.set('limit', '10'); return p; })(), token),
    ]);

    // Compute totals from path data
    let totalPageViews = 0;
    let totalVisitors = 0;
    if (pages?.data) {
      for (const entry of pages.data) {
        totalPageViews += entry.pageViews ?? 0;
        totalVisitors += entry.visitors ?? 0;
      }
    }

    return NextResponse.json({
      period,
      summary: {
        pageViews: totalPageViews,
        visitors: totalVisitors,
      },
      timeseries: timeseries?.data ?? [],
      countries: countries?.data ?? [],
      browsers: browsers?.data ?? [],
      os: os?.data ?? [],
      devices: devices?.data ?? [],
      pages: pages?.data ?? [],
      referrers: referrers?.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

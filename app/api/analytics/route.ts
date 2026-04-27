import { NextResponse } from 'next/server';

const GQL = 'https://api.cloudflare.com/client/v4/graphql';

async function gql(token: string, query: string) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ── 1dGroups: summary + timeseries + countries (supports full date ranges) ──
async function fetchDailyGroups(token: string, zoneId: string, fromStr: string, toStr: string) {
  const data = await gql(token, `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequests1dGroups(
          limit: 31
          filter: { date_geq: "${fromStr}", date_lt: "${toStr}" }
          orderBy: [date_ASC]
        ) {
          sum { requests threats countryMap { clientCountryName requests } }
          uniq { uniques }
          dimensions { date }
        }
      }
    }
  }`);
  return data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
}

// ── AdaptiveGroups: devices + OS + browsers + pages (1-day window per call) ──
async function fetchOneDayAdaptive(token: string, zoneId: string, from: string, to: string) {
  const f = `datetime_geq: "${from}", datetime_lt: "${to}", requestSource: "eyeball"`;
  const data = await gql(token, `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        devices:  httpRequestsAdaptiveGroups(limit: 10, filter: { ${f} }, orderBy: [count_DESC]) { count dimensions { clientDeviceType } }
        os:       httpRequestsAdaptiveGroups(limit: 10, filter: { ${f} }, orderBy: [count_DESC]) { count dimensions { userAgentOS } }
        browsers: httpRequestsAdaptiveGroups(limit: 10, filter: { ${f} }, orderBy: [count_DESC]) { count dimensions { userAgentBrowser } }
        pages:    httpRequestsAdaptiveGroups(limit: 10, filter: { ${f} }, orderBy: [count_DESC]) { count dimensions { clientRequestPath } }
      }
    }
  }`);
  return data?.viewer?.zones?.[0] ?? {};
}

function accumulate(map: Record<string, number>, rows: Array<{ count: number; dimensions: Record<string, string> }>) {
  for (const row of rows ?? []) {
    const key = Object.values(row.dimensions)[0] || 'Unknown';
    map[key] = (map[key] ?? 0) + row.count;
  }
}

function toSortedArray(map: Record<string, number>) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([key, total]) => ({ key, total, devices: total }));
}

export async function GET(request: Request) {
  const token = process.env.CF_ANALYTICS_TOKEN;
  const zoneId = process.env.CF_ZONE_ID;

  if (!token || !zoneId) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';
  const debug = searchParams.get('debug') === '1';

  const now = new Date();
  let days: number;
  switch (period) {
    case '24h': days = 1; break;
    case '30d': days = 30; break;
    default:    days = 7;
  }

  // date_geq / date_lt use YYYY-MM-DD (inclusive start, exclusive end)
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const toDate  = new Date(now);
  toDate.setDate(toDate.getDate() + 1);   // +1 so today is included
  const toStr   = toDate.toISOString().slice(0, 10);

  try {
    // ── Build per-day ranges for adaptive queries ──────────────────────────
    const dayRanges: Array<{ from: string; to: string }> = [];
    for (let i = 0; i < days; i++) {
      const start = new Date(fromDate);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dayRanges.push({
        from: start.toISOString().replace('.000Z', 'Z').replace(/\.\d+Z$/, 'Z'),
        to:   end.toISOString().replace(/\.\d+Z$/, 'Z'),
      });
    }

    // ── Fire both query types in parallel ──────────────────────────────────
    const [dailyGroups, ...adaptiveResults] = await Promise.all([
      fetchDailyGroups(token, zoneId, fromStr, toStr),
      ...dayRanges.map(({ from, to }) => fetchOneDayAdaptive(token, zoneId, from, to)),
    ]);

    if (debug) {
      return NextResponse.json({ period, fromStr, toStr, dayCount: dayRanges.length, dailyGroups, adaptiveResults });
    }

    // ── Aggregate 1dGroups ─────────────────────────────────────────────────
    let totalRequests = 0;
    let totalVisitors = 0;
    let totalThreats  = 0;
    const countryTotals: Record<string, number> = {};

    const timeseries = (dailyGroups as Array<{
      sum: { requests: number; threats: number; countryMap: Array<{ clientCountryName: string; requests: number }> };
      uniq: { uniques: number };
      dimensions: { date: string };
    }>).map((g) => {
      const req = g.sum?.requests ?? 0;
      const uq  = g.uniq?.uniques ?? 0;
      totalRequests += req;
      totalVisitors += uq;
      totalThreats  += g.sum?.threats ?? 0;
      for (const c of g.sum?.countryMap ?? []) {
        countryTotals[c.clientCountryName] = (countryTotals[c.clientCountryName] ?? 0) + c.requests;
      }
      return { key: g.dimensions?.date ?? '', total: req, devices: uq };
    });

    // ── Aggregate adaptive results ─────────────────────────────────────────
    const deviceTotals:  Record<string, number> = {};
    const osTotals:      Record<string, number> = {};
    const browserTotals: Record<string, number> = {};
    const pageTotals:    Record<string, number> = {};

    for (const r of adaptiveResults) {
      accumulate(deviceTotals,  r.devices  ?? []);
      accumulate(osTotals,      r.os       ?? []);
      accumulate(browserTotals, r.browsers ?? []);
      accumulate(pageTotals,    r.pages    ?? []);
    }

    return NextResponse.json({
      period,
      summary:    { pageViews: totalRequests, visitors: totalVisitors, threats: totalThreats },
      timeseries,
      countries:  toSortedArray(countryTotals),
      browsers:   toSortedArray(browserTotals),
      os:         toSortedArray(osTotals),
      devices:    toSortedArray(deviceTotals),
      pages:      toSortedArray(pageTotals),
      referrers:  [],           // requires Cloudflare Pro+
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

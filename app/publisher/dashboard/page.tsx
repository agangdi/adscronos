import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PublisherLayout from "@/components/PublisherLayout";

async function getPublisherData() {
  const publisher = await prisma.publisher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      adUnits: {
        include: {
          _count: {
            select: { events: true },
          },
        },
      },
      billings: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!publisher) return null;

  // Get revenue metrics
  const revenueMetrics = await prisma.adEventRollupDaily.aggregate({
    where: {
      publisherId: publisher.id,
    },
    _sum: {
      impressions: true,
      clicks: true,
      completes: true,
      spendCents: true,
    },
  });

  // Get recent analytics data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analyticsData = await prisma.adEventRollupDaily.findMany({
    where: {
      publisherId: publisher.id,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      impressions: true,
      clicks: true,
      spendCents: true,
      adUnit: {
        select: { key: true, adType: true },
      },
    },
  });

  // Get ad unit performance breakdown
  const adUnitPerformance = await prisma.adEventRollupDaily.groupBy({
    by: ["adUnitId"],
    where: {
      publisherId: publisher.id,
    },
    _sum: {
      impressions: true,
      clicks: true,
      spendCents: true,
    },
  });

  // Get webhook delivery stats
  const webhookStats = await prisma.webhookDelivery.groupBy({
    by: ["status"],
    where: { publisherId: publisher.id },
    _count: true,
  });

  return {
    publisher,
    revenueMetrics,
    analyticsData,
    adUnitPerformance,
    webhookStats,
  };
}

export default async function PublisherDashboard() {
  const data = await getPublisherData();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>No publisher found. Register via /api/auth/publisher/register.</p>
      </div>
    );
  }

  const { publisher, revenueMetrics, analyticsData, webhookStats } = data;
  
  // Calculate derived metrics
  const totalImpressions = revenueMetrics._sum.impressions || 0;
  const totalClicks = revenueMetrics._sum.clicks || 0;
  const totalRevenue = (revenueMetrics._sum.spendCents || 0) / 100;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const rpm = totalImpressions > 0 ? (totalRevenue / totalImpressions * 1000) : 0;

  const overviewCards = [
    { label: "Total Ad Units", value: publisher.adUnits.length, color: "text-emerald-400" },
    { label: "Total Impressions", value: totalImpressions.toLocaleString(), color: "text-purple-400" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), color: "text-orange-400" },
    { label: "CTR", value: `${ctr.toFixed(2)}%`, color: "text-cyan-400" },
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-green-400" },
    { label: "RPM", value: `$${rpm.toFixed(2)}`, color: "text-yellow-400" },
  ];

  return (
    <PublisherLayout currentPage="Dashboard" publisherName={publisher.siteName}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Revenue & Performance Overview</h1>
          <p className="text-sm text-slate-400">Monitor your ad units, revenue, and website performance.</p>
        </header>

        {/* Overview Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {overviewCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">{card.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Webhook Delivery Status */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Webhook Delivery Status</h2>
              <p className="text-sm text-slate-400">Real-time webhook delivery statistics</p>
            </div>
            <div className="space-y-3">
              {webhookStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{stat.status.toLowerCase()}</span>
                  <span className={`font-semibold ${
                    stat.status === 'SUCCESS' ? 'text-green-400' :
                    stat.status === 'PENDING' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {stat._count}
                  </span>
                </div>
              ))}
              {webhookStats.length === 0 && (
                <p className="text-center text-slate-400">No webhook deliveries yet</p>
              )}
            </div>
          </section>

          {/* Integration Code Generator */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Integration Code</h2>
              <p className="text-sm text-slate-400">Copy this code to your website</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
              <div className="text-slate-300">
                {`<script src="https://cdn.x402ads.com/sdk/ad-sdk.js"></script>`}
              </div>
              <div className="text-slate-300 mt-2">
                {`<script>`}
              </div>
              <div className="text-slate-300 ml-4">
                {`X402Ads.init({`}
              </div>
              <div className="text-slate-300 ml-8">
                {`publisherId: "${publisher.appId}",`}
              </div>
              <div className="text-slate-300 ml-8">
                {`domain: "${publisher.domain}"`}
              </div>
              <div className="text-slate-300 ml-4">
                {`});`}
              </div>
              <div className="text-slate-300">
                {`</script>`}
              </div>
            </div>
            <button className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Copy Code
            </button>
          </section>
        </div>

        {/* Revenue Trends */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Revenue Trends (Last 30 Days)</h2>
            <p className="text-sm text-slate-400">Daily impressions, clicks, and revenue</p>
          </div>
          {analyticsData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-6 gap-2 text-xs text-slate-400 mb-4">
                  <div>Date</div>
                  <div>Ad Unit</div>
                  <div>Impressions</div>
                  <div>Clicks</div>
                  <div>CTR</div>
                  <div>Revenue</div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {analyticsData.slice(-10).map((day, index) => {
                    const dayImpressions = day.impressions || 0;
                    const dayClicks = day.clicks || 0;
                    const dayRevenue = (day.spendCents || 0) / 100;
                    const dayCtr = dayImpressions > 0 ? (dayClicks / dayImpressions * 100) : 0;

                    return (
                      <div key={`${day.date.toISOString()}-${index}`} className="grid grid-cols-6 gap-2 text-sm py-2 border-b border-slate-800/40">
                        <div className="text-slate-300">{day.date.toLocaleDateString()}</div>
                        <div className="text-emerald-400">{day.adUnit?.key || 'N/A'}</div>
                        <div className="text-purple-400">{dayImpressions.toLocaleString()}</div>
                        <div className="text-orange-400">{dayClicks.toLocaleString()}</div>
                        <div className="text-cyan-400">{dayCtr.toFixed(2)}%</div>
                        <div className="text-green-400">${dayRevenue.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No revenue data available yet</p>
          )}
        </section>

        {/* Ad Units Management */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ad Units</h2>
              <p className="text-sm text-slate-400">Manage your website ad placements</p>
            </div>
            <Link 
              href="/publisher/ad-units"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors inline-block"
            >
              Create Ad Unit
            </Link>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Ad Unit Key</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Events</th>
                  <th className="px-4 py-3">Performance</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publisher.adUnits.map((adUnit) => {
                  const unitEvents = adUnit._count.events || 0;
                  
                  return (
                    <tr key={adUnit.id} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{adUnit.key}</div>
                        <div className="text-xs text-slate-400">{adUnit.description || 'No description'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-emerald-900/50 text-emerald-400">
                          {adUnit.adType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-400">{unitEvents.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-400">
                        {unitEvents > 0 ? 'Active' : 'No traffic'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(adUnit.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button className="text-emerald-400 hover:text-emerald-300 text-sm">Edit</button>
                      </td>
                    </tr>
                  );
                })}
                {publisher.adUnits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No ad units yet. Create your first ad unit to start earning revenue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment History */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Payment History</h2>
              <p className="text-sm text-slate-400">Your revenue payments and withdrawals</p>
            </div>
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Request Withdrawal
            </button>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {publisher.billings.map((billing) => (
                  <tr key={billing.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-3 text-slate-300">{new Date(billing.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-200">{billing.description || 'Revenue payment'}</td>
                    <td className="px-4 py-3 text-green-400">${(billing.amountCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        billing.status === 'PAID' ? 'bg-green-900/50 text-green-400' :
                        billing.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {billing.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {publisher.billings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No payment history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PublisherLayout>
  );
}

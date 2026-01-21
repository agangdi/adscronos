import { prisma } from "@/lib/prisma";
import PublisherLayout from "@/components/PublisherLayout";

async function getPublisherAnalytics() {
  const publisher = await prisma.publisher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      adUnits: true,
    },
  });

  if (!publisher) return null;

  // Get analytics data for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const analyticsData = await prisma.adEventRollupDaily.findMany({
    where: {
      publisherId: publisher.id,
      date: {
        gte: ninetyDaysAgo,
      },
    },
    orderBy: { date: "desc" },
    include: {
      adUnit: {
        select: { key: true, adType: true },
      },
      campaign: {
        select: { name: true },
      },
    },
  });

  // Get performance by ad unit
  const adUnitPerformance = await prisma.adEventRollupDaily.groupBy({
    by: ["adUnitId"],
    where: {
      publisherId: publisher.id,
      date: {
        gte: ninetyDaysAgo,
      },
    },
    _sum: {
      impressions: true,
      clicks: true,
      spendCents: true,
    },
  });

  // Get ad unit details for performance data
  const adUnitsWithPerformance = await Promise.all(
    adUnitPerformance.map(async (perf) => {
      const adUnit = await prisma.adUnit.findUnique({
        where: { id: perf.adUnitId },
      });
      return {
        ...adUnit,
        performance: perf._sum,
      };
    })
  );

  return {
    publisher,
    analyticsData,
    adUnitsWithPerformance,
  };
}

export default async function PublisherAnalytics() {
  const data = await getPublisherAnalytics();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>No publisher found. Register via /api/auth/publisher/register.</p>
      </div>
    );
  }

  const { publisher, analyticsData, adUnitsWithPerformance } = data;

  // Calculate totals
  const totalImpressions = analyticsData.reduce((sum, day) => sum + (day.impressions || 0), 0);
  const totalClicks = analyticsData.reduce((sum, day) => sum + (day.clicks || 0), 0);
  const totalRevenue = analyticsData.reduce((sum, day) => sum + ((day.spendCents || 0) / 100), 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const rpm = totalImpressions > 0 ? (totalRevenue / totalImpressions * 1000) : 0;

  return (
    <PublisherLayout currentPage="Analytics" publisherName={publisher.siteName}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Analytics & Performance</h1>
          <p className="text-sm text-slate-400">Detailed analytics for your ad units and revenue performance.</p>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Total Impressions</div>
            <div className="mt-2 text-2xl font-semibold text-purple-400">{totalImpressions.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Total Clicks</div>
            <div className="mt-2 text-2xl font-semibold text-orange-400">{totalClicks.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">CTR</div>
            <div className="mt-2 text-2xl font-semibold text-cyan-400">{ctr.toFixed(2)}%</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Total Revenue</div>
            <div className="mt-2 text-2xl font-semibold text-green-400">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">RPM</div>
            <div className="mt-2 text-2xl font-semibold text-yellow-400">${rpm.toFixed(2)}</div>
          </div>
        </section>

        {/* Ad Unit Performance */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Ad Unit Performance</h2>
            <p className="text-sm text-slate-400">Performance breakdown by ad unit (Last 90 days)</p>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Ad Unit</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Impressions</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">CTR</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">RPM</th>
                </tr>
              </thead>
              <tbody>
                {adUnitsWithPerformance.map((adUnit) => {
                  const impressions = adUnit.performance.impressions || 0;
                  const clicks = adUnit.performance.clicks || 0;
                  const revenue = (adUnit.performance.spendCents || 0) / 100;
                  const unitCtr = impressions > 0 ? (clicks / impressions * 100) : 0;
                  const unitRpm = impressions > 0 ? (revenue / impressions * 1000) : 0;

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
                      <td className="px-4 py-3 text-purple-400">{impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-orange-400">{clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{unitCtr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-green-400">${revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-yellow-400">${unitRpm.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {adUnitsWithPerformance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No performance data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Daily Analytics */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Daily Performance (Last 30 Days)</h2>
            <p className="text-sm text-slate-400">Daily breakdown of impressions, clicks, and revenue</p>
          </div>
          {analyticsData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-4">
                  <div>Date</div>
                  <div>Ad Unit</div>
                  <div>Campaign</div>
                  <div>Impressions</div>
                  <div>Clicks</div>
                  <div>CTR</div>
                  <div>Revenue</div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {analyticsData.slice(0, 30).map((day, index) => {
                    const dayImpressions = day.impressions || 0;
                    const dayClicks = day.clicks || 0;
                    const dayRevenue = (day.spendCents || 0) / 100;
                    const dayCtr = dayImpressions > 0 ? (dayClicks / dayImpressions * 100) : 0;

                    return (
                      <div key={`${day.date.toISOString()}-${index}`} className="grid grid-cols-7 gap-2 text-sm py-2 border-b border-slate-800/40">
                        <div className="text-slate-300">{day.date.toLocaleDateString()}</div>
                        <div className="text-emerald-400">{day.adUnit?.key || 'N/A'}</div>
                        <div className="text-sky-400">{day.campaign?.name || 'N/A'}</div>
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
            <p className="text-center text-slate-400 py-8">No analytics data available yet</p>
          )}
        </section>
      </div>
    </PublisherLayout>
  );
}

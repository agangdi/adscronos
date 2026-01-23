import Link from "next/link";
import AdvertiserLayout from "@/components/AdvertiserLayout";
import {
  getMockAdvertiserData,
  getMockCampaignStats,
  getMockCreativeStats,
  getMockCampaignPerformance,
  MOCK_DAILY_METRICS,
  MOCK_BILLING_RECORDS,
} from "@/lib/mock-advertiser-data";

function getAdvertiserData() {
  const mockData = getMockAdvertiserData();
  const campaignStats = getMockCampaignStats();
  const creativeStats = getMockCreativeStats();
  const campaignPerformance = getMockCampaignPerformance();
  
  // Get last 30 days of analytics
  const analyticsData = MOCK_DAILY_METRICS.slice(-30).map(day => ({
    date: new Date(day.date),
    impressions: day.impressions,
    clicks: day.clicks,
    spendCents: day.spendCents,
  }));
  
  // Get recent billing records
  const billings = MOCK_BILLING_RECORDS.slice(0, 5);
  
  return {
    advertiser: {
      id: 'adv-001',
      name: 'Demo Advertiser',
      campaigns: mockData.campaigns,
      creatives: mockData.creatives,
      billings,
    },
    performanceMetrics: {
      _sum: {
        impressions: mockData.totalImpressions,
        clicks: mockData.totalClicks,
        spendCents: mockData.totalSpendCents,
      },
    },
    analyticsData,
    campaignStats,
    creativeStats,
    campaignPerformance,
  };
}

export default function AdvertiserDashboard() {
  const data = getAdvertiserData();

  const { advertiser, performanceMetrics, analyticsData, campaignStats, creativeStats, campaignPerformance } = data;
  
  // Calculate derived metrics
  const totalImpressions = performanceMetrics._sum.impressions || 0;
  const totalClicks = performanceMetrics._sum.clicks || 0;
  const totalSpend = (performanceMetrics._sum.spendCents || 0) / 100;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions * 1000) : 0;

  const overviewCards = [
    { label: "Total Campaigns", value: advertiser.campaigns.length, color: "text-blue-400" },
    { label: "Total Creatives", value: advertiser.creatives.length, color: "text-green-400" },
    { label: "Total Impressions", value: totalImpressions.toLocaleString(), color: "text-purple-400" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), color: "text-orange-400" },
    { label: "CTR", value: `${ctr.toFixed(2)}%`, color: "text-cyan-400" },
    { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, color: "text-red-400" },
  ];

  return (
    <AdvertiserLayout currentPage="Dashboard" advertiserName={advertiser.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Campaign Performance Overview</h1>
          <p className="text-sm text-slate-400">Monitor your advertising campaigns, creatives, and performance metrics.</p>
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
          {/* Campaign Status Breakdown */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Campaign Status</h2>
              <p className="text-sm text-slate-400">Breakdown of campaign statuses</p>
            </div>
            <div className="space-y-3">
              {campaignStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{stat.status.toLowerCase()}</span>
                  <span className="font-semibold text-sky-400">{stat._count}</span>
                </div>
              ))}
              {campaignStats.length === 0 && (
                <p className="text-center text-slate-400">No campaigns yet</p>
              )}
            </div>
          </section>

          {/* Creative Status Breakdown */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Creative Status</h2>
              <p className="text-sm text-slate-400">Breakdown of creative statuses</p>
            </div>
            <div className="space-y-3">
              {creativeStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{stat.status.toLowerCase().replace('_', ' ')}</span>
                  <span className="font-semibold text-emerald-400">{stat._count}</span>
                </div>
              ))}
              {creativeStats.length === 0 && (
                <p className="text-center text-slate-400">No creatives yet</p>
              )}
            </div>
          </section>
        </div>

        {/* Performance Chart */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Performance Trends (Last 30 Days)</h2>
            <p className="text-sm text-slate-400">Daily impressions, clicks, and spend</p>
          </div>
          {analyticsData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-4">
                  <div>Date</div>
                  <div>Impressions</div>
                  <div>Clicks</div>
                  <div>CTR</div>
                  <div>Spend</div>
                  <div>CPM</div>
                  <div>CPC</div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {analyticsData.slice(-10).map((day) => {
                    const dayImpressions = day.impressions || 0;
                    const dayClicks = day.clicks || 0;
                    const daySpend = (day.spendCents || 0) / 100;
                    const dayCtr = dayImpressions > 0 ? (dayClicks / dayImpressions * 100) : 0;
                    const dayCpm = dayImpressions > 0 ? (daySpend / dayImpressions * 1000) : 0;
                    const dayCpc = dayClicks > 0 ? (daySpend / dayClicks) : 0;

                    return (
                      <div key={day.date.toISOString()} className="grid grid-cols-7 gap-2 text-sm py-2 border-b border-slate-800/40">
                        <div className="text-slate-300">{day.date.toLocaleDateString()}</div>
                        <div className="text-purple-400">{dayImpressions.toLocaleString()}</div>
                        <div className="text-orange-400">{dayClicks.toLocaleString()}</div>
                        <div className="text-cyan-400">{dayCtr.toFixed(2)}%</div>
                        <div className="text-red-400">${daySpend.toFixed(2)}</div>
                        <div className="text-yellow-400">${dayCpm.toFixed(2)}</div>
                        <div className="text-green-400">${dayCpc.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No performance data available yet</p>
          )}
        </section>

        {/* Recent Campaigns */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active Campaigns</h2>
              <p className="text-sm text-slate-400">Your current advertising campaigns</p>
            </div>
            <Link 
              href="/advertiser/campaigns"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors inline-block"
            >
              Create Campaign
            </Link>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Campaign Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Spend</th>
                  <th className="px-4 py-3">Impressions</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">CTR</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((campaign) => {
                  const campaignImpressions = campaign.performance.impressions || 0;
                  const campaignClicks = campaign.performance.clicks || 0;
                  const campaignSpend = (campaign.performance.spendCents || 0) / 100;
                  const campaignBudget = (campaign.budgetCents || 0) / 100;
                  const campaignCtr = campaignImpressions > 0 ? (campaignClicks / campaignImpressions * 100) : 0;
                  
                  return (
                    <tr key={campaign.id} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{campaign.name}</div>
                        <div className="text-xs text-slate-400">{campaign.creatives.length} creatives</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          campaign.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' :
                          campaign.status === 'PAUSED' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">${campaignBudget.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">${campaignSpend.toFixed(2)}</td>
                      <td className="px-4 py-3 text-purple-400">{campaignImpressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-orange-400">{campaignClicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{campaignCtr.toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <button className="text-sky-400 hover:text-sky-300 text-sm">Edit</button>
                      </td>
                    </tr>
                  );
                })}
                {advertiser.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No campaigns yet. Create your first campaign to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Billing */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recent Billing</h2>
            <p className="text-sm text-slate-400">Your latest billing transactions</p>
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
                {advertiser.billings.map((billing) => (
                  <tr key={billing.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-3 text-slate-300">{new Date(billing.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-200">{billing.description || 'Ad spend'}</td>
                    <td className="px-4 py-3 text-slate-300">${(billing.amountCents / 100).toFixed(2)}</td>
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
                {advertiser.billings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No billing records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdvertiserLayout>
  );
}

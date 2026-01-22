import { prisma } from "@/lib/prisma";

async function getAdminData() {
  // Get platform-wide statistics
  const [
    totalAdvertisers,
    totalPublishers,
    totalCampaigns,
    totalCreatives,
    totalAdUnits,
    totalEvents,
    totalWebhookDeliveries,
  ] = await Promise.all([
    prisma.advertiser.count(),
    prisma.publisher.count(),
    prisma.campaign.count(),
    prisma.creative.count(),
    prisma.adUnit.count(),
    prisma.adEvent.count(),
    prisma.webhookDelivery.count(),
  ]);

  // Get platform revenue metrics
  const platformMetrics = await prisma.adEventRollupDaily.aggregate({
    _sum: {
      impressions: true,
      clicks: true,
      completes: true,
      spendCents: true,
    },
  });

  // Get recent user registrations
  const recentAdvertisers = await prisma.advertiser.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      authEmail: true,
      createdAt: true,
      _count: {
        select: { campaigns: true },
      },
    },
  });

  const recentPublishers = await prisma.publisher.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      siteName: true,
      authEmail: true,
      domain: true,
      createdAt: true,
      _count: {
        select: { adUnits: true },
      },
    },
  });

  // Get creatives pending approval
  const pendingCreatives = await prisma.creative.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      advertiser: {
        select: { name: true },
      },
      campaign: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get system health metrics
  const systemHealth = {
    webhookSuccessRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
  };

  // Calculate webhook success rate
  const webhookStats = await prisma.webhookDelivery.groupBy({
    by: ["status"],
    _count: true,
  });

  const totalWebhooks = webhookStats.reduce((sum, stat) => sum + stat._count, 0);
  const successfulWebhooks = webhookStats.find(stat => stat.status === "DELIVERED")?._count || 0;
  systemHealth.webhookSuccessRate = totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks * 100) : 0;

  // Get recent analytics (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAnalytics = await prisma.adEventRollupDaily.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      impressions: true,
      clicks: true,
      spendCents: true,
    },
  });

  // Get billing overview
  const billingOverview = await prisma.billing.groupBy({
    by: ["status"],
    _count: true,
    _sum: {
      amountCents: true,
    },
  });

  // Get ChatGPT integration usage
  const chatgptUsage = await prisma.chatGPTToken.aggregate({
    _sum: {
      tokensUsed: true,
      costCents: true,
    },
  });

  return {
    platformStats: {
      totalAdvertisers,
      totalPublishers,
      totalCampaigns,
      totalCreatives,
      totalAdUnits,
      totalEvents,
      totalWebhookDeliveries,
    },
    platformMetrics,
    recentAdvertisers,
    recentPublishers,
    pendingCreatives,
    systemHealth,
    recentAnalytics,
    billingOverview,
    chatgptUsage,
  };
}

export default async function AdminDashboard() {
  const data = await getAdminData();
  const {
    platformStats,
    platformMetrics,
    recentAdvertisers,
    recentPublishers,
    pendingCreatives,
    systemHealth,
    recentAnalytics,
    billingOverview,
    chatgptUsage,
  } = data;

  // Calculate derived metrics
  const totalImpressions = platformMetrics._sum.impressions || 0;
  const totalClicks = platformMetrics._sum.clicks || 0;
  const totalRevenue = (platformMetrics._sum.spendCents || 0) / 100;
  const platformCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;

  const overviewCards = [
    { label: "Total Advertisers", value: platformStats.totalAdvertisers, color: "text-blue-400", icon: "👥" },
    { label: "Total Publishers", value: platformStats.totalPublishers, color: "text-emerald-400", icon: "🌐" },
    { label: "Total Campaigns", value: platformStats.totalCampaigns, color: "text-purple-400", icon: "📊" },
    { label: "Total Creatives", value: platformStats.totalCreatives, color: "text-orange-400", icon: "🎨" },
    { label: "Platform Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-green-400", icon: "💰" },
    { label: "Platform CTR", value: `${platformCtr.toFixed(2)}%`, color: "text-cyan-400", icon: "📈" },
  ];

  const systemHealthCards = [
    { label: "Webhook Success Rate", value: `${systemHealth.webhookSuccessRate.toFixed(1)}%`, color: "text-green-400" },
    { label: "Total Events", value: platformStats.totalEvents.toLocaleString(), color: "text-purple-400" },
    { label: "Pending Approvals", value: pendingCreatives.length, color: "text-yellow-400" },
    { label: "ChatGPT Tokens Used", value: (chatgptUsage._sum.tokensUsed || 0).toLocaleString(), color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="text-sm text-slate-400">Admin Dashboard · Adscronos</div>
          <h1 className="text-3xl font-semibold">Platform Overview & Management</h1>
          <p className="text-sm text-slate-400">Monitor platform-wide analytics, users, and system health.</p>
        </header>

        {/* Platform Overview Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {overviewCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{card.icon}</span>
                <span>{card.label}</span>
              </div>
              <div className={`mt-2 text-2xl font-semibold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </section>

        {/* System Health Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {systemHealthCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">{card.label}</div>
              <div className={`mt-2 text-xl font-semibold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Advertisers */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Recent Advertisers</h2>
              <p className="text-sm text-slate-400">Latest advertiser registrations</p>
            </div>
            <div className="space-y-3">
              {recentAdvertisers.map((advertiser) => (
                <div key={advertiser.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <div className="font-medium text-slate-200">{advertiser.name}</div>
                    <div className="text-xs text-slate-400">{advertiser.authEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-400">{advertiser._count.campaigns} campaigns</div>
                    <div className="text-xs text-slate-400">{new Date(advertiser.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {recentAdvertisers.length === 0 && (
                <p className="text-center text-slate-400 py-4">No advertisers yet</p>
              )}
            </div>
          </section>

          {/* Recent Publishers */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Recent Publishers</h2>
              <p className="text-sm text-slate-400">Latest publisher registrations</p>
            </div>
            <div className="space-y-3">
              {recentPublishers.map((publisher) => (
                <div key={publisher.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <div className="font-medium text-slate-200">{publisher.siteName}</div>
                    <div className="text-xs text-slate-400">{publisher.domain}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-400">{publisher._count.adUnits} ad units</div>
                    <div className="text-xs text-slate-400">{new Date(publisher.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {recentPublishers.length === 0 && (
                <p className="text-center text-slate-400 py-4">No publishers yet</p>
              )}
            </div>
          </section>
        </div>

        {/* Platform Analytics */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Platform Analytics (Last 7 Days)</h2>
            <p className="text-sm text-slate-400">Daily platform performance metrics</p>
          </div>
          {recentAnalytics.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 mb-4">
                  <div>Date</div>
                  <div>Impressions</div>
                  <div>Clicks</div>
                  <div>CTR</div>
                  <div>Revenue</div>
                </div>
                <div className="space-y-2">
                  {recentAnalytics.map((day) => {
                    const dayImpressions = day.impressions || 0;
                    const dayClicks = day.clicks || 0;
                    const dayRevenue = (day.spendCents || 0) / 100;
                    const dayCtr = dayImpressions > 0 ? (dayClicks / dayImpressions * 100) : 0;

                    return (
                      <div key={day.date.toISOString()} className="grid grid-cols-5 gap-2 text-sm py-2 border-b border-slate-800/40">
                        <div className="text-slate-300">{day.date.toLocaleDateString()}</div>
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

        {/* Creative Approval Workflow */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Creative Approval Queue</h2>
              <p className="text-sm text-slate-400">Creatives pending moderation approval</p>
            </div>
            <div className="text-sm text-yellow-400 font-medium">
              {pendingCreatives.length} pending
            </div>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Creative Name</th>
                  <th className="px-4 py-3">Advertiser</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCreatives.map((creative) => (
                  <tr key={creative.id} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{creative.name}</div>
                      <div className="text-xs text-slate-400">Version {creative.version}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{creative.advertiser.name}</td>
                    <td className="px-4 py-3 text-slate-300">{creative.campaign?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-purple-900/50 text-purple-400">
                        {creative.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(creative.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-green-400 hover:text-green-300 text-sm">Approve</button>
                        <button className="text-red-400 hover:text-red-300 text-sm">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingCreatives.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No creatives pending approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial Overview */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Financial Overview</h2>
            <p className="text-sm text-slate-400">Platform billing and transaction monitoring</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {billingOverview.map((billing) => (
              <div key={billing.status} className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-sm text-slate-400 capitalize">{billing.status.toLowerCase()}</div>
                <div className="text-lg font-semibold text-green-400">
                  ${((billing._sum.amountCents || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">{billing._count} transactions</div>
              </div>
            ))}
            {billingOverview.length === 0 && (
              <div className="col-span-4 text-center text-slate-400 py-4">
                No billing data available yet
              </div>
            )}
          </div>
        </section>

        {/* ChatGPT Integration Usage */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">ChatGPT Integration Usage</h2>
            <p className="text-sm text-slate-400">AI tool integration metrics and billing</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="text-sm text-slate-400">Total Tokens Used</div>
              <div className="text-xl font-semibold text-cyan-400">
                {(chatgptUsage._sum.tokensUsed || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="text-sm text-slate-400">Total AI Cost</div>
              <div className="text-xl font-semibold text-red-400">
                ${((chatgptUsage._sum.costCents || 0) / 100).toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="text-sm text-slate-400">Average Cost per Token</div>
              <div className="text-xl font-semibold text-yellow-400">
                ${chatgptUsage._sum.tokensUsed && chatgptUsage._sum.costCents 
                  ? ((chatgptUsage._sum.costCents / chatgptUsage._sum.tokensUsed) / 100).toFixed(4)
                  : '0.0000'
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

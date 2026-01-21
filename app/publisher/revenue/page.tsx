import { prisma } from "@/lib/prisma";
import PublisherLayout from "@/components/PublisherLayout";

async function getPublisherRevenue() {
  const publisher = await prisma.publisher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      billings: {
        orderBy: { createdAt: "desc" },
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
      spendCents: true,
    },
  });

  // Get monthly revenue breakdown
  const monthlyRevenue = await prisma.adEventRollupDaily.groupBy({
    by: ["date"],
    where: {
      publisherId: publisher.id,
    },
    _sum: {
      impressions: true,
      clicks: true,
      spendCents: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Group by month
  const monthlyData = monthlyRevenue.reduce((acc, day) => {
    const month = day.date.toISOString().slice(0, 7); // YYYY-MM format
    if (!acc[month]) {
      acc[month] = {
        impressions: 0,
        clicks: 0,
        revenue: 0,
      };
    }
    acc[month].impressions += day._sum.impressions || 0;
    acc[month].clicks += day._sum.clicks || 0;
    acc[month].revenue += (day._sum.spendCents || 0) / 100;
    return acc;
  }, {} as Record<string, { impressions: number; clicks: number; revenue: number }>);

  return {
    publisher,
    revenueMetrics,
    monthlyData,
  };
}

export default async function PublisherRevenue() {
  const data = await getPublisherRevenue();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>No publisher found. Register via /api/auth/publisher/register.</p>
      </div>
    );
  }

  const { publisher, revenueMetrics, monthlyData } = data;

  // Calculate totals
  const totalImpressions = revenueMetrics._sum.impressions || 0;
  const totalClicks = revenueMetrics._sum.clicks || 0;
  const totalRevenue = (revenueMetrics._sum.spendCents || 0) / 100;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
  const rpm = totalImpressions > 0 ? (totalRevenue / totalImpressions * 1000) : 0;

  // Calculate billing totals
  const totalPaid = publisher.billings
    .filter(b => b.status === 'PAID')
    .reduce((sum, b) => sum + (b.amountCents / 100), 0);
  
  const totalPending = publisher.billings
    .filter(b => b.status === 'PENDING')
    .reduce((sum, b) => sum + (b.amountCents / 100), 0);

  const availableBalance = totalRevenue - totalPaid - totalPending;

  return (
    <PublisherLayout currentPage="Revenue" publisherName={publisher.siteName}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Revenue Management</h1>
          <p className="text-sm text-slate-400">Track your earnings, payments, and revenue trends.</p>
        </header>

        {/* Revenue Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Total Revenue</div>
            <div className="mt-2 text-2xl font-semibold text-green-400">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Paid Out</div>
            <div className="mt-2 text-2xl font-semibold text-blue-400">${totalPaid.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Pending</div>
            <div className="mt-2 text-2xl font-semibold text-yellow-400">${totalPending.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">Available</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400">${availableBalance.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-slate-400">RPM</div>
            <div className="mt-2 text-2xl font-semibold text-purple-400">${rpm.toFixed(2)}</div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Monthly Revenue Trends */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Monthly Revenue Trends</h2>
              <p className="text-sm text-slate-400">Revenue performance by month</p>
            </div>
            <div className="space-y-4">
              {Object.entries(monthlyData)
                .slice(0, 12)
                .map(([month, data]) => {
                  const monthCtr = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0;
                  const monthRpm = data.impressions > 0 ? (data.revenue / data.impressions * 1000) : 0;
                  
                  return (
                    <div key={month} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                      <div>
                        <div className="font-medium text-slate-200">{month}</div>
                        <div className="text-sm text-slate-400">
                          {data.impressions.toLocaleString()} impressions · {data.clicks.toLocaleString()} clicks
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-400">${data.revenue.toFixed(2)}</div>
                        <div className="text-sm text-slate-400">
                          {monthCtr.toFixed(2)}% CTR · ${monthRpm.toFixed(2)} RPM
                        </div>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(monthlyData).length === 0 && (
                <p className="text-center text-slate-400 py-8">No revenue data available yet</p>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <p className="text-sm text-slate-400">Manage your revenue and payments</p>
            </div>
            <div className="space-y-4">
              <button 
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-left font-medium text-white hover:bg-emerald-700 transition-colors"
                disabled={availableBalance < 50}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div>Request Withdrawal</div>
                    <div className="text-sm text-emerald-100">
                      {availableBalance >= 50 ? `$${availableBalance.toFixed(2)} available` : 'Minimum $50 required'}
                    </div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </button>
              
              <button className="w-full rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Payment Settings</div>
                    <div className="text-sm text-slate-300">Update payment methods</div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </button>

              <button className="w-full rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div>Tax Documents</div>
                    <div className="text-sm text-slate-300">Download tax forms</div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Payment History */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <p className="text-sm text-slate-400">All your revenue payments and withdrawals</p>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {publisher.billings.map((billing) => (
                  <tr key={billing.id} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-300">{new Date(billing.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-emerald-900/50 text-emerald-400">
                        Revenue
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{billing.description || 'Ad revenue payment'}</td>
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
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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

"use client";

import { useState, useEffect } from "react";
import AdvertiserLayout from "@/components/AdvertiserLayout";

interface AnalyticsData {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  avgCTR: number;
  avgCPM: number;
  avgCPC: number;
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spendCents: number;
    ctr: number;
  }>;
  campaignMetrics: Array<{
    campaignId: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    spendCents: number;
    ctr: number;
  }>;
}

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch(`/api/advertiser/analytics?days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login?type=advertiser';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <AdvertiserLayout currentPage="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading analytics...</div>
        </div>
      </AdvertiserLayout>
    );
  }

  return (
    <AdvertiserLayout currentPage="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400">Performance insights and metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {analytics ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Impressions</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-500/10 p-3">
                    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Clicks</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 p-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Average CTR</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.avgCTR.toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Spend</p>
                    <p className="text-2xl font-bold text-white">
                      ${(analytics.totalSpend / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full bg-orange-500/10 p-3">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Performance */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Daily Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Impressions</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Clicks</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">CTR</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.dailyMetrics.map((day, index) => (
                      <tr key={index} className="border-b border-slate-800/50">
                        <td className="py-3 px-4 text-slate-100">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {day.impressions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {day.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {day.ctr.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          ${(day.spendCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Campaign Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Impressions</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Clicks</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">CTR</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.campaignMetrics.map((campaign, index) => (
                      <tr key={index} className="border-b border-slate-800/50">
                        <td className="py-3 px-4 text-slate-100 font-medium">
                          {campaign.campaignName}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {campaign.impressions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {campaign.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {campaign.ctr.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          ${(campaign.spendCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400">No analytics data available</div>
          </div>
        )}
      </div>
    </AdvertiserLayout>
  );
}

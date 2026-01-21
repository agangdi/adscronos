"use client";

import { useState, useEffect } from "react";
import AdvertiserLayout from "@/components/AdvertiserLayout";

interface BillingRecord {
  id: string;
  amountCents: number;
  status: string;
  description: string;
  createdAt: string;
  dueDate: string;
}

interface BillingData {
  records: BillingRecord[];
  totalSpend: number;
  currentBalance: number;
  nextPaymentDate: string;
}

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch('/api/advertiser/billing', {
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
        setBilling(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
      case 'pending':
        return `${baseClasses} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`;
      case 'failed':
        return `${baseClasses} bg-red-500/10 text-red-400 border border-red-500/20`;
      case 'refunded':
        return `${baseClasses} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
      default:
        return `${baseClasses} bg-slate-500/10 text-slate-400 border border-slate-500/20`;
    }
  };

  if (loading) {
    return (
      <AdvertiserLayout currentPage="Billing">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading billing information...</div>
        </div>
      </AdvertiserLayout>
    );
  }

  return (
    <AdvertiserLayout currentPage="Billing">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <p className="text-slate-400">Payment history and account balance</p>
          </div>
          <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors">
            Add Payment Method
          </button>
        </div>

        {billing ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Spend</p>
                    <p className="text-2xl font-bold text-white">
                      ${(billing.totalSpend / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-500/10 p-3">
                    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Current Balance</p>
                    <p className="text-2xl font-bold text-white">
                      ${(billing.currentBalance / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 p-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Next Payment</p>
                    <p className="text-lg font-semibold text-white">
                      {billing.nextPaymentDate ? new Date(billing.nextPaymentDate).toLocaleDateString() : 'No upcoming payments'}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Payment History</h2>
                <button className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                  Download Invoice
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.records.map((record) => (
                      <tr key={record.id} className="border-b border-slate-800/50">
                        <td className="py-3 px-4 text-slate-100">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {record.description}
                        </td>
                        <td className="py-3 px-4 text-slate-100 font-medium">
                          ${(record.amountCents / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={getStatusBadge(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-100">
                          {new Date(record.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-sky-400 hover:text-sky-300 text-sm transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {billing.records.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-slate-400">No billing records found</div>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Payment Methods</h2>
                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors">
                  Add New Method
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-slate-700 p-3">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-slate-400">Expires 12/25</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Default
                    </span>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400">No billing information available</div>
          </div>
        )}
      </div>
    </AdvertiserLayout>
  );
}

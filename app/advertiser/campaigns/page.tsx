"use client";

import { useState, useEffect } from "react";
import AdvertiserLayout from "@/components/AdvertiserLayout";

interface Campaign {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";
  budgetCents?: number;
  spendCents: number;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  creatives: Array<{
    id: string;
    type: string;
    assetUrl: string;
  }>;
  _count: {
    events: number;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    budgetCents: "",
    startAt: "",
    endAt: "",
  });

  // Get JWT token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  useEffect(() => {
    fetchCampaigns();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCampaigns = async () => {
    try {
      // Skip if running on server side
      if (typeof window === 'undefined') {
        return;
      }

      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        // Redirect to login
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch('/api/advertiser/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login?type=advertiser';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        console.error("Failed to fetch campaigns:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Skip if running on server side
      if (typeof window === 'undefined') {
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert("Authentication required. Please log in.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      const payload = {
        name: formData.name,
        budgetCents: parseInt(formData.budgetCents) || undefined,
        startAt: formData.startAt || undefined,
        endAt: formData.endAt || undefined,
      };

      const response = await fetch("/api/advertiser/campaigns", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('authToken');
        alert("Session expired. Please log in again.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log("Campaign created:", result);
        
        // Reset form and hide it
        setFormData({ name: "", budgetCents: "", startAt: "", endAt: "" });
        setShowForm(false);
        
        // Refresh campaigns list
        fetchCampaigns();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create campaign'}`);
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign");
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "ACTIVE": return "bg-green-600";
      case "PAUSED": return "bg-yellow-600";
      case "ENDED": return "bg-gray-600";
      case "ARCHIVED": return "bg-gray-500";
      default: return "bg-blue-600";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AdvertiserLayout currentPage="Campaigns">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Campaign Management</h1>
              <p className="text-sm text-slate-400">Create and manage your advertising campaigns.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Create Campaign
            </button>
          </div>
        </header>

        {showForm && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create New Campaign</h2>
              <p className="text-sm text-slate-400">Set up your advertising campaign.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  placeholder="Summer Sale Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Budget (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budgetCents}
                  onChange={(e) => setFormData({ ...formData, budgetCents: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  placeholder="1000.00"
                />
                <p className="mt-1 text-xs text-slate-400">Leave empty for unlimited budget</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Your Campaigns</h2>
            <p className="text-sm text-slate-400">{campaigns.length} campaigns created.</p>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No campaigns yet. Create your first campaign above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">{campaign.name}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium text-white ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                        <div>
                          <div className="text-sm text-slate-400">Budget</div>
                          <div className="text-lg font-semibold text-slate-200">
                            {campaign.budgetCents ? formatCurrency(campaign.budgetCents) : "Unlimited"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400">Spend</div>
                          <div className="text-lg font-semibold text-slate-200">
                            {formatCurrency(campaign.spendCents)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400">Creatives</div>
                          <div className="text-lg font-semibold text-slate-200">
                            {campaign.creatives.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400">Events</div>
                          <div className="text-lg font-semibold text-slate-200">
                            {campaign._count.events}
                          </div>
                        </div>
                      </div>

                      {(campaign.startAt || campaign.endAt) && (
                        <div className="mt-4 flex gap-4 text-sm text-slate-400">
                          {campaign.startAt && (
                            <div>
                              <span>Start: </span>
                              <span>{new Date(campaign.startAt).toLocaleString()}</span>
                            </div>
                          )}
                          {campaign.endAt && (
                            <div>
                              <span>End: </span>
                              <span>{new Date(campaign.endAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {campaign.creatives.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm text-slate-400 mb-2">Creatives:</div>
                          <div className="flex gap-2">
                            {campaign.creatives.slice(0, 3).map((creative) => (
                              <div key={creative.id} className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs">
                                <span>{creative.type}</span>
                              </div>
                            ))}
                            {campaign.creatives.length > 3 && (
                              <div className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-400">
                                +{campaign.creatives.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdvertiserLayout>
  );
}

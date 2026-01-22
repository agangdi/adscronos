"use client";

import { useState, useEffect } from "react";
import AdvertiserLayout from "@/components/AdvertiserLayout";

interface Creative {
  id: string;
  type: "VIDEO" | "IMAGE" | "TEXT" | "HTML" | "IFRAME";
  assetUrl: string;
  clickUrl?: string;
  durationMs?: number;
  width?: number;
  height?: number;
  campaignId?: string;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
    status: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "IMAGE" as "VIDEO" | "IMAGE" | "TEXT" | "HTML" | "IFRAME",
    assetUrl: "",
    clickUrl: "",
    durationMs: "",
    width: "",
    height: "",
    campaignId: "",
  });

  // Get JWT token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (creativeId: string) => {
    if (!confirm("Are you sure you want to delete this creative? This action cannot be undone.")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Authentication required. Please log in.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch(`/api/advertiser/creatives/${creativeId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        alert("Session expired. Please log in again.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      if (response.ok) {
        alert("Creative deleted successfully!");
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete creative'}`);
      }
    } catch (error) {
      console.error("Failed to delete creative:", error);
      alert("Failed to delete creative");
    }
  };

  const fetchData = async () => {
    try {
      // Skip if running on server side
      if (typeof window === 'undefined') {
        return;
      }

      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        window.location.href = '/login?type=advertiser';
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch creatives
      const creativesResponse = await fetch('/api/advertiser/creatives', { headers });
      if (creativesResponse.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login?type=advertiser';
        return;
      }
      if (creativesResponse.ok) {
        const creativesData = await creativesResponse.json();
        setCreatives(creativesData.creatives || []);
      }

      // Fetch campaigns for dropdown
      const campaignsResponse = await fetch('/api/advertiser/campaigns', { headers });
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
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

      // Frontend validation
      if (!formData.assetUrl) {
        alert("Asset URL is required");
        return;
      }

      if (!formData.campaignId) {
        alert("Please select a campaign");
        return;
      }

      // Extract URL from iframe HTML if needed
      let assetUrl = formData.assetUrl;
      if (formData.type === "IFRAME" && assetUrl.includes("<iframe")) {
        const srcMatch = assetUrl.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
          assetUrl = srcMatch[1];
        }
      }

      // Validate URL format
      try {
        new URL(assetUrl);
      } catch {
        alert("Please enter a valid Asset URL");
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert("Authentication required. Please log in.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      const payload = {
        name: `${formData.type} Creative - ${new Date().toLocaleDateString()}`,
        type: formData.type,
        assetUrl: assetUrl, // Use the extracted URL
        clickUrl: formData.clickUrl || undefined,
        durationMs: formData.durationMs ? parseInt(formData.durationMs) : undefined,
        width: formData.width ? parseInt(formData.width) : undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        campaignId: formData.campaignId,
      };

      const response = await fetch("/api/advertiser/creatives", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        alert("Session expired. Please log in again.");
        window.location.href = '/login?type=advertiser';
        return;
      }

      if (response.ok) {
        alert("Creative created successfully!");
        setShowForm(false);
        setFormData({
          type: "IMAGE",
          assetUrl: "",
          clickUrl: "",
          durationMs: "",
          width: "",
          height: "",
          campaignId: "",
        });
        fetchData();
      } else {
        const error = await response.json();
        if (Array.isArray(error.error)) {
          // Handle Zod validation errors
          const errorMessages = error.error.map((err: { path?: string[]; message: string }) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join('\n');
          alert(`Validation Error:\n${errorMessages}`);
        } else {
          alert(`Error: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Failed to create creative:", error);
      alert("Failed to create creative");
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
    <AdvertiserLayout currentPage="Creatives">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Creative Management</h1>
              <p className="text-sm text-slate-400">Upload and manage your ad creatives.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Add Creative
            </button>
          </div>
        </header>

        {showForm && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create New Creative</h2>
              <p className="text-sm text-slate-400">Upload your ad creative assets.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "VIDEO" | "IMAGE" | "TEXT" | "HTML" | "IFRAME" })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="TEXT">Text</option>
                    <option value="HTML">HTML</option>
                    <option value="IFRAME">iFrame (YouTube, etc.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Campaign *</label>
                  <select
                    required
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300">Asset URL *</label>
                <input
                  type={formData.type === "IFRAME" ? "text" : "url"}
                  required
                  value={formData.assetUrl}
                  onChange={(e) => {
                    let value = e.target.value;
                    // If it's an iframe type and the value contains iframe HTML, extract the src
                    if (formData.type === "IFRAME" && value.includes("<iframe")) {
                      const srcMatch = value.match(/src=["']([^"']+)["']/);
                      if (srcMatch && srcMatch[1]) {
                        value = srcMatch[1];
                      }
                    }
                    setFormData({ ...formData, assetUrl: value });
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  placeholder={formData.type === "IFRAME" ? "https://www.youtube.com/embed/VIDEO_ID or paste iframe code" : "https://example.com/ad-image.jpg"}
                />
                {formData.type === "IFRAME" && (
                  <p className="mt-1 text-xs text-slate-400">
                    Paste YouTube embed URL or full iframe code - we&apos;ll extract the URL automatically
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Click URL</label>
                <input
                  type="url"
                  value={formData.clickUrl}
                  onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  placeholder="https://example.com/landing-page"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {formData.type === "VIDEO" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Duration (ms)</label>
                    <input
                      type="number"
                      value={formData.durationMs}
                      onChange={(e) => setFormData({ ...formData, durationMs: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                      placeholder="30000"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300">Width (px)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    placeholder="300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Height (px)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Create Creative
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
            <h2 className="text-lg font-semibold">Your Creatives</h2>
            <p className="text-sm text-slate-400">{creatives.length} creatives uploaded.</p>
          </div>
          
          {creatives.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No creatives yet. Create your first ad creative above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatives.map((creative) => (
                <div key={creative.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300">
                        {creative.type}
                      </span>
                      {creative.campaign && (
                        <span className="text-xs text-slate-400">{creative.campaign.name}</span>
                      )}
                    </div>
                  </div>
                  
                  {creative.type === "IMAGE" && (
                    <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-slate-800">
                      <img
                        src={creative.assetUrl}
                        alt="Creative"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling!.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden flex h-full items-center justify-center text-slate-400">
                        Image not available
                      </div>
                    </div>
                  )}
                  
                  {creative.type === "VIDEO" && (
                    <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-slate-800">
                      <video
                        src={creative.assetUrl}
                        className="h-full w-full object-cover"
                        controls
                        muted
                      />
                    </div>
                  )}
                  
                  {creative.type === "TEXT" && (
                    <div className="mb-3 rounded-lg bg-slate-800 p-3">
                      <p className="text-sm text-slate-300">Text Creative</p>
                    </div>
                  )}
                  
                  {creative.type === "HTML" && (
                    <div className="mb-3 rounded-lg bg-slate-800 p-3">
                      <p className="text-sm text-slate-300">HTML Creative</p>
                    </div>
                  )}
                  
                  {creative.type === "IFRAME" && (
                    <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-slate-800">
                      <iframe
                        src={creative.assetUrl}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Ad Creative"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1 text-xs text-slate-400">
                    {creative.width && creative.height && (
                      <p>Dimensions: {creative.width}×{creative.height}px</p>
                    )}
                    {creative.durationMs && (
                      <p>Duration: {Math.round(creative.durationMs / 1000)}s</p>
                    )}
                    <p>Created: {new Date(creative.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {creative.clickUrl && (
                      <a
                        href={creative.clickUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        View Landing Page →
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(creative.id)}
                      className="rounded-md bg-red-600/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-600/20 hover:text-red-300"
                    >
                      Delete
                    </button>
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

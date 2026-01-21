"use client";

import { useState, useEffect } from "react";
import PublisherLayout from "@/components/PublisherLayout";

interface AdUnit {
  id: string;
  key: string;
  adType: "VIDEO" | "IMAGE" | "TEXT" | "HTML";
  description?: string;
  createdAt: string;
  _count: {
    events: number;
  };
}

interface Publisher {
  id: string;
  siteName: string;
  appId: string;
}

export default function AdUnitsPage() {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    adType: "IMAGE" as "VIDEO" | "IMAGE" | "TEXT" | "HTML",
    description: "",
  });

  useEffect(() => {
    fetchPublisherAndAdUnits();
  }, []);

  const fetchPublisherAndAdUnits = async () => {
    try {
      // First get the publisher data (using the first publisher for demo)
      const publisherResponse = await fetch('/api/publishers');
      if (publisherResponse.ok) {
        const publisherData = await publisherResponse.json();
        const firstPublisher = publisherData.publishers?.[0];
        if (firstPublisher) {
          setPublisher(firstPublisher);
          
          // Then fetch ad units using the real app ID
          const adUnitsResponse = await fetch(`/api/ad-units?appId=${firstPublisher.appId}`);
          if (adUnitsResponse.ok) {
            const adUnitsData = await adUnitsResponse.json();
            setAdUnits(adUnitsData.adUnits || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publisher) {
      alert("Publisher data not loaded");
      return;
    }
    
    const payload = {
      appId: publisher.appId,
      key: formData.key,
      adType: formData.adType,
      description: formData.description || undefined,
    };

    try {
      const response = await fetch("/api/ad-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          key: "",
          adType: "IMAGE",
          description: "",
        });
        fetchPublisherAndAdUnits();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create ad unit:", error);
      alert("Failed to create ad unit");
    }
  };

  const generateEmbedCode = (adUnit: AdUnit) => {
    return `<!-- X402 Ad Unit: ${adUnit.key} -->
<div id="x402-ad-${adUnit.key}" style="min-height: 250px;"></div>
<script>
  window.x402Ad.showAd({
    type: "${adUnit.adType.toLowerCase()}",
    adUnitId: "${adUnit.key}",
    onComplete: (result) => {
      console.log('Ad completed:', result);
      // Handle ad completion (complete, skip, click)
    },
  });
</script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Code copied to clipboard!");
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <PublisherLayout currentPage="Ad Units" publisherName={publisher?.siteName || "Publisher"}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Ad Unit Management</h1>
              <p className="text-sm text-slate-400">Create and manage ad slots for your website.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Create Ad Unit
            </button>
          </div>
        </header>

        {showForm && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create New Ad Unit</h2>
              <p className="text-sm text-slate-400">Define an ad slot for your website.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Ad Unit Key *</label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  placeholder="header-banner, sidebar-ad, video-preroll"
                />
                <p className="mt-1 text-xs text-slate-400">Unique identifier for this ad slot</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Ad Type *</label>
                <select
                  value={formData.adType}
                  onChange={(e) => setFormData({ ...formData, adType: e.target.value as "VIDEO" | "IMAGE" | "TEXT" | "HTML" })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                >
                  <option value="IMAGE">Image Banner</option>
                  <option value="VIDEO">Video Ad</option>
                  <option value="TEXT">Text Ad</option>
                  <option value="HTML">HTML/Rich Media</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  rows={3}
                  placeholder="Header banner ad, 728x90 pixels, above the fold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Create Ad Unit
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
            <h2 className="text-lg font-semibold">Your Ad Units</h2>
            <p className="text-sm text-slate-400">{adUnits.length} ad units configured.</p>
          </div>
          
          {adUnits.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No ad units yet. Create your first ad unit above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {adUnits.map((adUnit) => (
                <div key={adUnit.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">{adUnit.key}</h3>
                        <span className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300">
                          {adUnit.adType}
                        </span>
                      </div>
                      {adUnit.description && (
                        <p className="text-sm text-slate-400">{adUnit.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Events</div>
                      <div className="text-lg font-semibold text-slate-200">
                        {adUnit._count.events}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-300">Integration Code</h4>
                      <button
                        onClick={() => copyToClipboard(generateEmbedCode(adUnit))}
                        className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                      >
                        Copy Code
                      </button>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
                      <pre className="text-xs text-slate-300">
                        <code>{generateEmbedCode(adUnit)}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Created {new Date(adUnit.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SDK Integration Guide */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">SDK Integration</h2>
            <p className="text-sm text-slate-400">Add this code to your website to enable ads.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">1. Include the SDK</h3>
              <div className="rounded-lg bg-slate-950 p-4">
                <pre className="text-xs text-slate-300">
                  <code>{`<script src="/sdk/ad-sdk.js" data-app-id="${publisher?.appId || 'YOUR_APP_ID'}" async></script>`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">2. Initialize the SDK</h3>
              <div className="rounded-lg bg-slate-950 p-4">
                <pre className="text-xs text-slate-300">
                  <code>{`<script>
  window.x402Ad.init({
    appId: "${publisher?.appId || 'YOUR_APP_ID'}",
    eventsEndpoint: "/api/events"
  });
</script>`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">3. Use Ad Units</h3>
              <p className="text-xs text-slate-400 mb-2">
                Copy the integration code from each ad unit above and place it where you want ads to appear.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublisherLayout>
  );
}

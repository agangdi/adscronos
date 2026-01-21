"use client";

import { useState } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  costCents: number;
}

interface PaywallResponse {
  status: "payment_required" | "granted" | "unlocked";
  resource?: any;
  paywall?: {
    type: "ad_view";
    message: string;
    adConfig: {
      type: string;
      adUnitId: string;
      durationMs: number;
    };
  };
  message?: string;
}

export default function ChatGPTToolDemo() {
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [response, setResponse] = useState<PaywallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  const resources: Resource[] = [
    {
      id: "premium-analysis-1",
      title: "Advanced Market Analysis Report",
      description: "Comprehensive market analysis with AI insights",
      costCents: 500,
    },
    {
      id: "premium-template-1", 
      title: "Professional Business Plan Template",
      description: "Comprehensive business plan template with examples",
      costCents: 1000,
    }
  ];

  const requestResource = async (resourceId: string) => {
    setLoading(true);
    setResponse(null);
    setAdCompleted(false);

    try {
      const res = await fetch("/api/chatgpt-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-resource",
          resourceId,
          userId: "demo-user",
          sessionId: "demo-session",
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Failed to request resource:", error);
      alert("Failed to request resource");
    } finally {
      setLoading(false);
    }
  };

  const watchAd = () => {
    if (!response?.paywall) return;

    // Initialize the ad SDK if not already done
    if (typeof window !== "undefined" && window.x402Ad) {
      window.x402Ad.init({
        appId: "app_demo_id",
        eventsEndpoint: "/api/events"
      });

      // Show the ad
      window.x402Ad.showAd({
        type: response.paywall.adConfig.type,
        adUnitId: response.paywall.adConfig.adUnitId,
        durationMs: response.paywall.adConfig.durationMs,
        onComplete: async (result: string) => {
          if (result === "complete") {
            setAdCompleted(true);
            
            // Verify payment and unlock content
            try {
              const verifyRes = await fetch("/api/chatgpt-tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "verify-payment",
                  resourceId: selectedResource,
                  adEventId: "demo-event-id", // In real app, get from ad completion
                  signature: `${selectedResource}-demo-event-id`, // Mock signature
                }),
              });

              const verifyData = await verifyRes.json();
              setResponse(verifyData);
            } catch (error) {
              console.error("Failed to verify payment:", error);
              alert("Failed to verify payment");
            }
          } else {
            alert("Ad was skipped. Please watch the full ad to unlock content.");
          }
        },
      });
    } else {
      alert("Ad SDK not loaded. Please refresh the page.");
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 lg:px-10">
      {/* Include the ad SDK */}
      <script src="/sdk/ad-sdk.js" data-app-id="app_demo_id" async></script>
      
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">ChatGPT Tool Paywall Demo</h1>
          <p className="text-lg text-slate-400">
            Experience how premium content is unlocked through ad views in ChatGPT tools
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold mb-4">Available Premium Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                  selectedResource === resource.id
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
                onClick={() => setSelectedResource(resource.id)}
              >
                <h3 className="font-semibold text-slate-100">{resource.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{resource.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-sky-400">
                    {formatCurrency(resource.costCents)}
                  </span>
                  <span className="text-xs text-slate-500">Premium Content</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => selectedResource && requestResource(selectedResource)}
              disabled={!selectedResource || loading}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Requesting..." : "Request Selected Resource"}
            </button>
          </div>
        </section>

        {response && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            
            {response.status === "payment_required" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="font-medium text-yellow-300">Payment Required</span>
                  </div>
                  <p className="text-slate-300">{response.paywall?.message}</p>
                </div>
                
                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                  <h3 className="font-medium mb-2">Resource Details</h3>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p><strong>Title:</strong> {response.resource?.title}</p>
                    <p><strong>Cost:</strong> {formatCurrency(response.resource?.costCents || 0)}</p>
                    <p><strong>Payment Method:</strong> Watch a {response.paywall?.adConfig.durationMs ? Math.round(response.paywall.adConfig.durationMs / 1000) : 15}s ad</p>
                  </div>
                </div>

                <button
                  onClick={watchAd}
                  className="w-full rounded-lg bg-orange-600 px-4 py-3 font-medium text-white hover:bg-orange-700"
                >
                  Watch Ad to Unlock Content
                </button>
              </div>
            )}

            {response.status === "unlocked" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400">✅</span>
                    <span className="font-medium text-green-300">Content Unlocked!</span>
                  </div>
                  <p className="text-slate-300">{response.message}</p>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                  <h3 className="font-medium mb-3">Premium Content</h3>
                  <div className="space-y-3 text-sm">
                    {response.resource?.summary && (
                      <div>
                        <strong className="text-slate-300">Summary:</strong>
                        <p className="text-slate-400 mt-1">{response.resource.summary}</p>
                      </div>
                    )}
                    
                    {response.resource?.data && (
                      <div>
                        <strong className="text-slate-300">Data:</strong>
                        <pre className="text-slate-400 mt-1 text-xs bg-slate-900 p-2 rounded overflow-x-auto">
                          {JSON.stringify(response.resource.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {response.resource?.sections && (
                      <div>
                        <strong className="text-slate-300">Sections:</strong>
                        <ul className="text-slate-400 mt-1 list-disc list-inside">
                          {response.resource.sections.map((section: string, i: number) => (
                            <li key={i}>{section}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {response.resource?.downloadUrl && (
                      <div>
                        <strong className="text-slate-300">Download:</strong>
                        <a 
                          href={response.resource.downloadUrl}
                          className="text-sky-400 hover:text-sky-300 ml-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Template →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {response.status === "granted" && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">ℹ️</span>
                  <span className="font-medium text-blue-300">Access Granted</span>
                </div>
                <p className="text-slate-300">{response.message}</p>
              </div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-medium">1</span>
              <div>
                <strong className="text-slate-300">User requests premium content</strong>
                <p>ChatGPT tool receives request for paid resource</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-medium">2</span>
              <div>
                <strong className="text-slate-300">Paywall triggered</strong>
                <p>System responds with ad requirement instead of content</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-medium">3</span>
              <div>
                <strong className="text-slate-300">User watches ad</strong>
                <p>Ad SDK displays sponsored content, tracks completion</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-medium">4</span>
              <div>
                <strong className="text-slate-300">Payment verified</strong>
                <p>Backend verifies ad completion and processes payment</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-medium">5</span>
              <div>
                <strong className="text-slate-300">Content unlocked</strong>
                <p>Premium resource is delivered to the user</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

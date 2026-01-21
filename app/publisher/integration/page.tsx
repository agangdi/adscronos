import { prisma } from "@/lib/prisma";
import PublisherLayout from "@/components/PublisherLayout";

async function getPublisherIntegration() {
  const publisher = await prisma.publisher.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      adUnits: true,
    },
  });

  if (!publisher) return null;

  return { publisher };
}

export default async function PublisherIntegration() {
  const data = await getPublisherIntegration();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>No publisher found. Register via /api/auth/publisher/register.</p>
      </div>
    );
  }

  const { publisher } = data;

  const integrationCode = `<script src="https://cdn.x402ads.com/sdk/ad-sdk.js"></script>
<script>
  X402Ads.init({
    publisherId: "${publisher.appId}",
    domain: "${publisher.domain}"
  });
</script>`;

  const adUnitCode = (adUnitKey: string) => `<div id="x402-ad-${adUnitKey}"></div>
<script>
  X402Ads.displayAd('${adUnitKey}');
</script>`;

  return (
    <PublisherLayout currentPage="Integration" publisherName={publisher.siteName}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Website Integration</h1>
          <p className="text-sm text-slate-400">Integrate X402 ads into your website with our JavaScript SDK.</p>
        </header>

        {/* Quick Setup */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Quick Setup</h2>
            <p className="text-sm text-slate-400">Add this code to your website's &lt;head&gt; section</p>
          </div>
          <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
            <pre className="text-slate-300 whitespace-pre-wrap">{integrationCode}</pre>
          </div>
          <div className="mt-4 flex gap-3">
            <button 
              onClick={() => navigator.clipboard.writeText(integrationCode)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Copy Code
            </button>
            <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">
              Download SDK
            </button>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Ad Unit Integration */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Ad Unit Integration</h2>
              <p className="text-sm text-slate-400">Code snippets for your ad units</p>
            </div>
            <div className="space-y-4">
              {publisher.adUnits.map((adUnit) => (
                <div key={adUnit.id} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-slate-200">{adUnit.key}</div>
                      <div className="text-sm text-slate-400">{adUnit.adType}</div>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(adUnitCode(adUnit.key))}
                      className="text-emerald-400 hover:text-emerald-300 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="rounded bg-slate-900 p-3 font-mono text-xs">
                    <pre className="text-slate-300 whitespace-pre-wrap">{adUnitCode(adUnit.key)}</pre>
                  </div>
                </div>
              ))}
              {publisher.adUnits.length === 0 && (
                <p className="text-center text-slate-400 py-8">
                  No ad units created yet. Create your first ad unit to get integration code.
                </p>
              )}
            </div>
          </section>

          {/* Integration Guide */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Integration Guide</h2>
              <p className="text-sm text-slate-400">Step-by-step setup instructions</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <div className="font-medium text-slate-200">Install SDK</div>
                  <div className="text-sm text-slate-400">Add the SDK script to your website's head section</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <div className="font-medium text-slate-200">Initialize</div>
                  <div className="text-sm text-slate-400">Initialize the SDK with your publisher ID and domain</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <div className="font-medium text-slate-200">Place Ad Units</div>
                  <div className="text-sm text-slate-400">Add ad unit divs where you want ads to appear</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  4
                </div>
                <div>
                  <div className="font-medium text-slate-200">Test & Monitor</div>
                  <div className="text-sm text-slate-400">Test your integration and monitor performance</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Advanced Configuration */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Advanced Configuration</h2>
            <p className="text-sm text-slate-400">Customize your ad integration with advanced options</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-medium text-slate-200 mb-3">Lazy Loading</h3>
              <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
                <pre className="text-slate-300">{`X402Ads.init({
  publisherId: "${publisher.appId}",
  domain: "${publisher.domain}",
  lazyLoad: true,
  threshold: 0.1
});`}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-200 mb-3">Custom Targeting</h3>
              <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
                <pre className="text-slate-300">{`X402Ads.displayAd('ad-unit-key', {
  targeting: {
    category: 'technology',
    keywords: ['web', 'development']
  }
});`}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-200 mb-3">Event Callbacks</h3>
              <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
                <pre className="text-slate-300">{`X402Ads.on('adLoaded', function(adUnit) {
  console.log('Ad loaded:', adUnit);
});

X402Ads.on('adClicked', function(adUnit) {
  console.log('Ad clicked:', adUnit);
});`}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-200 mb-3">Responsive Ads</h3>
              <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm">
                <pre className="text-slate-300">{`X402Ads.displayAd('ad-unit-key', {
  responsive: true,
  breakpoints: {
    mobile: '320x50',
    tablet: '728x90',
    desktop: '970x250'
  }
});`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Testing Tools */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Testing Tools</h2>
            <p className="text-sm text-slate-400">Tools to help you test and debug your integration</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
              <div className="text-sm">Test Integration</div>
              <div className="text-xs text-slate-300">Verify SDK setup</div>
            </button>
            
            <button className="rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
              <div className="text-sm">Debug Console</div>
              <div className="text-xs text-slate-300">View debug logs</div>
            </button>
            
            <button className="rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
              <div className="text-sm">Preview Ads</div>
              <div className="text-xs text-slate-300">See test ads</div>
            </button>
            
            <button className="rounded-lg bg-slate-700 px-4 py-3 text-left font-medium text-white hover:bg-slate-600 transition-colors">
              <div className="text-sm">Performance Check</div>
              <div className="text-xs text-slate-300">Analyze load times</div>
            </button>
          </div>
        </section>
      </div>
    </PublisherLayout>
  );
}

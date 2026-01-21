import { prisma } from "@/lib/prisma";
import PublisherLayout from "@/components/PublisherLayout";
import ApiKeySection from "@/components/ApiKeySection";

async function getPublisherSettings() {
  const publisher = await prisma.publisher.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!publisher) return null;

  return { publisher };
}

export default async function PublisherSettings() {
  const data = await getPublisherSettings();
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>No publisher found. Register via /api/auth/publisher/register.</p>
      </div>
    );
  }

  const { publisher } = data;

  return (
    <PublisherLayout currentPage="Settings" publisherName={publisher.siteName}>
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-100">Account Settings</h1>
          <p className="text-sm text-slate-400">Manage your publisher account and preferences.</p>
        </header>

        {/* Account Information */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Account Information</h2>
            <p className="text-sm text-slate-400">Update your basic account details</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Site Name</label>
              <input
                type="text"
                defaultValue={publisher.siteName}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Domain</label>
              <input
                type="text"
                defaultValue={publisher.domain}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contact Email</label>
              <input
                type="email"
                defaultValue={publisher.authEmail}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Publisher ID</label>
              <input
                type="text"
                value={publisher.appId}
                disabled
                className="w-full rounded-lg border border-slate-700 bg-slate-700 px-3 py-2 text-slate-400"
              />
            </div>
          </div>
          <div className="mt-6">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Save Changes
            </button>
          </div>
        </section>

        {/* Payment Settings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Payment Settings</h2>
            <p className="text-sm text-slate-400">Configure your payment preferences</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option>Bank Transfer</option>
                <option>PayPal</option>
                <option>Stripe</option>
              </select>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Payout</label>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option>$50</option>
                  <option>$100</option>
                  <option>$250</option>
                  <option>$500</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Schedule</label>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option>Monthly</option>
                  <option>Bi-weekly</option>
                  <option>Weekly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bank Account Details</label>
              <div className="grid gap-4 lg:grid-cols-2">
                <input
                  type="text"
                  placeholder="Account Number"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Routing Number"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Update Payment Settings
            </button>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-slate-400">Choose what notifications you want to receive</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Email Notifications</div>
                <div className="text-sm text-slate-400">Receive email updates about your account</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Payment Notifications</div>
                <div className="text-sm text-slate-400">Get notified when payments are processed</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Performance Reports</div>
                <div className="text-sm text-slate-400">Weekly performance summary emails</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Marketing Updates</div>
                <div className="text-sm text-slate-400">News and updates about X402 platform</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Save Preferences
            </button>
          </div>
        </section>

        {/* API Settings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">API Settings</h2>
            <p className="text-sm text-slate-400">Manage your API keys and webhooks</p>
          </div>
          <div className="space-y-6">
            <ApiKeySection apiKey={publisher.apiKey} />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
              <input
                type="url"
                placeholder="https://your-site.com/webhooks/x402"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Webhook Events</label>
              <div className="grid gap-3 lg:grid-cols-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500" defaultChecked />
                  <span className="text-slate-300">Ad Impressions</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500" defaultChecked />
                  <span className="text-slate-300">Ad Clicks</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-slate-300">Revenue Updates</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-slate-300">Payment Events</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Update API Settings
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-red-800 bg-red-900/20 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
            <p className="text-sm text-slate-400">Irreversible and destructive actions</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-800 rounded-lg">
              <div>
                <div className="font-medium text-slate-200">Delete Account</div>
                <div className="text-sm text-slate-400">Permanently delete your publisher account and all data</div>
              </div>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </PublisherLayout>
  );
}

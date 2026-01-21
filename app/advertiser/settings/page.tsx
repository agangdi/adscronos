"use client";

import { useState, useEffect } from "react";
import AdvertiserLayout from "@/components/AdvertiserLayout";

interface AdvertiserSettings {
  id: string;
  name: string;
  authEmail: string;
  website?: string;
  contactEmail?: string;
  timezone: string;
  notifications: {
    email: boolean;
    campaignUpdates: boolean;
    billingAlerts: boolean;
    performanceReports: boolean;
  };
}

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdvertiserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch('/api/advertiser/settings', {
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
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/login?type=advertiser';
        return;
      }

      const response = await fetch('/api/advertiser/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login?type=advertiser';
        return;
      }

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <AdvertiserLayout currentPage="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading settings...</div>
        </div>
      </AdvertiserLayout>
    );
  }

  if (!settings) {
    return (
      <AdvertiserLayout currentPage="Settings">
        <div className="text-center py-12">
          <div className="text-slate-400">Failed to load settings</div>
        </div>
      </AdvertiserLayout>
    );
  }

  return (
    <AdvertiserLayout currentPage="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400">Manage your account preferences</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:bg-sky-600/50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes("successfully") 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {message}
          </div>
        )}

        {/* Account Information */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.authEmail}
                onChange={(e) => setSettings({ ...settings, authEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={settings.website || ''}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Email Notifications</div>
                <div className="text-sm text-slate-400">Receive notifications via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Campaign Updates</div>
                <div className="text-sm text-slate-400">Get notified about campaign status changes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.campaignUpdates}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, campaignUpdates: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Billing Alerts</div>
                <div className="text-sm text-slate-400">Receive alerts about billing and payments</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.billingAlerts}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, billingAlerts: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Performance Reports</div>
                <div className="text-sm text-slate-400">Weekly performance summary emails</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.performanceReports}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, performanceReports: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Change Password</div>
                <div className="text-sm text-slate-400">Update your account password</div>
              </div>
              <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-slate-400">Add an extra layer of security</div>
              </div>
              <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">
                Enable 2FA
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">API Keys</div>
                <div className="text-sm text-slate-400">Manage your API access keys</div>
              </div>
              <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">
                Manage Keys
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-6">Danger Zone</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-100 font-medium">Delete Account</div>
                <div className="text-sm text-slate-400">Permanently delete your account and all data</div>
              </div>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserLayout>
  );
}

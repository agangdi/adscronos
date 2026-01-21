"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [userType, setUserType] = useState<"advertiser" | "publisher">("advertiser");
  const [form, setForm] = useState({
    authEmail: "",
    password: "",
  });
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const endpoint = userType === "advertiser" 
        ? "/api/advertiser/login"
        : "/api/publisher/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setResult(json.error || "Login failed");
      } else {
        setResult("Login successful!");
        
        // Store JWT token in localStorage
        if (json.accessToken) {
          localStorage.setItem('authToken', json.accessToken);
          if (json.refreshToken) {
            localStorage.setItem('refreshToken', json.refreshToken);
          }
        }
        
        // Redirect to appropriate dashboard
        const dashboardUrl = userType === "advertiser" ? "/advertiser/dashboard" : "/publisher/dashboard";
        setTimeout(() => {
          window.location.href = dashboardUrl;
        }, 1000);
      }
    } catch {
      setResult("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
              <span className="text-sm font-bold text-white">X4</span>
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-white">X402 Ad Platform</div>
              <div className="text-xs text-slate-400">Smart Advertising & Monetization</div>
            </div>
          </Link>
          
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          {/* User Type Toggle */}
          <div className="mb-6">
            <div className="inline-flex w-full rounded-full border border-slate-800 bg-slate-900/80 text-sm text-slate-200">
              <button
                type="button"
                onClick={() => setUserType("advertiser")}
                className={`flex-1 px-4 py-2 rounded-full transition-colors ${
                  userType === "advertiser" 
                    ? "bg-sky-500 text-slate-950 font-semibold" 
                    : "hover:text-white"
                }`}
              >
                Advertiser
              </button>
              <button
                type="button"
                onClick={() => setUserType("publisher")}
                className={`flex-1 px-4 py-2 rounded-full transition-colors ${
                  userType === "publisher" 
                    ? "bg-emerald-500 text-slate-950 font-semibold" 
                    : "hover:text-white"
                }`}
              >
                Publisher
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-slate-200 mb-2">
                Email Address
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                type="email"
                value={form.authEmail}
                onChange={(e) => setForm(f => ({ ...f, authEmail: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 pr-12 text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                userType === "advertiser"
                  ? "bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50"
                  : "bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50"
              } disabled:cursor-not-allowed`}
            >
              {loading ? "Signing in..." : `Sign in as ${userType}`}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              result.includes("successful") 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {result}
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-400">Don&apos;t have an account? </span>
            <Link 
              href={`/register?type=${userType}`}
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              Sign up here
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

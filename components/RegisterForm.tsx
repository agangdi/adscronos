"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<"advertiser" | "publisher">("advertiser");
  const [form, setForm] = useState({
    name: "",
    siteName: "",
    domain: "",
    authEmail: "",
    contactEmail: "",
    password: "",
    confirmPassword: "",
    website: "",
  });
  const [result, setResult] = useState<string>("");
  const [errors, setErrors] = useState<{[key: string]: string[]}>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "advertiser" || type === "publisher") {
      setUserType(type);
    }
  }, [searchParams]);

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setErrors({});

    const newErrors: {[key: string]: string[]} = {};
    
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors;
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = ["Passwords do not match"];
    }

    if (!form.authEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authEmail)) {
      newErrors.authEmail = ["Please enter a valid email address"];
    }

    if (userType === "advertiser") {
      if (!form.name.trim()) {
        newErrors.name = ["Company name is required"];
      }
    } else {
      if (!form.siteName.trim()) {
        newErrors.siteName = ["Site name is required"];
      }
      if (!form.domain.trim()) {
        newErrors.domain = ["Domain is required"];
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const endpoint = userType === "advertiser" 
        ? "/api/auth/advertiser/register"
        : "/api/auth/publisher/register";

      const payload: Record<string, string> = {
        authEmail: form.authEmail,
        password: form.password,
      };

      if (userType === "advertiser") {
        payload.name = form.name;
        payload.contactEmail = form.contactEmail || form.authEmail;
        if (form.website) payload.website = form.website;
      } else {
        payload.siteName = form.siteName;
        payload.domain = form.domain;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error && typeof json.error === 'object' && json.error.fieldErrors) {
          setErrors(json.error.fieldErrors);
          setResult("Please fix the errors below");
        } else {
          setResult(json.error || "Registration failed");
        }
      } else {
        setResult("Registration successful! Redirecting to dashboard...");
        const dashboardUrl = userType === "advertiser" ? "/advertiser/dashboard" : "/publisher/dashboard";
        setTimeout(() => {
          window.location.href = dashboardUrl;
        }, 2000);
      }
    } catch {
      setResult("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/adscronos2_transparent_embedded.svg" alt="X402 Logo" className="h-14 w-auto" />
            <div className="text-left">
              <div className="text-xl font-bold text-white">Adscronos</div>
              <div className="text-xs text-slate-400">Smart Advertising & Monetization</div>
            </div>
          </Link>
          
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join thousands of advertisers and publishers</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
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
            {userType === "advertiser" && (
              <>
                <div>
                  <label className="block text-sm text-slate-200 mb-2">
                    Company Name *
                  </label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2.5 text-slate-100 outline-none transition-colors ${
                      errors.name 
                        ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                        : "border-slate-800 bg-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                    }`}
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm(f => ({ ...f, name: e.target.value }));
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: [] }));
                      }
                    }}
                    placeholder="Enter company name"
                    required
                  />
                  {errors.name && (
                    <div className="mt-1 text-xs text-red-400">
                      {errors.name[0]}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-2">
                    Website
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                  />
                  {errors.website && (
                    <div className="mt-1 text-xs text-red-400">
                      {errors.website[0]}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-2">
                    Contact Email
                  </label>
                  <input
                    className={`w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 outline-none transition-colors ${
                      errors.contactEmail 
                        ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                        : "focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                    }`}
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="contact@yourcompany.com"
                  />
                  {errors.contactEmail && (
                    <div className="mt-1 text-xs text-red-400">
                      {errors.contactEmail[0]}
                    </div>
                  )}
                </div>
              </>
            )}

            {userType === "publisher" && (
              <>
                <div>
                  <label className="block text-sm text-slate-200 mb-2">
                    Site Name *
                  </label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2.5 text-slate-100 outline-none transition-colors ${
                      errors.siteName 
                        ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                        : "border-slate-800 bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    }`}
                    type="text"
                    value={form.siteName}
                    onChange={(e) => {
                      setForm(f => ({ ...f, siteName: e.target.value }));
                      if (errors.siteName) {
                        setErrors(prev => ({ ...prev, siteName: [] }));
                      }
                    }}
                    placeholder="Enter site name"
                    required
                  />
                  {errors.siteName && (
                    <div className="mt-1 text-xs text-red-400">
                      {errors.siteName[0]}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-2">
                    Domain *
                  </label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2.5 text-slate-100 outline-none transition-colors ${
                      errors.domain 
                        ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                        : "border-slate-800 bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    }`}
                    type="url"
                    value={form.domain}
                    onChange={(e) => {
                      setForm(f => ({ ...f, domain: e.target.value }));
                      if (errors.domain) {
                        setErrors(prev => ({ ...prev, domain: [] }));
                      }
                    }}
                    placeholder="https://mysite.com"
                    required
                  />
                  {errors.domain && (
                    <div className="mt-1 text-xs text-red-400">
                      {errors.domain[0]}
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-slate-200 mb-2">
                Email Address *
              </label>
              <input
                className={`w-full rounded-lg border px-3 py-2.5 text-slate-100 outline-none transition-colors ${
                  errors.authEmail 
                    ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                    : userType === "advertiser"
                      ? "border-slate-800 bg-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                      : "border-slate-800 bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                }`}
                type="email"
                value={form.authEmail}
                onChange={(e) => {
                  setForm(f => ({ ...f, authEmail: e.target.value }));
                  if (errors.authEmail) {
                    setErrors(prev => ({ ...prev, authEmail: [] }));
                  }
                }}
                placeholder="Enter your email"
                required
              />
              {errors.authEmail && (
                <div className="mt-1 text-xs text-red-400">
                  {errors.authEmail[0]}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  className={`w-full rounded-lg border px-3 py-2.5 pr-12 text-slate-100 outline-none transition-colors ${
                    errors.password 
                      ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                      : userType === "advertiser"
                        ? "border-slate-800 bg-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                        : "border-slate-800 bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  }`}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm(f => ({ ...f, password: e.target.value }));
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: [] }));
                    }
                  }}
                  placeholder="Create a password (min 8 chars, uppercase, lowercase, number)"
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
              {errors.password && (
                <div className="mt-1 text-xs text-red-400">
                  {errors.password[0]}
                </div>
              )}
              {form.password && (
                <div className="mt-2">
                  <div className="text-xs text-slate-400 mb-1">Password strength:</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const passwordErrors = validatePassword(form.password);
                      const strength = 4 - passwordErrors.length;
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= strength
                              ? strength === 1
                                ? "bg-red-500"
                                : strength === 2
                                ? "bg-yellow-500"
                                : strength === 3
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                              : "bg-slate-700"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className={`text-xs mt-1 ${
                    validatePassword(form.password).length === 0 ? "text-emerald-400" : "text-slate-400"
                  }`}>
                    {validatePassword(form.password).length === 0 
                      ? "Strong password" 
                      : `${4 - validatePassword(form.password).length}/4 requirements met`
                    }
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  className={`w-full rounded-lg border px-3 py-2.5 pr-12 text-slate-100 outline-none transition-colors ${
                    errors.confirmPassword 
                      ? "border-red-500 bg-red-500/5 focus:border-red-400 focus:ring-1 focus:ring-red-400/20" 
                      : userType === "advertiser"
                        ? "border-slate-800 bg-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                        : "border-slate-800 bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  }`}
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm(f => ({ ...f, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: [] }));
                    }
                  }}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <div className="mt-1 text-xs text-red-400">
                  {errors.confirmPassword[0]}
                </div>
              )}
              {form.confirmPassword && (
                <div className={`mt-1 text-xs ${
                  form.password === form.confirmPassword ? "text-emerald-400" : "text-red-400"
                }`}>
                  {form.password === form.confirmPassword ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}
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
              {loading ? "Creating account..." : `Create ${userType} account`}
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

          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              <div className="font-medium mb-2">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, fieldErrors]) => (
                  fieldErrors.map((error, index) => (
                    <li key={`${field}-${index}`}>
                      <span className="capitalize">{field === 'authEmail' ? 'Email' : field === 'siteName' ? 'Site Name' : field}</span>: {error}
                    </li>
                  ))
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-400">Already have an account? </span>
            <Link 
              href="/login"
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              Sign in here
            </Link>
          </div>
        </div>

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

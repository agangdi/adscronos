"use client";

import { useState } from "react";

type Mode = "advertiser" | "publisher";
type Action = "login" | "register";

export function AuthForms() {
  const [mode, setMode] = useState<Mode>("advertiser");
  const [action, setAction] = useState<Action>("login");
  const [form, setForm] = useState({
    name: "",
    siteName: "",
    domain: "",
    authEmail: "",
    contactEmail: "",
    password: "",
    website: "",
  });
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const isAdv = mode === "advertiser";
      const endpoint =
        action === "register"
          ? isAdv
            ? "/api/auth/advertiser/register"
            : "/api/auth/publisher/register"
          : isAdv
            ? "/api/auth/advertiser/login"
            : "/api/auth/publisher/login";

      const payload: Record<string, string> = {
        authEmail: form.authEmail,
        password: form.password,
      };

      if (action === "register") {
        if (isAdv) {
          payload.name = form.name;
          payload.contactEmail = form.contactEmail || form.authEmail;
          if (form.website) payload.website = form.website;
        } else {
          payload.siteName = form.siteName;
          payload.domain = form.domain;
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setResult(json.error || "Request failed");
      } else {
        setResult(JSON.stringify(json, null, 2));
      }
    } catch (err) {
      setResult("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/80 text-xs text-slate-200">
          <button
            type="button"
            onClick={() => setMode("advertiser")}
            className={`px-3 py-1 ${mode === "advertiser" ? "bg-sky-500 text-slate-950" : ""}`}
          >
            Advertiser
          </button>
          <button
            type="button"
            onClick={() => setMode("publisher")}
            className={`px-3 py-1 ${mode === "publisher" ? "bg-emerald-500 text-slate-950" : ""}`}
          >
            Publisher
          </button>
        </div>
        <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/80 text-xs text-slate-200">
          <button
            type="button"
            onClick={() => setAction("login")}
            className={`px-3 py-1 ${action === "login" ? "bg-slate-200 text-slate-950" : ""}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setAction("register")}
            className={`px-3 py-1 ${action === "register" ? "bg-slate-200 text-slate-950" : ""}`}
          >
            Register
          </button>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {action === "register" && mode === "advertiser" && (
          <>
            <Input
              label="Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
            />
            <Input
              label="Website"
              value={form.website}
              onChange={(v) => setForm((f) => ({ ...f, website: v }))}
              placeholder="https://example.com"
            />
            <Input
              label="Contact email"
              value={form.contactEmail}
              onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))}
              placeholder="ops@example.com"
            />
          </>
        )}

        {action === "register" && mode === "publisher" && (
          <>
            <Input
              label="Site name"
              value={form.siteName}
              onChange={(v) => setForm((f) => ({ ...f, siteName: v }))}
              required
            />
            <Input
              label="Domain"
              value={form.domain}
              onChange={(v) => setForm((f) => ({ ...f, domain: v }))}
              placeholder="https://mysite.com"
              required
            />
          </>
        )}

        <Input
          label="Auth email"
          value={form.authEmail}
          onChange={(v) => setForm((f) => ({ ...f, authEmail: v }))}
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? "Submitting..." : `${action === "login" ? "Login" : "Register"} as ${mode}`}
        </button>
      </form>

      {result && (
        <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-100">
          {result}
        </pre>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="mb-1 inline-block text-slate-300">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

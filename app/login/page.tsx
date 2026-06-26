"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const { loggedIn, role, refresh } = useAuth();

  useEffect(() => {
    if (!loggedIn) return;
    const target = role === "owner" ? "/owner" : role === "seller" ? "/dashboard" : "/";
    router.replace(target);
  }, [loggedIn, role, router]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleReset() {
    if (!identifier.trim()) { setError("Enter your email or phone"); return; }
    const email = identifier.trim().includes("@") ? identifier.trim() : `${identifier.trim().replace(/\D/g, "")}@kbuser.local`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both email/phone and password.");
      return;
    }

    const email = identifier.trim().includes("@")
      ? identifier.trim()
      : `${identifier.trim().replace(/\D/g, "")}@kbuser.local`;

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: password.trim(),
    });

    if (signInError || !data.user) {
      setError("Invalid credentials. Try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.status === "rejected") {
      setError("Your account has been rejected by the platform owner. Please contact support.");
      return;
    }

    const role = profile?.role || data.user.user_metadata?.role || "dukandar";
    const target = role === "owner" ? "/owner" : role === "seller" ? "/dashboard" : "/";
    await refresh();
    router.replace(target);
  }

  return (
    <div className="auth-layout has-bottom-nav page-slide-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 16 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 420, margin: "0 auto", borderRadius: 24, padding: 32, boxShadow: "var(--shadow-xl)" }}>
        <Link href="/" className="btn-premium btn-premium-ghost btn-premium-sm" style={{ marginBottom: 24, width: "fit-content" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </Link>

        <div style={{ marginBottom: 28 }}>
          <h1 className="auth-heading" style={{ fontSize: 30, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            Welcome
            <br />
            Back.
          </h1>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--color-text-secondary)", fontWeight: 600 }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="fade-in" style={{ marginBottom: 16, background: "var(--color-danger-light)", color: "#991b1b", border: "1px solid rgba(239, 68, 68, 0.35)", padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {resetSent ? (
          <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Reset link sent!</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600, lineHeight: 1.5 }}>Check your email inbox for the password reset link.</p>
            <button onClick={() => { setResetMode(false); setResetSent(false); setError(null); }} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ marginTop: 16 }}>Back to Login</button>
          </div>
        ) : resetMode ? (
          <div className="fade-in">
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 20, fontWeight: 700 }}>Enter your email or phone number to receive a password reset link.</p>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Email or Phone</label>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g. hello@kirana.com" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none", fontWeight: 600, transition: "border-color 0.2s, box-shadow 0.2s" }} />
            </div>
            <button onClick={handleReset} className="btn-premium btn-premium-primary" style={{ width: "100%" }}>Send Reset Link</button>
            <button onClick={() => { setResetMode(false); setError(null); }} className="btn-premium btn-premium-ghost btn-premium-sm" style={{ display: "block", margin: "14px auto 0" }}>Back to Login</button>
          </div>
        ) : (
        <form onSubmit={handleLogin} className="fade-in">
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              Email or Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. hello@kirana.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "white",
                fontSize: 14,
                outline: "none",
                fontWeight: 600,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)" }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null); }}
                style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "white",
                fontSize: 14,
                outline: "none",
                fontWeight: 600,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
          </div>

          <button type="submit" className="btn-premium btn-premium-primary" style={{ width: "100%", padding: "15px 16px" }}>
            Login to Account
          </button>

          <p style={{ textAlign: "center", marginTop: 20, fontWeight: 800, fontSize: 13, color: "var(--color-text-muted)" }}>
            New to Kirana Bazzar?{" "}
            <Link href="/signup" style={{ color: "var(--color-primary)", marginLeft: 4 }}>
              Sign Up
            </Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}

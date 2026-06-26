"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const { refresh } = useAuth();
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
    <div className="auth-layout" style={{ padding: 16 }}>
      <div
        className="auth-form-side"
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: 24,
            color: "var(--color-text-muted)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </Link>

        <div style={{ marginBottom: 18 }}>
          <h1
            className="auth-heading"
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--color-text)",
              lineHeight: 1.1,
            }}
          >
            Welcome
            <br />
            Back.
          </h1>
          <p
            className="text-muted"
            style={{
              fontSize: 14,
              marginTop: 8,
              color: "var(--color-text-secondary)",
            }}
          >
            Login to continue to your personalized grocery experience.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              padding: 12,
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {resetSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Reset link sent!</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>Check your email inbox for the password reset link.</p>
            <button onClick={() => { setResetMode(false); setResetSent(false); setError(null); }} style={{ marginTop: 16, color: "var(--color-primary)", fontWeight: 800, fontSize: 14 }}>Back to Login</button>
          </div>
        ) : resetMode ? (
          <div>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16, fontWeight: 700 }}>Enter your email or phone number to receive a password reset link.</p>
            <div className="input-group" style={{ marginBottom: 14 }}>
              <label className="label" style={{ fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Email or Phone</label>
              <input type="text" className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g. hello@kirana.com" style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none" }} />
            </div>
            <button onClick={handleReset} className="btn btn-primary" style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-primary)", color: "white", fontWeight: 900, fontSize: 15, boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)" }}>Send Reset Link</button>
            <button onClick={() => { setResetMode(false); setError(null); }} style={{ display: "block", margin: "14px auto 0", color: "var(--color-text-muted)", fontWeight: 700, fontSize: 13 }}>Back to Login</button>
          </div>
        ) : (
        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ marginBottom: 14 }}>
            <label
              className="label"
              style={{ fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}
            >
              Email or Phone
            </label>
            <input
              type="text"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. hello@kirana.com"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 18 }}>
            <label
              className="label"
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "var(--color-text-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              Password
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null); }}
                className="text-primary"
                style={{
                  textTransform: "none",
                  letterSpacing: "normal",
                  color: "var(--color-primary)",
                  fontWeight: 800,
                  fontSize: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Forgot?
              </button>
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              marginTop: 0,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)",
            }}
          >
            Login to Account
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 18,
              fontWeight: 800,
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
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

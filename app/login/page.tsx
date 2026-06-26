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
              <a
                href="#"
                className="text-primary"
                style={{
                  textTransform: "none",
                  letterSpacing: "normal",
                  color: "var(--color-primary)",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                Forgot?
              </a>
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
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addProfileFromAuth } from "@/lib/data";

type Role = "seller" | "dukandar";

type SellerProfile = {
  role: "seller";
  name: string;
  password: string;
  address: string;
  pincode: string;
  mobileNumber: string;
  whatsappNumber?: string;
  status: "pending";
};

type DukandarProfile = {
  role: "dukandar";
  dukanName: string;
  password: string;
  address: string;
  pincode: string;
  mobileNumber: string;
  whatsappNumber?: string;
  status: "pending" | "approved";
};

type Profile = SellerProfile | DukandarProfile;

function sanitizeDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

function formatMobileHint(m: string) {
  const d = sanitizeDigits(m);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 10)}`;
}

export default function SignUp() {
  const supabase = createClient();
  const [role, setRole] = useState<Role>("seller");
  const [useOtp, setUseOtp] = useState<boolean>(true);

  const [nameOrDukanName, setNameOrDukanName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setOtpSent(false);
    setOtp("");
    setOtpError(null);
    setSuccessMsg(null);
    setError(null);
  }, [mobileNumber, role]);

  const validate = (): string | null => {
    if (!nameOrDukanName.trim()) return role === "seller" ? "Please enter Seller name." : "Please enter Dukandar name.";
    if (!address.trim()) return "Please enter your address.";
    if (!password.trim() || password.length < 6) return "Password must be at least 6 characters.";
    const pin = sanitizeDigits(pincode);
    if (pin.length !== 6) return "Please enter a valid 6-digit pincode.";
    const mob = sanitizeDigits(mobileNumber);
    if (mob.length !== 10) return "Please enter a valid 10-digit mobile number.";
    return null;
  };

  const sendOtp = () => {
    const pinErr = validate();
    if (pinErr) {
      setError(pinErr);
      return;
    }
    setError(null);
    setOtpSent(true);
    setOtpError(null);
  };

  const confirmOtp = () => {
    setOtpError(null);
    if (!otpSent) {
      setOtpError("Please send OTP first.");
      return false;
    }
    const entered = sanitizeDigits(otp);
    if (entered.length !== 4) {
      setOtpError("Please enter a valid 4-digit OTP.");
      return false;
    }
    return true;
  };

  const createProfile = async () => {
    const pinErr = validate();
    if (pinErr) {
      setError(pinErr);
      return;
    }

    if (useOtp) {
      const ok = confirmOtp();
      if (!ok) return;
    }

    setError(null);

    const mob = sanitizeDigits(mobileNumber);
    const email = `${mob}@kbuser.local`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: password.trim(),
      options: {
        data: {
          role,
          name: nameOrDukanName.trim(),
          mobile_number: mob,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setError("Signup failed. Please try again.");
      return;
    }

    const wa = sanitizeDigits(whatsappNumber);
    await addProfileFromAuth(data.user.id, {
      role,
      name: role === "seller" ? nameOrDukanName.trim() : undefined,
      dukanName: role === "dukandar" ? nameOrDukanName.trim() : undefined,
      mobileNumber: mob,
      address: address.trim(),
      pincode: sanitizeDigits(pincode),
      whatsappNumber: wa.length >= 10 ? wa : undefined,
      status: "pending",
    });

    setSuccessMsg("Profile created successfully. Redirecting...");
    setTimeout(() => {
      window.location.href = role === "seller" ? "/dashboard" : "/";
    }, 1000);
  };

  return (
    <div className="auth-layout" style={{ padding: 16 }}>
      <div
        className="auth-form-side"
        style={{
          width: "100%",
          maxWidth: 620,
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
            Create
            <br />
            Account.
          </h1>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Choose your role and create your profile.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setRole("seller")}
            style={{
              flex: 1,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${role === "seller" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: role === "seller" ? "var(--color-primary-light)" : "white",
              color: "var(--color-text)",
              fontWeight: 900,
            }}
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => setRole("dukandar")}
            style={{
              flex: 1,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${role === "dukandar" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: role === "dukandar" ? "var(--color-primary-light)" : "white",
              color: "var(--color-text)",
              fontWeight: 900,
            }}
          >
            Dukandar
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 900, color: "var(--color-text-secondary)", fontSize: 13 }}>OTP verification</div>
          <button
            type="button"
            onClick={() => setUseOtp((v) => !v)}
            style={{
              padding: "10px 12px",
              borderRadius: "999px",
              border: `1px solid ${useOtp ? "var(--color-primary)" : "var(--color-border)"}`,
              background: useOtp ? "var(--color-primary-light)" : "white",
              fontWeight: 900,
              color: "var(--color-text)",
            }}
            aria-pressed={useOtp}
          >
            {useOtp ? "Enabled" : "Disabled"}
          </button>
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

        {successMsg && (
          <div
            style={{
              marginBottom: 12,
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              padding: 12,
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {successMsg}
          </div>
        )}

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>
            {role === "seller" ? "Seller Name" : "Dukandar / Dukan Name"}
          </label>
          <input
            type="text"
            value={nameOrDukanName}
            onChange={(e) => setNameOrDukanName(e.target.value)}
            placeholder={role === "seller" ? "e.g. Rahul Sharma" : "e.g. Kiran Kirana Mart"}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="House no, Street, Locality"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
              resize: "vertical",
            }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Pincode</label>
          <input
            value={pincode}
            onChange={(e) => setPincode(sanitizeDigits(e.target.value).slice(0, 6))}
            placeholder="e.g. 110001"
            inputMode="numeric"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Mobile Number</label>
          <input
            value={formatMobileHint(mobileNumber)}
            onChange={(e) => setMobileNumber(sanitizeDigits(e.target.value).slice(0, 10))}
            placeholder="e.g. 9876543210"
            inputMode="numeric"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>WhatsApp Number <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
          <input
            value={formatMobileHint(whatsappNumber)}
            onChange={(e) => setWhatsappNumber(sanitizeDigits(e.target.value).slice(0, 10))}
            placeholder="e.g. 9876543210"
            inputMode="numeric"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "white",
              fontSize: 14,
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        {useOtp ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 900, color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 8 }}>
              OTP Verification (Dummy)
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={sendOtp}
                style={{
                  flex: 1,
                  padding: "12px 12px",
                  borderRadius: "var(--radius-md)",
                  background: otpSent ? "white" : "var(--color-primary-light)",
                  border: `1px solid ${otpSent ? "var(--color-border)" : "var(--color-primary)"}`,
                  color: "var(--color-text)",
                  fontWeight: 900,
                }}
              >
                {otpSent ? "OTP Sent" : "Send OTP"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = confirmOtp();
                  if (!ok) return;
                  createProfile();
                }}
                style={{
                  flex: 1,
                  padding: "12px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-primary)",
                  border: "2px solid var(--color-primary)",
                  color: "white",
                  fontWeight: 900,
                }}
              >
                Verify & Create
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <input
                value={otp}
                onChange={(e) => setOtp(sanitizeDigits(e.target.value).slice(0, 4))}
                placeholder="Enter OTP"
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "white",
                  fontSize: 14,
                  outline: "none",
                  fontWeight: 900,
                }}
              />

              <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-muted)", fontWeight: 800 }}>
                OTP sent to your mobile number
              </div>

              {otpError && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#fef2f2",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#991b1b",
                    padding: 10,
                    borderRadius: 10,
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {otpError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={createProfile}
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
            Create Profile
          </button>
        )}

        <p style={{ textAlign: "center", marginTop: 18, fontWeight: 800, fontSize: 13, color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-primary)", marginLeft: 4 }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

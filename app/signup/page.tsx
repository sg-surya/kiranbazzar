"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { addProfileFromAuth } from "@/lib/data";

type Role = "seller" | "dukandar";

function sanitizeDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

function formatMobileHint(m: string) {
  const d = sanitizeDigits(m);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 10)}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid var(--color-border)", background: "white",
  fontSize: 14, outline: "none", fontWeight: 600,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();
  const { refresh } = useAuth();
  const [role, setRole] = useState<Role>("seller");

  const [nameOrDukanName, setNameOrDukanName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [dukanPhoto, setDukanPhoto] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const createProfile = async () => {
    const pinErr = validate();
    if (pinErr) {
      setError(pinErr);
      return;
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
      photo: role === "dukandar" && dukanPhoto ? dukanPhoto : undefined,
      status: "pending",
    });

    if (role === "seller" && upiId.trim()) {
      await supabase.from("store_settings").upsert({
        seller_mobile: mob,
        upi_id: upiId.trim(),
        store_name: nameOrDukanName.trim() || "My Store",
      });
    }

    setSuccessMsg("Profile created successfully. Redirecting...");
    await refresh();
    setTimeout(() => {
      router.replace(role === "seller" ? "/dashboard" : "/");
    }, 1000);
  };

  return (
    <div className="auth-layout has-bottom-nav page-slide-enter" style={{ padding: 16 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 560, margin: "0 auto", borderRadius: 24, padding: 28, boxShadow: "var(--shadow-xl)" }}>
        <Link href="/" className="btn-premium btn-premium-ghost btn-premium-sm" style={{ marginBottom: 20, width: "fit-content" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </Link>

        <div style={{ marginBottom: 20 }}>
          <h1 className="auth-heading" style={{ fontSize: 30, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            Create
            <br />
            Account.
          </h1>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--color-text-secondary)", fontWeight: 600 }}>
            Choose your role and create your profile.
          </p>
        </div>

        <div className="scale-in" style={{ display: "flex", gap: 10, marginBottom: 20, background: "var(--color-border-light)", borderRadius: 14, padding: 4 }}>
          <button
            type="button"
            onClick={() => setRole("seller")}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 12,
              border: "none", fontWeight: 900, fontSize: 14,
              background: role === "seller" ? "white" : "transparent",
              color: role === "seller" ? "var(--color-primary)" : "var(--color-text-secondary)",
              boxShadow: role === "seller" ? "var(--shadow-sm)" : "none",
              transition: "all 0.2s var(--ease-out)", cursor: "pointer",
            }}
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => setRole("dukandar")}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 12,
              border: "none", fontWeight: 900, fontSize: 14,
              background: role === "dukandar" ? "white" : "transparent",
              color: role === "dukandar" ? "var(--color-primary)" : "var(--color-text-secondary)",
              boxShadow: role === "dukandar" ? "var(--shadow-sm)" : "none",
              transition: "all 0.2s var(--ease-out)", cursor: "pointer",
            }}
          >
            Dukandar
          </button>
        </div>

        {error && (
          <div className="fade-in" style={{ marginBottom: 14, background: "var(--color-danger-light)", color: "#991b1b", border: "1px solid rgba(239, 68, 68, 0.35)", padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="fade-in" style={{ marginBottom: 14, background: "var(--color-primary-light)", color: "var(--color-primary-dark)", border: "1px solid rgba(5, 150, 105, 0.35)", padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            {successMsg}
          </div>
        )}

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            {role === "seller" ? "Seller Name" : "Dukandar / Dukan Name"}
          </label>
          <input type="text" value={nameOrDukanName} onChange={(e) => setNameOrDukanName(e.target.value)} placeholder={role === "seller" ? "e.g. Rahul Sharma" : "e.g. Kiran Kirana Mart"} style={inputStyle} />
        </div>

        <div className="input-group" style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="House no, Street, Locality" style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="input-group">
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Pincode</label>
            <input value={pincode} onChange={(e) => setPincode(sanitizeDigits(e.target.value).slice(0, 6))} placeholder="e.g. 110001" inputMode="numeric" style={inputStyle} />
          </div>
          <div className="input-group">
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Mobile Number</label>
            <input value={formatMobileHint(mobileNumber)} onChange={(e) => setMobileNumber(sanitizeDigits(e.target.value).slice(0, 10))} placeholder="e.g. 9876543210" inputMode="numeric" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: role === "seller" ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 14 }}>
          <div className="input-group">
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>WhatsApp Number <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
            <input value={formatMobileHint(whatsappNumber)} onChange={(e) => setWhatsappNumber(sanitizeDigits(e.target.value).slice(0, 10))} placeholder="e.g. 9876543210" inputMode="numeric" style={inputStyle} />
          </div>
          {role === "seller" && (
            <div className="input-group">
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>UPI ID <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(for payments)</span></label>
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. seller@paytm" style={inputStyle} />
            </div>
          )}
        </div>

        {role === "dukandar" && (
          <div className="input-group" style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Dukan Photo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) { alert("Image too large. Max 2MB."); return; }
              const reader = new FileReader();
              reader.onload = () => setDukanPhoto(reader.result as string);
              reader.readAsDataURL(file);
            }} style={{ marginTop: 4, fontSize: 13, width: "100%" }} />
            {dukanPhoto && (
              <div style={{ marginTop: 8 }}>
                <img src={dukanPhoto} alt="Dukan preview" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "2px solid var(--color-primary-light)" }} />
              </div>
            )}
          </div>
        )}

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            Password
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
        </div>

        <button type="button" onClick={createProfile} className="btn-premium btn-premium-primary" style={{ width: "100%", padding: "15px 16px" }}>
          Create Profile
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontWeight: 800, fontSize: 13, color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-primary)", marginLeft: 4 }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

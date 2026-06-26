"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getProfileByMobile, updateProfile } from "@/lib/data";
import { useAuth } from "@/app/context/AuthContext";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid var(--color-border)", background: "white",
  fontSize: 14, outline: "none", fontWeight: 600,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export default function ProfilePage() {
  const { mobile, name, role, status, refresh } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [dukanName, setDukanName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    if (!mobile) return;
    setLoading(true);
    getProfileByMobile(mobile).then((data) => {
      if (data) {
        setDisplayName(data.name || "");
        setDukanName(data.dukan_name || "");
        setAddress(data.address || "");
        setPincode(data.pincode || "");
        setPhoto(data.photo || "");
      }
      setLoading(false);
    });
  }, [mobile]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!mobile) return;

    const updates: Record<string, any> = {
      address: address.trim(),
      pincode: pincode.trim(),
    };

    if (role === "seller") {
      updates.name = displayName.trim();
    } else {
      updates.dukan_name = dukanName.trim();
    }

    if (role === "dukandar" && photo) {
      updates.photo = photo;
    }

    setSaving(true);
    const ok = await updateProfile(mobile, updates);
    setSaving(false);

    if (ok) {
      setSuccess("Profile updated successfully!");
      refresh();
    } else {
      setError("Failed to update profile. Please try again.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Max 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (status === "rejected") {
    return (
      <div className="auth-layout has-bottom-nav" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>Account Rejected</h2>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", fontWeight: 700, marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>Your account has been rejected by the platform owner.</p>
          <Link href="/" className="btn-premium btn-premium-primary" style={{ marginTop: 20 }}>Go to Home</Link>
        </div>
      </div>
    );
  }

  if (!mobile) {
    return (
      <div className="auth-layout has-bottom-nav" style={{ padding: 16 }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>Please log in to view your profile.</p>
          <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 800 }}>Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout has-bottom-nav page-slide-enter" style={{ padding: 16 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 560, margin: "0 auto", borderRadius: 24, padding: 28, boxShadow: "var(--shadow-xl)" }}>
        <Link href="/" className="btn-premium btn-premium-ghost btn-premium-sm" style={{ marginBottom: 20, width: "fit-content" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>

        <div style={{ marginBottom: 20 }}>
          <h1 className="auth-heading" style={{ fontSize: 30, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--color-text-secondary)", fontWeight: 600 }}>
            Manage your profile information
          </p>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }} />
            ))}
          </div>
        )}

        {!loading && (
          <>
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

            {success && (
              <div className="fade-in" style={{ marginBottom: 14, background: "var(--color-primary-light)", color: "var(--color-primary-dark)", border: "1px solid rgba(5, 150, 105, 0.35)", padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                {success}
              </div>
            )}

            {role === "seller" && (
              <div className="input-group" style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Seller Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
              </div>
            )}

            {role === "dukandar" && (
              <>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Dukandar / Dukan Name</label>
                  <input type="text" value={dukanName} onChange={(e) => setDukanName(e.target.value)} style={inputStyle} />
                </div>

                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Dukan Photo</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ marginTop: 4, fontSize: 13, width: "100%" }} />
                  {photo && (
                    <div style={{ marginTop: 8 }}>
                      <img src={photo} alt="Dukan photo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "2px solid var(--color-primary-light)" }} />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Mobile Number</label>
              <input type="text" value={mobile} disabled style={{ ...inputStyle, background: "#f3f4f6", color: "var(--color-text-muted)" }} />
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)", marginBottom: 6 }}>Pincode</label>
              <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D+/g, "").slice(0, 6))} inputMode="numeric" style={inputStyle} />
            </div>

            <button type="button" onClick={handleSave} disabled={saving} className="btn-premium btn-premium-primary" style={{ width: "100%", padding: "15px 16px", opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

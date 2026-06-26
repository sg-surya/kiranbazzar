"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getProfileByMobile, updateProfile } from "@/lib/data";
import { useAuth } from "@/app/context/AuthContext";

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
      <div className="auth-layout" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 16, color: "#1f2937" }}>Account Rejected</h2>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", fontWeight: 700, marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>Your account has been rejected by the platform owner.</p>
          <Link href="/" style={{ marginTop: 20, padding: "12px 28px", borderRadius: 8, background: "var(--color-primary)", color: "white", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>Go to Home</Link>
        </div>
      </div>
    );
  }

  if (!mobile) {
    return (
      <div className="auth-layout" style={{ padding: 16 }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>Please log in to view your profile.</p>
          <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 800 }}>Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout" style={{ padding: 16 }}>
      <div
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </Link>

        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Manage your profile information
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, fontWeight: 700, color: "var(--color-text-muted)" }}>
            Loading...
          </div>
        )}

        {!loading && (
          <>
            {error && (
              <div style={{ marginBottom: 12, background: "#fef2f2", color: "#991b1b", border: "1px solid rgba(239, 68, 68, 0.35)", padding: 12, borderRadius: 10, fontWeight: 900, fontSize: 13 }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ marginBottom: 12, background: "var(--color-primary-light)", color: "var(--color-primary-dark)", border: "1px solid rgba(34, 197, 94, 0.35)", padding: 12, borderRadius: 10, fontWeight: 900, fontSize: 13 }}>
                {success}
              </div>
            )}

            {role === "seller" && (
              <div className="input-group" style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Seller Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none", fontWeight: 700 }}
                />
              </div>
            )}

            {role === "dukandar" && (
              <>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Dukandar / Dukan Name</label>
                  <input
                    type="text"
                    value={dukanName}
                    onChange={(e) => setDukanName(e.target.value)}
                    style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none", fontWeight: 700 }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Dukan Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ marginTop: 6, fontSize: 13, width: "100%" }}
                  />
                  {photo && (
                    <div style={{ marginTop: 8 }}>
                      <img src={photo} alt="Dukan photo" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)" }} />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Mobile Number</label>
              <input
                type="text"
                value={mobile}
                disabled
                style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "#f3f4f6", fontSize: 14, outline: "none", fontWeight: 700, color: "var(--color-text-muted)" }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none", fontWeight: 700, resize: "vertical" }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--color-text-secondary)" }}>Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D+/g, "").slice(0, 6))}
                inputMode="numeric"
                style={{ width: "100%", marginTop: 6, padding: "12px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", fontSize: 14, outline: "none", fontWeight: 700 }}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{
                width: "100%",
                marginTop: 0,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: saving ? "#9ca3af" : "var(--color-primary)",
                color: "white",
                fontWeight: 900,
                fontSize: 15,
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)",
                cursor: saving ? "not-allowed" : "pointer",
                border: "none",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const SPLASH_DURATION = 2500;
const MAX_SPLASH_DURATION = 5000;

function shouldShowSplash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !sessionStorage.getItem("kb_splash");
  } catch {
    return true;
  }
}

export default function SplashScreen() {
  const [show, setShow] = useState(shouldShowSplash);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem("kb_splash", "1"); } catch {}
    }, SPLASH_DURATION);
    const safety = setTimeout(() => {
      setShow(false);
    }, MAX_SPLASH_DURATION);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(160deg, #059669 0%, #10b981 40%, #34d399 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        animation: "kbFadeIn 0.3s ease",
      }}
    >
      <div style={{ position: "absolute", top: "-30%", right: "-20%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-25%", left: "-15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <svg width="80" height="80" viewBox="0 0 512 512" style={{ marginBottom: 24 }}>
        <rect width="512" height="512" rx="96" fill="white" opacity="0.15" />
        <g transform="translate(256,260)">
          <path d="M-120-40 L-100-160 L100-160 L120-40Z" fill="white" opacity="0.95"/>
          <rect x="-120" y="-40" width="240" height="180" rx="16" fill="white" opacity="0.95"/>
          <path d="M-80-140 Q-80-200 0-200 Q80-200 80-140" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" opacity="0.95"/>
          <line x1="-80" y1="30" x2="80" y2="30" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.3"/>
          <line x1="-60" y1="70" x2="60" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.3"/>
          <line x1="-40" y1="110" x2="40" y2="110" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.3"/>
        </g>
      </svg>

      <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.5px", marginBottom: 8 }}>Kirana Bazzar</h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 40 }}>
        Best Prices, Fastest Delivery
      </p>

      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.6)",
              animation: `kbBounce 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes kbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes kbBounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

"use client";

import React from "react";

interface AlertProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info";
  icon?: React.ReactNode;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

const variantStyle: Record<string, { bg: string; border: string; color: string }> = {
  success: { bg: "var(--color-success-light)", border: "rgba(5,150,105,0.3)", color: "var(--color-primary-dark)" },
  error: { bg: "var(--color-danger-light)", border: "rgba(239,68,68,0.3)", color: "#991b1b" },
  warning: { bg: "var(--color-accent-light)", border: "rgba(245,158,11,0.3)", color: "#92400e" },
  info: { bg: "#eff6ff", border: "rgba(59,130,246,0.3)", color: "#1e40af" },
};

export default function Alert({
  children,
  variant = "info",
  icon,
  onDismiss,
  style,
}: AlertProps) {
  const v = variantStyle[variant];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1.4,
        marginBottom: 12,
        ...style,
      }}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            color: v.color,
            cursor: "pointer",
            opacity: 0.6,
            fontSize: 16,
            padding: 4,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

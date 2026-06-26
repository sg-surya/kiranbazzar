import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "info" | "danger" | "neutral" | "discount" | "premium";
  size?: "sm" | "md";
  className?: string;
}

const variantStyle: Record<string, React.CSSProperties> = {
  success: { background: "var(--color-success-light)", color: "var(--color-primary-dark)" },
  warning: { background: "var(--color-accent-light)", color: "#92400e" },
  info: { background: "var(--color-purple-light)", color: "#6d28d9" },
  danger: { background: "var(--color-danger-light)", color: "#991b1b" },
  neutral: { background: "#f1f5f9", color: "#475569" },
  discount: { background: "#fef2f2", color: "var(--color-discount)" },
  premium: { background: "var(--color-primary)", color: "white" },
};

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "3px 10px" : "6px 14px",
        borderRadius: "var(--radius-xl)",
        fontSize: size === "sm" ? 11 : 13,
        fontWeight: 800,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        ...variantStyle[variant],
      }}
    >
      {children}
    </span>
  );
}

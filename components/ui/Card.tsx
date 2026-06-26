import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "elevated" | "outlined" | "glass" | "flat";
  onClick?: () => void;
  padding?: string;
}

const variantStyle: Record<string, React.CSSProperties> = {
  elevated: {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-md)",
    border: "1px solid var(--color-border-light)",
  },
  outlined: {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
  },
  glass: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "var(--radius-md)",
    border: "1px solid rgba(226,232,240,0.5)",
    boxShadow: "var(--shadow-md)",
  },
  flat: {
    background: "var(--color-bg)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border-light)",
  },
};

export default function Card({
  children,
  className = "",
  style,
  variant = "elevated",
  onClick,
  padding,
}: CardProps) {
  return (
    <div
      className={className}
      style={{
        ...variantStyle[variant],
        padding: padding || "16px",
        cursor: onClick ? "pointer" : undefined,
        transition: "transform 0.15s var(--ease-out), box-shadow 0.15s",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

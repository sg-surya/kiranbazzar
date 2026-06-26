"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-premium btn-premium-primary",
  secondary: "btn-premium btn-premium-secondary",
  danger: "btn-premium btn-premium-danger",
  ghost: "btn-premium btn-premium-ghost",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const cls = `${variantClass[variant]} ${size === "sm" ? "btn-premium-sm" : ""} ${className}`.trim();
  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}

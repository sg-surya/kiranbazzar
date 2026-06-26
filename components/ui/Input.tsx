"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className = "",
  style,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 900,
            color: "var(--color-text-secondary)",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={className}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "var(--radius-sm)",
          border: `1.5px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
          background: "white",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--color-text)",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          ...style,
        }}
        onFocus={(e) => {
          const t = e.currentTarget;
          t.style.borderColor = error ? "var(--color-danger)" : "var(--color-primary)";
          t.style.boxShadow = error
            ? "0 0 0 3px rgba(239,68,68,0.1)"
            : "0 0 0 3px rgba(5,150,105,0.1)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          const t = e.currentTarget;
          t.style.borderColor = error ? "var(--color-danger)" : "var(--color-border)";
          t.style.boxShadow = "none";
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: 12, color: "var(--color-danger)", fontWeight: 700, marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

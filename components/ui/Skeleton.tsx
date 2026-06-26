import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  count?: number;
  variant?: "text" | "rect" | "circle" | "card";
}

export default function Skeleton({
  width,
  height,
  borderRadius,
  style,
  count = 1,
  variant = "text",
}: SkeletonProps) {
  const baseStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s ease-in-out infinite",
  };

  const variants: Record<string, React.CSSProperties> = {
    text: { height: 14, width: width || "80%", borderRadius: "var(--radius-xs)", marginBottom: 8 },
    rect: { height: height || 100, width: width || "100%", borderRadius: "var(--radius-sm)" },
    circle: { width: width || 48, height: height || 48, borderRadius: "50%" },
    card: { height: 160, width: "100%", borderRadius: "var(--radius-md)", marginBottom: 12 },
  };

  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          style={{
            ...baseStyle,
            ...variants[variant],
            ...style,
            ...(i < count - 1 ? { marginBottom: style?.marginBottom ?? 8 } : {}),
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

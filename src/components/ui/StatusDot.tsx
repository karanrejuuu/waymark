import React from "react";

export type StatusDotVariant = "urgent" | "escalated" | "fine" | "neutral";

interface StatusDotProps {
  variant: StatusDotVariant;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const colorMap: Record<StatusDotVariant, string> = {
  urgent: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
  escalated: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
  fine: "bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.6)]",
  neutral: "bg-zinc-600",
};

const sizeMap = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

export const StatusDot: React.FC<StatusDotProps> = ({
  variant,
  size = "md",
  label,
  className = "",
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <span
        aria-hidden="true"
        className={`${sizeMap[size]} rounded-full flex-shrink-0 ${colorMap[variant]}`}
      />
      {label && <span className="text-zinc-400">{label}</span>}
    </span>
  );
};

import React from "react";

export type StatusDotVariant = "urgent" | "escalated" | "fine" | "neutral";

interface StatusDotProps {
  variant: StatusDotVariant;
  label?: string;
  className?: string;
}

const colorMap: Record<StatusDotVariant, string> = {
  urgent: "bg-red-soft",
  escalated: "bg-yellow-soft",
  fine: "bg-green-soft",
  neutral: "bg-text-tertiary",
};

export const StatusDot: React.FC<StatusDotProps> = ({
  variant,
  label,
  className = "",
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[variant]}`}
      />
      {label && <span className="text-text-secondary">{label}</span>}
    </span>
  );
};

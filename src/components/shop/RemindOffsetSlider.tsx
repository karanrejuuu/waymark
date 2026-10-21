import React from "react";

interface RemindOffsetSliderProps {
  value: number; // 0 to 3
  onChange: (value: number) => void;
  label?: string;
}

export const RemindOffsetSlider: React.FC<RemindOffsetSliderProps> = ({
  value,
  onChange,
  label = "Remind me earlier",
}) => {
  return (
    <div className="w-full py-1">
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5 font-medium">
        <span>{label}</span>
        <span className="text-text-primary font-semibold">
          {value === 0 ? "On due date (0d)" : `${value} ${value === 1 ? "day" : "days"} early`}
        </span>
      </div>

      <div className="relative flex flex-col items-center">
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
        />

        {/* Ticks representation */}
        <div className="w-full flex justify-between px-0.5 mt-1.5 text-[10px] text-text-tertiary select-none">
          <span>0d</span>
          <span>1d</span>
          <span>2d</span>
          <span>3d</span>
        </div>
      </div>
    </div>
  );
};

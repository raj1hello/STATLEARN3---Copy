import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  target?: number; // 0 to 100
  color?: "purple" | "emerald" | "amber" | "blue";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const colorMap = {
  purple: "bg-purple-600 dark:bg-purple-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-600 dark:bg-blue-500",
};

const heightMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  target,
  color = "purple",
  size = "md",
  showLabel = false,
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const clampedTarget = target !== undefined ? Math.min(100, Math.max(0, target)) : undefined;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          <span>Current: {clampedValue}%</span>
          {clampedTarget !== undefined && <span>Target: {clampedTarget}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative ${heightMap[size]}`}>
        <div
          className={`${colorMap[color]} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
        {clampedTarget !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-slate-200 z-10"
            style={{ left: `${clampedTarget}%` }}
            title={`Target: ${clampedTarget}%`}
          />
        )}
      </div>
    </div>
  );
};

"tsx"
"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  height = 200,
  innerRadius = 55,
  outerRadius = 80,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#181a29" : "#FFFFFF",
              borderRadius: "12px",
              border: isDark ? "1px solid #2d314d" : "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
              color: isDark ? "#f8fafc" : "#0f172a",
              fontSize: "12px",
            }}
            itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
            formatter={(val, name) => [`${val}`, name]}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GaugeChart: React.FC<{ value: number; size?: number; label?: string }> = ({
  value,
  size = 110,
  label,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const clamped = Math.min(100, Math.max(0, value));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const bgCircleStroke = isDark ? "#1f2338" : "#F1F5F9";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgCircleStroke}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#7C3AED"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none">{clamped}%</span>
        {label && <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

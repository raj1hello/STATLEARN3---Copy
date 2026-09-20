"tsx"
"use client";

import React from "react";
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface RadarChartProps {
  data: { competency: string; current: number; target: number }[];
  height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, height = 260 }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-slate-400 dark:text-slate-400 text-sm">
        No competency breakdown available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke={isDark ? "#242842" : "#E2E8F0"} />
          <PolarAngleAxis dataKey="competency" stroke={isDark ? "#94A3B8" : "#64748B"} fontSize={11} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={isDark ? "#333856" : "#CBD5E1"} fontSize={10} />
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
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="#94A3B8"
            strokeDasharray="3 3"
            fill="#94A3B8"
            fillOpacity={isDark ? 0.15 : 0.1}
          />
          <Radar
            name="Current Score"
            dataKey="current"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="#7C3AED"
            fillOpacity={isDark ? 0.45 : 0.35}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

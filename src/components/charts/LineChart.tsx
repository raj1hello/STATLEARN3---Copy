"tsx"
"use client";

import React from "react";
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface LineChartProps {
  data: { name: string; score: number; target?: number }[];
  height?: number;
  showArea?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 220, showArea = true }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-slate-400 dark:text-slate-400 text-sm">
        No trend data available
      </div>
    );
  }

  const gridStroke = isDark ? "#1e2238" : "#F1F5F9";
  const textStroke = isDark ? "#94a3b8" : "#94A3B8";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={isDark ? 0.4 : 0.25} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="name" stroke={textStroke} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={textStroke} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
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
              formatter={(val) => [`${val}%`, "Score"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#7C3AED"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleGradient)"
            />
          </AreaChart>
        ) : (
          <RechartsLine data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="name" stroke={textStroke} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={textStroke} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
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
              formatter={(val) => [`${val}%`, "Score"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#7C3AED"
              strokeWidth={3}
              dot={{ r: 4, fill: "#7C3AED", strokeWidth: 2, stroke: isDark ? "#181a29" : "#FFFFFF" }}
              activeDot={{ r: 6 }}
            />
          </RechartsLine>
        )}
      </ResponsiveContainer>
    </div>
  );
};

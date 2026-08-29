"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Smile, Meh, Frown, Flame, Activity } from "lucide-react";

interface MoodChartProps {
  data: number[];
  totalDays?: number;
  mode?: "daily" | "checkpoint";
}
const MOOD_LEVELS = [
  { value: 1, label: "Struggling", color: "#ef4444", icon: Frown },
  { value: 2, label: "Low", color: "#f97316", icon: Frown },
  { value: 3, label: "Neutral", color: "#eab308", icon: Meh },
  { value: 4, label: "Focused", color: "#22c55e", icon: Smile },
  { value: 5, label: "On Fire", color: "#8b5cf6", icon: Flame },
];

function moodMetaFor(value: number) {
  return MOOD_LEVELS.find((m) => m.value === value) || MOOD_LEVELS[2];
}

function MoodBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const info = payload[0].payload;
  if (!info.hasData) {
    return (
      <div className="mc-tooltip">
        <span>{info.name}</span>
        <strong>Upcoming</strong>
      </div>
    );
  }
  return (
    <div className="mc-tooltip">
      <span>{info.name}</span>
      <strong style={{ color: info.color }}>{info.moodLabel}</strong>
    </div>
  );
}

export default function MoodChart({ data, totalDays = 30 }: MoodChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const journeyData = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const value = data[i];
      // Treat 0 as no data — only values 1-5 are real mood entries
      const hasData = value !== undefined && value !== null && value > 0;
      const meta = hasData ? moodMetaFor(value) : null;
      return {
        name: `Day ${dayNum}`,
        mood: hasData ? value : 0.4,
        hasData,
        moodLabel: meta?.label ?? "",
        color: meta?.color ?? "#eef0f3",
      };
    });
  }, [data, totalDays]);

  const loggedValues = data.filter(
    (v) => v !== undefined && v !== null && v > 0,
  );

  const avgMood = loggedValues.length
    ? loggedValues.reduce((a, b) => a + b, 0) / loggedValues.length
    : null;
  const avgMeta = avgMood ? moodMetaFor(Math.round(avgMood)) : null;

  if (!isMounted) {
    return (
      <div
        className="mood-chart card-premium"
        style={{
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-mist)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--color-ink-40)",
          }}
        >
          Loading Charts...
        </span>
      </div>
    );
  }

  return (
    <div className="mood-chart card-premium mc-card">
      <div className="mc-header">
        <div className="mc-title-group">
          <Activity size={16} className="text-ignition" />
          <span className="mc-title">Mood Journey</span>
        </div>
        {avgMeta && (
          <span
            className="mc-avg-pill"
            style={{ color: avgMeta.color, borderColor: `${avgMeta.color}33` }}
          >
            Avg: {avgMeta.label}
          </span>
        )}
      </div>

      <div className="mc-bar-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={journeyData}
            margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
            barCategoryGap="18%"
          >
            <XAxis dataKey="name" hide />
            <RechartsTooltip
              content={<MoodBarTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar dataKey="mood" radius={[4, 4, 4, 4]} maxBarSize={14}>
              {journeyData.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={entry.color}
                  opacity={entry.hasData ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mc-journey-labels">
        <span>Day 1</span>
        <span>Day {totalDays}</span>
      </div>

      <div className="mc-legend-row">
        {MOOD_LEVELS.map((level) => {
          const IconComponent = level.icon;
          return (
            <div key={level.value} className="mc-legend-chip">
              <span
                className="mc-legend-dot"
                style={{ backgroundColor: level.color }}
              />
              <IconComponent size={11} color={level.color} />
              <span>{level.label}</span>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .mc-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;

          background: var(--color-surface) !important;
          border: 1px solid var(--color-mist);
          color: var(--color-ink);
        }
        .mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mc-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
        }
        .mc-title {
          font-size: 13px;
          color: #111827;
        }
        .mc-avg-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid;
          background: #fff;
        }
        .mc-bar-chart {
          flex: 1;
          min-height: 140px;
        }
        .mc-journey-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: var(--color-ink-40);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: -8px;
        }
        .mc-legend-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          border-top: 1px solid var(--color-mist);
          padding-top: 12px;
        }
        .mc-legend-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-ink);
        }
        .mc-legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .mc-tooltip {
          background: var(--color-surface);
          border: 1px solid var(--color-mist);
          padding: 6px 10px;
          border-radius: 8px;
          box-shadow: var(--shadow-md);
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mc-tooltip strong {
          font-size: 12px;
        }

        /* =========================================================
   MOOD CHART — DARK MODE TEXT
   ========================================================= */

        [data-theme="dark"] .mc-card .mc-title {
          color: #f4f4f5;
        }

        [data-theme="dark"] .mc-card .mc-journey-labels {
          color: #a1a1aa;
        }

        [data-theme="dark"] .mc-card .mc-legend-chip {
          color: #e4e4e7;
        }

        [data-theme="dark"] .mc-card .mc-legend-row {
          border-top-color: #34363b;
        }

        [data-theme="dark"] .mc-card .mc-tooltip {
          background: #25272b;
          border-color: #3b3e44;
          color: #f4f4f5;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, TrendingUp } from "lucide-react";

interface ActivityHeatmapProps {
  completedDays: number[];
  totalDays?: number;
  currentDay: number;
}

export default function ActivityHeatmap({
  completedDays,
  totalDays = 30,
  currentDay,
}: ActivityHeatmapProps) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const normalizedCompletedDays = [
    ...new Set(completedDays.map(Number).filter((day) => Number.isFinite(day))),
  ];

  const passedDayNumbers = Array.from(
    { length: Math.max(0, currentDay - 1) },
    (_, i) => i + 1,
  );

  const missedCount = passedDayNumbers.filter(
    (day) => !normalizedCompletedDays.includes(day),
  ).length;

  const remainingCount = Math.max(
    0,
    totalDays - normalizedCompletedDays.length - missedCount,
  );

  const completionRate =
    totalDays > 0
      ? Math.round((normalizedCompletedDays.length / totalDays) * 100)
      : 0;

  const stats = useMemo(
    () => [
      {
        name: "Completed",
        value: normalizedCompletedDays.length,
        color: "#10b981",
      },
      {
        name: "Missed",
        value: missedCount,
        color: "#fb923c",
      },
      {
        name: "Remaining",
        value: remainingCount,
        color: "#94a3b8",
      },
    ],
    [normalizedCompletedDays.length, missedCount, remainingCount],
  );

  const radius = 90;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (completionRate / 100) * circumference;

  const hoveredEntry = stats.find((s) => s.name === hoveredStat);
  const centerValue = hoveredEntry ? hoveredEntry.value : completionRate;
  const centerLabel = hoveredEntry ? hoveredEntry.name : "Complete";
  const centerIsPercent = !hoveredEntry;

  return (
    <article className="activity-heatmap-card card-premium">
      <div className="ah-header">
        <div className="ah-title-group">
          <CalendarCheck size={16} />
          <span className="ah-title">Sprint Activity</span>
        </div>
        <span className="ah-subtitle">
          <TrendingUp size={12} /> {normalizedCompletedDays.length}/{totalDays}{" "}
          days
        </span>
      </div>

      <div className="ah-pie-row">
        <div className="ah-pie-wrap">
          <svg viewBox="0 0 200 200" className="ah-ring-svg">
            <circle
              cx="100"
              cy="100"
              r={radius}
              className="ah-ring-track"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              className="ah-ring-progress"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <div className="ah-pie-center">
            <div key={centerLabel} className="ah-pie-center-inner">
              <strong>
                {centerIsPercent ? `${centerValue}%` : centerValue}
              </strong>
              <span>{centerLabel}</span>
            </div>
          </div>
        </div>

        <div className="ah-pie-legend">
          {stats.map((slice, idx) => {
            const isActive = hoveredStat === slice.name;
            const pct = Math.round((slice.value / totalDays) * 100);
            return (
              <div
                key={idx}
                className={`ah-legend-row ${isActive ? "ah-legend-row--active" : ""}`}
                onMouseEnter={() => setHoveredStat(slice.name)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span
                  className="ah-legend-dot"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="ah-legend-name">{slice.name}</span>
                <span className="ah-legend-value">
                  {slice.value} <em>· {pct}%</em>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .activity-heatmap-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .ah-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ah-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 13px;
          color: #111827;
        }
        .ah-subtitle {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #059669;
        }
        .ah-pie-row {
          display: flex;
          align-items: center;
          gap: 28px;
          flex: 1;
        }
        .ah-pie-wrap {
          position: relative;
          width: 200px;
          height: 200px;
          flex-shrink: 0;
        }
        .ah-ring-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .ah-ring-track {
          fill: none;
          stroke: #f1f5f9;
        }
        .ah-ring-progress {
          fill: none;
          stroke: #10b981;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s ease-in-out;
        }
        .ah-pie-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .ah-pie-center-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: ah-center-fade 0.6s ease-in-out;
        }
        @keyframes ah-center-fade {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .ah-pie-center strong {
          font-size: 34px;
          font-weight: 800;
          color: #111827;
          line-height: 1;
        }
        .ah-pie-center span {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 600;
          margin-top: 4px;
        }
        .ah-pie-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .ah-legend-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          transition:
            background 0.6s ease-in-out,
            transform 0.6s ease-in-out;
        }
        .ah-legend-row--active {
          background: #f8fafc;
          transform: translateX(2px);
        }
        .ah-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ah-legend-name {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .ah-legend-value {
          margin-left: auto;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          font-family: var(--font-mono, monospace);
        }
        .ah-legend-value em {
          font-style: normal;
          font-weight: 600;
          color: #9ca3af;
          margin-left: 4px;
        }
        @media (max-width: 480px) {
          .ah-pie-row {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: center !important;
          }
          .ah-pie-legend {
            width: 100% !important;
          }
        }
      `}</style>
    </article>
  );
}

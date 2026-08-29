"use client";

import { useState } from "react";
import { Flame, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface SprintTrackProps {
  totalDays?: number;
  completedDays: number;
  todayDay: number;
  streak?: number;
  moodAvg?: number | null;
  recentCompleted?: number | null;
  recentWindow?: number;
  weeklyFocus?: number[]; // focus % per week, e.g. [80, 60, 40, 20]
  size?: "full" | "header" | "mini";
  animatingDay?: number;
  showLabels?: boolean;
}

export default function SprintTrack({
  totalDays = 30,
  completedDays,
  todayDay,
  streak = 0,
  moodAvg = null,
  recentCompleted = null,
  recentWindow = 7,
  weeklyFocus = [],
  size = "full",
  animatingDay,
  showLabels = true,
}: SprintTrackProps) {
  const [open, setOpen] = useState(false);

  const percent =
    totalDays > 0
      ? Math.min(100, Math.round((completedDays / totalDays) * 100))
      : 0;

  const recentTaskRate =
    recentCompleted != null && recentWindow > 0
      ? Math.min(100, Math.round((recentCompleted / recentWindow) * 100))
      : totalDays > 0
        ? Math.round((completedDays / totalDays) * 100)
        : 0;

  const moodNorm =
    moodAvg != null ? Math.round(((moodAvg - 1) / 4) * 100) : recentTaskRate;

  const focusScore = Math.round(recentTaskRate * 0.6 + moodNorm * 0.4);

  const focusLabel =
    focusScore >= 80
      ? "Locked in"
      : focusScore >= 55
        ? "On track"
        : focusScore >= 30
          ? "Building"
          : "Starting";

  const focusColor =
    focusScore >= 80
      ? "#16a34a"
      : focusScore >= 55
        ? "#f97316"
        : focusScore >= 30
          ? "#8b5cf6"
          : "#6b7280";

  const weekColor = (score: number) =>
    score >= 80
      ? "#16a34a"
      : score >= 55
        ? "#f97316"
        : score >= 30
          ? "#8b5cf6"
          : "#9ca3af";

  // REMOVE everything from `return (` to closing `);` and replace with:

  return (
    <div className={`st st--${size}`}>
      <div className="st__row">
        <div className="st__stat">
          <Flame size={13} color="#f97316" strokeWidth={2.2} />
          <strong>{streak}</strong>
          <span>day streak</span>
        </div>

        <div className="st__dot-sep" />

        <div className="st__mini-bars" aria-label={`Focus: ${focusLabel}`}>
          {[40, 65, 50, 80, focusScore].map((h, i) => (
            <span
              key={i}
              className="st__mini-bar"
              style={{
                height: `${Math.max(4, (h / 100) * 16)}px`,
                background: i === 4 ? focusColor : `${focusColor}55`,
              }}
            />
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div
        className="st__track"
        role="progressbar"
        aria-valuenow={completedDays}
        aria-valuemin={0}
        aria-valuemax={totalDays}
        aria-label={`${completedDays} of ${totalDays} days complete`}
      >
        <div className="st__fill" style={{ width: `${percent}%` }} />
        {todayDay > 0 && todayDay <= totalDays && (
          <span
            className="st__pin"
            style={{
              left: `${Math.max(
                0,
                Math.min(
                  100,
                  percent === 0 ? 0 : (completedDays / totalDays) * 100,
                ),
              )}%`,
            }}
          />
        )}
      </div>

      <style jsx global>{`
        .st {
          width: 100%;
          margin-top: 8px;
        }

        .st__row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .st__stat {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .st__stat strong {
          font-size: 14px;
          font-weight: 800;
          color: #111827;
          line-height: 1;
        }
        .st__stat span {
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
        }

        .st__dot-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #d1d5db;
          flex-shrink: 0;
        }

        .st__badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .st__focus-right {
          display: flex;
          align-items: baseline;
          gap: 3px;
          flex-shrink: 0;
        }
        .st__focus-num {
          font-size: 14px;
          font-weight: 800;
          line-height: 1;
        }
        .st__focus-sub {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .st__track {
          position: relative;
          width: 100%;
          height: 5px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: visible;
        }

        .st__fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: #f97316;
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .st__pin {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid #fff;
          outline: 2px solid rgba(249, 115, 22, 0.35);
          animation: st-pulse 2s ease-in-out infinite;
          z-index: 2;
        }

        .st__mini-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 16px;
          flex-shrink: 0;
        }
        .st__mini-bar {
          width: 3px;
          border-radius: 2px;
          transition: height 0.4s ease;
        }

        /* DARK MODE — SprintTrack text only */
        [data-theme="dark"] .st__stat strong {
          color: #f3f4f6;
        }

        [data-theme="dark"] .st__stat span {
          color: #9ca3af;
        }

        [data-theme="dark"] .st__dot-sep {
          background: #6b7280;
        }

        @keyframes st-pulse {
          0%,
          100% {
            outline-width: 2px;
            outline-color: rgba(249, 115, 22, 0.35);
          }
          50% {
            outline-width: 4px;
            outline-color: rgba(249, 115, 22, 0.08);
          }
        }
      `}</style>
    </div>
  );
}

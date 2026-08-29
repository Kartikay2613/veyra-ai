"use client";

import { Frown, Smile, Meh, Flame, CheckCircle2 } from "lucide-react";
import CheckIcon from "./CheckIcon";

interface MoodCheckInProps {
    selected: number | null;
    onSelect: (value:number)=>void;

    onRequestMood: (mood: (typeof MOODS)[number]) => void;
}

import { CloudRain, CloudDrizzle, Minus, Sun, Zap } from "lucide-react";
import { useState } from "react";

const MOODS = [
  { value: 1, label: "Struggling", icon: CloudRain, color: "#ef4444" },
  { value: 2, label: "Low", icon: CloudDrizzle, color: "#f97316" },
  { value: 3, label: "Neutral", icon: Minus, color: "#eab308" },
  { value: 4, label: "Focused", icon: Sun, color: "#22c55e" },
  { value: 5, label: "On Fire", icon: Zap, color: "#8b5cf6" },
];

export default function MoodCheckIn({
    selected,
    onSelect,
    onRequestMood,
}: MoodCheckInProps) {
  const isLocked = selected !== null;
  const [pendingMood, setPendingMood] = useState<(typeof MOODS)[number] | null>(
    null,
  );

  return (
    <div
      className="mood-checkin card-premium"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="text-sm-medium" style={{ fontWeight: 600 }}>
          How is your mental focus today?
        </span>
        {isLocked && (
          <span
            className="eyebrow"
            style={{
              color: "var(--color-win)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "10px",
            }}
          >
            <CheckCircle2 size={12} /> Logged
          </span>
        )}
      </div>

      <div
        className="mood-checkin__options"
        role="group"
        aria-label="Mood check-in"
        style={{ display: "flex", gap: 8, width: "100%" }}
      >
        {MOODS.map((item) => {
          const isCurrentSelected = selected === item.value;
          const IconComponent = item.icon;

          return (
            <button
              key={item.value}
              id={`mood-option-${item.value}`}
              className={`mood-checkin__option${isCurrentSelected ? " mood-checkin__option--selected" : ""}`}
              onClick={() => {
                if (!isLocked) {
                  onRequestMood(item);
                }
              }}
              disabled={isLocked}
              aria-pressed={isCurrentSelected}
              aria-label={`Mood: ${item.label}`}
              type="button"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 64,
                borderRadius: 8,

                border: "1px solid var(--mood-option-border)",

                borderLeft: isCurrentSelected
                  ? `4px solid ${item.color}`
                  : "1px solid var(--mood-option-border)",

                backgroundColor: isCurrentSelected
                  ? `${item.color}14`
                  : "var(--mood-option-bg)",

                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked && !isCurrentSelected ? 0.4 : 1,
                position: "relative",
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease, opacity 0.15s ease",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  color: isCurrentSelected
                    ? item.color
                    : "var(--mood-option-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease, color 0.15s ease",
                  transform: isCurrentSelected ? "scale(1.1)" : "scale(1)",
                }}
                className="mood-icon-container"
              >
                <IconComponent
                  size={22}
                  strokeWidth={isCurrentSelected ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isCurrentSelected ? 700 : 500,
                  color: isCurrentSelected
                    ? item.color
                    : "var(--mood-option-muted)",
                  marginTop: 6,
                  transition: "color 0.15s ease",
                }}
              >
                {item.label}
              </span>

              {/* Selected Dot Indicator */}
              {isCurrentSelected && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: item.color,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLocked && (
        <p
          className="text-xs"
          style={{
            color: "var(--color-ink-40)",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          "Today's focus is locked in. Chat with the Sprint Agent on the right
          for support."
        </p>
      )}

      <style jsx global>{`
        /* LIGHT MODE */

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        #today-screen {
          --mood-card-bg: #ffffff;
          --mood-card-border: #e5e7eb;

          --mood-option-bg: #ffffff;
          --mood-option-border: #e5e7eb;
          --mood-option-muted: #9ca3af;
          --mood-option-hover: #f9fafb;

          --mood-heading: #111827;
        }

        #today-screen .mood-checkin {
          background: var(--mood-card-bg);
          border-color: var(--mood-card-border);
          color: var(--mood-heading);
        }

        #today-screen .mood-checkin__option:hover:not(:disabled) {
          background-color: var(--mood-option-hover) !important;
        }

        /* DARK MODE */
        [data-theme="dark"] #today-screen {
          --mood-card-bg: #202226;
          --mood-card-border: #303238;

          --mood-option-bg: #27292e;
          --mood-option-border: #383b42;
          --mood-option-muted: #969ca7;
          --mood-option-hover: #303238;

          --mood-heading: #f3f4f6;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/AuthContext";
import { Flame, Target, Zap, ArrowRight, Sparkles } from "lucide-react";

const SPRINT_BENEFITS = [
  {
    icon: Target,
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
    title: "One focused task a day",
    sub: "No overwhelm. Just one clear step forward.",
  },
  {
    icon: Flame,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    title: "Streak accountability",
    sub: "Your consistency shows up on the leaderboard.",
  },
  {
    icon: Zap,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.10)",
    title: "AI coaching built in",
    sub: "Ask the Sprint Agent anything. It knows your goal.",
  },
];

export default function TodayEmptyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    null;

  return (
    <main className="tep-shell" id="today-empty-screen">
      <div className="tep-inner">
        {/* Top eyebrow */}
        <div className="tep-eyebrow">
          <Sparkles size={12} strokeWidth={2.5} />
          <span>Career Sprint</span>
        </div>

        {/* Headline */}
        <div className="tep-headline-block">
          <h1 className="tep-headline">
            {firstName ? (
              <>
                Ready when you are,{" "}
                <span className="tep-name">{firstName}.</span>
              </>
            ) : (
              <>Your sprint hasn&apos;t started yet.</>
            )}
          </h1>
          <p className="tep-sub">
            You don&apos;t have an active goal. Set one and your daily task will
            appear right here — every morning, tailored to where you are in the
            sprint.
          </p>
        </div>

        {/* Visual divider — sprint track placeholder */}
        <div className="tep-track-preview" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="tep-track-tick"
              style={{
                opacity: 0.12 + (i / 30) * 0.06,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
          <div className="tep-track-label-left">Day 1</div>
          <div className="tep-track-label-right">Day 30</div>
        </div>

        {/* Benefits */}
        <div className="tep-benefits">
          {SPRINT_BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div className="tep-benefit" key={b.title}>
                <div className="tep-benefit-icon" style={{ background: b.bg }}>
                  <Icon size={16} color={b.color} strokeWidth={2.2} />
                </div>
                <div className="tep-benefit-text">
                  <p className="tep-benefit-title">{b.title}</p>
                  <p className="tep-benefit-sub">{b.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="tep-cta-group">
          <button
            className="tep-cta-primary"
            onClick={() => router.push("/onboarding")}
          >
            Set my goal
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
          <button
            className="tep-cta-ghost"
            onClick={() => router.push("/goals")}
          >
            View past sprints
          </button>
        </div>

        {/* Footer note */}
        <p className="tep-footnote">
          Takes 2 minutes · Your tasks generate automatically
        </p>
      </div>

      <style jsx global>{`
        /* Shell */
        .tep-shell {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: var(--color-drift, #f3f2ee);
        }

        @media (min-width: 768px) {
          .tep-shell {
            padding-left: calc(var(--sidebar-width, 170px) + 40px);
          }
        }

        .tep-inner {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Eyebrow */
        .tep-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-ignition, #ff4e1f);
        }

        /* Headline */
        .tep-headline-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tep-headline {
          font-family: var(--font-display, "Bricolage Grotesque", sans-serif);
          font-size: clamp(2rem, 5vw, 2.75rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--color-ink, #14171f);
          margin: 0;
        }

        .tep-name {
          color: var(--color-ignition, #ff4e1f);
        }

        .tep-sub {
          font-family: var(--font-body, "Inter", sans-serif);
          font-size: 15px;
          font-weight: 400;
          line-height: 1.7;
          color: rgba(20, 23, 31, 0.5);
          margin: 0;
          max-width: 440px;
        }

        /* Sprint track preview */
        .tep-track-preview {
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 32px;
          padding-bottom: 16px;
        }

        .tep-track-tick {
          flex: 1;
          height: 14px;
          border-radius: 3px;
          background: var(--color-ignition, #ff4e1f);
          animation: tep-tick-rise 0.6s ease both;
        }

        @keyframes tep-tick-rise {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .tep-track-label-left,
        .tep-track-label-right {
          position: absolute;
          bottom: 0;
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          color: rgba(20, 23, 31, 0.35);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tep-track-label-left {
          left: 0;
        }
        .tep-track-label-right {
          right: 0;
        }

        /* Benefits */
        .tep-benefits {
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #ffffff;
          border: 1px solid rgba(20, 23, 31, 0.08);
          border-radius: 18px;
          padding: 24px;
        }

        .tep-benefit {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .tep-benefit-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tep-benefit-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tep-benefit-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink, #14171f);
          margin: 0;
        }

        .tep-benefit-sub {
          font-size: 12px;
          color: rgba(20, 23, 31, 0.45);
          margin: 0;
          line-height: 1.5;
        }

        /* CTA group */
        .tep-cta-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tep-cta-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 15px 24px;
          background: var(--color-ink, #14171f);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-family: var(--font-body, "Inter", sans-serif);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .tep-cta-primary:hover {
          background: #1f2937;
          transform: translateY(-1px);
        }

        .tep-cta-primary:active {
          transform: translateY(0);
        }

        .tep-cta-ghost {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 13px 24px;
          background: transparent;
          color: rgba(20, 23, 31, 0.5);
          border: 1.5px solid rgba(20, 23, 31, 0.12);
          border-radius: 12px;
          font-family: var(--font-body, "Inter", sans-serif);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            color 0.15s ease;
        }

        .tep-cta-ghost:hover {
          border-color: rgba(20, 23, 31, 0.25);
          color: var(--color-ink, #14171f);
        }

        /* Footnote */
        .tep-footnote {
          font-size: 11px;
          font-weight: 600;
          color: rgba(20, 23, 31, 0.3);
          text-align: center;
          margin: 0;
          letter-spacing: 0.02em;
        }

        /* =========================================================
   TODAY EMPTY PAGE — DARK MODE
   ========================================================= */

        html[data-theme="dark"] #today-empty-screen,
        body[data-theme="dark"] #today-empty-screen {
          background: #181a1e;
        }

        /* Main heading */
        html[data-theme="dark"] #today-empty-screen .tep-headline,
        body[data-theme="dark"] #today-empty-screen .tep-headline {
          color: #f3f4f6;
        }

        /* Description */
        html[data-theme="dark"] #today-empty-screen .tep-sub,
        body[data-theme="dark"] #today-empty-screen .tep-sub {
          color: #9ca3af;
        }

        /* Day 1 / Day 30 labels */
        html[data-theme="dark"] #today-empty-screen .tep-track-label-left,
        html[data-theme="dark"] #today-empty-screen .tep-track-label-right,
        body[data-theme="dark"] #today-empty-screen .tep-track-label-left,
        body[data-theme="dark"] #today-empty-screen .tep-track-label-right {
          color: #6b7280;
        }

        /* Benefits card */
        html[data-theme="dark"] #today-empty-screen .tep-benefits,
        body[data-theme="dark"] #today-empty-screen .tep-benefits {
          background: #202226;
          border-color: #303238;
        }

        /* Benefit titles */
        html[data-theme="dark"] #today-empty-screen .tep-benefit-title,
        body[data-theme="dark"] #today-empty-screen .tep-benefit-title {
          color: #f3f4f6;
        }

        /* Benefit descriptions */
        html[data-theme="dark"] #today-empty-screen .tep-benefit-sub,
        body[data-theme="dark"] #today-empty-screen .tep-benefit-sub {
          color: #9ca3af;
        }

        /* Primary button */
        html[data-theme="dark"] #today-empty-screen .tep-cta-primary,
        body[data-theme="dark"] #today-empty-screen .tep-cta-primary {
          background: #f3f4f6;
          color: #181a1e;
        }

        html[data-theme="dark"] #today-empty-screen .tep-cta-primary:hover,
        body[data-theme="dark"] #today-empty-screen .tep-cta-primary:hover {
          background: #ffffff;
        }

        /* Secondary button */
        html[data-theme="dark"] #today-empty-screen .tep-cta-ghost,
        body[data-theme="dark"] #today-empty-screen .tep-cta-ghost {
          color: #9ca3af;
          border-color: #383b42;
        }

        html[data-theme="dark"] #today-empty-screen .tep-cta-ghost:hover,
        body[data-theme="dark"] #today-empty-screen .tep-cta-ghost:hover {
          color: #f3f4f6;
          border-color: #5b606b;
        }

        /* Footer note */
        html[data-theme="dark"] #today-empty-screen .tep-footnote,
        body[data-theme="dark"] #today-empty-screen .tep-footnote {
          color: #6b7280;
        }

        @media (prefers-reduced-motion: reduce) {
          .tep-track-tick {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

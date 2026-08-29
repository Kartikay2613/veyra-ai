"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  LogOut,
  Shield,
  ChevronDown,
  Zap,
  Moon,
  Sun,
  Settings,
} from "lucide-react";
import { useAuth } from "@/app/lib/AuthContext";

// 10 XP/day + 50 XP/task + 500 XP/goal
function getLevel(xp: number) {
  // Level 1: 0    → just joined
  // Level 2: 50   → first task done
  // Level 3: 150  → 3 days consistent
  // Level 4: 350  → first week
  // Level 5: 700  → two weeks strong
  // Level 6: 1200 → first goal done (~500 + tasks)
  // Level 7: 2000 → serious sprinter
  // Level 8: 3000 → two goals done
  // Level 9: 4500 → elite
  // Level 10: 6000 → legend
  const t = [0, 50, 150, 350, 700, 1200, 2000, 3000, 4500, 6000];
  let lvl = 1;
  for (let i = 0; i < t.length; i++) if (xp >= t[i]) lvl = i + 1;
  const cur = t[Math.min(lvl - 1, t.length - 1)];
  const nxt = t[Math.min(lvl, t.length - 1)];
  const pct = nxt > cur ? Math.round(((xp - cur) / (nxt - cur)) * 100) : 100;
  return { lvl, pct, xpToNext: Math.max(0, nxt - xp) };
}

const LVL_COLORS = [
  "#6b7280",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#eab308",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#f97316",
];

const LVL_NAMES = [
  "Newcomer",
  "Explorer",
  "Builder",
  "Grinder",
  "Focused",
  "Elite",
  "Obsessed",
  "Legend",
  "Mythic",
  "Immortal",
];

export default function ProfileButton() {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const { user, profile, signOut, theme, setTheme } = useAuth();

  const xp = profile?.total_xp || 0;
  const name = profile?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const { lvl, pct, xpToNext } = getLevel(xp);
  const lvlColor = LVL_COLORS[Math.min(lvl - 1, LVL_COLORS.length - 1)];
  const lvlName = LVL_NAMES[Math.min(lvl - 1, LVL_NAMES.length - 1)];

  useEffect(() => {
    setMounted(true);
  }, []);

  async function chooseTheme(nextTheme: "light" | "dark") {
    if (nextTheme === theme || themeSaving) return;
    setThemeSaving(true);
    try {
      await setTheme(nextTheme);
    } finally {
      setThemeSaving(false);
    }
  }

  function calcStyle() {
    if (!triggerRef.current) return;

    const r = triggerRef.current.getBoundingClientRect();
    const POPUP_WIDTH = 260;
    const isMobile = window.innerWidth <= 767;

    if (isMobile) {
      setPopupStyle({
        position: "fixed",
        top: r.bottom + 10,
        right: 12,
        width: POPUP_WIDTH,
        zIndex: 99999,
      });

      return;
    }

    let left = r.left;

    if (left + POPUP_WIDTH > window.innerWidth - 12) {
      left = window.innerWidth - POPUP_WIDTH - 12;
    }

    const top = Math.min(r.bottom + 10, window.innerHeight - 12 - 620);
    setPopupStyle({
      position: "fixed",
      left,
      top: Math.max(12, top),
      width: POPUP_WIDTH,
      maxHeight: "calc(100vh - 24px)",
      overflowY: "auto",
      zIndex: 2147483000,
    });
  }

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onResize = () => calcStyle();

    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function handleOpen() {
    calcStyle();
    setOpen((o) => !o);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      close();
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  // Account controls are only available to an authenticated user.
  // The NavBar also guards this, but this second guard keeps the component
  // safe if it is ever rendered somewhere else.
  if (!user) return null;

  const popup = (
    <div ref={popupRef} className="pb-popup" style={popupStyle} role="menu" aria-label="Account menu">
      <div className="pb-card">
        <div className="pb-card-top">
          <div className="pb-card-av" style={{ background: lvlColor }}>{initial}</div>
          <div className="pb-card-meta">
            <span className="pb-card-name">{name}</span>
            <span className="pb-card-rank" style={{ color: lvlColor }}>{lvlName}</span>
          </div>
          <div className="pb-card-lvl" style={{ background: `${lvlColor}18`, color: lvlColor }}>
            <Zap size={10} /> LV {lvl}
          </div>
        </div>
        <div className="pb-xp-section">
          <div className="pb-xp-row">
            <span className="pb-xp-label" style={{ color: lvlColor }}>{xp} XP</span>
            <span className="pb-xp-next">{xpToNext > 0 ? `${xpToNext} to next level` : "Max level"}</span>
          </div>
          <div className="pb-bar-track">
            <div className="pb-bar-fill" style={{ width: `${pct}%`, background: lvlColor }} />
            <div className="pb-bar-glow" style={{ left: `${pct}%`, background: lvlColor }} />
          </div>
          <div className="pb-bar-sub"><span>{pct}% to LV {Math.min(lvl + 1, 10)}</span></div>
        </div>
      </div>

      <div className="pb-sep" />
      <div className="pb-menu">
        <Link className="pb-item" href="/settings" onClick={close} role="menuitem">
          <div className="pb-ico pb-ico-gray"><Settings size={14} /></div>
          <span>Account settings</span>
        </Link>
        <Link className="pb-item" href="/delete-account" onClick={close} role="menuitem">
          <div className="pb-ico pb-ico-gray"><Shield size={14} /></div>
          <span>Privacy &amp; delete account</span>
        </Link>
        <button type="button" className={`pb-item${theme === "light" ? " pb-item-selected" : ""}`} onClick={() => void chooseTheme("light")} disabled={themeSaving} role="menuitemradio" aria-checked={theme === "light"}>
          <div className="pb-ico pb-ico-gray"><Sun size={14} /></div>
          <span>Light theme</span>
          {theme === "light" && <span className="pb-theme-check">✓</span>}
        </button>
        <button type="button" className={`pb-item${theme === "dark" ? " pb-item-selected" : ""}`} onClick={() => void chooseTheme("dark")} disabled={themeSaving} role="menuitemradio" aria-checked={theme === "dark"}>
          <div className="pb-ico pb-ico-gray"><Moon size={14} /></div>
          <span>Dark theme</span>
          {theme === "dark" && <span className="pb-theme-check">✓</span>}
        </button>
        <button type="button" className="pb-item" onClick={handleLogout} disabled={loggingOut} role="menuitem">
          <div className="pb-ico pb-ico-gray"><LogOut size={14} /></div>
          <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Trigger ── */}
      <div className="pb-slot">
        <button
          ref={triggerRef}
          className={`pb-trigger${open ? " pb-trigger-open" : ""}`}
          onClick={handleOpen}
          aria-label="Profile menu"
          aria-expanded={open}
        >
          <div className="pb-av" style={{ background: lvlColor }}>
            {initial}
            <span className="pb-lv" style={{ background: lvlColor }}>
              {lvl}
            </span>
          </div>
          <div className="pb-info">
            <span className="pb-info-name">{name}</span>
            <span className="pb-info-xp" style={{ color: lvlColor }}>
              {lvlName} · Lv {lvl}
            </span>
          </div>
          <ChevronDown
            size={14}
            color="#adb5bd"
            style={{
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>

      {/* Portal popup — renders at document.body, never clipped */}
      {mounted && open && createPortal(popup, document.body)}

      <style jsx global>{`
        @media (max-width: 767px) {
          .pb-slot {
            display: block;
            width: auto;
            padding: 0;
            margin: 0;
            border-top: none;
          }

          .pb-trigger {
            width: 54px;
            height: 54px;

            border-radius: 50%;

            padding: 0;

            background: #fff;

            border: 1px solid #ececec;

            justify-content: center;

            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
          }

          .pb-av {
            width: 44px;
            height: 44px;

            border-radius: 50%;

            font-size: 17px;
          }

          .pb-info,
          .pb-trigger > svg {
            display: none;
          }
        }

        .pb-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
          transition:
            background 0.12s,
            border-color 0.12s,
            box-shadow 0.12s;
        }
        .pb-trigger:hover,
        .pb-trigger-open {
          background: #f8f9fa;
          border-color: #dee2e6;
          box-shadow: 0 2px 6px rgba(16, 24, 40, 0.06);
        }

        /* Square avatar + level pip */
        .pb-av {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pb-lv {
          position: absolute;
          bottom: -3px;
          right: -3px;
          width: 13px;
          height: 13px;
          border-radius: 3px;
          border: 1.5px solid #fff;
          color: #fff;
          font-size: 7px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pb-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          min-width: 0;
        }
        .pb-info-name {
          font-size: 12px;
          font-weight: 600;
          color: #212529;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }
        .pb-info-xp {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
          text-align: left;
          color: #868e96;
        }

        /* Popup */
        .pb-popup {
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 14px;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.07);
          overflow: hidden;
          animation: pb-rise 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pb-rise {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* XP card */
        .pb-card {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pb-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pb-card-av {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pb-card-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .pb-card-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pb-card-rank {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .pb-card-lvl {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          flex-shrink: 0;
          letter-spacing: 0.03em;
        }

        /* XP bar section */
        .pb-xp-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pb-xp-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .pb-xp-label {
          font-size: 12px;
          font-weight: 800;
        }
        .pb-xp-next {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
        }

        .pb-bar-track {
          position: relative;
          height: 7px;
          border-radius: 999px;
          background: #f1f3f5;
          overflow: visible;
        }
        .pb-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pb-bar-glow {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 2px currentColor;
          transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pb-bar-sub {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
        }

        .pb-sep {
          height: 1px;
          background: #f3f4f6;
        }

        /* Menu */
        .pb-menu {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pb-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 8px;
          background: none;
          border: none;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
          text-align: left;
          transition: background 0.1s;
        }
        .pb-item:hover:not(:disabled) {
          background: #f9fafb;
        }
        .pb-item:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        .pb-item-selected {
          background: #f8f9fa;
        }
        .pb-theme-check {
          margin-left: auto;
          color: #16a34a;
          font-size: 13px;
          font-weight: 800;
        }

        .pb-item-red {
          color: #dc2626;
        }
        .pb-item-red:hover {
          background: #fef2f2 !important;
        }
        .pb-ico {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pb-ico-gray {
          background: #f3f4f6;
        }
        .pb-ico-red {
          background: #fef2f2;
        }

        /* Delete sheet */
        .pb-del {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pb-del-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pb-back {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
          transition: color 0.1s;
        }
        .pb-back:hover {
          color: #374151;
        }
        .pb-x {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
          transition: color 0.1s;
        }
        .pb-x:hover {
          color: #374151;
        }
        .pb-del-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        .pb-del-ico {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pb-del-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .pb-del-body {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        .pb-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pb-field-lbl {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }
        .pb-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          outline: none;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.12em;
          box-sizing: border-box;
          text-align: center;
          background: #fafafa;
          transition: border-color 0.15s;
        }
        .pb-input:focus {
          border-color: #d1d5db;
          background: #fff;
        }
        .pb-input-ok {
          border-color: #dc2626 !important;
          color: #dc2626 !important;
        }

        .pb-btns {
          display: flex;
          gap: 7px;
        }
        .pb-btn-ghost {
          flex: 1;
          padding: 9px;
          border-radius: 7px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.1s;
        }
        .pb-btn-ghost:hover {
          background: #f9fafb;
        }
        .pb-btn-red {
          flex: 1;
          padding: 9px;
          border-radius: 7px;
          border: none;
          background: #dc2626;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition:
            background 0.1s,
            opacity 0.1s;
        }
        .pb-btn-red:hover:not(:disabled) {
          background: #b91c1c;
        }
        .pb-btn-red:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* =========================================================
   PROFILE BUTTON — DARK MODE
   ========================================================= */

        /* CLOSED PROFILE BUTTON
   Lighter than navbar so it remains clearly visible */
        [data-theme="dark"] .pb-trigger {
          background: #292b30;
          border-color: #3d4047;

          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.045);
        }

        [data-theme="dark"] .pb-trigger:hover,
        [data-theme="dark"] .pb-trigger-open {
          background: #303238;
          border-color: #484b53;

          box-shadow:
            0 6px 18px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .pb-info-name {
          color: #f3f4f6;
        }

        [data-theme="dark"] .pb-info-xp {
          color: #a7abb3;
        }

        [data-theme="dark"] .pb-lv {
          border-color: #292b30;
        }

        /* =========================================================
   POPUP SURFACE
   ========================================================= */

        [data-theme="dark"] .pb-popup {
          background: #222428;
          border-color: #3a3d43;

          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.42),
            0 4px 16px rgba(0, 0, 0, 0.28);
        }

        /* =========================================================
   XP CARD
   ========================================================= */

        [data-theme="dark"] .pb-card {
          background: #222428;
        }

        [data-theme="dark"] .pb-card-name {
          color: #f4f4f5;
        }

        [data-theme="dark"] .pb-xp-next,
        [data-theme="dark"] .pb-bar-sub {
          color: #92969f;
        }

        [data-theme="dark"] .pb-bar-track {
          background: #34373d;
        }

        [data-theme="dark"] .pb-bar-glow {
          border-color: #222428;
        }

        /* =========================================================
   SEPARATORS
   ========================================================= */

        [data-theme="dark"] .pb-sep {
          background: #35383e;
        }

        /* =========================================================
   MENU
   ========================================================= */

        [data-theme="dark"] .pb-menu {
          background: #222428;
        }

        [data-theme="dark"] .pb-item {
          color: #d6d8dc;
        }

        [data-theme="dark"] .pb-item:hover:not(:disabled) {
          background: #2d3035;
        }

        [data-theme="dark"] .pb-ico-gray {
          background: #303238;
        }

        [data-theme="dark"] .pb-item-red {
          color: #f87171;
        }

        [data-theme="dark"] .pb-item-red:hover {
          background: rgba(220, 38, 38, 0.1) !important;
        }

        [data-theme="dark"] .pb-ico-red {
          background: rgba(220, 38, 38, 0.12);
        }

        /* =========================================================
   DELETE SHEET
   ========================================================= */

        [data-theme="dark"] .pb-del {
          background: #222428;
        }

        [data-theme="dark"] .pb-back,
        [data-theme="dark"] .pb-x {
          color: #92969f;
        }

        [data-theme="dark"] .pb-back:hover,
        [data-theme="dark"] .pb-x:hover {
          color: #f3f4f6;
        }

        [data-theme="dark"] .pb-del-title {
          color: #f4f4f5;
        }

        [data-theme="dark"] .pb-del-body,
        [data-theme="dark"] .pb-field-lbl {
          color: #a7abb3;
        }

        [data-theme="dark"] .pb-del-ico {
          background: rgba(220, 38, 38, 0.12);
        }

        /* =========================================================
   DELETE INPUT
   ========================================================= */

        [data-theme="dark"] .pb-input {
          background: #292b30;
          border-color: #41444b;
          color: #e5e7eb;
        }

        [data-theme="dark"] .pb-input:focus {
          background: #303238;
          border-color: #565a63;
        }

        [data-theme="dark"] .pb-btn-ghost {
          background: #292b30;
          border-color: #41444b;
          color: #d6d8dc;
        }

        [data-theme="dark"] .pb-btn-ghost:hover {
          background: #303238;
        }

        /* =========================================================
   MOBILE
   ========================================================= */

        @media (max-width: 767px) {
          [data-theme="dark"] .pb-trigger {
            background: #292b30;
            border-color: #41444b;

            box-shadow:
              0 8px 24px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          [data-theme="dark"] .pb-trigger:hover,
          [data-theme="dark"] .pb-trigger-open {
            background: #303238;
            border-color: #4b4f57;
          }
        }
      `}</style>
    </>
  );
}

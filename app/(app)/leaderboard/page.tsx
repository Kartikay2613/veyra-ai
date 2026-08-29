"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";

type LeaderboardUser = {
  id: string;
  name: string;
  total_xp: number;
  streak: number;
  active_goal: string | null;
  isCurrentUser?: boolean;
  initials?: string;
  color?: string;
  lvl?: number;
  lvlName?: string;
  lvlColor?: string;
};

const COLORS = [
  "#f97316",
  "#8b5cf6",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
];

function getLevel(xp: number) {
  const t = [0, 50, 150, 350, 700, 1200, 2000, 3000, 4500, 6000];

  let lvl = 1;

  for (let i = 0; i < t.length; i++) {
    if (xp >= t[i]) lvl = i + 1;
  }

  const cur = t[Math.min(lvl - 1, t.length - 1)];
  const nxt = t[Math.min(lvl, t.length - 1)];

  const pct = nxt > cur ? Math.round(((xp - cur) / (nxt - cur)) * 100) : 100;

  return {
    lvl,
    pct,
    xpToNext: Math.max(0, nxt - xp),
  };
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

function getInitials(name: string) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [listUsers, setListUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserCard, setCurrentUserCard] =
    useState<LeaderboardUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: rawRows, error } = await supabase
        .from("leaderboard")
        .select("id, name, total_xp, streak, active_goal")
        .order("total_xp", { ascending: false });

      // Dedupe by id — keep only the highest-XP row per user
      const seen = new Set<string>();
      const deduped = (rawRows ?? []).filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });

      const top3 = deduped.slice(0, 3);
      const ranks4to10 = deduped.slice(3, 10);

      if (error) {
        console.error("Leaderboard fetch error:", error);
        setIsLoaded(true);
        return;
      }

      if (user) {
        const rank = deduped.findIndex((row) => row.id === user.id) + 1;

        setMyRank(rank > 0 ? rank : null);
      }
      const enrich = (rows: typeof top3) =>
        rows.map((u, i) => {
          const { lvl } = getLevel(u.total_xp || 0);
          return {
            ...u,
            isCurrentUser: u.id === user?.id,
            initials: getInitials(u.name || ""),
            color: COLORS[i % COLORS.length],
            lvl,
            lvlName: LVL_NAMES[Math.min(lvl - 1, LVL_NAMES.length - 1)],
            lvlColor: LVL_COLORS[Math.min(lvl - 1, LVL_COLORS.length - 1)],
          };
        });

      setUsers(enrich(top3));
      setListUsers(enrich(ranks4to10));

      if (user) {
        const myIndex = deduped.findIndex((u) => u.id === user.id);

        if (myIndex >= 10) {
          setCurrentUserCard(enrich([deduped[myIndex]])[0]);
        } else {
          setCurrentUserCard(null);
        }
      }

      setIsLoaded(true);
    }

    fetchLeaderboard();
  }, [user]);

  if (!isLoaded)
    return (
      <main
        id="today-loading-screen"
        className="today-loading-screen"
        aria-busy="true"
        aria-label="Loading today's sprint"
      />
    );

  const podiumUsers = users; // already top 3, already sorted

  return (
    <main className="page-shell" id="leaderboard-screen">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-h1">Leaderboard</h1>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="eyebrow" style={{ color: "var(--color-ink-40)" }}>
            Your rank
          </span>
          {myRank ? (
            <>
              <span
                className="text-mono"
                style={{
                  color: "var(--color-ignition)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                }}
              >
                #{myRank}
              </span>
              <span
                className="eyebrow"
                style={{ color: "var(--color-ink-40)" }}
              >
                overall
              </span>
            </>
          ) : (
            <span className="eyebrow" style={{ color: "var(--color-ink-40)" }}>
              —
            </span>
          )}
        </div>
      </div>

      <div className="page-content animate-fade-in-up">
        <p
          className="text-sm"
          style={{ color: "var(--color-ink-40)", marginBottom: -8 }}
        >
          Top 3 sprinters by total XP earned.
        </p>

        {/* Podium */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-lg)",
            padding: "40px 16px 28px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "24px",
            marginBottom: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "150%",
              height: "100%",
              background:
                "radial-gradient(circle at top, rgba(255,78,31,0.08) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* 2nd Place */}
          {podiumUsers[1] ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
                transform: "translateY(10px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: "50%",
                  fontSize: "10px",
                  fontWeight: 800,
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  border: "1px solid #e5e7eb",
                }}
              >
                2
              </div>
              <div
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundColor: "var(--color-mist)",
                  padding: "2px",
                }}
              >
                <div
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    width: 50,
                    height: 58,
                    backgroundColor: podiumUsers[1].color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {podiumUsers[1].initials}
                </div>
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  textAlign: "center",
                  marginTop: 12,
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--color-ink)",
                }}
              >
                {podiumUsers[1].name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-ignition)",
                  marginTop: 2,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                {podiumUsers[1].total_xp} XP
              </div>
              {podiumUsers[1].lvlName && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: podiumUsers[1].lvlColor,
                    background: `${podiumUsers[1].lvlColor}18`,
                    padding: "2px 8px",
                    borderRadius: 999,
                    marginTop: 4,
                  }}
                >
                  Lv {podiumUsers[1].lvl} · {podiumUsers[1].lvlName}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* 1st Place */}
          {podiumUsers[0] ? (
            <div
              style={{
                flex: 1.1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  backgroundColor: "var(--color-ignition)",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "12px",
                  fontWeight: 800,
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(255,78,31,0.4)",
                }}
              >
                1
              </div>
              <div
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundColor: "var(--color-ignition)",
                  padding: "3px",
                }}
              >
                <div
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    width: 62,
                    height: 72,
                    backgroundColor: podiumUsers[0].color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {podiumUsers[0].initials}
                </div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  textAlign: "center",
                  marginTop: 14,
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--color-ink)",
                }}
              >
                {podiumUsers[0].name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-ignition)",
                  fontWeight: 700,
                  marginTop: 2,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {podiumUsers[0].total_xp} XP
              </div>
              {podiumUsers[0].lvlName && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: podiumUsers[0].lvlColor,
                    background: `${podiumUsers[0].lvlColor}18`,
                    padding: "2px 8px",
                    borderRadius: 999,
                    marginTop: 4,
                  }}
                >
                  Lv {podiumUsers[0].lvl} · {podiumUsers[0].lvlName}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1.1 }} />
          )}

          {/* 3rd Place */}
          {podiumUsers[2] ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
                transform: "translateY(16px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: "50%",
                  fontSize: "10px",
                  fontWeight: 800,
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  border: "1px solid #e5e7eb",
                }}
              >
                3
              </div>
              <div
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundColor: "var(--color-mist)",
                  padding: "2px",
                }}
              >
                <div
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    width: 44,
                    height: 51,
                    backgroundColor: podiumUsers[2].color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {podiumUsers[2].initials}
                </div>
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  textAlign: "center",
                  marginTop: 12,
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--color-ink)",
                }}
              >
                {podiumUsers[2].name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-ignition)",
                  marginTop: 2,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                {podiumUsers[2].total_xp} XP
              </div>

              {podiumUsers[2].lvlName && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: podiumUsers[2].lvlColor,
                    background: `${podiumUsers[2].lvlColor}18`,
                    padding: "2px 8px",
                    borderRadius: 999,
                    marginTop: 4,
                  }}
                >
                  Lv {podiumUsers[2].lvl} · {podiumUsers[2].lvlName}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </div>

        {/* Ranks 4–10 */}
        {listUsers.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {listUsers.map((u, i) => {
              const rank = i + 4;
              return (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    background: u.isCurrentUser
                      ? "var(--leaderboard-current-user-bg)"
                      : "var(--color-surface)",
                    border: u.isCurrentUser
                      ? "1px solid var(--color-ignition)"
                      : "1px solid var(--color-mist)",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--color-ink-40)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {rank}
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: u.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {u.initials}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.name}
                    {u.isCurrentUser && (
                      <span style={{ color: "var(--color-ignition)" }}>
                        {" "}
                        (You)
                      </span>
                    )}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    {u.lvlName && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: u.lvlColor,
                          background: `${u.lvlColor}18`,
                          padding: "2px 8px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Lv {u.lvl} · {u.lvlName}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-ignition)",
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.total_xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentUserCard && myRank && (
          <div
            style={{
              marginTop: 18,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--leaderboard-current-user-bg)",
                border: "1px solid var(--color-ignition)",
              }}
            >
              <span
                style={{
                  width: 24,
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-ink-40)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {myRank}
              </span>

              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: currentUserCard.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {currentUserCard.initials}
              </div>

              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-ink)",
                }}
              >
                {currentUserCard.name}
                <span style={{ color: "var(--color-ignition)" }}> (You)</span>
              </span>

              {currentUserCard.lvlName && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: currentUserCard.lvlColor,
                    background: `${currentUserCard.lvlColor}18`,
                    padding: "2px 8px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Lv {currentUserCard.lvl} · {currentUserCard.lvlName}
                </span>
              )}

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-ignition)",
                  fontFamily: "var(--font-mono)",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUserCard.total_xp} XP
              </span>
            </div>
          </div>
        )}

        {/* Empty state if no data yet */}
        {users.length === 0 && (
          <p
            className="text-sm"
            style={{
              textAlign: "center",
              color: "var(--color-ink-40)",
              padding: "32px 16px",
            }}
          >
            No sprinters yet — be the first to earn XP!
          </p>
        )}

        <p
          className="text-sm"
          style={{
            textAlign: "center",
            color: "var(--color-ink-40)",
            padding: "16px 16px 0",
          }}
        >
          Leaderboard updates when you mark each day done.
        </p>
      </div>

      <style jsx global>{`
        /* =========================================================
   LEADERBOARD — LIGHT + DARK THEME
   ========================================================= */

        /* LIGHT MODE */
        #leaderboard-screen {
          --leaderboard-page-bg: #ffffff;
          --leaderboard-current-user-bg: #fff7ed;

          background: var(--leaderboard-page-bg);
          color: var(--color-ink);
          min-height: 100dvh;
          transition:
            background-color 0.2s ease,
            color 0.2s ease;
        }

        /* DARK MODE */
        [data-theme="dark"] #leaderboard-screen {
          --leaderboard-page-bg: #181a1e;
          --leaderboard-current-user-bg: rgba(249, 115, 22, 0.1);

          background: var(--leaderboard-page-bg) !important;
          color: #f3f4f6;
        }

        /* Fix invisible Leaderboard heading */
        [data-theme="dark"] #leaderboard-screen .page-header .text-h1 {
          color: #f3f4f6 !important;
        }

        /* Main muted text */
        [data-theme="dark"] #leaderboard-screen .text-sm,
        [data-theme="dark"] #leaderboard-screen .eyebrow {
          color: #9ca3af;
        }

        /* Smooth dark/light transition */
        #leaderboard-screen .page-content > div {
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease;
        }

        @media (max-width: 480px) {
          /* Tighten podium padding and gap */
          .page-content > div:first-of-type {
            padding: 24px 8px 16px !important;
            gap: 12px !important;
          }

          /* Scale down podium columns and hexagons */
          .page-content > div:first-of-type > div {
            transform: none !important; /* disable translateY offset on mobile for more space */
          }

          /* 1st Place Column Hexagon (3rd child of podium in layout because 2nd place is first) */
          /* Wait, in layout order, the children are:
             1. 2nd Place (if podiumUsers[1] exists)
             2. Glow (div with absolute position) -> Wait! No, Glow is the FIRST child!
             Let's check the JSX:
             Podium wrapper has:
             - Glow (div)
             - 2nd Place (if podiumUsers[1] exists)
             - 1st Place (if podiumUsers[0] exists)
             - 3rd Place (if podiumUsers[2] exists)
             So:
             - 2nd Place is the 2nd child
             - 1st Place is the 3rd child
             - 3rd Place is the 4th child
          */
          .page-content
            > div:first-of-type
            > div:nth-child(3)
            div[style*="polygon"] {
            width: 48px !important;
            height: 55px !important;
          }
          /* 2nd and 3rd Place Columns Hexagons */
          .page-content
            > div:first-of-type
            > div:nth-child(2)
            div[style*="polygon"],
          .page-content
            > div:first-of-type
            > div:nth-child(4)
            div[style*="polygon"] {
            width: 36px !important;
            height: 42px !important;
          }

          /* Scale down names and fonts */
          .page-content
            > div:first-of-type
            > div
            > div[style*="font-size: 13px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="fontSize: 13px"] {
            font-size: 11px !important;
            margin-top: 8px !important;
          }

          .page-content
            > div:first-of-type
            > div
            > div[style*="font-size: 12px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="fontSize: 12px"] {
            font-size: 10px !important;
          }

          /* Hide level labels on very narrow screens */
          .page-content
            > div:first-of-type
            > div
            > div[style*="font-size: 10px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="fontSize: 10px"] {
            font-size: 8px !important;
            padding: 1px 6px !important;
          }
        }

        @media (max-width: 360px) {
          .page-content > div:first-of-type {
            gap: 6px !important;
            padding: 16px 4px 12px !important;
          }
          .page-content
            > div:first-of-type
            > div:nth-child(3)
            div[style*="polygon"] {
            width: 40px !important;
            height: 46px !important;
          }
          .page-content
            > div:first-of-type
            > div:nth-child(2)
            div[style*="polygon"],
          .page-content
            > div:first-of-type
            > div:nth-child(4)
            div[style*="polygon"] {
            width: 30px !important;
            height: 35px !important;
          }
          /* Hide levels completely below 360px */
          .page-content
            > div:first-of-type
            > div
            > div[style*="font-size: 10px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="fontSize: 10px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="font-size: 8px"],
          .page-content
            > div:first-of-type
            > div
            > div[style*="fontSize: 8px"] {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}

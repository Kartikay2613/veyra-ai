"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Calendar,
  Flame,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/AuthContext";
import { supabase } from "@/app/lib/supabase-client";

interface GoalRecord {
  id: string;
  title: string;
  created_at: string;
  started_at?: string;
  paused_at?: string | null;
  resumed_at?: string | null;
  pause_history?: {
    paused_at: string | null;
    resumed_at: string | null;
    days_completed_before_resume: number;
  }[];
  completed_days: number[];
  current_day: number;
  xp_earned: number;
  streak: number;
  status: "active" | "completed" | "abandoned";
  total_days: number;
}

const MAX_GOALS = 2;

export default function GoalsPage() {
  const router = useRouter();
  const { user, profile, activeGoal, refreshProfile } = useAuth();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [resumeTarget, setResumeTarget] = useState<GoalRecord | null>(null);
  const [isStartingNewGoal, setIsStartingNewGoal] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    const fetchGoals = async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "active")
        .order("created_at", { ascending: false });
      if (data) setGoals(data);
    };
    fetchGoals();
  }, [user, activeGoal]);

  const handleCreateNewGoal = async () => {
    if (!user || isStartingNewGoal) return;

    // Stop creation if user already has 2 goals
    if (hasReachedGoalLimit) {
      alert(
        `You can have a maximum of ${MAX_GOALS} goals for now. Delete an old goal to create another.`,
      );
      return;
    }

    setIsStartingNewGoal(true);

    try {
      if (activeGoal) {
        const now = new Date().toISOString();
        const existingHistory = (activeGoal as any).pause_history ?? [];

        const { error } = await supabase
          .from("goals")
          .update({
            status: "abandoned",
            paused_at: now,
            resumed_at: null,
            pause_history: [
              ...existingHistory,
              {
                paused_at: now,
                resumed_at: null,
                days_completed_before_resume:
                  activeGoal.completed_days?.length || 0,
              },
            ],
          })
          .eq("id", activeGoal.id);

        if (error) {
          console.error("Failed to archive current goal:", error);
          setIsStartingNewGoal(false);
          return;
        }
      }

      router.push("/onboarding");
    } catch (error) {
      console.error("Failed to start new goal flow:", error);
      setIsStartingNewGoal(false);
    }
  };

  const handleStartNewGoal = async () => {
    if (!newGoalTitle.trim() || !user) return;

    if (hasReachedGoalLimit) {
      alert(
        `You can have a maximum of ${MAX_GOALS} goals for now. Delete an old goal to create another.`,
      );
      return;
    }

    // Archive current active goal first — record the exact pause moment
    if (activeGoal) {
      await supabase
        .from("goals")
        .update({
          status: "abandoned",
          paused_at: new Date().toISOString(),
        })
        .eq("id", activeGoal.id);
    }

    // Start new goal — started_at is the real sprint clock start
    await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoalTitle.trim(),
      status: "active",
      current_day: 1,
      completed_days: [],
      streak: 0,
      xp_earned: 0,
      started_at: new Date().toISOString(),
    });

    await refreshProfile();
    router.push("/today");
  };

  const handleResumeGoal = async (g: GoalRecord) => {
    if (!user) return;

    const now = new Date().toISOString();

    await supabase
      .from("goals")
      .update({ status: "abandoned" })
      .eq("user_id", user.id)
      .eq("status", "active")
      .neq("id", g.id);

    const resumeFromDay = g.current_day ?? 1;

    const history = g.pause_history ?? [];

    let latestOpenIndex = -1;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].paused_at && history[i].resumed_at === null) {
        latestOpenIndex = i;
        break;
      }
    }

    const updatedHistory = history.map((entry, index) => {
      if (index !== latestOpenIndex) {
        return entry;
      }

      return {
        ...entry,
        resumed_at: now,
      };
    });

    const { error } = await supabase
      .from("goals")
      .update({
        status: "active",
        current_day: resumeFromDay,
        resumed_at: now,
        paused_at: null,
        pause_history: updatedHistory,
      })
      .eq("id", g.id);

    if (error) {
      console.error("Failed to resume goal:", error);
      return;
    }

    await refreshProfile();
    setResumeTarget(null);
    router.push("/today");
  };

  const handlePauseGoal = async () => {
    if (!activeGoal || !user) return;
    const now = new Date().toISOString();
    const existingHistory = (activeGoal as any).pause_history ?? [];

    // Pause the goal
    await supabase
      .from("goals")
      .update({
        status: "abandoned",
        paused_at: now,
        pause_history: [
          ...existingHistory,
          {
            paused_at: now,
            resumed_at: null,
            days_completed_before_resume:
              activeGoal.completed_days?.length || 0,
          },
        ],
      })
      .eq("id", activeGoal.id);

    // Deduct 15 XP as a pause penalty (clamped to 0)
    const XP_PAUSE_PENALTY = 15;
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .single();
    if (profile) {
      const newXp = Math.max(0, (profile.total_xp || 0) - XP_PAUSE_PENALTY);
      await supabase
        .from("profiles")
        .update({ total_xp: newXp })
        .eq("id", user.id);
    }

    await refreshProfile();
  };

  const handleDeletePastGoal = async (id: string) => {
    if (!user) return;
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setDeleteTarget(null);
  };

  const completionRate = (g: GoalRecord) =>
    Math.round(((g.completed_days?.length || 0) / (g.total_days || 30)) * 100);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const allForStats = [...goals, ...(activeGoal ? [activeGoal] : [])];
  const totalXP = profile?.total_xp ?? 0;
  const totalDaysCompleted = allForStats.reduce(
    (s, g) => s + (g.completed_days?.length || 0),
    0,
  );
  const bestStreak = allForStats.reduce((s, g) => Math.max(s, g.streak), 0);
  const completedGoals = goals.filter((g) => g.status === "completed").length;

  const totalGoalCount = goals.length + (activeGoal ? 1 : 0);
  const hasReachedGoalLimit = totalGoalCount >= MAX_GOALS;

  return (
    <main className="page-shell" id="goals-screen">
      {isStartingNewGoal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #e5e7eb",
              borderTopColor: "#f97316",
              borderRadius: "50%",
              animation: "goalSpin 0.7s linear infinite",
            }}
          />

          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Preparing your new sprint...
          </span>

          <style>{`
      @keyframes goalSpin {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
        </div>
      )}
      <div className="page-content" style={{ padding: 0 }}>
        <div className="goals-page">
          <div className="goals-layout">
            {/* LEFT COLUMN */}
            <div className="goals-left">
              <div className="goals-left-header">
                <div>
                  <h1 className="goals-title">Your Goals</h1>
                  <p className="goals-sub">
                    Every sprint shapes who you become.
                  </p>
                </div>
                <button
                  className="goals-new-btn"
                  onClick={handleCreateNewGoal}
                  disabled={isStartingNewGoal || hasReachedGoalLimit}
                >
                  {isStartingNewGoal ? (
                    <>Starting...</>
                  ) : hasReachedGoalLimit ? (
                    <>Goal Limit Reached</>
                  ) : (
                    <>
                      <Plus size={15} strokeWidth={2.5} />
                      New Goal
                    </>
                  )}
                </button>
              </div>

              {/* Active Goal Card */}
              {activeGoal && (
                <div className="goals-active-card">
                  <div className="goals-active-top">
                    <div className="goals-active-badge">LIVE</div>
                    <span className="goals-active-date">
                      Started {formatDate(activeGoal.created_at)}
                    </span>
                  </div>
                  <h2 className="goals-active-title">{activeGoal.title}</h2>

                  <p className="goals-active-desc">
                    Day {activeGoal.current_day} of {activeGoal.total_days} ·
                    Keep the streak alive — consistency beats intensity.
                  </p>
                  <div className="goals-progress-track">
                    <div
                      className="goals-progress-fill"
                      style={{ width: `${completionRate(activeGoal)}%` }}
                    />
                  </div>
                  <div className="goals-progress-labels">
                    <span>
                      {activeGoal.completed_days?.length || 0}/
                      {activeGoal.total_days} days completed
                    </span>
                    <span>{completionRate(activeGoal)}% complete</span>
                  </div>
                  <div className="goals-stat-row">
                    <div className="goals-stat-block">
                      <Flame size={18} color="#f97316" />
                      <strong>{activeGoal.streak}</strong>
                      <span>Day Streak</span>
                    </div>
                    <div className="goals-stat-block">
                      <TrendingUp size={18} color="#8b5cf6" />
                      <strong>{activeGoal.xp_earned}</strong>
                      <span>XP Earned</span>
                    </div>

                    <div className="goals-stat-block">
                      <Calendar size={18} color="#06b6d4" />
                      <strong>
                        {Math.max(
                          0,
                          (activeGoal.total_days ?? 30) -
                            (activeGoal.current_day ?? 1) +
                            1,
                        )}
                      </strong>
                      <span>Days Left</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className="goals-continue-btn"
                      onClick={() => router.push("/today")}
                      style={{ flex: 1 }}
                    >
                      Continue Today's Task <ChevronRight size={14} />
                    </button>
                    <button
                      className="goals-pause-btn"
                      onClick={handlePauseGoal}
                      title="Pause this sprint — resume anytime from where you left off"
                    >
                      ⏸ Pause
                    </button>
                  </div>
                </div>
              )}

              {/* Past Goals */}
              {goals.length > 0 && (
                <div className="goals-section">
                  <p className="goals-section-label">Past Sprints</p>
                  <div className="goals-past-list">
                    {goals.map((g) => (
                      <div key={g.id} className="goals-past-card">
                        <div className="goals-past-left">
                          <div className="goals-past-top">
                            <span
                              className="goals-past-status"
                              data-status={g.status}
                            >
                              {g.status === "completed"
                                ? "Completed"
                                : "Abandoned"}
                            </span>
                            <span className="goals-past-date">
                              {formatDate(g.created_at)}
                            </span>
                          </div>

                          <p className="goals-past-title">{g.title}</p>

                          {/* Stats inline */}
                          <div className="goals-past-stats">
                            <span className="goals-past-stat-chip">
                              <Flame size={11} color="#f97316" /> {g.streak} day
                              streak
                            </span>
                            <span className="goals-past-stat-chip">
                              <TrendingUp size={11} color="#8b5cf6" />{" "}
                              {g.xp_earned} XP
                            </span>

                            <span className="goals-past-stat-chip">
                              <Target size={11} color="#6b7280" />{" "}
                              {g.completed_days?.length || 0}/
                              {g.total_days || 30} days
                            </span>
                            <span
                              className="goals-past-stat-chip goals-past-stat-pct"
                              data-good={completionRate(g) >= 50}
                            >
                              {completionRate(g)}% done
                            </span>
                          </div>

                          <div className="goals-mini-track">
                            <div
                              className="goals-mini-fill"
                              style={{
                                width: `${completionRate(g)}%`,
                                background:
                                  g.status === "completed"
                                    ? "#16a34a"
                                    : "#f97316",
                              }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="goals-past-actions">
                          <button
                            className="goals-resume-btn"
                            onClick={() => setResumeTarget(g)}
                            title="Resume this goal"
                          >
                            <RotateCcw size={13} />
                            Resume
                          </button>
                          <button
                            className="goals-past-delete"
                            onClick={() => setDeleteTarget(g.id)}
                            aria-label="Delete goal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!activeGoal && goals.length === 0 && (
                <div className="goals-empty">
                  <Target size={40} color="#d1d5db" />
                  <p className="goals-empty-title">No goals yet</p>
                  <p className="goals-empty-sub">
                    Start your first 30-day sprint.
                  </p>
                  <button
                    className="goals-new-btn"
                    onClick={() => router.replace("/onboarding")}
                  >
                    <Plus size={15} /> Start First Goal
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="goals-right">
              <p className="goals-section-label" style={{ marginBottom: 16 }}>
                Sprint Analytics
              </p>
              <div className="goals-analytics-grid">
                <div className="goals-analytics-card">
                  <span
                    className="goals-analytics-icon"
                    style={{ background: "#fff7ed" }}
                  >
                    <TrendingUp size={16} color="#f97316" />
                  </span>
                  <strong className="goals-analytics-num">{totalXP}</strong>
                  <span className="goals-analytics-label">Total XP</span>
                </div>
                <div className="goals-analytics-card">
                  <span
                    className="goals-analytics-icon"
                    style={{ background: "#fdf4ff" }}
                  >
                    <Flame size={16} color="#8b5cf6" />
                  </span>
                  <strong className="goals-analytics-num">{bestStreak}</strong>
                  <span className="goals-analytics-label">Best Streak</span>
                </div>
                <div className="goals-analytics-card">
                  <span
                    className="goals-analytics-icon"
                    style={{ background: "#f0fdf4" }}
                  >
                    <Target size={16} color="#16a34a" />
                  </span>
                  <strong className="goals-analytics-num">
                    {completedGoals}
                  </strong>
                  <span className="goals-analytics-label">Goals Done</span>
                </div>
                <div className="goals-analytics-card">
                  <span
                    className="goals-analytics-icon"
                    style={{ background: "#eff6ff" }}
                  >
                    <Calendar size={16} color="#3b82f6" />
                  </span>
                  <strong className="goals-analytics-num">
                    {totalDaysCompleted}
                  </strong>
                  <span className="goals-analytics-label">Days Logged</span>
                </div>
              </div>

              <div className="goals-timeline-card">
                <p className="goals-timeline-title">Sprint History</p>
                {allForStats.length === 0 ? (
                  <p className="goals-timeline-empty">No sprints logged yet.</p>
                ) : (
                  <div className="goals-timeline-list">
                    {[...(activeGoal ? [activeGoal] : []), ...goals].map(
                      (g) => (
                        <div key={g.id} className="goals-timeline-row">
                          <div
                            className="goals-timeline-dot"
                            data-status={g.status}
                          />
                          <div className="goals-timeline-content">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <p className="goals-timeline-name">{g.title}</p>
                              {g.status === "active" && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    background: "#f97316",
                                    color: "#fff",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  LIVE
                                </span>
                              )}
                              {g.status === "abandoned" && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    background: "#f3f4f6",
                                    color: "#9ca3af",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  ARCHIVED
                                </span>
                              )}
                              {g.status === "completed" && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    background: "#dcfce7",
                                    color: "#16a34a",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  DONE
                                </span>
                              )}
                            </div>
                            <div className="goals-timeline-meta">
                              <span>{formatDate(g.created_at)}</span>
                              <span>·</span>
                              <span>
                                {g.completed_days?.length || 0}/
                                {g.total_days || 30} days
                              </span>
                              <span>·</span>
                              <span>{g.xp_earned} XP</span>
                            </div>
                            <div
                              className="goals-mini-track"
                              style={{ marginTop: 6 }}
                            >
                              <div
                                className="goals-mini-fill"
                                style={{
                                  width: `${completionRate(g)}%`,
                                  background:
                                    g.status === "active"
                                      ? "#f97316"
                                      : g.status === "completed"
                                        ? "#16a34a"
                                        : "#9ca3af",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {activeGoal && (
                <div className="goals-consistency-card">
                  <div className="goals-consistency-top">
                    <p className="goals-consistency-title">Consistency Score</p>
                    <strong
                      className="goals-consistency-pct"
                      style={{
                        color:
                          completionRate(activeGoal) >= 70
                            ? "#16a34a"
                            : completionRate(activeGoal) >= 40
                              ? "#f97316"
                              : "#9ca3af",
                      }}
                    >
                      {completionRate(activeGoal)}%
                    </strong>
                  </div>
                  <div className="goals-progress-track">
                    <div
                      className="goals-progress-fill"
                      style={{
                        width: `${completionRate(activeGoal)}%`,
                        background:
                          completionRate(activeGoal) >= 70
                            ? "#16a34a"
                            : completionRate(activeGoal) >= 40
                              ? "#f97316"
                              : "#9ca3af",
                      }}
                    />
                  </div>
                  <p className="goals-consistency-hint">
                    {completionRate(activeGoal) >= 70
                      ? "Excellent — you are in the top tier of sprinters."
                      : completionRate(activeGoal) >= 40
                        ? "Good start. Push through the middle days."
                        : "Early days. Every check-in compounds."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Goal Modal */}
      {showNewGoal && (
        <>
          <div
            className="goals-modal-blur"
            onClick={() => setShowNewGoal(false)}
          />
          <div className="goals-modal">
            <div className="goals-modal-header">
              <span>New 30-Day Goal</span>
              <button onClick={() => setShowNewGoal(false)}>✕</button>
            </div>
            <div className="goals-modal-body">
              <label className="goals-modal-label">What's your goal?</label>
              <input
                className="goals-modal-input"
                placeholder="e.g. Become a Product Designer"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartNewGoal()}
                autoFocus
              />
              <p className="goals-modal-hint">
                Be specific — the clearer your goal, the better your sprint.
              </p>
              <button
                className="goals-modal-start"
                onClick={handleStartNewGoal}
                disabled={!newGoalTitle.trim()}
              >
                Start Sprint →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Resume Goal Confirm Modal */}
      {resumeTarget && (
        <>
          <div
            className="goals-modal-blur"
            onClick={() => setResumeTarget(null)}
          />
          <div className="goals-modal">
            <div className="goals-modal-header">
              <span>Resume this goal?</span>
              <button onClick={() => setResumeTarget(null)}>✕</button>
            </div>
            <div className="goals-modal-body">
              <div className="goals-resume-preview">
                <p className="goals-resume-preview-title">
                  {resumeTarget.title}
                </p>
                <div className="goals-resume-preview-stats">
                  <span>
                    <Flame size={12} color="#f97316" /> {resumeTarget.streak}{" "}
                    streak
                  </span>
                  <span>
                    <TrendingUp size={12} color="#8b5cf6" />{" "}
                    {resumeTarget.xp_earned} XP
                  </span>
                  <span>
                    <Target size={12} color="#6b7280" />{" "}
                    {resumeTarget.completed_days?.length || 0}/
                    {resumeTarget.total_days ?? 30} days
                  </span>
                </div>
                <div className="goals-mini-track" style={{ marginTop: 8 }}>
                  <div
                    className="goals-mini-fill"
                    style={{
                      width: `${completionRate(resumeTarget)}%`,
                      background: "#f97316",
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                Your current active goal will be archived. You'll pick up from
                day {(resumeTarget.completed_days?.length || 0) + 1}.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  className="goals-cancel-btn"
                  onClick={() => setResumeTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="goals-confirm-resume-btn"
                  onClick={() => handleResumeGoal(resumeTarget)}
                >
                  <RotateCcw size={14} /> Resume Sprint
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <>
          <div
            className="goals-modal-blur"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="goals-modal">
            <div className="goals-modal-header">
              <span>Delete goal?</span>
              <button onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="goals-modal-body">
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                This will permanently remove this goal and all its analytics.
                This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  className="goals-cancel-btn"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="goals-confirm-delete-btn"
                  onClick={() => handleDeletePastGoal(deleteTarget)}
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .goals-page {
          width: 100%;
          min-height: 100dvh;
          padding: 0;
        }

        .goals-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          min-height: 100dvh;
          gap: 0;
        }

        .goals-left {
          padding: 40px 40px 60px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          border-right: 1px solid #f3f4f6;
        }

        .goals-left-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .goals-title {
          font-family: var(--font-display);
          font-size: var(--text-h1);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.015em;
          color: var(--color-ink);
          margin: 0 0 4px;
        }
        .goals-sub {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }

        .goals-new-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .goals-new-btn:hover {
          background: #1f2937;
        }

        .goals-active-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .goals-pause-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition:
            background 0.15s,
            color 0.15s;
        }
        .goals-pause-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .goals-active-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .goals-active-badge {
          background: #f97316;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.06em;
        }
        .goals-active-date {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }
        .goals-active-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .goals-active-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .goals-progress-track {
          width: 100%;
          height: 7px;
          background: #f3f4f6;
          border-radius: 999px;
          overflow: hidden;
        }
        .goals-progress-fill {
          height: 100%;
          background: #f97316;
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .goals-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 600;
          margin-top: -8px;
        }

        .goals-stat-row {
          display: flex;
          gap: 0;
          border: 1px solid #f3f4f6;
          border-radius: 14px;
          overflow: hidden;
        }
        .goals-stat-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 18px 12px;
          border-right: 1px solid #f3f4f6;
        }
        .goals-stat-block:last-child {
          border-right: none;
        }
        .goals-stat-block strong {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
        }
        .goals-stat-block span {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .goals-continue-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          transition: background 0.15s;
        }
        .goals-continue-btn:hover {
          background: #ea6c0a;
        }

        .goals-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .goals-section-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .goals-past-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .goals-past-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: border-color 0.15s;
        }
        .goals-past-card:hover {
          border-color: #d1d5db;
        }
        .goals-past-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .goals-past-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .goals-past-status {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .goals-past-status[data-status="completed"] {
          background: #dcfce7;
          color: #16a34a;
        }
        .goals-past-status[data-status="abandoned"] {
          background: #f3f4f6;
          color: #6b7280;
        }
        .goals-past-date {
          font-size: 11px;
          color: #9ca3af;
        }
        .goals-past-title {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .goals-past-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .goals-past-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .goals-past-stat-pct[data-good="true"] {
          color: #16a34a;
          background: #f0fdf4;
          border-color: #dcfce7;
        }
        .goals-past-stat-pct[data-good="false"] {
          color: #9ca3af;
        }

        .goals-mini-track {
          width: 100%;
          height: 4px;
          background: #f3f4f6;
          border-radius: 999px;
          overflow: hidden;
        }
        .goals-mini-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .goals-past-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-end;
          flex-shrink: 0;
        }
        .goals-resume-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #f97316;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .goals-resume-btn:hover {
          background: #ffedd5;
        }
        .goals-past-delete {
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .goals-past-delete:hover {
          color: #dc2626;
        }

        .goals-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 60px 20px;
          text-align: center;
        }
        .goals-empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          margin: 0;
        }
        .goals-empty-sub {
          font-size: 13px;
          color: #9ca3af;
          margin: 0 0 8px;
        }

        /* RIGHT */
        .goals-right {
          padding: 40px 28px 60px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #fafafa;
        }

        .goals-analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .goals-analytics-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .goals-analytics-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .goals-analytics-num {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }
        .goals-analytics-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .goals-timeline-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goals-timeline-title {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .goals-timeline-empty {
          font-size: 12px;
          color: #9ca3af;
        }
        .goals-timeline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .goals-timeline-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .goals-timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .goals-timeline-dot[data-status="active"] {
          background: #f97316;
        }
        .goals-timeline-dot[data-status="completed"] {
          background: #16a34a;
        }
        .goals-timeline-dot[data-status="abandoned"] {
          background: #d1d5db;
        }
        .goals-timeline-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .goals-timeline-name {
          font-size: 12px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .goals-timeline-meta {
          display: flex;
          gap: 5px;
          font-size: 11px;
          color: #9ca3af;
          flex-wrap: wrap;
        }

        .goals-consistency-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .goals-consistency-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .goals-consistency-title {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .goals-consistency-pct {
          font-size: 22px;
          font-weight: 800;
        }
        .goals-consistency-hint {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        /* Modals */
        .goals-modal-blur {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(4px);
          z-index: 1001;
        }
        .goals-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1002;
          background: #fff;
          border-radius: 20px;
          width: 380px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        .goals-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 15px;
          font-weight: 800;
          color: #111827;
        }
        .goals-modal-header button {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: 16px;
        }
        .goals-modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .goals-modal-label {
          font-size: 12px;
          font-weight: 700;
          color: #374151;
        }
        .goals-modal-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #111827;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .goals-modal-input:focus {
          border-color: #f97316;
        }
        .goals-modal-hint {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
        .goals-modal-start {
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          margin-top: 4px;
          transition: background 0.15s;
        }
        .goals-modal-start:hover:not(:disabled) {
          background: #1f2937;
        }
        .goals-modal-start:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .goals-resume-preview {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .goals-resume-preview-title {
          font-size: 15px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }
        .goals-resume-preview-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }
        .goals-resume-preview-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .goals-cancel-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }
        .goals-confirm-delete-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #dc2626;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
        }
        .goals-confirm-delete-btn:hover {
          background: #b91c1c;
        }
        .goals-confirm-resume-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #f97316;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .goals-confirm-resume-btn:hover {
          background: #ea6c0a;
        }

        /* =========================================================
   GOALS PAGE — DARK MODE ONLY
   ========================================================= */

        [data-theme="dark"] #goals-screen {
          background: #181a1e;
          color: #f3f4f6;
        }

        /* Main columns */
        [data-theme="dark"] #goals-screen .goals-left {
          background: #181a1e;
          border-right-color: #2d3036;
        }

        [data-theme="dark"] #goals-screen .goals-right {
          background: #1b1d21;
        }

        /* Header */
        [data-theme="dark"] #goals-screen .goals-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-sub,
        [data-theme="dark"] #goals-screen .goals-section-label {
          color: #969ca7;
        }

        /* New Goal button — light button in dark mode */
        [data-theme="dark"] #goals-screen .goals-new-btn {
          background: #f3f4f6;
          color: #181a1e;
        }

        [data-theme="dark"] #goals-screen .goals-new-btn:hover {
          background: #ffffff;
          color: #111827;
        }

        /* Active goal card */
        [data-theme="dark"] #goals-screen .goals-active-card {
          background: #202226;
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-active-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-active-desc {
          color: #a7adb8;
        }

        [data-theme="dark"] #goals-screen .goals-active-date,
        [data-theme="dark"] #goals-screen .goals-progress-labels {
          color: #969ca7;
        }

        /* Progress bars */
        [data-theme="dark"] #goals-screen .goals-progress-track,
        [data-theme="dark"] #goals-screen .goals-mini-track {
          background: #303238;
        }

        /* Active goal stats */
        [data-theme="dark"] #goals-screen .goals-stat-row {
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-stat-block {
          border-right-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-stat-block strong {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-stat-block span {
          color: #969ca7;
        }

        /* Pause button */
        [data-theme="dark"] #goals-screen .goals-pause-btn {
          background: #27292e;
          border-color: #383b42;
          color: #b0b5bf;
        }

        [data-theme="dark"] #goals-screen .goals-pause-btn:hover {
          background: #303238;
          color: #f3f4f6;
        }

        /* Past goal cards */
        [data-theme="dark"] #goals-screen .goals-past-card {
          background: #202226;
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-past-card:hover {
          border-color: #454850;
        }

        [data-theme="dark"] #goals-screen .goals-past-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-past-date {
          color: #969ca7;
        }

        [data-theme="dark"] #goals-screen .goals-past-stat-chip {
          background: #27292e;
          border-color: #383b42;
          color: #a7adb8;
        }

        [data-theme="dark"]
          #goals-screen
          .goals-past-status[data-status="abandoned"] {
          background: #303238;
          color: #a7adb8;
        }

        /* Analytics cards */
        [data-theme="dark"] #goals-screen .goals-analytics-card {
          background: #202226;
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-analytics-num {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-analytics-label {
          color: #969ca7;
        }

        /* Timeline */
        [data-theme="dark"] #goals-screen .goals-timeline-card {
          background: #202226;
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-timeline-title,
        [data-theme="dark"] #goals-screen .goals-timeline-name {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-timeline-meta,
        [data-theme="dark"] #goals-screen .goals-timeline-empty {
          color: #969ca7;
        }

        /* Consistency card */
        [data-theme="dark"] #goals-screen .goals-consistency-card {
          background: #202226;
          border-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-consistency-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-consistency-hint {
          color: #a7adb8;
        }

        /* Empty state */
        [data-theme="dark"] #goals-screen .goals-empty-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-empty-sub {
          color: #969ca7;
        }

        /* Modals */
        [data-theme="dark"] #goals-screen .goals-modal {
          background: #202226;
          border: 1px solid #303238;
        }

        [data-theme="dark"] #goals-screen .goals-modal-header {
          color: #f3f4f6;
          border-bottom-color: #303238;
        }

        [data-theme="dark"] #goals-screen .goals-modal-label {
          color: #d1d5db;
        }

        [data-theme="dark"] #goals-screen .goals-modal-input {
          background: #27292e;
          border-color: #383b42;
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-modal-input::placeholder {
          color: #777d88;
        }

        [data-theme="dark"] #goals-screen .goals-modal-hint {
          color: #969ca7;
        }

        [data-theme="dark"] #goals-screen .goals-resume-preview {
          background: #27292e;
          border-color: #383b42;
        }

        [data-theme="dark"] #goals-screen .goals-resume-preview-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] #goals-screen .goals-resume-preview-stats {
          color: #a7adb8;
        }

        [data-theme="dark"] #goals-screen .goals-cancel-btn {
          background: #27292e;
          border-color: #383b42;
          color: #d1d5db;
        }

        @media (max-width: 900px) {
          .goals-layout {
            grid-template-columns: 1fr;
          }
          .goals-left {
            border-right: none;
            border-bottom: 1px solid #f3f4f6;
            padding: 24px 16px 40px;
          }
          .goals-right {
            background: #fff;
            padding: 24px 16px 88px;
          }
          .goals-active-card {
            padding: 20px;
          }
          .goals-active-title {
            font-size: 22px;
          }
          .goals-active-top {
            flex-wrap: wrap;
          }
          .goals-analytics-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 400px) {
          .goals-modal {
            width: calc(100% - 32px) !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </main>
  );
}

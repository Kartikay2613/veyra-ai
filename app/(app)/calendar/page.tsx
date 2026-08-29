"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SprintCalendar from "@/app/components/SprintCalendar";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";
import CheckpointCalendar from "@/app/components/checkPointCalendar";

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<Record<number, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [goalStartDate, setGoalStartDate] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState<number>(30);
  const [savedTasks, setSavedTasks] = useState<Record<number, any>>({});
  const [missedDays, setMissedDays] = useState<number[]>([]);
  const [pauseHistory, setPauseHistory] = useState<
    {
      paused_at: string | null;
      resumed_at: string | null;
      days_completed_before_resume: number;
    }[]
  >([]);
  const [isGoalPaused, setIsGoalPaused] = useState(false);
  const [progressMode, setProgressMode] = useState<
    "daily" | "checkpoint" | null
  >(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const { data: goalRows } = await supabase
        .from("goals")
        .select(
          "id, current_day, completed_days, created_at, started_at, total_days, pause_history, paused_at, resumed_at,progress_mode",
        )
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const goal = goalRows?.[0] ?? null;

      if (!goal) {
        router.replace("/onboarding");
        return;
      }
      setIsGoalPaused(Boolean(goal.paused_at && !goal.resumed_at));

      setGoalId(goal.id);
      setProgressMode(goal.progress_mode ?? "daily");
      setCurrentDay(goal.current_day ?? 1);
      setCompletedDays(goal.completed_days ?? []);
      const completed = goal.completed_days ?? [];

      const missed = [];

      for (let d = 1; d < goal.current_day; d++) {
        if (!completed.includes(d)) {
          missed.push(d);
        }
      }

      setMissedDays(missed);

      // 2. Get mood entries for this goal
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("day_number, mood_value")
        .eq("user_id", user!.id)
        .eq("goal_id", goal.id);

      const moodMap: Record<number, number> = {};
      (moods ?? []).forEach((m) => {
        moodMap[m.day_number] = m.mood_value;
      });
      setMoodHistory(moodMap);

      const { data: savedTasks } = await supabase
        .from("tasks")
        .select(
          "day_numbers, title, description, category, duration, ai_generated",
        )
        .eq("user_id", user!.id)
        .eq("goal_id", goal.id);

      const taskMap: Record<number, any> = {};
      (savedTasks ?? []).forEach((t) => {
        for (const d of t.day_numbers ?? []) {
          taskMap[d] = {
            day: d,
            title: t.title,
            description: t.description,
            category: t.category,
            duration: t.duration,
            aiGenerated: t.ai_generated,
          };
        }
      });
      setSavedTasks(taskMap);

      setGoalId(goal.id);
      setCompletedDays(goal.completed_days ?? []);
      setPauseHistory(goal.pause_history ?? []);

      const sprintStartDate = goal.started_at ?? goal.created_at;

      setGoalStartDate(sprintStartDate);

      setTotalDays(goal.total_days ?? 30);
      setIsLoaded(true);
    }

    fetchData();
  }, [user, router]);

  async function handleMoodChange(day: number, value: number) {
    if (!user || !goalId) return;
    await supabase.from("mood_entries").upsert(
      {
        user_id: user.id,
        goal_id: goalId,
        day_number: day,
        mood_value: value,
      },
      { onConflict: "user_id,goal_id,day_number" },
    );
    setMoodHistory((prev) => ({ ...prev, [day]: value }));
  }

  if (!isLoaded || progressMode === null) {
    return (
      <main
        id="today-loading-screen"
        className="today-loading-screen"
        aria-busy="true"
        aria-label="Loading today's sprint"
      />
    );
  }
  return (
    <main className="calendar-page-shell" id="calendar-screen">
      <header className="calendar-page-header">
        <h1>
          {progressMode === "daily"
            ? "Your Sprint Calendar"
            : "Your Checkpoint Journey"}
        </h1>

        <p>
          {progressMode === "daily"
            ? "Tap any day to view, edit, or generate its task."
            : "Select a checkpoint to review or edit its milestone task."}
        </p>
      </header>

      <div className="calendar-page-content">
        {progressMode === "daily" ? (
          <SprintCalendar
            completedDays={completedDays}
            currentDay={currentDay}
            moodHistory={moodHistory}
            goalStartDate={goalStartDate}
            totalDays={totalDays}
            isGoalPaused={isGoalPaused}
            pauseHistory={pauseHistory}
            initialTasks={savedTasks}
            onMoodChange={handleMoodChange}
            onSelectActiveDay={() => {
              window.location.href = "/today";
            }}
            onGenerateAITask={async (day) => {
              if (!goalId) return {};

              // Find a task whose day_numbers array contains this day
              const { data: existing } = await supabase
                .from("tasks")
                .select(
                  "id, day_numbers, title, description, category, duration, ai_generated",
                )
                .eq("goal_id", goalId)
                .contains("day_numbers", [day])
                .maybeSingle();

              if (existing) {
                return {
                  day,
                  title: existing.title,
                  description: existing.description,
                  category: existing.category,
                  duration: existing.duration,
                  aiGenerated: existing.ai_generated,
                };
              }

              const res = await fetch("/api/generate-task", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ day }),
              });

              return res.json();
            }}
            onTaskChange={async (updatedTask) => {
              if (!goalId || !user) return;

              // Find task containing this sprint day
              const { data: existing } = await supabase
                .from("tasks")
                .select("id")
                .eq("goal_id", goalId)
                .contains("day_numbers", [updatedTask.day])
                .maybeSingle();

              if (existing) {
                await supabase
                  .from("tasks")
                  .update({
                    title: updatedTask.title,
                    description: updatedTask.description,
                    category: updatedTask.category,
                    duration: updatedTask.duration,
                  })
                  .eq("id", existing.id);
              } else {
                await supabase.from("tasks").insert({
                  user_id: user.id,
                  goal_id: goalId,

                  day_numbers: [updatedTask.day],

                  title: updatedTask.title,
                  description: updatedTask.description,
                  category: updatedTask.category,
                  duration: updatedTask.duration,
                  ai_generated: false,
                });
              }
            }}
          />
        ) : (
          <CheckpointCalendar
            goalId={goalId!}
            onStartCheckpoint={() => {
              window.location.href = "/today";
            }}
            onGenerateAITask={async (checkpoint) => {
              if (!goalId) return {};

              const { data: existing } = await supabase
                .from("tasks")
                .select(
                  "id, day_numbers, title, description, category, duration, ai_generated",
                )
                .eq("goal_id", goalId)
                .contains("day_numbers", [checkpoint])
                .maybeSingle();

              if (existing) {
                return {
                  checkpoint,
                  title: existing.title,
                  description: existing.description,
                  category: existing.category,
                  duration: existing.duration,
                  aiGenerated: existing.ai_generated,
                };
              }

              const res = await fetch("/api/generate-task", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ day: checkpoint }),
              });

              return res.json();
            }}
            onTaskChange={async (updatedTask) => {
              if (!goalId || !user) return;

              const { data: existing } = await supabase
                .from("tasks")
                .select("id")
                .eq("goal_id", goalId)
                .contains("day_numbers", [updatedTask.checkpoint])
                .maybeSingle();

              if (existing) {
                await supabase
                  .from("tasks")
                  .update({
                    title: updatedTask.title,
                    description: updatedTask.description,
                    category: updatedTask.category,
                    duration: updatedTask.duration,
                  })
                  .eq("id", existing.id);
              } else {
                await supabase.from("tasks").insert({
                  user_id: user.id,
                  goal_id: goalId,
                  day_numbers: [updatedTask.checkpoint],
                  title: updatedTask.title,
                  description: updatedTask.description,
                  category: updatedTask.category,
                  duration: updatedTask.duration,
                  ai_generated: false,
                });
              }
            }}
          />
        )}
      </div>

      <style jsx global>{`
        .calendar-page-shell {
          height: 100vh;
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 40px 32px 230px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }

        @media (max-width: 900px) {
          .calendar-page-shell {
            height: auto;
            min-height: 100dvh;
            width: 100%;
            max-width: none;

            padding: 24px 14px calc(100px + env(safe-area-inset-bottom)) 14px;

            overflow: visible;
          }
        }
        .calendar-page-header {
          flex-shrink: 0;
        }
        .calendar-page-header h1 {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 800;
          color: #111827;
          line-height: 1;
          letter-spacing: -0.04em;
          margin: 0;
        }
        .calendar-page-header p {
          margin-top: 14px;
          margin-bottom: 34px;
          font-family: var(--font-body);
          font-size: 18px;
          font-weight: 500;
          line-height: 1.5;
          color: #6b7280;
        }
        .calendar-page-content {
          flex: 1;
          min-height: 0;
        }
        .calendar-page-content .sprint-calendar-card,
        .calendar-page-content .checkpoint-calendar-card {
          height: 100%;
          padding: 26px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid #e5e7eb;
        }

        /* =========================================================
   CALENDAR PAGE — DARK MODE
   Only page shell + heading
   ========================================================= */

        html[data-theme="dark"] #calendar-screen,
        body[data-theme="dark"] #calendar-screen {
          background: #181a1e;
        }

        html[data-theme="dark"] #calendar-screen .calendar-page-header h1,
        body[data-theme="dark"] #calendar-screen .calendar-page-header h1 {
          color: #f3f4f6;
        }

        html[data-theme="dark"] #calendar-screen .calendar-page-header p,
        body[data-theme="dark"] #calendar-screen .calendar-page-header p {
          color: #9ca3af;
        }
        /* =========================================================
   SPRINT CALENDAR — ACTUAL COMPONENT DARK MODE
   ========================================================= */

        html[data-theme="dark"] #calendar-screen .sprint-calendar-card,
        html[data-theme="dark"] #calendar-screen .checkpoint-calendar-card,
        body[data-theme="dark"] #calendar-screen .sprint-calendar-card,
        body[data-theme="dark"] #calendar-screen .checkpoint-calendar-card {
          background: #202226;
          border-color: #303238;
        }

        /* LEFT CALENDAR PANE */
        html[data-theme="dark"] #calendar-screen .calendar-pane,
        body[data-theme="dark"] #calendar-screen .calendar-pane {
          background: #202226;
        }

        /* Month title */
        html[data-theme="dark"] #calendar-screen .cal-month-title,
        body[data-theme="dark"] #calendar-screen .cal-month-title {
          color: #f3f4f6;
        }

        /* Weekday row */
        html[data-theme="dark"] #calendar-screen .weekday-row,
        body[data-theme="dark"] #calendar-screen .weekday-row {
          color: #9ca3af;
        }

        /* Every normal calendar cell */
        html[data-theme="dark"] #calendar-screen .calendar-cell,
        body[data-theme="dark"] #calendar-screen .calendar-cell {
          background: #27292e;
          border-color: #383b42;
          color: #d1d5db;
        }

        /* Empty dates — no card box */
        html[data-theme="dark"] #calendar-screen .calendar-cell--empty,
        body[data-theme="dark"] #calendar-screen .calendar-cell--empty,
        html[data-theme="dark"] #calendar-screen .calendar-cell--outside,
        body[data-theme="dark"] #calendar-screen .calendar-cell--outside {
          background: transparent;
          border-color: transparent;
          color: #555b65;
        }

        /* Locked/upcoming sprint days */
        html[data-theme="dark"] #calendar-screen .calendar-cell--locked,
        body[data-theme="dark"] #calendar-screen .calendar-cell--locked {
          background: #27292e;
          border-color: #383b42;
          color: #9ca3af;
        }

        /* Completed sprint days */
        html[data-theme="dark"] #calendar-screen .calendar-cell--completed,
        body[data-theme="dark"] #calendar-screen .calendar-cell--completed {
          background: #203a34;
          border-color: #2d554b;
          color: #7dd3b0;
        }

        /* Today */
        html[data-theme="dark"] #calendar-screen .calendar-cell--today,
        body[data-theme="dark"] #calendar-screen .calendar-cell--today {
          background: linear-gradient(180deg, #16b98a 0%, #0b8f6d 100%);
          border-color: #08745d;
          color: #ffffff;
        }

        /* Selected day outline */
        html[data-theme="dark"] #calendar-screen .calendar-cell--selected,
        body[data-theme="dark"] #calendar-screen .calendar-cell--selected {
          box-shadow: 0 0 0 2px #5ee0b7;
        }

        /* Navigation buttons */
        html[data-theme="dark"] #calendar-screen .cal-nav-btn,
        html[data-theme="dark"] #calendar-screen .cal-nav-icon-btn,
        body[data-theme="dark"] #calendar-screen .cal-nav-btn,
        body[data-theme="dark"] #calendar-screen .cal-nav-icon-btn {
          background: #27292e;
          border-color: #383b42;
          color: #d1d5db;
        }

        /* RIGHT TASK PANEL */
        html[data-theme="dark"] #calendar-screen .task-pane,
        body[data-theme="dark"] #calendar-screen .task-pane {
          background: #202226;
          border-color: #383b42;
        }

        /* Inner task panel */
        html[data-theme="dark"] #calendar-screen .task-pane-inner,
        body[data-theme="dark"] #calendar-screen .task-pane-inner {
          background: #202226;
        }

        /* Task title */
        html[data-theme="dark"] #calendar-screen .task-title,
        body[data-theme="dark"] #calendar-screen .task-title {
          color: #f3f4f6;
        }

        /* Task description/content text */
        html[data-theme="dark"] #calendar-screen .task-description,
        body[data-theme="dark"] #calendar-screen .task-description {
          color: #aeb4bf;
        }

        /* Metadata labels and values */
        html[data-theme="dark"] #calendar-screen .task-meta-label,
        body[data-theme="dark"] #calendar-screen .task-meta-label {
          color: #737985;
        }

        html[data-theme="dark"] #calendar-screen .task-meta-value,
        body[data-theme="dark"] #calendar-screen .task-meta-value {
          color: #d1d5db;
        }

        /* =========================================================
   CHECKPOINT CALENDAR DARK MODE
   ========================================================= */

        html[data-theme="dark"] #calendar-screen .checkpoint-calendar-card,
        body[data-theme="dark"] #calendar-screen .checkpoint-calendar-card {
          background: #202226 !important;
          border-color: #303238 !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-pane,
        body[data-theme="dark"] #calendar-screen .chk-pane {
          background: #202226 !important;

          border: 1px solid #303238 !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-task-pane-inner,
        body[data-theme="dark"] #calendar-screen .chk-task-pane-inner {
          background: #202226 !important;

          border: 1px solid #303238 !important;

          box-shadow: none !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-title,
        html[data-theme="dark"] #calendar-screen .chk-task-title,
        body[data-theme="dark"] #calendar-screen .chk-title,
        body[data-theme="dark"] #calendar-screen .chk-task-title {
          color: #f3f4f6 !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-task-desc,
        body[data-theme="dark"] #calendar-screen .chk-task-desc {
          color: #aeb4bf !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-field-label,
        body[data-theme="dark"] #calendar-screen .chk-field-label {
          color: #7b818c !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-meta-grid strong,
        body[data-theme="dark"] #calendar-screen .chk-meta-grid strong {
          color: #f3f4f6 !important;
        }

        html[data-theme="dark"] #calendar-screen .chk-btn--ghost,
        body[data-theme="dark"] #calendar-screen .chk-btn--ghost {
          background: #27292e !important;

          border-color: #3a3d43 !important;

          color: #f3f4f6 !important;
        }

        /* =========================================================
   FINAL DARK MODE FIXES
   ========================================================= */

        /* 1. PAINT THE ENTIRE PAGE / VIEWPORT */
        html[data-theme="dark"],
        html[data-theme="dark"] body,
        body[data-theme="dark"] {
          background: #181a1e !important;
        }

        /* 2. REMOVE LIGHT TASK-PANEL OUTLINE */
        html[data-theme="dark"] #calendar-screen .task-pane-inner,
        body[data-theme="dark"] #calendar-screen .task-pane-inner {
          background: #202226 !important;

          border: 1px solid #303238 !important;

          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18) !important;
        }

        /* 3. SELECTED CELL — DARK INDIGO, NOT WHITE */
        html[data-theme="dark"]
          #calendar-screen
          .calendar-cell--selected:not(.calendar-cell--today),
        body[data-theme="dark"]
          #calendar-screen
          .calendar-cell--selected:not(.calendar-cell--today) {
          background: linear-gradient(
            145deg,
            #292d46 0%,
            #24283d 100%
          ) !important;

          border: 1px solid #818cf8 !important;

          color: #c7d2fe !important;

          box-shadow:
            0 0 0 2px rgba(99, 102, 241, 0.18),
            0 8px 20px rgba(0, 0, 0, 0.22) !important;

          transform: translateY(-1px);
        }

        /* Selected cell number */
        html[data-theme="dark"]
          #calendar-screen
          .calendar-cell--selected:not(.calendar-cell--today)
          .cell-day-num,
        body[data-theme="dark"]
          #calendar-screen
          .calendar-cell--selected:not(.calendar-cell--today)
          .cell-day-num {
          color: #c7d2fe !important;
        }

        /* Keep TODAY green even when selected */
        html[data-theme="dark"]
          #calendar-screen
          .calendar-cell--today.calendar-cell--selected,
        body[data-theme="dark"]
          #calendar-screen
          .calendar-cell--today.calendar-cell--selected {
          background: linear-gradient(
            180deg,
            #16b98a 0%,
            #0b8f6d 100%
          ) !important;

          border: 1px solid #4adeb5 !important;

          color: #ffffff !important;

          box-shadow:
            0 0 0 2px rgba(45, 212, 191, 0.16),
            0 8px 20px rgba(6, 95, 70, 0.25) !important;
        }
        @media (max-width: 900px) {
          .calendar-page-shell {
            height: auto;
            min-height: 100dvh;

            max-width: none;
            width: 100%;

            padding: 24px 14px calc(100px + env(safe-area-inset-bottom)) 14px;

            overflow: visible;
          }

          .calendar-page-header h1 {
            font-size: 28px;
            line-height: 1.1;
          }

          .calendar-page-header p {
            margin-top: 8px;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .calendar-page-content {
            flex: none;
            min-height: auto;
            width: 100%;
          }

          .calendar-page-content .sprint-calendar-card {
            height: auto;
            padding: 14px;
            border-radius: 16px;
          }
        }
      `}</style>
    </main>
  );
}

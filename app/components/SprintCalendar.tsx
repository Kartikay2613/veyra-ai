"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Save,
  X,
  Check,
  CloudRain,
  CloudDrizzle,
  Minus,
  Sun,
  Zap as ZapIcon,
} from "lucide-react";

import { SPRINT_TASKS } from "@/app/lib/data";
import CheckIcon from "./CheckIcon";

interface SprintTask {
  day: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  aiGenerated?: boolean;
}
interface SprintCalendarProps {
  completedDays: number[];
  currentDay: number;
  goalStartDate?: string | null;
  totalDays?: number;
  moodHistory?: Record<number, number>;
  initialTasks?: Record<number, SprintTask>;
  pauseHistory?: { paused_at: string | null; resumed_at: string | null }[];
  isGoalPaused?: boolean;
  onMoodChange?: (day: number, value: number) => void;
  onSelectActiveDay?: () => void;
  onGenerateAITask?: (
    day: number,
  ) => Promise<Partial<SprintTask>> | Partial<SprintTask>;
  onTaskChange?: (task: SprintTask) => void;
  mascotImageSrc?: string;
  holidays?: { date: string; name: string }[];
}
const MOOD_INFO = [
  { label: "Struggling", color: "#ef4444", icon: CloudRain },
  { label: "Low", color: "#f97316", icon: CloudDrizzle },
  { label: "Neutral", color: "#eab308", icon: Minus },
  { label: "Focused", color: "#22c55e", icon: Sun },
  { label: "On Fire", color: "#8b5cf6", icon: ZapIcon },
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function SprintCalendar({
  completedDays,
  currentDay,
  moodHistory = {},
  onMoodChange,
  goalStartDate,
  pauseHistory = [],
  isGoalPaused = false,
  onSelectActiveDay,
  initialTasks,
  onGenerateAITask,
  totalDays,
  onTaskChange,
  mascotImageSrc,
  holidays = [],
}: SprintCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (goalStartDate) {
      const d = new Date(goalStartDate);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [tasks, setTasks] = useState<Record<number, SprintTask>>(() => {
    const map: Record<number, SprintTask> = {};
    SPRINT_TASKS.forEach((t) => {
      map[t.day] = { ...t };
    });
    if (initialTasks) {
      Object.entries(initialTasks).forEach(([day, t]) => {
        map[Number(day)] = t as SprintTask;
      });
    }
    return map;
  });

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<SprintTask | null>(null);

  const selectedTask: SprintTask = tasks[selectedDay] ?? {
    day: selectedDay,
    title: "No task set",
    description: "Add a task for this day, or generate one with AI.",
    category: "—",
    duration: "—",
  };

  const isSelectedCompleted = completedDays.includes(selectedDay);

  const todaySprintDay = currentDay;

  const isSelectedToday = selectedDay === currentDay;

  const isSelectedLocked = selectedDay > currentDay;

  const monthLabel = viewDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay]);

  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; inCurrentMonth: boolean }[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        inCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inCurrentMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inCurrentMonth: false,
      });
    }
    return cells;
  }, [viewDate]);

  const numRows = monthGrid.length / 7;

  function startOfLocalDay(value: Date | string) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isSameLocalDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function isDateInPauseRange(date: Date): boolean {
    const target = startOfLocalDay(date);

    const closedPauseRanges = pauseHistory.filter(
      (ph) => ph.paused_at && ph.resumed_at,
    );

    for (const ph of closedPauseRanges) {
      const pausedDay = startOfLocalDay(ph.paused_at!);
      const resumedDay = startOfLocalDay(ph.resumed_at!);

      if (isSameLocalDay(pausedDay, resumedDay)) {
        continue;
      }

      if (target > pausedDay && target < resumedDay) {
        return true;
      }
    }

    if (isGoalPaused) {
      const latestOpenPause = [...pauseHistory]
        .reverse()
        .find((ph) => ph.paused_at && !ph.resumed_at);

      if (latestOpenPause?.paused_at) {
        const pausedDay = startOfLocalDay(latestOpenPause.paused_at);

        return target > pausedDay;
      }
    }

    return false;
  }
  function sprintDayFor(date: Date): number | null {
    const startDate = startOfLocalDay(
      goalStartDate ??
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - (currentDay - 1),
        ),
    );

    const targetDate = startOfLocalDay(date);

    if (targetDate < startDate) {
      return null;
    }

    if (isDateInPauseRange(targetDate)) {
      return null;
    }

    let sprintDay = 1;
    const cursor = new Date(startDate);

    while (cursor < targetDate) {
      const nextDate = new Date(cursor);
      nextDate.setDate(nextDate.getDate() + 1);

      const resumeDate = pauseHistory.find((ph) => {
        if (!ph.paused_at || !ph.resumed_at) return false;

        const pausedDay = startOfLocalDay(ph.paused_at);
        const resumedDay = startOfLocalDay(ph.resumed_at);

        if (isSameLocalDay(pausedDay, resumedDay)) {
          return false;
        }

        return isSameLocalDay(resumedDay, nextDate);
      });

      const currentlyPausedBeforeNextDate = isDateInPauseRange(nextDate);

      if (!currentlyPausedBeforeNextDate && !resumeDate) {
        sprintDay += 1;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (sprintDay < 1 || sprintDay > (totalDays ?? 30)) {
      return null;
    }

    return sprintDay;
  }
  function goToMonth(offset: number) {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  }

  function goToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(currentDay);
  }

  function openDay(day: number) {
    setSelectedDay(day);
    setIsEditing(false);
    setDraft(null);
  }

  function startEditing() {
    setDraft({ ...selectedTask, day: selectedDay });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(null);
  }

  function saveEditing() {
    if (!draft) return;
    const saved: SprintTask = {
      ...draft,
      day: selectedDay,
      aiGenerated: false,
    };
    setTasks((prev) => ({ ...prev, [selectedDay]: saved }));
    onTaskChange?.(saved);
    setIsEditing(false);
    setDraft(null);
  }

  async function generateWithAI() {
    if (!onGenerateAITask) return;
    setIsGenerating(true);
    try {
      const result = await onGenerateAITask(selectedDay);
      const merged: SprintTask = {
        day: selectedDay,
        title: result.title ?? selectedTask.title,
        description: result.description ?? selectedTask.description,
        category: result.category ?? selectedTask.category,
        duration: result.duration ?? selectedTask.duration,
        aiGenerated: true,
      };
      setTasks((prev) => ({ ...prev, [selectedDay]: merged }));
      onTaskChange?.(merged);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="sprint-calendar-card card-premium">
      {/* LEFT: calendar pane */}
      <div className="calendar-pane">
        <div className="calendar-pane-header">
          <div>
            <div className="cal-eyebrow">SPRINT CALENDAR</div>
            <h3 className="cal-month-title">{monthLabel}</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="cal-nav-btn" onClick={goToToday}>
              Today
            </button>
            <button
              type="button"
              className="cal-nav-icon-btn"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="cal-nav-icon-btn"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="weekday-row">
          {WEEKDAYS.map((day, i) => (
            <div key={`${day}-${i}`}>{day}</div>
          ))}
        </div>

        <div
          className="sprint-calendar-grid"
          style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
        >
          {monthGrid.map(({ date, inCurrentMonth }, idx) => {
            const day = sprintDayFor(new Date(date));
            const task = day ? tasks[day] : null;
            const isCompleted = day ? completedDays.includes(day) : false;
            const isCalendarToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            const isCurrentSprintDay = day !== null && day === currentDay;

            const isToday = isCurrentSprintDay;
            const isLocked = day ? day > currentDay : false;
            const isSelected = day === selectedDay;

            const moodIndex = day ? moodHistory[day] : undefined;
            const moodObj =
              moodIndex !== undefined ? MOOD_INFO[moodIndex - 1] : null;
            const MoodIconComponent = moodObj?.icon;

            const isPaused = inCurrentMonth && isDateInPauseRange(date);

            let cellClass = "calendar-cell";
            if (!inCurrentMonth) cellClass += " calendar-cell--outside";
            if (!day && !isPaused) cellClass += " calendar-cell--empty";
            if (isPaused) cellClass += " calendar-cell--paused";
            if (isCompleted) cellClass += " calendar-cell--completed";
            if (isToday) cellClass += " calendar-cell--today";
            if (isLocked) cellClass += " calendar-cell--locked";
            if (isSelected) cellClass += " calendar-cell--selected";
            return (
              <button
                key={idx}
                className={cellClass}
                onClick={() => day && openDay(day)}
                disabled={!day}
                type="button"
                aria-label={day ? `Day ${day}` : "Outside sprint range"}
              >
                <span className="cell-day-num">{date.getDate()}</span>

                {day && (
                  <>
                    {isCompleted ? (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          display: "flex",
                          color: "rgba(21, 128, 61, 0.75)", // subtle dark green
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : isToday ? (
                      <span className="cell-pulse-ring" />
                    ) : isLocked ? (
                      <span
                        style={{
                          color: "var(--color-ink-40)",
                          opacity: 0.3,
                          marginTop: 3,
                          display: "flex",
                        }}
                      >
                        <Lock size={12} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="cell-missed-dot" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: task detail / editor panel */}
      <div className="task-pane">
        <div className="task-pane-inner">
          <div className="task-pane-top">
            <div style={{ flex: 1 }}>
              <div className="task-eyebrow">
                DAY {selectedDay}
                {selectedTask.aiGenerated && (
                  <span className="ai-pill">
                    <Sparkles size={11} /> AI
                  </span>
                )}
              </div>

              {isEditing && draft ? (
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="task-edit-input task-edit-title"
                  placeholder="Task title"
                />
              ) : (
                <h3 className="task-title">{selectedTask.title}</h3>
              )}
            </div>

            {isSelectedCompleted ? (
              <span className="status-pill status-pill--done">Completed</span>
            ) : isSelectedToday ? (
              <span className="status-pill status-pill--today">Today</span>
            ) : isSelectedLocked ? (
              <span className="status-pill status-pill--locked">Upcoming</span>
            ) : (
              <span className="status-pill status-pill--locked">Past</span>
            )}
          </div>

          {isEditing && draft ? (
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              className="task-edit-input task-edit-desc"
              placeholder="Task description"
              rows={4}
            />
          ) : (
            <p className="task-desc">{selectedTask.description}</p>
          )}

          <div className="task-meta-grid">
            <div>
              <div className="field-label">Category</div>
              {isEditing && draft ? (
                <input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  className="task-edit-input"
                />
              ) : (
                <strong>{selectedTask.category}</strong>
              )}
            </div>

            <div>
              <div className="field-label">Duration</div>
              {isEditing && draft ? (
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.duration.replace(/\D/g, "")}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, "");
                    setDraft({
                      ...draft,
                      duration: num ? `${num} min` : "",
                    });
                  }}
                  placeholder="e.g. 30"
                  className="task-edit-input"
                />
              ) : (
                <strong>{selectedTask.duration}</strong>
              )}
            </div>

            <div>
              <div className="field-label">Status</div>
              <strong>
                {isSelectedCompleted
                  ? "Completed"
                  : isSelectedToday
                    ? "Today's Task"
                    : isSelectedLocked
                      ? "Upcoming"
                      : "Past"}
              </strong>
            </div>
          </div>

          <div className="task-action-row">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="action-btn action-btn--primary"
                  onClick={saveEditing}
                >
                  <Save size={16} /> Save
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--ghost"
                  onClick={cancelEditing}
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="action-btn action-btn--ghost"
                  onClick={startEditing}
                >
                  <Pencil size={16} /> Edit task
                </button>

                {isSelectedToday && (
                  <button
                    type="button"
                    className="action-btn action-btn--primary"
                    onClick={onSelectActiveDay}
                  >
                    Start Today's Task →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .sprint-calendar-card {
          display: flex;
          align-items: stretch;
          gap: 20px;
          width: 100%;
          height: 100%;
        }

        .calendar-pane {
          flex: 1.5;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .calendar-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .cal-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #2563eb;
          text-transform: uppercase;
        }

        .cal-month-title {
          font-size: 19px;
          font-weight: 800;
          margin-top: 4px;
          color: #111827;
        }

        .weekday-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
          text-align: center;
          font-weight: 700;
          font-size: 12px;
          color: #94a3b8;
        }

        .sprint-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          flex: 1;
          min-height: 0;
          align-content: stretch;
        }

        .calendar-cell {
          border-radius: 12px;
          background: #f1faf6;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s ease;
          width: 100%;
          height: 100%;
        }

        .calendar-cell:focus,
        .calendar-cell:focus-visible {
          outline: none;
        }

        .calendar-cell:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
        }

        .calendar-cell--outside {
          background: transparent;
          opacity: 0.3;
        }

        .calendar-cell--empty {
          cursor: default;
          background: transparent;
        }

        .calendar-cell--paused {
          background: repeating-linear-gradient(
            45deg,
            #f3f4f6,
            #f3f4f6 4px,
            #e9eaec 4px,
            #e9eaec 8px
          );
          color: #d1d5db;
          cursor: default;
          opacity: 0.7;
        }

        .cell-day-num {
          font-size: 13px;
          font-weight: 700;
          font-family: Inter, sans-serif;
          color: inherit;
        }

        .calendar-cell--completed {
          background: #dcfce7;
          color: #15803d;
        }

        .calendar-cell--today {
          background: #10b981;
          color: white;
        }
        /* Distinct selected style — indigo, separate from green today/completed states */
        .calendar-cell--selected {
          border: 1.5px solid #6366f1 !important;
          background: #f5f6ff !important;
          color: #4338ca !important;
        }
        .calendar-cell--selected .cell-day-num {
          color: #4338ca;
        }
        .calendar-cell--today.calendar-cell--selected {
          background: #10b981 !important;
          border: 1.5px solid #ffffff !important;
        }
        .calendar-cell--today.calendar-cell--selected .cell-day-num {
          color: white;
        }

        .cell-ai-badge {
          position: absolute;
          top: 3px;
          right: 3px;
          color: #7c3aed;
          display: flex;
        }

        .cell-mood-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          display: flex;
          background: #ffffff;
          border-radius: 6px;
          padding: 3px 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }

        .cal-nav-btn {
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 5px 10px;
          cursor: pointer;
        }

        .cal-nav-icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
          cursor: pointer;
        }

        .cal-nav-icon-btn:hover,
        .cal-nav-btn:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        /* RIGHT PANE */
        .task-pane {
          flex: 1;
          min-width: 280px;
          max-width: 360px;
          height: 100%;
        }

        .task-pane-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          padding: 18px;
          background: linear-gradient(180deg, #ffffff, #f9fafb);
          border: 1px solid #e5e7eb;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
          overflow-y: auto;
        }

        .task-pane-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 14px;
        }

        .task-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #10b981;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .task-title {
          font-size: 18px;
          font-weight: 800;
          margin-top: 4px;
          color: #111827;
          line-height: 1.3;
        }

        .task-desc {
          color: #6b7280;
          line-height: 1.7;
          font-size: 13.5px;
          margin-bottom: 16px;
        }

        .task-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          font-size: 13px;
        }

        .field-label {
          color: #9ca3af;
          font-size: 10.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .status-pill {
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
        }
        .status-pill--done {
          background: #dcfce7;
          color: #15803d;
        }
        .status-pill--today {
          background: #ecfdf5;
          color: #059669;
        }
        .status-pill--locked {
          background: #f3f4f6;
          color: #6b7280;
        }

        .ai-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f5f3ff;
          color: #7c3aed;
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 700;
        }

        .task-edit-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 7px 9px;
          font-size: 13px;
          font-family: inherit;
          color: #111827;
          background: #fff;
        }
        .task-edit-title {
          font-size: 16px;
          font-weight: 800;
          margin-top: 5px;
        }
        .task-edit-desc {
          margin-bottom: 14px;
          resize: vertical;
        }

        .task-action-row {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;
          flex-wrap: wrap;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .action-btn--primary {
          background: #10b981;
          color: white;
        }
        .action-btn--ghost {
          background: #f3f4f6;
          color: #374151;
        }
        .action-btn--ai {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white;
        }
        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .sprint-calendar-card {
            flex-direction: column;
            height: auto !important;
            gap: 18px;
          }

          .calendar-pane {
            flex: none;
            width: 100%;
            height: auto !important;
            min-height: 0;
          }

          .calendar-pane-header {
            gap: 10px;
            margin-bottom: 16px;
          }

          .cal-month-title {
            font-size: 17px;
          }

          .weekday-row {
            margin-bottom: 6px;
          }

          .sprint-calendar-grid {
            flex: none;
            grid-auto-rows: minmax(44px, 1fr);
            gap: 5px;
          }

          .calendar-cell {
            aspect-ratio: 1 / 1;
            min-height: 42px;
            border-radius: 9px;
          }

          .task-pane {
            width: 100%;
            max-width: none;
            min-width: 0;
            height: auto !important;
          }

          .task-pane-inner {
            height: auto !important;
            min-height: 280px;
            padding: 16px;
            overflow: visible;
          }

          .calendar-cell > div[style*="rgba(21,"] {
            bottom: 3px !important;
            right: 3px !important;
          }
        }
        @media (max-width: 360px) {
          .sprint-calendar-grid {
            gap: 4px;
          }
          .calendar-cell {
            min-height: 34px;
          }
          .cell-day-num {
            font-size: 11px;
          }
          .calendar-cell > div[style*="rgba(21,"] svg {
            width: 10px !important;
            height: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback } from "react";
import { Lock, Sparkles, Pencil, Save, X, Check, Loader2 } from "lucide-react";

import { useEffect } from "react";

import { useAuth } from "@/app/lib/AuthContext";
import { supabase } from "@/app/lib/supabase-client";

interface CheckpointTaskData {
  checkpoint: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  aiGenerated?: boolean;
}

interface CheckpointCalendarProps {
  goalId: string;
  onStartCheckpoint?: () => void;
  onGenerateAITask?: (
    checkpoint: number,
  ) => Promise<Partial<CheckpointTaskData>> | Partial<CheckpointTaskData>;
  onTaskChange?: (task: CheckpointTaskData) => void;
}

type ThemeMode = "light" | "dark";

export default function CheckpointCalendar({
  goalId,
  onStartCheckpoint,
  onGenerateAITask,
  onTaskChange,
}: CheckpointCalendarProps) {
  const { user, profile } = useAuth();

  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const updateTheme = () => {
      const htmlTheme = document.documentElement.dataset.theme;

      setTheme(htmlTheme === "dark" ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  if (!profile) {
    return null;
  }

  // ── Goal / checkpoint state (fetched from goals + tasks tables) ──
  const [isLoading, setIsLoading] = useState(true);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<number[]>(
    [],
  );
  const [totalCheckpoints, setTotalCheckpoints] = useState(0);
  const [isGoalPaused, setIsGoalPaused] = useState(false);

  const [tasks, setTasks] = useState<Record<number, CheckpointTaskData>>({});

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<CheckpointTaskData | null>(null);

  // ── Fetch goal + tasks ──
  const loadData = useCallback(async () => {
    if (!goalId) return;
    setIsLoading(true);

    const { data: goal, error: goalErr } = await supabase
      .from("goals")
      .select("id, current_day, completed_days, total_days, status")
      .eq("id", goalId)
      .single();

    if (goalErr || !goal) {
      setIsLoading(false);
      return;
    }

    setCurrentCheckpoint(goal.current_day ?? 1);
    setCompletedCheckpoints(goal.completed_days ?? []);
    setTotalCheckpoints(goal.total_days ?? 0);
    setIsGoalPaused(goal.status !== "active");
    setSelectedCheckpoint(goal.current_day ?? 1);

    const { data: taskRows } = await supabase
      .from("tasks")
      .select(
        "day_numbers, title, description, category, duration, ai_generated",
      )
      .eq("goal_id", goalId);

    const map: Record<number, CheckpointTaskData> = {};
    (taskRows ?? []).forEach((t: any) => {
      (t.day_numbers ?? []).forEach((cp: number) => {
        map[cp] = {
          checkpoint: cp,
          title: t.title,
          description: t.description,
          category: t.category,
          duration: t.duration,
          aiGenerated: t.ai_generated,
        };
      });
    });
    setTasks(map);
    setIsLoading(false);
  }, [goalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedTask: CheckpointTaskData = tasks[selectedCheckpoint] ?? {
    checkpoint: selectedCheckpoint,
    title: "No task set",
    description: "Add a task for this checkpoint, or generate one with AI.",
    category: "—",
    duration: "—",
  };

  const isSelectedCompleted = completedCheckpoints.includes(selectedCheckpoint);
  const isSelectedCurrent = selectedCheckpoint === currentCheckpoint;
  const isSelectedLocked = selectedCheckpoint > currentCheckpoint;

  // Future checkpoints can be planned, but only the current checkpoint can start.
  const isSelectedEditable = !isSelectedCompleted && !isGoalPaused;

  function openCheckpoint(cp: number) {
    setSelectedCheckpoint(cp);
    setIsEditing(false);
    setDraft(null);
  }

  function goToCurrent() {
    setSelectedCheckpoint(currentCheckpoint);
    setIsEditing(false);
    setDraft(null);
  }

  function startEditing() {
    setDraft({ ...selectedTask, checkpoint: selectedCheckpoint });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(null);
  }

  // Persist a task edit — splits/merges grouped tasks table rows the same
  // way the rest of the app already does (day_numbers[] grouping)
  async function persistTaskChange(taskData: CheckpointTaskData) {
    if (!goalId) return;

    const { data: existingRows } = await supabase
      .from("tasks")
      .select("id, day_numbers")
      .eq("goal_id", goalId)
      .contains("day_numbers", [taskData.checkpoint]);

    const oldRow = existingRows?.[0];

    if (oldRow) {
      const remaining = (oldRow.day_numbers ?? []).filter(
        (d: number) => d !== taskData.checkpoint,
      );
      if (remaining.length > 0) {
        await supabase
          .from("tasks")
          .update({ day_numbers: remaining })
          .eq("id", oldRow.id);
      } else {
        await supabase.from("tasks").delete().eq("id", oldRow.id);
      }
    }

    await supabase.from("tasks").insert({
      user_id: user?.id,
      goal_id: goalId,
      day_numbers: [taskData.checkpoint],
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      duration: taskData.duration,
      ai_generated: taskData.aiGenerated ?? false,
    });
  }

  async function saveEditing() {
    if (!draft) return;
    setIsSaving(true);
    const saved: CheckpointTaskData = {
      ...draft,
      checkpoint: selectedCheckpoint,
      aiGenerated: false,
    };
    setTasks((prev) => ({ ...prev, [selectedCheckpoint]: saved }));
    await persistTaskChange(saved);
    onTaskChange?.(saved);
    setIsEditing(false);
    setDraft(null);
    setIsSaving(false);
  }

  async function generateWithAI() {
    if (!onGenerateAITask) return;
    setIsGenerating(true);
    try {
      const result = await onGenerateAITask(selectedCheckpoint);
      const merged: CheckpointTaskData = {
        checkpoint: selectedCheckpoint,
        title: result.title ?? selectedTask.title,
        description: result.description ?? selectedTask.description,
        category: result.category ?? selectedTask.category,
        duration: result.duration ?? selectedTask.duration,
        aiGenerated: true,
      };
      setTasks((prev) => ({ ...prev, [selectedCheckpoint]: merged }));
      await persistTaskChange(merged);
      onTaskChange?.(merged);
    } finally {
      setIsGenerating(false);
    }
  }

  const checkpointList = useMemo(
    () => Array.from({ length: totalCheckpoints }, (_, i) => i + 1),
    [totalCheckpoints],
  );

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="checkpoint-calendar-card" data-theme={theme}>
        <div className="chk-pane">
          <div className="chk-skel chk-skel-header" />
          <div className="chk-skel-grid">
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} className="chk-skel chk-skel-tile" />
            ))}
          </div>
        </div>
        <div className="chk-task-pane">
          <div className="chk-task-pane-inner">
            <div className="chk-skel chk-skel-line" style={{ width: "40%" }} />
            <div
              className="chk-skel chk-skel-line"
              style={{ width: "80%", height: 22 }}
            />
            <div className="chk-skel chk-skel-line" style={{ width: "100%" }} />
            <div className="chk-skel chk-skel-line" style={{ width: "90%" }} />
          </div>
        </div>
        <style jsx global>
          {CHECKPOINT_CALENDAR_STYLES}
        </style>
      </div>
    );
  }

  // ── Empty state ──
  if (!totalCheckpoints) {
    return (
      <div className="checkpoint-calendar-card" data-theme={theme}>
        <div className="chk-empty">
          <p className="chk-empty-title">No checkpoints yet</p>
          <p className="chk-empty-sub">
            This goal doesn't have any checkpoints configured.
          </p>
        </div>
        <style jsx global>
          {CHECKPOINT_CALENDAR_STYLES}
        </style>
      </div>
    );
  }

  return (
    <div className="checkpoint-calendar-card" data-theme={theme}>
      {/* LEFT: checkpoint grid pane */}
      <div className="chk-pane">
        <div className="chk-pane-header">
          <div>
            <div className="chk-eyebrow">CHECKPOINTS</div>
            <h3 className="chk-title">
              {completedCheckpoints.length}/{totalCheckpoints} complete
            </h3>
          </div>

          <button type="button" className="chk-nav-btn" onClick={goToCurrent}>
            Current
          </button>
        </div>

        <div className="chk-grid">
          {checkpointList.map((cp) => {
            const isCompleted = completedCheckpoints.includes(cp);
            const isCurrent = cp === currentCheckpoint;
            const isLocked = cp > currentCheckpoint;
            const isSelected = cp === selectedCheckpoint;

            let cellClass = "chk-cell";
            if (isCompleted) cellClass += " chk-cell--completed";
            if (isCurrent) cellClass += " chk-cell--current";
            if (isLocked) cellClass += " chk-cell--locked";
            if (isSelected) cellClass += " chk-cell--selected";

            return (
              <button
                key={cp}
                type="button"
                className={cellClass}
                onClick={() => openCheckpoint(cp)}
                aria-label={`Checkpoint ${cp}${isLocked ? ", upcoming" : ""}`}
              >
                <span className="chk-cell-num">{cp}</span>
                {isCompleted ? (
                  <span className="chk-cell-check">
                    <Check size={13} strokeWidth={3} />
                  </span>
                ) : isCurrent ? (
                  <span className="chk-cell-pulse" />
                ) : isLocked ? (
                  <span className="chk-cell-lock">
                    <Lock size={11} strokeWidth={2.5} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: checkpoint detail / editor panel */}
      <div className="chk-task-pane">
        <div className="chk-task-pane-inner">
          <div className="chk-task-pane-top">
            <div style={{ flex: 1 }}>
              <div className="chk-task-eyebrow">
                CHECKPOINT {selectedCheckpoint}
                {selectedTask.aiGenerated && (
                  <span className="chk-ai-pill">
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
                  className="chk-edit-input chk-edit-title"
                  placeholder="Checkpoint title"
                />
              ) : (
                <h3 className="chk-task-title">{selectedTask.title}</h3>
              )}
            </div>

            {isSelectedCompleted ? (
              <span className="chk-status-pill chk-status-pill--done">
                Completed
              </span>
            ) : isSelectedCurrent ? (
              <span className="chk-status-pill chk-status-pill--current">
                Current
              </span>
            ) : isSelectedLocked ? (
              <span className="chk-status-pill chk-status-pill--locked">
                Upcoming
              </span>
            ) : (
              <span className="chk-status-pill chk-status-pill--locked">
                Past
              </span>
            )}
          </div>

          {isEditing && draft ? (
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              className="chk-edit-input chk-edit-desc"
              placeholder="Checkpoint description"
              rows={4}
            />
          ) : (
            <p className="chk-task-desc">{selectedTask.description}</p>
          )}

          <div className="chk-meta-grid">
            <div>
              <div className="chk-field-label">Category</div>
              {isEditing && draft ? (
                <input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  className="chk-edit-input"
                />
              ) : (
                <strong>{selectedTask.category}</strong>
              )}
            </div>

            <div>
              <div className="chk-field-label">Duration</div>
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
                  className="chk-edit-input"
                />
              ) : (
                <strong>{selectedTask.duration}</strong>
              )}
            </div>

            <div>
              <div className="chk-field-label">Status</div>
              <strong>
                {isSelectedCompleted
                  ? "Completed"
                  : isSelectedCurrent
                    ? "Current Checkpoint"
                    : isSelectedLocked
                      ? "Upcoming"
                      : "Past"}
              </strong>
            </div>
          </div>

          <div className="chk-action-row">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="chk-btn chk-btn--primary"
                  onClick={saveEditing}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={16} className="chk-spin" />
                  ) : (
                    <Save size={16} />
                  )}{" "}
                  Save
                </button>
                <button
                  type="button"
                  className="chk-btn chk-btn--ghost"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <>
                {isSelectedEditable && (
                  <button
                    type="button"
                    className="chk-btn chk-btn--ghost"
                    onClick={startEditing}
                  >
                    <Pencil size={16} /> Edit checkpoint
                  </button>
                )}

                {isSelectedCurrent && !isSelectedCompleted && (
                  <button
                    type="button"
                    className="chk-btn chk-btn--primary"
                    onClick={onStartCheckpoint}
                    disabled={isGoalPaused}
                  >
                    Start Checkpoint →
                  </button>
                )}

                {isSelectedLocked && (
                  <div className="chk-locked-note">
                    <Lock size={13} />
                    Upcoming checkpoint. Start unlocks after earlier
                    checkpoints.
                  </div>
                )}

                {isSelectedCompleted && (
                  <div className="chk-done-note">
                    <Check size={14} strokeWidth={3} />
                    This checkpoint is complete
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>
        {CHECKPOINT_CALENDAR_STYLES}
      </style>
    </div>
  );
}

const CHECKPOINT_CALENDAR_STYLES = `
  .checkpoint-calendar-card {
    display: flex;
    align-items: stretch;
    gap: 20px;
    width: 100%;
    height: 100%;
    --chk-bg: #ffffff;
    --chk-surface: #f9fafb;
    --chk-border: #e5e7eb;
    --chk-text: #111827;
    --chk-text-muted: #6b7280;
    --chk-text-faint: #9ca3af;
    --chk-tile-bg: #f1faf6;
    --chk-accent: #f97316;
    --chk-accent-soft: rgba(249, 115, 22, 0.14);
    --chk-success: #10b981;
    --chk-success-soft: #dcfce7;
    --chk-success-text: #15803d;
    --chk-indigo: #6366f1;
    --chk-indigo-soft: #f5f6ff;
    --chk-indigo-text: #4338ca;
  }

  .checkpoint-calendar-card[data-theme="dark"] {
    --chk-bg: #16181d;
    --chk-surface: #1f2229;
    --chk-border: #2b2f38;
    --chk-text: #f3f4f6;
    --chk-text-muted: #a1a5ad;
    --chk-text-faint: #71767f;
    --chk-tile-bg: #1c1f26;
    --chk-accent: #f97316;
    --chk-accent-soft: rgba(249, 115, 22, 0.22);
    --chk-success: #22c55e;
    --chk-success-soft: rgba(34, 197, 94, 0.16);
    --chk-success-text: #4ade80;
    --chk-indigo: #818cf8;
    --chk-indigo-soft: rgba(99, 102, 241, 0.16);
    --chk-indigo-text: #a5b4fc;
  }

  .chk-pane {
    flex: 1.5;
    min-width: 0;
    min-height: 0;

    display: flex;
    flex-direction: column;

    padding: 24px;
    border-radius: 18px;

    background: var(--chk-bg);
    border: 1px solid var(--chk-border);

    overflow: hidden;
}
  .chk-pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .chk-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--chk-accent);
    text-transform: uppercase;
  }

  .chk-title {
    font-size: 19px;
    font-weight: 800;
    margin-top: 4px;
    color: var(--chk-text);
  }

  .chk-nav-btn {
    font-size: 12px;
    font-weight: 700;
    color: var(--chk-text-muted);
    background: var(--chk-surface);
    border: 1px solid var(--chk-border);
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .chk-nav-btn:hover {
    background: var(--chk-accent-soft);
    border-color: var(--chk-accent);
  }

  .chk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    align-content: start;
    padding-right: 2px;
    overflow: visible;
  }

  .chk-cell{
    aspect-ratio:1/1;
    border-radius:12px;

    background:var(--chk-tile-bg);

    border:1.5px solid transparent;

    box-sizing:border-box;

    cursor:pointer;

    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;

    position:relative;

    overflow:visible;

    isolation:isolate;



     will-change:border-color,background-color;

    transition:
        background-color .18s ease,
        border-color .18s ease,
        color .18s ease,
        transform .18s ease;
}
  .chk-cell:focus,
  .chk-cell:focus-visible {
    outline: none;
  }

  .chk-cell:hover{
    background:var(--chk-surface);

    border-color:var(--chk-border);

    box-shadow:0 6px 14px rgba(15,23,42,.08);

    z-index:4;
}
  .chk-cell:disabled {
    cursor: not-allowed;
  }

  .chk-cell-num {
    font-size: 13px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    color: inherit;
  }

  .chk-cell--completed {
    background: var(--chk-success-soft);
    color: var(--chk-success-text);
  }

  .chk-cell--current {

    background: var(--chk-accent);

    color:#fff;

    border:2px solid rgba(255,255,255,.12);

    box-shadow:none;

}

  .chk-cell--locked {
    opacity: 0.72;
    color: var(--chk-text-faint);
  }

 .chk-cell--selected{
    border-color:var(--chk-indigo);
    background:var(--chk-indigo-soft);
    color:var(--chk-indigo-text);

    position:relative;
    z-index:5;
}
  .chk-cell--selected .chk-cell-num {
    color: var(--chk-indigo-text);
  }
  .chk-cell--current.chk-cell--selected{
    background:var(--chk-accent);

    border-color:#ffffff;

    color:#ffffff;

    position:relative;
z-index:6;
}
  .chk-cell--current.chk-cell--selected .chk-cell-num {
    color: #fff;
  }

  .chk-cell-check {
    position: absolute;
    bottom: 5px;
    right: 5px;
    display: flex;
    color: var(--chk-success-text);
  }

  .chk-cell-lock {
    margin-top: 3px;
    display: flex;
  }

  .chk-cell-pulse {
    position: absolute;
    bottom: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffffff;
    animation: chk-pulse 1.6s ease-in-out infinite;
  }
  @keyframes chk-pulse {
    0%, 100% { opacity: 0.5; transform: scale(0.85); }
    50%      { opacity: 1;   transform: scale(1.15); }
  }

  /* RIGHT PANE */
  .chk-task-pane {
    flex: 1;
    min-width: 280px;
    max-width: 360px;
    height: 100%;
  }

  .chk-task-pane-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    padding: 18px;
    background: linear-gradient(180deg, var(--chk-bg), var(--chk-surface));
    border: 1px solid var(--chk-border);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    overflow-y: auto;
  }

  .chk-task-pane-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }

  .chk-task-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--chk-success);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chk-task-title {
    font-size: 18px;
    font-weight: 800;
    margin-top: 4px;
    color: var(--chk-text);
    line-height: 1.3;
  }

  .chk-task-desc {
    color: var(--chk-text-muted);
    line-height: 1.7;
    font-size: 13.5px;
    margin-bottom: 16px;
  }

  .chk-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    font-size: 13px;
    color: var(--chk-text);
  }

  .chk-field-label {
    color: var(--chk-text-faint);
    font-size: 10.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .chk-status-pill {
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
  }
  .chk-status-pill--done {
    background: var(--chk-success-soft);
    color: var(--chk-success-text);
  }
  .chk-status-pill--current {
    background: var(--chk-accent-soft);
    color: var(--chk-accent);
  }
  .chk-status-pill--locked {
    background: var(--chk-surface);
    color: var(--chk-text-muted);
  }

  .chk-ai-pill {
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

  .chk-edit-input {
    width: 100%;
    border: 1px solid var(--chk-border);
    border-radius: 10px;
    padding: 7px 9px;
    font-size: 13px;
    font-family: inherit;
    color: var(--chk-text);
    background: var(--chk-bg);
  }
  .chk-edit-title {
    font-size: 16px;
    font-weight: 800;
    margin-top: 5px;
  }
  .chk-edit-desc {
    margin-bottom: 14px;
    resize: vertical;
  }

  .chk-action-row {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 16px;
    flex-wrap: wrap;
  }

  .chk-btn {
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
  .chk-btn--primary {
    background: var(--chk-accent);
    color: white;
  }
  .chk-btn--ghost {
    background: var(--chk-surface);
    color: var(--chk-text);
    border: 1px solid var(--chk-border);
  }
  .chk-btn--ai {
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
  }
  .chk-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .chk-locked-note,
  .chk-done-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--chk-text-muted);
  }
  .chk-done-note {
    color: var(--chk-success-text);
  }

  .chk-spin {
    animation: chk-spin 0.8s linear infinite;
  }
  @keyframes chk-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* Loading skeleton */
  .chk-skel {
    background: linear-gradient(90deg, var(--chk-surface) 25%, var(--chk-border) 37%, var(--chk-surface) 63%);
    background-size: 400% 100%;
    animation: chk-shimmer 1.4s ease infinite;
    border-radius: 8px;
  }
  @keyframes chk-shimmer {
    0%   { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
  .chk-skel-header {
    height: 22px;
    width: 40%;
    margin-bottom: 16px;
  }
  .chk-skel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
    flex: 1;
  }
  .chk-skel-tile {
    aspect-ratio: 1 / 1;
    border-radius: 12px;
  }
  .chk-skel-line {
    height: 14px;
    margin-bottom: 12px;
  }

  .chk-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    text-align: center;
    gap: 6px;
    padding: 40px 20px;
  }
  .chk-empty-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--chk-text);
    margin: 0;
  }
  .chk-empty-sub {
    font-size: 13px;
    color: var(--chk-text-muted);
    margin: 0;
  }

  @media (max-width: 900px) {
    .checkpoint-calendar-card {
      flex-direction: column;
      height: auto !important;
      gap: 18px;
    }

    .chk-pane {
      flex: none;
      width: 100%;
      height: auto !important;
      min-height: 0;
    }

    .chk-pane-header {
      gap: 10px;
      margin-bottom: 16px;
    }

    .chk-title {
      font-size: 17px;
    }

    .chk-grid {
      flex: none;
      grid-auto-rows: minmax(44px, 1fr);
      gap: 5px;
      max-height: 260px;
    }

    .chk-cell {
      min-height: 42px;
      border-radius: 9px;
    }

    .chk-task-pane {
      width: 100%;
      max-width: none;
      min-width: 0;
      height: auto !important;
    }

    .chk-task-pane-inner {
      height: auto !important;
      min-height: 280px;
      padding: 16px;
      overflow: visible;
    }
  }

  @media (max-width: 360px) {
    .chk-grid {
      gap: 4px;
    }
    .chk-cell {
      min-height: 34px;
    }
    .chk-cell-num {
      font-size: 11px;
    }
  }
`;

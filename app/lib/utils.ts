/**
 * Calculates the current sprint day taking pause history into account.
 * Performs date-based (midnight to midnight) calculation to avoid strict 24-hour window errors.
 */
export function calculateCurrentSprintDay(
  startedAt: string | Date,
  pauseHistory: { paused_at: string | null; resumed_at: string | null }[],
  totalDays: number = 30,
  progressMode: "daily" | "checkpoint" = "daily",
  currentDay?: number,
): number {
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (progressMode === "checkpoint") {
    return currentDay ?? 1;
  }

  const calendarDaysElapsed = Math.round(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  let totalPausedDays = 0;
  for (const ph of pauseHistory ?? []) {
    if (ph.paused_at && ph.resumed_at) {
      const pStart = new Date(ph.paused_at);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = new Date(ph.resumed_at);
      pEnd.setHours(0, 0, 0, 0);
      const pausedMs = pEnd.getTime() - pStart.getTime();
      totalPausedDays += Math.round(pausedMs / (1000 * 60 * 60 * 24));
    }
  }

  const sprintDay = calendarDaysElapsed - totalPausedDays + 1;
  return Math.min(Math.max(sprintDay, 1), totalDays);
}

/** Local calendar date key (YYYY-MM-DD) for streak calculations. */
export function toLocalDateKey(date: string | Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Counts consecutive calendar days of engagement ending today (or yesterday
 * if the user has not engaged yet today).
 */
export function calculateCalendarStreak(
  activeDateKeys: string[],
  referenceDate: Date = new Date(),
): number {
  if (activeDateKeys.length === 0) return 0;

  const activeSet = new Set(activeDateKeys);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  let cursor = new Date(ref);
  if (!activeSet.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeSet.has(toLocalDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

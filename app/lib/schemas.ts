import { z } from 'zod';

/**
 * Zod schemas for Career Sprint state validation.
 * Ensures local storage data matches strict types to prevent dashboard corruption.
 */

export const completedDaysSchema = z.array(
  z.number().int().min(1).max(30)
);

export const moodHistorySchema = z.array(
  z.number().int().min(1).max(5)
);

export const sprintStateSchema = z.object({
  currentDay: z.number().int().min(1).max(30),
  completedDays: completedDaysSchema,
  streak: z.number().int().nonnegative(),
});

export type SprintState = z.infer<typeof sprintStateSchema>;

/**
 * Helper to safely parse local storage with Zod schema fallbacks.
 */
export function safeParseLocalStorage<T>(key: string, schema: z.ZodSchema<T>, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    
    // Parse JSON
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      console.warn(`Zod parse failure for key "${key}":`, result.error.format());
      return defaultValue;
    }
  } catch (err) {
    console.error(`Failed to parse local storage for key "${key}":`, err);
    return defaultValue;
  }
}

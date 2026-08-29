// app/api/utils.ts
//
// Uses ONE Groq API key for:
// 1. Sprint task generation
// 2. Sprint Agent replies
// 3. Reflection evaluation

import { Groq } from "groq-sdk";

import {
  TASK_GENERATOR_SYSTEM_PROMPT,
  SPRINT_AGENT_SYSTEM_PROMPT,
  REFLECTION_EVALUATOR_SYSTEM_PROMPT,
  VEYRA_COACH_SYSTEM_PROMPT,
} from "./system_prompts";

// ============================================================
// SINGLE GROQ CLIENT
// ============================================================

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function getGroqKey(): string | undefined {
  return process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
}

// ============================================================
// TYPES
// ============================================================

export interface SprintTaskInput {
  goalTitle: string;
  totalDays: number;
  selections?: Record<string, unknown>;
  userRole?: string;
  userExperience?: string;
  userGoal?: string;
  userUrgency?: string;
}

export interface GeneratedTask {
  day: number;
  title: string;
  description: string;
  duration: string;
  category: string;
}

export interface GenerateTasksResult {
  success: boolean;
  tasks?: GeneratedTask[];
  error?: string;
  raw?: string;
}

// ============================================================
// SPRINT TASK GENERATOR
// ============================================================

export async function generateSprintTasks(
  input: SprintTaskInput,
): Promise<GenerateTasksResult> {
  if (!getGroqKey()) {
    return {
      success: false,
      error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not set in environment variables.",
    };
  }

  if (!input.totalDays || input.totalDays < 1) {
    return {
      success: false,
      error: `Invalid totalDays: ${input.totalDays}. Must be a positive integer.`,
    };
  }

  const roleLabel = input.selections?.role_sub
    ? `${input.selections.role_sub} (${input.selections?.role ?? input.userRole})`
    : input.selections?.role || input.userRole || "Not specified";

  const userPrompt = `goal_title: ${input.goalTitle || "Land your next role"}
total_days: ${input.totalDays}

user_profile:
  target_role: ${roleLabel}
  role_specialisation: ${input.selections?.role_sub || "Not specified"}
  experience: ${input.selections?.experience || input.userExperience || "Not specified"}
  goal: ${input.selections?.goal || input.userGoal || "Not specified"}
  urgency: ${input.selections?.urgency || input.userUrgency || "Not specified"}
  time_period: ${input.selections?.time_period || "Not specified"}

instructions:
  - Every task must be hyper-specific to a ${roleLabel} career path
  - Tasks must progress logically from day 1 to day ${input.totalDays}
  - Each task should be completable in the stated duration
  - Be concrete — name real tools, platforms, and techniques used by ${roleLabel} professionals

Generate the full sprint plan now as a strict JSON object matching exactly this shape:
{"tasks": [...]}

The "tasks" array must contain exactly ${input.totalDays} task objects.

Each task must contain only:
day,
title,
description,
duration,
category.

Do not include any other fields or top-level keys.`;

  let fullOutput = "";
  const groq = getGroqClient();
  if (!groq) {
    return { success: false, error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not configured." };
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: TASK_GENERATOR_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 1,
      max_completion_tokens: Math.min(
        10000,
        1200 + input.totalDays * 95,
      ),
      top_p: 1,
      stream: true,
      stop: null,
      response_format: {
        type: "json_object",
      },
    });

    for await (const chunk of chatCompletion) {
      const piece =
        chunk.choices[0]?.delta?.content || "";

      fullOutput += piece;

      process.stdout.write(piece);
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err);

    console.error(
      "Groq task generator failed:",
      message,
    );

    return {
      success: false,
      error: `Groq API call failed: ${message}`,
    };
  }

  try {
    let cleaned = fullOutput.trim();

    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(json)?\n?/, "")
        .replace(/```$/, "")
        .trim();
    }

    let parsed: any = JSON.parse(cleaned);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      if (Array.isArray(parsed.tasks)) {
        parsed = parsed.tasks;
      } else if (Array.isArray(parsed.days)) {
        parsed = parsed.days;
      } else if (Array.isArray(parsed.plan)) {
        parsed = parsed.plan;
      } else if (Array.isArray(parsed.sprint_tasks)) {
        parsed = parsed.sprint_tasks;
      } else if (Array.isArray(parsed.sprint_plan)) {
        parsed = parsed.sprint_plan;
      }
    }

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error:
          "Model output was valid JSON but not an array.",
        raw: fullOutput,
      };
    }

    const isValidShape = parsed.every(
      (task: any) =>
        typeof task.day === "number" &&
        typeof task.title === "string" &&
        typeof task.description === "string" &&
        typeof task.duration === "string" &&
        typeof task.category === "string",
    );

    if (!isValidShape) {
      return {
        success: false,
        error:
          "One or more task objects are missing required fields.",
        raw: fullOutput,
      };
    }

    if (parsed.length < input.totalDays) {
      return {
        success: false,
        error: `Expected ${input.totalDays} tasks but got ${parsed.length}.`,
        raw: fullOutput,
      };
    }

    if (parsed.length > input.totalDays) {
      parsed = parsed.slice(0, input.totalDays);
    }

    return {
      success: true,
      tasks: parsed as GeneratedTask[],
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err);

    console.error(
      "Failed to parse Groq output:",
      message,
    );

    return {
      success: false,
      error: `Failed to parse model output as JSON: ${message}`,
      raw: fullOutput,
    };
  }
}

// ============================================================
// SPRINT AGENT
// ============================================================

export interface SprintAgentInput {
  todayDayNumber: number;
  totalDays: number;
  taskTitle: string;
  taskDescription: string;
  taskCategory: string;
  taskDuration: string;
  userMessage: string;
  userRole?: string;
  userExperience?: string;
  userGoal?: string;
  conversationHistory?: Array<{ sender: "ai" | "user"; text: string }>;
}

export interface SprintAgentReply {
  reply: string;
  day_reference: number;
}

export interface GenerateAgentReplyResult {
  success: boolean;
  data?: SprintAgentReply;
  error?: string;
  raw?: string;
}

export async function generateSprintAgentReply(
  input: SprintAgentInput,
): Promise<GenerateAgentReplyResult> {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return { success: false, error: "The AI coach is not configured. Add GROQ_API_KEY_1 to the deployment environment." };
  }

  if (!input.userMessage?.trim()) {
    return { success: false, error: "userMessage is required." };
  }

  const history = (input.conversationHistory || []).slice(-10).map((m) => ({
    role: m.sender === "user" ? "user" as const : "assistant" as const,
    content: m.text,
  }));

  const context = `Learner context:
- Target role: ${input.userRole || "Not specified"}
- Experience: ${input.userExperience || "Not specified"}
- Main goal: ${input.userGoal || "Not specified"}
- Current day: ${input.todayDayNumber}/${input.totalDays}
- Current task: ${input.taskTitle || "Not specified"}
- Task details: ${input.taskDescription || "Not specified"}
- Category: ${input.taskCategory || "Not specified"}
- Expected time: ${input.taskDuration || "Not specified"}`;

  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b",
      temperature: 0.55,
      max_completion_tokens: 900,
      top_p: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: VEYRA_COACH_SYSTEM_PROMPT },
        { role: "user", content: context },
        ...history,
        { role: "user", content: input.userMessage.trim() },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    if (!raw) return { success: false, error: "The AI coach returned an empty response." };

    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
    } catch {
      // Some model/provider combinations may return plain text despite JSON mode.
      parsed = { reply: raw };
    }

    const reply = typeof parsed?.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return { success: false, error: "The AI coach returned an invalid response." };

    return {
      success: true,
      data: { reply, day_reference: input.todayDayNumber },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Veyra AI coach failed:", message);
    return { success: false, error: `AI coach request failed: ${message}` };
  }
}

// ============================================================
// REFLECTION EVALUATOR
// ============================================================

export interface ReflectionEvalInput {
  taskTitle: string;
  taskDescription: string;
  reflection1: string;
  reflection2: string;
}

export interface ReflectionEvalResult {
  success: boolean;
  ai_generated?: boolean;
  sufficient_effort?: boolean;
  reasoning?: string;
  error?: string;
  raw?: string;
}

export async function evaluateReflection(
  input: ReflectionEvalInput,
): Promise<ReflectionEvalResult> {
  if (!getGroqKey()) {
    return {
      success: false,
      error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not set.",
    };
  }

  const userPrompt = `task_title: ${input.taskTitle}
task_description: ${input.taskDescription}

reflection_1 (what did you actually do today?):
${input.reflection1}

reflection_2 (what will you do differently tomorrow?):
${input.reflection2}

Evaluate this reflection now as a strict JSON object.`;

  let fullOutput = "";
  const groq = getGroqClient();
  if (!groq) {
    return { success: false, error: "GROQ_API_KEY_1 (or GROQ_API_KEY) is not configured." };
  }

  try {
    const chatCompletion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              REFLECTION_EVALUATOR_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "openai/gpt-oss-20b",
        temperature: 0.3,
        max_completion_tokens: 300,
        top_p: 1,
        stream: true,
        stop: null,
        response_format: {
          type: "json_object",
        },
      });

    for await (const chunk of chatCompletion) {
      fullOutput +=
        chunk.choices[0]?.delta?.content || "";
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err);

    return {
      success: false,
      error: `Groq call failed: ${message}`,
    };
  }

  try {
    let cleaned = fullOutput.trim();

    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(json)?\n?/, "")
        .replace(/```$/, "")
        .trim();
    }

    const parsed: any =
      JSON.parse(cleaned);

    if (
      typeof parsed.ai_generated !== "boolean" ||
      typeof parsed.sufficient_effort !== "boolean"
    ) {
      return {
        success: false,
        error:
          "Missing required boolean fields.",
        raw: fullOutput,
      };
    }

    return {
      success: true,
      ai_generated: parsed.ai_generated,
      sufficient_effort:
        parsed.sufficient_effort,
      reasoning:
        typeof parsed.reasoning === "string"
          ? parsed.reasoning
          : "",
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : String(err);

    return {
      success: false,
      error: `Failed to parse: ${message}`,
      raw: fullOutput,
    };
  }
}
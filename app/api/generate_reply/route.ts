import { requireUser } from "@/app/lib/requireUser";
// app/api/generate_reply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateSprintAgentReply } from "../utils";

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (!user) {
    return NextResponse.json({ success: false, error: authError?.message || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      todayDayNumber,
      totalDays,
      taskTitle,
      taskDescription,
      taskCategory,
      taskDuration,
      userMessage,
      userRole,
      userExperience,
      userGoal,
      conversationHistory,
    } = body;

    if (!todayDayNumber || typeof todayDayNumber !== "number" || todayDayNumber < 1) {
      return NextResponse.json(
        { success: false, error: "todayDayNumber is required and must be a positive number." },
        { status: 400 },
      );
    }

    if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
      return NextResponse.json(
        { success: false, error: "userMessage is required." },
        { status: 400 },
      );
    }

    const result = await generateSprintAgentReply({
      todayDayNumber,
      totalDays: totalDays ?? 30,
      taskTitle: taskTitle ?? "",
      taskDescription: taskDescription ?? "",
      taskCategory: taskCategory ?? "",
      taskDuration: taskDuration ?? "",
      userMessage,
      userRole: userRole ?? "",
      userExperience: userExperience ?? "",
      userGoal: userGoal ?? "",
      conversationHistory: Array.isArray(conversationHistory)
        ? conversationHistory.filter((m: any) => m && (m.sender === "ai" || m.sender === "user") && typeof m.text === "string").slice(-8)
        : [],
    });

    if (!result.success) {
      // Generation failed (API error, bad JSON, shape mismatch, etc.)
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate_reply route error:", message);
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 },
    );
  }
}

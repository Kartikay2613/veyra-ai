import { requireUser } from "@/app/lib/requireUser";
// app/api/generate_tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateSprintTasks } from "../utils";

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (!user) {
    return NextResponse.json({ success: false, error: authError?.message || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goalTitle, totalDays, selections } = body;

    if (!totalDays || typeof totalDays !== "number" || totalDays < 1) {
      return NextResponse.json(
        { success: false, error: "totalDays is required and must be a positive number." },
        { status: 400 },
      );
    }

    // Extract user profile from onboarding selections
    const sel = selections ?? {};
    const userRole = sel.role || "";
    const userExperience = sel.experience || "";
    const userGoal = sel.goal || "";
    const userUrgency = sel.urgency || "";

    const result = await generateSprintTasks({
      goalTitle: goalTitle ?? "",
      totalDays,
      selections: sel,
      userRole,
      userExperience,
      userGoal,
      userUrgency,
    });

    if (!result.success) {
      // Generation failed (API error, bad JSON, shape mismatch, etc.)
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate_tasks route error:", message);
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 },
    );
  }
}

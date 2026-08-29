import { NextRequest, NextResponse } from "next/server";
import { evaluateReflection } from "../utils";
import { requireUser } from "@/app/lib/requireUser";

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (!user) {
    return NextResponse.json({ success: false, error: authError?.message || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskTitle, taskDescription, reflection1, reflection2 } = body;

    if (!reflection1 || !reflection2) {
      return NextResponse.json(
        { success: false, error: "reflection1 and reflection2 are required." },
        { status: 400 },
      );
    }

    const result = await evaluateReflection({
      taskTitle: taskTitle ?? "",
      taskDescription: taskDescription ?? "",
      reflection1,
      reflection2,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 },
    );
  }
}

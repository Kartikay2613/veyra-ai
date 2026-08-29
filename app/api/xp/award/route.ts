import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/lib/requireUser";
import { createClient } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (!user) return NextResponse.json({ success: false, error: error?.message || "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const amount = Math.max(1, Math.min(500, Number(body?.amount) || 0));
    const source = typeof body?.source === "string" ? body.source.trim().slice(0, 120) : "";
    const itemId = typeof body?.itemId === "string" ? body.itemId : null;
    if (!amount || !source) return NextResponse.json({ success: false, error: "XP amount and a unique source are required." }, { status: 400 });

    const client = await createClient();
    const { data, error: rpcError } = await client.rpc("award_veyra_xp", {
      p_amount: amount,
      p_source: source,
      p_item_id: itemId,
    });

    if (rpcError) {
      console.error("XP RPC failed:", rpcError);
      return NextResponse.json({
        success: false,
        error: "XP could not be saved. Run supabase/final_learning_schema.sql in Supabase SQL Editor and redeploy.",
      }, { status: 503 });
    }

    return NextResponse.json({ success: true, awarded: amount, totalXp: typeof data === "number" ? data : 0 });
  } catch (e) {
    console.error("XP award failed:", e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "XP could not be awarded." }, { status: 500 });
  }
}

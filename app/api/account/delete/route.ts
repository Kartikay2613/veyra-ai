import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: "Account deletion is not configured on the server. Add SUPABASE_SERVICE_ROLE_KEY to Vercel." },
      { status: 500 },
    );
  }

  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: paths, error: pathReadError } = await admin
      .from("learning_paths")
      .select("id")
      .eq("user_id", user.id);
    if (pathReadError) throw pathReadError;

    const pathIds = (paths ?? []).map((path) => path.id);
    if (pathIds.length) {
      const { data: items, error: itemReadError } = await admin
        .from("learning_path_items")
        .select("id")
        .in("path_id", pathIds);
      if (itemReadError) throw itemReadError;

      const itemIds = (items ?? []).map((item) => item.id);
      if (itemIds.length) {
        const { error } = await admin.from("learning_progress").delete().in("path_item_id", itemIds);
        if (error) throw error;
      }

      const { error: itemDeleteError } = await admin.from("learning_path_items").delete().in("path_id", pathIds);
      if (itemDeleteError) throw itemDeleteError;

      const { error: pathDeleteError } = await admin.from("learning_paths").delete().in("id", pathIds);
      if (pathDeleteError) throw pathDeleteError;
    }

    for (const [table, column] of [
      ["learning_goals", "user_id"],
      ["user_skills", "user_id"],
      ["learning_progress", "user_id"],
      ["learner_profiles", "user_id"],
      ["profiles", "id"],
    ] as const) {
      const { error } = await admin.from(table).delete().eq(column, user.id);
      if (error && !/does not exist|schema cache/i.test(error.message)) throw error;
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) throw deleteAuthError;

    const response = NextResponse.json({ success: true });
    response.cookies.set("veyra-theme", "dark", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete the account." },
      { status: 500 },
    );
  }
}

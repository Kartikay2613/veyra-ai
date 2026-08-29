import { createClient } from "@/app/lib/supabase";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, error: error ?? new Error("Unauthorized") };
  return { supabase, user, error: null };
}

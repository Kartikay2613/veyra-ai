"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/lib/AuthContext";
import { supabase } from "@/app/lib/supabase-client";

export default function TimezoneSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Direct update — no select first, no condition
    supabase
      .from("profiles")
      .update({ timezone })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.error("TimezoneSync failed:", error.message);
        else console.log("TimezoneSync: saved", timezone);
      });

  }, [user?.id]);

  return null;
}
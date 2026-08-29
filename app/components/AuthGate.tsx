"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/AuthContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?mode=login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="auth-gate" aria-live="polite">
        <div className="auth-gate-mark">V</div>
        <div className="auth-gate-line" />
        <p>{slow ? "Your session is taking longer than usual…" : "Opening your Learning OS…"}</p>
        {slow && (
          <button type="button" className="ghost-btn" onClick={() => router.replace("/auth?mode=login")}>
            Continue to login
          </button>
        )}
      </main>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep production UI calm while still allowing browser/Vercel logs to capture the failure.
  }, []);

  return (
    <main className="app-error-page">
      <span className="section-kicker">VEYRA AI · RECOVERY</span>
      <h1>Something interrupted your path.</h1>
      <p>The workspace hit an unexpected error. Try again or return to your dashboard.</p>
      <div className="app-error-actions">
        <button onClick={reset}>Try again</button>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    </main>
  );
}

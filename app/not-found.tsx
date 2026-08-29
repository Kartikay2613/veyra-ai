import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-error-page">
      <span className="section-kicker">404 · VEYRA AI</span>
      <h1>That path does not exist.</h1>
      <p>The page you requested is no longer part of the current learning workspace.</p>
      <div className="app-error-actions">
        <Link href="/">Back home</Link>
        <Link href="/dashboard">Open dashboard</Link>
      </div>
    </main>
  );
}

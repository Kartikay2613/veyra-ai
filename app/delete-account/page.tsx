"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/AuthContext";
import Logo from "@/app/components/Logo";

export default function DeleteAccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirmed = value === "DELETE ACCOUNT";

  async function deleteData() {
    if (!user || !confirmed || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not delete your account.");
      }

      await signOut();
      router.replace("/");
    } catch (err) {
      console.error("Account deletion failed:", err);
      setError(err instanceof Error ? err.message : "Could not delete your account. Please contact support.");
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="legal-page">
        <nav className="simple-nav">
          <div className="nav-inner">
            <Logo theme="light" />
            <Link href="/auth?mode=login" className="back-btn">
              <ArrowLeft size={16} /> Sign in
            </Link>
          </div>
        </nav>
        <main className="legal-main">
          <section className="legal-content">
            <h1 className="title">Sign in required</h1>
            <p className="subtitle">
              Sign in before opening the account deletion controls.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="legal-page">
      <nav className="simple-nav">
        <div className="nav-inner">
          <Logo theme="light" />
          <Link href="/settings" className="back-btn">
            <ArrowLeft size={16} /> Back to settings
          </Link>
        </div>
      </nav>

      <main className="legal-main">
        <header className="page-header">
          <span className="badge badge--danger">Danger Zone</span>
          <h1 className="title">Delete account data</h1>
          <p className="subtitle">
            Permanently remove your Veyra AI learning workspace.
          </p>
        </header>

        <section className="legal-content">
          <div className="danger-container">
            <div className="warning-card">
              <div className="warning-icon-wrap">
                <ShieldAlert size={24} color="#ef4444" />
              </div>
              <h3>This action cannot be undone.</h3>
              <p>
                This permanently removes your Veyra learning data and deletes the
                Supabase authentication account. You will be signed out immediately.
              </p>
              <ul>
                <li>Active and archived learning goals</li>
                <li>AI-generated learning paths and milestones</li>
                <li>Learning progress and skill records</li>
                <li>Profile and personalization data</li>
              </ul>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <label className="delete-confirm-label">
              Type <strong>DELETE ACCOUNT</strong> to confirm
              <input
                value={value}
                onChange={(event) => setValue(event.target.value.toUpperCase())}
                placeholder="DELETE ACCOUNT"
                disabled={busy}
                autoComplete="off"
              />
            </label>

            <div className="delete-actions">
              <Link href="/settings" className="settings-primary ghost">
                Cancel
              </Link>
              <button
                className="danger-btn"
                onClick={() => void deleteData()}
                disabled={!confirmed || busy}
              >
                {busy ? (
                  "Deleting…"
                ) : (
                  <>
                    <Trash2 size={15} /> Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="delete-note">
            <CheckCircle2 size={15} />
            <span>
              Your application data and Supabase authentication account are removed
              together. This action cannot be reversed.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

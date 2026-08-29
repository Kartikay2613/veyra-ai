"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase-client";
import Logo from "@/app/components/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. Your account is secure again.");
    window.setTimeout(() => router.replace("/dashboard"), 1000);
  }

  return (
    <main className="auth-new reset-password-page">
      <div className="auth-brand">
        <Logo theme="light" onClick={() => router.replace("/")} />
        <div className="auth-brand-copy">
          <div className="section-kicker"><CheckCircle2 size={13} /> ACCOUNT SECURITY</div>
          <h1>Set a new <i>password.</i></h1>
          <p>Choose a strong password and continue back to your Veyra learning workspace.</p>
        </div>
        <small>Secure authentication · Your learning profile stays private</small>
      </div>
      <section className="auth-panel">
        <div className="auth-panel-top"><span className="auth-mini"><LockKeyhole size={14} /> PASSWORD RESET</span><ShieldCheck size={14} /></div>
        <div className="auth-box">
          {!ready ? (
            <>
              <h2>Reset link required.</h2>
              <p>Open the password reset email again, then return to this page.</p>
              <button className="auth-submit" type="button" onClick={() => router.replace("/auth?mode=login")}>Back to login <ArrowRight size={16} /></button>
            </>
          ) : (
            <form onSubmit={updatePassword}>
              <h2>Create your new password.</h2>
              <p>Use at least 6 characters. You can change it again from your account later.</p>
              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-notice">{message}</div>}
              <label>New password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
              <label>Confirm password<input required minLength={6} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label>
              <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Updating…" : "Update password"}<ArrowRight size={16} /></button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

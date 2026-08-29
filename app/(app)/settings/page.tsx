"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  LogOut,
  Mail,
  Moon,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth, type Theme } from "@/app/lib/AuthContext";
import { supabase } from "@/app/lib/supabase-client";

export default function SettingsPage() {
  const { user, profile, theme, setTheme, signOut, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [logoutSaving, setLogoutSaving] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@veyra.ai";
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

  useEffect(() => {
    setName(profile?.name || "");
  }, [profile?.name]);

  async function chooseTheme(next: Theme) {
    if (next === theme || themeSaving) return;
    setThemeSaving(true);
    setMessage("");
    const ok = await setTheme(next);
    setThemeSaving(false);
    if (!ok) setMessage("Theme could not be saved. Please try again.");
  }

  async function saveProfile() {
    if (!user?.id) return;

    setSaving(true);
    setSaved(false);
    setMessage("");

    const cleanName = name.trim() || "Learner";
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: cleanName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    setSaving(false);

    if (error) {
      setMessage(error.message || "Profile could not be saved.");
      return;
    }

    await refreshProfile();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  async function changePassword() {
    setMessage("");
    setPasswordSaved(false);
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);

    if (error) {
      setMessage(error.message || "Password could not be updated.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    window.setTimeout(() => setPasswordSaved(false), 2500);
  }

  async function handleSignOut() {
    if (logoutSaving) return;
    setLogoutSaving(true);
    setMessage("");
    try {
      await signOut();
    } catch (error) {
      setLogoutSaving(false);
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-head">
        <div>
          <span className="settings-kicker">
            <UserRound size={14} /> ACCOUNT CONTROL
          </span>
          <h1>Your workspace, your rules.</h1>
          <p>
            Manage your identity, appearance, learning preferences, privacy,
            and support from one place.
          </p>
        </div>
        <Link href="/dashboard" className="settings-back">
          Back to Dashboard <ChevronRight size={15} />
        </Link>
      </div>

      {message && <div className="settings-message">{message}</div>}

      <section className="settings-grid">
        <div className="settings-card settings-profile-card">
          <div className="settings-card-title">
            <div className="settings-icon"><UserRound size={18} /></div>
            <div>
              <h2>Profile</h2>
              <p>How Veyra AI knows you.</p>
            </div>
          </div>

          <label>
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </label>

          <label>
            Email address
            <input value={user?.email || ""} disabled />
          </label>

          <button className="settings-primary" onClick={saveProfile} disabled={saving}>
            {saved ? <><Check size={15} /> Saved</> : saving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <div className="settings-card appearance-card">
          <div className="settings-card-title">
            <div className="settings-icon"><Sun size={18} /></div>
            <div>
              <h2>Appearance</h2>
              <p>Choose exactly how your Learning OS looks.</p>
            </div>
          </div>

          <div className="theme-choice-grid">
            <button
              type="button"
              className={`theme-choice ${theme === "dark" ? "selected" : ""}`}
              onClick={() => void chooseTheme("dark")}
              disabled={themeSaving}
              aria-pressed={theme === "dark"}
            >
              <span className="theme-choice-icon"><Moon size={17} /></span>
              <span><b>Dark theme</b><small>Focused, low-glare workspace</small></span>
              {theme === "dark" && <Check size={16} className="theme-choice-check" />}
            </button>

            <button
              type="button"
              className={`theme-choice ${theme === "light" ? "selected" : ""}`}
              onClick={() => void chooseTheme("light")}
              disabled={themeSaving}
              aria-pressed={theme === "light"}
            >
              <span className="theme-choice-icon"><Sun size={17} /></span>
              <span><b>Light theme</b><small>Bright, high-clarity workspace</small></span>
              {theme === "light" && <Check size={16} className="theme-choice-check" />}
            </button>
          </div>
          <small className="settings-note">
            Your choice is saved to your account and restored on your next login.
          </small>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">
            <div className="settings-icon"><ShieldCheck size={18} /></div>
            <div>
              <h2>Account security</h2>
              <p>Update the password used to sign in.</p>
            </div>
          </div>
          <label>
            New password
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
            />
          </label>
          <button className="settings-primary" onClick={() => void changePassword()} disabled={passwordSaving || !password || !confirmPassword}>
            {passwordSaved ? <><Check size={15} /> Password updated</> : passwordSaving ? "Updating…" : "Update password"}
          </button>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">
            <div className="settings-icon"><Bell size={18} /></div>
            <div>
              <h2>Learning preferences</h2>
              <p>Adaptive signals are always on.</p>
            </div>
          </div>
          <div className="settings-points">
            <span><Check size={14} /> Progress feeds recommendations</span>
            <span><Check size={14} /> Assessments can reorder your path</span>
            <span><Check size={14} /> Feedback is used as learning context</span>
          </div>
          <Link href="/onboarding?new=1" className="setting-link">
            Rebuild my learning profile <ChevronRight size={15} />
          </Link>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">
            <div className="settings-icon"><ShieldCheck size={18} /></div>
            <div>
              <h2>Privacy & safety</h2>
              <p>Your learning data stays tied to your account.</p>
            </div>
          </div>
          <div className="settings-points">
            <span><Check size={14} /> Private goals and reflections</span>
            <span><Check size={14} /> Anonymous leaderboard identity</span>
            <span><Check size={14} /> Secure Supabase authentication</span>
          </div>
          <div className="settings-links">
            <Link href="/privacy">Privacy policy <ChevronRight size={14} /></Link>
            <Link href="/terms">Terms of use <ChevronRight size={14} /></Link>
          </div>
        </div>

        <div className="settings-card support-settings">
          <div className="settings-card-title">
            <div className="settings-icon orange"><CircleHelp size={18} /></div>
            <div>
              <h2>Need a human?</h2>
              <p>Get help without leaving your workspace.</p>
            </div>
          </div>
          <div className="support-contacts">
            <a href={`mailto:${supportEmail}`}><Mail size={15} /><span>{supportEmail}</span></a>
            {supportPhone ? (
              <a href={`tel:${supportPhone}`}><Phone size={15} /><span>{supportPhone}</span></a>
            ) : (
              <span className="phone-placeholder"><Phone size={15} /> Support phone not configured</span>
            )}
          </div>
          <Link href="/support" className="settings-primary ghost">
            Open Support Center <ChevronRight size={15} />
          </Link>
        </div>

        <div className="settings-card danger-card">
          <div>
            <h2>Sign out</h2>
            <p>End this session on this device. You can sign back in anytime.</p>
          </div>
          <button className="danger-btn" onClick={() => void handleSignOut()} disabled={logoutSaving}>
            <LogOut size={15} /> {logoutSaving ? "Signing out…" : "Sign out"}
          </button>
        </div>

        <div className="settings-card settings-delete-card">
          <div className="settings-card-title">
            <div className="settings-icon danger"><ShieldAlert size={18} /></div>
            <div>
              <h2>Delete account data</h2>
              <p>Permanently remove your Veyra AI learning data.</p>
            </div>
          </div>
          <p className="settings-delete-copy">
            This removes your goals, learning paths, progress, skills and profile data.
            The authentication account is removed as part of the confirmed deletion flow.
          </p>
          <Link href="/delete-account" className="danger-outline">
            <Trash2 size={15} /> Review deletion
          </Link>
        </div>
      </section>
    </main>
  );
}

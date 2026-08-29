"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";
import Logo from "@/app/components/Logo";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "login") {
      setMode("login");
    }

  }, [authLoading, user, router]);

  // ---------------------------------------------------------
  // GOOGLE SIGN IN
  // ---------------------------------------------------------

  async function google() {
    setLoading(true);
    setError("");
    setNotice("");
    setResetSent(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Google sign-in failed."
      );

      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // EMAIL LOGIN / SIGNUP
  // ---------------------------------------------------------

  async function forgotPassword() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      setNotice("Password reset instructions have been sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset instructions.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setNotice("");
    setResetSent(false);

    try {
      // =====================================================
      // SIGN UP
      // =====================================================

      if (mode === "signup") {
        const displayName =
          name.trim() || email.split("@")[0];

        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: displayName,
              },
            },
          });

        if (error) {
          throw error;
        }

        // Email confirmation enabled in Supabase
        if (!data.session || !data.user) {
          setNotice(
            "Account created. Check your email to verify your address, then log in."
          );

          setMode("login");
          setLoading(false);
          return;
        }

        // AuthContext receives the auth event and hydrates the profile/theme in the background.
        // Do not block navigation on a second profile round-trip.

        // Both authentication methods land on the same dashboard.
        // New users can start onboarding from the dashboard empty state.
        router.replace("/dashboard");
        return;
      }

      // =====================================================
      // LOGIN
      // =====================================================

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Unable to restore your account session."
        );
      }

      // AuthContext owns profile/theme hydration via the auth event.
      // Do not block navigation on a second auth/profile round-trip.
      // Every successful authentication method has exactly one app destination.
      router.replace("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <main className="auth-new">
      {/* =====================================================
          LEFT BRAND PANEL
      ====================================================== */}

      <div className="auth-brand">
        <Logo
          theme="light"
          onClick={() => router.replace("/")}
        />

        <div className="auth-brand-copy">
          <div className="section-kicker">
            <Sparkles size={13} />
            VEYRA AI
          </div>

          <h1>
            Learn with a path
            <br />
            <i>built around you.</i>
          </h1>

          <p>
            Your goals become the destination. Your skills
            become the starting point. AI builds the route
            between them.
          </p>

          <div className="auth-proof">
            <span>
              <CheckCircle2 />
              Personalized sequence
            </span>

            <span>
              <CheckCircle2 />
              Skill-gap intelligence
            </span>

            <span>
              <CheckCircle2 />
              Adaptive feedback loop
            </span>
          </div>
        </div>

        <small>
          Private learning profile · Designed for focused
          progress
        </small>
      </div>

      {/* =====================================================
          AUTH PANEL
      ====================================================== */}

      <section className="auth-panel">
        <div className="auth-panel-top">
          <span className="auth-mini">
            <BrainCircuit size={14} />
            LEARNING OS
          </span>

          <LockKeyhole size={14} />
        </div>

        <div className="auth-box">
          {/* =================================================
              LOGIN / SIGNUP SWITCH
          ================================================== */}

          <div className="auth-switch">
            <button
              type="button"
              className={mode === "signup" ? "on" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setNotice("");
                setResetSent(false);
              }}
            >
              Create account
            </button>

            <button
              type="button"
              className={mode === "login" ? "on" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setNotice("");
                setResetSent(false);
              }}
            >
              Log in
            </button>
          </div>

          {/* =================================================
              HEADING
          ================================================== */}

          <h2>
            {mode === "signup"
              ? "Build your personalized path."
              : "Welcome back to your path."}
          </h2>

          <p>
            {mode === "signup"
              ? "Start with your goal. We’ll handle the sequence."
              : "Continue where your learning signals left off."}
          </p>

          {/* =================================================
              GOOGLE BUTTON
          ================================================== */}

          <button
            type="button"
            className="google-auth"
            onClick={google}
            disabled={loading}
          >
            {/* Google G — avoids lucide Chrome export issue */}
            <span
              aria-hidden="true"
              style={{
                fontWeight: 700,
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              G
            </span>

            <span>Continue with Google</span>

            <span>↗</span>
          </button>

          {/* =================================================
              DIVIDER
          ================================================== */}

          <div className="auth-or">
            <i />
            <span>or use email</span>
            <i />
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* =================================================
              NOTICE
          ================================================== */}

          {notice && (
            <div className="auth-notice">
              {notice}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================== */}

          <form onSubmit={submit}>
            {/* NAME — SIGNUP ONLY */}

            {mode === "signup" && (
              <label>
                Name

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="What should we call you?"
                  autoComplete="name"
                />
              </label>
            )}

            {/* EMAIL */}

            <label>
              Email

              <input
                required
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {/* PASSWORD */}

            <label>
              Password

              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
                autoComplete={
                  mode === "signup"
                    ? "new-password"
                    : "current-password"
                }
              />
            </label>

            {mode === "login" && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => void forgotPassword()}
                disabled={loading || resetSent}
              >
                {resetSent ? "Reset email sent" : "Forgot password?"}
              </button>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Opening your workspace…"
                : mode === "signup"
                  ? "Start my learning profile"
                  : "Continue learning"}

              {!loading && (
                <ArrowRight size={16} />
              )}
            </button>
          </form>

          {/* =================================================
              SECURITY NOTE
          ================================================== */}

          <small className="auth-legal">
            <ShieldCheck size={12} />
            Secure authentication · Your learning profile
            stays private
          </small>
        </div>
      </section>
    </main>
  );
}
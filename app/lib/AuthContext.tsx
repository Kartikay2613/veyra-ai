"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase-client";

export type Theme = "light" | "dark";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  activeGoal: any | null;
  loading: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEFAULT_THEME: Theme = "dark";

function normalizeTheme(value: unknown): Theme {
  return value === "light" ? "light" : "dark";
}

function persistThemeCookie(theme: Theme) {
  if (typeof document === "undefined") return;
  document.cookie = `veyra-theme=${theme}; Max-Age=31536000; Path=/; SameSite=Lax`;
  try { window.localStorage.setItem("veyra-last-theme", theme); } catch {}
}

function getCachedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem("veyra-last-theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme, remember = true) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  if (remember) persistThemeCookie(theme);
  else document.documentElement.setAttribute("data-theme", theme);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [activeGoal, setActiveGoal] = useState<any | null>(null);
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setActiveGoal(null);
      setThemeState(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME, false);
      return;
    }

    try {
      const [profileResult, goalResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
        supabase.from("learning_goals").select("*").eq("user_id", currentUser.id)
          .eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      let profileData = profileResult.data;
      if (profileResult.error) console.error("Failed to load profile:", profileResult.error);
      if (goalResult.error) console.error("Failed to load active goal:", goalResult.error);

      if (!profileData && !profileResult.error) {
        const fallbackName =
          (typeof currentUser.user_metadata?.name === "string" && currentUser.user_metadata.name.trim()) ||
          currentUser.email?.split("@")[0] || "Learner";

        const { data: createdProfile, error: createProfileError } = await supabase
          .from("profiles")
          .upsert({ id: currentUser.id, email: currentUser.email, name: fallbackName, theme: DEFAULT_THEME },
            { onConflict: "id" }).select("*").single();

        if (createProfileError) console.error("Failed to create missing profile:", createProfileError);
        else profileData = createdProfile;
      }

      const goalData = goalResult.data;
      const nextTheme = normalizeTheme(profileData?.theme);
      setProfile(profileData ?? null);
      setActiveGoal(goalData ?? null);
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    } catch (error) {
      console.error("Failed to load user data:", error);
      setProfile(null);
      setActiveGoal(null);
      setThemeState(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME, false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setProfile(null);
      setActiveGoal(null);
      setThemeState(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME, false);
      return;
    }
    await loadUserData(data.user);
  }, [loadUserData]);

  const setTheme = useCallback(
    async (nextTheme: Theme) => {
      const next = normalizeTheme(nextTheme);
      const previous = theme;

      setThemeState(next);
      applyTheme(next);

      if (!user?.id) return true;

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            theme: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: false },
        );

      if (error) {
        console.error("Failed to save theme:", error);
        setThemeState(previous);
        applyTheme(previous);
        return false;
      }

      setProfile((current: any) => (current ? { ...current, theme: next } : current));
      return true;
    },
    [theme, user?.id],
  );

  useEffect(() => {
    let mounted = true;

    // The server layout has already selected the correct theme from the cookie.
    // Keep that value during hydration so a saved light theme never flashes dark.
    const serverTheme = normalizeTheme(document.documentElement.getAttribute("data-theme"));
    setThemeState(serverTheme);
    applyTheme(serverTheme, false);

    const initialise = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Failed to restore session:", error);
        if (!mounted) return;

        const restoredSession = data.session ?? null;
        const restoredUser = restoredSession?.user ?? null;
        setSession(restoredSession);
        setUser(restoredUser);

        // Restore the last authenticated appearance instantly while the profile
        // query confirms the server-side preference.
        if (restoredUser && serverTheme === "dark") {
          const cachedTheme = getCachedTheme();
          if (cachedTheme) {
            setThemeState(cachedTheme);
            applyTheme(cachedTheme);
          }
        }

        // Show the protected shell as soon as the session is restored.
        // Profile, goal and saved theme hydrate in the background.
        if (mounted) setLoading(false);
        void loadUserData(restoredUser);
      } catch (error) {
        console.error("Authentication initialization failed:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setActiveGoal(null);
          setThemeState(DEFAULT_THEME);
          applyTheme(DEFAULT_THEME, false);
          setLoading(false);
        }
      }
    };

    void initialise();

    const handleXpEarned = (event: Event) => {
      const detail = (event as CustomEvent<{ totalXp?: number }>).detail;
      if (typeof detail?.totalXp !== "number") return;
      setProfile((current: any) => current ? { ...current, total_xp: detail.totalXp } : current);
    };

    window.addEventListener("xp_earned", handleXpEarned);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession ?? null);
      setUser(nextUser);

      // Do not await Supabase calls inside the auth callback. Schedule the
      // profile refresh after the auth event has completed.
      window.setTimeout(() => {
        if (!mounted) return;
        void (async () => {
          if (event === "SIGNED_OUT" || !nextUser) {
            setProfile(null);
            setActiveGoal(null);
            setThemeState(DEFAULT_THEME);
            applyTheme(DEFAULT_THEME, false);
            setLoading(false);
            return;
          }

          void loadUserData(nextUser);
          if (mounted) setLoading(false);
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("xp_earned", handleXpEarned);
    };
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }

    setProfile(null);
    setActiveGoal(null);
    setSession(null);
    setUser(null);
    setThemeState(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME, false);
    router.replace("/auth?mode=login");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, activeGoal, loading, theme, setTheme, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

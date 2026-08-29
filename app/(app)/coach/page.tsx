"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bot, Check, Clock3, MessageCircle, RotateCcw, Send, Sparkles, Target, UserRound, X } from "lucide-react";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";

type Chat = { id: string; role: "user" | "ai"; text: string; time: string };

type CoachContext = {
  profile: any | null;
  goal: any | null;
  path: any | null;
  completed: number;
  total: number;
  nextTitle: string;
};

const STARTERS = [
  "Explain my current path in simple terms",
  "What should I focus on today?",
  "Why is this next step important?",
  "Help me turn this into a real project",
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function storageKey(userId: string) {
  return `veyra-coach-chat:${userId}`;
}

export default function CoachPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Chat[]>([]);
  const [context, setContext] = useState<CoachContext>({ profile: null, goal: null, path: null, completed: 0, total: 0, nextTitle: "Your next learning step" });
  const [loadingContext, setLoadingContext] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(storageKey(user.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed.slice(-30));
      }
    } catch { /* ignore malformed local chat */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try { localStorage.setItem(storageKey(user.id), JSON.stringify(messages.slice(-30))); } catch { /* ignore storage quota */ }
  }, [messages, user]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoadingContext(true);
      const [profileRes, goalRes, pathRes] = await Promise.all([
        supabase.from("learner_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("learning_goals").select("*").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("learning_paths").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      let completed = 0;
      let total = 0;
      let nextTitle = "Your next learning step";
      if (pathRes.data) {
        const itemsRes = await supabase.from("learning_path_items").select("status,progress,sequence,learning_resources(title)").eq("path_id", pathRes.data.id).order("sequence");
        const items = itemsRes.data || [];
        total = items.length;
        completed = items.filter((x: any) => x.progress >= 100 || x.status === "completed").length;
        const next = items.find((x: any) => x.progress < 100 && x.status !== "completed");
        // Supabase may return a nested relation as an array (depending on schema/cardinality).
        // Normalize it before reading the resource title so production TypeScript builds remain safe.
        const nextResource = Array.isArray(next?.learning_resources)
          ? next.learning_resources[0]
          : next?.learning_resources;
        nextTitle = nextResource?.title || nextTitle;
      }

      if (!cancelled) {
        setContext({ profile: profileRes.data, goal: goalRes.data, path: pathRes.data, completed, total, nextTitle });
        setLoadingContext(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, sending]);

  const progress = useMemo(() => context.total ? Math.round((context.completed / context.total) * 100) : 0, [context]);

  function clearChat() {
    setMessages([]);
    setError("");
    if (user) localStorage.removeItem(storageKey(user.id));
  }

  async function ask(raw = message) {
    const text = raw.trim();
    if (!text || sending) return;
    const userMessage: Chat = { id: crypto.randomUUID(), role: "user", text, time: now() };
    const history = messages.slice(-10);
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/generate_reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todayDayNumber: 1,
          totalDays: context.path?.estimated_weeks ? context.path.estimated_weeks * 7 : 30,
          taskTitle: context.nextTitle,
          taskDescription: context.path?.description || "Personalized adaptive learning path",
          taskCategory: "Personalized Learning",
          taskDuration: `${context.profile?.weekly_hours || 7} hrs/week`,
          userRole: context.profile?.target_role || context.goal?.title || "Learner",
          userExperience: context.profile?.experience_level || "Not specified",
          userGoal: context.goal?.title || "Build job-ready capability",
          userMessage: text,
          conversationHistory: history.map((m) => ({ sender: m.role === "ai" ? "ai" : "user", text: m.text })),
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result?.data?.reply) {
        throw new Error(result?.error || `Coach request failed (${response.status})`);
      }

      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "ai", text: result.data.reply, time: now() }]);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "The coach could not answer right now.";
      setError(messageText);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "ai",
        text: `I couldn't generate that answer right now. Your question was: “${text}”. Please retry once the AI service is available; I won't replace it with a canned answer.`,
        time: now(),
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="learning-shell coach-page-v2">
      <header className="learning-header coach-hero-v2">
        <div>
          <div className="section-kicker"><Bot size={13} /> VEYRA AI · PERSONAL LEARNING COPILOT</div>
          <h1>Ask your path.<br /><i>Get an answer that changes with you.</i></h1>
          <p>Your coach sees your current goal, learning path, progress and experience level. Every question is sent to the AI with that context and your recent conversation.</p>
        </div>
        <button type="button" className="coach-clear-btn" onClick={clearChat} disabled={!messages.length || sending}><RotateCcw size={14} /> New conversation</button>
      </header>

      <section className="coach-layout-v2">
        <div className="coach-panel-v2">
          <div className="coach-panel-head">
            <div className="coach-online"><span /> AI COACH <small>{sending ? "THINKING" : "READY"}</small></div>
            <span className="coach-secure"><Check size={13} /> Context-aware</span>
          </div>

          <div className="coach-messages-v2">
            {!messages.length && (
              <div className="coach-welcome-v2">
                <div className="coach-orb-v2"><Sparkles size={23} /></div>
                <span className="section-kicker">START HERE</span>
                <h2>What do you want to solve?</h2>
                <p>Ask a real question. Veyra will use your learning context instead of returning a generic script.</p>
                <div className="coach-starter-grid">
                  {STARTERS.map((item) => <button key={item} type="button" onClick={() => void ask(item)}>{item}<ArrowRight size={14} /></button>)}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`coach-message-v2 ${m.role}`}>
                <div className="coach-message-avatar">{m.role === "ai" ? <Sparkles size={13} /> : <UserRound size={13} />}</div>
                <div className="coach-message-body">
                  <span>{m.role === "ai" ? "VEYRA AI" : "YOU"} · {m.time}</span>
                  <div className="coach-bubble-v2">{m.text}</div>
                </div>
              </div>
            ))}
            {sending && <div className="coach-message-v2 ai"><div className="coach-message-avatar"><Sparkles size={13} /></div><div className="coach-typing-v2"><i /><i /><i /> Thinking through your context…</div></div>}
            <div ref={endRef} />
          </div>

          {error && <div className="coach-error-v2"><X size={14} /> {error}</div>}

          <form className="coach-composer-v2" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask anything about your learning, project, skills, interviews or current path…" rows={2} disabled={sending} />
            <button type="submit" disabled={!message.trim() || sending} aria-label="Send message"><Send size={17} /></button>
          </form>
          <div className="coach-composer-meta"><span><Clock3 size={12} /> Fast AI responses</span><span>Enter sends · Shift+Enter for a new line</span></div>
        </div>

        <aside className="coach-side-v2">
          <div className="coach-context-card-v2">
            <div className="section-kicker"><Target size={13} /> LIVE LEARNER CONTEXT</div>
            {loadingContext ? <div className="context-loading">Loading your learning signal…</div> : <>
              <div className="coach-context-path"><span>ACTIVE PATH</span><b>{context.path?.title || "No path yet"}</b><p>{context.path?.description || "Create a path from onboarding to unlock personalized coaching."}</p></div>
              <div className="coach-context-progress"><div><span>Path progress</span><b>{progress}%</b></div><div className="context-progress-track"><i style={{ width: `${progress}%` }} /></div><small>{context.completed} of {context.total} milestones completed</small></div>
              <div className="coach-context-facts"><div><span>Target</span><b>{context.profile?.target_role || context.goal?.title || "Not set"}</b></div><div><span>Experience</span><b>{context.profile?.experience_level || "Not set"}</b></div><div><span>Next</span><b>{context.nextTitle}</b></div><div><span>Capacity</span><b>{context.profile?.weekly_hours || 7} hrs/week</b></div></div>
            </>}
          </div>

          <div className="coach-side-card-v2"><div className="section-kicker"><MessageCircle size={13} /> COACH WORKFLOW</div><div className="workflow-row"><span>01</span><p>Ask a question</p></div><div className="workflow-row"><span>02</span><p>AI reads your context</p></div><div className="workflow-row"><span>03</span><p>Get a concrete answer</p></div><div className="workflow-row"><span>04</span><p>Apply it to your next step</p></div></div>

          <div className="coach-side-card-v2 coach-tip-v2"><Sparkles size={15} /><p><b>Better prompts get better coaching.</b> Include what you tried, where you are stuck and what outcome you want. Veyra keeps the recent conversation so you don't have to repeat yourself.</p></div>
        </aside>
      </section>
    </main>
  );
}

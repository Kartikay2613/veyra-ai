"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, Sparkles, Gauge, RotateCcw } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";

const QUESTIONS = [
  {
    title: "When you face an unfamiliar technical problem, what do you usually do first?",
    options: [
      ["Follow a tutorial step-by-step", 35],
      ["Search for examples, then adapt them", 55],
      ["Break it down and test my own approach", 80],
      ["Design a solution, validate it, then iterate", 100],
    ],
  },
  {
    title: "How independently can you apply the skills you already listed?",
    options: [
      ["I need guided examples", 30],
      ["I can modify existing solutions", 55],
      ["I can solve most familiar problems", 78],
      ["I can solve unfamiliar problems and explain trade-offs", 100],
    ],
  },
  {
    title: "If the path contains a topic you already know, what should the system do?",
    options: [
      ["Make me complete the full module", 35],
      ["Let me mark it complete myself", 55],
      ["Give me a short diagnostic first", 85],
      ["Test me and skip or compress it using the evidence", 100],
    ],
  },
  {
    title: "Which activity would give the strongest evidence that you actually learned a skill?",
    options: [
      ["Watching a complete course", 30],
      ["Solving guided exercises", 55],
      ["Building a small project from a brief", 82],
      ["Building under constraints and defending the decisions", 100],
    ],
  },
  {
    title: "What should happen when you repeatedly struggle with a milestone?",
    options: [
      ["Keep the same sequence and try again", 35],
      ["Give me more explanations", 55],
      ["Add targeted practice before retrying", 82],
      ["Recalculate the path around the exact weak prerequisite", 100],
    ],
  },
];

export default function AssessmentPage() {
  const { user } = useAuth();
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const score = useMemo(
    () => answers.length ? Math.round(answers.reduce((a, b) => a + b, 0) / answers.length) : 0,
    [answers],
  );

  async function choose(value: number) {
    const next = [...answers, value];
    setAnswers(next);
    if (q < QUESTIONS.length - 1) {
      setQ(q + 1);
      return;
    }

    if (!user) return;
    setSaving(true);
    const finalScore = Math.round(next.reduce((a, b) => a + b, 0) / next.length);

    const { data: path } = await supabase
      .from("learning_paths")
      .select("id, ai_reasoning")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (path) {
      const { data: item } = await supabase
        .from("learning_path_items")
        .select("id")
        .eq("path_id", path.id)
        .order("sequence")
        .limit(1)
        .maybeSingle();

      if (item) {
        await supabase.from("learning_progress").upsert(
          {
            user_id: user.id,
            path_item_id: item.id,
            progress: finalScore,
            feedback: `Adaptive diagnostic score: ${finalScore}/100. Evidence captured from ${QUESTIONS.length} scenario questions.`,
            difficulty_rating: Math.max(1, Math.min(5, Math.ceil(finalScore / 20))),
            time_spent_minutes: 5,
          },
          { onConflict: "user_id,path_item_id" },
        );
      }

      await supabase
        .from("learning_paths")
        .update({
          ai_reasoning: `New adaptation evidence: learner scored ${finalScore}/100 on the path-readiness diagnostic. Use this signal with progress and feedback to calibrate challenge, targeted practice, and prerequisite depth.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", path.id);
    }

    // A completed diagnostic is meaningful learning evidence and earns a small XP bonus.
    try {
      const xpResponse = await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 25,
          source: `assessment:${user.id}:${Date.now()}`,
        }),
      });
      const xpResult = await xpResponse.json().catch(() => null);
      if (xpResult?.success) {
        window.dispatchEvent(new CustomEvent("xp_earned", {
          detail: { amount: xpResult.awarded || 25, totalXp: xpResult.totalXp },
        }));
      }
    } catch (xpError) {
      console.warn("Assessment XP award failed:", xpError);
    }

    setSaving(false);
    setDone(true);
  }

  function reset() {
    setQ(0);
    setAnswers([]);
    setDone(false);
  }

  if (done) {
    return (
      <main className="learning-shell assessment-page">
        <div className="assessment-result">
          <div className="result-orb"><CheckCircle2 /></div>
          <div className="section-kicker"><Sparkles size={13} /> ADAPTATION SIGNAL CAPTURED</div>
          <h1>Your path has <i>new evidence.</i></h1>
          <div className="assessment-score"><strong>{score}</strong><span>/100 evidence score</span></div>
          <p>Your diagnostic is now attached to the learning signal. Veyra AI can use it alongside progress and feedback instead of relying only on your initial self-assessment.</p>
          <div className="result-actions">
            <Link href="/path" className="primary-btn">Review my path <ArrowRight size={15} /></Link>
            <Link href="/coach" className="ghost-btn">Ask the coach <ChevronRight size={15} /></Link>
            <button className="ghost-btn" onClick={reset}><RotateCcw size={14} /> Retake</button>
          </div>
        </div>
      </main>
    );
  }

  const question = QUESTIONS[q];
  return (
    <main className="learning-shell assessment-page">
      <div className="assessment-wrap">
        <header>
          <div className="section-kicker"><BrainCircuit size={13} /> ADAPTIVE DIAGNOSTIC · 5 MIN</div>
          <h1>Let the path <i>learn about you.</i></h1>
          <p>This is not a school exam. It is a lightweight evidence check that helps the system calibrate challenge, prerequisites and practice.</p>
        </header>
        <div className="assessment-card">
          <div className="assessment-meta"><span>QUESTION {q + 1} / {QUESTIONS.length}</span><b>{Math.round((q / QUESTIONS.length) * 100)}%</b></div>
          <div className="assessment-bar"><span style={{ width: `${((q + 1) / QUESTIONS.length) * 100}%` }} /></div>
          <div className="assessment-signal"><Gauge size={14} /> Evidence calibration</div>
          <h2>{question.title}</h2>
          <div className="assessment-options">
            {question.options.map(([label, value], i) => (
              <button key={label} className="assessment-option" onClick={() => choose(Number(value))} disabled={saving}>
                <span>{String(i + 1).padStart(2, "0")}</span><b>{label}</b><ArrowRight size={15} />
              </button>
            ))}
          </div>
          <small>{saving ? "Updating your adaptive learning signal…" : "Your answer becomes evidence for future recommendations."}</small>
        </div>
      </div>
    </main>
  );
}

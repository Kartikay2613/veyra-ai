"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Flag,
  GitBranch,
  LockKeyhole,
  Sparkles,
  Target,
  CircleDot,
  Layers3,
  BrainCircuit,
  Zap,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase-client";
import { useAuth } from "@/app/lib/AuthContext";

export default function PathPage() {
  const { user } = useAuth();
  const params = useParams<{ id?: string }>();
  const requestedPathId = typeof params?.id === "string" ? params.id : "";

  const [path, setPath] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  async function loadPath() {
    if (!user) return;

    setLoading(true);

    let pathQuery = supabase
      .from("learning_paths")
      .select("*")
      .eq("user_id", user.id);

    if (requestedPathId) {
      pathQuery = pathQuery.eq("id", requestedPathId);
    } else {
      pathQuery = pathQuery.order("created_at", { ascending: false }).limit(1);
    }

    const { data, error } = await pathQuery.maybeSingle();

    if (error) {
      console.error("Failed to load learning path:", error);
      setLoading(false);
      return;
    }

    setPath(data);

    if (data) {
      const { data: pathItems, error: itemsError } = await supabase
        .from("learning_path_items")
        .select("*,learning_resources(*)")
        .eq("path_id", data.id)
        .order("sequence");

      if (itemsError) {
        console.error("Failed to load learning path items:", itemsError);
      }

      setItems(pathItems || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;

    loadPath();
  }, [user, requestedPathId]);

  async function markComplete(item: any) {
    if (!user || !path || completing) return;

    const currentIndex = items.findIndex((x) => x.id === item.id);

    if (currentIndex === -1) return;

    const isAlreadyDone = item.progress >= 100 || item.status === "completed";

    if (isAlreadyDone) return;

    setCompleting(item.id);

    try {
      /*
       * STEP 1
       * Mark the current learning resource as completed.
       */
      const { error: completeError } = await supabase
        .from("learning_path_items")
        .update({
          progress: 100,
          status: "completed"
        })
        .eq("id", item.id)
        .eq("path_id", path.id);

      if (completeError) {
        throw new Error(completeError.message);
      }

      // Keep the normalized progress table in sync with the path item so
      // analytics, recommendations and future dashboards have an event trail.
      await supabase.from("learning_progress").upsert({
        user_id: user.id,
        path_item_id: item.id,
        progress: 100,
        time_spent_minutes: Number(item?.learning_resources?.estimated_hours || 1) * 60,
        feedback: "Completed learning milestone.",
      }, { onConflict: "user_id,path_item_id" });

      /*
       * STEP 2
       * Find the next item in sequence.
       */
      const nextItem = items[currentIndex + 1];

      /*
       * STEP 3–5
       * Unlock the next item and update the aggregate percentage in parallel.
       */
      const newCompletedCount = items.filter(
        (x) => x.id === item.id || x.progress >= 100 || x.status === "completed"
      ).length;
      const newPercentage =
        items.length > 0 ? Math.round((newCompletedCount / items.length) * 100) : 0;

      const operations = [
        nextItem
          ? supabase.from("learning_path_items").update({
              status: "available",
              progress: nextItem.progress || 0,
            }).eq("id", nextItem.id).eq("path_id", path.id)
          : Promise.resolve({ error: null }),
        supabase.from("learning_paths").update({
          completion_percentage: newPercentage,
          updated_at: new Date().toISOString(),
        }).eq("id", path.id).eq("user_id", user.id),
      ];

      const [unlockResult, pathResult] = await Promise.all(operations);
      if (unlockResult.error) throw new Error(unlockResult.error.message);
      if (pathResult.error) throw new Error(pathResult.error.message);

      // UI updates immediately after the persistence batch completes.
      setItems((previousItems) =>
        previousItems.map((x) => {
          if (x.id === item.id) return { ...x, progress: 100, status: "completed" };
          if (nextItem && x.id === nextItem.id) return { ...x, status: "available" };
          return x;
        })
      );
      setPath((previousPath: any) =>
        previousPath ? { ...previousPath, completion_percentage: newPercentage } : previousPath
      );

      /*
       * XP is intentionally non-blocking: completion should never wait on an AI/server
       * round-trip. The XP toast updates when the award is confirmed.
       */
      void fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 50,
          source: `path:${path.id}:item:${item.id}`,
          itemId: item.id,
        }),
      }).then(async (response) => {
        const xpResult = await response.json().catch(() => null);
        if (xpResult?.success) {
          window.dispatchEvent(new CustomEvent("xp_earned", {
            detail: { amount: xpResult.awarded || 50, totalXp: xpResult.totalXp },
          }));
        }
      }).catch((xpError) => console.warn("XP award failed; completion is still saved:", xpError));

      /*
       * Automatically open the newly unlocked step.
       */
      if (nextItem) {
        setOpen(nextItem.id);
      } else {
        setOpen(null);
        // Finishing every step earns a one-time goal completion bonus.
        if (newPercentage >= 100) {
          void fetch("/api/xp/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: 500, source: `goal-complete:${path.id}` }),
          }).then(async (response) => {
            const goalXpResult = await response.json().catch(() => null);
            if (goalXpResult?.success) {
              window.dispatchEvent(new CustomEvent("xp_earned", {
                detail: { amount: goalXpResult.awarded || 500, totalXp: goalXpResult.totalXp },
              }));
            }
          }).catch((goalXpError) => console.warn("Goal completion XP award failed:", goalXpError));
        }
      }
    } catch (error: any) {
      console.error("Failed to complete learning resource:", error);

      alert(
        error?.message ||
          "Unable to mark this learning resource as completed."
      );
    } finally {
      setCompleting(null);
    }
  }

  const done = items.filter(
    (x) => x.progress >= 100 || x.status === "completed"
  ).length;

  const current =
    items.find(
      (x) => x.status === "available" || x.status === "in_progress"
    ) ||
    items.find((x) => x.progress < 100 && x.status !== "completed");

  const pct =
    path?.completion_percentage ??
    (items.length ? Math.round((done / items.length) * 100) : 0);

  const weeks = path?.estimated_weeks || 12;

  const remaining = Math.max(0, items.length - done);

  if (loading) {
    return (
      <main className="learning-shell">
        <div className="premium-loading">
          <span />
          <span />
          <span />
        </div>
      </main>
    );
  }

  if (!path) {
    return (
      <main className="learning-shell">
        <section className="empty-path">
          <div className="empty-path-orb">
            <BrainCircuit />
          </div>

          <div className="section-kicker">
            <Sparkles size={13} /> LEARNING PATH ENGINE
          </div>

          <h1>
            Your path starts
            <br />
            <i>with your goal.</i>
          </h1>

          <p>
            Complete the learner profile and Veyra AI will build a
            prerequisite-aware sequence of resources, projects and
            assessments around your target.
          </p>

          <Link href="/onboarding" className="primary-btn">
            Build my path <ArrowRight size={15} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="learning-shell path-premium">
      <header className="premium-page-head">
        <div>
          <div className="section-kicker">
            <GitBranch size={13} /> YOUR ADAPTIVE ROADMAP{" "}
            <span className="live-chip">
              <i /> LIVE
            </span>
          </div>

          <h1>
            {path.title}
            <br />
            <i>built around your evidence.</i>
          </h1>

          <p>
            {path.description ||
              "A prerequisite-aware sequence generated from your goal, baseline skills, interests and learning preferences."}
          </p>
        </div>

        <div className="path-completion-card">
          <span>PATH COMPLETION</span>

          <strong>{pct}%</strong>

          <div>
            <i style={{ width: `${pct}%` }} />
          </div>

          <small>
            {done} of {items.length} steps complete
          </small>
        </div>
      </header>

      <section className="path-intelligence-grid">
        <div className="path-main-panel">
          <div className="path-panel-head">
            <div>
              <span className="panel-eyebrow">
                <Layers3 size={13} /> SEQUENCE ENGINE
              </span>

              <h2>Your route to the outcome</h2>
            </div>

            <span className="sequence-badge">
              {weeks} week plan
            </span>
          </div>

          <div className="path-rule">
            <span />
            <b>STARTING POINT</b>
            <em>Your profile</em>
            <ArrowRight size={13} />
            <b>TARGET</b>
            <em>Job-ready capability</em>
          </div>

          <div className="premium-roadmap">
            {items.map((it: any, i: number) => {
              const r = it.learning_resources;

              const isOpen = open === it.id;

              const isDone =
                it.progress >= 100 || it.status === "completed";

              const isCurrent =
                !isDone &&
                (
                  it.status === "available" ||
                  it.status === "in_progress" ||
                  (
                    !items.some(
                      (x) =>
                        x.status === "available" ||
                        x.status === "in_progress"
                    ) &&
                    i === done
                  )
                );

              const isLocked = !isDone && !isCurrent;

              const isCompleting = completing === it.id;

              return (
                <article
                  className={`premium-node ${
                    isDone
                      ? "is-done"
                      : isCurrent
                      ? "is-current"
                      : "is-locked"
                  }`}
                  key={it.id}
                >
                  <div className="premium-node-rail">
                    <span>
                      {isDone ? (
                        <Check size={13} />
                      ) : isCurrent ? (
                        <CircleDot size={12} />
                      ) : (
                        <LockKeyhole size={11} />
                      )}
                    </span>

                    {i < items.length - 1 && <i />}
                  </div>

                  <button
                    type="button"
                    className="premium-node-card"
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        setOpen(isOpen ? null : it.id);
                      }
                    }}
                  >
                    <div className="node-topline">
                      <span>
                        STEP {String(i + 1).padStart(2, "0")} ·{" "}
                        {it.milestone || "MILESTONE"}
                      </span>

                      <b>
                        {isDone
                          ? "MASTERED"
                          : isCurrent
                          ? "NEXT UP"
                          : "LOCKED"}
                      </b>
                    </div>

                    <div className="node-title">
                      <div>
                        <h3>
                          {r?.title ||
                            `Learning milestone ${i + 1}`}
                        </h3>

                        <p>
                          {r?.resource_type ||
                            "Learning resource"}{" "}
                          <span>·</span>{" "}
                          {r?.difficulty || "Adaptive"}{" "}
                          <span>·</span>{" "}
                          {r?.estimated_hours || 2}h
                        </p>
                      </div>

                      <ChevronDown
                        size={17}
                        className={isOpen ? "rotate" : ""}
                      />
                    </div>

                    <div className="node-progress">
                      <i
                        style={{
                          width: `${it.progress || 0}%`
                        }}
                      />
                    </div>
                  </button>

                  {isOpen && !isLocked && (
                    <div className="node-expanded">
                      <div className="node-reason">
                        <Sparkles size={15} />

                        <div>
                          <b>WHY THIS STEP</b>

                          <p>
                            {it.reason ||
                              "This step closes a prerequisite gap before the next milestone."}
                          </p>
                        </div>
                      </div>

                      <div className="node-details">
                        <span>
                          <Target size={13} />

                          <b>Skills</b>{" "}
                          {(r?.skills || [])
                            .slice(0, 4)
                            .join(" · ") ||
                            "Core capability"}
                        </span>

                        <span>
                          <ShieldCheck size={13} />

                          <b>Prerequisites</b>{" "}
                          {(r?.prerequisites || [])
                            .slice(0, 3)
                            .join(" · ") ||
                            "Profile baseline"}
                        </span>
                      </div>

                      <div className="node-actions">
                        {r?.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="primary-btn"
                          >
                            {isDone
                              ? "Review resource"
                              : "Start learning"}{" "}
                            <ArrowRight size={14} />
                          </a>
                        )}

                        {!isDone && isCurrent && (
                          <button
                            type="button"
                            className="primary-btn"
                            disabled={isCompleting}
                            onClick={() => markComplete(it)}
                          >
                            {isCompleting ? (
                              "Saving..."
                            ) : (
                              <>
                                Mark as completed{" "}
                                <Check size={14} />
                              </>
                            )}
                          </button>
                        )}

                        {isDone && (
                          <div className="completion-confirmation">
                            <Check size={14} />
                            Completed
                          </div>
                        )}

                        <Link
                          href="/coach"
                          className="ghost-btn"
                        >
                          Ask why{" "}
                          <Sparkles size={13} />
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <aside className="path-side-stack">
          <div className="path-ai-card">
            <div className="side-card-kicker">
              <Sparkles size={14} /> AI PATH LOGIC
            </div>

            <h3>Why this sequence?</h3>

            <p>
              {path.ai_reasoning ||
                "Your sequence is ordered around prerequisites, your current skill level and the target outcome."}
            </p>

            <div className="logic-list">
              <span>
                <b>01</b> Goal alignment
              </span>

              <span>
                <b>02</b> Skill-gap priority
              </span>

              <span>
                <b>03</b> Prerequisite safety
              </span>

              <span>
                <b>04</b> Workload fit
              </span>
            </div>

            <Link href="/coach">
              Challenge the recommendation{" "}
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="path-next-card">
            <div className="side-card-kicker">
              <Zap size={14} /> NEXT BEST ACTION
            </div>

            <h3>
              {current?.learning_resources?.title ||
                "Run your adaptive check"}
            </h3>

            <p>
              {current?.reason ||
                "Give the system another evidence point so your next recommendation can become more precise."}
            </p>

            <div className="next-meta">
              <span>
                <Clock3 size={12} />{" "}
                {current?.learning_resources
                  ?.estimated_hours || 2}
                h
              </span>

              <span>{remaining} steps left</span>
            </div>

            <Link
              href={current ? "/path" : "/assessment"}
              className="primary-btn"
            >
              {current ? "Continue path" : "Calibrate path"}{" "}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="path-signal-card">
            <div className="side-card-kicker">
              <Flag size={14} /> ADAPTIVE SIGNALS
            </div>

            <div>
              <b>Profile</b>
              <span>Goal + baseline</span>
              <i />
            </div>

            <div>
              <b>Progress</b>
              <span>Learning activity</span>
              <i />
            </div>

            <div>
              <b>Feedback</b>
              <span>Difficulty + reflection</span>
              <i />
            </div>

            <small>
              New evidence can change what comes next.
            </small>
          </div>
        </aside>
      </section>
    </main>
  );
}
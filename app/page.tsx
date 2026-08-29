"use client";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GitBranch,
  Layers3,
  LineChart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  Bot,
} from "lucide-react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { useAuth } from "@/app/lib/AuthContext";
import { useEffect } from "react";

const steps = [
  {
    Icon: Target,
    title: "Understand you",
    text: "Describe the outcome in your own words. Veyra captures role, experience, interests, skills, learning style, history and time available.",
  },
  {
    Icon: GitBranch,
    title: "Map the gap",
    text: "AI compares your starting point with the target capability and identifies the prerequisite skills that matter most.",
  },
  {
    Icon: Layers3,
    title: "Build the sequence",
    text: "Courses, articles, documentation, projects and assessments are ordered into milestones instead of a random resource list.",
  },
  {
    Icon: Bot,
    title: "Coach the journey",
    text: "Ask why a recommendation exists, what to skip, how to approach a task, or what to do when you are stuck.",
  },
  {
    Icon: LineChart,
    title: "Adapt with evidence",
    text: "Progress, assessment results, difficulty feedback and completed work become signals for the next recommendation.",
  },
  {
    Icon: BarChart3,
    title: "Prove capability",
    text: "Track milestones, skill confidence and practical projects so the learner can see progress beyond course completion.",
  },
];

const features = [
  {
    Icon: Target,
    title: "Personalized home",
    description:
      "One clear next action, current position, target and AI rationale.",
  },
  {
    Icon: GitBranch,
    title: "My path",
    description:
      "Milestones, prerequisites, resources, projects and assessments in sequence.",
  },
  {
    Icon: LineChart,
    title: "Skill graph",
    description:
      "Current vs target proficiency with the most valuable gaps surfaced.",
  },
  {
    Icon: Sparkles,
    title: "AI Coach",
    description:
      "Natural-language help grounded in your goal, path and current task.",
  },
  {
    Icon: BrainCircuit,
    title: "Resource intelligence",
    description:
      "Recommendations ranked by fit, prerequisites, gap coverage and time.",
  },
  {
    Icon: BarChart3,
    title: "Progress intelligence",
    description:
      "Completion, learning time, milestones and skill confidence in one view.",
  },
  {
    Icon: CheckCircle2,
    title: "Evidence checkpoints",
    description:
      "Practical projects and assessments prevent passive course collecting.",
  },
  {
    Icon: ShieldCheck,
    title: "Account control",
    description:
      "Theme, profile, privacy, sign-out and support from your account center.",
  },
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (!loading && user) return null;

  return (
    <main className="landing">
      {/* NAVIGATION */}
      <nav className="landing-nav">
        <Logo theme="light" />

        <div className="landing-links">
          <a href="#why">Why</a>
          <a href="#how">How it works</a>
          <a href="#adaptive">Adaptive AI</a>
          <a href="#features">Features</a>
          <Link href="/support">Support</Link>
        </div>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-login"
            onClick={() => router.push("/auth")}
          >
            Log in
          </button>

          <button
            type="button"
            className="landing-cta"
            onClick={() => router.push("/auth")}
          >
            Build my path
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-new">
        <div className="hero-copy">
          <div className="hero-badge">
            <span />
            AI-POWERED PERSONALIZED LEARNING
          </div>

          <h1>
            Stop collecting courses.
            <br />
            <i>Start building capability.</i>
          </h1>

          <div className="veyra-tagline">
            Your path, intelligently built.
          </div>

          <p>
            Veyra turns a career goal into a living learning path —
            personalized to your starting skills, interests, learning
            patterns, available time and target outcome.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="hero-primary"
              onClick={() => router.push("/auth")}
            >
              Create my learning path
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              className="hero-secondary"
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See how it works
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="hero-trust">
            <span>
              <CheckCircle2 size={14} />
              Goal-first
            </span>

            <span>
              <CheckCircle2 size={14} />
              Skill-gap aware
            </span>

            <span>
              <CheckCircle2 size={14} />
              Prerequisite-aware
            </span>

            <span>
              <CheckCircle2 size={14} />
              Adaptive
            </span>
          </div>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="hero-product">
          <div className="product-window">
            <div className="product-top">
              <div className="product-dots">
                <b />
                <b />
                <b />
              </div>

              <span>VEYRA AI · LEARNING OS</span>

              <em>● ADAPTIVE</em>
            </div>

            <div className="product-body">
              <div className="product-eyebrow">
                YOUR NEXT MOVE
              </div>

              <h3>
                Become a production-ready ML Engineer
              </h3>

              <p>
                12-week path · generated around your current capability
                profile
              </p>

              <div className="mini-progress">
                <span />
              </div>

              <div className="mini-progress-meta">
                <span>32% complete</span>
                <span>Skill confidence</span>
              </div>

              <div className="mini-grid">
                <div>
                  <small>STRONG</small>

                  <b>
                    Python <span>82%</span>
                  </b>

                  <b>
                    Statistics <span>76%</span>
                  </b>
                </div>

                <div>
                  <small>GAPS</small>

                  <b>
                    Deployment <span>31%</span>
                  </b>

                  <b>
                    MLOps <span>18%</span>
                  </b>
                </div>
              </div>

              <div className="ai-recommend">
                <div className="ai-icon">
                  <Sparkles size={16} />
                </div>

                <div>
                  <small>✦ AI RECOMMENDS NEXT</small>
                  <b>MLOps Foundations</b>

                  <p>
                    Moved earlier because deployment is your
                    highest-impact gap.
                  </p>
                </div>

                <ArrowRight size={17} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <section className="logo-strip">
        <span>DESIGNED AROUND THE LEARNER</span>
        <b>GOAL</b>
        <b>SKILLS</b>
        <b>TIME</b>
        <b>EVIDENCE</b>
        <b>FEEDBACK</b>
      </section>

      {/* WHY VEYRA */}
      <section id="why" className="why-section">
        <div>
          <div className="section-kicker">WHY VEYRA</div>

          <h2>
            The internet has resources.
            <br />
            <i>You need a route.</i>
          </h2>
        </div>

        <div className="why-copy">
          <p>
            Thousands of courses create choice overload. A
            recommendation becomes useful only when it knows where
            you are, where you want to go and what should happen
            between those two points.
          </p>

          <div className="why-points">
            <span>
              <ShieldCheck />
              Private learner profile
            </span>

            <span>
              <Clock3 />
              Built around your weekly capacity
            </span>

            <span>
              <Zap />
              One highest-impact next action
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="story-section">
        <div className="section-kicker">
          THE LEARNING ENGINE
        </div>

        <h2>
          From <i>goal</i> to capability,
          <br />
          without the guesswork.
        </h2>

        <p className="section-lead">
          Veyra connects learner context, skill gaps, resources,
          prerequisites, projects, assessments and feedback into
          one adaptive loop.
        </p>

        <div className="story-grid">
          {steps.map((step, index) => {
            const StepIcon = step.Icon;

            return (
              <article
                className="story-card"
                key={step.title}
              >
                <div className="story-num">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="story-icon">
                  <StepIcon />
                </div>

                <h3>{step.title}</h3>

                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ADAPTIVE AI */}
      <section id="adaptive" className="adapt-section">
        <div className="adapt-copy">
          <div className="section-kicker">
            THE DIFFERENCE
          </div>

          <h2>
            Your path <i>changes</i> when your evidence changes.
          </h2>

          <p>
            Complete an assessment. Tell the coach something was
            too easy. Finish a project. Veyra can use those signals
            to rethink what matters next instead of locking you
            into a static syllabus.
          </p>

          <div className="adapt-list">
            <span>
              <Zap size={15} />
              New evidence changes skill confidence
            </span>

            <span>
              <GitBranch size={15} />
              Prerequisites keep the sequence logical
            </span>

            <span>
              <MessageCircle size={15} />
              AI explains every recommendation
            </span>
          </div>
        </div>

        <div className="change-card">
          <div className="change-head">
            <span>✦ PATH ADAPTATION</span>
            <b>AFTER ASSESSMENT</b>
          </div>

          <div className="change-row old">
            <span>03</span>

            <div>
              <b>Deep Learning</b>
              <small>Originally next</small>
            </div>

            <ChevronRight />
          </div>

          <div className="swap">
            <span>Re-ranked</span>
            <ArrowRight size={15} />
          </div>

          <div className="change-row new">
            <span>03</span>

            <div>
              <b>MLOps Foundations</b>
              <small>
                Now next · closes your largest gap
              </small>
            </div>

            <CheckCircle2 />
          </div>

          <div className="reason">
            <Sparkles size={15} />

            <span>
              <b>Why?</b> Your assessment raised deep-learning
              confidence. Deployment remains the highest-impact
              gap, so the sequence changes.
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="experience-section">
        <div className="section-kicker">
          ONE PRODUCT · EVERY SIGNAL
        </div>

        <h2>
          A complete learning command center,
          <br />
          <i>not another course library.</i>
        </h2>

        <div className="experience-grid">
          {features.map((feature) => {
            const FeatureIcon = feature.Icon;

            return (
              <div
                className="experience-card"
                key={feature.title}
              >
                <FeatureIcon />

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* DEMO */}
      <section className="demo-section">
        <div className="demo-card">
          <div>
            <div className="section-kicker">
              WHAT YOU GET
            </div>

            <h2>
              A path that tells you{" "}
              <i>what to do next.</i>
            </h2>

            <p>
              Instead of asking “what should I learn?”, your
              workspace answers “what should I do today, why does
              it matter, and what proves I learned it?”
            </p>
          </div>

          <div className="demo-stats">
            <div>
              <b>01</b>
              <span>Goal</span>
              <small>Target outcome</small>
            </div>

            <div>
              <b>02</b>
              <span>Gap</span>
              <small>Missing capability</small>
            </div>

            <div>
              <b>03</b>
              <span>Action</span>
              <small>Best next step</small>
            </div>

            <div>
              <b>04</b>
              <span>Proof</span>
              <small>Assessment / project</small>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="section-kicker">
          READY WHEN YOU ARE
        </div>

        <h2>
          Give the AI a destination.
          <br />
          <i>It will build the route.</i>
        </h2>

        <p>
          Start with your goal. Your first personalized roadmap is
          generated after onboarding.
        </p>

        <button
          type="button"
          onClick={() => router.push("/auth")}
        >
          Build my personalized path
          <ArrowRight size={16} />
        </button>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Logo theme="light" />
          <span>Your path, intelligently built.</span>
        </div>

        <div className="footer-links">
          <div>
            <b>Product</b>
            <a href="#why">Why Veyra</a>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
          </div>

          <div>
            <b>Company</b>
            <Link href="/about">About</Link>
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Veyra AI</span>

          <button
            type="button"
            onClick={() => router.push("/auth")}
          >
            Start building
            <ArrowRight size={14} />
          </button>
        </div>
      </footer>
    </main>
  );
}

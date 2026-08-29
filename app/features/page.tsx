"use client";

import React from "react";
import Logo from "@/app/components/Logo";
import { ArrowLeft, Target, Zap, Sparkles, Trophy, Calendar, Compass } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="features-page">
      <nav className="simple-nav">
        <div className="nav-inner">
          <Logo theme="light" />
          <a href="/" className="back-btn">
            <ArrowLeft size={16} /> Back to home
          </a>
        </div>
      </nav>

      <main className="features-main">
        <header className="page-header">
          <span className="badge">Platform Capabilities</span>
          <h1 className="title">Features built to accelerate your career.</h1>
          <p className="subtitle">
            Veyra AI merges productivity science with game mechanics and AI coaching to keep you moving forward every single day.
          </p>
        </header>

        <section className="features-detail-grid">
          {/* Feature 1 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(249, 115, 22, 0.1)" }}>
              <Target size={24} color="#f97316" />
            </div>
            <h2>Structured Daily Tasks</h2>
            <p>
              Say goodbye to task paralysis. Veyra AI generates high-impact, bite-sized tasks tailored specifically to your goal. Each morning you receive a fresh set of actions designed to create tangible momentum.
            </p>
            <ul className="spec-list">
              <li>Custom task generation based on your target role</li>
              <li>Priority sequencing to focus on what matters most</li>
              <li>Estimated task times to fit your daily schedule</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
              <Zap size={24} color="#8b5cf6" />
            </div>
            <h2>XP & Streak Mechanics</h2>
            <p>
              Consistency is key to landing a role. Our gamified experience loops make job hunting feel engaging rather than draining. Maintain your streak, level up your profile, and build long-term habits.
            </p>
            <ul className="spec-list">
              <li>Daily Streak multiplier to reward daily commits</li>
              <li>Experience points (XP) awarded on task completion</li>
              <li>Peer leaderboard to sprint collaboratively with others</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <Sparkles size={24} color="#10b981" />
            </div>
            <h2>AI Sprint Coach & Agent</h2>
            <p>
              Your personal career advisor is available 24/7. Residing right inside your daily tracker, the Sprint Coach helps you craft resumes, drafts cold outreach messages, and reviews your daily reflections.
            </p>
            <ul className="spec-list">
              <li>Interactive chatbot with deep context about your goals</li>
              <li>In-context helper for drafting emails and cover letters</li>
              <li>Daily reflection feedback to identify bottlenecks</li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
              <Trophy size={24} color="#3b82f6" />
            </div>
            <h2>Gamified Leaderboards</h2>
            <p>
              Stay motivated by seeing other builders hit their goals. Our anonymous, privacy-focused leaderboard highlights active sprinters and their current accomplishments without compromising personal details.
            </p>
            <ul className="spec-list">
              <li>Weekly and all-time leaderboard rankings</li>
              <li>XP progression tiers</li>
              <li>Privacy-first anonymous usernames</li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(236, 72, 153, 0.1)" }}>
              <Calendar size={24} color="#ec4899" />
            </div>
            <h2>Sprint Calendar</h2>
            <p>
              Track your history and see your momentum build. The interactive calendar shows your active sprints, completion badges, and reflection records, giving you a bird's-eye view of your progress.
            </p>
            <ul className="spec-list">
              <li>Interactive daily calendar cells</li>
              <li>Visual progress tracking with custom status codes</li>
              <li>Historical log of past tasks and reflections</li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="feature-detail-card">
            <div className="icon-wrapper" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
              <Compass size={24} color="#0ea5e9" />
            </div>
            <h2>Goal Discovery & Onboarding</h2>
            <p>
              Set up your roadmap in less than 2 minutes. Our guided wizard parses your career aspirations, target companies, and current level to construct a bespoke roadmap optimized for your profile.
            </p>
            <ul className="spec-list">
              <li>Structured onboarding questions</li>
              <li>Automatic timeline and target sprint duration planning</li>
              <li>Flexible goals adjustment dashboard</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer-copyright-only">
        <p>© 2026 Veyra AI. All rights reserved.</p>
      </footer>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: #0a0a0a;
          color: #fff;
          font-family: var(--font-body), sans-serif;
        }

        .features-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
        }

        .simple-nav {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.15s;
        }
        .back-btn:hover {
          color: #f97316;
        }

        .features-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 64px 24px 80px;
          flex: 1;
        }

        .page-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 64px;
        }
        .badge {
          display: inline-block;
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.2);
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .title {
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          margin: 0 0 16px;
        }
        .subtitle {
          font-size: 16.5px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin: 0;
        }

        .features-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        .feature-detail-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 36px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .feature-detail-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        .icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .feature-detail-card h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px;
        }
        .feature-detail-card p {
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin: 0 0 20px;
        }
        .spec-list {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .spec-list li {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.4;
        }

        .footer-copyright-only {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 32px 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .features-detail-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .title {
            font-size: 32px;
          }
          .features-main {
            padding: 40px 24px 60px;
          }
          .feature-detail-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}

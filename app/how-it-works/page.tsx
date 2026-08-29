"use client";

import React from "react";
import Logo from "@/app/components/Logo";
import { ArrowLeft, UserPlus, Flame, ClipboardCheck, MessageSquarePlus } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <nav className="simple-nav">
        <div className="nav-inner">
          <Logo theme="light" />
          <a href="/" className="back-btn">
            <ArrowLeft size={16} /> Back to home
          </a>
        </div>
      </nav>

      <main className="how-it-works-main">
        <header className="page-header">
          <span className="badge">Methodology</span>
          <h1 className="title">How Veyra AI works.</h1>
          <p className="subtitle">
            A step-by-step breakdown of how we help you build momentum, maintain habits, and achieve your professional milestones.
          </p>
        </header>

        <section className="steps-container">
          {/* Step 1 */}
          <div className="step-row">
            <div className="step-number-box">
              <span className="step-num">01</span>
            </div>
            <div className="step-content">
              <div className="step-icon-wrap" style={{ background: "rgba(249, 115, 22, 0.1)" }}>
                <UserPlus size={20} color="#f97316" />
              </div>
              <h2>Configure Your Career Target</h2>
              <p>
                Complete our quick onboarding process where you tell us about your background, desired industry, and target role. Veyra AI's path builder instantly sets up a bespoke milestone tracker mapped specifically to your profile.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-row">
            <div className="step-number-box">
              <span className="step-num">02</span>
            </div>
            <div className="step-content">
              <div className="step-icon-wrap" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <ClipboardCheck size={20} color="#8b5cf6" />
              </div>
              <h2>Execute Your Daily Tasks</h2>
              <p>
                Every day, log in to receive a set of focused tasks. These are actionable, high-impact activities like building targeted network connections, tailoring your resume, or completing portfolio pieces. No more wondering "what should I work on today?".
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-row">
            <div className="step-number-box">
              <span className="step-num">03</span>
            </div>
            <div className="step-content">
              <div className="step-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <Flame size={20} color="#10b981" />
              </div>
              <h2>Keep the Streak Alive</h2>
              <p>
                Mark your daily tasks as complete to earn XP (experience points) and build your active streak. Compete with peers on the anonymous leaderboard to stay accountable and push through periods of low motivation.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="step-row">
            <div className="step-number-box">
              <span className="step-num">04</span>
            </div>
            <div className="step-content">
              <div className="step-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                <MessageSquarePlus size={20} color="#3b82f6" />
              </div>
              <h2>Sprint Review & AI Coaching</h2>
              <p>
                Reflect on your progress. Our custom AI Coach reads your reflections to give you guidance, drafts templates for outreach, checks on your bottlenecks, and helps you optimize your path forward.
              </p>
            </div>
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

        .how-it-works-page {
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
          max-width: 900px;
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

        .how-it-works-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 64px 24px 80px;
          flex: 1;
          width: 100%;
          box-sizing: border-box;
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

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          position: relative;
        }
        .steps-container::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 40px;
          width: 2px;
          background: rgba(255, 255, 255, 0.05);
          z-index: 0;
        }

        .step-row {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 1;
        }
        .step-number-box {
          width: 82px;
          height: 82px;
          background: #0f0f0f;
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-num {
          font-size: 24px;
          font-weight: 900;
          color: #f97316;
          font-family: var(--font-display), sans-serif;
        }
        .step-content {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          padding: 32px;
          flex: 1;
        }
        .step-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .step-content h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px;
        }
        .step-content p {
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin: 0;
        }

        .footer-copyright-only {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 32px 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .steps-container::before {
            display: none;
          }
          .step-row {
            flex-direction: column;
            gap: 16px;
          }
          .step-number-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }
          .step-num {
            font-size: 18px;
          }
          .step-content {
            padding: 20px;
          }
          .title {
            font-size: 32px;
          }
          .how-it-works-main {
            padding: 40px 24px 60px;
          }
        }
      `}</style>
    </div>
  );
}

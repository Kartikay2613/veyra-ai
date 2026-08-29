"use client";

import React from "react";
import Logo from "@/app/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="about-page">
      <nav className="simple-nav">
        <div className="nav-inner">
          <Logo theme="light" />
          <a href="/" className="back-btn">
            <ArrowLeft size={16} /> Back to home
          </a>
        </div>
      </nav>

      <main className="about-main">
        <header className="page-header">
          <span className="badge">Our Philosophy</span>
          <h1 className="title">About Veyra AI.</h1>
          <p className="subtitle">
            Helping builders, designers, developers, and makers stay consistent, build momentum, and land their next professional role.
          </p>
        </header>

        <section className="about-content">
          <h2>The Momentum Problem</h2>
          <p>
            Finding a new job or leveling up your career is often treated as a matching problem: align your resume with a description and apply. But in reality, career development is a momentum problem.
          </p>
          <p>
            Job hunting is solitary, full of silent rejection, and highly unstructured. Without structure, motivation runs out, task paralysis sets in, and streaks are broken.
          </p>

          <h2>The Sprint Solution</h2>
          <p>
            Veyra AI was built to solve the momentum problem. We believe that job hunting shouldn't feel like sending resumes into a black hole. It should feel like a structured, active sprint.
          </p>
          <p>
            By decomposing massive career goals into bite-sized, high-leverage daily actions, Veyra AI removes the mental friction of starting. By adding game loops (streaks, leaderboard, XP), we keep you coming back. And by integrating custom LLMs, we provide context-aware AI coaching when you need it most.
          </p>

          <h2>Built Privacy-First</h2>
          <p>
            Your career search is highly personal. That's why Veyra AI was built from the ground up to be private by default. We generate anonymous usernames for the leaderboard, protect your reflections, and ensure your data remains your own.
          </p>
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

        .about-page {
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
          max-width: 800px;
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

        .about-main {
          max-width: 800px;
          margin: 0 auto;
          padding: 64px 24px 80px;
          flex: 1;
          width: 100%;
          box-sizing: border-box;
        }

        .page-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 48px;
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

        .about-content {
          line-height: 1.8;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
        }
        .about-content h2 {
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          margin: 40px 0 16px;
        }
        .about-content p {
          margin: 0 0 20px;
        }

        .footer-copyright-only {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 32px 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .title {
            font-size: 32px;
          }
          .about-main {
            padding: 40px 24px 60px;
          }
        }
      `}</style>
    </div>
  );
}

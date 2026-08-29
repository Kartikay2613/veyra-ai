"use client";

import React from "react";
import Logo from "@/app/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <nav className="simple-nav">
        <div className="nav-inner">
          <Logo theme="light" />
          <a href="/" className="back-btn">
            <ArrowLeft size={16} /> Back to home
          </a>
        </div>
      </nav>

      <main className="legal-main">
        <header className="page-header">
          <span className="badge">Legal</span>
          <h1 className="title">Terms of Service</h1>
          <p className="subtitle">Last updated: August 6, 2026</p>
        </header>

        <section className="legal-content">
          <p>
            Welcome to Veyra AI. By using our website and services, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h2>1. Use of the Platform</h2>
          <p>
            Veyra AI provides a gamified daily task manager, AI coaching companion, and leaderboard. You agree to use the service only for lawful, personal purposes. You are responsible for maintaining the confidentiality of your account credentials.
          </p>

          <h2>2. Accountability & Gamification Rules</h2>
          <p>
            The gamification system is meant to assist your career consistency. Veyra AI reserves the right to moderate leaderboard records to maintain competitive integrity. Sprints, XP, and streaks carry no monetary value.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            All code, brand trademarks, logos, illustrations, design tokens, and features of Veyra AI are the intellectual property of Veyra AI. You may not copy, reverse engineer, or redistribute our assets without express permission.
          </p>

          <h2>4. Limitation of Liability</h2>
          <p>
            Veyra AI is provided "as is" without warranties of any kind. We do not guarantee employment or specific job placement outcomes. We are not liable for any direct or indirect damages resulting from your use of the platform.
          </p>

          <h2>5. Changes to Terms</h2>
          <p>
            We may update these terms occasionally. Your continued use of the platform after updates indicates your acceptance of the revised terms.
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

        .legal-page {
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

        .legal-main {
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
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .legal-content {
          line-height: 1.8;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
        }
        .legal-content h2 {
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          margin: 36px 0 16px;
        }
        .legal-content p {
          margin: 0 0 16px;
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
          .legal-main {
            padding: 40px 24px 60px;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import React from "react";
import Logo from "@/app/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="title">Privacy Policy</h1>
          <p className="subtitle">Last updated: August 6, 2026</p>
        </header>

        <section className="legal-content">
          <p>
            At Veyra AI, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our application.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you directly provide to us, including when you create an account, configure your career goals, complete daily tasks, or submit reflections. This includes:
          </p>
          <ul>
            <li><strong>Account Data:</strong> Email address, password, and custom username.</li>
            <li><strong>Sprint Data:</strong> Career targets, daily reflection logs, completed tasks, XP records, and streak status.</li>
            <li><strong>AI Coach Interactions:</strong> Text interactions with the Sprint Coach bot to generate tailored career guidance.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate, maintain, and improve our services, including:
          </p>
          <ul>
            <li>Generating personalized career sprints and daily action plans.</li>
            <li>Powering the conversational AI Sprint Agent coach.</li>
            <li>Rendering the anonymous peer leaderboards.</li>
            <li>Sending critical transactional notifications related to your account.</li>
          </ul>

          <h2>3. Sharing and Disclosing Data</h2>
          <p>
            We do not sell, rent, or trade your personal data. Leaderboards are entirely anonymized using auto-generated usernames. Your reflections and goals are kept strictly private to your account.
          </p>

          <h2>4. Data Retention & Deletion</h2>
          <p>
            We store your data as long as your account remains active. You can delete your account and purge all associated records, including milestones, goals, and reflections, by visiting our Delete Account page.
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
        .legal-content ul {
          margin: 0 0 20px;
          padding-left: 20px;
        }
        .legal-content li {
          margin-bottom: 8px;
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

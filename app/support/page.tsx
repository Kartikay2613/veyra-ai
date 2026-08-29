"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Mail, HelpCircle, Phone, MessageSquare, Bug, Lightbulb, ArrowRight } from "lucide-react";
import Logo from "@/app/components/Logo";

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [topic, setTopic] = useState("General support");
  const [message, setMessage] = useState("");
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@veyra.ai";
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";
  const faqs = [
    ["How does the personalized path work?", "Veyra AI combines your goal, role, experience, skills, interests, learning style, completed courses and weekly capacity. AI then identifies gaps and orders resources, projects and assessments around prerequisites."],
    ["Why can my path change?", "The path is adaptive by design. Assessment results, progress and your feedback become new evidence. When your confidence changes, the system can re-rank what is most useful next."],
    ["Does Veyra AI only recommend courses?", "No. A strong path can include courses, documentation, articles, videos, projects and assessments. The goal is capability, not a high course count."],
    ["Can I ask the AI Coach why something was recommended?", "Yes. Ask about any current task or recommendation. The coach is designed to explain the rationale, prerequisites and practical approach in learner-friendly language."],
    ["Is my learning data private?", "Your goals, progress and reflections are tied to your authenticated account. The leaderboard uses an anonymous learner identity rather than exposing your private learning notes."],
    ["How do I change my account or theme?", "Open your profile menu and choose Account settings. You can update your display name, switch light/dark mode, review privacy links and sign out."],
  ];
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(`[Veyra AI] ${topic}`)}&body=${encodeURIComponent(message)}`;
  return <main className="support-page-premium">
    <nav className="public-nav"><Logo theme="light"/><Link href="/" className="back-btn"><ArrowLeft size={15}/> Back to home</Link></nav>
    <main className="support-main-premium">
      <header className="support-hero"><span className="support-badge"><HelpCircle size={13}/> SUPPORT CENTER</span><h1>Questions happen.<br/><i>Getting unstuck shouldn't.</i></h1><p>Find an answer, report a problem, share an idea, or reach the Veyra AI team directly.</p><div className="support-actions"><a href={`mailto:${supportEmail}`}><Mail size={15}/> Email support</a>{supportPhone && <a href={`tel:${supportPhone}`}><Phone size={15}/> Call support</a>}<Link href="/settings"><ArrowRight size={15}/> Account settings</Link></div></header>

      <section className="support-grid-premium"><div className="faq-premium"><div className="support-section-label">QUICK ANSWERS</div><h2>Frequently asked</h2><div className="faq-list-premium">{faqs.map(([q,a],i)=><button key={q} className={`faq-item-premium ${openIndex===i?"open":""}`} onClick={()=>setOpenIndex(openIndex===i?null:i)}><span className="faq-q"><b>{q}</b>{openIndex===i?<Minus size={17}/>:<Plus size={17}/>}</span>{openIndex===i&&<span className="faq-a">{a}</span>}</button>)}</div></div>
      <aside className="contact-panel"><div className="support-section-label">CONTACT THE TEAM</div><h2>Tell us what happened.</h2><p>Use the quick form and your email client will open with the details prefilled.</p><label>Topic<select value={topic} onChange={e=>setTopic(e.target.value)}><option>General support</option><option>Bug report</option><option>Feature idea</option><option>Account issue</option><option>Learning path issue</option></select></label><label>Message<textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe what you need help with…" rows={6}/></label><a className="support-send" href={mailto}><MessageSquare size={15}/> Open email draft <ArrowRight size={15}/></a><div className="support-contact-lines"><a href={`mailto:${supportEmail}`}><Mail size={14}/><span>{supportEmail}</span></a>{supportPhone ? <a href={`tel:${supportPhone}`}><Phone size={14}/><span>{supportPhone}</span></a> : <span><Phone size={14}/><span>Phone support coming soon</span></span>}</div></aside></section>

      <section className="support-cards"><div><Bug/><h3>Found a bug?</h3><p>Tell us the screen, action and what you expected to happen.</p></div><div><Lightbulb/><h3>Have an idea?</h3><p>Suggest a feature that would make personalized learning more useful.</p></div><div><MessageSquare/><h3>Need path help?</h3><p>Ask about a recommendation, prerequisite or next action.</p></div></section>
    </main>
    <footer className="public-footer"><Logo theme="light"/><span>© 2026 Veyra AI</span><div><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>
  </main>
}

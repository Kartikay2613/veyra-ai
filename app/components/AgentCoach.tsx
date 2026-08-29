"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User } from "lucide-react";

interface AgentCoachProps {
  todayMood: number | null;
  dayNumber: number;
  totalDays?: number;
  taskTitle?: string;
  taskDescription?: string;
  taskCategory?: string;
  taskDuration?: string;
  userRole?: string;
  userExperience?: string;
  userGoal?: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGreeting(mood: number | null, day: number): string {
  if (mood === 1)
    return `Rough day — I get it. Let's make day ${day} as light as possible. What's feeling most overwhelming right now?`;
  if (mood === 2)
    return `Feeling meh today? That's okay. Sometimes just starting is the win. What's on your plate for day ${day}?`;
  if (mood === 4)
    return `Good energy today! Let's make day ${day} count. Want me to review your work or help you go deeper?`;
  if (mood === 5)
    return `Fired up — love it! Day ${day} is yours. Let's channel this. What do you want to crush today?`;
  return `Hey! I'm your Sprint Agent. I'm here to help you nail day ${day}. Ask me anything — resume help, drafting, strategy, or just thinking out loud.`;
}

function getAIResponse(input: string): string {
  const text = input.toLowerCase();
  const options: string[] = [];
  if (text.includes("resume") || text.includes("cv")) options.push("For your resume, make each bullet prove impact: action + method + measurable result. Paste one bullet and I’ll turn it into a stronger, role-specific version.");
  if (text.includes("linkedin")) options.push("For LinkedIn, lead with the outcome you create rather than only your title. Send me your current headline and target role and I’ll rewrite three versions.");
  if (text.includes("interview")) options.push("Let’s make this practical: answer one interview question using Situation, Task, Action and Result, then I’ll tighten the weak part. Send me the question or your draft.");
  if (text.includes("network") || text.includes("dm") || text.includes("message")) options.push("Make outreach specific: mention one genuine observation, connect it to your goal, then make one small ask. Give me the person’s role and context and I’ll draft it.");
  if (text.includes("stuck") || text.includes("help")) options.push("Let’s reduce the task to one 10-minute action. Tell me what you have already tried and what is blocking you, and I’ll give you the next concrete move.");
  if (text.includes("goal") || text.includes("plan")) options.push("Let’s work backwards from the outcome: capability you need → evidence you can show → practice that creates the evidence. Tell me the target and deadline and I’ll map the next three moves.");
  if (options.length) return options[Math.floor(Math.random() * options.length)];
  return "I’m with you. Give me the goal, the exact problem you’re facing, and what you’ve already tried; I’ll turn that into a concrete next step instead of a generic answer.";
}

export default function AgentCoach({
  todayMood,
  dayNumber,
  totalDays,
  taskTitle,
  taskDescription,
  taskCategory,
  taskDuration,
  userRole,
  userExperience,
  userGoal,
  messages,
  setMessages,
}: AgentCoachProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;

      return [
        {
          id: "init",
          sender: "ai",
          text: getGreeting(todayMood, dayNumber),
          time: getTime(),
        },
      ];
    });
  }, [todayMood, dayNumber, setMessages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/generate_reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todayDayNumber: dayNumber,
          totalDays: totalDays ?? 30,
          taskTitle: taskTitle ?? "",
          taskDescription: taskDescription ?? "",
          taskCategory: taskCategory ?? "",
          taskDuration: taskDuration ?? "",
          userMessage: text,
          userRole: userRole ?? "",
          userExperience: userExperience ?? "",
          userGoal: userGoal ?? "",
          conversationHistory: messages.slice(-8).map(({ sender, text }) => ({ sender, text })),
        }),
      });

      const result = await response.json();
      if (result.success && result.data && result.data.reply) {
        const aiMsg: Message = {
          id: Date.now().toString(),
          sender: "ai",
          text: result.data.reply,
          time: getTime(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(result.error || "Failed to get reply");
      }
    } catch (err) {
      console.warn("AI reply generation failed, using mock fallback:", err);
      // Fallback to offline mock response
      const aiMsg: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: getAIResponse(text),
        time: getTime(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="ac-shell">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-agent-avatar">
          <Sparkles size={16} color="#fff" strokeWidth={2.2} />
        </div>

        <div>
          <div className="ac-agent-name">Sprint Agent</div>

          <div className="ac-agent-status">
            <span className="ac-online-dot" />
            Online · Day {dayNumber}/{totalDays ?? 30}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="ac-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ac-message-row ${
              msg.sender === "user" ? "ac-message-row--user" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`ac-message-avatar ${
                msg.sender === "ai"
                  ? "ac-message-avatar--ai"
                  : "ac-message-avatar--user"
              }`}
            >
              {msg.sender === "ai" ? (
                <Sparkles size={13} color="#fff" />
              ) : (
                <User size={13} />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`ac-message-content ${
                msg.sender === "user" ? "ac-message-content--user" : ""
              }`}
            >
              <div
                className={`ac-bubble ${
                  msg.sender === "ai" ? "ac-bubble--ai" : "ac-bubble--user"
                }`}
              >
                {msg.text}
              </div>

              <span className="ac-message-time">{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="ac-message-row">
            <div className="ac-message-avatar ac-message-avatar--ai">
              <Sparkles size={13} color="#fff" />
            </div>

            <div className="ac-typing">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="ac-input-form">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask for help, feedback, or drafting..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="ac-input"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="ac-send-button"
        >
          <Send size={15} />
        </button>
      </form>

      <style jsx global>{`
        .ac-shell {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          max-height: 100%;

          background: #ffffff;
          border: none;
          border-radius: inherit;
          overflow: hidden;
          color: #111827;
        }

        .ac-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;

          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
          background: #ffffff;
        }

        .ac-agent-avatar,
        .ac-message-avatar--ai {
          background: linear-gradient(135deg, #f06432 0%, #d94d28 100%);
        }

        .ac-agent-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;
        }

        .ac-agent-name {
          font-size: 13px;
          font-weight: 800;
          color: #111827;
          line-height: 1.2;
        }

        .ac-agent-status {
          margin-top: 3px;
          font-size: 11px;
          color: #22a66f;
          font-weight: 600;

          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ac-online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22a66f;
          display: inline-block;
        }

        .ac-messages {
          flex: 1 1 0;
          min-height: 0;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 16px;

          display: flex;
          flex-direction: column;
          gap: 16px;

          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;

          overscroll-behavior: contain;
          background: #fafafa;
        }

        .ac-message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .ac-message-row--user {
          flex-direction: row-reverse;
        }

        .ac-message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ac-message-avatar--user {
          background: #f3f4f6;
          color: #6b7280;
        }

        .ac-message-content {
          max-width: 78%;

          display: flex;
          flex-direction: column;
          gap: 3px;

          align-items: flex-start;
        }

        .ac-message-content--user {
          align-items: flex-end;
        }

        .ac-bubble {
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 400;
        }

        .ac-bubble--ai {
          border-radius: 4px 16px 16px 16px;

          background: #ffffff;
          color: #374151;

          border: 1px solid #e5e7eb;
        }

        .ac-bubble--user {
          border-radius: 16px 4px 16px 16px;

          background: #fff7ed;
          color: #7c2d12;

          border: 1px solid #fed7aa;
        }

        .ac-message-time {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
          padding: 0 4px;
        }

        .ac-typing {
          padding: 10px 16px;

          background: #ffffff;
          border: 1px solid #e5e7eb;

          border-radius: 4px 16px 16px 16px;

          display: flex;
          gap: 4px;
          align-items: center;
        }

        .ac-typing span {
          width: 6px;
          height: 6px;

          border-radius: 50%;
          background: #9ca3af;

          animation: ac-bounce 1.2s ease-in-out infinite;
          display: inline-block;
        }

        .ac-input-form {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 12px 16px;

          border-top: 1px solid #e5e7eb;

          flex-shrink: 0;
          background: #ffffff;
        }

        .ac-input {
          flex: 1;
          min-width: 0;

          border: 1px solid #e5e7eb;
          border-radius: 10px;

          padding: 9px 14px;

          font-size: 13px;
          color: #111827;

          outline: none;
          background: #f9fafb;

          font-family: inherit;

          transition:
            border-color 0.2s,
            box-shadow 0.2s;
        }

        .ac-input::placeholder {
          color: #9ca3af;
        }

        .ac-input:focus {
          border-color: #d96335;
          box-shadow: 0 0 0 3px rgba(217, 99, 53, 0.1);
        }

        .ac-send-button {
          width: 36px;
          height: 36px;

          border-radius: 10px;
          border: 1px solid #e5e7eb;

          flex-shrink: 0;

          background: #f3f4f6;
          color: #9ca3af;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: default;

          transition:
            background 0.2s,
            border-color 0.2s,
            color 0.2s;
        }

        .ac-send-button:not(:disabled) {
          background: #d96335;
          border-color: #d96335;
          color: #ffffff;
          cursor: pointer;
        }

        .ac-send-button:not(:disabled):hover {
          background: #c9562d;
        }

        /* =========================================================
   AGENT COACH — DARK MODE ONLY
   ========================================================= */

        [data-theme="dark"] .ac-shell {
          background: #1d2024;
          color: #f5f5f4;
        }

        [data-theme="dark"] .ac-header {
          border-bottom-color: #30343a;
          background: #202328;
        }

        [data-theme="dark"] .ac-agent-name {
          color: #f5f5f4;
        }

        [data-theme="dark"] .ac-agent-status {
          color: #45c58a;
        }

        [data-theme="dark"] .ac-online-dot {
          background: #45c58a;
        }

        [data-theme="dark"] .ac-messages {
          background: #191c20;
          scrollbar-color: #444950 transparent;
        }

        [data-theme="dark"] .ac-message-avatar--user {
          background: #30343a;
          color: #a8adb7;
        }

        [data-theme="dark"] .ac-bubble--ai {
          background: #25292e;
          color: #e7e9ec;
          border-color: #34383f;
        }

        [data-theme="dark"] .ac-bubble--user {
          background: #3a2923;
          color: #f5f5f4;
          border-color: #5c392c;
        }

        [data-theme="dark"] .ac-message-time {
          color: #777e89;
        }

        [data-theme="dark"] .ac-typing {
          background: #25292e;
          border-color: #34383f;
        }

        [data-theme="dark"] .ac-typing span {
          background: #777e89;
        }

        [data-theme="dark"] .ac-input-form {
          border-top-color: #30343a;
          background: #202328;
        }

        [data-theme="dark"] .ac-input {
          border-color: #383d44;
          color: #f5f5f4;
          background: #191c20;
        }

        [data-theme="dark"] .ac-input::placeholder {
          color: #777e89;
        }

        [data-theme="dark"] .ac-send-button {
          border-color: #383d44;
          background: #292d32;
          color: #777e89;
        }

        [data-theme="dark"] .ac-send-button:not(:disabled) {
          background: #d96335;
          border-color: #d96335;
          color: #ffffff;
        }

        @keyframes ac-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }

          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function XPToastProvider() {
  const [toast, setToast] = useState<{
    amount: number;
    isGeneric: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleXpEvent = (e: any) => {
      if (timer) clearTimeout(timer);
      setToast(e.detail);
      timer = setTimeout(() => {
        setToast(null);
      }, 4000);
    };

    window.addEventListener("xp_earned", handleXpEvent);
    return () => {
      window.removeEventListener("xp_earned", handleXpEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const message =
    toast.message ??
    (toast.amount >= 50
      ? "Great work!"
      : toast.amount > 0
        ? "Progress saved!"
        : toast.amount < 0
          ? "Reflection review"
          : "XP updated");

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        minWidth: 0,
        maxWidth: 260,
        animation: "xp-in 0.18s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          background: toast.amount < 0 ? "#dc2626" : "#f97316",
          borderRadius: 6,
          padding: "3px 8px",
          fontSize: 12,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {toast.amount < 0 ? "" : "+"}
        {toast.amount} XP
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#a1a1aa",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {message}
      </span>
      <style jsx global>{`
        @keyframes xp-in {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

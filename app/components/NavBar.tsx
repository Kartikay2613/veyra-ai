"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  GitBranch,
  Home,
  LibraryBig,
  LineChart,
  MessageCircle,
} from "lucide-react";
import ProfileButton from "./ProfileButton";
import Logo from "./Logo";
import { useAuth } from "@/app/lib/AuthContext";

const NAV = [
  ["today", "Today", "/today", Home],
  ["path", "My Path", "/path", GitBranch],
  ["skills", "Skills", "/skills", LineChart],
  ["resources", "Resources", "/resources", LibraryBig],
  ["coach", "AI Coach", "/coach", MessageCircle],
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <nav className="ai-nav">
      <div className="ai-nav-brand">
        <Logo onClick={() => router.replace("/dashboard")} />

        <span className="ai-nav-divider" />

        <span className="ai-nav-product">
          <BrainCircuit size={15} />
          Learning OS
        </span>
      </div>

      <div className="ai-nav-links">
        {NAV.map(([id, label, href, Icon]) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={id}
              href={href}
              className={active ? "ai-nav-item active" : "ai-nav-item"}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="ai-nav-right">
        <span className="adaptive-status">
          <i />
          Adaptive
        </span>

        {user && <ProfileButton />}
      </div>
    </nav>
  );
}

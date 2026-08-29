import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Caveat, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TimezoneSync from "./components/TimezoneSync";
import XPToastProvider from "./components/XPToastProvider";
import { AuthProvider } from "./lib/AuthContext";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-script" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Veyra AI — Personalized Learning OS",
  description:
    "AI-powered personalized learning paths that turn goals, skill gaps, resources, projects and feedback into an adaptive roadmap.",
  keywords: ["personalized learning", "AI learning path", "adaptive learning", "skill gap analysis", "career learning", "Veyra AI"],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  // The public site is dark-first. The Supabase proxy resets this cookie when
  // there is no authenticated session; authenticated users keep their saved
  // light/dark preference.
  const savedTheme = cookieStore.get("veyra-theme")?.value === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      data-theme={savedTheme}
      style={{ colorScheme: savedTheme }}
      suppressHydrationWarning
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <body>
        <AuthProvider>
          <TimezoneSync />
          <XPToastProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

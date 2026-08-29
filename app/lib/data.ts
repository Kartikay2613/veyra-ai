/**
 * Career Sprint — Mock Data
 * In a real app, this would be fetched from an API.
 */

export interface Task {
  day: number;
  title: string;
  description: string;
  duration: string;
  category: string;
}

export interface SprintUser {
  id: string;
  name: string;
  initials: string;
  color: string; /** avatar background color */
  daysCompleted: number;
  streak: number;
  xp: number;
  isCurrentUser?: boolean;
}

export const SPRINT_TASKS: Task[] = [
  {
    day: 1,
    title: "Define your target role",
    description:
      "Write down 3 specific job titles you're going after. Not general — exact titles recruiters post. Search LinkedIn Jobs for each right now and confirm they're actually hiring.",
    duration: "20 min",
    category: "Clarity",
  },
  {
    day: 2,
    title: "Audit your LinkedIn headline",
    description:
      "Rewrite your headline to lead with value, not your current title. Think: what does your ideal employer need solved? Lead with that.",
    duration: "15 min",
    category: "Brand",
  },
  {
    day: 3,
    title: "Resume bullet surgery",
    description:
      "Pick your top 3 resume bullets. Rewrite each with a number in it. Revenue saved, time cut, users served — something measurable.",
    duration: "30 min",
    category: "Resume",
  },
  {
    day: 4,
    title: "Find 10 target companies",
    description:
      "List 10 companies you genuinely want to work at. Not just prestige — think: culture, mission, growth stage. Research each briefly.",
    duration: "25 min",
    category: "Research",
  },
  {
    day: 5,
    title: "Send your first warm outreach",
    description:
      "Find one person at a target company you have any connection to (mutual contact, alumni, former colleague). Send a short, direct note.",
    duration: "20 min",
    category: "Network",
  },
  {
    day: 6,
    title: "Apply to 3 quality roles",
    description:
      "Not 30 — 3. Tailor the first sentence of each cover letter to the company specifically. Quality beats volume every time.",
    duration: "45 min",
    category: "Apply",
  },
  {
    day: 7,
    title: "Sharpen your 60-second pitch",
    description:
      'Write out your answer to "Tell me about yourself" — then cut it to under 90 words. Read it out loud. Does it sound like you?',
    duration: "20 min",
    category: "Interview",
  },
  {
    day: 8,
    title: "Request one referral",
    description:
      "Identify a role at a company where you know someone (even loosely). Ask them directly for a referral. Draft the message today.",
    duration: "15 min",
    category: "Network",
  },
  {
    day: 9,
    title: "Update your portfolio or samples",
    description:
      "Pick one piece of work — a project, a write-up, a design, a dashboard — and make it shareable with a clean link or PDF.",
    duration: "40 min",
    category: "Brand",
  },
  {
    day: 10,
    title: "Research your first-choice company",
    description:
      "Go deep on one target company: recent news, their product, their team page, their Glassdoor reviews. Know more than the next candidate.",
    duration: "30 min",
    category: "Research",
  },
  {
    day: 11,
    title: "Prepare 3 STAR stories",
    description:
      "Write out 3 situations using the STAR format (Situation, Task, Action, Result). These are your interview building blocks.",
    duration: "35 min",
    category: "Interview",
  },
  {
    day: 12,
    title: "Connect with 5 people in your target field",
    description:
      'Send personalized connection requests — mention something specific about their work. No generic "I\'d love to connect" messages.',
    duration: "20 min",
    category: "Network",
  },
  {
    day: 13,
    title: "Apply to 3 more roles",
    description:
      "Build on yesterday's research. Apply to 3 roles you haven't touched yet. Keep a simple log: role, company, date applied.",
    duration: "40 min",
    category: "Apply",
  },
  {
    day: 14,
    title: "Follow up on week-1 applications",
    description:
      "Any applications from days 1–7 with no response? Send a brief, confident follow-up to the hiring manager directly.",
    duration: "20 min",
    category: "Apply",
  },
  {
    day: 15,
    title: "Midpoint check-in",
    description:
      "Review what's working. Which applications got traction? Which approach opened conversations? Double down on what moved.",
    duration: "20 min",
    category: "Clarity",
  },
  {
    day: 16,
    title: "Mock interview session",
    description:
      "Record yourself answering your top 5 expected interview questions on video. Watch it back. Fix one thing you notice.",
    duration: "45 min",
    category: "Interview",
  },
  {
    day: 17,
    title: "Expand your company list",
    description:
      "Add 5 more companies — smaller, earlier stage. Less competition, more ownership, faster paths. Don't sleep on them.",
    duration: "20 min",
    category: "Research",
  },
  {
    day: 18,
    title: "Ask for an informational interview",
    description:
      "Reach out to someone in a role you're targeting. Ask for 15 minutes. Be specific about what you want to learn.",
    duration: "15 min",
    category: "Network",
  },
  {
    day: 19,
    title: "Customize your resume for a specific role",
    description:
      "Pick one job description. Mirror 3 of their keywords in your resume. Not stuffing — actual matching of language.",
    duration: "30 min",
    category: "Resume",
  },
  {
    day: 20,
    title: "Apply to 5 roles today",
    description:
      "High-volume day. Apply to 5 solid-fit roles. You've got the templates now — execute with quality and speed.",
    duration: "60 min",
    category: "Apply",
  },
  {
    day: 21,
    title: "Strengthen one weak area",
    description:
      "Identify one gap in your candidacy (a skill, a story, a tool). Spend an hour making it less weak. Not perfect — less weak.",
    duration: "60 min",
    category: "Clarity",
  },
  {
    day: 22,
    title: "Re-engage a dormant contact",
    description:
      "Think of someone you haven't spoken to in 6+ months who works somewhere relevant. Send a genuine check-in. No agenda upfront.",
    duration: "15 min",
    category: "Network",
  },
  {
    day: 23,
    title: "Negotiate research",
    description:
      "Look up salary ranges for your target roles on Levels.fyi, Glassdoor, and LinkedIn. Know your number before an offer arrives.",
    duration: "25 min",
    category: "Clarity",
  },
  {
    day: 24,
    title: "Prepare for technical questions",
    description:
      "List 5 technical or role-specific questions you could be asked. Draft clear answers. If it's a technical role, practice one problem.",
    duration: "40 min",
    category: "Interview",
  },
  {
    day: 25,
    title: "Follow up on week-2 applications",
    description:
      "Check your application log. Any from days 8–14 without a response? Send a polite, two-sentence follow-up.",
    duration: "15 min",
    category: "Apply",
  },
  {
    day: 26,
    title: "Write one genuine LinkedIn post",
    description:
      "Share something you've learned, built, or observed in your field. No performance — just useful. Recruiters will see it.",
    duration: "20 min",
    category: "Brand",
  },
  {
    day: 27,
    title: "Apply to 3 stretch roles",
    description:
      "You meet 70% of the requirements. Apply anyway. Confidence is part of the application. Your cover letter closes the gap.",
    duration: "35 min",
    category: "Apply",
  },
  {
    day: 28,
    title: "Prepare 5 questions to ask interviewers",
    description:
      'Write 5 genuine questions that show you\'ve done your homework. Avoid "what does a typical day look like" — go deeper.',
    duration: "20 min",
    category: "Interview",
  },
  {
    day: 29,
    title: "Gratitude and relationship maintenance",
    description:
      "Send a thank-you or check-in to 3 people who've helped you this sprint — referrals, feedback, intros. Keep these relationships warm.",
    duration: "20 min",
    category: "Network",
  },
  {
    day: 30,
    title: "Sprint retrospective",
    description:
      "Review everything: applications sent, conversations started, responses received, interviews booked. Write down your 3 biggest moves and what comes next.",
    duration: "30 min",
    category: "Clarity",
  },
];

/** Mood values 1–5 for the last 14 days (most recent last) */
export const MOCK_MOOD_HISTORY: number[] = [
  3, 4, 3, 5, 4, 3, 4, 5, 3, 4, 4, 5, 4, 3,
];

export const MOOD_OPTIONS = [
  { value: 1, label: "Rough" },
  { value: 2, label: "Meh" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Fired up" },
] as const;

export const ONBOARDING_STEPS = [
  {
    id: "role",
    question: "What role are you targeting?",
    options: [
      "Software Engineer",
      "Product Manager",
      "Designer",
      "Data Scientist",
      "Marketing",
      "Finance / Ops",
      "Lawyer",
      "Other",
    ],
  },
  {
    id: "experience",
    question: "How much experience do you have?",
    options: [
      "Just starting out (0–2 years)",
      "Mid-level (3–6 years)",
      "Senior (7–12 years)",
      "Leadership (12+ years)",
    ],
  },
  {
    id: "goal",
    question: "What's your main goal?",
    options: [
      "Land my first full-time role",
      "Switch industries entirely",
      "Level up to a senior position",
      "Get back into the workforce",
      "Find something better-paying",
      "Relocate or go remote",
    ],
  },
  {
    id: "urgency",
    question: "How fast do you need to move?",
    options: [
      "I need a job within a month",
      "I have 1–3 months",
      "I'm being thoughtful — no rush",
      "I'm exploring options",
    ],
  },

  {
    id: "time_period",
    question: "How long do you want your sprint to be?",
    options: [
      "7 days — Quick burst",
      "14 days — Two weeks",
      "21 days — Three weeks",
      "30 days — Full sprint",
      "60 days — Two months",
      "90 days — Full quarter",
    ],
  },

  {
    id: "progress_mode",
    question: "How would you like to progress through your sprint?",
    options: [
      "Daily Sprint — One task per calendar day",
      "Checkpoint Sprint — Continue until each task is finished",
    ],
  },
] as const;

export const ROLE_SUB_OPTIONS: Record<string, string[]> = {
  "Software Engineer": [
    "Frontend Engineer",
    "Backend Engineer",
    "Full-Stack Engineer",
    "Mobile (iOS / Android)",
    "DevOps / Platform",
    "ML / AI Engineer",
    "Embedded / Systems",
  ],
  "Product Manager": [
    "Consumer Product",
    "B2B / Enterprise PM",
    "Technical PM",
    "Growth PM",
    "Platform PM",
  ],
  Designer: [
    "Product / UX Designer",
    "UI / Visual Designer",
    "Brand & Identity",
    "Motion Designer",
    "Design Systems",
  ],
  "Data Scientist": [
    "Data Analyst",
    "ML Engineer",
    "Business Intelligence",
    "Research Scientist",
    "Data Engineer",
  ],
  Marketing: [
    "Growth / Performance",
    "Content Marketing",
    "Brand Marketing",
    "Product Marketing",
    "SEO / Organic",
  ],
  "Finance / Ops": [
    "Financial Analyst",
    "Investment Banking",
    "VC / Private Equity",
    "Operations Manager",
    "Strategy & Consulting",
  ],
  Lawyer: [
    "Corporate / M&A",
    "Criminal Defense",
    "Civil Litigation",
    "IP / Patent Law",
    "Employment Law",
    "Real Estate Law",
    "Tax Law",
    "Family Law",
  ],
  Other: [
    "Entrepreneur / Founder",
    "Sales",
    "HR / People Ops",
    "Customer Success",
    "Healthcare",
    "Education",
  ],
};

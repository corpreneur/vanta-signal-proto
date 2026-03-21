import {
  Zap,
  Brain,
  Layers,
  Bell,
  Users,
  FileEdit,
  Mail,
  Share2,
  Mic,
  ArrowRight,
  BarChart3,
  BookOpen,
  TrendingUp,
  Workflow,
  Timer,
} from "lucide-react";

/* ── Forced light-mode Vanta B/W palette ── */
const L = {
  bg: "hsl(0 0% 100%)",
  card: "hsl(0 0% 96%)",
  fg: "hsl(0 0% 5%)",
  muted: "hsl(30 4% 46%)",
  accent: "hsl(30 4% 18%)",
  border: "hsl(0 0% 90%)",
  primary: "hsl(30 4% 18%)",
};

/* ── Feature definitions ── */

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
}

interface DropSection {
  version: string;
  date: string;
  headline: string;
  tagline: string;
  narrative: string;
  features: Feature[];
  whyItMatters: string;
}

const SECTIONS: DropSection[] = [
  {
    version: "v2.3.0",
    date: "March 21 2026",
    headline: "Feedback-to-Sprint Pipeline & Intelligence Snapshot",
    tagline: "Strategic feedback becomes sprint-ready tasks — automatically, every morning.",
    narrative:
      "Version 2.3 closes the gap between product feedback and execution. A daily cron job reads every new feedback entry, sends it through Gemini Flash for AI triage, and creates structured sprint items with priority, effort, and phase assignments. Meanwhile, the Signal Feed gets a value-first reframe: stats move to the bottom as an animated Intelligence Snapshot that counts up from zero — reinforcing the value extracted, not noise remaining.",
    features: [
      { icon: Workflow, title: "Feedback → Sprint Cron", desc: "Daily AI triage reads unprocessed feedback, extracts actionable tasks with priority, effort, and sprint phase via Gemini Flash." },
      { icon: BarChart3, title: "Sprint Items Table", desc: "Structured backlog linked back to source feedback — priority (high/med/low), effort (small/med/large), phase (1/2/3)." },
      { icon: TrendingUp, title: "Intelligence Snapshot", desc: "Collapsible footer with animated count-up stats: signals captured, high-strength, actions fired, noise filtered." },
      { icon: BookOpen, title: "Quick Reference Card", desc: "Collapsible guide at the top of /feedback explaining all capabilities — submit, auto-scrape, AI analysis, sprint pipeline." },
      { icon: Timer, title: "Count-Up Animations", desc: "Reusable use-count-up hook with cubic ease-out for numeric transitions that reinforce value accumulation." },
    ],
    whyItMatters:
      "Feedback tools capture input. Sprint tools track output. This release connects them — so nothing said in a feedback session gets lost before it reaches the board.",
  },
  {
    version: "v2.2.0",
    date: "March 20 2026",
    headline: "Ultra-Crisp Dashboard & Meeting Data Population",
    tagline: "A tighter dashboard, richer meeting data, and a real executive brief.",
    narrative:
      "Version 2.2 strips the dashboard to its essentials — a compact inline stat strip replaces the bulky stats block — while loading the database with production-quality meeting data. Twelve speaker profiles, multi-turn transcripts, and six pre-meeting briefs make the prototype feel like a lived-in product.",
    features: [
      { icon: Zap, title: "Streamlined Dashboard", desc: "Compact inline stat strip showing signal counts, high-priority count, and per-channel icon counts." },
      { icon: Users, title: "Full Speaker Profiles", desc: "12 speaker identities with email, aliases, and meeting counts linked to all 13 meeting signals." },
      { icon: Mic, title: "Rich Transcripts", desc: "All meeting signals now have realistic speaker-attributed multi-turn conversation transcripts." },
      { icon: Brain, title: "Pre-Meeting Briefs", desc: "6 briefs with attendee context, talking points, and narrative dossiers for upcoming meetings." },
    ],
    whyItMatters:
      "A prototype is only convincing when the data is real enough to demonstrate the experience — not just the interface.",
  },
  {
    version: "v2.1.0",
    date: "March 20 2026",
    headline: "Signal Brief & Context Layer",
    tagline: "Your morning intelligence briefing — personalised to the deal, client, or venture that matters right now.",
    narrative:
      "The Signal Brief is a single card on your dashboard that distills overnight activity into a headline, trend indicators, and a narrative summary. Pair it with the Context Layer — a lightweight onboarding flow that lets you define up to five business contexts (client, project, income stream) — and the brief reshapes itself around whatever you're focused on today.",
    features: [
      { icon: Brain, title: "Signal Brief Card", desc: "Headline stat tiles with trend arrows and a one-paragraph narrative, refreshed every morning." },
      { icon: Layers, title: "Context Layer Setup", desc: "3-step onboarding to define business contexts — client, project, or income stream — with primary focus selection." },
      { icon: Zap, title: "Context Switcher", desc: "Compact dropdown on the brief card to toggle between active contexts in one tap." },
      { icon: Bell, title: "Delivery Preferences", desc: "Configure brief delivery via Push, SMS, or Email with time-of-day picker and timezone detection." },
    ],
    whyItMatters:
      "Most relationship tools make you hunt for information. The Signal Brief delivers it — scoped to the context that matters — before you've opened your inbox.",
  },
  {
    version: "v2.0.0",
    date: "March 20 2026",
    headline: "Meeting Intelligence — Speaker Memory & Distribution",
    tagline: "Every meeting, every voice, every decision — captured, attributed, and ready to share.",
    narrative:
      "Version 2.0 closes the loop on meeting intelligence. Speaker profiles now persist across meetings, building a cumulative memory of who said what and how often. Transcripts are editable inline. And when the meeting ends, a single tap generates an executive summary — powered by Gemini 2.5 Flash — and distributes it to attendees via email or clipboard.",
    features: [
      { icon: Users, title: "Speaker Memory Registry", desc: "Persistent speaker profiles with aliases, emails, and cumulative meeting counts across all sources." },
      { icon: Mic, title: "Meeting Speakers Tracking", desc: "Per-meeting turn counts linked to speaker profiles for participation analysis." },
      { icon: FileEdit, title: "Inline Transcript Editing", desc: "Edit summary and source message directly in the Signal Detail Drawer with save/cancel controls." },
      { icon: Mail, title: "Meeting Summary Email", desc: "AI-generated executive summary with takeaways, action items, and next steps — one tap to send." },
      { icon: Share2, title: "Share & Distribute", desc: "Copy formatted notes to clipboard or open a pre-filled mailto addressed to all attendees." },
    ],
    whyItMatters:
      "Meetings generate the highest-density signals in any relationship. Capturing speaker identity and distributing summaries instantly turns a 30-minute call into a persistent, searchable asset.",
  },
];

/* ── How-it-works steps ── */
const STEPS = [
  { n: "01", title: "Feedback is captured", desc: "Julian and JG submit observations, ChatGPT links, and screenshots via the Feedback Backlog. Links are auto-scraped and AI-analyzed on submission." },
  { n: "02", title: "AI triages overnight", desc: "A daily cron reads new feedback entries, extracts actionable tasks, and assigns priority, effort, and sprint phase via Gemini Flash." },
  { n: "03", title: "Sprint items are created", desc: "Structured tasks land in the sprint_items table — linked to their source feedback — ready for the board." },
  { n: "04", title: "Signals are captured", desc: "Meetings, calls, emails, and messages flow in from connected sources. Speaker identities are matched and persisted." },
  { n: "05", title: "Intelligence is distilled", desc: "The Signal Brief compresses activity into a headline, trend tiles, and a narrative — scoped to your active context." },
  { n: "06", title: "You act, not search", desc: "The Intelligence Snapshot shows value extracted. The morning brief tells you what changed. Sprint items tell you what to build next." },
];

/* ── Component ── */

export default function LatestFeatures() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 py-10 space-y-16"
      style={{ background: L.bg, color: L.fg }}
    >
      {/* Page header */}
      <header className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: L.accent }}>
          Latest Drop · v2.0 – v2.3
        </p>
        <h1 className="font-display text-[28px] sm:text-[36px] font-extrabold leading-[1.1] tracking-tight" style={{ color: L.fg }}>
          Feedback Pipeline, Intelligence Snapshot & Meeting Intelligence
        </h1>
        <p className="font-sans text-[15px] leading-relaxed max-w-xl" style={{ color: L.muted }}>
          Four releases, one thesis: intelligence should flow from capture to sprint board to morning brief — without you lifting a finger.
        </p>
      </header>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <section key={section.version} className="space-y-8">
          <div className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: L.muted }}>
              {section.version} · {section.date}
            </p>
            <h2 className="font-display text-[22px] font-bold" style={{ color: L.fg }}>
              {section.headline}
            </h2>
            <p className="font-sans text-[14px] italic" style={{ color: L.muted }}>
              {section.tagline}
            </p>
          </div>

          <p className="font-sans text-[14px] leading-relaxed" style={{ color: L.muted }}>
            {section.narrative}
          </p>

          {/* Feature cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {section.features.map((f) => (
              <div
                key={f.title}
                className="p-4 space-y-2"
                style={{ background: L.card, border: `1px solid ${L.border}` }}
              >
                <div className="flex items-center gap-2">
                  <f.icon className="h-4 w-4 shrink-0" style={{ color: L.accent }} />
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold" style={{ color: L.fg }}>
                    {f.title}
                  </span>
                </div>
                <p className="font-sans text-[13px] leading-relaxed" style={{ color: L.muted }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Pull quote */}
          <blockquote className="pl-4 py-2" style={{ borderLeft: `2px solid ${L.accent}` }}>
            <p className="font-sans text-[13px] italic leading-relaxed" style={{ color: L.fg }}>
              {section.whyItMatters}
            </p>
          </blockquote>
        </section>
      ))}

      {/* How it works */}
      <section className="space-y-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: L.muted }}>
          How it works
        </p>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-4">
              <span className="font-mono text-[11px] shrink-0 mt-0.5 w-5" style={{ color: L.accent }}>
                {step.n}
              </span>
              <div>
                <p className="font-sans text-[13px] font-bold mb-1" style={{ color: L.fg }}>
                  {step.title}
                </p>
                <p className="font-sans text-[13px] leading-relaxed" style={{ color: L.muted }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: L.accent }}>
        <span>Explore the Signal Feed</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

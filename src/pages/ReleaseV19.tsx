import {
  Zap,
  Mail,
  CalendarPlus,
  Clock,
  MessageSquare,
  StickyNote,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ── Forced light-mode Vanta B/W palette ── */
const L = {
  bg: "hsl(0 0% 100%)",
  card: "hsl(0 0% 96%)",
  fg: "hsl(0 0% 5%)",
  muted: "hsl(30 4% 46%)",
  accent: "hsl(30 4% 18%)",
  border: "hsl(0 0% 90%)",
};

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Quick Actions Grid",
    desc: "6-tile launcher at the top of Easy Actions — New Note, Draft Email, Calendar Invite, Voice Memo, Send Message, Set Reminder.",
  },
  {
    icon: Mail,
    title: "Draft Email Sheet",
    desc: "Compose and send via Linq with To, Subject, and Body fields — no context switching required.",
  },
  {
    icon: CalendarPlus,
    title: "Calendar Invite Sheet",
    desc: "Create meetings with title, date/time, duration picker, and attendees directly into your calendar.",
  },
  {
    icon: Clock,
    title: "Set Reminder Sheet",
    desc: "Quick-date presets (Tomorrow, 3 days, 1 week, 2 weeks) with optional contact and note for follow-up tracking.",
  },
  {
    icon: MessageSquare,
    title: "Send Message Sheet",
    desc: "Compose and send SMS or iMessage via Linq integration — keeping the communication trail inside Vanta Signal.",
  },
  {
    icon: StickyNote,
    title: "Unified Action Surface",
    desc: "Easy Actions now supports both triage (existing signals) and initiation (new actions) in a single, cohesive surface.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Open Easy Actions",
    desc: "Navigate to the Easy Actions hub from the Fab Five bar — the Quick Actions grid sits at the top of the page.",
  },
  {
    n: "02",
    title: "Choose an action",
    desc: "Tap any of the six tiles to open a purpose-built bottom sheet for that action type — no menus, no hunting.",
  },
  {
    n: "03",
    title: "Fill and fire",
    desc: "Each sheet is pre-scoped with sensible defaults. Fill in the details and submit. The action is recorded as a signal and routed accordingly.",
  },
  {
    n: "04",
    title: "Continue triaging",
    desc: "After initiating, the existing signal queue is right below. Triage and initiate in one flow — no surface switching.",
  },
];

export default function ReleaseV19() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 py-10 space-y-16"
      style={{ background: L.bg, color: L.fg }}
    >
      {/* Back link */}
      <Link
        to="/releases"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70"
        style={{ color: L.muted }}
      >
        <ArrowLeft className="h-3 w-3" /> All Releases
      </Link>

      {/* Page header */}
      <header className="space-y-3">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: L.accent }}
        >
          v1.9.0 · March 19 2026
        </p>
        <h1
          className="font-display text-[28px] sm:text-[36px] font-extrabold leading-[1.1] tracking-tight"
          style={{ color: L.fg }}
        >
          Quick Actions — Initiate from the Action Queue
        </h1>
        <p
          className="font-sans text-[15px] leading-relaxed max-w-xl"
          style={{ color: L.muted }}
        >
          Until now, Easy Actions was purely reactive — a triage surface for
          existing signals. v1.9 turns it into a launchpad. Six purpose-built
          sheets let you draft, schedule, remind, and message without ever
          leaving the action queue.
        </p>
      </header>

      {/* Narrative section */}
      <section className="space-y-6">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: L.muted }}
        >
          The story
        </p>
        <p
          className="font-sans text-[14px] leading-relaxed"
          style={{ color: L.muted }}
        >
          Relationship management is a two-sided coin: you need to process
          what's coming in <em>and</em> initiate what needs to go out. Before
          v1.9, initiating an email, a calendar invite, or a reminder meant
          context-switching to a different app. Now, the six most common
          outbound actions sit at the top of Easy Actions as a compact grid.
          Each tile opens a purpose-built bottom sheet — pre-scoped, minimal
          friction, zero navigation. The action is captured as a signal, keeping
          your outbound activity in the same intelligence stream as your inbound
          data.
        </p>
      </section>

      {/* Feature cards */}
      <section className="space-y-6">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: L.muted }}
        >
          What shipped
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-4 space-y-2"
              style={{
                background: L.card,
                border: `1px solid ${L.border}`,
              }}
            >
              <div className="flex items-center gap-2">
                <f.icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: L.accent }}
                />
                <span
                  className="font-mono text-[11px] uppercase tracking-wider font-bold"
                  style={{ color: L.fg }}
                >
                  {f.title}
                </span>
              </div>
              <p
                className="font-sans text-[13px] leading-relaxed"
                style={{ color: L.muted }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <blockquote
        className="pl-4 py-2"
        style={{ borderLeft: `2px solid ${L.accent}` }}
      >
        <p
          className="font-sans text-[13px] italic leading-relaxed"
          style={{ color: L.fg }}
        >
          The best action surface is the one you're already looking at. By
          co-locating initiation and triage, v1.9 eliminates the most common
          reason people leave the app — "I need to send a quick thing."
        </p>
      </blockquote>

      {/* How it works */}
      <section className="space-y-6">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: L.muted }}
        >
          How it works
        </p>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-4">
              <span
                className="font-mono text-[11px] shrink-0 mt-0.5 w-5"
                style={{ color: L.accent }}
              >
                {step.n}
              </span>
              <div>
                <p
                  className="font-sans text-[13px] font-bold mb-1"
                  style={{ color: L.fg }}
                >
                  {step.title}
                </p>
                <p
                  className="font-sans text-[13px] leading-relaxed"
                  style={{ color: L.muted }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <Link
          to="/focus"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider transition-colors hover:opacity-70"
          style={{ color: L.accent }}
        >
          <span>Open Easy Actions</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/releases"
          className="font-mono text-[10px] uppercase tracking-wider transition-colors hover:opacity-70"
          style={{ color: L.muted }}
        >
          Back to releases
        </Link>
      </div>
    </div>
  );
}

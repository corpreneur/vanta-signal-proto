import { useParams, Navigate } from "react-router-dom";
import { MessageSquare, Lightbulb, TrendingUp, Gavel, FileText, Video, Phone, Volume2 } from "lucide-react";
import type { SignalType } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";

interface ProductDef {
  type: SignalType;
  label: string;
  icon: React.ElementType;
  tagline: string;
  channels: string[];
  narrative: string[];
  howItWorks: { step: string; desc: string }[];
  signalExamples: string[];
  whyItMatters: string;
}

const PRODUCTS: Record<string, ProductDef> = {
  intro: {
    type: "INTRO",
    label: "Introductions",
    icon: MessageSquare,
    tagline: "Every introduction is a future relationship — or a missed one.",
    channels: ["iMessage via Linq", "Email via Gmail", "Manual"],
    narrative: [
      "The most valuable thing a creative entrepreneur receives is an introduction. Not a lead — an introduction. Someone with trust and access putting their name behind a connection.",
      "Vanta captures every introduction across iMessage and email, classifies the strategic relevance, researches the person being introduced, and prepares a contextual brief — all before you read the message.",
      "The result: you never walk into an intro cold. You know who they are, what they've done, and why this connection matters.",
    ],
    howItWorks: [
      { step: "Detection", desc: "AI identifies introduction patterns in message text — warm intros, CC intros, forwarded intros." },
      { step: "Bio Research", desc: "Automated research on the introduced party — LinkedIn, company, recent press, shared connections." },
      { step: "Brief Compile", desc: "A structured brief is generated with talking points, strategic relevance, and suggested first response." },
      { step: "Auto-Response", desc: "High-priority introductions trigger an immediate acknowledgment via Linq — within 90 seconds." },
    ],
    signalExamples: [
      "Steve introduces you to a VP of Partnerships at a media company via iMessage",
      "An investor forwards a warm intro email to a potential advisor",
      "A contact CCs you into a thread with someone they think you should meet",
    ],
    whyItMatters: "Introductions compound. Every one you respond to quickly and thoughtfully increases your surface area. Every one you miss or delay degrades trust in the person who made it.",
  },
  insight: {
    type: "INSIGHT",
    label: "Insight Engine",
    icon: Lightbulb,
    tagline: "Frameworks, observations, and perspectives with reuse value — captured before they fade.",
    channels: ["iMessage via Linq", "Email via Gmail", "Zoom via Recall", "Phone via MVNO"],
    narrative: [
      "Creative entrepreneurs don't just exchange information — they generate frameworks. In a single conversation, someone might articulate a positioning model, a market thesis, or a mental model that has real intellectual capital value.",
      "The problem is these insights are ephemeral. They surface in conversations and disappear. A week later, you remember the feeling of the insight but not its structure.",
      "Vanta's Insight Engine captures frameworks, observations, and novel perspectives across every channel and stores them as persistent, searchable intelligence — attributed to the speaker, timestamped, and tagged.",
    ],
    howItWorks: [
      { step: "Pattern Match", desc: "AI identifies insight patterns — mental models, analogies, frameworks, positioning language, contrarian takes." },
      { step: "Extract + Attribute", desc: "The insight is extracted verbatim or paraphrased, attributed to the speaker, and contextualised." },
      { step: "Persistent Store", desc: "Logged as a searchable signal with source, timestamp, and cross-referenced against prior insights from the same contact." },
      { step: "Resurface", desc: "Insights are resurfaced in pre-meeting briefs when the original speaker is an attendee." },
    ],
    signalExamples: [
      "A mentor articulates a 'creative-leverage' framework for pricing consulting work",
      "An investor shares a thesis on why vertical SaaS is outperforming horizontal in 2026",
      "A collaborator describes a content distribution model you haven't considered",
    ],
    whyItMatters: "The difference between a good operator and a great one is the ability to recall and apply the right framework at the right moment. Vanta makes that recall automatic.",
  },
  investment: {
    type: "INVESTMENT",
    label: "Investment Intelligence",
    icon: TrendingUp,
    tagline: "Capital signals detected, decoded, and surfaced before the round closes.",
    channels: ["iMessage via Linq", "Email via Gmail", "Zoom via Recall", "Phone via MVNO"],
    narrative: [
      "Investment conversations are high-stakes and high-velocity. Terms, timelines, partner names, allocation windows — they surface in passing and get lost in the noise of everything else.",
      "Vanta treats every investment-related signal as a first-class data object. When someone mentions a fund, a check size, a timeline, or a strategic allocation decision, it's captured, classified, and linked to the relationship graph.",
      "The goal isn't to replace your fundraising process — it's to make sure you never lose a data point that matters to your capital strategy.",
    ],
    howItWorks: [
      { step: "Keyword + Context", desc: "AI detects investment language — fund names, check sizes, round stages, allocation timelines, partner references." },
      { step: "Thesis Analysis", desc: "Extracted signal is analysed for strategic relevance to your current fundraising or allocation priorities." },
      { step: "Pipeline Update", desc: "Automatically logged against the investor contact in the relationship graph." },
      { step: "Alert", desc: "High-priority investment signals trigger an immediate notification." },
    ],
    signalExamples: [
      "An investor mentions they're 'looking at Q3 for allocation decisions' on a call",
      "A contact forwards an email with term sheet language from a competing offer",
      "A board member mentions NEA's interest in your vertical during a Zoom sync",
    ],
    whyItMatters: "Capital markets move on information asymmetry. The entrepreneur who captures and acts on investment signals fastest has a structural advantage.",
  },
  decision: {
    type: "DECISION",
    label: "Decision Capture",
    icon: Gavel,
    tagline: "Choices made, agreed upon, and tracked — so nothing falls through.",
    channels: ["iMessage via Linq", "Email via Gmail", "Zoom via Recall", "Phone via MVNO"],
    narrative: [
      "Decisions are the highest-signal events in any conversation. They represent commitments, direction changes, and resource allocation choices. But most decisions are made verbally and never formalised.",
      "Vanta captures every decision across every channel — who made it, who was present, what was agreed, and what follow-up was implied. Decisions are linked to the contacts involved and tracked until resolved.",
    ],
    howItWorks: [
      { step: "Decision Detection", desc: "AI identifies decision language — 'let's go with', 'agreed', 'we'll do X', 'decision is to'." },
      { step: "Attribution", desc: "Decision is attributed to the decision-maker(s) and witnesses." },
      { step: "Tracking", desc: "Logged as an open decision until marked as executed or superseded." },
      { step: "Brief Integration", desc: "Unresolved decisions resurface in pre-meeting briefs with relevant participants." },
    ],
    signalExamples: [
      "A partner says 'Let's go with the three-year exclusive' on a phone call",
      "Your team agrees to prioritise eSIM provisioning over API rate limiting in a standup",
      "An investor confirms they'll lead the round at a specific valuation",
    ],
    whyItMatters: "Organisations don't fail because they make bad decisions — they fail because decisions get made and nobody tracks them. Vanta closes the loop.",
  },
  context: {
    type: "CONTEXT",
    label: "Context Layer",
    icon: FileText,
    tagline: "Background information that enriches everything else — without creating noise.",
    channels: ["iMessage via Linq", "Email via Gmail", "Zoom via Recall"],
    narrative: [
      "Not everything is a high-priority signal. Some messages are context — background information, market colour, status updates, or general observations that don't require action but enrich your understanding of a situation or relationship.",
      "Vanta captures context signals silently. They don't trigger alerts or actions. But they're indexed, searchable, and automatically surfaced when the person or topic comes up again in a higher-priority signal.",
    ],
    howItWorks: [
      { step: "Triage", desc: "Haiku classifies the message as context — valuable but not actionable." },
      { step: "Silent Log", desc: "Stored with full attribution and source metadata." },
      { step: "Cross-Reference", desc: "Linked to the sender's profile in the relationship graph." },
      { step: "Resurface", desc: "Appears in pre-meeting briefs and contact profiles when relevant." },
    ],
    signalExamples: [
      "A contact shares an article about a market trend you're already tracking",
      "Someone mentions they're relocating to a new city in passing",
      "A status update on a project that's proceeding as expected",
    ],
    whyItMatters: "The best operators have context that others don't. Vanta makes sure nothing enriching is ever lost — it's just quietly stored until it's needed.",
  },
  meeting: {
    type: "MEETING",
    label: "Zoom Meetings",
    icon: Video,
    tagline: "Every meeting is an intelligence event — not just a calendar block.",
    channels: ["Zoom via Recall.ai", "Google Calendar"],
    narrative: [
      "Meetings are where decisions crystallise and commitments are made in front of witnesses. But most meeting intelligence is lost — trapped in partial notes, forgotten by the next meeting, or never shared with people who need it.",
      "Vanta's Recall.ai integration captures the full transcript with speaker diarisation, runs the same two-stage AI pipeline, and generates a structured summary within minutes of the call ending. Pre-meeting briefs are generated automatically from the calendar and signal history.",
    ],
    howItWorks: [
      { step: "Calendar Sync", desc: "Google Calendar integration detects upcoming meetings and attendee lists." },
      { step: "Pre-Meeting Brief", desc: "Cross-references attendees against signal history — surfaces past interactions, open commitments, and relevant context." },
      { step: "Live Capture", desc: "Recall.ai bot joins the Zoom meeting, transcribes in real-time with speaker attribution." },
      { step: "Post-Meeting Signal", desc: "Transcript processed through AI pipeline — decisions, commitments, insights, and action items extracted and logged." },
    ],
    signalExamples: [
      "A weekly product sync where the team decides to move FMC to pilot",
      "An investor meeting where Series A positioning is discussed and a framework is adopted",
      "A design review where UI decisions are made about the signal feed layout",
    ],
    whyItMatters: "Meetings are the highest-bandwidth communication channel. Treating them as intelligence events — with pre-briefs, live capture, and post-processing — means you extract maximum value from every one.",
  },
  "phone-call": {
    type: "PHONE_CALL",
    label: "Native Phone",
    icon: Phone,
    tagline: "The call is the signal — captured at the network level with zero friction.",
    channels: ["Native Dialer via Vanta MVNO", "ConnectX CDR"],
    narrative: [
      "The phone call is the highest-density, most systematically ignored communication channel in a creative entrepreneur's day. Client conversations, partner calls, investor discussions, deal negotiations — every one generates commitments, decisions, and relationship signals with real commercial value.",
      "Vanta doesn't ask you to use an app. It owns the infrastructure. When you place or receive a call from your native dialer, Vanta's MVNO captures the audio at the SIP level, transcribes it via Whisper, and runs the same AI classification pipeline used for every other channel.",
      "Five phone-specific tags surface uniquely from call context: commitment, decision, open_question, relationship_signal, and deal_signal. These are the signals that get lost in every other system.",
    ],
    howItWorks: [
      { step: "eSIM Provisioning", desc: "User is provisioned a Vanta eSIM via ConnectX — native endpoint on Vanta's network." },
      { step: "CDR Trigger", desc: "Call ends → ConnectX generates a CDR event with parties, duration, and timestamp." },
      { step: "Transcription", desc: "Call audio routed through SIP recording layer → Whisper transcription with speaker diarisation." },
      { step: "Signal Detection", desc: "Transcript processed through two-stage pipeline with phone-specific tag extraction." },
      { step: "Delivery", desc: "Signal logged, iMessage summary ping sent within 10 minutes of call end." },
    ],
    signalExamples: [
      "A partner commits to licensing terms on a 12-minute call — commitment + deal_signal extracted",
      "An advisor raises an unresolved API issue — open_question flagged for follow-up",
      "A contact offers to formalise an advisory role — relationship_signal + commitment detected",
    ],
    whyItMatters: "Infrastructure is the moat. Every system that asks users to change their calling behavior fails under pressure. Vanta captures every call because it owns the pipe.",
  },
  noise: {
    type: "NOISE",
    label: "Noise Filter",
    icon: Volume2,
    tagline: "Not everything is signal — and knowing the difference is the product.",
    channels: ["All channels"],
    narrative: [
      "The hardest problem in intelligence isn't capture — it's discrimination. The difference between a system that helps and one that overwhelms is the ability to identify noise and suppress it without losing anything that matters.",
      "Vanta's Haiku triage stage classifies low-signal content as NOISE within milliseconds. These messages are silently logged but never surfaced in the feed, never trigger alerts, and never create action items. They exist in the archive for completeness, but they don't compete for your attention.",
    ],
    howItWorks: [
      { step: "Haiku Triage", desc: "First-pass classification identifies low-signal content — greetings, status confirmations, social pleasantries." },
      { step: "Silent Log", desc: "Noise is stored with full metadata but flagged as suppressed." },
      { step: "No Surface", desc: "Does not appear in the signal feed, briefs, or alerts." },
      { step: "Recoverable", desc: "If a future signal from the same sender references this conversation, the context can be recovered." },
    ],
    signalExamples: [
      "A 'thanks!' reply to an email thread that's already been processed",
      "A routine 'checking in' message with no new information",
      "A declined calendar invite with no additional context",
    ],
    whyItMatters: "Signal-to-noise ratio is the product. Every piece of noise that reaches the user erodes trust in the system. Vanta earns trust by knowing what not to show you.",
  },
};

export default function ProductSignalPage() {
  const { signalType } = useParams<{ signalType: string }>();
  const product = signalType ? PRODUCTS[signalType] : undefined;

  if (!product) return <Navigate to="/" replace />;

  const colors = SIGNAL_TYPE_COLORS[product.type];

  return (
      <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10 md:py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <product.icon className={`w-6 h-6 ${colors.text}`} />
          <span className={`inline-block px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${colors.text} ${colors.bg} ${colors.border}`}>
            {product.type}
          </span>
        </div>
        <h1 className="font-display text-[clamp(28px,5vw,44px)] text-foreground mb-2 leading-tight">
          {product.label}
        </h1>
        <p className="font-sans text-[15px] text-vanta-text-mid leading-relaxed mb-10 max-w-lg italic">
          {product.tagline}
        </p>

        {/* Channels */}
        <div className="flex flex-wrap gap-2 mb-10">
          {product.channels.map((ch) => (
            <span key={ch} className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-2 py-1">
              {ch}
            </span>
          ))}
        </div>

        {/* Narrative */}
        <section className="mb-12">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
            Product Narrative
          </p>
          {product.narrative.map((p, i) => (
            <p key={i} className="font-sans text-[14px] text-vanta-text-mid leading-relaxed mb-4">
              {p}
            </p>
          ))}
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
            How It Works
          </p>
          <div className="border border-vanta-border">
            {product.howItWorks.map((step, i) => (
              <div key={step.step} className={`flex items-start gap-4 p-4 ${i > 0 ? "border-t border-vanta-border-mid" : ""} ${i === 0 ? `${colors.bg}` : "bg-card"}`}>
                <span className={`font-mono text-[11px] font-bold w-5 shrink-0 pt-0.5 ${i === 0 ? colors.text : "text-vanta-text-muted"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-sans text-[13px] font-bold text-foreground">{step.step}</p>
                  <p className="font-mono text-[10px] text-vanta-text-low mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Signal Examples */}
        <section className="mb-12">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
            Signal Examples
          </p>
          <div className="space-y-2">
            {product.signalExamples.map((ex, i) => (
              <div key={i} className={`p-3 border ${colors.border} ${colors.bg}`}>
                <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{ex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why It Matters */}
        <section className="mb-12">
          <div className={`border-l-2 pl-5 ${colors.border}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2 ${colors.text}">
              Why It Matters
            </p>
            <p className="font-display text-[17px] italic text-foreground leading-relaxed">
              "{product.whyItMatters}"
            </p>
          </div>
        </section>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className={`font-mono text-[9px] uppercase tracking-[0.15em] border px-2 py-1 ${colors.text} ${colors.border}`}>
            {product.type}
          </span>
          {product.channels.map((ch) => (
            <span key={ch} className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-2 py-1">
              {ch.split(" via ")[0]}
            </span>
          ))}
        </div>
      </div>
  );
}

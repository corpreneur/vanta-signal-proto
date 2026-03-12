import { Phone, Radio, Zap, GitBranch, ArrowRight, Shield, Layers } from "lucide-react";

const PhoneFMC = () => {
  return (
    <article className="max-w-[960px] mx-auto px-5 py-12 md:px-10 md:py-20">
      {/* Header */}
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent-phone mb-1">
        Case Study · Native Infrastructure
      </p>
      <h1 className="font-display text-[clamp(28px,5vw,44px)] text-foreground mb-2 leading-tight">
        The Call Is the Signal
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-vanta-text-low mb-10">
        Native Phone + Fixed Mobile Convergence
      </p>

      {/* Hero Quote */}
      <div className="mb-12 border-l-2 border-vanta-accent-phone pl-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-vanta-accent-phone mb-2">
          Strategic Position
        </p>
        <p className="font-display text-[18px] md:text-[20px] italic text-foreground leading-relaxed">
          "Most Connectivity OS products are software layers sitting on top of someone else's pipe. Vanta is the pipe."
        </p>
      </div>

      {/* Problem */}
      <section className="mb-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">The Problem</p>
        <p className="font-sans text-[14px] text-vanta-text-mid leading-relaxed mb-3">
          The creative entrepreneur makes and receives calls all day. Client conversations, partner calls, investor discussions, deal negotiations, coaching sessions. Every one generates frameworks, decisions, commitments, and insights with real commercial and intellectual value.
        </p>
        <p className="font-sans text-[14px] text-vanta-text-mid leading-relaxed mb-3">
          Almost none of it is captured. Notes are partial. Memory degrades. Follow-through is inconsistent.
        </p>
        <p className="font-sans text-[14px] text-foreground leading-relaxed font-medium">
          The conventional answer is an app… but apps require behavioral change, create friction, and are forgotten under pressure. The right answer is infrastructure that captures at the network level, requiring zero behavioral change from the user.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">How It Works</p>
        <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-6 italic">
          When Vanta owns the SIM and the call routing, intelligence capture becomes invisible.
        </p>
        <div className="border border-vanta-border space-y-0">
          {[
            { n: "01", icon: Phone, label: "Onboarding", desc: "User provisioned a Vanta eSIM via ConnectX. Number registered as a native endpoint on Vanta's network." },
            { n: "02", icon: Radio, label: "Call Placed or Received", desc: "User calls from their native iPhone or Android dialer… no Vanta app involved. The call transits Vanta's network." },
            { n: "03", icon: Layers, label: "CDR Generated", desc: "ConnectX records the call event: parties, duration, timestamp. This is the trigger for signal processing." },
            { n: "04", icon: Zap, label: "Audio Capture + Transcription", desc: "Call audio routed through Vanta's recording layer at SIP level. Transcript generated via Whisper." },
            { n: "05", icon: GitBranch, label: "Signal Detection", desc: "Transcript passed through two-stage pipeline: Haiku triage → Sonnet detection. Signal extracted, tagged, scored." },
            { n: "06", icon: ArrowRight, label: "Capture + Delivery", desc: "Signals written to persistent store with speaker attribution. iMessage summary ping within 10 minutes of call end." },
          ].map((step, i) => (
            <div key={step.n} className={`flex items-start gap-4 p-4 ${i > 0 ? "border-t border-vanta-border-mid" : ""} ${i === 0 || i === 5 ? "bg-vanta-accent-phone-faint" : "bg-card"}`}>
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <span className="font-mono text-[11px] text-vanta-accent-phone w-5">{step.n}</span>
                <step.icon className="w-4 h-4 text-vanta-accent-phone" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-bold text-foreground">{step.label}</p>
                <p className="font-mono text-[10px] text-vanta-text-low mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phone-Specific Signal Taxonomy */}
      <section className="mb-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">Phone-Specific Signal Taxonomy</p>
        <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-5">
          The existing signal taxonomy is extended with five phone-specific types that surface uniquely in call context… they do not appear naturally in text or meeting transcripts.
        </p>
        <div className="grid grid-cols-1 gap-px bg-vanta-border border border-vanta-border">
          {[
            { tag: "commitment", def: "A promise made or received during the call… explicit or implied" },
            { tag: "decision", def: "A choice made or agreed upon during the conversation" },
            { tag: "open_question", def: "An unresolved question that requires follow-up" },
            { tag: "relationship_signal", def: "A data point about the nature or health of this relationship… tone, access, trust level, urgency" },
            { tag: "deal_signal", def: "Language, terms, or indicators relevant to a commercial outcome" },
          ].map((item) => (
            <div key={item.tag} className="flex items-start gap-3 p-4 bg-card">
              <span className="inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border border-vanta-accent-phone-border text-vanta-accent-phone bg-vanta-accent-phone-faint shrink-0 mt-0.5">
                {item.tag}
              </span>
              <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{item.def}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Native FMC Wins */}
      <section className="mb-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">Why Native FMC Beats Every Alternative</p>
        <div className="space-y-3">
          {[
            { approach: "Zoom Phone FMC", reason: "Zoom-controlled infrastructure. AI outputs locked in Zoom Hub, not API-accessible." },
            { approach: "Recall.ai / Bot-based", reason: "Works for meetings. Does not work for phone calls. Requires a meeting context." },
            { approach: "App-based VoIP", reason: "Requires user to change calling behavior. Adoption fails under pressure." },
            { approach: "Vanta Native FMC", reason: "Invisible to the user. No behavior change. Captures every call. Intelligence is fully proprietary.", highlight: true },
          ].map((item) => (
            <div key={item.approach} className={`p-4 border ${item.highlight ? "border-vanta-accent-phone-border bg-vanta-accent-phone-faint" : "border-vanta-border bg-card"}`}>
              <p className={`font-mono text-[11px] uppercase tracking-[0.12em] mb-1 ${item.highlight ? "text-vanta-accent-phone" : "text-vanta-text-mid"}`}>{item.approach}</p>
              <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Moat, Relationship Graph */}
      <section className="mb-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">Second-Order Effect: The Relationship Graph</p>
        <div className="border-l-2 border-vanta-accent-phone pl-5 mb-5">
          <p className="font-display text-[17px] italic text-foreground leading-relaxed">
            "Every phone call Vanta captures is a data point in a relationship network. This is not a feature that can be bolted onto a third-party telephony integration. It requires owning the CDR. Vanta owns it."
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-vanta-border border border-vanta-border">
          {[
            { label: "Contact Frequency", desc: "Surface contacts you haven't spoken to in 30+ days" },
            { label: "Call Depth", desc: "Duration as a proxy for relationship intensity" },
            { label: "Network Adjacency", desc: "Who talks to whom, and what signals surface" },
            { label: "Commitment Tracking", desc: "Open commitments surfaced until marked resolved" },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-card">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-vanta-accent-phone mb-1">{item.label}</p>
              <p className="font-sans text-[12px] text-vanta-text-mid leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure Callout */}
      <div className="border border-vanta-accent-phone-border bg-vanta-accent-phone-faint p-6 mb-12">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-vanta-accent-phone shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-[14px] text-foreground font-bold mb-2">Infrastructure Is the Moat</p>
            <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
              Vanta doesn't integrate with telephony infrastructure… it owns it. The combination of an operational MVNO and Amdocs ConnectX as the BSS/OSS foundation changes the nature of this product entirely. That distinction is the moat.
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {["MVNO", "FMC", "ConnectX", "eSIM", "CDR", "SIP", "Whisper", "Zero Friction", "Relationship Graph"].map((tag) => (
          <span key={tag} className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-2 py-1">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
};

export default PhoneFMC;

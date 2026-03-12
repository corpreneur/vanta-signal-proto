import { MessageSquare, Phone, Video, Mail, Calendar, ArrowDown, Zap, Brain, Send, Database } from "lucide-react";

interface ChannelDef {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  colorBg: string;
  colorBorder: string;
  source: string;
  capture: string;
  signalTypes: string[];
  narrative: string;
}

const CHANNELS: ChannelDef[] = [
  {
    id: "imessage", label: "iMessage", icon: MessageSquare,
    color: "text-vanta-accent", colorBg: "bg-vanta-accent-faint", colorBorder: "border-vanta-accent-border",
    source: "linq",
    capture: "Linq relay — messages forwarded through Vanta's iMessage bridge. No app install required on contacts.",
    signalTypes: ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT"],
    narrative: "iMessage is the primary channel for high-trust communication among creative entrepreneurs. Intros happen here. Deals close here. The signal density per message is the highest of any channel — but without capture, it disappears into a thread.",
  },
  {
    id: "phone", label: "Native Phone", icon: Phone,
    color: "text-vanta-accent-phone", colorBg: "bg-vanta-accent-phone-faint", colorBorder: "border-vanta-accent-phone-border",
    source: "phone",
    capture: "Vanta MVNO — call audio intercepted at SIP level via ConnectX. Transcription via Whisper. Zero behavioral change.",
    signalTypes: ["PHONE_CALL"],
    narrative: "The phone call is the highest-density, most systematically ignored communication channel. Vanta doesn't ask the user to change behavior — it owns the infrastructure.",
  },
  {
    id: "zoom", label: "Zoom Meetings", icon: Video,
    color: "text-vanta-accent-zoom", colorBg: "bg-vanta-accent-zoom-faint", colorBorder: "border-vanta-accent-zoom-border",
    source: "recall",
    capture: "Recall.ai bot joins scheduled meetings. Real-time transcription with speaker diarization. Post-meeting summary within 5 minutes.",
    signalTypes: ["MEETING"],
    narrative: "Meetings are where decisions crystallize and commitments are made in front of witnesses. The Recall.ai integration captures the full transcript, identifies speakers, and runs the same two-stage AI pipeline.",
  },
  {
    id: "email", label: "Email", icon: Mail,
    color: "text-vanta-accent-teal", colorBg: "bg-vanta-accent-teal-faint", colorBorder: "border-vanta-accent-teal-border",
    source: "gmail",
    capture: "Gmail API polling — authorized OAuth connection scans inbox for signal-bearing threads. Thread context preserved.",
    signalTypes: ["INTRO", "INSIGHT", "INVESTMENT", "CONTEXT"],
    narrative: "Email is the workhorse — lower signal density than iMessage, but higher formality. Investment memos, partnership proposals, and formal introductions flow through email.",
  },
  {
    id: "calendar", label: "Calendar", icon: Calendar,
    color: "text-vanta-accent-amber", colorBg: "bg-vanta-accent-amber-faint", colorBorder: "border-vanta-accent-amber-border",
    source: "calendar",
    capture: "Google Calendar sync — upcoming meetings trigger pre-meeting brief generation. Attendee lists matched against signal history.",
    signalTypes: ["MEETING"],
    narrative: "The calendar is not a signal source — it's a signal trigger. When a meeting appears on the calendar, Vanta cross-references every attendee against the full signal history and generates a contextual brief.",
  },
];

const PIPELINE_STAGES = [
  { id: "01", label: "Ingest", desc: "Raw signal arrives from any channel", icon: Database },
  { id: "02", label: "Triage", desc: "Haiku classifies: signal or noise? Route or discard.", icon: Zap },
  { id: "03", label: "Detection", desc: "Sonnet extracts type, entities, priority, actionable insight", icon: Brain },
  { id: "04", label: "Action", desc: "Automated response, brief generation, or silent capture", icon: Send },
];

const SIGNAL_TYPES = [
  { type: "INTRO", color: "text-vanta-accent", bg: "bg-vanta-accent-faint", border: "border-vanta-accent-border", def: "A person-to-person introduction with commercial or strategic potential" },
  { type: "INSIGHT", color: "text-vanta-accent-teal", bg: "bg-vanta-accent-teal-faint", border: "border-vanta-accent-teal-border", def: "A framework, observation, or perspective with reuse value" },
  { type: "INVESTMENT", color: "text-vanta-accent-amber", bg: "bg-vanta-accent-amber-faint", border: "border-vanta-accent-amber-border", def: "Language, terms, or signals relevant to funding or capital allocation" },
  { type: "DECISION", color: "text-vanta-accent-violet", bg: "bg-vanta-accent-violet-faint", border: "border-vanta-accent-violet-border", def: "A choice made or agreed upon with downstream consequences" },
  { type: "CONTEXT", color: "text-vanta-text-low", bg: "bg-vanta-bg-elevated", border: "border-vanta-border", def: "Background information that enriches understanding without requiring action" },
  { type: "MEETING", color: "text-vanta-accent-zoom", bg: "bg-vanta-accent-zoom-faint", border: "border-vanta-accent-zoom-border", def: "A structured conversation with transcript, attendees, and temporal context" },
  { type: "PHONE_CALL", color: "text-vanta-accent-phone", bg: "bg-vanta-accent-phone-faint", border: "border-vanta-accent-phone-border", def: "Native dialer call with commitments, decisions, and relationship signals extracted at the network level" },
  { type: "NOISE", color: "text-vanta-text-muted", bg: "bg-vanta-bg-elevated", border: "border-vanta-border", def: "Low-signal content silently logged but not surfaced in the feed" },
];

const Ontology = () => {
  return (
    <article className="max-w-[960px] mx-auto px-5 py-12 md:px-10 md:py-20">
      {/* Header */}
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent mb-1">
        Signal Ontology + Architecture
      </p>
      <h1 className="font-display text-[clamp(28px,5vw,44px)] text-foreground mb-2 leading-tight">
        Every Channel Is a Sensor
      </h1>
      <p className="font-sans text-[14px] text-vanta-text-mid leading-relaxed mb-12 max-w-xl">
        Vanta treats every communication channel as a signal source… not a feature to integrate, but infrastructure to own.
      </p>

      {/* Product Concept Narrative */}
      <section className="mb-14">
        <div className="border-l-2 border-primary pl-5 mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary mb-2">Product Concept</p>
          <p className="font-display text-[18px] italic text-foreground leading-relaxed mb-3">
            "The creative entrepreneur's day produces more signal than any system captures. Not because the tools are bad — because the architecture is wrong."
          </p>
          <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
            Conventional products sit on top of channels and ask the user to change behavior. Vanta sits underneath them. When you own the iMessage relay, the SIM card, the meeting bot, and the email connection, capture becomes invisible.
          </p>
        </div>
      </section>

      {/* Signal Type Taxonomy */}
      <section className="mb-14">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">Signal Type Taxonomy</p>
        <div className="grid grid-cols-1 gap-px bg-vanta-border border border-vanta-border">
          {SIGNAL_TYPES.map((st) => (
            <div key={st.type} className="flex items-start gap-3 p-4 bg-card">
              <span className={`inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border shrink-0 mt-0.5 ${st.color} ${st.bg} ${st.border}`}>
                {st.type}
              </span>
              <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{st.def}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Channel Architecture */}
      <section className="mb-14">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-6">Channel Architecture</p>
        <div className="space-y-6">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className={`border ${ch.colorBorder} overflow-hidden`}>
              <div className={`flex items-center gap-3 px-5 py-3 ${ch.colorBg}`}>
                <ch.icon className={`w-4 h-4 ${ch.color}`} />
                <span className={`font-mono text-[12px] uppercase tracking-[0.14em] font-bold ${ch.color}`}>{ch.label}</span>
                <span className="font-mono text-[9px] text-vanta-text-muted uppercase tracking-wider ml-auto">source: {ch.source}</span>
              </div>
              <div className="px-5 py-4 space-y-4 bg-card">
                <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{ch.narrative}</p>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Capture Method</p>
                  <p className="font-mono text-[11px] text-vanta-text-low leading-relaxed">{ch.capture}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">Signal Types Produced</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.signalTypes.map((st) => {
                      const stDef = SIGNAL_TYPES.find((s) => s.type === st);
                      return (
                        <span key={st} className={`inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border ${stDef?.color || "text-vanta-text-muted"} ${stDef?.bg || "bg-card"} ${stDef?.border || "border-vanta-border"}`}>
                          {st}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Processing Pipeline */}
      <section className="mb-14">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">Universal Processing Pipeline</p>
        <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-6 italic">
          Every signal — regardless of channel — passes through the same four-stage pipeline.
        </p>
        <div className="border border-vanta-border">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.id}>
              {i > 0 && (
                <div className="flex justify-center py-1 bg-card">
                  <ArrowDown className="w-3 h-3 text-vanta-accent" />
                </div>
              )}
              <div className={`flex items-start gap-4 p-4 ${i === 0 || i === PIPELINE_STAGES.length - 1 ? "bg-vanta-accent-faint" : "bg-card"} ${i > 0 ? "border-t border-vanta-border-mid" : ""}`}>
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <span className="font-mono text-[11px] text-primary w-5">{stage.id}</span>
                  <stage.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-sans text-[13px] font-bold text-foreground">{stage.label}</p>
                  <p className="font-mono text-[10px] text-vanta-text-low mt-0.5">{stage.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing Narrative */}
      <section className="mb-12">
        <div className="border border-vanta-accent-border bg-vanta-accent-faint p-6">
          <p className="font-sans text-[14px] text-foreground font-bold mb-2">The Architecture Is the Product</p>
          <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-3">
            Most intelligence products are features bolted onto someone else's infrastructure. Vanta's advantage is that the capture layer, the classification layer, and the delivery layer are all first-party.
          </p>
          <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
            Five channels. One pipeline. Every signal classified, scored, and actionable — before the user opens the app.
          </p>
        </div>
      </section>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {["Ontology", "Signal Architecture", "iMessage", "Phone", "Zoom", "Email", "Calendar", "AI Pipeline", "FMC"].map((tag) => (
          <span key={tag} className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-2 py-1">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
};

export default Ontology;

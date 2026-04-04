import { useState } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  MessageSquare,
  Search,
  User,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle2,
  Shield,
  Radio,
  ChevronDown,
  Hash,
  Headphones,
} from "lucide-react";

/* ── Mock contacts for the dialer ── */
const RECENT_CALLS = [
  { name: "Sarah Chen", number: "+1 (415) 555-0142", role: "GP · Acme VC", time: "2h ago", duration: "11:08" },
  { name: "Marcus Rivera", number: "+1 (212) 555-0198", role: "MD · Portfolio Capital", time: "Yesterday", duration: "8:34" },
  { name: "Elena Voss", number: "+1 (310) 555-0167", role: "Partner · Horizon Fund", time: "3 days ago", duration: "22:17" },
];

const WEBHOOK_EVENTS = [
  "phone.callee_ringing",
  "phone.callee_answered",
  "phone.recording_started",
  "phone.call_log_completed",
  "phone.recording_completed",
  "phone.voicemail_received",
];

const EMBED_CAPABILITIES = [
  { label: "Click-to-call", desc: "Initiate outbound calls from any contact card or signal" },
  { label: "Click-to-SMS", desc: "Send quick follow-up texts without leaving the dashboard" },
  { label: "Answer / hangup", desc: "Full call control embedded in the Vanta sidebar" },
  { label: "Hold / resume", desc: "Park calls while pulling up context from the signal feed" },
  { label: "Start / stop recording", desc: "Toggle recording with consent capture built in" },
  { label: "Call log events", desc: "Every call event streams into the unified signal pipeline" },
  { label: "Contact search", desc: "Smart Embed queries Vanta contacts for caller ID enrichment" },
];

const INTEGRATION_POINTS = [
  {
    location: "Dashboard — What's Ahead",
    action: "Click upcoming meeting attendee → dial directly",
    icon: Phone,
  },
  {
    location: "Contact Timeline",
    action: "Call button on profile header → Smart Embed initiates",
    icon: User,
  },
  {
    location: "Signal Detail Drawer",
    action: "Follow up on a DECISION signal → one-tap call to speaker",
    icon: Zap,
  },
  {
    location: "Post-Meeting Summary",
    action: "Action item owner → click to call for immediate follow-up",
    icon: CheckCircle2,
  },
  {
    location: "Quick Actions Grid",
    action: "Universal call action → opens embedded dialer with recent contacts",
    icon: Radio,
  },
];

type WidgetState = "idle" | "ringing" | "active" | "held" | "ended";

export default function SmartEmbedConcept() {
  const [widgetState, setWidgetState] = useState<WidgetState>("idle");
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [dialInput, setDialInput] = useState("");
  const [selectedContact, setSelectedContact] = useState<typeof RECENT_CALLS[0] | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showWebhooks, setShowWebhooks] = useState(false);

  const startCall = (contact: typeof RECENT_CALLS[0]) => {
    setSelectedContact(contact);
    setWidgetState("ringing");
    setCallSeconds(0);
    setTimeout(() => {
      setWidgetState("active");
      setRecording(true);
    }, 2000);
  };

  const endCall = () => {
    setWidgetState("ended");
    setRecording(false);
    setMuted(false);
    setTimeout(() => {
      setWidgetState("idle");
      setSelectedContact(null);
    }, 2000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Zoom Phone · Smart Embed
          </span>
        </div>
        <h1 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground">
          Embedded softphone concept
        </h1>
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
          How Zoom Phone Smart Embed transforms every Vanta surface into a call-ready intelligence capture point.
          The softphone widget lives inside the dashboard — no app switching, no context loss.
        </p>
      </header>

      {/* Main layout: Widget mock + Integration points */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Smart Embed widget mock — 2 cols */}
        <div className="md:col-span-2 space-y-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            Smart Embed widget
          </span>
          <div className="border border-border bg-card overflow-hidden">
            {/* Widget header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-foreground" />
                <span className="font-mono text-[10px] font-bold uppercase text-foreground">Vanta Phone</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-mono text-[9px] text-muted-foreground">Ready</span>
              </div>
            </div>

            {/* Widget body */}
            <div className="p-3 space-y-3">
              {widgetState === "idle" && (
                <>
                  {/* Search / dial input */}
                  <div className="flex items-center gap-2 border border-border bg-background px-2 py-1.5">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <input
                      type="text"
                      value={dialInput}
                      onChange={(e) => setDialInput(e.target.value)}
                      placeholder="Search contacts or dial..."
                      className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  {/* Recent calls */}
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                      Recent
                    </span>
                    {RECENT_CALLS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => startCall(c)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/30">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] font-medium text-foreground truncate">{c.name}</div>
                          <div className="font-mono text-[9px] text-muted-foreground">{c.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[9px] text-muted-foreground">{c.time}</div>
                          <div className="font-mono text-[9px] text-muted-foreground">{c.duration}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dial pad hint */}
                  <div className="flex items-center justify-center gap-1 py-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground">Tap contact to call</span>
                  </div>
                </>
              )}

              {widgetState === "ringing" && selectedContact && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-muted/30 animate-pulse">
                    <PhoneCall className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-sm font-bold text-foreground">{selectedContact.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{selectedContact.number}</div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-1">Ringing…</div>
                  </div>
                  <button
                    onClick={endCall}
                    className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                </div>
              )}

              {(widgetState === "active" || widgetState === "held") && selectedContact && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/30">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-sm font-bold text-foreground">{selectedContact.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{selectedContact.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs tabular-nums text-foreground">{formatTime(callSeconds)}</div>
                      {recording && (
                        <div className="flex items-center gap-1 justify-end">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                          <span className="font-mono text-[9px] text-destructive">REC</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {widgetState === "held" && (
                    <div className="rounded border border-border bg-muted/20 px-2 py-1.5 text-center font-mono text-[10px] text-muted-foreground">
                      Call on hold — pulling context…
                    </div>
                  )}

                  {/* Audio waveform */}
                  {widgetState === "active" && (
                    <div className="flex items-end justify-center gap-[2px] h-6">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-sm bg-foreground/30 animate-pulse"
                          style={{
                            height: `${6 + Math.sin(i * 0.8) * 12 + Math.random() * 8}px`,
                            animationDelay: `${i * 80}ms`,
                            animationDuration: `${600 + Math.random() * 400}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Call controls */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => setMuted(!muted)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                        muted ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setWidgetState(widgetState === "held" ? "active" : "held")}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                        widgetState === "held" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {widgetState === "held" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setRecording(!recording)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                        recording ? "border-destructive bg-destructive text-destructive-foreground" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Radio className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={endCall}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <PhoneOff className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {widgetState === "ended" && selectedContact && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle2 className="h-6 w-6 text-foreground" />
                  <div className="font-mono text-[11px] font-medium text-foreground">Call ended</div>
                  <div className="font-mono text-[9px] text-muted-foreground">
                    Recording saved · signals processing…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Capabilities list */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Embed capabilities
            </span>
            <div className="space-y-1">
              {EMBED_CAPABILITIES.map((c) => (
                <div key={c.label} className="flex items-start gap-2 py-1">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-mono text-[10px] font-medium text-foreground">{c.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground"> — {c.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integration points — 3 cols */}
        <div className="md:col-span-3 space-y-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            Dashboard integration points
          </span>

          <div className="space-y-2">
            {INTEGRATION_POINTS.map((pt) => (
              <div
                key={pt.location}
                className="flex items-start gap-3 border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border">
                  <pt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[11px] font-bold text-foreground">{pt.location}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{pt.action}</div>
                </div>
                <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>

          {/* Webhook event stream */}
          <div className="space-y-2">
            <button
              onClick={() => setShowWebhooks(!showWebhooks)}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showWebhooks ? "rotate-0" : "-rotate-90"}`} />
              Webhook event stream
            </button>
            {showWebhooks && (
              <div className="border border-border bg-card p-3 space-y-1.5">
                <p className="font-mono text-[9px] text-muted-foreground mb-2">
                  Every Zoom Phone event fires a webhook into the Vanta signal pipeline.
                </p>
                {WEBHOOK_EVENTS.map((evt, i) => (
                  <div key={evt} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] tabular-nums text-muted-foreground w-8">{`T+${i * 3}s`}</span>
                    <code className="font-mono text-[10px] text-foreground">{evt}</code>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground">→ signal pipeline</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture summary */}
          <div className="border border-border bg-card p-4 space-y-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              How it works
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", title: "Embed", desc: "Smart Embed JS loads in a sidebar iframe. Zoom Desktop Client handles the audio path." },
                { step: "2", title: "Capture", desc: "Webhooks fire on every call event. Recordings auto-upload. Transcripts extract." },
                { step: "3", title: "Classify", desc: "Gemini pipeline triages the transcript. Signals appear in the unified feed." },
              ].map((s) => (
                <div key={s.step} className="space-y-1.5">
                  <div className="flex h-6 w-6 items-center justify-center border border-border font-mono text-[10px] font-bold text-foreground">
                    {s.step}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-foreground">{s.title}</div>
                  <div className="font-mono text-[9px] leading-relaxed text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements callout */}
          <div className="border border-border bg-muted/20 p-3 flex items-start gap-2">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <div className="font-mono text-[10px] font-bold text-foreground">Requirements</div>
              <ul className="space-y-0.5">
                {[
                  "Zoom Pro plan + Zoom Phone license per user",
                  "Zoom Desktop Client installed (handles audio path)",
                  "Smart Embed JS SDK integrated in Vanta dashboard",
                  "Webhook endpoint registered for phone events",
                ].map((r) => (
                  <li key={r} className="font-mono text-[9px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-muted-foreground mt-px">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

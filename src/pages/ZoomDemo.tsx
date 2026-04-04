import { useState, useEffect, useCallback } from "react";
import {
  Video, Shield, Users, Radio, CheckCircle2, Copy, Loader2,
  Mic, MonitorUp, Pen, Cloud, Eye, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
type Phase = "idle" | "generating" | "jwt-ready" | "inviting" | "invited" | "streaming" | "detecting" | "complete";

interface Participant {
  name: string;
  email: string;
  joined: boolean;
}

interface DetectedSignal {
  type: "DECISION" | "INVESTMENT" | "INSIGHT" | "CONTEXT";
  text: string;
  speaker: string;
  ts: string;
}

/* ── Mock data ── */
const MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiVmFudGFfU2lnbmFsIiwiaWF0IjoxNzEyMTgwMDAwLCJleHAiOjE3MTIxODM2MDAsInRwYyI6InZhbnRhLXNlc3Npb24tMDAxIiwicm9sZV90eXBlIjoxLCJ1c2VyX2lkZW50aXR5IjoiV2lsbGlhbSBUcmF5bG9yIn0.fake_signature_for_demo";

const MOCK_PARTICIPANTS: Participant[] = [
  { name: "Sarah Chen", email: "sarah@acme.vc", joined: false },
  { name: "Marcus Rivera", email: "marcus@portfolio.co", joined: false },
];

const MOCK_SIGNALS: DetectedSignal[] = [
  { type: "DECISION", text: "Let's lock the Series A terms at $12M pre-money", speaker: "Sarah Chen", ts: "00:04:12" },
  { type: "INVESTMENT", text: "We're targeting Q3 close with a $2M allocation", speaker: "Marcus Rivera", ts: "00:07:34" },
  { type: "INSIGHT", text: "The vertical SaaS play gives us 3x better unit economics than horizontal", speaker: "Sarah Chen", ts: "00:11:08" },
];

const TRANSCRIPT_LINES = [
  { speaker: "You", text: "Thanks for joining. Let's walk through the current term structure." },
  { speaker: "Sarah Chen", text: "Absolutely. We've reviewed the deck and the metrics are compelling." },
  { speaker: "Marcus Rivera", text: "I agree. The retention numbers are best-in-class for this stage." },
  { speaker: "You", text: "So the question is whether we lock at twelve pre or push for fifteen." },
  { speaker: "Sarah Chen", text: "Let's lock the Series A terms at twelve million pre-money. We can move fast." },
  { speaker: "Marcus Rivera", text: "We're targeting Q3 close with a two million allocation from our side." },
  { speaker: "You", text: "That works. What's your thesis on vertical versus horizontal here?" },
  { speaker: "Sarah Chen", text: "The vertical SaaS play gives us three-x better unit economics than horizontal." },
];

/* ── Helpers ── */
const SIGNAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DECISION: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  INVESTMENT: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  INSIGHT: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  CONTEXT: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
};

const SDK_FEATURES = [
  { icon: Video, label: "HD Video", desc: "1080p with virtual backgrounds" },
  { icon: MonitorUp, label: "Screen Share", desc: "With annotation overlay" },
  { icon: Pen, label: "Whiteboard", desc: "Collaborative canvas" },
  { icon: Cloud, label: "Cloud Record", desc: "Session-level recording" },
  { icon: Eye, label: "Metal Render", desc: "Apple GPU acceleration" },
  { icon: Mic, label: "Speaker ID", desc: "Real-time diarisation" },
];

/* ── Component ── */
export default function ZoomDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jwt, setJwt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS.map(p => ({ ...p })));
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [detectedSignals, setDetectedSignals] = useState<DetectedSignal[]>([]);
  const [rtmsStatus, setRtmsStatus] = useState<"idle" | "connecting" | "streaming" | "completed">("idle");

  /* Phase: Generate JWT — creates a real meeting in the DB */
  const handleGenerateJwt = useCallback(async () => {
    setPhase("generating");
    const sid = `vanta-session-${Date.now().toString(36)}`;
    setSessionId(sid);
    try {
      const startsAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("upcoming_meetings")
        .insert({
          title: `Vanta Zoom Demo — ${sid}`,
          starts_at: startsAt,
          ends_at: new Date(Date.now() + 35 * 60_000).toISOString(),
          zoom_meeting_id: sid,
          attendees: MOCK_PARTICIPANTS.map(p => ({ name: p.name, email: p.email })),
        })
        .select("id")
        .single();

      if (error) throw error;
      setMeetingDbId(data.id);
      setJwt(MOCK_JWT);
      setPhase("jwt-ready");
      toast.success("Session created & JWT generated");
    } catch (err) {
      console.error("JWT generation failed:", err);
      // Graceful fallback to mock flow
      setJwt(MOCK_JWT);
      setPhase("jwt-ready");
      toast.success("Video SDK JWT generated (demo mode)");
    }
  }, []);

  /* Phase: Send invites */
  const handleInvite = useCallback(() => {
    setPhase("inviting");
    setTimeout(() => {
      setParticipants(prev => prev.map(p => ({ ...p, joined: true })));
      setPhase("invited");
      toast.success("Participants joined the session");
    }, 2200);
  }, []);

  /* Phase: Start RTMS — calls the real edge function */
  const handleStartRtms = useCallback(async () => {
    setPhase("streaming");
    setRtmsStatus("connecting");

    if (meetingDbId) {
      try {
        const { data, error } = await supabase.functions.invoke("start-rtms-stream", {
          body: { meeting_id: meetingDbId },
        });
        if (error) throw error;
        console.log("RTMS response:", data);

        if (data?.status === "streaming") {
          toast.success("RTMS stream activated");
        } else {
          toast("RTMS unavailable — running demo simulation", { description: data?.reason || data?.status });
        }
      } catch (err) {
        console.error("RTMS start failed:", err);
        toast("RTMS not available — simulating stream", { description: "Zoom credentials not configured" });
      }
    }

    setTimeout(() => setRtmsStatus("streaming"), 1200);
  }, []);

  /* Transcript simulation */
  useEffect(() => {
    if (rtmsStatus !== "streaming") return;
    if (transcriptIndex >= TRANSCRIPT_LINES.length) {
      setPhase("detecting");
      return;
    }
    const timer = setTimeout(() => {
      setTranscriptIndex(i => i + 1);
    }, 1600);
    return () => clearTimeout(timer);
  }, [rtmsStatus, transcriptIndex]);

  /* Signal detection simulation */
  useEffect(() => {
    if (phase !== "detecting") return;
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= MOCK_SIGNALS.length) {
        clearInterval(timer);
        setRtmsStatus("completed");
        setPhase("complete");
        toast.success("Session complete — 3 signals captured");
        return;
      }
      setDetectedSignals(prev => [...prev, MOCK_SIGNALS[idx]]);
      idx++;
    }, 1400);
    return () => clearInterval(timer);
  }, [phase]);

  const copyJwt = () => {
    navigator.clipboard.writeText(jwt);
    toast("JWT copied to clipboard");
  };

  const resetDemo = () => {
    setPhase("idle");
    setJwt("");
    setSessionId("");
    setParticipants(MOCK_PARTICIPANTS.map(p => ({ ...p })));
    setTranscriptIndex(0);
    setDetectedSignals([]);
    setRtmsStatus("idle");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-[hsl(var(--vanta-accent-zoom,213_100%_50%))]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Zoom Video SDK · iOS
          </span>
        </div>
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-foreground uppercase">
          Vanta Zoom — Session Demo
        </h1>
        <p className="font-mono text-xs text-muted-foreground max-w-xl leading-relaxed">
          Interactive walkthrough of the Zoom Video SDK integration. Create a session, invite participants, activate RTMS, and watch live signal detection in action.
        </p>
      </div>

      {/* SDK Feature Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {SDK_FEATURES.map(f => (
          <div key={f.label} className="flex flex-col items-center gap-1 p-3 border border-border bg-card">
            <f.icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-foreground">{f.label}</span>
            <span className="font-mono text-[7px] text-muted-foreground text-center leading-tight">{f.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Step 1: JWT Generation ── */}
      <section className="border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono font-bold ${phase !== "idle" && phase !== "generating" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {phase !== "idle" && phase !== "generating" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Session Creation & JWT</h2>
          <Shield className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Vanta backend generates a Video SDK JWT with session topic, role type, and user identity. No Zoom accounts required.
        </p>

        {phase === "idle" && (
          <button
            onClick={handleGenerateJwt}
            className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Generate session JWT
          </button>
        )}

        {phase === "generating" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground animate-pulse">Generating JWT…</span>
          </div>
        )}

        {jwt && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Session</span>
              <code className="font-mono text-[10px] text-foreground">{sessionId}</code>
            </div>
            <div className="relative">
              <pre className="font-mono text-[9px] text-muted-foreground bg-muted p-3 overflow-x-auto max-h-16 leading-relaxed">
                {jwt}
              </pre>
              <button
                onClick={copyJwt}
                className="absolute top-1.5 right-1.5 p-1 hover:bg-muted-foreground/10 transition-colors"
                aria-label="Copy JWT"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Step 2: Participant Invite ── */}
      <section className={`border bg-card p-4 space-y-3 transition-opacity duration-300 ${phase === "idle" || phase === "generating" ? "opacity-40 pointer-events-none" : ""} border-border`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono font-bold ${["invited", "streaming", "detecting", "complete"].includes(phase) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {["invited", "streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "2"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Participant Invite</h2>
          <Users className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Share the session link. Participants join directly — no Zoom account or download required.
        </p>

        <div className="space-y-1.5">
          {participants.map(p => (
            <div key={p.email} className="flex items-center justify-between px-3 py-2 border border-border">
              <div>
                <span className="font-mono text-[11px] text-foreground">{p.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground ml-2">{p.email}</span>
              </div>
              {p.joined ? (
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Joined
                </span>
              ) : (
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Pending</span>
              )}
            </div>
          ))}
        </div>

        {phase === "jwt-ready" && (
          <button
            onClick={handleInvite}
            className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Send invites & launch session
          </button>
        )}

        {phase === "inviting" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground animate-pulse">Launching session…</span>
          </div>
        )}
      </section>

      {/* ── Step 3: RTMS Stream Activation ── */}
      <section className={`border bg-card p-4 space-y-3 transition-opacity duration-300 ${!["invited", "streaming", "detecting", "complete"].includes(phase) ? "opacity-40 pointer-events-none" : ""} border-border`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono font-bold ${["streaming", "detecting", "complete"].includes(phase) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {["streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "3"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">RTMS Stream</h2>
          <Radio className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Real-Time Media Service streams live audio with speaker attribution to Vanta's classification engine.
        </p>

        {/* RTMS Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${rtmsStatus === "streaming" ? "bg-emerald-400 animate-pulse" : rtmsStatus === "completed" ? "bg-foreground" : rtmsStatus === "connecting" ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {rtmsStatus === "idle" ? "Awaiting activation" : rtmsStatus === "connecting" ? "Connecting to RTMS…" : rtmsStatus === "streaming" ? "Streaming — live transcription active" : "Stream complete"}
          </span>
        </div>

        {phase === "invited" && (
          <button
            onClick={handleStartRtms}
            className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Activate RTMS stream
          </button>
        )}

        {/* Live Transcript */}
        {transcriptIndex > 0 && (
          <div className="border border-border bg-muted p-3 max-h-48 overflow-y-auto space-y-1.5">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Live transcript</span>
            {TRANSCRIPT_LINES.slice(0, transcriptIndex).map((line, i) => (
              <div key={i} className="font-mono text-[10px] leading-relaxed">
                <span className={`font-bold ${line.speaker === "You" ? "text-foreground" : "text-muted-foreground"}`}>
                  {line.speaker}:
                </span>{" "}
                <span className="text-foreground/80">{line.text}</span>
              </div>
            ))}
            {phase === "streaming" && (
              <div className="flex items-center gap-1.5 pt-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[8px] text-muted-foreground animate-pulse">Listening…</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Step 4: Live Signal Detection ── */}
      <section className={`border bg-card p-4 space-y-3 transition-opacity duration-300 ${!["detecting", "complete"].includes(phase) ? "opacity-40 pointer-events-none" : ""} border-border`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono font-bold ${phase === "complete" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
            {phase === "complete" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "4"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Live Signal Detection</h2>
          <Zap className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Transcript chunks classified in real-time. Decisions, commitments, and insights surface during the call.
        </p>

        {detectedSignals.length > 0 && (
          <div className="space-y-2">
            {detectedSignals.map((sig, i) => {
              const colors = SIGNAL_COLORS[sig.type];
              return (
                <div
                  key={i}
                  className={`border ${colors.border} ${colors.bg} p-3 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[9px] uppercase tracking-wider font-bold ${colors.text}`}>
                      {sig.type}
                    </span>
                    <span className="font-mono text-[8px] text-muted-foreground">{sig.ts}</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground leading-relaxed">"{sig.text}"</p>
                  <span className="font-mono text-[9px] text-muted-foreground">— {sig.speaker}</span>
                </div>
              );
            })}
          </div>
        )}

        {phase === "detecting" && detectedSignals.length < MOCK_SIGNALS.length && (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground animate-pulse">Classifying transcript…</span>
          </div>
        )}
      </section>

      {/* ── Complete State ── */}
      {phase === "complete" && (
        <div className="border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Session complete</h2>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            3 signals captured, meeting artifact stored, attendee profiles enriched. Pre-meeting briefs for follow-up calls will include today's context automatically.
          </p>
          <div className="flex gap-2">
            <button
              onClick={resetDemo}
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors"
            >
              Reset demo
            </button>
            <a
              href="/product/zoom-sdk"
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
            >
              Product concept →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

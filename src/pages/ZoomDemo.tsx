import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Shield,
  Users,
  Radio,
  CheckCircle2,
  Copy,
  Loader2,
  Mic,
  MonitorUp,
  Pen,
  Cloud,
  Eye,
  Zap,
  Clock,
  FileText,
  Download,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import PreSessionDossier from "@/components/zoom-demo/PreSessionDossier";
import VideoGrid from "@/components/zoom-demo/VideoGrid";

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

const MOCK_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiVmFudGFfU2lnbmFsIiwiaWF0IjoxNzEyMTgwMDAwLCJleHAiOjE3MTIxODM2MDAsInRwYyI6InZhbnRhLXNlc3Npb24tMDAxIiwicm9sZV90eXBlIjoxLCJ1c2VyX2lkZW50aXR5IjoiV2lsbGlhbSBUcmF5bG9yIn0.fake_signature_for_demo";

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

export default function ZoomDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jwt, setJwt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [meetingDbId, setMeetingDbId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS.map((participant) => ({ ...participant })));
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [detectedSignals, setDetectedSignals] = useState<DetectedSignal[]>([]);
  const [rtmsStatus, setRtmsStatus] = useState<"idle" | "connecting" | "streaming" | "completed">("idle");

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
          attendees: MOCK_PARTICIPANTS.map((participant) => ({ name: participant.name, email: participant.email })),
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
      setJwt(MOCK_JWT);
      setPhase("jwt-ready");
      toast.success("Video SDK JWT generated (demo mode)");
    }
  }, []);

  const handleInvite = useCallback(() => {
    setPhase("inviting");
    setTimeout(() => {
      setParticipants((prev) => prev.map((participant) => ({ ...participant, joined: true })));
      setPhase("invited");
      toast.success("Participants joined the session");
    }, 2200);
  }, []);

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
          toast("RTMS unavailable — running demo simulation", {
            description: data?.reason || data?.status,
          });
        }
      } catch (err) {
        console.error("RTMS start failed:", err);
        toast("RTMS not available — simulating stream", {
          description: "Zoom credentials not configured",
        });
      }
    }

    setTimeout(() => setRtmsStatus("streaming"), 1200);
  }, [meetingDbId]);

  useEffect(() => {
    if (rtmsStatus !== "streaming") return;

    if (transcriptIndex >= TRANSCRIPT_LINES.length) {
      setPhase("detecting");
      return;
    }

    const timer = setTimeout(() => {
      setTranscriptIndex((index) => index + 1);
    }, 1600);

    return () => clearTimeout(timer);
  }, [rtmsStatus, transcriptIndex]);

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

      setDetectedSignals((prev) => [...prev, MOCK_SIGNALS[idx]]);
      idx += 1;
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
    setMeetingDbId(null);
    setParticipants(MOCK_PARTICIPANTS.map((participant) => ({ ...participant })));
    setTranscriptIndex(0);
    setDetectedSignals([]);
    setRtmsStatus("idle");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-[hsl(var(--vanta-accent-zoom,213_100%_50%))]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Zoom Video SDK · iOS
          </span>
        </div>
        <h1 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground">
          Vanta Zoom — Session Demo
        </h1>
        <p className="max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
          Interactive walkthrough of the Zoom Video SDK integration. Create a session, invite participants, activate RTMS, and watch live signal detection in action.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SDK_FEATURES.map((feature) => (
          <div key={feature.label} className="flex flex-col items-center gap-1 border border-border bg-card p-3">
            <feature.icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-foreground">{feature.label}</span>
            <span className="text-center font-mono text-[7px] leading-tight text-muted-foreground">{feature.desc}</span>
          </div>
        ))}
      </div>

      <PreSessionDossier dimmed={phase !== "idle" && phase !== "generating"} />

      <section className="space-y-3 border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${phase !== "idle" && phase !== "generating" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {phase !== "idle" && phase !== "generating" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Session Creation & JWT</h2>
          <Shield className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Vanta backend generates a Video SDK JWT with session topic, role type, and user identity. No Zoom accounts required.
        </p>

        {phase === "idle" && (
          <button
            onClick={handleGenerateJwt}
            className="bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
          >
            Generate session JWT
          </button>
        )}

        {phase === "generating" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="animate-pulse font-mono text-[10px] text-muted-foreground">Generating JWT…</span>
          </div>
        )}

        {jwt && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Session</span>
              <code className="font-mono text-[10px] text-foreground">{sessionId}</code>
            </div>
            <div className="relative">
              <pre className="max-h-16 overflow-x-auto bg-muted p-3 font-mono text-[9px] leading-relaxed text-muted-foreground">
                {jwt}
              </pre>
              <button
                onClick={copyJwt}
                className="absolute right-1.5 top-1.5 p-1 transition-colors hover:bg-muted-foreground/10"
                aria-label="Copy JWT"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity duration-300 ${phase === "idle" || phase === "generating" ? "pointer-events-none opacity-40" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${["invited", "streaming", "detecting", "complete"].includes(phase) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {["invited", "streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "2"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Participant Invite</h2>
          <Users className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Share the session link. Participants join directly — no Zoom account or download required.
        </p>

        <div className="space-y-1.5">
          {participants.map((participant) => (
            <div key={participant.email} className="flex items-center justify-between border border-border px-3 py-2">
              <div>
                <span className="font-mono text-[11px] text-foreground">{participant.name}</span>
                <span className="ml-2 font-mono text-[9px] text-muted-foreground">{participant.email}</span>
              </div>
              {participant.joined ? (
                <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
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
            className="bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
          >
            Send invites & launch session
          </button>
        )}

        {phase === "inviting" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="animate-pulse font-mono text-[10px] text-muted-foreground">Launching session…</span>
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity duration-300 ${!["invited", "streaming", "detecting", "complete"].includes(phase) ? "pointer-events-none opacity-40" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${["streaming", "detecting", "complete"].includes(phase) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {["streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "3"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">RTMS Stream</h2>
          <Radio className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Real-Time Media Service streams live audio with speaker attribution to Vanta&apos;s classification engine.
        </p>

        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 ${rtmsStatus === "streaming" ? "animate-pulse bg-emerald-400" : rtmsStatus === "completed" ? "bg-foreground" : rtmsStatus === "connecting" ? "animate-pulse bg-amber-400" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {rtmsStatus === "idle"
              ? "Awaiting activation"
              : rtmsStatus === "connecting"
                ? "Connecting to RTMS…"
                : rtmsStatus === "streaming"
                  ? "Streaming — live transcription active"
                  : "Stream complete"}
          </span>
        </div>

        {phase === "invited" && (
          <button
            onClick={handleStartRtms}
            className="bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
          >
            Activate RTMS stream
          </button>
        )}

        {(rtmsStatus === "streaming" || phase === "detecting") && (
          <ZoomSectionBoundary title="Session video">
            <VideoGrid
              activeSpeaker={TRANSCRIPT_LINES[Math.max(0, transcriptIndex - 1)]?.speaker || ""}
              isStreaming={rtmsStatus === "streaming"}
            />
          </ZoomSectionBoundary>
        )}

        {transcriptIndex > 0 && (
          <div className="max-h-48 space-y-1.5 overflow-y-auto border border-border bg-muted p-3">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Live transcript</span>
            {TRANSCRIPT_LINES.slice(0, transcriptIndex).map((line, index) => (
              <div key={index} className="font-mono text-[10px] leading-relaxed">
                <span className={`font-bold ${line.speaker === "You" ? "text-foreground" : "text-muted-foreground"}`}>
                  {line.speaker}:
                </span>{" "}
                <span className="text-foreground/80">{line.text}</span>
              </div>
            ))}
            {phase === "streaming" && (
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-1.5 w-1.5 animate-pulse bg-emerald-400" />
                <span className="animate-pulse font-mono text-[8px] text-muted-foreground">Listening…</span>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity duration-300 ${!["detecting", "complete"].includes(phase) ? "pointer-events-none opacity-40" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${phase === "complete" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {phase === "complete" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "4"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Live Signal Detection</h2>
          <Zap className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Transcript chunks classified in real-time. Decisions, commitments, and insights surface during the call.
        </p>

        {detectedSignals.length > 0 && (
          <div className="space-y-2">
            {detectedSignals.map((signal, index) => {
              const colors = SIGNAL_COLORS[signal.type] ?? {
                bg: "bg-muted",
                text: "text-muted-foreground",
                border: "border-border",
              };

              return (
                <div
                  key={index}
                  className={`space-y-1 border p-3 ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>
                      {signal.type}
                    </span>
                    <span className="font-mono text-[8px] text-muted-foreground">{signal.ts}</span>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed text-foreground">&quot;{signal.text}&quot;</p>
                  <span className="font-mono text-[9px] text-muted-foreground">— {signal.speaker}</span>
                </div>
              );
            })}
          </div>
        )}

        {phase === "detecting" && detectedSignals.length < MOCK_SIGNALS.length && (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="animate-pulse font-mono text-[10px] text-muted-foreground">Classifying transcript…</span>
          </div>
        )}
      </section>

      {phase === "complete" && (
        <div className="border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">
              Session complete — AI summary
            </h2>
          </div>

          <div className="flex gap-4 border border-border p-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Duration</span>
              <span className="font-mono text-[11px] font-bold text-foreground">11m 08s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Participants</span>
              <span className="font-mono text-[11px] font-bold text-foreground">3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Signals</span>
              <span className="font-mono text-[11px] font-bold text-foreground">3</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Meeting narrative</span>
            <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">
              Series A terms were discussed and agreed at $12M pre-money valuation. Sarah Chen from Acme
              Ventures confirmed willingness to move fast on the deal structure, while Marcus Rivera
              committed a $2M allocation from Portfolio Capital targeting a Q3 close.
            </p>
            <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">
              The group validated the vertical SaaS thesis, noting three-times better unit economics
              compared to horizontal alternatives. Both parties expressed strong conviction in the
              go-to-market strategy and current retention metrics.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Key takeaways</span>
            {["Series A terms locked at $12M pre-money valuation",
              "Target close date set for Q3 with dual-lead structure",
              "Portfolio Capital allocating $2M from Fund III",
              "Vertical SaaS thesis validated — 3x unit economics advantage over horizontal",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="w-1 h-1 mt-1.5 bg-foreground shrink-0" />
                <span className="font-mono text-[10px] text-foreground leading-relaxed">{t}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Action items</span>
            {[
              { assignee: "Sarah Chen", task: "Send updated term sheet by Friday" },
              { assignee: "Marcus Rivera", task: "Confirm LP approval timeline within 48 hours" },
              { assignee: "You", task: "Prepare revised cap table reflecting new allocation" },
              { assignee: "You", task: "Schedule follow-up with legal counsel for closing docs" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 border border-border">
                <div className="w-3 h-3 border border-muted-foreground shrink-0" />
                <span className="font-mono text-[10px] text-foreground">
                  <span className="font-bold">{item.assignee}:</span> {item.task}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Profiles enriched</span>
            {[
              { name: "Sarah Chen", newSignals: 2, types: ["DECISION", "INSIGHT"] },
              { name: "Marcus Rivera", newSignals: 1, types: ["INVESTMENT"] },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2 px-2 py-1.5 border border-border">
                <UserCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="font-mono text-[10px] text-foreground font-bold">{p.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  +{p.newSignals} signal{p.newSignals > 1 ? "s" : ""}
                </span>
                <div className="flex gap-1 ml-auto">
                  {p.types.map((t) => {
                    const sc = SIGNAL_COLORS[t] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
                    return (
                      <span key={t} className={`font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 ${sc.bg} ${sc.text}`}>
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={resetDemo}
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors"
            >
              Reset demo
            </button>
            <Link
              to="/meetings"
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="h-3 w-3" /> View artifact
            </Link>
            <button
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-3 w-3" /> Export PDF
            </button>
            <Link
              to="/product/zoom-sdk"
              className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
            >
              Product concept <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Loader2,
  Mic,
  Radio,
  Shield,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Phase = "idle" | "generating" | "jwt-ready" | "inviting" | "invited" | "streaming" | "detecting" | "complete";
type StreamStatus = "idle" | "connecting" | "streaming" | "completed";

interface Participant {
  name: string;
  email: string;
  joined: boolean;
}

interface TranscriptLine {
  speaker: string;
  text: string;
}

interface DetectedSignal {
  type: "DECISION" | "INVESTMENT" | "INSIGHT";
  text: string;
  speaker: string;
  ts: string;
}

const MOCK_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiVmFudGFfU2lnbmFsIiwiaWF0IjoxNzEyMTgwMDAwLCJleHAiOjE3MTIxODM2MDAsInRwYyI6InZhbnRhLXNlc3Npb24tMDAxIiwicm9sZV90eXBlIjoxLCJ1c2VyX2lkZW50aXR5IjoiV2lsbGlhbSBUcmF5bG9yIn0.fake_signature_for_demo";

const BASE_PARTICIPANTS: Participant[] = [
  { name: "Sarah Chen", email: "sarah@acme.vc", joined: false },
  { name: "Marcus Rivera", email: "marcus@portfolio.co", joined: false },
];


const TRANSCRIPT_LINES: TranscriptLine[] = [
  { speaker: "You", text: "Thanks for joining. Let's walk through the current term structure." },
  { speaker: "Sarah Chen", text: "We've reviewed the metrics and we're ready to move quickly." },
  { speaker: "Marcus Rivera", text: "The retention profile is one of the strongest we've seen this year." },
  { speaker: "You", text: "The open question is whether we lock at twelve pre or stretch higher." },
  { speaker: "Sarah Chen", text: "Let's lock the Series A terms at twelve million pre-money." },
  { speaker: "Marcus Rivera", text: "We're targeting a Q3 close with a two million allocation from our side." },
  { speaker: "Sarah Chen", text: "The vertical SaaS model gives this business far better unit economics." },
];

const DEMO_SIGNALS: DetectedSignal[] = [
  {
    type: "DECISION",
    text: "Let's lock the Series A terms at twelve million pre-money.",
    speaker: "Sarah Chen",
    ts: "00:04:12",
  },
  {
    type: "INVESTMENT",
    text: "We're targeting a Q3 close with a two million allocation from our side.",
    speaker: "Marcus Rivera",
    ts: "00:07:34",
  },
  {
    type: "INSIGHT",
    text: "The vertical SaaS model gives this business far better unit economics.",
    speaker: "Sarah Chen",
    ts: "00:11:08",
  },
];

const SUMMARY_POINTS = [
  "Series A terms locked at $12M pre-money valuation.",
  "Target close date held at Q3 with a dual-lead structure.",
  "Portfolio Capital indicated a $2M allocation.",
  "The vertical SaaS thesis was reinforced during the call.",
];

const FOLLOW_UPS = [
  "Sarah Chen: send updated term sheet by Friday.",
  "Marcus Rivera: confirm LP approval timeline within 48 hours.",
  "You: prepare the revised cap table and closing checklist.",
];

function VideoTile({ name, active, muted }: { name: string; active: boolean; muted: boolean }) {
  return (
    <div className={`relative flex min-h-24 flex-col items-center justify-center gap-2 border p-3 ${active ? "border-foreground bg-muted" : "border-border bg-card"}`}>
      <div className={`flex h-8 w-8 items-center justify-center border font-mono text-[10px] font-bold ${active ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}>
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </div>
      <span className="font-mono text-[8px] uppercase tracking-wider text-foreground">{name}</span>
      <div className="absolute right-2 top-2 flex items-center gap-1 font-mono text-[8px] text-muted-foreground">
        <Mic className="h-3 w-3" />
        <span>{muted ? "Muted" : "Live"}</span>
      </div>
    </div>
  );
}

function SummaryPanel({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();

  return (
    <section className="space-y-4 border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-foreground" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Session complete</h2>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="border border-border p-3">
          <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Duration</p>
          <p className="mt-1 font-mono text-[11px] font-bold text-foreground">11m 08s</p>
        </div>
        <div className="border border-border p-3">
          <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Participants</p>
          <p className="mt-1 font-mono text-[11px] font-bold text-foreground">3</p>
        </div>
        <div className="border border-border p-3">
          <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Signals</p>
          <p className="mt-1 font-mono text-[11px] font-bold text-foreground">3</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Meeting narrative</p>
        <p className="font-mono text-[10px] leading-relaxed text-foreground">
          The meeting converged on a $12M pre-money Series A structure, confirmed investor appetite, and reinforced the vertical SaaS thesis.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Key takeaways</p>
        {SUMMARY_POINTS.map((point) => (
          <div key={point} className="flex items-start gap-2">
            <div className="mt-1.5 h-1 w-1 shrink-0 bg-foreground" />
            <p className="font-mono text-[10px] text-foreground">{point}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Action items</p>
        {FOLLOW_UPS.map((item) => (
          <div key={item} className="border border-border px-3 py-2 font-mono text-[10px] text-foreground">
            {item}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onReset}
          className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
        >
          Reset demo
        </button>
        <button
          onClick={() => navigate("/meetings")}
          className="inline-flex items-center gap-1.5 bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
        >
          <FileText className="h-3 w-3" /> View artifact
        </button>
        <button
          onClick={() => toast("Export PDF coming soon")}
          className="inline-flex items-center gap-1.5 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-3 w-3" /> Export PDF
        </button>
        <button
          onClick={() => navigate("/product/zoom-sdk")}
          className="inline-flex items-center gap-1.5 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
        >
          Product concept <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}

export default function ZoomDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jwt, setJwt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(() => BASE_PARTICIPANTS.map((participant) => ({ ...participant })));
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [detectedSignals, setDetectedSignals] = useState<DetectedSignal[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");

  const handleGenerateJwt = useCallback(async () => {
    setPhase("generating");
    const nextSessionId = `vanta-session-${Date.now().toString(36)}`;
    setSessionId(nextSessionId);

    try {
      const startsAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("upcoming_meetings")
        .insert({
          title: `Vanta Zoom Demo — ${nextSessionId}`,
          starts_at: startsAt,
          ends_at: new Date(Date.now() + 35 * 60_000).toISOString(),
          zoom_meeting_id: nextSessionId,
          attendees: BASE_PARTICIPANTS.map((participant) => ({ name: participant.name, email: participant.email })),
        })
        .select("id")
        .single();

      if (error) throw error;

      setMeetingId(data.id);
      setJwt(MOCK_JWT);
      setPhase("jwt-ready");
      toast.success("Session created and JWT generated");
    } catch (error) {
      console.error("Zoom demo session setup failed:", error);
      setMeetingId(null);
      setJwt(MOCK_JWT);
      setPhase("jwt-ready");
      toast.success("Video session generated in demo mode");
    }
  }, []);

  const handleInvite = useCallback(() => {
    setPhase("inviting");

    window.setTimeout(() => {
      setParticipants((current) => current.map((participant) => ({ ...participant, joined: true })));
      setPhase("invited");
      toast.success("Participants joined the session");
    }, 1400);
  }, []);

  const handleStartRtms = useCallback(async () => {
    setPhase("streaming");
    setStreamStatus("connecting");

    if (meetingId) {
      try {
        const { data, error } = await supabase.functions.invoke("start-rtms-stream", {
          body: { meeting_id: meetingId },
        });

        if (error) throw error;

        if (data?.status === "streaming") {
          toast.success("RTMS stream activated");
        } else {
          toast("RTMS unavailable — running demo simulation");
        }
      } catch (error) {
        console.error("RTMS activation failed:", error);
        toast("RTMS unavailable — running demo simulation");
      }
    }

    window.setTimeout(() => setStreamStatus("streaming"), 900);
  }, [meetingId]);

  useEffect(() => {
    if (streamStatus !== "streaming") return;

    if (transcriptIndex >= TRANSCRIPT_LINES.length) {
      setStreamStatus("completed");
      setPhase("detecting");
      return;
    }

    const timer = window.setTimeout(() => {
      setTranscriptIndex((current) => current + 1);
    }, 1300);

    return () => window.clearTimeout(timer);
  }, [streamStatus, transcriptIndex]);

  useEffect(() => {
    if (phase !== "detecting") return;

    if (detectedSignals.length >= DEMO_SIGNALS.length) {
      setPhase("complete");
      toast.success("Session complete — signals captured");
      return;
    }

    const timer = window.setTimeout(() => {
      setDetectedSignals((current) => [...current, DEMO_SIGNALS[current.length]]);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [phase, detectedSignals]);

  const copyJwt = useCallback(async () => {
    if (!jwt || !navigator.clipboard) return;
    await navigator.clipboard.writeText(jwt);
    toast("JWT copied to clipboard");
  }, [jwt]);

  const resetDemo = useCallback(() => {
    setPhase("idle");
    setJwt("");
    setSessionId("");
    setMeetingId(null);
    setParticipants(BASE_PARTICIPANTS.map((participant) => ({ ...participant })));
    setTranscriptIndex(0);
    setDetectedSignals([]);
    setStreamStatus("idle");
  }, []);

  const activeSpeaker = transcriptIndex > 0 ? TRANSCRIPT_LINES[transcriptIndex - 1]?.speaker : "";

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Zoom Video SDK · iOS demo</span>
        </div>
        <h1 className="font-sans text-2xl font-extrabold uppercase tracking-tight text-foreground">Vanta Zoom session demo</h1>
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
          Stable walkthrough of session creation, participant join, live streaming, and signal capture.
        </p>
      </header>

      <section className="space-y-3 border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${phase !== "idle" && phase !== "generating" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {phase !== "idle" && phase !== "generating" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Session creation and JWT</h2>
          <Shield className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Create a session record and generate a demo JWT for the meeting launch flow.
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
          <div className="flex items-center gap-2 py-2 font-mono text-[10px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating session…
          </div>
        )}

        {jwt && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Session</span>
              <code className="font-mono text-[10px] text-foreground">{sessionId}</code>
            </div>
            <div className="relative border border-border bg-muted p-3 pr-10">
              <pre className="max-h-20 overflow-x-auto font-mono text-[9px] leading-relaxed text-muted-foreground">{jwt}</pre>
              <button
                onClick={copyJwt}
                className="absolute right-2 top-2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Copy JWT"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity ${phase === "idle" || phase === "generating" ? "pointer-events-none opacity-40" : "opacity-100"}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${["invited", "streaming", "detecting", "complete"].includes(phase) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {["invited", "streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "2"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Participant invite</h2>
          <Users className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Invite participants into the demo session and confirm joined state before the stream begins.
        </p>

        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.email} className="flex items-center justify-between border border-border px-3 py-2">
              <div>
                <p className="font-mono text-[11px] text-foreground">{participant.name}</p>
                <p className="font-mono text-[9px] text-muted-foreground">{participant.email}</p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {participant.joined ? "Joined" : "Pending"}
              </span>
            </div>
          ))}
        </div>

        {phase === "jwt-ready" && (
          <button
            onClick={handleInvite}
            className="bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
          >
            Send invites and launch session
          </button>
        )}

        {phase === "inviting" && (
          <div className="flex items-center gap-2 py-2 font-mono text-[10px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Launching session…
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity ${!["invited", "streaming", "detecting", "complete"].includes(phase) ? "pointer-events-none opacity-40" : "opacity-100"}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${["streaming", "detecting", "complete"].includes(phase) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {["streaming", "detecting", "complete"].includes(phase) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "3"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">RTMS stream</h2>
          <Radio className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Stream live transcript data into the demo pipeline and highlight the active speaker.
        </p>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className={`h-2 w-2 ${streamStatus === "streaming" ? "animate-pulse bg-foreground" : streamStatus === "connecting" ? "animate-pulse bg-muted-foreground" : "bg-border"}`} />
          <span>
            {streamStatus === "idle" && "Awaiting activation"}
            {streamStatus === "connecting" && "Connecting"}
            {streamStatus === "streaming" && "Streaming live"}
            {streamStatus === "completed" && "Stream complete"}
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

        {(streamStatus === "streaming" || phase === "detecting" || phase === "complete") && (
          <div className="space-y-3 border border-border bg-muted/40 p-3">
            <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Session video</p>
            <div className="grid grid-cols-2 gap-2">
              <VideoTile name="You" active={activeSpeaker === "You"} muted={false} />
              <VideoTile name="Sarah Chen" active={activeSpeaker === "Sarah Chen"} muted={false} />
              <VideoTile name="Marcus Rivera" active={activeSpeaker === "Marcus Rivera"} muted={false} />
              <div className="relative flex min-h-24 flex-col items-center justify-center gap-2 border border-border bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center border border-border text-foreground">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-foreground">Vanta AI</span>
                <span className="absolute right-2 top-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Listening</span>
              </div>
            </div>
          </div>
        )}

        {transcriptIndex > 0 && (
          <div className="max-h-52 space-y-2 overflow-y-auto border border-border bg-muted p-3">
            <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Live transcript</p>
            {TRANSCRIPT_LINES.slice(0, transcriptIndex).map((line, index) => (
              <div key={`${line.speaker}-${index}`} className="font-mono text-[10px] leading-relaxed text-foreground">
                <span className="font-bold">{line.speaker}:</span> {line.text}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`space-y-3 border border-border bg-card p-4 transition-opacity ${!["detecting", "complete"].includes(phase) ? "pointer-events-none opacity-40" : "opacity-100"}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-mono font-bold ${phase === "complete" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {phase === "complete" ? <CheckCircle2 className="h-3.5 w-3.5" /> : "4"}
          </div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">Live signal detection</h2>
          <Zap className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          The completion step now renders through a simplified single-file path to avoid the previous Safari crash.
        </p>

        {detectedSignals.length > 0 && (
          <div className="space-y-2">
            {detectedSignals.map((signal) => (
              <article key={`${signal.type}-${signal.ts}`} className="space-y-2 border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{signal.type}</p>
                  <p className="font-mono text-[8px] text-muted-foreground">{signal.ts}</p>
                </div>
                <p className="font-mono text-[11px] leading-relaxed text-foreground">“{signal.text}”</p>
                <p className="font-mono text-[9px] text-muted-foreground">{signal.speaker}</p>
              </article>
            ))}
          </div>
        )}

        {phase === "detecting" && detectedSignals.length < DEMO_SIGNALS.length && (
          <div className="flex items-center gap-2 py-2 font-mono text-[10px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Classifying transcript…
          </div>
        )}
      </section>

      {phase === "complete" && <SummaryPanel onReset={resetDemo} />}
    </div>
  );
}

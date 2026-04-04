import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Pause, Play, Radio, Shield, Zap, Clock, Users, FileText, Download, RotateCcw, ArrowRight, CheckCircle2, Circle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

// ── Types ──────────────────────────────────────────────────────
type Phase = "idle" | "ringing" | "active" | "processing" | "complete";

interface WebhookEvent {
  event: string;
  timestamp: string;
  detail: string;
}

interface DetectedSignal {
  type: string;
  text: string;
  speaker: string;
  timestamp: string;
}

// ── Mock data ──────────────────────────────────────────────────
const CONTACT = { name: "Marcus Chen", title: "Managing Partner, Apex Ventures", phone: "+1 (415) 555-0187" };

const WEBHOOK_SEQUENCE: WebhookEvent[] = [
  { event: "phone.callee_ringing", timestamp: "00:00", detail: "Outbound call initiated via Smart Embed" },
  { event: "phone.callee_answered", timestamp: "00:03", detail: "Call connected — audio path established" },
  { event: "phone.recording_started", timestamp: "00:05", detail: "Auto-record enabled — consent captured" },
  { event: "phone.participant_speaking", timestamp: "00:08", detail: "Speaker detection active" },
  { event: "phone.transcript_chunk", timestamp: "00:12", detail: "Live transcript streaming via RTMS" },
  { event: "phone.transcript_chunk", timestamp: "00:28", detail: "Continued transcript capture" },
  { event: "phone.recording_completed", timestamp: "11:08", detail: "Recording saved — 11m 08s" },
  { event: "phone.callee_ended", timestamp: "11:08", detail: "Call terminated by callee" },
];

const TRANSCRIPT_LINES = [
  { speaker: "You", text: "Marcus, great to connect. I wanted to follow up on the Series B terms we discussed.", time: "0:08" },
  { speaker: "Marcus Chen", text: "Absolutely. We've reviewed the deck and the growth metrics are compelling. We're ready to lead at the $12M valuation.", time: "0:15" },
  { speaker: "You", text: "That's the number we had in mind. What about the board seat — is that still a requirement?", time: "0:28" },
  { speaker: "Marcus Chen", text: "Yes, we'd want one board seat. But we're flexible on the observer seat — that can go to your existing angel.", time: "0:35" },
  { speaker: "You", text: "I'll take that to our counsel this week. Can we target a term sheet by Friday?", time: "0:42" },
  { speaker: "Marcus Chen", text: "Friday works. I'll have Sarah draft the preliminary terms and send them over by Wednesday for your review.", time: "0:50" },
];

const DEMO_SIGNALS: DetectedSignal[] = [
  { type: "COMMITMENT", text: "Lead Series B at $12M valuation", speaker: "Marcus Chen", timestamp: "0:15" },
  { type: "DECISION", text: "One board seat to Apex, observer seat flexible for existing angel", speaker: "Marcus Chen", timestamp: "0:35" },
  { type: "DEAL_SIGNAL", text: "Term sheet target: Friday. Preliminary terms from Sarah by Wednesday.", speaker: "Marcus Chen", timestamp: "0:50" },
  { type: "OPEN_QUESTION", text: "Board seat structure — pending counsel review", speaker: "You", timestamp: "0:42" },
  { type: "RELATIONSHIP", text: "Direct line of communication established with managing partner", speaker: "System", timestamp: "0:08" },
];

const ACTION_ITEMS = [
  { owner: "You", task: "Send board structure to counsel for review" },
  { owner: "Marcus Chen", task: "Have Sarah draft preliminary term sheet by Wednesday" },
  { owner: "You", task: "Review preliminary terms and respond before Friday" },
  { owner: "System", task: "Schedule follow-up reminder for Thursday" },
];

const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  COMMITMENT: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  DECISION: { bg: "bg-amber-500/10", text: "text-amber-400" },
  DEAL_SIGNAL: { bg: "bg-blue-500/10", text: "text-blue-400" },
  OPEN_QUESTION: { bg: "bg-orange-500/10", text: "text-orange-400" },
  RELATIONSHIP: { bg: "bg-rose-500/10", text: "text-rose-400" },
};

const NARRATIVE = "You connected with Marcus Chen of Apex Ventures regarding the Series B round. Marcus confirmed Apex's intent to lead at a $12M valuation, with one board seat required and flexibility on the observer seat. You committed to reviewing the board structure with counsel, and Marcus will have Sarah send preliminary terms by Wednesday, targeting a signed term sheet by Friday. This represents a significant acceleration of the fundraising timeline.";

// ── PDF generation ─────────────────────────────────────────────
function generateCallPDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, W - 40);
    if (y + lines.length * (size * 0.5) > 270) { doc.addPage(); y = 20; }
    doc.text(lines, 20, y);
    y += lines.length * (size * 0.5) + 4;
  };

  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, W, 35, "F");
  doc.setTextColor(198, 255, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("VANTA SIGNAL", 20, 15);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text("Phone Call Intelligence Report", 20, 23);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 20, 29);
  y = 45;
  doc.setTextColor(30, 30, 30);

  addLine(`Call with ${CONTACT.name}`, 14, true);
  addLine(`${CONTACT.title}  •  ${CONTACT.phone}  •  Duration: 11m 08s`, 9);
  y += 4;

  addLine("Meeting Narrative", 12, true);
  addLine(NARRATIVE, 9);
  y += 4;

  addLine("Detected Signals", 12, true);
  DEMO_SIGNALS.forEach((s) => { addLine(`[${s.type}] ${s.text} — ${s.speaker} @ ${s.timestamp}`, 9); });
  y += 4;

  addLine("Action Items", 12, true);
  ACTION_ITEMS.forEach((a) => { addLine(`• ${a.owner}: ${a.task}`, 9); });

  doc.save("vanta-call-intelligence.pdf");
}

// ── Sub-components (inlined for Safari stability) ──────────────

function DialerUI({ contact, onCall }: { contact: typeof CONTACT; onCall: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
        {contact.name.split(" ").map(n => n[0]).join("")}
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{contact.name}</p>
        <p className="text-xs text-muted-foreground">{contact.title}</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{contact.phone}</p>
      </div>
      <Button onClick={onCall} className="rounded-full h-14 w-14 bg-emerald-500 hover:bg-emerald-600 text-white">
        <Phone className="h-6 w-6" />
      </Button>
      <p className="text-[10px] text-muted-foreground">Zoom Phone Smart Embed</p>
    </div>
  );
}

function CallStrip({ duration, muted, onMute, onHold, held }: { duration: number; muted: boolean; onMute: () => void; onHold: () => void; held: boolean }) {
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  return (
    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-mono text-emerald-400">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
        <span className="text-xs text-muted-foreground">Connected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMute}>
          {muted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4 text-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onHold}>
          {held ? <Play className="h-4 w-4 text-amber-400" /> : <Pause className="h-4 w-4 text-foreground" />}
        </Button>
        <div className="flex items-center gap-1 ml-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-red-400 font-mono uppercase">Rec</span>
        </div>
      </div>
    </div>
  );
}

function AudioWaveform() {
  const bars = Array.from({ length: 24 });
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-emerald-400/60"
          style={{
            height: `${Math.random() * 100}%`,
            animation: `pulse ${0.4 + Math.random() * 0.8}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function PhoneFMCDemo() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [webhookIndex, setWebhookIndex] = useState(0);
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [signalIndex, setSignalIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Call duration timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Webhook event progression
  useEffect(() => {
    if (phase !== "active" && phase !== "ringing") return;
    if (webhookIndex >= WEBHOOK_SEQUENCE.length) return;
    const delay = phase === "ringing" ? 1500 : 2500;
    const id = setTimeout(() => setWebhookIndex(i => i + 1), delay);
    return () => clearTimeout(id);
  }, [phase, webhookIndex]);

  // Transcript progression
  useEffect(() => {
    if (phase !== "active") return;
    if (transcriptIndex >= TRANSCRIPT_LINES.length) return;
    const id = setTimeout(() => setTranscriptIndex(i => i + 1), 3000);
    return () => clearTimeout(id);
  }, [phase, transcriptIndex]);

  // Signal detection
  useEffect(() => {
    if (phase !== "active") return;
    if (signalIndex >= DEMO_SIGNALS.length) return;
    const id = setTimeout(() => setSignalIndex(i => i + 1), 4000);
    return () => clearTimeout(id);
  }, [phase, signalIndex]);

  // Auto-transition: ringing → active after 2 events
  useEffect(() => {
    if (phase === "ringing" && webhookIndex >= 2) setPhase("active");
  }, [phase, webhookIndex]);

  // Auto-transition: active → processing when transcript complete
  useEffect(() => {
    if (phase === "active" && transcriptIndex >= TRANSCRIPT_LINES.length && signalIndex >= DEMO_SIGNALS.length) {
      const id = setTimeout(() => setPhase("processing"), 2000);
      return () => clearTimeout(id);
    }
  }, [phase, transcriptIndex, signalIndex]);

  // Processing progress
  useEffect(() => {
    if (phase !== "processing") return;
    const id = setInterval(() => {
      setProcessingProgress(p => {
        if (p >= 100) { setPhase("complete"); return 100; }
        return p + 4;
      });
    }, 120);
    return () => clearInterval(id);
  }, [phase]);

  const startCall = useCallback(() => {
    setPhase("ringing");
    setWebhookIndex(0);
    setTranscriptIndex(0);
    setSignalIndex(0);
    setCallDuration(0);
    setProcessingProgress(0);
    setMuted(false);
    setHeld(false);
  }, []);

  const resetDemo = useCallback(() => {
    setPhase("idle");
    setWebhookIndex(0);
    setTranscriptIndex(0);
    setSignalIndex(0);
    setCallDuration(0);
    setProcessingProgress(0);
  }, []);

  const handleExportPDF = () => {
    generateCallPDF();
    toast({ title: "PDF downloaded", description: "vanta-call-intelligence.pdf" });
  };

  const stepStatus = (step: number) => {
    const phases: Phase[][] = [["ringing", "active", "processing", "complete"], ["active", "processing", "complete"], ["processing", "complete"], ["complete"]];
    if (phases[step].includes(phase)) return phase === phases[step][0] && step < 3 ? "active" : "done";
    return "pending";
  };

  const STEPS = [
    { label: "Initiate call", desc: "Smart Embed places outbound call via Zoom Phone" },
    { label: "Live capture", desc: "Audio recording, transcript streaming, and speaker detection" },
    { label: "AI processing", desc: "Gemini classifies transcript into commitment, decision, and deal signals" },
    { label: "Intelligence captured", desc: "Signals, action items, and relationship data flow into your feed" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PhoneCall className="h-5 w-5 text-rose-400" />
          <h1 className="text-lg font-bold text-foreground">Phone FMC Demo</h1>
        </div>
        <p className="text-xs text-muted-foreground">Zoom Phone call intelligence pipeline — software-layer Fixed Mobile Convergence</p>
      </div>

      {/* Step indicators */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const st = stepStatus(i);
          return (
            <div key={i} className="text-center">
              <div className={`mx-auto h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${st === "done" ? "bg-emerald-500 text-white" : st === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {st === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <p className="text-[9px] font-medium text-foreground leading-tight">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Step 1: Dialer */}
      {phase === "idle" && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Step 1 — Initiate call</p>
            <DialerUI contact={CONTACT} onCall={startCall} />
          </CardContent>
        </Card>
      )}

      {/* Ringing state */}
      {phase === "ringing" && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 text-center space-y-3">
            <Phone className="h-8 w-8 mx-auto text-emerald-400 animate-bounce" />
            <p className="text-sm font-medium text-foreground">Calling {CONTACT.name}...</p>
            <p className="text-xs text-muted-foreground">Establishing connection via Zoom Phone</p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Active call */}
      {(phase === "active" || phase === "ringing") && (
        <div className="space-y-3">
          {phase === "active" && (
            <>
              <CallStrip duration={callDuration} muted={muted} onMute={() => setMuted(!muted)} onHold={() => setHeld(!held)} held={held} />
              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Audio waveform</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] text-red-400 font-mono">RECORDING</span>
                    </div>
                  </div>
                  <AudioWaveform />
                </CardContent>
              </Card>
            </>
          )}

          {/* Webhook feed */}
          {webhookIndex > 0 && (
            <Card>
              <CardContent className="p-3 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Webhook events</p>
                {WEBHOOK_SEQUENCE.slice(0, webhookIndex).map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="font-mono text-muted-foreground w-10 shrink-0">{w.timestamp}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{w.event}</Badge>
                    <span className="text-muted-foreground">{w.detail}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Live transcript */}
          {transcriptIndex > 0 && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Live transcript</p>
                {TRANSCRIPT_LINES.slice(0, transcriptIndex).map((line, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="font-mono text-muted-foreground w-8 shrink-0">{line.time}</span>
                    <span className={`font-semibold shrink-0 ${line.speaker === "You" ? "text-primary" : "text-foreground"}`}>{line.speaker}:</span>
                    <span className="text-foreground">{line.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detected signals (live) */}
          {signalIndex > 0 && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Detected signals</p>
                {DEMO_SIGNALS.slice(0, signalIndex).map((s, i) => {
                  const c = SIGNAL_COLORS[s.type] || { bg: "bg-muted", text: "text-foreground" };
                  return (
                    <div key={i} className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${c.bg}`}>
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${c.text} border-current shrink-0`}>{s.type}</Badge>
                      <span className="text-[11px] text-foreground">{s.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Processing */}
      {phase === "processing" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <Zap className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-foreground">Processing call intelligence</p>
              <p className="text-xs text-muted-foreground mt-1">Gemini 2.5 Flash classifying transcript…</p>
            </div>
            <Progress value={processingProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground font-mono">{processingProgress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {phase === "complete" && (
        <div className="space-y-4">
          {/* Summary header */}
          <Card className="border-emerald-500/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-foreground">Call intelligence captured</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-lg font-bold text-foreground">11:08</p><p className="text-[9px] text-muted-foreground">Duration</p></div>
                <div><p className="text-lg font-bold text-foreground">{DEMO_SIGNALS.length}</p><p className="text-[9px] text-muted-foreground">Signals</p></div>
                <div><p className="text-lg font-bold text-foreground">{ACTION_ITEMS.length}</p><p className="text-[9px] text-muted-foreground">Actions</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Narrative */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Call narrative</p>
              <p className="text-sm text-foreground leading-relaxed">{NARRATIVE}</p>
            </CardContent>
          </Card>

          {/* Signals */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Detected signals</p>
              {DEMO_SIGNALS.map((s, i) => {
                const c = SIGNAL_COLORS[s.type] || { bg: "bg-muted", text: "text-foreground" };
                return (
                  <div key={i} className={`rounded-md px-3 py-2 ${c.bg} space-y-0.5`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${c.text} border-current`}>{s.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">@ {s.timestamp} — {s.speaker}</span>
                    </div>
                    <p className="text-sm text-foreground">{s.text}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action items */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Action items</p>
              {ACTION_ITEMS.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Circle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground"><strong>{a.owner}:</strong> {a.task}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audio capture result */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Audio capture</p>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-md px-3 py-2">
                <Play className="h-4 w-4 text-foreground" />
                <div className="flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-primary rounded-full" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">11:08</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Raw audio captured via Zoom Phone recording API — 4.2 MB</p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={resetDemo}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset demo</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/signals")}><ArrowRight className="h-3.5 w-3.5 mr-1.5" />View in feed</Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-3.5 w-3.5 mr-1.5" />Export PDF</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/phone-fmc")}><FileText className="h-3.5 w-3.5 mr-1.5" />FMC concept</Button>
          </div>
        </div>
      )}

      {/* ── Comparison table ──────────────────────────────── */}
      <div className="pt-4 border-t border-border space-y-3">
        <h2 className="text-sm font-bold text-foreground">FMC Architecture comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 text-muted-foreground font-semibold">Capability</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-semibold">Zoom Phone FMC</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-semibold">Native MVNO</th>
                <th className="text-center py-2 pl-2 text-muted-foreground font-semibold">App VoIP</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {[
                ["Invisible capture", "Partial", "Yes", "No"],
                ["Native dialer", "No — requires app", "Yes", "No"],
                ["Time to deploy", "2–4 weeks", "6–12 months", "1–2 weeks"],
                ["Recording + transcript", "Yes", "Yes", "Varies"],
                ["Real-time webhooks", "Yes", "CDR-based", "Limited"],
                ["Smart Embed SDK", "Yes", "N/A", "N/A"],
                ["Behavioral change", "Moderate", "None", "High"],
                ["Carrier ownership", "No", "Yes (MVNO)", "No"],
                ["Relationship graph", "Partial", "Full CDR", "Limited"],
                ["Cost per user", "~$15/mo", "~$30–50/mo", "~$10/mo"],
              ].map(([cap, zoom, mvno, voip], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 pr-2 font-medium">{cap}</td>
                  <td className="py-1.5 px-2 text-center">{zoom}</td>
                  <td className="py-1.5 px-2 text-center">{mvno}</td>
                  <td className="py-1.5 pl-2 text-center">{voip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-foreground flex items-center gap-1.5"><Shield className="h-3 w-3" />Strategic assessment</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Zoom Phone FMC offers the fastest path to call intelligence with minimal infrastructure. Native MVNO remains the long-term moat — owning the SIM means owning the CDR — but requires 6–12 months of carrier integration. The recommended approach: ship Zoom Phone FMC now, build MVNO in parallel.
          </p>
        </div>
      </div>
    </div>
  );
}

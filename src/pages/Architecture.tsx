import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const SECTIONS = [
  { id: "overview", label: "System Overview" },
  { id: "linq", label: "Linq API" },
  { id: "gmail", label: "Gmail Integration" },
  { id: "zoom", label: "Zoom / Recall.ai" },
  { id: "phone", label: "Phone FMC" },
  { id: "braindump", label: "Brain Dump" },
  { id: "gemini", label: "Gemini AI Pipeline" },
  { id: "schema", label: "Database Schema" },
  { id: "functions", label: "Edge Functions" },
];

function SectionHeader({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div id={id} className="scroll-mt-20 pt-10 pb-4 border-b border-vanta-border">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">{sub}</p>
      <h2 className="font-mono text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-vanta-bg-elevated border border-vanta-border rounded-md p-4 font-mono text-[11px] leading-relaxed text-vanta-text-mid overflow-x-auto">
      {children}
    </pre>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] leading-relaxed text-vanta-text-mid space-y-3">{children}</div>;
}

function FlowStep({ n, label, detail }: { n: number; label: string; detail: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-vanta-accent-bg border border-vanta-accent-border flex items-center justify-center font-mono text-[10px] text-vanta-accent font-bold">{n}</span>
      <div>
        <p className="font-mono text-[12px] text-foreground font-semibold">{label}</p>
        <p className="text-[12px] text-vanta-text-low">{detail}</p>
      </div>
    </div>
  );
}

// ─── TOC ────────────────────────────────────────────────────────────────────

function DesktopTOC({ active }: { active: string }) {
  return (
    <nav className="hidden lg:block sticky top-20 w-48 shrink-0 self-start">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-3">Contents</p>
      <ul className="space-y-1">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block font-mono text-[11px] px-2 py-1 rounded transition-colors ${
                active === s.id
                  ? "text-vanta-accent bg-vanta-accent-faint"
                  : "text-vanta-text-low hover:text-foreground"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileTOC({ active }: { active: string }) {
  return (
    <div className="lg:hidden sticky top-12 z-40 bg-background/95 backdrop-blur-md border-b border-vanta-border -mx-4 px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border transition-colors ${
            active === s.id
              ? "text-vanta-accent border-vanta-accent-border bg-vanta-accent-faint"
              : "text-vanta-text-low border-vanta-border hover:text-foreground"
          }`}
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function Architecture() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Documentation</p>
        <h1 className="font-mono text-2xl font-bold text-foreground">Tech Architecture</h1>
        <p className="text-[13px] text-vanta-text-low mt-1">System-level documentation for the Vanta Signal intelligence pipeline. Updated to reflect all current platform capabilities.</p>
      </div>

      {/* Mobile TOC — outside the flex so it spans full width */}
      <MobileTOC active={active} />

      <div className="flex gap-8">
        <DesktopTOC active={active} />

        <div className="flex-1 min-w-0 space-y-8 overflow-x-hidden">

          {/* ── 1. System Overview ──────────────────────────────────────── */}
          <section>
            <SectionHeader id="overview" title="System Overview" sub="§ 01" />
            <div className="mt-6 space-y-4">
              <Prose>
                <p>Vanta Signal ingests communications from five channels, classifies them through a Gemini AI pipeline, and surfaces actionable intelligence on the dashboard.</p>
              </Prose>
              <div className="space-y-3 mt-4">
                <FlowStep n={1} label="Channels" detail="iMessage (Linq), Gmail, Zoom, Phone, Calendar" />
                <FlowStep n={2} label="Edge Functions" detail="Channel-specific webhooks parse & normalize payloads" />
                <FlowStep n={3} label="Gemini AI Gateway" detail="Classify signal type, priority, summary, and actions" />
                <FlowStep n={4} label="Database" detail="Signals table + meeting_artifacts for rich media" />
                <FlowStep n={5} label="Dashboard" detail="Real-time feed, relationship graph, pre-meeting briefs" />
              </div>
              <Code>{`Channel → Edge Function → Gemini Flash → Supabase → Dashboard
  ↓           ↓               ↓              ↓           ↓
Linq/Gmail  Parse+HMAC    Classify        Insert      Render
Phone/Zoom  Normalize     Prioritize      Deduplicate Filter+Sort`}</Code>
            </div>
          </section>

          {/* ── 2. Linq API ────────────────────────────────────────────── */}
          <section>
            <SectionHeader id="linq" title="Linq API" sub="§ 02 · iMessage Channel" />
            <div className="mt-6 space-y-6">
              <Prose>
                <p>Linq provides the iMessage bridge. Inbound messages arrive as v3 webhooks with HMAC-SHA256 signatures. The edge function verifies, parses, classifies, and optionally auto-replies.</p>
              </Prose>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Webhook Endpoint</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="font-mono text-[11px]">Property</TableHead><TableHead className="font-mono text-[11px]">Value</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-mono text-[11px]">URL</TableCell><TableCell className="font-mono text-[11px] text-vanta-accent">/functions/v1/linq-webhook</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Method</TableCell><TableCell className="font-mono text-[11px]">POST</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Auth</TableCell><TableCell className="font-mono text-[11px]">HMAC-SHA256 via x-webhook-signature</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Stale window</TableCell><TableCell className="font-mono text-[11px]">300 seconds (5 min)</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">ParsedMessage Interface</p>
                <Code>{`interface ParsedMessage {
  eventId: string | null;
  eventType: string;        // "message.received"
  sender: string;
  senderHandle: string;     // E.164 phone number
  body: string;
  chatId: string | null;    // for threaded replies
  messageId: string | null;
  timestamp: string;
  rawPayload: Record<string, unknown>;
}`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Processing Flow</p>
                <div className="space-y-3">
                  <FlowStep n={1} label="Receive" detail="POST with raw JSON body" />
                  <FlowStep n={2} label="Verify HMAC" detail="SHA-256 of timestamp.body against x-webhook-signature" />
                  <FlowStep n={3} label="Parse Payload" detail="Supports v3 2026-02-03, v3 2025-01-01, and legacy formats" />
                  <FlowStep n={4} label="Deduplicate" detail="Check event_id against linq_message_id in signals table" />
                  <FlowStep n={5} label="Classify" detail="Gemini Flash → signalType, priority, summary, actionsTaken" />
                  <FlowStep n={6} label="Insert" detail="Write to signals table with status 'Captured'" />
                  <FlowStep n={7} label="Auto-Reply" detail="If trigger conditions met, generate and send via Linq API" />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Auto-Reply Triggers</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="font-mono text-[11px]">Signal Type</TableHead><TableHead className="font-mono text-[11px]">Priorities</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-mono text-[11px]">INTRO</TableCell><TableCell className="font-mono text-[11px]">high</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">INVESTMENT</TableCell><TableCell className="font-mono text-[11px]">high, medium, low</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">DECISION</TableCell><TableCell className="font-mono text-[11px]">high, medium, low</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          {/* ── 3. Gmail Integration ───────────────────────────────────── */}
          <section>
            <SectionHeader id="gmail" title="Gmail Integration" sub="§ 03 · Email Channel" />
            <div className="mt-6 space-y-6">
              <Prose>
                <p>Gmail signals are captured via polling rather than webhooks. An edge function refreshes OAuth2 tokens, fetches recent messages, classifies them, and inserts non-noise signals.</p>
              </Prose>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Auth Flow</p>
                <Code>{`Client ID + Client Secret + Refresh Token
  → POST https://oauth2.googleapis.com/token
  → Access Token (short-lived)
  → Gmail API: users/me/messages`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">EmailMessage Interface</p>
                <Code>{`interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  snippet: string;
}`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Polling Mechanism</p>
                <div className="space-y-3">
                  <FlowStep n={1} label="Determine Window" detail="Query latest captured_at from signals where source = 'gmail'" />
                  <FlowStep n={2} label="Refresh Token" detail="Exchange refresh token for short-lived access token" />
                  <FlowStep n={3} label="List Messages" detail="Fetch message IDs after the timestamp window" />
                  <FlowStep n={4} label="Fetch Details" detail="Retrieve full body, headers, and metadata per message" />
                  <FlowStep n={5} label="Classify & Insert" detail="Run through Gemini, skip NOISE, insert to signals" />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Deduplication</p>
                <Prose><p>Gmail thread IDs are stored in <code className="text-vanta-accent">linq_message_id</code> to prevent re-processing. The polling window is anchored to the most recent captured signal timestamp.</p></Prose>
              </div>
            </div>
          </section>

          {/* ── 4. Zoom / Recall.ai ────────────────────────────────────── */}
          <section>
            <SectionHeader id="zoom" title="Zoom / Recall.ai" sub="§ 04 · Meeting Channel" />
            <div className="mt-6 space-y-6">
              <Prose>
                <p>Meeting intelligence uses Recall.ai to join Zoom calls, capture transcripts, and deliver structured webhook payloads when recordings are ready.</p>
              </Prose>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Integration Pattern</p>
                <div className="space-y-3">
                  <FlowStep n={1} label="Bot Joins" detail="Recall.ai bot enters the Zoom meeting automatically" />
                  <FlowStep n={2} label="Transcription" detail="Real-time speech-to-text during the meeting" />
                  <FlowStep n={3} label="Webhook Fires" detail="transcript.ready or bot.done event sent to recall-webhook" />
                  <FlowStep n={4} label="Classify" detail="Full transcript + attendees + title → Gemini classification" />
                  <FlowStep n={5} label="Store Artifacts" detail="Signal inserted + meeting_artifacts row with transcript, summary, recording URL" />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">TranscriptTurn Interface</p>
                <Code>{`interface TranscriptTurn {
  speaker: string;
  text: string;
  timestamp?: number;
}`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Stored Artifacts</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="font-mono text-[11px]">Field</TableHead><TableHead className="font-mono text-[11px]">Type</TableHead><TableHead className="font-mono text-[11px]">Description</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-mono text-[11px]">transcript_json</TableCell><TableCell className="font-mono text-[11px]">jsonb</TableCell><TableCell className="font-mono text-[11px]">Array of TranscriptTurn objects</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">summary_text</TableCell><TableCell className="font-mono text-[11px]">text</TableCell><TableCell className="font-mono text-[11px]">AI-generated meeting summary</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">recording_url</TableCell><TableCell className="font-mono text-[11px]">text</TableCell><TableCell className="font-mono text-[11px]">URL to Recall.ai recording</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">attendees</TableCell><TableCell className="font-mono text-[11px]">jsonb</TableCell><TableCell className="font-mono text-[11px]">Array of participant names</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          {/* ── 5. Phone FMC ───────────────────────────────────────────── */}
          <section>
            <SectionHeader id="phone" title="Phone FMC" sub="§ 05 · Native Phone Channel" />
            <div className="mt-6 space-y-6">
              <Prose>
                <p>Vanta operates as a licensed MVNO on Amdocs ConnectX. Phone calls are captured at the network level via Fixed Mobile Convergence — no app required, no behavioral change.</p>
              </Prose>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Infrastructure Stack</p>
                <Code>{`User's Native Dialer
  → Vanta MVNO Network (eSIM)
  → Amdocs ConnectX BSS/OSS
  → SIP-level Audio Interception
  → CDR Generation + Transcript
  → phone-call-webhook Edge Function
  → Gemini Classification
  → Signals Table`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">CDR Webhook Payload</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="font-mono text-[11px]">Field</TableHead><TableHead className="font-mono text-[11px]">Type</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-mono text-[11px]">call_id</TableCell><TableCell className="font-mono text-[11px]">string</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">caller</TableCell><TableCell className="font-mono text-[11px]">string (E.164)</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">callee</TableCell><TableCell className="font-mono text-[11px]">string (E.164)</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">duration_sec</TableCell><TableCell className="font-mono text-[11px]">number</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">transcript</TableCell><TableCell className="font-mono text-[11px]">string</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">started_at</TableCell><TableCell className="font-mono text-[11px]">ISO 8601</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Phone-Specific Signal Tags</p>
                <div className="flex flex-wrap gap-2">
                  {["commitment", "decision", "open_question", "relationship_signal", "deal_signal"].map((tag) => (
                    <span key={tag} className="font-mono text-[10px] px-2 py-0.5 rounded border border-vanta-border bg-vanta-bg-elevated text-vanta-text-mid">{tag}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">PhoneClassification Interface</p>
                <Code>{`interface PhoneClassification {
  signalType: string;
  priority: string;
  summary: string;
  tags: PhoneCallTag[];
  actionsTaken: string[];
}`}</Code>
              </div>
            </div>
          </section>

          {/* ── 6. Gemini AI Pipeline ──────────────────────────────────── */}
          <section>
            <SectionHeader id="gemini" title="Gemini AI Pipeline" sub="§ 06 · Classification Engine" />
            <div className="mt-6 space-y-6">
              <Prose>
                <p>All channels share a common AI classification pattern via the Lovable AI Gateway. Each channel provides a channel-specific system prompt, and the model returns structured JSON.</p>
              </Prose>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Gateway Configuration</p>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="font-mono text-[11px]">Property</TableHead><TableHead className="font-mono text-[11px]">Value</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-mono text-[11px]">Endpoint</TableCell><TableCell className="font-mono text-[11px] text-vanta-accent">ai.gateway.lovable.dev/v1/chat/completions</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Classification Model</TableCell><TableCell className="font-mono text-[11px]">google/gemini-2.5-flash</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Reply Generation</TableCell><TableCell className="font-mono text-[11px]">google/gemini-2.5-flash-lite</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Temperature</TableCell><TableCell className="font-mono text-[11px]">0.2 (classify) / 0.4 (reply)</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono text-[11px]">Auth</TableCell><TableCell className="font-mono text-[11px]">Bearer token via LOVABLE_API_KEY</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Shared Classification Output</p>
                <Code>{`interface Classification {
  signalType: "INTRO" | "INSIGHT" | "INVESTMENT" 
             | "DECISION" | "CONTEXT" | "NOISE" 
             | "MEETING" | "PHONE_CALL";
  priority: "high" | "medium" | "low";
  summary: string;
  actionsTaken: string[];
}`}</Code>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Per-Channel Prompt Differences</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[11px]">Channel</TableHead>
                      <TableHead className="font-mono text-[11px]">Input</TableHead>
                      <TableHead className="font-mono text-[11px]">Extra Fields</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-[11px]">Linq</TableCell>
                      <TableCell className="font-mono text-[11px]">sender + message body</TableCell>
                      <TableCell className="font-mono text-[11px]">—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-[11px]">Gmail</TableCell>
                      <TableCell className="font-mono text-[11px]">from, subject, body, snippet</TableCell>
                      <TableCell className="font-mono text-[11px]">email_metadata (subject, to, thread)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-[11px]">Zoom</TableCell>
                      <TableCell className="font-mono text-[11px]">transcript turns + title + attendees</TableCell>
                      <TableCell className="font-mono text-[11px]">meeting_artifacts (transcript, summary, recording)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-[11px]">Phone</TableCell>
                      <TableCell className="font-mono text-[11px]">transcript + caller/callee + duration</TableCell>
                      <TableCell className="font-mono text-[11px]">tags (commitment, decision, etc.)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Action Codes</p>
                <div className="flex flex-wrap gap-2">
                  {["BIO_RESEARCH", "MEETING_PREP", "EMAIL_DRAFT", "AGENT_BUILD", "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "CALENDAR_HOLD", "BRIEF_COMPILE", "AUTO_REPLY_SENT"].map((code) => (
                    <span key={code} className="font-mono text-[10px] px-2 py-0.5 rounded border border-vanta-border bg-vanta-bg-elevated text-vanta-text-mid">{code}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── 7. Database Schema ─────────────────────────────────────── */}
          <section>
            <SectionHeader id="schema" title="Database Schema" sub="§ 07 · Data Model" />
            <div className="mt-6 space-y-6">

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">signals Table</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[11px]">Column</TableHead>
                      <TableHead className="font-mono text-[11px]">Type</TableHead>
                      <TableHead className="font-mono text-[11px]">Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["id", "uuid", "gen_random_uuid()"],
                      ["sender", "text", "—"],
                      ["source_message", "text", "—"],
                      ["summary", "text", "—"],
                      ["signal_type", "signal_type enum", "'CONTEXT'"],
                      ["priority", "signal_priority enum", "'medium'"],
                      ["status", "signal_status enum", "'Captured'"],
                      ["source", "signal_source enum", "'linq'"],
                      ["actions_taken", "text[]", "'{}'"],
                      ["captured_at", "timestamptz", "now()"],
                      ["created_at", "timestamptz", "now()"],
                      ["linq_message_id", "text", "null"],
                      ["meeting_id", "text", "null"],
                      ["email_metadata", "jsonb", "null"],
                      ["raw_payload", "jsonb", "null"],
                    ].map(([col, type, def]) => (
                      <TableRow key={col}>
                        <TableCell className="font-mono text-[11px]">{col}</TableCell>
                        <TableCell className="font-mono text-[11px]">{type}</TableCell>
                        <TableCell className="font-mono text-[11px] text-vanta-text-low">{def}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">meeting_artifacts Table</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[11px]">Column</TableHead>
                      <TableHead className="font-mono text-[11px]">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["id", "uuid"],
                      ["signal_id", "uuid (FK → signals)"],
                      ["transcript_json", "jsonb"],
                      ["summary_text", "text"],
                      ["recording_url", "text"],
                      ["attendees", "jsonb"],
                      ["created_at", "timestamptz"],
                    ].map(([col, type]) => (
                      <TableRow key={col}>
                        <TableCell className="font-mono text-[11px]">{col}</TableCell>
                        <TableCell className="font-mono text-[11px]">{type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted mb-2">Enums</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "signal_type", values: ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE", "MEETING", "PHONE_CALL"] },
                    { name: "signal_priority", values: ["high", "medium", "low"] },
                    { name: "signal_status", values: ["Captured", "In Progress", "Complete"] },
                    { name: "signal_source", values: ["linq", "gmail", "manual", "recall", "phone"] },
                  ].map((e) => (
                    <div key={e.name} className="bg-vanta-bg-elevated border border-vanta-border rounded-md p-3">
                      <p className="font-mono text-[11px] font-bold text-foreground mb-2">{e.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {e.values.map((v) => (
                          <span key={v} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-vanta-border text-vanta-text-mid">{v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── 8. Edge Functions Reference ─────────────────────────────── */}
          <section>
            <SectionHeader id="functions" title="Edge Functions Reference" sub="§ 08 · Deployment" />
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-[11px]">Function</TableHead>
                    <TableHead className="font-mono text-[11px]">Trigger</TableHead>
                    <TableHead className="font-mono text-[11px]">Source</TableHead>
                    <TableHead className="font-mono text-[11px]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["linq-webhook", "Webhook (POST)", "Linq v3", "Receive, verify HMAC, classify, insert, auto-reply"],
                    ["gmail-poll", "Scheduled / Manual", "Gmail API", "Poll inbox, classify emails, insert signals"],
                    ["recall-webhook", "Webhook (POST)", "Recall.ai", "Process meeting transcripts, store artifacts"],
                    ["phone-call-webhook", "Webhook (POST)", "ConnectX CDR", "Classify phone calls, extract tags, store artifacts"],
                    ["linq-register-webhook", "Manual (POST)", "Internal", "Register/list/delete Linq webhook subscriptions"],
                    ["linq-send", "Manual (POST)", "Internal", "Send messages via Linq API (new thread or existing chat)"],
                  ].map(([fn, trigger, source, desc]) => (
                    <TableRow key={fn}>
                      <TableCell className="font-mono text-[11px] text-vanta-accent">{fn}</TableCell>
                      <TableCell className="font-mono text-[11px]">{trigger}</TableCell>
                      <TableCell className="font-mono text-[11px]">{source}</TableCell>
                      <TableCell className="text-[11px]">{desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}

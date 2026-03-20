import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Signal, SignalStatus, MeetingArtifact } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import { PARTNER_LOGOS } from "@/components/PartnerLogos";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Video, FileText, MessageSquare, Sparkles, Image, Film, Mic, Paperclip,
  Download, Mail, CalendarPlus, Flag, ListChecks, User, Brain, Edit3,
  Pin, CheckCircle2, Clock, Send, Pencil, ChevronDown, X, Phone,
  AlertTriangle, Lightbulb, BookOpen, Copy, Loader2, Users, Share2, Save,
} from "lucide-react";
import { format } from "date-fns";
import FileAttachments from "@/components/FileAttachments";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SignalType, SignalPriority } from "@/data/signals";

const SIGNAL_TYPES: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE", "MEETING", "PHONE_CALL"];
const PRIORITIES: SignalPriority[] = ["high", "medium", "low"];
const STATUSES: SignalStatus[] = ["Captured", "In Progress", "Complete"];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type MeetingTab = "intelligence" | "summary" | "ask-ai" | "speakers" | "transcript" | "recording";

const MEETING_TABS: { key: MeetingTab; label: string; icon: React.ReactNode }[] = [
  { key: "intelligence", label: "Intelligence", icon: <Sparkles className="w-3 h-3" /> },
  { key: "summary", label: "Summary", icon: <FileText className="w-3 h-3" /> },
  { key: "ask-ai", label: "Ask AI", icon: <Brain className="w-3 h-3" /> },
  { key: "speakers", label: "Speakers", icon: <Users className="w-3 h-3" /> },
  { key: "transcript", label: "Transcript", icon: <MessageSquare className="w-3 h-3" /> },
  { key: "recording", label: "Recording", icon: <Video className="w-3 h-3" /> },
];

/* ── Helpful Memory generator ── */
function getHelpfulMemory(signal: Signal): string[] {
  const memories: string[] = [];
  if (signal.signalType === "INTRO") {
    memories.push(`${signal.sender} was introduced to you recently. Consider acknowledging the connection.`);
  }
  if (signal.signalType === "INVESTMENT") {
    memories.push(`This relates to an investment discussion. Review any prior commitments or term sheets.`);
  }
  if (signal.signalType === "MEETING" || signal.source === "recall") {
    memories.push(`Meeting context from ${signal.sender}. Key takeaways may inform your next interaction.`);
  }
  if (signal.priority === "high") {
    memories.push(`This was classified as high priority. Timely response recommended.`);
  }
  if (signal.actionsTaken.length > 0) {
    memories.push(`${signal.actionsTaken.length} action(s) already taken on this signal.`);
  }
  if (signal.dueDate) {
    const due = new Date(signal.dueDate);
    const now = new Date();
    if (due < now) memories.push(`This item is overdue. Was due ${format(due, "MMM d")}.`);
    else memories.push(`Due by ${format(due, "MMM d")}. Plan accordingly.`);
  }
  return memories;
}

/* ── Proposed reply generator ── */
function getProposedReply(signal: Signal): string {
  if (signal.signalType === "INTRO") {
    return `Hi ${signal.sender.split(" ")[0]},\n\nThank you for the introduction. I'd love to connect and learn more. Would next week work for a quick call?\n\nBest regards`;
  }
  if (signal.signalType === "MEETING") {
    return `Hi ${signal.sender.split(" ")[0]},\n\nGreat meeting today. I've noted the key points and will follow up on the action items we discussed.\n\nLooking forward to our next session.`;
  }
  if (signal.signalType === "INVESTMENT") {
    return `Hi ${signal.sender.split(" ")[0]},\n\nThank you for sharing this. I'll review the details and circle back with my thoughts by end of week.`;
  }
  if (signal.signalType === "DECISION") {
    return `Hi ${signal.sender.split(" ")[0]},\n\nUnderstood. I'll process this decision and update the relevant stakeholders.`;
  }
  return `Hi ${signal.sender.split(" ")[0]},\n\nThanks for this. I'll review and get back to you shortly.`;
}

/* ── Further considerations ── */
function getFurtherConsiderations(signal: Signal): string[] {
  const items: string[] = [];
  items.push(`Review ${signal.sender}'s recent activity for additional context.`);
  if (signal.signalType === "INTRO") {
    items.push("Check mutual connections before responding.");
    items.push("Research their company and recent news.");
  }
  if (signal.signalType === "INVESTMENT") {
    items.push("Verify current portfolio exposure in this sector.");
    items.push("Cross-reference with existing deal pipeline.");
  }
  if (signal.signalType === "MEETING") {
    items.push("Share meeting notes with attendees who may have missed it.");
  }
  if (signal.priority === "high") {
    items.push("Consider escalating if no response within 24 hours.");
  }
  return items;
}

/* ── Risk badge ── */
const RISK_BADGE: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-vanta-signal-yellow text-foreground",
  low: "bg-muted text-muted-foreground",
};

interface SignalDetailDrawerProps {
  signal: Signal | null;
  open: boolean;
  onClose: () => void;
}

const SignalDetailDrawer = ({ signal, open, onClose }: SignalDetailDrawerProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SignalStatus>("Captured");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [meetingTab, setMeetingTab] = useState<MeetingTab>("intelligence");
  const [artifact, setArtifact] = useState<MeetingArtifact | null>(null);
  const [loadingArtifact, setLoadingArtifact] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  // Inline editing states
  const [editingSummary, setEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState("");
  const [editingSource, setEditingSource] = useState(false);
  const [editSourceText, setEditSourceText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const queryClient = useQueryClient();

  // Sync edit texts when signal changes
  useEffect(() => {
    if (signal) {
      setEditSummaryText(signal.summary);
      setEditSourceText(signal.sourceMessage);
      setEditingSummary(false);
      setEditingSource(false);
    }
  }, [signal?.id]);

  const handleSaveEdit = async (field: "summary" | "source_message", value: string) => {
    if (!signal) return;
    setSavingEdit(true);
    const update = field === "summary" ? { summary: value } : { source_message: value };
    const { error } = await supabase.from("signals").update(update).eq("id", signal.id);
    setSavingEdit(false);
    if (error) { toast.error("Failed to save edit"); return; }
    queryClient.invalidateQueries({ queryKey: ["signals"] });
    queryClient.invalidateQueries({ queryKey: ["meetings-hub"] });
    if (field === "summary") setEditingSummary(false);
    else setEditingSource(false);
    toast.success("Saved");
  };

  const handleShareMeeting = async () => {
    if (!signal) return;
    const summaryBlock = artifact?.summaryText ? `\n\nSummary:\n${artifact.summaryText}` : "";
    const actionsBlock = signal.actionsTaken.length > 0 ? `\n\nActions:\n${signal.actionsTaken.map(a => `• ${a.replace(/_/g, " ")}`).join("\n")}` : "";
    const text = `${signal.summary}${summaryBlock}${actionsBlock}\n\n— Vanta Signal`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Meeting summary copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  useEffect(() => { if (signal?.status) setCurrentStatus(signal.status); }, [signal?.id, signal?.status]);
  useEffect(() => { if (open && scrollRef.current) scrollRef.current.scrollTop = 0; }, [signal?.id, open]);
  useEffect(() => {
    if (!signal || signal.signalType !== "MEETING") { setArtifact(null); setMeetingTab("intelligence"); return; }
    const fetchArtifact = async () => {
      setLoadingArtifact(true);
      const { data, error } = await supabase.from("meeting_artifacts").select("*").eq("signal_id", signal.id).limit(1).maybeSingle();
      if (!error && data) {
        setArtifact({ id: data.id, signalId: data.signal_id, createdAt: data.created_at, transcriptJson: data.transcript_json as Record<string, unknown>[] | null, summaryText: data.summary_text, recordingUrl: data.recording_url, attendees: data.attendees as Record<string, unknown>[] | null });
      } else setArtifact(null);
      setLoadingArtifact(false);
    };
    fetchArtifact();
  }, [signal?.id, signal?.signalType]);

  // Initialize proposed reply when signal changes
  useEffect(() => {
    if (signal) {
      setReplyMessage(getProposedReply(signal));
      setEditingReply(false);
      setReplyOpen(false);
      setAiQuestion("");
      setAiAnswer("");
      setAiLoading(false);
    }
  }, [signal?.id]);

  if (!signal) return null;

  const colors = SIGNAL_TYPE_COLORS[signal.signalType];
  const isMeeting = signal.signalType === "MEETING";
  const meetingSourceKey = signal.source === "recall" ? "zoom" : signal.source === "fireflies" ? "fireflies" : signal.source === "otter" ? "otter" : null;
  const MeetingSourceLogo = meetingSourceKey ? PARTNER_LOGOS[meetingSourceKey] : null;
  const helpfulMemory = getHelpfulMemory(signal);
  const furtherConsiderations = getFurtherConsiderations(signal);

  const senderNumber = (signal.rawPayload as Record<string, unknown>)?.from as string || (signal.rawPayload as Record<string, unknown>)?.sender as string || "";

  const handleSendReply = async () => {
    if (!replyMessage.trim()) { toast.error("Message is empty"); return; }
    setSending(true);
    try {
      const to = senderNumber || signal.sender;
      const { data, error } = await supabase.functions.invoke("linq-send", { body: { to: to.trim(), message: replyMessage.trim() } });
      if (error) throw error;
      if (data?.success) { toast.success("Message sent"); setReplyOpen(false); }
      else toast.error(data?.error || "Failed to send");
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleStatusUpdate = async (newStatus: SignalStatus) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("signals").update({ status: newStatus }).eq("id", signal.id);
    setUpdatingStatus(false);
    if (error) { toast.error("Failed to update status"); }
    else { setCurrentStatus(newStatus); queryClient.invalidateQueries({ queryKey: ["signals"] }); toast.success(`Status → ${newStatus}`); }
  };

  const handlePin = async () => {
    const newPinned = !signal.pinned;
    const { error } = await supabase.from("signals").update({ pinned: newPinned }).eq("id", signal.id);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["signals"] }); queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] }); toast.success(newPinned ? "Pinned" : "Unpinned"); }
  };

  /* ── Meeting sub-renders ── */

  const renderMeetingTabs = () => (
    <div className="flex border-b border-border">
      {MEETING_TABS.map((tab) => (
        <button key={tab.key} onClick={() => setMeetingTab(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors border-b-2 ${
            meetingTab === tab.key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}>
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  const renderMeetingContent = () => {
    if (loadingArtifact) return <div className="py-8 text-center"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Loading meeting data…</p></div>;
    switch (meetingTab) {
      case "intelligence": return renderIntelligenceTab();
      case "summary": return (
        <section>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Meeting Summary</h3>
          {artifact?.summaryText ? <p className="font-sans text-[13px] leading-[1.7] text-foreground/70 whitespace-pre-wrap">{artifact.summaryText}</p> : <p className="font-mono text-[10px] text-muted-foreground">No summary available.</p>}
          {artifact?.attendees && (artifact.attendees as Record<string, unknown>[]).length > 0 && (
            <div className="mt-4">
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Attendees</h4>
              <div className="flex flex-wrap gap-1.5">
                {(artifact.attendees as Record<string, unknown>[]).map((a, i) => (
                  <span key={i} className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary border border-primary/30 px-2 py-1 rounded">{(a as Record<string, unknown>).name as string || (a as Record<string, unknown>).email as string || `Participant ${i + 1}`}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      );
      case "ask-ai": return renderAskAITab();
      case "speakers": return renderSpeakersTab();
      case "transcript": return renderTranscriptTab();
      case "recording": return (
        <section>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Meeting Recording</h3>
          {artifact?.recordingUrl ? <div className="border border-border bg-muted/30 rounded-lg overflow-hidden"><video src={artifact.recordingUrl} controls className="w-full" preload="metadata" /></div> : <p className="font-mono text-[10px] text-muted-foreground">No recording available.</p>}
        </section>
      );
      default: return null;
    }
  };

  const renderIntelligenceTab = () => (
    <>
      <section>
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Intelligence Summary</h3>
        <p className="font-sans text-[13px] leading-[1.7] text-foreground/70">{signal.summary}</p>
      </section>
      {signal.classificationReasoning && (
        <section>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-1.5"><Brain className="w-3 h-3" /> Why This Classification?</h3>
          <div className="border border-border bg-muted/30 p-3 rounded-lg"><p className="font-mono text-[11px] leading-[1.6] text-foreground/60">{signal.classificationReasoning}</p></div>
        </section>
      )}
      <section>
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-1.5"><Edit3 className="w-3 h-3" /> Correct Classification</h3>
        <div className="flex gap-2 flex-wrap">
          <select defaultValue={signal.signalType} onChange={async (e) => {
            const newType = e.target.value;
            if (newType === signal.signalType) return;
            await supabase.from("signal_corrections").insert({ signal_id: signal.id, original_type: signal.signalType, corrected_type: newType, original_priority: signal.priority } as any);
            await supabase.from("signals").update({ signal_type: newType as any }).eq("id", signal.id);
            queryClient.invalidateQueries({ queryKey: ["signals"] }); toast.success(`Type corrected to ${newType}`);
          }} className="bg-background border border-border px-2 py-1 rounded font-mono text-[10px] text-foreground focus:outline-none">
            {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select defaultValue={signal.priority} onChange={async (e) => {
            const newPriority = e.target.value;
            if (newPriority === signal.priority) return;
            await supabase.from("signal_corrections").insert({ signal_id: signal.id, original_type: signal.signalType, original_priority: signal.priority, corrected_priority: newPriority } as any);
            await supabase.from("signals").update({ priority: newPriority as any }).eq("id", signal.id);
            queryClient.invalidateQueries({ queryKey: ["signals"] }); toast.success(`Priority corrected to ${newPriority}`);
          }} className="bg-background border border-border px-2 py-1 rounded font-mono text-[10px] text-foreground focus:outline-none">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </section>
    </>
  );

  const MEETING_AI_PROMPTS = [
    "Key decisions",
    "Action items",
    artifact?.attendees?.[0] ? `What did ${((artifact.attendees as Record<string, unknown>[])[0] as Record<string, unknown>).name || "the first speaker"} say?` : "Summarize each speaker",
    "Summarize takeaways",
  ];

  const askMeetingAI = async (q: string) => {
    if (!q.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const transcriptText = artifact?.transcriptJson
        ? (artifact.transcriptJson as Record<string, unknown>[])
            .map((t) => `[${(t as Record<string, unknown>).speaker || "Unknown"}]: ${(t as Record<string, unknown>).text || (t as Record<string, unknown>).content || ""}`)
            .join("\n")
        : "";
      const { data, error } = await supabase.functions.invoke("ask-meeting", {
        body: { summary: artifact?.summaryText || signal.summary, transcript: transcriptText, question: q.trim() },
      });
      if (error) throw error;
      setAiAnswer(data.answer || "No response.");
    } catch (e) {
      console.error("Ask meeting AI error:", e);
      toast.error("Couldn't get an answer");
    } finally {
      setAiLoading(false);
    }
  };

  const renderAskAITab = () => (
    <section className="space-y-3">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
        <Brain className="w-3 h-3" /> Ask AI About This Meeting
      </h3>

      {aiAnswer && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">Vanta</span>
          </div>
          <p className="font-sans text-[13px] text-foreground leading-relaxed">{aiAnswer}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {MEETING_AI_PROMPTS.map((p) => (
          <button key={p} onClick={() => { setAiQuestion(p); askMeetingAI(p); }} disabled={aiLoading}
            className="font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40">
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); askMeetingAI(aiQuestion); }} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/20">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)}
          placeholder="Ask anything about this meeting…"
          className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none" disabled={aiLoading} />
        <button type="submit" disabled={!aiQuestion.trim() || aiLoading}
          className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-30">
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </section>
  );

  const renderSpeakersTab = () => {
    const turns = (artifact?.transcriptJson as Record<string, unknown>[] | null) ?? [];
    const speakerMap = new Map<string, number>();
    turns.forEach((t) => {
      const name = ((t as Record<string, unknown>).speaker as string) || "Unknown";
      speakerMap.set(name, (speakerMap.get(name) || 0) + 1);
    });
    const attendeeNames = new Set(
      ((artifact?.attendees as Record<string, unknown>[] | null) ?? []).map((a) => ((a as Record<string, unknown>).name as string) || ((a as Record<string, unknown>).email as string) || "")
    );
    const identified = [...speakerMap.entries()].filter(([name]) => attendeeNames.has(name));
    const other = [...speakerMap.entries()].filter(([name]) => !attendeeNames.has(name));

    const renderSpeaker = ([name, count]: [string, number]) => (
      <div key={name} className="flex items-center gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-display text-[12px] text-primary">{name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[13px] font-semibold text-foreground truncate">{name}</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground border border-border px-2 py-0.5 rounded">
          {count} turn{count !== 1 ? "s" : ""}
        </span>
      </div>
    );

    return (
      <section className="space-y-4">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Speakers ({speakerMap.size})
        </h3>
        {speakerMap.size === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground">No speaker data available.</p>
        ) : (
          <>
            {identified.length > 0 && (
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Identified</p>
                <div className="divide-y divide-border">{identified.map(renderSpeaker)}</div>
              </div>
            )}
            {other.length > 0 && (
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{identified.length > 0 ? "Other" : "All Speakers"}</p>
                <div className="divide-y divide-border">{other.map(renderSpeaker)}</div>
              </div>
            )}
          </>
        )}
      </section>
    );
  };

  const renderTranscriptTab = () => {
    const copyTranscript = () => {
      if (!artifact?.transcriptJson) return;
      const text = (artifact.transcriptJson as Record<string, unknown>[])
        .map((t) => `[${(t as Record<string, unknown>).speaker || "Unknown"}] ${(t as Record<string, unknown>).text || (t as Record<string, unknown>).content || ""}`)
        .join("\n");
      navigator.clipboard.writeText(text);
      toast.success("Transcript copied");
    };

    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Full Transcript</h3>
          {artifact?.transcriptJson && (
            <button onClick={copyTranscript}
              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-foreground/30">
              <Copy className="w-3 h-3" /> Copy
            </button>
          )}
        </div>
        {artifact?.transcriptJson && Array.isArray(artifact.transcriptJson) ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto border border-border bg-muted/30 p-4 rounded-lg">
            {(artifact.transcriptJson as Record<string, unknown>[]).map((turn, i) => (
              <div key={i}>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-[12px] font-bold text-foreground">{(turn as Record<string, unknown>).speaker as string || "Unknown"}</span>
                  {(turn as Record<string, unknown>).timestamp && (
                    <span className="font-mono text-[9px] text-muted-foreground">{(turn as Record<string, unknown>).timestamp as string}</span>
                  )}
                </div>
                <p className="font-sans text-[12px] leading-[1.6] text-foreground/60 mt-0.5">{(turn as Record<string, unknown>).text as string || (turn as Record<string, unknown>).content as string || ""}</p>
              </div>
            ))}
          </div>
        ) : <p className="font-mono text-[10px] text-muted-foreground">No transcript available.</p>}
      </section>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { setReplyOpen(false); onClose(); } }}>
      <SheetContent ref={scrollRef} side="right" className="w-full sm:max-w-[520px] bg-background border-l border-border p-0 overflow-y-auto">

        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-block px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-[0.15em] border ${colors.text} ${colors.bg} ${colors.border}`}>
              {signal.signalType.replace("_", " ")}
            </span>

            {signal.riskLevel && (
              <span className={`inline-block px-2.5 py-1 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider ${RISK_BADGE[signal.riskLevel]}`}>
                {signal.riskLevel}
              </span>
            )}
            {signal.priority === "high" && !signal.riskLevel && (
              <span className="inline-block px-2.5 py-1 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground">High</span>
            )}
            {signal.priority === "medium" && !signal.riskLevel && (
              <span className="inline-block px-2.5 py-1 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider bg-vanta-signal-yellow text-foreground">Medium</span>
            )}

            {typeof signal.confidenceScore === "number" && (
              <span className={`inline-block px-2 py-1 rounded-md font-mono text-[10px] tracking-[0.12em] border ${
                signal.confidenceScore >= 0.85 ? "text-vanta-signal-green border-vanta-signal-green/30 bg-vanta-signal-green/10"
                : signal.confidenceScore >= 0.6 ? "text-vanta-signal-yellow border-vanta-signal-yellow/30 bg-vanta-signal-yellow/10"
                : "text-destructive border-destructive/30 bg-destructive/10"
              }`}>
                {Math.round(signal.confidenceScore * 100)}% conf
              </span>
            )}

            {isMeeting && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-[0.15em] border border-primary/20 text-primary bg-primary/5">
                <Video className="w-3 h-3" /> Zoom
              </span>
            )}
          </div>

          {/* Sender + view contact */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-display text-[13px] text-primary">{signal.sender.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-[15px] text-foreground text-left truncate">{signal.sender}</SheetTitle>
              <p className="font-mono text-[10px] text-muted-foreground">{formatTimestamp(signal.capturedAt)}</p>
            </div>
            <button onClick={() => { onClose(); navigate(`/contact/${encodeURIComponent(signal.sender)}`); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors">
              <User className="w-3 h-3" /> Profile
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 mt-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updatingStatus}
                className={`px-2.5 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  currentStatus === s
                    ? s === "Complete" ? "bg-vanta-signal-green/20 text-vanta-signal-green border border-vanta-signal-green/30"
                    : s === "In Progress" ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                } ${updatingStatus ? "opacity-50" : ""}`}>
                {s}
              </button>
            ))}
          </div>
        </SheetHeader>

        {isMeeting && renderMeetingTabs()}

        <div className="px-6 py-5 space-y-6">

          {/* ── Summary (editable) ── */}
          <section>
            <div className="flex items-start justify-between gap-2 mb-2">
              {editingSummary ? (
                <div className="flex-1 space-y-2">
                  <textarea value={editSummaryText} onChange={(e) => setEditSummaryText(e.target.value)} rows={3}
                    className="w-full bg-background border border-border font-display text-[17px] font-bold text-foreground leading-snug px-3 py-2 focus:outline-none focus:border-primary/40 resize-none rounded" />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleSaveEdit("summary", editSummaryText)} disabled={savingEdit}
                      className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => { setEditingSummary(false); setEditSummaryText(signal.summary); }}
                      className="px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="font-display text-[17px] font-bold text-foreground leading-snug flex-1">{signal.summary}</h3>
              )}
              {!editingSummary && (
                <button onClick={() => setEditingSummary(true)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Source message (editable) */}
            <div className="group relative">
              {editingSource ? (
                <div className="space-y-2">
                  <textarea value={editSourceText} onChange={(e) => setEditSourceText(e.target.value)} rows={5}
                    className="w-full bg-background border border-border font-sans text-[13px] leading-relaxed text-muted-foreground px-3 py-2 focus:outline-none focus:border-primary/40 resize-none rounded" />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleSaveEdit("source_message", editSourceText)} disabled={savingEdit}
                      className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => { setEditingSource(false); setEditSourceText(signal.sourceMessage); }}
                      className="px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">{signal.sourceMessage}</p>
                  <button onClick={() => setEditingSource(true)}
                    className="absolute top-0 right-0 p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Share button for meetings */}
          {isMeeting && (
            <div className="flex gap-2">
              <button onClick={handleShareMeeting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share Summary
              </button>
              <button onClick={() => {
                const subject = encodeURIComponent(`Meeting Notes: ${signal.summary}`);
                const body = encodeURIComponent(`${signal.summary}\n\n${artifact?.summaryText || signal.sourceMessage}\n\n— Vanta Signal`);
                window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
              }} className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email Notes
              </button>
            </div>
          )}

          {isMeeting ? renderMeetingContent() : (
            <>
              {/* ── Helpful Memory (MetaLab) ── */}
              {helpfulMemory.length > 0 && (
                <section className="border border-primary/20 bg-primary/[0.04] rounded-lg p-4">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Helpful Memory
                  </h3>
                  <ul className="space-y-2">
                    {helpfulMemory.map((mem, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                        <p className="font-sans text-[13px] leading-relaxed text-foreground/70">{mem}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ── VANTA Proposed Reply (MetaLab) ── */}
              <section className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> VANTA Proposed Reply
                  </h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingReply(!editingReply); if (!editingReply) setReplyOpen(true); }}
                      className={`p-1.5 rounded transition-colors ${editingReply ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {editingReply ? (
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      className="w-full bg-background border border-border text-foreground/80 font-sans text-[13px] px-3 py-2 leading-relaxed focus:outline-none focus:border-primary/40 resize-none rounded"
                    />
                  ) : (
                    <p className="font-sans text-[13px] leading-relaxed text-foreground/70 whitespace-pre-wrap">{replyMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
                  <button onClick={handleSendReply} disabled={sending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> {sending ? "Sending…" : "Send"}
                  </button>
                  <button onClick={() => { 
                    const subject = encodeURIComponent(`Re: ${signal.sender}`);
                    const body = encodeURIComponent(replyMessage);
                    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                  }} className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  {signal.signalType === "PHONE_CALL" && (
                    <button onClick={() => window.open(`tel:${senderNumber}`, "_blank")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                  )}
                </div>
              </section>

              {/* ── Quick Actions Row ── */}
              <section>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handlePin}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                      signal.pinned ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                    }`}>
                    <Pin className="w-3.5 h-3.5" /> {signal.pinned ? "Pinned" : "Pin"}
                  </button>

                  {currentStatus !== "Complete" && (
                    <button onClick={() => handleStatusUpdate("Complete")} disabled={updatingStatus}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-vanta-signal-green border border-vanta-signal-green/30 hover:bg-vanta-signal-green/10 transition-colors disabled:opacity-50">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                  )}

                  {(signal.signalType === "MEETING" || signal.source === "recall") && (
                    <button onClick={() => {
                      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
                      const end = new Date(tomorrow); end.setMinutes(30);
                      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(tomorrow)}/${fmt(end)}`, "_blank");
                    }} className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                      <CalendarPlus className="w-3.5 h-3.5" /> Follow Up
                    </button>
                  )}

                  {signal.signalType === "INVESTMENT" && (
                    <button onClick={async () => {
                      const { error } = await supabase.from("signals").update({ status: "In Progress" as const, risk_level: "high" as const }).eq("id", signal.id);
                      if (!error) { queryClient.invalidateQueries({ queryKey: ["signals"] }); toast.success("Flagged for review"); }
                    }} className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                      <Flag className="w-3.5 h-3.5" /> Flag Review
                    </button>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                        <Clock className="w-3.5 h-3.5" /> Remind
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={undefined} onSelect={async (date) => {
                        if (!date) return;
                        try {
                          const { error } = await supabase.functions.invoke("create-reminder", { body: { signal_id: signal.id, due_date: format(date, "yyyy-MM-dd") } });
                          if (error) throw error;
                          queryClient.invalidateQueries({ queryKey: ["action-items"] });
                          toast.success(`Reminder set for ${format(date, "MMM d")}`);
                        } catch { toast.error("Failed to set reminder"); }
                      }} disabled={(date) => date < new Date()} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </section>

              {/* ── Further Considerations About Contact (MetaLab) ── */}
              {furtherConsiderations.length > 0 && (
                <section className="border border-border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Further Considerations About {signal.sender.split(" ")[0]}
                  </h3>
                  <ul className="space-y-2">
                    {furtherConsiderations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">{item}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Classification intelligence */}
              {renderIntelligenceTab()}

              {/* Source message */}
              <section>
                <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Source Message</h3>
                <div className="border border-border bg-muted/30 p-4 rounded-lg">
                  <p className="font-mono text-[11px] leading-[1.6] text-foreground/60 whitespace-pre-wrap">{signal.sourceMessage}</p>
                </div>
              </section>

              {/* Actions Taken */}
              {signal.actionsTaken.length > 0 && (
                <section>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Actions Executed</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {signal.actionsTaken.map((action) => (
                      <span key={action} className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground border border-border px-2 py-1 rounded">{formatAction(action)}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Linq Message ID */}
              {signal.linqMessageId && (
                <section>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Linq Message ID</h3>
                  <p className="font-mono text-[10px] text-foreground/50 break-all">{signal.linqMessageId}</p>
                </section>
              )}

              {/* Raw Payload (collapsible) */}
              {signal.rawPayload && (
                <section>
                  <button onClick={() => setShowRawPayload(!showRawPayload)}
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={`w-3 h-3 transition-transform ${showRawPayload ? "rotate-180" : ""}`} />
                    Raw Payload
                  </button>
                  {showRawPayload && (
                    <div className="mt-2 border border-border bg-muted/30 p-4 rounded-lg overflow-x-auto">
                      <pre className="font-mono text-[10px] leading-[1.5] text-foreground/50 whitespace-pre-wrap break-all">{JSON.stringify(signal.rawPayload, null, 2)}</pre>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* File Attachments */}
          <section><FileAttachments signalId={signal.id} /></section>

          {/* Signal ID */}
          <section className="pt-4 border-t border-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Signal ID: {signal.id}</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SignalDetailDrawer;

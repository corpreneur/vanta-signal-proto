import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Signal, SignalStatus, MeetingArtifact } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Video, FileText, MessageSquare, Sparkles, Image, Film, Mic, Paperclip, Download, ExternalLink, Mail, CalendarPlus, Flag, ListChecks } from "lucide-react";

const STATUSES: SignalStatus[] = ["Captured", "In Progress", "Complete"];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type MeetingTab = "intelligence" | "summary" | "transcript" | "recording";

const MEETING_TABS: { key: MeetingTab; label: string; icon: React.ReactNode }[] = [
  { key: "intelligence", label: "Intelligence", icon: <Sparkles className="w-3 h-3" /> },
  { key: "summary", label: "Summary", icon: <FileText className="w-3 h-3" /> },
  { key: "transcript", label: "Transcript", icon: <MessageSquare className="w-3 h-3" /> },
  { key: "recording", label: "Recording", icon: <Video className="w-3 h-3" /> },
];

interface SignalDetailDrawerProps {
  signal: Signal | null;
  open: boolean;
  onClose: () => void;
}

const SignalDetailDrawer = ({ signal, open, onClose }: SignalDetailDrawerProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyMediaUrl, setReplyMediaUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SignalStatus>("Captured");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [meetingTab, setMeetingTab] = useState<MeetingTab>("intelligence");
  const [artifact, setArtifact] = useState<MeetingArtifact | null>(null);
  const [loadingArtifact, setLoadingArtifact] = useState(false);
  const queryClient = useQueryClient();

  // Sync status when signal changes
  useEffect(() => {
    if (signal?.status) setCurrentStatus(signal.status);
  }, [signal?.id, signal?.status]);

  // Fetch meeting artifact for recall signals
  useEffect(() => {
    if (!signal || signal.source !== "recall") {
      setArtifact(null);
      setMeetingTab("intelligence");
      return;
    }

    const fetchArtifact = async () => {
      setLoadingArtifact(true);
      const { data, error } = await supabase
        .from("meeting_artifacts")
        .select("*")
        .eq("signal_id", signal.id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setArtifact({
          id: data.id,
          signalId: data.signal_id,
          createdAt: data.created_at,
          transcriptJson: data.transcript_json as Record<string, unknown>[] | null,
          summaryText: data.summary_text,
          recordingUrl: data.recording_url,
          attendees: data.attendees as Record<string, unknown>[] | null,
        });
      } else {
        setArtifact(null);
      }
      setLoadingArtifact(false);
    };

    fetchArtifact();
  }, [signal?.id, signal?.source]);

  if (!signal) return null;

  const colors = SIGNAL_TYPE_COLORS[signal.signalType];
  const isMeeting = signal.source === "recall";

  // Extract phone number from rawPayload if available
  const senderNumber =
    (signal.rawPayload as Record<string, unknown>)?.from as string ||
    (signal.rawPayload as Record<string, unknown>)?.sender as string ||
    "";

  const handleOpenReply = () => {
    setReplyTo(senderNumber);
    setReplyMessage("");
    setReplyOpen(true);
  };

  const handleSend = async () => {
    if (!replyTo.trim() || !replyMessage.trim()) {
      toast.error("Recipient and message are required");
      return;
    }

    setSending(true);
    try {
      const invokeBody: Record<string, unknown> = { to: replyTo.trim(), message: replyMessage.trim() };
      if (replyMediaUrl.trim()) {
        invokeBody.media = [{ url: replyMediaUrl.trim() }];
      }
      const { data, error } = await supabase.functions.invoke("linq-send", {
        body: invokeBody,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Message sent via Linq");
        setReplyOpen(false);
        setReplyMessage("");
      } else {
        toast.error(data?.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const renderMeetingTabs = () => (
    <div className="flex border-b border-vanta-border">
      {MEETING_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setMeetingTab(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors border-b-2 ${
            meetingTab === tab.key
              ? "text-vanta-accent-zoom border-vanta-accent-zoom"
              : "text-vanta-text-muted border-transparent hover:text-vanta-text-low"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderMeetingContent = () => {
    if (loadingArtifact) {
      return (
        <div className="py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted">
            Loading meeting data…
          </p>
        </div>
      );
    }

    switch (meetingTab) {
      case "intelligence":
        return renderIntelligenceTab();
      case "summary":
        return (
          <section>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
              Meeting Summary
            </h3>
            {artifact?.summaryText ? (
              <p className="font-sans text-[13px] leading-[1.7] text-vanta-text-mid whitespace-pre-wrap">
                {artifact.summaryText}
              </p>
            ) : (
              <p className="font-mono text-[10px] text-vanta-text-muted">No summary available.</p>
            )}
            {artifact?.attendees && (artifact.attendees as Record<string, unknown>[]).length > 0 && (
              <div className="mt-4">
                <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                  Attendees
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(artifact.attendees as Record<string, unknown>[]).map((a, i) => (
                    <span
                      key={i}
                      className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent-zoom border border-vanta-accent-zoom-border px-2 py-1"
                    >
                      {(a as Record<string, unknown>).name as string || (a as Record<string, unknown>).email as string || `Participant ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      case "transcript":
        return (
          <section>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
              Full Transcript
            </h3>
            {artifact?.transcriptJson && Array.isArray(artifact.transcriptJson) ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto border border-vanta-border bg-vanta-bg-elevated p-4">
                {(artifact.transcriptJson as Record<string, unknown>[]).map((turn, i) => (
                  <div key={i}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-accent-zoom">
                      {(turn as Record<string, unknown>).speaker as string || "Unknown"}
                    </span>
                    {(turn as Record<string, unknown>).timestamp && (
                      <span className="font-mono text-[9px] text-vanta-text-muted ml-2">
                        {(turn as Record<string, unknown>).timestamp as string}
                      </span>
                    )}
                    <p className="font-mono text-[11px] leading-[1.6] text-vanta-text-low mt-0.5">
                      {(turn as Record<string, unknown>).text as string || (turn as Record<string, unknown>).content as string || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[10px] text-vanta-text-muted">No transcript available.</p>
            )}
          </section>
        );
      case "recording":
        return (
          <section>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
              Meeting Recording
            </h3>
            {artifact?.recordingUrl ? (
              <div className="border border-vanta-accent-zoom-border bg-vanta-bg-elevated">
                <video
                  src={artifact.recordingUrl}
                  controls
                  className="w-full"
                  preload="metadata"
                />
              </div>
            ) : (
              <p className="font-mono text-[10px] text-vanta-text-muted">No recording available.</p>
            )}
          </section>
        );
      default:
        return null;
    }
  };

  const renderIntelligenceTab = () => (
    <>
      {/* AI Summary */}
      <section>
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
          Intelligence Summary
        </h3>
        <p className="font-sans text-[13px] leading-[1.7] text-vanta-text-mid">
          {signal.summary}
        </p>
      </section>

      {/* Full Source Message */}
      <section>
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
          Source Message
        </h3>
        <div className="border border-vanta-border bg-vanta-bg-elevated p-4">
          <p className="font-mono text-[11px] leading-[1.6] text-vanta-text-low whitespace-pre-wrap">
            {signal.sourceMessage}
          </p>
        </div>
      </section>

      {/* Actions Taken */}
      {signal.actionsTaken.length > 0 && (
        <section>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
            Actions Executed
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {signal.actionsTaken.map((action) => (
              <span
                key={action}
                className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border px-2 py-1"
              >
                {formatAction(action)}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { setReplyOpen(false); onClose(); } }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] bg-background border-l border-vanta-border p-0 overflow-y-auto"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-vanta-border">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${colors.text} ${colors.bg} ${colors.border}`}
            >
              {signal.signalType}
            </span>
            <span className="inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border border-vanta-border text-vanta-text-low bg-transparent">
              {signal.priority}
            </span>
            {isMeeting && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border border-vanta-accent-zoom-border text-vanta-accent-zoom bg-vanta-accent-zoom-faint">
                <Video className="w-3 h-3" />
                Zoom
              </span>
            )}
            <select
              value={currentStatus}
              disabled={updatingStatus}
              onChange={async (e) => {
                const newStatus = e.target.value as SignalStatus;
                setUpdatingStatus(true);
                const { error } = await supabase
                  .from("signals")
                  .update({ status: newStatus })
                  .eq("id", signal.id);
                setUpdatingStatus(false);
                if (error) {
                  toast.error("Failed to update status");
                  console.error(error);
                } else {
                  setCurrentStatus(newStatus);
                  queryClient.invalidateQueries({ queryKey: ["signals"] });
                  toast.success(`Status → ${newStatus}`);
                }
              }}
              className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border bg-transparent cursor-pointer focus:outline-none appearance-none ${
                currentStatus === "Complete"
                  ? "text-vanta-accent border-vanta-accent-border"
                  : currentStatus === "In Progress"
                  ? "text-vanta-accent-amber border-vanta-accent-amber-border"
                  : "text-vanta-text-low border-vanta-border"
              } ${updatingStatus ? "opacity-50" : ""}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <SheetTitle className="font-mono text-[12px] uppercase tracking-[0.12em] text-vanta-text-mid text-left">
            {signal.sender}
          </SheetTitle>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted">
            {formatTimestamp(signal.capturedAt)}
          </p>
        </SheetHeader>

        {/* Meeting tabs */}
        {isMeeting && renderMeetingTabs()}

        <div className="px-6 py-5 space-y-6">
          {isMeeting ? (
            renderMeetingContent()
          ) : (
            <>
              {/* Smart Actions — contextual by signal type */}
              <section className="space-y-2">
                <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
                  Smart Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* Reply via Linq — always available */}
                  {!replyOpen && (
                    <button
                      onClick={handleOpenReply}
                      className="flex items-center gap-1.5 h-8 px-3 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Reply via Linq
                    </button>
                  )}

                  {/* INTRO → Draft Reply Email */}
                  {signal.signalType === "INTRO" && (
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent(`Re: Introduction from ${signal.sender}`);
                        const body = encodeURIComponent(`Following up on the introduction.\n\nContext: ${signal.summary}`);
                        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 border border-vanta-border text-vanta-text-mid font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Draft Reply
                    </button>
                  )}

                  {/* MEETING → Schedule Follow-Up */}
                  {(signal.signalType === "MEETING" || signal.source === "recall") && (
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(10, 0, 0, 0);
                        const end = new Date(tomorrow);
                        end.setMinutes(30);
                        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(tomorrow)}/${fmt(end)}`;
                        window.open(url, "_blank");
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 border border-vanta-border text-vanta-text-mid font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      Schedule Follow-Up
                    </button>
                  )}

                  {/* DECISION → Create Task */}
                  {signal.signalType === "DECISION" && (
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent(`Task: ${signal.summary.slice(0, 60)}`);
                        const body = encodeURIComponent(`Decision signal from ${signal.sender}:\n\n${signal.summary}\n\nOriginal: ${signal.sourceMessage}`);
                        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                        toast.success("Opening task draft");
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 border border-vanta-border text-vanta-text-mid font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
                    >
                      <ListChecks className="w-3 h-3" />
                      Create Task
                    </button>
                  )}

                  {/* INVESTMENT → Flag for Review */}
                  {signal.signalType === "INVESTMENT" && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("signals")
                          .update({ status: "In Progress" as const, risk_level: "high" as const })
                          .eq("id", signal.id);
                        if (error) {
                          toast.error("Failed to flag");
                        } else {
                          queryClient.invalidateQueries({ queryKey: ["signals"] });
                          toast.success("Flagged for review");
                        }
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 border border-vanta-border text-vanta-text-mid font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-signal-red-border hover:text-vanta-signal-red transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      Flag for Review
                    </button>
                  )}
                </div>
              </section>

              {/* Reply Compose (shown when open) */}
              {replyOpen && (
                <section className="border border-vanta-accent-border bg-vanta-bg-elevated p-4 space-y-3">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent mb-1">
                    Compose Reply
                  </h3>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                      To
                    </label>
                    <input
                      type="text"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full bg-background border border-vanta-border text-vanta-text-mid font-mono text-[11px] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border placeholder:text-vanta-text-muted"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                      Message
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                      placeholder="Type your message…"
                      className="w-full bg-background border border-vanta-border text-vanta-text-mid font-mono text-[11px] px-3 py-2 leading-[1.5] focus:outline-none focus:border-vanta-accent-border placeholder:text-vanta-text-muted resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                      Attach Media URL (optional)
                    </label>
                    <input
                      type="url"
                      value={replyMediaUrl}
                      onChange={(e) => setReplyMediaUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-background border border-vanta-border text-vanta-text-mid font-mono text-[11px] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border placeholder:text-vanta-text-muted"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 h-8 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                    <button
                      onClick={() => setReplyOpen(false)}
                      className="h-8 px-4 border border-vanta-border text-vanta-text-low font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-border-mid transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              )}

              {renderIntelligenceTab()}

              {/* Linq Message ID */}
              {signal.linqMessageId && (
                <section>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                    Linq Message ID
                  </h3>
                  <p className="font-mono text-[10px] text-vanta-text-low break-all">
                    {signal.linqMessageId}
                  </p>
                </section>
              )}

              {/* Attachments Gallery */}
              {signal.rawPayload && typeof signal.rawPayload === "object" && (() => {
                const rp = signal.rawPayload as Record<string, unknown>;
                const attachments = rp._vanta_attachments as Array<{ type: string; url?: string; mime?: string; filename?: string }> | undefined;
                if (!attachments || attachments.length === 0) return null;
                return (
                  <section>
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                      Attachments ({attachments.length})
                    </h3>
                    <div className="space-y-3">
                      {attachments.map((att, i) => {
                        const isImage = att.mime?.startsWith("image") || att.type === "image";
                        const isVideo = att.mime?.startsWith("video") || att.type === "video";
                        const isAudio = att.mime?.startsWith("audio") || att.type === "audio";

                        if (isImage && att.url) {
                          return (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block border border-vanta-border hover:border-vanta-accent-border transition-colors">
                              <img src={att.url} alt={att.filename || "Image"} className="w-full max-h-64 object-contain bg-vanta-bg-elevated" />
                              {att.filename && <p className="font-mono text-[9px] text-vanta-text-muted px-2 py-1">{att.filename}</p>}
                            </a>
                          );
                        }
                        if (isVideo && att.url) {
                          return (
                            <div key={i} className="border border-vanta-border bg-vanta-bg-elevated">
                              <video src={att.url} controls preload="metadata" className="w-full" />
                              {att.filename && <p className="font-mono text-[9px] text-vanta-text-muted px-2 py-1">{att.filename}</p>}
                            </div>
                          );
                        }
                        if (isAudio && att.url) {
                          return (
                            <div key={i} className="border border-vanta-border bg-vanta-bg-elevated p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Mic className="w-3 h-3 text-vanta-text-mid" />
                                <span className="font-mono text-[10px] text-vanta-text-mid">{att.filename || "Audio"}</span>
                              </div>
                              <audio src={att.url} controls className="w-full" />
                            </div>
                          );
                        }
                        // Generic file / document
                        return (
                          <a key={i} href={att.url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-vanta-border bg-vanta-bg-elevated hover:border-vanta-accent-border transition-colors">
                            <Paperclip className="w-4 h-4 text-vanta-text-mid flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[11px] text-vanta-text-mid truncate">{att.filename || att.type}</p>
                              {att.mime && <p className="font-mono text-[9px] text-vanta-text-muted">{att.mime}</p>}
                            </div>
                            <Download className="w-3 h-3 text-vanta-text-muted flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* Raw Payload */}
              {signal.rawPayload && (
                <section>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                    Raw Payload
                  </h3>
                  <div className="border border-vanta-border bg-vanta-bg-elevated p-4 overflow-x-auto">
                    <pre className="font-mono text-[10px] leading-[1.5] text-vanta-text-low whitespace-pre-wrap break-all">
                      {JSON.stringify(signal.rawPayload, null, 2)}
                    </pre>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Signal ID */}
          <section className="pt-4 border-t border-vanta-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted">
              Signal ID: {signal.id}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SignalDetailDrawer;

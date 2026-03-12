import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Signal, SignalStatus } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

interface SignalDetailDrawerProps {
  signal: Signal | null;
  open: boolean;
  onClose: () => void;
}

const SignalDetailDrawer = ({ signal, open, onClose }: SignalDetailDrawerProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!signal) return null;

  const colors = SIGNAL_TYPE_COLORS[signal.signalType];

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
      const { data, error } = await supabase.functions.invoke("linq-send", {
        body: { to: replyTo.trim(), message: replyMessage.trim() },
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
            <span
              className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${
                signal.status === "Complete"
                  ? "text-vanta-accent border-vanta-accent-border"
                  : signal.status === "In Progress"
                  ? "text-vanta-accent-amber border-vanta-accent-amber-border"
                  : "text-vanta-text-low border-vanta-border"
              }`}
            >
              {signal.status}
            </span>
          </div>
          <SheetTitle className="font-mono text-[12px] uppercase tracking-[0.12em] text-vanta-text-mid text-left">
            {signal.sender}
          </SheetTitle>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted">
            {formatTimestamp(signal.capturedAt)}
          </p>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Reply / Compose */}
          {!replyOpen ? (
            <button
              onClick={handleOpenReply}
              className="w-full h-9 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
            >
              Reply via Linq
            </button>
          ) : (
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

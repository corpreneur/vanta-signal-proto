import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";

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
  if (!signal) return null;

  const colors = SIGNAL_TYPE_COLORS[signal.signalType];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
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

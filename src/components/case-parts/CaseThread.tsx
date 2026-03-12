import type { Thread } from "@/data/cases";

interface CaseThreadProps {
  thread: Thread;
}

const CaseThread = ({ thread }: CaseThreadProps) => {
  return (
    <div className="mb-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
        Thread
      </p>
      <p className="font-mono text-[10px] text-vanta-text-muted mb-4">
        {thread.header}
      </p>
      <div className="space-y-3">
        {thread.messages.map((msg, i) => {
          const isOut = msg.direction === "out";
          const isVantaTrigger = msg.sender.includes("Vanta");
          return (
            <div key={i}>
              {msg.separator && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-vanta-border-mid" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
                    The Manual Trigger · Today
                  </span>
                  <div className="flex-1 h-px bg-vanta-border-mid" />
                </div>
              )}
              <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 border ${
                    isVantaTrigger
                      ? "bg-vanta-accent-faint border-primary"
                      : isOut
                        ? "bg-vanta-bubble-out border-vanta-bubble-out-border"
                        : "bg-vanta-bubble-in border-vanta-bubble-in-border"
                  }`}
                >
                  <p className="font-mono text-[10px] text-vanta-text-muted mb-1">
                    {msg.sender}
                    {msg.timestamp && (
                      <span className="ml-2 text-vanta-text-muted">{msg.timestamp}</span>
                    )}
                  </p>
                  <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseThread;

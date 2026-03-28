import { useState } from "react";
import { Calendar, Check, ExternalLink, RefreshCw, Shield, Clock } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

type SyncStatus = "disconnected" | "connecting" | "connected";

export default function CalendarSyncSettings() {
  const [status, setStatus] = useState<SyncStatus>("disconnected");
  const [syncDirection, setSyncDirection] = useState<"one-way" | "two-way">("two-way");

  const handleConnect = () => {
    setStatus("connecting");
    // Stub: In production this would initiate Google OAuth
    setTimeout(() => {
      toast.info("Google Calendar OAuth integration coming soon. This is a preview of the settings UI.");
      setStatus("disconnected");
    }, 2000);
  };

  return (
    <div>
      <Motion>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-vanta-accent-amber" />
            <h2 className="font-sans text-xl font-bold text-foreground">Calendar Sync</h2>
          </div>
          <p className="font-mono text-[11px] text-vanta-text-muted leading-relaxed max-w-lg">
            Connect Google Calendar for automatic meeting detection, pre-meeting briefs, and two-way event management.
          </p>
        </div>
      </Motion>

      {/* Connection card */}
      <Motion delay={40}>
        <div className="border border-vanta-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-vanta-accent-amber/10 flex items-center justify-center ring-1 ring-vanta-accent-amber/20">
                <Calendar className="w-5 h-5 text-vanta-accent-amber" />
              </div>
              <div>
                <p className="font-mono text-[13px] font-medium text-foreground">Google Calendar</p>
                <p className="font-mono text-[10px] text-vanta-text-muted">
                  {status === "connected" ? "Syncing every 15 minutes" : "Not connected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status === "connected" ? "bg-vanta-signal-green animate-pulse" :
                status === "connecting" ? "bg-vanta-accent-amber animate-pulse" :
                "bg-vanta-text-muted"
              }`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${
                status === "connected" ? "text-vanta-signal-green" :
                status === "connecting" ? "text-vanta-accent-amber" :
                "text-vanta-text-muted"
              }`}>
                {status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : "Disconnected"}
              </span>
            </div>
          </div>

          {status === "disconnected" && (
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-vanta-accent-amber/10 border border-vanta-accent-amber/30 text-vanta-accent-amber font-mono text-[11px] uppercase tracking-widest hover:bg-vanta-accent-amber/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Connect Google Calendar
            </button>
          )}

          {status === "connecting" && (
            <div className="flex items-center justify-center gap-2 py-3">
              <RefreshCw className="w-3.5 h-3.5 text-vanta-accent-amber animate-spin" />
              <span className="font-mono text-[11px] text-vanta-accent-amber">Waiting for authorization…</span>
            </div>
          )}
        </div>
      </Motion>

      {/* Sync settings (shown regardless of connection for preview) */}
      <Motion delay={80}>
        <div className="border border-vanta-border bg-card p-6 mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-4 border-b border-vanta-border pb-2">
            Sync Direction
          </h3>
          <div className="space-y-2">
            {(["one-way", "two-way"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setSyncDirection(dir)}
                className={`w-full flex items-center justify-between p-4 border transition-colors ${
                  syncDirection === dir
                    ? "border-vanta-accent bg-vanta-accent/5"
                    : "border-vanta-border hover:border-foreground/10"
                }`}
              >
                <div className="text-left">
                  <p className="font-mono text-[12px] font-medium text-foreground">
                    {dir === "one-way" ? "Read Only" : "Two-Way Sync"}
                  </p>
                  <p className="font-mono text-[10px] text-vanta-text-muted">
                    {dir === "one-way"
                      ? "Import calendar events for meeting briefs — no write-back"
                      : "Full sync — create events from Vanta, update meeting notes back to calendar"}
                  </p>
                </div>
                {syncDirection === dir && <Check className="w-4 h-4 text-vanta-accent shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </Motion>

      {/* Synced events preview */}
      <Motion delay={100}>
        <div className="border border-border bg-card mb-5">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Synced events
            </p>
            {syncDirection === "two-way" && (
              <button
                onClick={() => setShowCreateEvent(!showCreateEvent)}
                className="inline-flex items-center gap-1 font-mono text-[9px] text-primary hover:underline"
              >
                <Plus className="w-2.5 h-2.5" />
                Create event
              </button>
            )}
          </div>

          {showCreateEvent && (
            <div className="p-4 border-b border-border bg-muted/30">
              <p className="font-mono text-[10px] text-muted-foreground mb-2">
                Create an event from Vanta and push it to Google Calendar
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="Meeting title…"
                  className="flex-1 px-3 py-2 border border-border bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => { setShowCreateEvent(false); toast.info("Event creation requires connected Google Calendar"); }}
                  className="px-3 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider"
                >
                  Push
                </button>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                No upcoming events
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((ev) => (
                <div key={ev.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  {ev.hasConflict && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] text-foreground truncate">{ev.title}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">
                      {formatEventTime(ev.startsAt)}
                      {ev.attendees > 0 && ` · ${ev.attendees} attendee${ev.attendees !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {ev.hasConflict && (
                    <span className="font-mono text-[8px] uppercase tracking-wider text-amber-500 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5">
                      Conflict
                    </span>
                  )}
                  {syncDirection === "two-way" && (
                    <ArrowLeftRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Motion>

      {/* Permissions preview */}
      <Motion delay={120}>
        <div className="border border-border bg-card p-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 border-b border-border pb-2">
            Required permissions
          </h3>
          <div className="space-y-3">
            {[
              { icon: Calendar, label: "Read calendar events", desc: "View upcoming meetings and attendees" },
              { icon: Clock, label: "Read event details", desc: "Access meeting times, descriptions, and conferencing links" },
              { icon: Shield, label: "Manage events (two-way only)", desc: "Create and update events on your behalf" },
            ].map((perm, i) => (
              <div key={i} className="flex items-start gap-3">
                <perm.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-[11px] text-foreground">{perm.label}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{perm.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Motion>
    </div>
  );
}


import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PARTNER_LOGOS from "@/components/PartnerLogos";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  account?: string;
  status?: "active" | "error" | "syncing";
}

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Gmail polling, Calendar sync, and Google Contacts import",
    icon: "G",
    connected: true,
    lastSync: "2 min ago",
    account: "vantasignals@vantasignal.app",
    status: "active",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Meeting recording, transcription via Recall.ai, and attendee detection",
    icon: "Z",
    connected: true,
    lastSync: "18 min ago",
    account: "vantasignals@zoom.us",
    status: "active",
  },
  {
    id: "linq",
    name: "Linq (iMessage)",
    description: "Real-time iMessage signal ingestion via webhook bridge",
    icon: "L",
    connected: true,
    lastSync: "Just now",
    account: "Device: iPhone 16 Pro",
    status: "active",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Channel monitoring, DM signal capture, and thread intelligence",
    icon: "S",
    connected: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Connection requests, message signals, and profile enrichment",
    icon: "in",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Meeting notes sync, decision log export, and knowledge base",
    icon: "N",
    connected: false,
  },
  {
    id: "fireflies",
    name: "Fireflies.ai",
    description: "AI meeting transcription and dedicated webhook endpoint",
    icon: "F",
    connected: false,
  },
  {
    id: "otter",
    name: "Otter.ai",
    description: "Real-time meeting transcription and notes",
    icon: "O",
    connected: false,
  },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  error: { label: "Error", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  syncing: { label: "Syncing", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

export default function ConnectedAccounts() {
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);

  const toggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.connected) {
          toast.success(`${i.name} disconnected.`);
          return { ...i, connected: false, lastSync: undefined, account: undefined, status: undefined };
        } else {
          toast.success(`${i.name} connected successfully.`);
          return { ...i, connected: true, lastSync: "Just now", account: `demo@${i.id}.com`, status: "active" as const };
        }
      })
    );
  };

  const resync = (id: string) => {
    const name = integrations.find((i) => i.id === id)?.name;
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "syncing" as const } : i))
    );
    toast.info(`Resyncing ${name}...`);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "active" as const, lastSync: "Just now" } : i))
      );
      toast.success(`${name} synced.`);
    }, 2000);
  };

  const connected = integrations.filter((i) => i.connected);
  const available = integrations.filter((i) => !i.connected);

  return (
    <div className="max-w-[640px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Dashboard
      </Link>

      <Motion>
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">Connected Accounts</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Manage signal source integrations
        </p>
      </Motion>

      {/* Connected */}
      {connected.length > 0 && (
        <Motion delay={40}>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Active Connections</p>
          <div className="space-y-3 mb-8">
            {connected.map((int) => {
              const badge = int.status ? STATUS_BADGE[int.status] : null;
              return (
                <div key={int.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {PARTNER_LOGOS[int.id] ? (
                        (() => { const Logo = PARTNER_LOGOS[int.id]; return <Logo className="w-7 h-7" />; })()
                      ) : (
                        <span className="font-display text-sm text-primary font-bold">{int.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-sans text-[14px] font-medium text-foreground">{int.name}</span>
                        {badge && (
                          <span className={`px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider border rounded-sm ${badge.cls}`}>
                            {int.status === "syncing" ? (
                              <span className="flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" />{badge.label}</span>
                            ) : badge.label}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground">{int.account}</p>
                      <p className="font-mono text-[9px] text-muted-foreground mt-0.5">Last sync: {int.lastSync}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resync(int.id)}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => toggleConnect(int.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Motion>
      )}

      {/* Available */}
      {available.length > 0 && (
        <Motion delay={80}>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Available Integrations</p>
          <div className="space-y-3">
            {available.map((int) => (
              <div key={int.id} className="border border-border rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-sm bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                    {PARTNER_LOGOS[int.id] ? (
                      (() => { const Logo = PARTNER_LOGOS[int.id]; return <Logo className="w-7 h-7 opacity-60" />; })()
                    ) : (
                      <span className="font-display text-sm text-muted-foreground font-bold">{int.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-sans text-[14px] font-medium text-foreground">{int.name}</span>
                    <p className="font-sans text-[12px] text-muted-foreground leading-relaxed">{int.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleConnect(int.id)}>
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Motion>
      )}
    </div>
  );
}

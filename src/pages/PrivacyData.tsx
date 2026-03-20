import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Shield, Eye, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

const PRIVACY_TOGGLES = [
  {
    id: "analytics",
    label: "Usage Analytics",
    description: "Allow anonymous usage data to improve the platform",
    icon: Eye,
    enabled: true,
  },
  {
    id: "ai_training",
    label: "AI Model Improvement",
    description: "Allow signal data to improve classification accuracy (anonymized)",
    icon: Shield,
    enabled: false,
  },
  {
    id: "session_recording",
    label: "Session Replays",
    description: "Record session interactions for debugging and UX research",
    icon: Eye,
    enabled: false,
  },
  {
    id: "third_party_sharing",
    label: "Third-Party Data Sharing",
    description: "Share aggregated, non-identifiable data with partners",
    icon: Shield,
    enabled: false,
  },
];

const DATA_RETENTION = [
  { label: "Signal data", retention: "2 years", records: "4,291 records" },
  { label: "Meeting transcripts", retention: "1 year", records: "67 recordings" },
  { label: "Contact profiles", retention: "Indefinite", records: "342 contacts" },
  { label: "Audit logs", retention: "90 days", records: "12,847 entries" },
];

export default function PrivacyData() {
  const [toggles, setToggles] = useState(PRIVACY_TOGGLES);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done">("idle");

  const togglePrivacy = (id: string) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
    toast.success("Privacy setting updated.");
  };

  const handleExport = () => {
    setExportStatus("exporting");
    toast.info("Preparing your data export...");
    setTimeout(() => {
      setExportStatus("done");
      toast.success("Data export ready for download.");
    }, 3000);
  };

  return (
    <div className="max-w-[600px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Dashboard
      </Link>

      <Motion>
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">Privacy & Data</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Control how your data is used and stored
        </p>
      </Motion>

      {/* Privacy toggles */}
      <Motion delay={40}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Privacy Controls</p>
        <div className="border border-border rounded-lg divide-y divide-border mb-8">
          {toggles.map((toggle) => {
            const Icon = toggle.icon;
            return (
              <div key={toggle.id} className="flex items-center gap-3 px-4 py-4">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-sans text-[13px] font-medium text-foreground">{toggle.label}</p>
                  <p className="font-sans text-[11px] text-muted-foreground">{toggle.description}</p>
                </div>
                <Switch checked={toggle.enabled} onCheckedChange={() => togglePrivacy(toggle.id)} />
              </div>
            );
          })}
        </div>
      </Motion>

      {/* Data retention */}
      <Motion delay={80}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Data Retention</p>
        <div className="border border-border rounded-lg overflow-hidden mb-8">
          <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
            {["Data Type", "Retention", "Volume"].map((h) => (
              <span key={h} className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{h}</span>
            ))}
          </div>
          {DATA_RETENTION.map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border last:border-0">
              <span className="font-sans text-[13px] text-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {row.retention}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{row.records}</span>
            </div>
          ))}
        </div>
      </Motion>

      {/* Data export */}
      <Motion delay={120}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Data Portability</p>
        <div className="border border-border rounded-lg p-5 mb-8">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-sans text-[14px] font-medium text-foreground mb-1">Export Your Data</p>
              <p className="font-sans text-[12px] text-muted-foreground mb-3">
                Download a complete copy of your signals, contacts, meetings, and settings in JSON format.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exportStatus === "exporting"}
              >
                {exportStatus === "exporting"
                  ? "Preparing..."
                  : exportStatus === "done"
                  ? "Download Ready"
                  : "Request Export"}
              </Button>
            </div>
          </div>
        </div>
      </Motion>

      {/* Danger zone */}
      <Motion delay={160}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-destructive mb-3">Danger Zone</p>
        <div className="border border-destructive/30 rounded-lg p-5 bg-destructive/5">
          {!showDeleteConfirm ? (
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-sans text-[14px] font-medium text-foreground mb-1">Delete Account</p>
                <p className="font-sans text-[12px] text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  Delete My Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-sans text-[14px] font-medium">Are you absolutely sure?</span>
              </div>
              <p className="font-sans text-[12px] text-muted-foreground">
                This will permanently delete 4,291 signals, 342 contacts, 67 meeting recordings, and all associated data.
                You will be logged out immediately.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => { toast.error("Account deletion — contact support."); setShowDeleteConfirm(false); }}>
                  Yes, Delete Everything
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Motion>
    </div>
  );
}

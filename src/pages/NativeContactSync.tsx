import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Smartphone, RefreshCw, Check, ArrowRight, Download, Zap, Shield } from "lucide-react";
import { MOCK_NATIVE_CONTACTS, type NativeContact } from "@/data/mockNativeContacts";
import { downloadVCard } from "@/lib/vcard";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";

function daysSince(iso?: string): number {
  if (!iso) return 999;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function recencyLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export default function NativeContactSync() {
  const [syncing, setSyncing] = useState(false);
  const [contacts, setContacts] = useState<NativeContact[]>(MOCK_NATIVE_CONTACTS);
  const [filter, setFilter] = useState<"all" | "synced" | "unsynced">("all");

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setContacts((prev) =>
        prev.map((c) => ({ ...c, vantaSynced: true }))
      );
      setSyncing(false);
      toast.success("All contacts synced with Vanta Signal");
    }, 1800);
  };

  const handleExportVcf = (c: NativeContact) => {
    downloadVCard({
      name: c.displayName,
      role: c.jobTitle || undefined,
      company: c.organizationName || undefined,
      email: c.emailAddresses[0]?.address,
      phone: c.phoneNumbers[0]?.number,
      note: c.vantaTags?.length
        ? `Vanta tags: ${c.vantaTags.join(", ")}`
        : "Exported from Vanta Signal",
    });
    toast.success(`${c.displayName}.vcf downloaded`);
  };

  const filtered = contacts.filter((c) => {
    if (filter === "synced") return c.vantaSynced;
    if (filter === "unsynced") return !c.vantaSynced;
    return true;
  });

  const syncedCount = contacts.filter((c) => c.vantaSynced).length;

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/contacts"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Smart Contacts
      </Link>

      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-[clamp(22px,4vw,28px)] leading-tight text-foreground">
                Native Contact Sync
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                iPhone Contacts ↔ Vanta Signal
              </p>
            </div>
          </div>
        </header>
      </Motion>

      {/* Sync status banner */}
      <Motion delay={30}>
        <div className="border border-primary/20 bg-primary/5 p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-foreground font-semibold">
              {syncedCount}/{contacts.length} contacts synced
            </p>
            <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
              Enriched with relationship strength, tags & signal history
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </Motion>

      {/* Capabilities */}
      <Motion delay={50}>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Zap, label: "Auto-enrich", desc: "Strength scores & tags pushed to native card" },
            { icon: Shield, label: "Privacy-first", desc: "Data stays on-device, no cloud relay" },
            { icon: Download, label: "vCard export", desc: "Tap to download .vcf for any contact" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="border border-border bg-card p-3">
              <Icon className="w-4 h-4 text-primary mb-2" />
              <p className="font-mono text-[10px] text-foreground font-semibold">{label}</p>
              <p className="font-mono text-[8px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </Motion>

      {/* Filter tabs */}
      <Motion delay={60}>
        <div className="flex gap-1 mb-4">
          {(["all", "synced", "unsynced"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                filter === f
                  ? "border-foreground text-foreground bg-card"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? `All (${contacts.length})` : f === "synced" ? `Synced (${syncedCount})` : `New (${contacts.length - syncedCount})`}
            </button>
          ))}
        </div>
      </Motion>

      {/* Contact list */}
      <div className="space-y-2">
        {filtered.map((c, i) => {
          const days = daysSince(c.vantaLastInteraction);
          return (
            <Motion key={c.id} delay={80 + i * 40}>
              <div className="border border-border bg-card hover:border-primary/20 transition-colors p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      c.vantaSynced ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
                    }`}>
                      <span className={`font-mono text-[12px] font-bold ${c.vantaSynced ? "text-primary" : "text-muted-foreground"}`}>
                        {c.givenName[0]}{c.familyName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[13px] font-semibold text-foreground truncate">
                          {c.displayName}
                        </p>
                        {c.vantaSynced && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-mono text-[8px] uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" /> Synced
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {[c.jobTitle, c.organizationName].filter(Boolean).join(" · ") || "No org info"}
                      </p>
                      {c.phoneNumbers[0] && (
                        <p className="font-mono text-[9px] text-muted-foreground/70">
                          {c.phoneNumbers[0].number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Vanta enrichment */}
                  <div className="flex items-center gap-3 shrink-0">
                    {c.vantaStrength != null && (
                      <div className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          c.vantaStrength >= 75 ? "text-emerald-500" :
                          c.vantaStrength >= 50 ? "text-sky-500" :
                          c.vantaStrength >= 25 ? "text-amber-500" : "text-muted-foreground"
                        }`}>
                          {c.vantaStrength}
                        </span>
                        <p className="font-mono text-[8px] text-muted-foreground uppercase">
                          {c.vantaSignalCount} signals · {recencyLabel(days)}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleExportVcf(c)}
                      title="Download .vcf"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {c.vantaSynced && (
                      <Link
                        to={`/contact/${encodeURIComponent(c.displayName)}`}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title="View in Vanta"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {c.vantaTags && c.vantaTags.length > 0 && (
                  <div className="flex gap-1 mt-2 ml-13">
                    {c.vantaTags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider bg-accent/50 text-accent-foreground border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Motion>
          );
        })}
      </div>

      {/* How it works */}
      <Motion delay={200}>
        <div className="mt-8 border border-border bg-card p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            How Native Sync Works
          </h3>
          <div className="space-y-2">
            {[
              "Vanta reads your iPhone contact list via Capacitor bridge",
              "Matches contacts to Signal history by name, email & phone",
              "Enriches native contact cards with relationship strength & tags",
              "Two-way: new contacts added in either app sync automatically",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-primary font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <p className="font-mono text-[11px] text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground/60 mt-3 italic">
            Demo mode — install as native app via Capacitor for live sync
          </p>
        </div>
      </Motion>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { Motion } from "@/components/ui/motion";
import { Input } from "@/components/ui/input";
import { MessageSquare, Phone, Video, Mail, StickyNote, Search, ArrowUpDown } from "lucide-react";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linq: MessageSquare, phone: Phone, recall: Video, gmail: Mail, manual: StickyNote,
};

async function fetchSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    signalType: row.signal_type,
    sender: row.sender,
    summary: row.summary,
    sourceMessage: row.source_message,
    priority: row.priority,
    capturedAt: row.captured_at,
    actionsTaken: row.actions_taken || [],
    status: row.status,
    source: (row as Record<string, unknown>).source as Signal["source"] || "linq",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"],
    dueDate: (row as Record<string, unknown>).due_date as string | null,
    callPointer: (row as Record<string, unknown>).call_pointer as string | null,
  }));
}

interface ContactSummary {
  name: string;
  signalCount: number;
  highPriority: number;
  lastInteraction: string;
  daysSinceLast: number;
  sources: Set<string>;
  signalTypes: Record<string, number>;
  dominantType: string;
  recentSignals: Signal[];
  strength: number; // 0–100
  strengthLabel: string;
}

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function recencyLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  if (days <= 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Compute a 0–100 relationship strength score */
function computeStrength(c: Omit<ContactSummary, "strength" | "strengthLabel">): { strength: number; strengthLabel: string } {
  // Frequency: log-scaled, capped contribution of 40
  const freqScore = Math.min(40, (Math.log2(c.signalCount + 1) / Math.log2(50)) * 40);

  // Recency: exponential decay, max 35
  const recencyScore = Math.max(0, 35 * Math.exp(-c.daysSinceLast / 14));

  // Priority weight: high-priority ratio, max 25
  const priorityRatio = c.signalCount > 0 ? c.highPriority / c.signalCount : 0;
  const priorityScore = priorityRatio * 25;

  const raw = Math.round(freqScore + recencyScore + priorityScore);
  const strength = Math.min(100, Math.max(0, raw));

  let strengthLabel = "Cold";
  if (strength >= 75) strengthLabel = "Strong";
  else if (strength >= 50) strengthLabel = "Warm";
  else if (strength >= 25) strengthLabel = "Cooling";

  return { strength, strengthLabel };
}

function buildContacts(signals: Signal[]): ContactSummary[] {
  const map = new Map<string, Omit<ContactSummary, "strength" | "strengthLabel">>();
  for (const s of signals) {
    const existing = map.get(s.sender);
    if (existing) {
      existing.signalCount++;
      if (s.priority === "high") existing.highPriority++;
      if (new Date(s.capturedAt) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = s.capturedAt;
        existing.daysSinceLast = daysBetween(s.capturedAt);
      }
      existing.sources.add(s.source);
      existing.signalTypes[s.signalType] = (existing.signalTypes[s.signalType] || 0) + 1;
      if (existing.recentSignals.length < 3) existing.recentSignals.push(s);
    } else {
      map.set(s.sender, {
        name: s.sender,
        signalCount: 1,
        highPriority: s.priority === "high" ? 1 : 0,
        lastInteraction: s.capturedAt,
        daysSinceLast: daysBetween(s.capturedAt),
        sources: new Set([s.source]),
        signalTypes: { [s.signalType]: 1 },
        dominantType: s.signalType,
        recentSignals: [s],
      });
    }
  }
  const results: ContactSummary[] = [];
  for (const node of map.values()) {
    let max = 0;
    for (const [type, count] of Object.entries(node.signalTypes)) {
      if (count > max) { max = count; node.dominantType = type; }
    }
    results.push({ ...node, ...computeStrength(node) });
  }
  return results;
}

type SortMode = "signals" | "recency" | "alpha" | "high" | "strength";

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recency");

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["contacts-signals"],
    queryFn: fetchSignals,
    refetchInterval: 60_000,
  });

  const contacts = useMemo(() => buildContacts(signals), [signals]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    const sortFns: Record<SortMode, (a: ContactSummary, b: ContactSummary) => number> = {
      signals: (a, b) => b.signalCount - a.signalCount,
      recency: (a, b) => a.daysSinceLast - b.daysSinceLast,
      alpha: (a, b) => a.name.localeCompare(b.name),
      high: (a, b) => b.highPriority - a.highPriority,
    };
    return [...list].sort(sortFns[sort]);
  }, [contacts, search, sort]);

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter((c) => c.daysSinceLast <= 7).length;
  const stalledContacts = contacts.filter((c) => c.daysSinceLast > 30).length;

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-8 md:pt-12 pb-16">
      <Motion>
        <header className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Smart Contact List
          </h1>
          <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
            Unified contact intelligence — relationship context, signal density, and interaction history at a glance.
          </p>
        </header>
      </Motion>

      {/* Stats */}
      <Motion delay={40}>
        <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-vanta-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Contacts</p>
            <p className="font-display text-[24px] text-foreground">{totalContacts}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Active (7d)</p>
            <p className="font-display text-[24px] text-foreground">{activeContacts}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Stalled (30d+)</p>
            <p className="font-display text-[24px] text-destructive">{stalledContacts}</p>
          </div>
        </div>
      </Motion>

      {/* Toolbar */}
      <Motion delay={80}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vanta-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="pl-9 font-mono text-xs bg-vanta-bg-elevated border-vanta-border"
            />
          </div>
          <div className="flex gap-1">
            {(["recency", "signals", "high", "alpha"] as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSort(m)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  sort === m
                    ? "border-foreground text-foreground bg-vanta-bg-elevated"
                    : "border-vanta-border text-vanta-text-low hover:text-foreground hover:border-vanta-border-mid"
                }`}
              >
                {m === "high" ? "Priority" : m === "alpha" ? "A–Z" : m === "signals" ? "Density" : "Recent"}
              </button>
            ))}
          </div>
        </div>
      </Motion>

      {/* Loading */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      {/* Contact cards */}
      <div className="space-y-2">
        {filtered.map((contact, i) => {
          const colors = SIGNAL_TYPE_COLORS[contact.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
          return (
            <Motion key={contact.name} delay={100 + i * 20}>
              <div
                onClick={() => navigate(`/contact/${encodeURIComponent(contact.name)}`)}
                className="border border-vanta-border bg-vanta-bg-elevated hover:border-vanta-border-mid transition-all cursor-pointer group"
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar circle */}
                      <div className={`w-9 h-9 shrink-0 flex items-center justify-center border ${colors.border} ${colors.bg}`} style={{ borderRadius: "50%" }}>
                        <span className={`${colors.text} font-mono text-[11px] font-bold`}>
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[13px] text-foreground font-semibold truncate group-hover:translate-x-0.5 transition-transform">
                          {contact.name}
                        </p>
                        <p className="font-mono text-[9px] text-vanta-text-muted uppercase tracking-wider">
                          {recencyLabel(contact.daysSinceLast)} · {contact.signalCount} signals
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {contact.highPriority > 0 && (
                        <span className="px-1.5 py-0.5 font-mono text-[9px] text-vanta-accent border border-vanta-accent-border bg-vanta-accent-faint">
                          {contact.highPriority} HIGH
                        </span>
                      )}
                      <div className="flex gap-1">
                        {Array.from(contact.sources).map((src) => {
                          const Icon = SOURCE_ICONS[src] || MessageSquare;
                          return <Icon key={src} className="w-3.5 h-3.5 text-vanta-text-low" />;
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Signal type chips */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(contact.signalTypes).map(([type, count]) => {
                      const tc = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
                      return (
                        <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1.5 py-0.5 border ${tc.border} uppercase tracking-wider`}>
                          {type} {count}
                        </span>
                      );
                    })}
                  </div>

                  {/* Recent signal previews */}
                  <div className="space-y-1">
                    {contact.recentSignals.slice(0, 2).map((s) => (
                      <p key={s.id} className="font-mono text-[10px] text-vanta-text-low truncate leading-relaxed">
                        <span className="text-vanta-text-muted mr-1">
                          {new Date(s.capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {s.summary}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Motion>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="py-16 text-center border border-vanta-border">
          <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">
            {search ? "No contacts match your search" : "No contacts in signal history"}
          </p>
        </div>
      )}
    </div>
  );
}

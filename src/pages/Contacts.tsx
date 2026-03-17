import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { computeStrength, daysBetween, recencyLabel } from "@/lib/contactStrength";
import { Motion } from "@/components/ui/motion";
import { Input } from "@/components/ui/input";
import { Search, Tag, Filter, UserPlus } from "lucide-react";
import { useAllContactTags } from "@/components/ContactTagManager";
import SmartContactCard from "@/components/SmartContactCard";
import AddContactContext from "@/components/AddContactContext";


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
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
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


/** Compute a 0–100 relationship strength score */
function computeContactStrength(c: Omit<ContactSummary, "strength" | "strengthLabel">): { strength: number; strengthLabel: string } {
  return computeStrength({
    signalCount: c.signalCount,
    highPriority: c.highPriority,
    daysSinceLast: c.daysSinceLast,
  });
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
    results.push({ ...node, ...computeContactStrength(node) });
  }
  return results;
}

type SortMode = "signals" | "recency" | "alpha" | "high" | "strength";

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  // Fetch engagement sequences for enrichment
  const { data: sequences = [] } = useQuery({
    queryKey: ["engagement-sequences"],
    queryFn: async () => {
      const { data } = await supabase.from("engagement_sequences").select("*").eq("enabled", true);
      return data || [];
    },
  });

  const sequenceMap = useMemo(() => {
    const map = new Map<string, { intervalDays: number; nextDueAt: string; note: string | null }>();
    sequences.forEach((s: any) => map.set(s.contact_name, { intervalDays: s.interval_days, nextDueAt: s.next_due_at, note: s.note }));
    return map;
  }, [sequences]);

  const [sort, setSort] = useState<SortMode>("strength");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { data: allTags } = useAllContactTags();

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
    if (filterTag && allTags) {
      const tagContacts = allTags.get(filterTag) || [];
      list = list.filter((c) => tagContacts.includes(c.name));
    }
    const sortFns: Record<SortMode, (a: ContactSummary, b: ContactSummary) => number> = {
      strength: (a, b) => b.strength - a.strength,
      signals: (a, b) => b.signalCount - a.signalCount,
      recency: (a, b) => a.daysSinceLast - b.daysSinceLast,
      alpha: (a, b) => a.name.localeCompare(b.name),
      high: (a, b) => b.highPriority - a.highPriority,
    };
    return [...list].sort(sortFns[sort]);
  }, [contacts, search, sort, filterTag, allTags]);

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter((c) => c.daysSinceLast <= 7).length;
  const stalledContacts = contacts.filter((c) => c.daysSinceLast > 30).length;

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-8 md:pt-12 pb-16">
      <Motion>
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
                Smart Contact List
              </h1>
              <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
                Unified contact intelligence — relationship context, signal density, and interaction history at a glance.
              </p>
            </div>
            <button
              onClick={() => setAddingContact(!addingContact)}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-primary text-primary hover:bg-primary/10 transition-colors shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>

          {/* Add Contact Context form */}
          {addingContact && (
            <div className="mt-4 space-y-3">
              <input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name…"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                autoFocus
              />
              {newContactName.trim() && (
                <AddContactContext
                  contactName={newContactName.trim()}
                  onClose={() => {
                    setAddingContact(false);
                    setNewContactName("");
                  }}
                />
              )}
            </div>
          )}
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
          <div className="flex gap-1 flex-wrap">
            {(["strength", "recency", "signals", "high", "alpha"] as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSort(m)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  sort === m
                    ? "border-foreground text-foreground bg-vanta-bg-elevated"
                    : "border-vanta-border text-vanta-text-low hover:text-foreground hover:border-vanta-border-mid"
                }`}
              >
                {m === "high" ? "Priority" : m === "alpha" ? "A–Z" : m === "signals" ? "Density" : m === "strength" ? "Strength" : "Recent"}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          {allTags && allTags.size > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Filter className="w-3 h-3 text-vanta-text-muted mr-1" />
              {Array.from(allTags.keys()).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border rounded-sm transition-colors ${
                    filterTag === tag
                      ? "border-primary text-primary bg-primary/10"
                      : "border-vanta-border text-vanta-text-low hover:text-foreground"
                  }`}
                >
                  <Tag className="w-2.5 h-2.5 inline mr-0.5" />
                  {tag} ({allTags.get(tag)?.length})
                </button>
              ))}
              {filterTag && (
                <button
                  onClick={() => setFilterTag(null)}
                  className="px-2 py-1 font-mono text-[9px] text-vanta-text-muted hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          )}
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
        {filtered.map((contact, i) => (
          <Motion key={contact.name} delay={100 + i * 20}>
            <SmartContactCard
              contact={{
                ...contact,
                sources: contact.sources,
                engagementSequence: sequenceMap.get(contact.name) || null,
              }}
            />
          </Motion>
        ))}
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

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import VCardImportDialog from "@/components/VCardImportDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { computeStrength, daysBetween, recencyLabel } from "@/lib/contactStrength";
import { Motion } from "@/components/ui/motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, UserPlus, LayoutGrid, LayoutList, Phone, Mail, MessageSquare, Smartphone, Upload, ChevronDown, ChevronUp, Network } from "lucide-react";
import { useAllContactTags } from "@/components/ContactTagManager";
import SmartContactCard from "@/components/SmartContactCard";
import AddContactContext from "@/components/AddContactContext";
import { buildGraph } from "@/components/graph/buildGraph";
import ForceGraph from "@/components/graph/ForceGraph";
import MiniContactCard from "@/components/graph/MiniContactCard";
import type { FocusedNode } from "@/components/graph/types";
import { useContactProfiles } from "@/hooks/use-contact-profiles";
import PinnedContactsRail from "@/components/contacts/PinnedContactsRail";
import ReEngageTray from "@/components/contacts/ReEngageTray";
import NewPeopleTray from "@/components/contacts/NewPeopleTray";

async function fetchSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals").select("*")
    .order("captured_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id, signalType: row.signal_type, sender: row.sender,
    summary: row.summary, sourceMessage: row.source_message, priority: row.priority,
    capturedAt: row.captured_at, actionsTaken: row.actions_taken || [],
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
  strength: number;
  strengthLabel: string;
}

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
type ViewMode = "list" | "grid";

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [graphOpen, setGraphOpen] = useState(false);
  const [focused, setFocused] = useState<FocusedNode | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDims, setGraphDims] = useState({ w: 800, h: 420 });

  const handleFocus = useCallback((f: FocusedNode | null) => setFocused(f), []);

  useEffect(() => {
    if (!graphOpen) return;
    const el = graphContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setGraphDims({ w: width, h: Math.max(360, Math.min(500, width * 0.55)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [graphOpen]);

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

  const { data: profiles = [] } = useContactProfiles();

  const contacts = useMemo(() => buildContacts(signals), [signals]);
  const graphData = useMemo(() => buildGraph(signals), [signals]);

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
  const strongContacts = contacts.filter((c) => c.strength >= 75).length;

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-6 pb-16 overflow-x-hidden">
      <Motion>
        <header className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-2 h-2 bg-vanta-accent"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Platform · Contacts
            </p>
          </div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground">
              Smart Contacts
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setAddingContact(!addingContact)}
                className="flex items-center gap-1 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-sm"
              >
                <UserPlus className="w-3 h-3" />
                <span className="hidden sm:inline">Add</span>
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-sm"
              >
                <Upload className="w-3 h-3" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <Link
                to="/contacts/sync"
                className="flex items-center gap-1 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-sm"
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">Sync</span>
              </Link>
            </div>
          </div>
          <p className="font-sans text-[14px] text-muted-foreground leading-relaxed max-w-[640px]">
            Relationship intelligence, strength scores, and proactive engagement.
          </p>

          {addingContact && (
            <div className="mt-4 space-y-3">
              <input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name…"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 rounded-lg"
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

      {/* Pinned Contacts Rail */}
      {profiles.length > 0 && (
        <Motion delay={30}>
          <PinnedContactsRail profiles={profiles} />
        </Motion>
      )}

      {/* Re-engage Tray */}
      <Motion delay={35}>
        <ReEngageTray contacts={contacts.map((c) => ({ name: c.name, daysSinceLast: c.daysSinceLast, strength: c.strength }))} />
      </Motion>

      {/* New People Tray */}
      <Motion delay={38}>
        <NewPeopleTray signals={signals} existingProfiles={profiles} />
      </Motion>

      {/* Stats */}
      <Motion delay={40}>
        <div className="grid grid-cols-4 gap-3 mb-5 pb-4 border-b border-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Contacts</p>
            <p className="font-display text-xl text-foreground">{totalContacts}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Active (7d)</p>
            <p className="font-display text-xl text-foreground">{activeContacts}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Strong</p>
            <p className="font-display text-xl text-vanta-signal-green">{strongContacts}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Stalled</p>
            <p className="font-display text-xl text-destructive">{stalledContacts}</p>
          </div>
        </div>
      </Motion>

      {/* Search */}
      <Motion delay={55}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="pl-9 font-mono text-xs bg-card border-border"
          />
        </div>
      </Motion>

      {/* Relationship Graph */}
      <Motion delay={60}>
        <div className="mb-5">
          <button
            onClick={() => { setGraphOpen(!graphOpen); setFocused(null); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 border border-border hover:border-foreground/20 bg-card transition-colors group"
          >
            <Network className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors flex-1 text-left">
              Relationship Graph
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">
              {graphData.nodes.length} nodes · {graphData.edges.length} edges
            </span>
            {graphOpen ? (
              <ChevronUp className="w-4 h-4 text-foreground transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground animate-pulse transition-transform" />
            )}
          </button>

          {graphOpen && graphData.nodes.length > 0 && (
            <div className="border border-t-0 border-border bg-card">
              <div className="flex flex-wrap gap-3 px-3 py-2 border-b border-border text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-primary inline-block rounded-full" /> &lt; 2d</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-vanta-accent-teal inline-block rounded-full" /> &lt; 7d</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-vanta-accent-amber inline-block rounded-full" /> &lt; 30d</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground inline-block rounded-full" /> 30d+</span>
                <span className="ml-auto text-muted-foreground/60">scroll zoom · drag pan · click node</span>
              </div>
              <div ref={graphContainerRef} className="relative w-full">
                <ForceGraph nodes={graphData.nodes} edges={graphData.edges} width={graphDims.w} height={graphDims.h} onFocus={handleFocus} />
                {focused && <MiniContactCard focused={focused} onClose={() => setFocused(null)} />}
              </div>
            </div>
          )}

          {graphOpen && graphData.nodes.length === 0 && (
            <div className="border border-t-0 border-border bg-card px-3 py-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">No relationship data to visualize</p>
            </div>
          )}
        </div>
      </Motion>

      {/* Toolbar */}
      <Motion delay={80}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {(["strength", "recency", "signals", "high", "alpha"] as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSort(m)}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  sort === m
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {m === "high" ? "Priority" : m === "alpha" ? "A–Z" : m === "signals" ? "Density" : m === "strength" ? "Strength" : "Recent"}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 border transition-colors ${viewMode === "list" ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 border transition-colors ${viewMode === "grid" ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {allTags && allTags.size > 0 && (
            <Select value={filterTag || "all"} onValueChange={(v) => setFilterTag(v === "all" ? null : v)}>
              <SelectTrigger className="w-[160px] h-8 font-mono text-[10px] uppercase tracking-wider">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {Array.from(allTags.keys()).map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag} ({allTags.get(tag)?.length})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Motion>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
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
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((contact, i) => {
            const colors = SIGNAL_TYPE_COLORS[contact.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
            const strengthColor =
              contact.strength >= 75 ? "bg-emerald-500" :
              contact.strength >= 50 ? "bg-sky-500" :
              contact.strength >= 25 ? "bg-amber-500" : "bg-muted-foreground";
            const strengthTextColor =
              contact.strength >= 75 ? "text-emerald-500" :
              contact.strength >= 50 ? "text-sky-500" :
              contact.strength >= 25 ? "text-amber-500" : "text-muted-foreground";

            return (
              <Motion key={contact.name} delay={100 + i * 30}>
                <div
                  onClick={() => navigate(`/contact/${encodeURIComponent(contact.name)}`)}
                  className="border border-border bg-card hover:border-primary/30 transition-all cursor-pointer p-4 flex flex-col group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-mono text-sm font-bold ${strengthColor}`}>
                      {contact.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] text-foreground font-semibold truncate group-hover:translate-x-0.5 transition-transform">{contact.name}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">{recencyLabel(contact.daysSinceLast)} · {contact.signalCount} signals</p>
                    </div>
                    <span className={`font-mono text-lg font-bold ${strengthTextColor}`}>{contact.strength}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(contact.signalTypes).slice(0, 3).map(([type, count]) => {
                      const tc = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
                      return (
                        <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1.5 py-0.5 border ${tc.border} uppercase tracking-wider`}>{type} {count}</span>
                      );
                    })}
                  </div>

                  {contact.recentSignals[0] && (
                    <p className="font-mono text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">{contact.recentSignals[0].summary}</p>
                  )}

                  <div className="flex gap-1.5 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <button className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                      <MessageSquare className="w-3 h-3" /> Text
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                      <Phone className="w-3 h-3" /> Call
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                      <Mail className="w-3 h-3" /> Email
                    </button>
                  </div>
                </div>
              </Motion>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-16 text-center border border-border">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            {search ? "No contacts match your search" : "No contacts in signal history"}
          </p>
        </div>
      )}

      <VCardImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

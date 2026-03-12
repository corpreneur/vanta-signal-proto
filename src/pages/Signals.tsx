import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import NavDrawer from "@/components/NavDrawer";
import Overlay from "@/components/Overlay";
import SignalFeed from "@/components/SignalFeed";
import SignalFilters from "@/components/SignalFilters";
import TagBrowser from "@/components/TagBrowser";
import type { FilterState } from "@/components/SignalFilters";
import type { SignalType } from "@/data/signals";
import { cases } from "@/data/cases";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching signals:", error);
    return [];
  }

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
    emailMetadata: (row as Record<string, unknown>).email_metadata as Signal["emailMetadata"] || null,
  }));
};

const SIGNAL_TYPES_ORDER: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "MEETING"];

const Signals = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: "ALL",
    sender: "ALL",
    priority: "ALL",
    search: "",
  });
  const queryClient = useQueryClient();

  const { data: signals = [] } = useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    refetchInterval: 60_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("signals-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["signals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const senders = useMemo(
    () => [...new Set(signals.map((s) => s.sender))].sort(),
    [signals]
  );

  const sortedSignals = useMemo(
    () =>
      [...signals].sort(
        (a, b) =>
          new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
      ),
    [signals]
  );

  // Tag counts for the browser
  const tagCounts = useMemo(
    () =>
      SIGNAL_TYPES_ORDER.map((type) => ({
        type,
        count: signals.filter((s) => s.signalType === type).length,
      })),
    [signals]
  );

  const handleTagSelect = (type: SignalType | "ALL") => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const toggleNav = () => {
    setNavOpen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  };

  const closeNav = () => {
    setNavOpen(false);
    document.body.style.overflow = "";
  };

  const highCount = sortedSignals.filter((s) => s.priority === "high").length;
  const actionCount = sortedSignals.reduce((acc, s) => acc + s.actionsTaken.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Nav
        caseCount={cases.length}
        onHamburgerClick={toggleNav}
        navOpen={navOpen}
      />

      <header className="px-5 pt-28 pb-8 md:px-10 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-2 h-2 bg-vanta-accent"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-accent">
            Signal Log — Live
          </p>
        </div>
        <h1 className="font-display text-[28px] md:text-[36px] leading-[1.15] text-vanta-text mb-3">
          Captured Signals
        </h1>
        <p className="font-sans text-[13px] md:text-[14px] leading-[1.6] text-vanta-text-mid max-w-[640px]">
          A curated feed of intellectual capital captured from real conversations.
          Every message is evaluated through a two-stage AI pipeline — what
          matters is extracted before it disappears into the scroll.
        </p>
      </header>

      <main className="px-5 pb-20 md:px-10 max-w-[1200px] mx-auto">
        {/* Stats strip */}
        <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-vanta-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
              Signals Captured
            </p>
            <p className="font-display text-[24px] text-vanta-text">
              {sortedSignals.length}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
              High Strength
            </p>
            <p className="font-display text-[24px] text-vanta-accent">
              {highCount}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
              Actions Fired
            </p>
            <p className="font-display text-[24px] text-vanta-text">
              {actionCount}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
              Pipeline
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 bg-vanta-accent"
                style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
              />
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-accent">
                Active
              </p>
            </div>
          </div>
        </div>

        {/* Tag Browser */}
        <TagBrowser
          tagCounts={tagCounts}
          activeType={filters.type}
          onSelect={handleTagSelect}
        />

        {/* Filters */}
        <SignalFilters
          filters={filters}
          onChange={setFilters}
          senders={senders}
        />

        {/* Feed */}
        <SignalFeed signals={sortedSignals} filters={filters} />
      </main>

      <Overlay visible={navOpen} onClick={closeNav} />

      <NavDrawer
        cases={cases}
        open={navOpen}
        onClose={closeNav}
        onOpenCase={() => {}}
      />

      <footer className="border-t border-vanta-border px-5 py-8 md:px-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted text-center">
          &copy; 2026 Vanta Wireless. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Signals;

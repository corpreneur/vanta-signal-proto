import { useQuery } from "@tanstack/react-query";
import RelationshipGraph from "@/components/RelationshipGraph";
import RelationshipGraph from "@/components/RelationshipGraph";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(500);

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
    meetingId: (row as Record<string, unknown>).meeting_id as string | null,
  }));
};

export default function Graph() {
  const { data: signals = [], isLoading } = useQuery({ queryKey: ["signals-graph"], queryFn: fetchSignals });

  return (
    <div className="min-h-screen bg-vanta-bg text-vanta-text">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-5 md:px-10 bg-background/95 backdrop-blur-md border-b border-vanta-border">
        <a href="/" className="font-sans text-[17px] font-extrabold tracking-[0.2em] uppercase text-foreground">
          VANTA
        </a>
        <a href="/signals?skip-auth=1" className="font-mono text-[11px] text-primary px-2.5 py-1 bg-vanta-accent-bg border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors">
          ← Signals
        </a>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12 pb-16">
        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Relationship Graph
          </h1>
          <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
            Contact map derived from signal history — node size reflects signal density, orbit distance reflects frequency, ring color reflects recency.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-vanta-text-muted font-mono text-xs uppercase tracking-wider animate-pulse-dot">
            Loading signal graph…
          </div>
        ) : (
          <RelationshipGraph signals={signals} />
        )}
      </main>
    </div>
  );
}

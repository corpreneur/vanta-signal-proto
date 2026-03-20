import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PARTNER_LOGOS } from "@/components/PartnerLogos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Users, FileText, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import type { Signal, MeetingArtifact } from "@/data/signals";

type SourceFilter = "all" | "zoom" | "fireflies" | "otter" | "granola" | "google_meet" | "teams";

const SOURCE_FILTERS: { key: SourceFilter; label: string; logoKey?: string; comingSoon?: boolean }[] = [
  { key: "all", label: "All" },
  { key: "zoom", label: "Zoom", logoKey: "zoom" },
  { key: "google_meet", label: "Google Meet", logoKey: "google_meet", comingSoon: true },
  { key: "teams", label: "Teams", logoKey: "teams", comingSoon: true },
  
  { key: "fireflies", label: "Fireflies", logoKey: "fireflies" },
  { key: "otter", label: "Otter", logoKey: "otter" },
  { key: "granola", label: "Granola", logoKey: "granola" },
];

const SOURCE_MAP: Record<string, SourceFilter> = {
  recall: "zoom",
  fireflies: "fireflies",
  otter: "otter",
  granola: "granola",
};

interface MeetingRow {
  signal: Signal;
  artifact: MeetingArtifact | null;
  sourceKey: SourceFilter;
}

async function fetchMeetings(): Promise<MeetingRow[]> {
  const { data: signals, error } = await supabase
    .from("signals")
    .select("*")
    .eq("signal_type", "MEETING")
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error || !signals) return [];

  const signalIds = signals.map((s) => s.id);
  const { data: artifacts } = await supabase
    .from("meeting_artifacts")
    .select("*")
    .in("signal_id", signalIds.length ? signalIds : ["__none__"]);

  const artifactMap = new Map(
    (artifacts ?? []).map((a) => [
      a.signal_id,
      {
        id: a.id,
        signalId: a.signal_id,
        createdAt: a.created_at,
        transcriptJson: a.transcript_json as Record<string, unknown>[] | null,
        summaryText: a.summary_text,
        recordingUrl: a.recording_url,
        attendees: a.attendees as Record<string, unknown>[] | null,
      } satisfies MeetingArtifact,
    ])
  );

  return signals.map((row) => {
    const signal: Signal = {
      id: row.id,
      signalType: row.signal_type,
      sender: row.sender,
      summary: row.summary,
      sourceMessage: row.source_message,
      priority: row.priority,
      capturedAt: row.captured_at,
      actionsTaken: row.actions_taken ?? [],
      status: row.status,
      source: row.source,
      rawPayload: row.raw_payload as Record<string, unknown> | null,
      meetingId: row.meeting_id,
      riskLevel: row.risk_level,
      confidenceScore: row.confidence_score,
      pinned: row.pinned,
    };
    return {
      signal,
      artifact: artifactMap.get(row.id) ?? null,
      sourceKey: SOURCE_MAP[row.source] ?? "zoom",
    };
  });
}

export default function Meetings() {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [selected, setSelected] = useState<Signal | null>(null);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings-hub"],
    queryFn: fetchMeetings,
  });

  const filtered = useMemo(
    () => (filter === "all" ? meetings : meetings.filter((m) => m.sourceKey === filter)),
    [meetings, filter]
  );

  const counts = useMemo(() => {
    const c: Record<SourceFilter, number> = { all: meetings.length, zoom: 0, fireflies: 0, otter: 0, granola: 0, google_meet: 0, teams: 0 };
    meetings.forEach((m) => { if (c[m.sourceKey] !== undefined) c[m.sourceKey]++; });
    return c;
  }, [meetings]);

  return (
    <div className="max-w-[960px] mx-auto px-5 py-8 md:px-10 md:py-12 overflow-x-hidden">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-2 h-2 bg-vanta-accent"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Platform · Meetings
          </p>
        </div>
        <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground mb-2">
          Meeting Intelligence
        </h1>
        <p className="font-sans text-[14px] text-muted-foreground leading-relaxed max-w-[640px]">
          Every transcript. Every insight. Across all sources.
        </p>
      </header>

      {/* Source filters — single scrollable row */}
      <div className="flex items-center gap-0 mb-8 border border-border rounded-sm overflow-x-auto scrollbar-hide">
        {SOURCE_FILTERS.map((f, i) => {
          const Logo = f.logoKey ? PARTNER_LOGOS[f.logoKey] : null;
          const isActive = filter === f.key;
          const count = counts[f.key];
          const disabled = f.comingSoon && count === 0;
          return (
            <button
              key={f.key}
              onClick={() => !disabled && setFilter(f.key)}
              disabled={disabled}
              className={`relative inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3.5 py-2.5 shrink-0 transition-all duration-150 ${
                i > 0 ? "border-l border-border" : ""
              } ${
                disabled
                  ? "opacity-25 cursor-not-allowed text-muted-foreground"
                  : isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {Logo && <Logo className="w-3.5 h-3.5" />}
              {f.key === "all" ? "All" : f.label}
              <span className={`tabular-nums font-semibold ${isActive ? "text-background/70" : "opacity-40"}`}>{count}</span>
              {f.comingSoon && <span className="text-[7px] tracking-wider opacity-40">SOON</span>}
            </button>
          );
        })}
      </div>

      {/* Meeting list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-2 h-2 bg-primary animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Video className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-[13px] text-muted-foreground">No meetings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ signal, artifact, sourceKey }) => {
            const Logo = PARTNER_LOGOS[sourceKey] ?? null;
            const attendeeCount = artifact?.attendees?.length ?? 0;
            const transcriptPreview = artifact?.summaryText
              ? artifact.summaryText.slice(0, 140) + (artifact.summaryText.length > 140 ? "…" : "")
              : artifact?.transcriptJson?.[0]
                ? String((artifact.transcriptJson[0] as Record<string, unknown>).text ?? "").slice(0, 140)
                : null;

            return (
              <Card
                key={signal.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelected(signal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {Logo ? <Logo className="w-7 h-7" /> : <Video className="w-7 h-7 text-muted-foreground" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-sans text-[14px] font-semibold text-foreground truncate">
                          {signal.summary}
                        </span>
                        <Badge variant="outline" className="shrink-0 font-mono text-[9px] tracking-[0.1em] px-1.5 py-0 h-[18px] rounded-sm border border-border">
                          {signal.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(signal.capturedAt), "MMM d, yyyy · h:mm a")}
                        </span>
                        {attendeeCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 capitalize">
                          <FileText className="w-3 h-3" />
                          {signal.sender}
                        </span>
                      </div>

                      {transcriptPreview && (
                        <p className="text-[12px] text-muted-foreground/80 leading-relaxed line-clamp-2">
                          {transcriptPreview}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SignalDetailDrawer signal={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}

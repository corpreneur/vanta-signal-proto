import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine, Link2, FileText, Loader2, ArrowRight, Plus, Clock, Zap, Image, Mail, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { SIGNAL_TYPE_COLORS, type SignalType, type Signal } from "@/data/signals";
import NoteCapture from "@/components/NoteCapture";
import ImageCapture from "@/components/ImageCapture";
import EmailCapture from "@/components/EmailCapture";
import VoiceMemoCapture from "@/components/VoiceMemoCapture";
import { Motion } from "@/components/ui/motion";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
  MEETING: "Meeting",
  PHONE_CALL: "Phone Call",
};

type InputMode = "note" | "link" | "image" | "email" | "voice" | "notion";

/* ── Fetch recent brain dump captures ── */
async function fetchRecentCaptures(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("source", "manual")
    .order("captured_at", { ascending: false })
    .limit(10);

  if (error) return [];
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
    source: (row as Record<string, unknown>).source as Signal["source"] || "manual",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    confidenceScore: row.confidence_score,
  }));
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BrainDump() {
  const [inputMode, setInputMode] = useState<InputMode>("note");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [linkResult, setLinkResult] = useState<{
    signalType: string;
    priority: string;
    summary: string;
  } | null>(null);

  // Batch capture: track session captures
  const [sessionCaptures, setSessionCaptures] = useState<
    { signalType: string; summary: string; timestamp: string }[]
  >([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recentCaptures = [] } = useQuery({
    queryKey: ["brain-dump-recent"],
    queryFn: fetchRecentCaptures,
    refetchInterval: 15_000,
  });

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim() || loading) return;
    setLoading(true);
    setLinkResult(null);
    setStatusMessage("Scraping URL…");

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { url: linkUrl.trim() },
      });
      setStatusMessage("");
      if (error) throw error;

      const classification = data.classification;
      setLinkResult(classification);
      setLinkUrl("");

      // Add to session captures
      setSessionCaptures((prev) => [
        { signalType: classification.signalType, summary: classification.summary, timestamp: new Date().toISOString() },
        ...prev,
      ]);

      // Refresh recent captures
      queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });

      toast({
        title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      setStatusMessage("");
      console.error("Link scrape error:", e);
      toast({
        title: "Classification failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const linkColors = linkResult
    ? SIGNAL_TYPE_COLORS[linkResult.signalType as SignalType]
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <Motion>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-vanta-accent" />
            <h1 className="font-mono text-lg uppercase tracking-widest text-foreground">
              Idea Capture
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md">
            Share thoughts, ideas, or notes anytime. Vanta organizes, collects
            context, and suggests actions.
          </p>
        </div>
      </Motion>

      {/* Session capture streak */}
      {sessionCaptures.length > 0 && (
        <Motion delay={40}>
          <div className="flex items-center gap-2 px-3 py-2 border border-vanta-accent/20 bg-vanta-accent-faint">
            <Zap className="h-3.5 w-3.5 text-vanta-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-accent">
              {sessionCaptures.length} captured this session
            </span>
            <div className="flex gap-1 ml-auto">
              {sessionCaptures.slice(0, 5).map((c, i) => {
                const colors = SIGNAL_TYPE_COLORS[c.signalType as SignalType];
                return (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${colors?.bg || "bg-vanta-bg-elevated"} border ${colors?.border || "border-vanta-border"}`}
                    title={c.signalType}
                  />
                );
              })}
            </div>
          </div>
        </Motion>
      )}

      {/* Input mode tabs */}
      <Motion delay={60}>
        <div className="flex gap-1.5">
          {([
            { key: "note" as const, label: "Note", icon: PenLine },
            { key: "image" as const, label: "Image", icon: Image },
            { key: "link" as const, label: "Link", icon: Link2 },
            { key: "email" as const, label: "Email", icon: Mail },
            { key: "voice" as const, label: "Voice Memo", icon: Mic },
            { key: "notion" as const, label: "Notion", icon: FileText },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1 ${
                inputMode === key
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </Motion>

      {/* ─── Note mode ─── */}
      {inputMode === "note" && (
        <Motion delay={80}>
          <div className="border border-border rounded-xl p-5 bg-card">
            <NoteCapture
              inline
              onCapture={(classification) => {
                setSessionCaptures((prev) => [
                  {
                    signalType: classification.signalType,
                    summary: classification.summary,
                    timestamp: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
              }}
            />
          </div>
        </Motion>
      )}

      {/* ─── Link mode ─── */}
      {inputMode === "link" && (
        <Motion delay={80}>
          <div className="space-y-3">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://chatgpt.com/share/... or any article URL"
              className="bg-vanta-bg-elevated border-vanta-border font-mono text-sm"
              disabled={loading}
              type="url"
              onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
            />
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Paste a ChatGPT share link, blog post, or any web page. Content
              will be extracted and classified as a signal.
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {linkUrl ? "URL ready" : "Paste a URL"}
              </span>
              <Button
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim() || loading}
                className="font-mono text-xs uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {statusMessage || "Processing…"}
                  </>
                ) : (
                  "Classify & Save"
                )}
              </Button>
            </div>
          </div>
        </Motion>
      )}

      {/* ─── Image mode ─── */}
      {inputMode === "image" && (
        <Motion delay={80}>
          <div className="border border-border rounded-xl p-5 bg-card">
            <ImageCapture
              onCapture={(classification) => {
                setSessionCaptures((prev) => [
                  { signalType: classification.signalType, summary: classification.summary, timestamp: new Date().toISOString() },
                  ...prev,
                ]);
                queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
              }}
            />
          </div>
        </Motion>
      )}

      {/* ─── Email mode ─── */}
      {inputMode === "email" && (
        <Motion delay={80}>
          <div className="border border-border rounded-xl p-5 bg-card">
            <EmailCapture
              onCapture={(classification) => {
                setSessionCaptures((prev) => [
                  { signalType: classification.signalType, summary: classification.summary, timestamp: new Date().toISOString() },
                  ...prev,
                ]);
                queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
              }}
            />
          </div>
        </Motion>
      )}

      {/* ─── Voice Memo mode ─── */}
      {inputMode === "voice" && (
        <Motion delay={80}>
          <div className="border border-border rounded-xl p-5 bg-card">
            <VoiceMemoCapture
              onCapture={(classification) => {
                setSessionCaptures((prev) => [
                  { signalType: classification.signalType, summary: classification.summary, timestamp: new Date().toISOString() },
                  ...prev,
                ]);
                queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
              }}
            />
          </div>
        </Motion>
      )}

      {inputMode === "notion" && (
        <Motion delay={80}>
          <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="font-mono text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
              Notion import coming soon. Paste a Notion page URL to pull content
              directly into your signal pipeline.
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 border border-border rounded-full px-3 py-1">
              In Development
            </span>
          </div>
        </Motion>
      )}

      {/* Link mode result */}
      {inputMode === "link" && linkResult && linkColors && (
        <Motion delay={100}>
          <div className={`rounded-md border p-4 space-y-3 ${linkColors.bg} ${linkColors.border}`}>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] uppercase tracking-widest ${linkColors.text}`}>
                {SIGNAL_TYPE_LABELS[linkResult.signalType] || linkResult.signalType}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                · {linkResult.priority}
              </span>
            </div>
            <p className="font-mono text-sm text-foreground">{linkResult.summary}</p>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={() => navigate("/signals")}
              >
                View in Signal Feed →
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-foreground p-0 h-auto"
                onClick={() => { setLinkResult(null); setLinkUrl(""); }}
              >
                <Plus className="h-3 w-3 mr-1" /> Paste Another
              </Button>
            </div>
          </div>
        </Motion>
      )}

      {/* ─── Recent Captures ─── */}
      <Motion delay={120}>
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-vanta-text-muted" />
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
                Recent Captures
              </p>
            </div>
            <Link
              to="/signals"
              className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
            >
              All signals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCaptures.length === 0 ? (
            <div className="border border-dashed border-vanta-border p-6 text-center">
              <p className="font-mono text-[10px] text-vanta-text-muted uppercase tracking-widest">
                No captures yet — start dumping
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentCaptures.map((s) => {
                const colors = SIGNAL_TYPE_COLORS[s.signalType];
                return (
                  <Link
                    key={s.id}
                    to="/signals"
                    className="block border border-vanta-border bg-vanta-bg-elevated p-3 hover:border-vanta-border-mid transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}
                      >
                        {s.signalType}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-text-muted">
                        {s.priority}
                      </span>
                      {s.confidenceScore != null && (
                        <span
                          className={`font-mono text-[8px] ml-auto ${
                            s.confidenceScore >= 0.85
                              ? "text-green-600"
                              : s.confidenceScore >= 0.6
                              ? "text-amber-600"
                              : "text-destructive"
                          }`}
                        >
                          {Math.round(s.confidenceScore * 100)}%
                        </span>
                      )}
                      <span className="font-mono text-[8px] text-vanta-text-muted ml-auto">
                        {timeAgo(s.capturedAt)}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-foreground leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                      {s.summary}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </Motion>
    </div>
  );
}

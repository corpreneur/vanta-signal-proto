import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PenLine, Link2, FileText, Loader2, ArrowRight, Plus, Clock, Zap,
  Image, Mail, Mic, BookmarkPlus, Copy, Check, Smartphone, Globe,
  Monitor, ExternalLink, ChevronDown, ChevronRight, Send,
} from "lucide-react";
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
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
};

type InputMode = "note" | "link" | "image" | "email" | "voice" | "notion";

const INPUT_MODES: { key: InputMode; label: string; icon: React.ElementType }[] = [
  { key: "note", label: "Note", icon: PenLine },
  { key: "image", label: "Image", icon: Image },
  { key: "link", label: "Link", icon: Link2 },
  { key: "email", label: "Email", icon: Mail },
  { key: "voice", label: "Voice", icon: Mic },
];

/* ── Fetch recent brain dump captures ── */
async function fetchRecentCaptures(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals").select("*").eq("source", "manual")
    .order("captured_at", { ascending: false }).limit(10);
  if (error) return [];
  return (data || []).map((row) => ({
    id: row.id, signalType: row.signal_type, sender: row.sender,
    summary: row.summary, sourceMessage: row.source_message,
    priority: row.priority, capturedAt: row.captured_at,
    actionsTaken: row.actions_taken || [], status: row.status,
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
  const [linkResult, setLinkResult] = useState<{ signalType: string; priority: string; summary: string } | null>(null);
  const [sessionCaptures, setSessionCaptures] = useState<{ signalType: string; summary: string; timestamp: string }[]>([]);
  const [showTools, setShowTools] = useState(false);

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
    setLoading(true); setLinkResult(null); setStatusMessage("Scraping URL…");
    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", { body: { url: linkUrl.trim() } });
      setStatusMessage("");
      if (error) throw error;
      const classification = data.classification;
      setLinkResult(classification); setLinkUrl("");
      setSessionCaptures((prev) => [{ signalType: classification.signalType, summary: classification.summary, timestamp: new Date().toISOString() }, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
      toast({ title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`, description: classification.summary });
    } catch (e: unknown) {
      setStatusMessage("");
      toast({ title: "Classification failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onCapture = (classification: { signalType: string; summary: string }) => {
    setSessionCaptures((prev) => [{ ...classification, timestamp: new Date().toISOString() }, ...prev]);
    queryClient.invalidateQueries({ queryKey: ["brain-dump-recent"] });
  };

  const linkColors = linkResult ? SIGNAL_TYPE_COLORS[linkResult.signalType as SignalType] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

      {/* ══ Hero header (MetaLab style) ══ */}
      <Motion>
        <header className="mb-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Fab Five · Idea Capture
          </p>
          <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground mb-2">
            What's on your mind?
          </h1>
          <p className="font-sans text-[14px] text-muted-foreground leading-relaxed max-w-md">
            Share thoughts, links, or notes. Vanta organizes, collects context, and suggests actions.
          </p>
        </header>
      </Motion>

      {/* ══ Session streak ══ */}
      {sessionCaptures.length > 0 && (
        <Motion delay={20}>
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-lg border border-primary/20 bg-primary/[0.04]">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary font-medium">
              {sessionCaptures.length} captured this session
            </span>
            <div className="flex gap-1 ml-auto">
              {sessionCaptures.slice(0, 5).map((c, i) => {
                const colors = SIGNAL_TYPE_COLORS[c.signalType as SignalType];
                return <span key={i} className={`w-2 h-2 rounded-full ${colors?.bg || "bg-muted"} border ${colors?.border || "border-border"}`} />;
              })}
            </div>
          </div>
        </Motion>
      )}

      {/* ══ Input mode selector (MetaLab tab style) ══ */}
      <Motion delay={40}>
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {INPUT_MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className={`flex items-center gap-1.5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors border-b-2 -mb-px ${
                inputMode === key
                  ? "text-foreground border-foreground font-medium"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </Motion>

      {/* ══ Capture surface ══ */}
      <Motion delay={60}>
        <div className="mb-8">

          {/* Note */}
          {inputMode === "note" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <NoteCapture inline onCapture={onCapture} />
            </div>
          )}

          {/* Link */}
          {inputMode === "link" && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste any URL…"
                  className="flex-1 font-sans text-[14px]"
                  disabled={loading}
                  type="url"
                  onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                  autoFocus
                />
                <Button onClick={handleLinkSubmit} disabled={!linkUrl.trim() || loading}
                  className="font-mono text-[10px] uppercase tracking-wider shrink-0">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {statusMessage || "…"}</> : <><Send className="h-3.5 w-3.5" /> Classify</>}
                </Button>
              </div>
              <p className="font-sans text-[12px] text-muted-foreground">
                Paste a ChatGPT share link, article, or any web page. Content will be extracted and classified.
              </p>
            </div>
          )}

          {/* Image */}
          {inputMode === "image" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <ImageCapture onCapture={onCapture} />
            </div>
          )}

          {/* Email */}
          {inputMode === "email" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <EmailCapture onCapture={onCapture} />
            </div>
          )}

          {/* Voice */}
          {inputMode === "voice" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <VoiceMemoCapture onCapture={onCapture} />
            </div>
          )}
        </div>
      </Motion>

      {/* Link result */}
      {inputMode === "link" && linkResult && linkColors && (
        <Motion delay={80}>
          <div className={`rounded-lg border p-4 mb-8 space-y-3 ${linkColors.bg} ${linkColors.border}`}>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] uppercase tracking-widest ${linkColors.text}`}>
                {SIGNAL_TYPE_LABELS[linkResult.signalType] || linkResult.signalType}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">· {linkResult.priority}</span>
            </div>
            <p className="font-sans text-[13px] text-foreground leading-relaxed">{linkResult.summary}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/signals")} className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-foreground transition-colors">
                View in Signal Feed →
              </button>
              <button onClick={() => { setLinkResult(null); setLinkUrl(""); }} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Plus className="h-3 w-3" /> Paste Another
              </button>
            </div>
          </div>
        </Motion>
      )}

      {/* ══ Capture Tools (collapsible) ══ */}
      <Motion delay={100}>
        <section className="mb-8">
          <button
            onClick={() => setShowTools(!showTools)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground font-medium">Capture Everywhere</p>
              <p className="font-mono text-[9px] text-muted-foreground">Bookmarklet · ⌘K · PWA</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTools ? "rotate-180" : ""}`} />
          </button>

          {showTools && <CaptureToolsExpanded />}
        </section>
      </Motion>

      {/* ══ Recent Captures ══ */}
      <Motion delay={120}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Recent Captures
            </p>
            <Link to="/signals" className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-foreground transition-colors flex items-center gap-1">
              All signals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCaptures.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <PenLine className="w-6 h-6 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-sans text-[13px] text-muted-foreground">
                No captures yet. Start with a thought above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCaptures.map((s) => {
                const colors = SIGNAL_TYPE_COLORS[s.signalType];
                return (
                  <Link key={s.id} to="/signals"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors group">
                    {/* Type dot */}
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.bg} border ${colors.border}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[13px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {s.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        <span className={colors.text}>{s.signalType.replace("_", " ")}</span>
                        <span>·</span>
                        <span>{s.priority}</span>
                        {s.confidenceScore != null && (
                          <>
                            <span>·</span>
                            <span className={s.confidenceScore >= 0.85 ? "text-vanta-signal-green" : s.confidenceScore >= 0.6 ? "text-vanta-signal-yellow" : "text-destructive"}>
                              {Math.round(s.confidenceScore * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground whitespace-nowrap mt-1">
                      {timeAgo(s.capturedAt)}
                    </span>
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

/* ── Capture Tools Expanded ── */

function CaptureToolsExpanded() {
  const [copied, setCopied] = useState(false);
  const bookmarkletCode = `javascript:void(function(){var t=document.title,u=window.location.href,s=window.getSelection().toString().slice(0,500),p=encodeURIComponent(t+' | '+u+(s?' | '+s:''));window.open('${window.location.origin}/brain-dump?prefill='+p,'_blank','width=480,height=600')})()`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {/* Bookmarklet */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <BookmarkPlus className="w-5 h-5 text-primary" />
        <div>
          <p className="font-sans text-[13px] font-medium text-foreground">Bookmarklet</p>
          <p className="font-sans text-[11px] text-muted-foreground mt-1">One-click capture from any webpage.</p>
        </div>
        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary font-mono text-[9px] uppercase tracking-widest hover:bg-primary/20 transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* ⌘K */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <p className="font-sans text-[13px] font-medium text-foreground">⌘K Palette</p>
          <p className="font-sans text-[11px] text-muted-foreground mt-1">Universal capture from anywhere in Vanta.</p>
        </div>
        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border font-mono text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[9px] shadow-sm">⌘</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[9px] shadow-sm">K</kbd>
        </div>
      </div>

      {/* PWA */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Smartphone className="w-5 h-5 text-primary" />
        <div>
          <p className="font-sans text-[13px] font-medium text-foreground">Install as App</p>
          <p className="font-sans text-[11px] text-muted-foreground mt-1">Add to dock or home screen.</p>
        </div>
        <div className="space-y-1 font-sans text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2"><Globe className="w-3 h-3 shrink-0" /> Chrome: Menu → Install</div>
          <div className="flex items-center gap-2"><Monitor className="w-3 h-3 shrink-0" /> Safari: Share → Add to Home</div>
        </div>
      </div>
    </div>
  );
}

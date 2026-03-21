import { useState, useRef, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  MessageSquare, Link2, Image, Upload, Trash2, ExternalLink,
  Plus, ChevronDown, ChevronUp, Clock, Loader2, Brain, RefreshCw, Mic, MicOff, Square, Bell, Sparkles, CheckCircle2, Lightbulb, Target,
  LayoutGrid, List, Layers, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const AUTHORS = ["Julian", "JG"] as const;
type Author = (typeof AUTHORS)[number];
type Status = "new" | "in-progress" | "shipped" | "parked";

const SUBJECTS = [
  "UX / Design",
  "Signal Pipeline",
  "Orb / Capture",
  "Contacts / Network",
  "Meetings / Briefs",
  "Integrations",
  "AI / Inference",
  "Strategy",
  "Bug",
  "Other",
] as const;

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  "in-progress": "bg-[hsl(var(--signal-yellow)/.12)] text-[hsl(var(--signal-yellow))] border-[hsl(var(--signal-yellow)/.25)]",
  shipped: "bg-[hsl(var(--signal-green)/.12)] text-[hsl(var(--signal-green))] border-[hsl(var(--signal-green)/.25)]",
  parked: "bg-muted text-muted-foreground border-border",
};

interface ParsedChat {
  url: string;
  title: string;
  content: string;
  scraped_at: string;
}

interface AiSummary {
  url: string;
  title: string;
  decisions: string[];
  action_items: string[];
  insights: string[];
  summary: string;
  generated_at: string;
}

interface FeedbackEntry {
  id: string;
  author: string;
  subject: string;
  narrative: string;
  chatgpt_links: string[];
  screenshot_urls: string[];
  parsed_chatgpt: ParsedChat[];
  ai_summaries: AiSummary[];
  status: string;
  created_at: string;
  updated_at: string;
}

async function scrapeLink(url: string): Promise<ParsedChat> {
  const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
    body: { url, options: { formats: ["markdown"], onlyMainContent: true } },
  });
  if (error) throw error;
  const markdown = data?.data?.markdown || data?.markdown || "";
  const title = data?.data?.metadata?.title || data?.metadata?.title || url;
  return { url, title, content: markdown, scraped_at: new Date().toISOString() };
}

async function fetchEntries(): Promise<FeedbackEntry[]> {
  const { data, error } = await supabase
    .from("feedback_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    ...d,
    parsed_chatgpt: Array.isArray(d.parsed_chatgpt) ? d.parsed_chatgpt : [],
    ai_summaries: Array.isArray(d.ai_summaries) ? d.ai_summaries : [],
  })) as FeedbackEntry[];
}

export default function FeedbackBacklog() {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({ queryKey: ["feedback-entries"], queryFn: fetchEntries });
  const [newCount, setNewCount] = useState(0);

  // Realtime subscription for live notifications
  useEffect(() => {
    const channel = supabase
      .channel("feedback-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback_entries" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["feedback-entries"] });
          const entry = payload.new as any;
          setNewCount((c) => c + 1);
          toast.info(`New feedback from ${entry.author}`, {
            description: `${entry.subject} — ${(entry.narrative || "").slice(0, 80)}${(entry.narrative || "").length > 80 ? "…" : ""}`,
            icon: <Bell className="w-4 h-4" />,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const [author, setAuthor] = useState<Author>("Julian");
  const [subject, setSubject] = useState<string>("General");
  const [narrative, setNarrative] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cluster">("list");
  const [expandedChats, setExpandedChats] = useState<Record<string, boolean>>({});
  const [scraping, setScraping] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterAuthor, setFilterAuthor] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const fileRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript: voiceTranscript, isSupported: voiceSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [voiceTouring, setVoiceTouring] = useState(false);
  const [voiceElapsed, setVoiceElapsed] = useState(0);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startVoiceTour = useCallback(() => {
    setVoiceTouring(true);
    setVoiceElapsed(0);
    resetTranscript();
    voiceTimerRef.current = setInterval(() => setVoiceElapsed((s) => s + 1), 1000);
    startListening((text) => setNarrative(text));
  }, [startListening, resetTranscript]);

  const stopVoiceTour = useCallback(() => {
    stopListening();
    setVoiceTouring(false);
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
  }, [stopListening]);

  const insertMutation = useMutation({
    mutationFn: async () => {
      const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
      setScraping(true);

      // Scrape all ChatGPT links
      let parsed: ParsedChat[] = [];
      if (cleanLinks.length > 0) {
        const results = await Promise.allSettled(cleanLinks.map(scrapeLink));
        parsed = results
          .filter((r): r is PromiseFulfilledResult<ParsedChat> => r.status === "fulfilled")
          .map((r) => r.value);
        const failures = results.filter((r) => r.status === "rejected").length;
        if (failures > 0) toast.warning(`${failures} link(s) could not be scraped`);
      }

      const { error } = await supabase.from("feedback_entries").insert({
        author,
        subject,
        narrative: narrative.trim(),
        chatgpt_links: cleanLinks,
        screenshot_urls: screenshots,
        parsed_chatgpt: parsed as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries"] });
      setSubject("General");
      setNarrative("");
      setLinks([""]);
      setScreenshots([]);
      setScraping(false);
      toast.success("Feedback submitted with parsed conversations");
    },
    onError: () => {
      setScraping(false);
      toast.error("Failed to submit feedback");
    },
  });

  const rescrape = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const parsed = await scrapeLink(url);
      // Get existing entry
      const { data: existing } = await supabase
        .from("feedback_entries")
        .select("parsed_chatgpt")
        .eq("id", id)
        .single();
      const current: ParsedChat[] = Array.isArray((existing as any)?.parsed_chatgpt) ? (existing as any).parsed_chatgpt : [];
      const updated = current.filter((p: ParsedChat) => p.url !== url);
      updated.push(parsed);
      const { error } = await supabase
        .from("feedback_entries")
        .update({ parsed_chatgpt: updated as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries"] });
      toast.success("Link re-scraped");
    },
    onError: () => toast.error("Failed to re-scrape link"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("feedback_entries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback-entries"] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries"] });
      toast.success("Entry removed");
    },
  });

  const [summarizing, setSummarizing] = useState<string | null>(null);

  const summarizeEntry = useMutation({
    mutationFn: async (entry: FeedbackEntry) => {
      setSummarizing(entry.id);
      const conversations = (entry.parsed_chatgpt as ParsedChat[]).filter((p) => p.content?.trim());
      if (conversations.length === 0) throw new Error("No scraped conversations to summarize");
      const { data, error } = await supabase.functions.invoke("summarize-feedback", {
        body: { entry_id: entry.id, conversations },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-entries"] });
      toast.success("AI summaries generated");
      setSummarizing(null);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to generate summaries");
      setSummarizing(null);
    },
  });

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("feedback-screenshots").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("feedback-screenshots").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setScreenshots((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} screenshot(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSubmit = narrative.trim().length > 0 || links.some((l) => l.trim()) || screenshots.length > 0;

  const filteredEntries = entries.filter((e) => {
    if (filterSubject !== "All" && e.subject !== filterSubject) return false;
    if (filterAuthor !== "All" && e.author !== filterAuthor) return false;
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    return true;
  });

  const toggleChat = (entryId: string, url: string) => {
    const key = `${entryId}:${url}`;
    setExpandedChats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Product Strategy · Feedback
          </p>
        </div>
        <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground mb-2">
          Feedback Backlog
        </h1>
        <p className="font-sans text-[15px] text-muted-foreground max-w-[600px] leading-relaxed">
          Julian & JG's product observations, ChatGPT session links, and annotated screenshots — the source of truth for prototype evolution.
          ChatGPT links are automatically scraped and parsed on submission.
        </p>
      </div>

      {/* Submission form */}
      <div className="border border-border rounded-sm bg-card p-5 mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Author</p>
          <div className="flex gap-1.5">
            {AUTHORS.map((a) => (
              <button
                key={a}
                onClick={() => setAuthor(a)}
                className={`px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  author === a
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Subject</p>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-2.5 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  subject === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="inline w-3 h-3 mr-1 -mt-0.5" />
              Narrative / Feedback
            </label>
            {voiceSupported && (
              <div className="flex items-center gap-2">
                {voiceTouring && (
                  <span className="font-mono text-[10px] text-destructive animate-pulse">
                    ● REC {Math.floor(voiceElapsed / 60)}:{String(voiceElapsed % 60).padStart(2, "0")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={voiceTouring ? stopVoiceTour : startVoiceTour}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                    voiceTouring
                      ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {voiceTouring ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {voiceTouring ? "Stop tour" : "Voice tour"}
                </button>
              </div>
            )}
          </div>
          {voiceTouring && (
            <p className="text-[11px] text-muted-foreground/70 mb-1.5 italic">
              Speak your feedback — the transcript appears below in real time…
            </p>
          )}
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={voiceTouring ? 8 : 4}
            placeholder={voiceTouring ? "Listening… speak your feedback now" : "Describe what you observed, what should change, and why…"}
            className={`w-full bg-background border rounded-sm px-3 py-2 font-sans text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 resize-none transition-all ${
              voiceTouring ? "border-destructive/30 ring-1 ring-destructive/10" : "border-border"
            }`}
          />
        </div>

        {/* ChatGPT links */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
            <Link2 className="inline w-3 h-3 mr-1 -mt-0.5" />
            ChatGPT Links
            <span className="ml-2 text-primary/50 normal-case tracking-normal">(auto-scraped on submit)</span>
          </label>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    const updated = [...links];
                    updated[i] = e.target.value;
                    setLinks(updated);
                  }}
                  placeholder="https://chatgpt.com/share/…"
                  className="flex-1 bg-background border border-border rounded-sm px-3 py-2 font-mono text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
                />
                {links.length > 1 && (
                  <button
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    className="px-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setLinks([...links, ""])}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" /> Add link
            </button>
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
            <Image className="inline w-3 h-3 mr-1 -mt-0.5" />
            Screenshots
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleScreenshotUpload}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            {screenshots.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-sm overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setScreenshots(screenshots.filter((_, j) => j !== i))}
                  className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-dashed border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Upload screenshots"}
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={() => insertMutation.mutate()}
          disabled={!canSubmit || insertMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {insertMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {scraping ? "Scraping ChatGPT links…" : "Submitting…"}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Submit Feedback
            </>
          )}
        </button>
      </div>

      {/* View toggle + Entries */}
      <div className="space-y-3">
        {/* View mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-0.5 rounded-sm border border-border bg-muted/30">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wider transition-colors ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3 h-3" /> List
            </button>
            <button
              onClick={() => setViewMode("cluster")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wider transition-colors ${
                viewMode === "cluster" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3 h-3" /> Clusters
            </button>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {/* Filter bar */}
        <div className="space-y-2 p-3 rounded-sm border border-border bg-muted/30">
          {/* Author */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14">Author</p>
            {["All", ...AUTHORS].map((a) => {
              const count = a === "All" ? entries.length : entries.filter((e) => e.author === a).length;
              return (
                <button key={a} onClick={() => setFilterAuthor(a)} className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${filterAuthor === a ? "bg-primary/15 text-primary border-primary/30" : "bg-transparent text-muted-foreground border-border hover:border-primary/20"}`}>
                  {a} <span className="opacity-50">{count}</span>
                </button>
              );
            })}
          </div>
          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14">Status</p>
            {["All", "new", "in-progress", "shipped", "parked"].map((s) => {
              const count = s === "All" ? entries.length : entries.filter((e) => e.status === s).length;
              return (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${filterStatus === s ? "bg-primary/15 text-primary border-primary/30" : "bg-transparent text-muted-foreground border-border hover:border-primary/20"}`}>
                  {s} <span className="opacity-50">{count}</span>
                </button>
              );
            })}
          </div>
          {/* Subject */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14">Subject</p>
            {["All", ...SUBJECTS].map((s) => {
              const count = s === "All" ? entries.length : entries.filter((e) => e.subject === s).length;
              return (
                <button key={s} onClick={() => setFilterSubject(s)} className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${filterSubject === s ? "bg-primary/15 text-primary border-primary/30" : "bg-transparent text-muted-foreground border-border hover:border-primary/20"}`}>
                  {s} <span className="opacity-50">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {/* CLUSTER VIEW */}
        {viewMode === "cluster" && !isLoading && (() => {
          // Group by subject
          const groups = new Map<string, FeedbackEntry[]>();
          for (const e of filteredEntries) {
            const key = e.subject || "Other";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(e);
          }

          return (
            <div className="space-y-4">
              {Array.from(groups.entries())
                .sort((a, b) => b[1].length - a[1].length)
                .map(([subject, items]) => {
                  // Aggregate insights across all entries in cluster
                  const allDecisions: string[] = [];
                  const allActions: string[] = [];
                  const allInsights: string[] = [];
                  const allSummaries: string[] = [];
                  let analyzedCount = 0;

                  for (const item of items) {
                    for (const s of item.ai_summaries as AiSummary[]) {
                      analyzedCount++;
                      allDecisions.push(...s.decisions);
                      allActions.push(...s.action_items);
                      allInsights.push(...s.insights);
                      if (s.summary) allSummaries.push(s.summary);
                    }
                  }

                  const statusCounts = items.reduce((acc, e) => {
                    acc[e.status] = (acc[e.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const uniqueDecisions = [...new Set(allDecisions)];
                  const uniqueActions = [...new Set(allActions)];
                  const uniqueInsights = [...new Set(allInsights)];

                  return (
                    <div key={subject} className="border border-border rounded-sm bg-card overflow-hidden">
                      {/* Cluster header */}
                      <div className="px-4 py-3 bg-muted/30 border-b border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <LayoutGrid className="w-4 h-4 text-primary" />
                            <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-foreground">{subject}</h3>
                            <span className="px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-[10px] font-bold">
                              {items.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {Object.entries(statusCounts).map(([s, count]) => (
                              <span key={s} className={`px-1.5 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-wider border ${STATUS_STYLES[s as Status] || "bg-muted text-muted-foreground border-border"}`}>
                                {s} {count}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Contributors + date range */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="font-mono text-[9px] text-muted-foreground">
                            By {[...new Set(items.map((e) => e.author))].join(", ")}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {format(new Date(items[items.length - 1].created_at), "MMM d")} — {format(new Date(items[0].created_at), "MMM d")}
                          </span>
                          {analyzedCount > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[9px] text-primary/70">
                              <Sparkles className="w-3 h-3" /> {analyzedCount} analyzed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Aggregated AI insights */}
                      {(uniqueDecisions.length > 0 || uniqueActions.length > 0 || uniqueInsights.length > 0) && (
                        <div className="px-4 py-3 space-y-3 border-b border-border bg-primary/[0.02]">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <p className="font-mono text-[9px] uppercase tracking-wider text-primary">
                              Aggregated Strategic Insights
                            </p>
                          </div>

                          {allSummaries.length > 0 && (
                            <p className="font-sans text-[12px] text-foreground/70 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                              {allSummaries[0]}{allSummaries.length > 1 ? ` (+${allSummaries.length - 1} more)` : ""}
                            </p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {uniqueDecisions.length > 0 && (
                              <div className="space-y-1">
                                <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <Target className="w-3 h-3" /> Decisions ({uniqueDecisions.length})
                                </p>
                                {uniqueDecisions.slice(0, 4).map((d, i) => (
                                  <p key={i} className="flex items-start gap-1 font-sans text-[11px] text-foreground/70">
                                    <span className="text-primary mt-0.5 shrink-0">▸</span>
                                    <span className="line-clamp-2">{d}</span>
                                  </p>
                                ))}
                                {uniqueDecisions.length > 4 && (
                                  <p className="font-mono text-[9px] text-muted-foreground/60">+{uniqueDecisions.length - 4} more</p>
                                )}
                              </div>
                            )}

                            {uniqueActions.length > 0 && (
                              <div className="space-y-1">
                                <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Actions ({uniqueActions.length})
                                </p>
                                {uniqueActions.slice(0, 4).map((a, i) => (
                                  <p key={i} className="flex items-start gap-1 font-sans text-[11px] text-foreground/70">
                                    <span className="text-primary mt-0.5 shrink-0">☐</span>
                                    <span className="line-clamp-2">{a}</span>
                                  </p>
                                ))}
                                {uniqueActions.length > 4 && (
                                  <p className="font-mono text-[9px] text-muted-foreground/60">+{uniqueActions.length - 4} more</p>
                                )}
                              </div>
                            )}

                            {uniqueInsights.length > 0 && (
                              <div className="space-y-1">
                                <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3" /> Insights ({uniqueInsights.length})
                                </p>
                                {uniqueInsights.slice(0, 4).map((ins, i) => (
                                  <p key={i} className="flex items-start gap-1 font-sans text-[11px] text-foreground/70">
                                    <span className="text-primary mt-0.5 shrink-0">◆</span>
                                    <span className="line-clamp-2">{ins}</span>
                                  </p>
                                ))}
                                {uniqueInsights.length > 4 && (
                                  <p className="font-mono text-[9px] text-muted-foreground/60">+{uniqueInsights.length - 4} more</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Entry list within cluster */}
                      <div className="divide-y divide-border">
                        {items.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                            <span className={`shrink-0 px-1.5 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-wider border ${STATUS_STYLES[entry.status as Status]}`}>
                              {entry.status}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary/70">{entry.author}</span>
                            <span className="flex-1 font-sans text-[12px] text-foreground/80 truncate">
                              {entry.narrative || "(no narrative)"}
                            </span>
                            {entry.ai_summaries.length > 0 && (
                              <span className="shrink-0 flex items-center gap-0.5 text-primary/60">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                            {entry.parsed_chatgpt.length > 0 && (
                              <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-[8px]">
                                <Brain className="w-2.5 h-2.5" /> {entry.parsed_chatgpt.length}
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                              {format(new Date(entry.created_at), "MMM d")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })()}

        {/* LIST VIEW */}
        {viewMode === "list" && !isLoading && filteredEntries.map((entry) => {
          const isOpen = expanded === entry.id;
          const status = entry.status as Status;
          const parsedMap = new Map((entry.parsed_chatgpt as ParsedChat[]).map((p) => [p.url, p]));

          return (
            <div key={entry.id} className="border border-border rounded-sm bg-card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className={`shrink-0 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border border-border bg-muted/50 text-muted-foreground">{entry.subject}</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary/70">{entry.author}</span>
                <span className="flex-1 font-sans text-[13px] text-foreground truncate">
                  {entry.narrative || "(no narrative)"}
                </span>
                {entry.parsed_chatgpt.length > 0 && (
                  <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-[9px]">
                    <Brain className="w-3 h-3" /> {entry.parsed_chatgpt.length}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  {format(new Date(entry.created_at), "MMM d")}
                </span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 py-3 space-y-3 animate-fade-in">
                  {entry.narrative && (
                    <p className="font-sans text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.narrative}</p>
                  )}

                  {/* Parsed ChatGPT conversations */}
                  {entry.chatgpt_links?.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Brain className="w-3 h-3" /> ChatGPT Conversations
                      </p>
                      {entry.chatgpt_links.map((link, i) => {
                        const parsed = parsedMap.get(link);
                        const chatKey = `${entry.id}:${link}`;
                        const isChatOpen = expandedChats[chatKey];

                        return (
                          <div key={i} className="border border-border rounded-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 font-mono text-[11px] text-primary hover:underline truncate flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                {parsed?.title || link}
                              </a>
                              <button
                                onClick={() => rescrape.mutate({ id: entry.id, url: link })}
                                disabled={rescrape.isPending}
                                className="shrink-0 p-1 rounded-sm text-muted-foreground hover:text-primary transition-colors"
                                title="Re-scrape this link"
                              >
                                <RefreshCw className={`w-3 h-3 ${rescrape.isPending ? "animate-spin" : ""}`} />
                              </button>
                              {parsed && (
                                <button
                                  onClick={() => toggleChat(entry.id, link)}
                                  className="shrink-0 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                                >
                                  {isChatOpen ? "Collapse" : "View stream"}
                                </button>
                              )}
                              {!parsed && (
                                <span className="shrink-0 font-mono text-[9px] text-muted-foreground/50 uppercase">not scraped</span>
                              )}
                            </div>

                            {parsed && isChatOpen && (
                              <div className="border-t border-border px-3 py-3 max-h-[500px] overflow-y-auto">
                                <div className="font-mono text-[9px] text-muted-foreground/60 mb-2">
                                  Scraped {format(new Date(parsed.scraped_at), "MMM d, h:mm a")}
                                </div>
                                <div className="prose prose-sm prose-invert max-w-none">
                                  <div className="font-sans text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                    {parsed.content || "(empty response from scraper)"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Summary section */}
                  {(entry.parsed_chatgpt as ParsedChat[]).some((p) => p.content?.trim()) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> AI Analysis
                        </p>
                        <button
                          onClick={() => summarizeEntry.mutate(entry)}
                          disabled={summarizing === entry.id}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                        >
                          {summarizing === entry.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing…</>
                          ) : entry.ai_summaries.length > 0 ? (
                            <><RefreshCw className="w-3 h-3" /> Re-analyze</>
                          ) : (
                            <><Sparkles className="w-3 h-3" /> Extract insights</>
                          )}
                        </button>
                      </div>

                      {entry.ai_summaries.length > 0 && entry.ai_summaries.map((s, si) => (
                        <div key={si} className="border border-primary/20 rounded-sm bg-primary/5 p-3 space-y-2.5">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-primary/60">
                            {s.title} · {format(new Date(s.generated_at), "MMM d, h:mm a")}
                          </p>
                          <p className="font-sans text-[13px] text-foreground/80 leading-relaxed italic">{s.summary}</p>

                          {s.decisions.length > 0 && (
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                                <Target className="w-3 h-3" /> Decisions
                              </p>
                              <ul className="space-y-0.5">
                                {s.decisions.map((d, di) => (
                                  <li key={di} className="flex items-start gap-1.5 font-sans text-[12px] text-foreground/70">
                                    <span className="text-primary mt-0.5">▸</span> {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {s.action_items.length > 0 && (
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                                <CheckCircle2 className="w-3 h-3" /> Action Items
                              </p>
                              <ul className="space-y-0.5">
                                {s.action_items.map((a, ai2) => (
                                  <li key={ai2} className="flex items-start gap-1.5 font-sans text-[12px] text-foreground/70">
                                    <span className="text-primary mt-0.5">☐</span> {a}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {s.insights.length > 0 && (
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3" /> Insights
                              </p>
                              <ul className="space-y-0.5">
                                {s.insights.map((ins, ii) => (
                                  <li key={ii} className="flex items-start gap-1.5 font-sans text-[12px] text-foreground/70">
                                    <span className="text-primary mt-0.5">◆</span> {ins}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.screenshot_urls?.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Screenshots</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.screenshot_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-28 h-28 rounded-sm overflow-hidden border border-border hover:border-primary/30 transition-colors">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status + Delete row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mr-1">Status</p>
                    {(["new", "in-progress", "shipped", "parked"] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ id: entry.id, status: s })}
                        className={`px-2 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                          status === s ? STATUS_STYLES[s] : "bg-transparent text-muted-foreground border-border hover:border-primary/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button
                      onClick={() => deleteEntry.mutate(entry.id)}
                      className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

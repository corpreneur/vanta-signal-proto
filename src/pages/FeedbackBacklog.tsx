import { useState, useRef, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  MessageSquare, Link2, Image, Upload, Trash2, ExternalLink,
  Plus, ChevronDown, ChevronUp, Clock, Loader2, Brain, RefreshCw, Mic, MicOff, Square,
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

interface FeedbackEntry {
  id: string;
  author: string;
  subject: string;
  narrative: string;
  chatgpt_links: string[];
  screenshot_urls: string[];
  parsed_chatgpt: ParsedChat[];
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
  })) as FeedbackEntry[];
}

export default function FeedbackBacklog() {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({ queryKey: ["feedback-entries"], queryFn: fetchEntries });

  const [author, setAuthor] = useState<Author>("Julian");
  const [subject, setSubject] = useState<string>("General");
  const [narrative, setNarrative] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedChats, setExpandedChats] = useState<Record<string, boolean>>({});
  const [scraping, setScraping] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("All");
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

  const filteredEntries = filterSubject === "All" ? entries : entries.filter((e) => e.subject === filterSubject);

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
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
            <MessageSquare className="inline w-3 h-3 mr-1 -mt-0.5" />
            Narrative / Feedback
          </label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
            placeholder="Describe what you observed, what should change, and why…"
            className="w-full bg-background border border-border rounded-sm px-3 py-2 font-sans text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 resize-none"
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

      {/* Entries list */}
      <div className="space-y-3">
        {/* Subject filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Filter</p>
          {["All", ...SUBJECTS].map((s) => {
            const count = s === "All" ? entries.length : entries.filter((e) => e.subject === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterSubject(s)}
                className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  filterSubject === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/20"
                }`}
              >
                {s} <span className="opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
        </p>

        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {filteredEntries.map((entry) => {
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

import { useState } from "react";
import { FileText, Loader2, Send, Users, CheckCircle2, Sparkles, ArrowUp, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

/* ── Meeting type templates (Granola-style) ── */
const MEETING_TEMPLATES = [
  { key: "customer_discovery", label: "Customer discovery", skeleton: "Company Overview\n\nCurrent Provider\n\nTheir Requirements\n\nBudget & Timeline\n\nDecision Criteria\n\nNext Steps" },
  { key: "1on1", label: "1 on 1", skeleton: "Done yesterday\n\nDoing today\n\nBlockers\n\nKudos" },
  { key: "user_interview", label: "User Interview", skeleton: "Background\n\nPain Points\n\nCurrent Workflow\n\nFeature Requests\n\nQuotes" },
  { key: "pitch", label: "Pitch", skeleton: "Company / Product\n\nTraction\n\nAsk\n\nKey Objections\n\nFollow-up" },
  { key: "standup", label: "Standup", skeleton: "Done yesterday\n\nDoing today\n\nBlockers\n\nKudos" },
] as const;

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
};

/* ── Suggested prompts (Granola "Ask anything" style) ── */
const ASK_PROMPTS = [
  "Give me a summary",
  "What were the action items?",
  "What objections came up?",
  "How much have they raised?",
  "What questions did they ask?",
];

interface ClassificationResult {
  signalType: string;
  priority: string;
  summary: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  suggestedContacts?: string[];
  accelerators?: string[];
}

interface GranolaMeetingImportProps {
  onCapture?: (classification: ClassificationResult) => void;
}

/* ── Traffic dots (macOS window chrome) ── */
function TrafficDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
      <span className="w-2.5 h-2.5 rounded-full bg-[hsl(40_90%_55%)]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[hsl(142_60%_45%)]" />
    </div>
  );
}

export default function GranolaMeetingImport({ onCapture }: GranolaMeetingImportProps) {
  const [meetingNotes, setMeetingNotes] = useState("");
  const [attendees, setAttendees] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (key: string) => {
    const tpl = MEETING_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setSelectedTemplate(key === selectedTemplate ? null : key);
    if (key !== selectedTemplate && !meetingNotes.trim()) {
      setMeetingNotes(tpl.skeleton);
    }
  };

  const handleSubmit = async () => {
    if (!meetingNotes.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const fullText = [
      meetingTitle.trim() ? `Meeting: ${meetingTitle.trim()}` : "",
      attendees.trim() ? `Attendees: ${attendees.trim()}` : "",
      `Meeting notes from Granola:\n${meetingNotes.trim()}`,
    ].filter(Boolean).join("\n\n");

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: fullText },
      });
      if (error) throw error;

      const classification = data.classification as ClassificationResult;
      setResult(classification);
      onCapture?.(classification);
      toast({
        title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e) {
      toast({
        title: "Import failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (q?: string) => {
    const question = q || askQuestion;
    if (!question.trim() || askLoading) return;
    setAskLoading(true);
    setAskAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("ask-capture", {
        body: { noteText: meetingNotes, question },
      });
      if (error) throw error;
      setAskAnswer(data.answer || "No answer returned.");
    } catch {
      setAskAnswer("Sorry, I couldn't process that question.");
    } finally {
      setAskLoading(false);
      setAskQuestion("");
    }
  };

  const handleReset = () => {
    setResult(null);
    setMeetingNotes("");
    setAttendees("");
    setMeetingTitle("");
    setSelectedTemplate(null);
    setAskAnswer("");
  };

  const colors = result ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] : null;

  return (
    <div className="space-y-5">

      {/* ── Granola branding bar ── */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[hsl(50_50%_30%)] flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">G</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Granola Meeting Notes
        </span>
      </div>

      {!result ? (
        <>
          {/* ── Meeting type template pills ── */}
          <div className="flex flex-wrap gap-2">
            {MEETING_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                onClick={() => handleTemplateSelect(tpl.key)}
                className={`px-3 py-1.5 rounded-full border text-[12px] font-sans transition-all ${
                  selectedTemplate === tpl.key
                    ? "bg-[hsl(50_50%_30%)] text-white border-[hsl(50_50%_30%)]"
                    : "bg-card border-border text-foreground hover:border-foreground/40"
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {/* ── Split input: Your notes + transcript (left) | Live preview (right) ── */}
          <div className="grid md:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden bg-card">

            {/* Left panel — raw notes input */}
            <div className="p-4 md:border-r border-border">
              <div className="flex items-center gap-3 mb-3">
                <TrafficDots />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Your notes + transcript
                </span>
              </div>

              {/* Title */}
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting title…"
                className="w-full bg-transparent text-[18px] font-display text-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-2"
              />

              {/* Attendees row */}
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-sans text-[12px]">Today</span>
                <Users className="w-3.5 h-3.5 ml-2" />
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Jim, Michaela +5"
                  className="bg-transparent font-sans text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none flex-1"
                />
              </div>

              {/* Notes textarea */}
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Start typing your meeting notes…&#10;&#10;Vanta will enhance and classify when you're done."
                className="w-full min-h-[220px] bg-transparent font-sans text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-y leading-relaxed"
              />
            </div>

            {/* Right panel — AI enhanced preview */}
            <div className="p-4 bg-muted/20">
              <div className="flex items-center gap-3 mb-3">
                <TrafficDots />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI enhanced
                </span>
              </div>

              {meetingNotes.trim() ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <p className="font-display text-[16px] text-foreground/80">
                    {meetingTitle || "Meeting notes"}
                  </p>
                  {/* Show a structured preview of what AI will produce */}
                  {meetingNotes.split("\n").filter(Boolean).slice(0, 8).map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {line.endsWith(":") || line.match(/^[A-Z]/) ? (
                        <p className="font-sans text-[13px] font-medium text-foreground">{line}</p>
                      ) : (
                        <p className="font-sans text-[12px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                          {line}
                        </p>
                      )}
                    </div>
                  ))}
                  {meetingNotes.split("\n").filter(Boolean).length > 8 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      +{meetingNotes.split("\n").filter(Boolean).length - 8} more lines…
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="font-sans text-[13px] text-muted-foreground/60">
                    Start typing on the left —<br />AI-enhanced notes appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Submit bar ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!meetingNotes.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[hsl(50_50%_30%)] text-white font-sans text-[13px] hover:bg-[hsl(50_50%_25%)] transition-colors disabled:opacity-40"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Classifying…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Enhance &amp; Classify</>
              )}
            </button>
            {loading && (
              <span className="font-mono text-[10px] text-muted-foreground animate-pulse">
                Processing meeting notes…
              </span>
            )}
          </div>
        </>
      ) : colors ? (
        /* ── Result: Granola split-view output ── */
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden bg-card">

            {/* Left: original notes */}
            <div className="p-4 md:border-r border-border">
              <div className="flex items-center gap-3 mb-3">
                <TrafficDots />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Your notes</span>
              </div>
              <p className="font-display text-[16px] text-foreground mb-2">
                {meetingTitle || "Meeting notes"}
              </p>
              {attendees && (
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-sans text-[12px]">Today</span>
                  <Users className="w-3.5 h-3.5 ml-1" />
                  <span className="font-sans text-[12px]">{attendees}</span>
                </div>
              )}
              <p className="font-sans text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {meetingNotes}
              </p>
            </div>

            {/* Right: AI-enhanced structured output */}
            <div className="p-4 bg-muted/20">
              <div className="flex items-center gap-3 mb-3">
                <TrafficDots />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI enhanced
                </span>
              </div>

              <div className="space-y-3">
                {/* Title */}
                {result.suggestedTitle && (
                  <h3 className="font-display text-[18px] text-foreground leading-snug">{result.suggestedTitle}</h3>
                )}

                {/* Type badge */}
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm ${colors.bg} ${colors.text} ${colors.border} border`}>
                    {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{result.priority}</span>
                </div>

                {/* Summary as structured section */}
                <div className="space-y-1">
                  <p className="font-sans text-[13px] text-foreground font-medium">Overview</p>
                  <p className="font-sans text-[13px] text-foreground leading-relaxed pl-3 border-l-2 border-primary/30">
                    {result.summary}
                  </p>
                </div>

                {/* Contacts section */}
                {result.suggestedContacts && result.suggestedContacts.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-sans text-[13px] text-foreground font-medium">People</p>
                    <div className="flex items-center gap-2 flex-wrap pl-3 border-l-2 border-primary/30">
                      {result.suggestedContacts.map((c) => (
                        <span key={c} className="font-sans text-[12px] text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action items */}
                {result.accelerators && result.accelerators.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-sans text-[13px] text-foreground font-medium">Next Steps</p>
                    <ul className="space-y-1 pl-3 border-l-2 border-primary/30">
                      {result.accelerators.map((a, i) => (
                        <li key={i} className="font-sans text-[12px] text-foreground/80 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {result.suggestedTags && result.suggestedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {result.suggestedTags.map((tag) => (
                      <span key={tag} className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── "Ask Granola anything" bar ── */}
          <div className="border border-border rounded-lg p-4 bg-card space-y-3">
            {/* Suggested prompt pills */}
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              {ASK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleAsk(prompt)}
                  disabled={askLoading}
                  className="px-3 py-1.5 rounded-full bg-[hsl(50_50%_30%)]/10 border border-[hsl(50_50%_30%)]/30 text-[12px] font-sans text-foreground hover:bg-[hsl(50_50%_30%)]/20 transition-colors whitespace-nowrap disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask Granola anything…"
                className="flex-1 bg-transparent font-sans text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                disabled={askLoading}
              />
              <button
                onClick={() => handleAsk()}
                disabled={!askQuestion.trim() || askLoading}
                className="w-8 h-8 rounded-full bg-[hsl(50_50%_30%)] text-white flex items-center justify-center hover:bg-[hsl(50_50%_25%)] transition-colors disabled:opacity-30"
              >
                {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Answer */}
            {askAnswer && (
              <div className="pt-2 border-t border-border">
                <p className="font-sans text-[13px] text-foreground leading-relaxed">{askAnswer}</p>
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            + Import another meeting
          </button>
        </div>
      ) : null}
    </div>
  );
}

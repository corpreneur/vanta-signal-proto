import { useState, useRef } from "react";
import { Plus, X, Mic, MicOff, Loader2, Tag, Send, Bookmark, Share2, Pencil, Zap, Mail, MessageSquare, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";
import { useUserMode } from "@/hooks/use-user-mode";

const QUICK_TAGS = ["@person", "#priority", "#followup", "#idea", "#decision"];

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
};

interface ClassificationResult {
  signalType: string;
  priority: string;
  summary: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  suggestedContacts?: string[];
  accelerators?: string[];
}

type AcceleratorIntent = "email" | "sms" | "reminder" | "task" | "document";

interface NoteCaptureProps {
  inline?: boolean;
}

/**
 * Detect the intent behind an accelerator phrase to route to the right action.
 */
function detectIntent(action: string): AcceleratorIntent {
  const lower = action.toLowerCase();
  if (
    lower.includes("send email") ||
    lower.includes("send invoice") ||
    lower.includes("follow-up email") ||
    lower.includes("follow up email") ||
    lower.includes("email")
  ) return "email";
  if (
    lower.includes("send text") ||
    lower.includes("send sms") ||
    lower.includes("text ")
  ) return "sms";
  if (
    lower.includes("remind") ||
    lower.includes("schedule") ||
    lower.includes("set reminder") ||
    lower.includes("revisit")
  ) return "reminder";
  if (
    lower.includes("one-pager") ||
    lower.includes("document") ||
    lower.includes("draft") ||
    lower.includes("create a") ||
    lower.includes("surface") ||
    lower.includes("associated files")
  ) return "document";
  return "task";
}

function intentIcon(intent: AcceleratorIntent) {
  switch (intent) {
    case "email": return <Mail className="h-3.5 w-3.5" />;
    case "sms": return <MessageSquare className="h-3.5 w-3.5" />;
    case "reminder": return <Clock className="h-3.5 w-3.5" />;
    case "document": return <FileText className="h-3.5 w-3.5" />;
    case "task": return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
}

export default function NoteCapture({ inline = false }: NoteCaptureProps) {
  const { isDnd } = useUserMode();
  const [open, setOpen] = useState(inline);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [firedAccelerators, setFiredAccelerators] = useState<Set<string>>(new Set());

  // Editable result state
  const [editableTitle, setEditableTitle] = useState("");
  const [editableTags, setEditableTags] = useState<string[]>([]);
  const [editableContacts, setEditableContacts] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const { toast } = useToast();
  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const textBeforeVoiceRef = useRef("");

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast({
        title: "Speech recognition unavailable",
        description: "Your browser does not support speech recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      textBeforeVoiceRef.current = text;
      resetTranscript();
      startListening((voiceText) => {
        setText(
          textBeforeVoiceRef.current +
            (textBeforeVoiceRef.current ? "\n" : "") +
            voiceText
        );
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!text.trim() || loading) return;
    if (isListening) stopListening();
    setLoading(true);
    setResult(null);
    setFiredAccelerators(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: text.trim() },
      });

      if (error) throw error;

      const classification = data.classification as ClassificationResult;
      setResult(classification);
      setEditableTitle(classification.suggestedTitle || "");
      setEditableTags(classification.suggestedTags || []);
      setEditableContacts(classification.suggestedContacts || []);

      toast({
        title: `Captured as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      console.error("Note capture error:", e);
      toast({
        title: "Capture failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setText("");
    setSelectedTags([]);
    setResult(null);
    setEditableTitle("");
    setEditableTags([]);
    setEditableContacts([]);
    setNewTagInput("");
    setShowTagInput(false);
    setFiredAccelerators(new Set());
    if (!inline) setOpen(false);
  };

  const handleNewNote = () => {
    setText("");
    setSelectedTags([]);
    setResult(null);
    setEditableTitle("");
    setEditableTags([]);
    setEditableContacts([]);
    setNewTagInput("");
    setShowTagInput(false);
    setFiredAccelerators(new Set());
  };

  const removeTag = (tag: string) => {
    setEditableTags((prev) => prev.filter((t) => t !== tag));
  };

  const addTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !editableTags.includes(trimmed)) {
      setEditableTags((prev) => [...prev, trimmed]);
    }
    setNewTagInput("");
    setShowTagInput(false);
  };

  const removeContact = (contact: string) => {
    setEditableContacts((prev) => prev.filter((c) => c !== contact));
  };

  // ── Accelerator action handler ──
  const handleAccelerator = async (action: string) => {
    const intent = detectIntent(action);
    const title = editableTitle || result?.summary || action;
    const contacts = editableContacts;

    switch (intent) {
      case "email": {
        const to = contacts.length > 0 ? contacts.join(", ") : "";
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(result?.summary || text);
        window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_self");
        toast({ title: "Opening email client", description: action });
        break;
      }
      case "sms": {
        const smsBody = encodeURIComponent(result?.summary || text);
        window.open(`sms:?body=${smsBody}`, "_self");
        toast({ title: "Opening messages", description: action });
        break;
      }
      case "reminder":
      case "task": {
        try {
          const { error } = await supabase
            .from("signals")
            .update({ status: "In Progress" as const })
            .eq("id", "placeholder"); // We'll create a new signal instead

          // Create a new DECISION signal for the task
          const { data: fn, error: fnError } = await supabase.functions.invoke("brain-dump", {
            body: { text: `[Task from accelerator] ${action}. Context: ${title}` },
          });

          if (fnError) throw fnError;

          toast({
            title: intent === "reminder" ? "Reminder created" : "Task created",
            description: `"${action}" saved to your signal feed`,
          });
        } catch (e) {
          console.error("Accelerator task error:", e);
          toast({
            title: "Could not create task",
            description: e instanceof Error ? e.message : "Something went wrong.",
            variant: "destructive",
          });
        }
        break;
      }
      case "document": {
        toast({
          title: "Coming soon",
          description: `"${action}" — document creation will be available soon.`,
        });
        break;
      }
    }

    setFiredAccelerators((prev) => new Set(prev).add(action));
  };

  const colors = result
    ? SIGNAL_TYPE_COLORS[result.signalType as SignalType]
    : null;

  // ── VANTA Orb (hidden in DND mode) ──
  if (!inline && !open) {
    if (isDnd) return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="New note"
      >
        {/* Ambient pulse ring */}
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping [animation-duration:3s]" />
        {/* Glow ring */}
        <span className="absolute -inset-1 rounded-full bg-primary/10 blur-md group-hover:bg-primary/20 transition-all duration-500" />
        {/* Orb body */}
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] group-hover:scale-110 group-active:scale-95 transition-all duration-300">
          {/* VANTA dot mark */}
          <span className="absolute h-2 w-2 rounded-full bg-primary-foreground/90" />
          {/* Outer ring detail */}
          <span className="absolute h-10 w-10 rounded-full border border-primary-foreground/20" />
        </span>
      </button>
    );
  }

  // ── Note surface ──
  const noteContent = (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {isListening ? "Listening…" : "New Note"}
        </span>
        {!inline && (
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Text area */}
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className={`min-h-[140px] bg-transparent border-none shadow-none font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:ring-0 p-0 ${
            isListening ? "animate-pulse" : ""
          }`}
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border transition-all duration-150 ${
              selectedTags.includes(tag)
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Quick actions toolbar */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <button
          onClick={handleVoiceToggle}
          disabled={loading}
          className={`p-2 rounded-md transition-all ${
            !isSupported
              ? "text-muted-foreground/40 cursor-not-allowed"
              : isListening
              ? "text-red-400 bg-red-500/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={!isSupported ? "Speech recognition not supported in this browser" : isListening ? "Stop" : "Dictate"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Tag">
          <Tag className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Edit">
          <Pencil className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Share">
          <Share2 className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Bookmark">
          <Bookmark className="h-4 w-4" />
        </button>

        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={!text.trim() || loading}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── AI Result Card ── */}
      {result && colors && (
        <div
          className={`rounded-md border p-4 space-y-3 ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          {/* Classification badge */}
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}>
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              · {result.priority}
            </span>
          </div>

          {/* Summary */}
          <p className="font-mono text-xs text-foreground leading-relaxed">
            {result.summary}
          </p>

          {/* Editable Title */}
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Title
            </label>
            <Input
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="h-8 font-mono text-xs bg-background/50 border-border"
              placeholder="Note title…"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {editableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all min-h-[36px]"
                >
                  <X className="h-3 w-3" />
                  {tag}
                </button>
              ))}
              {showTagInput ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); addTag(); }}
                  className="flex items-center gap-1"
                >
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="h-8 w-24 font-mono text-[10px] bg-background/50 border-border"
                    placeholder="Tag…"
                    autoFocus
                    onBlur={addTag}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all min-h-[36px]"
                >
                  + add
                </button>
              )}
            </div>
          </div>

          {/* Contacts */}
          {editableContacts.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                Add
              </label>
              <div className="flex flex-wrap gap-1.5">
                {editableContacts.map((contact) => (
                  <button
                    key={contact}
                    onClick={() => removeContact(contact)}
                    className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all min-h-[36px]"
                  >
                    + {contact}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions row */}
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Quick Actions
            </label>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center" title="Tag">
                <Tag className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center" title="Share">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center" title="Save">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* VANTA Suggests — Accelerators */}
          {result.accelerators && result.accelerators.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  VANTA Suggests
                </label>
              </div>
              <div className="flex flex-col gap-1">
                {result.accelerators.map((action) => {
                  const intent = detectIntent(action);
                  const fired = firedAccelerators.has(action);
                  return (
                    <button
                      key={action}
                      onClick={() => !fired && handleAccelerator(action)}
                      disabled={fired}
                      className={`flex items-center gap-2 font-mono text-[10px] tracking-wide px-3 py-2 rounded-md border text-left min-h-[36px] transition-all ${
                        fired
                          ? "opacity-50 bg-primary/5 border-primary/20 text-muted-foreground cursor-default"
                          : "text-foreground bg-background/40 hover:bg-primary/10 hover:text-primary border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-primary shrink-0">
                        {fired ? <CheckCircle2 className="h-3.5 w-3.5" /> : intentIcon(intent)}
                      </span>
                      <span className={fired ? "line-through" : ""}>{action}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* New note */}
          <button
            onClick={handleNewNote}
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            + New note
          </button>
        </div>
      )}
    </div>
  );

  if (inline) return noteContent;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto">
        {noteContent}
      </div>
    </div>
  );
}

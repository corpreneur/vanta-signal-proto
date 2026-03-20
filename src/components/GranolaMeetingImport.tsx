import { useState } from "react";
import { FileText, Loader2, Send, Users, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
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

interface GranolaMeetingImportProps {
  onCapture?: (classification: ClassificationResult) => void;
}

export default function GranolaMeetingImport({ onCapture }: GranolaMeetingImportProps) {
  const [meetingNotes, setMeetingNotes] = useState("");
  const [attendees, setAttendees] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!meetingNotes.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const fullText = [
      attendees.trim() ? `Meeting attendees: ${attendees.trim()}` : "",
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

  const handleReset = () => {
    setResult(null);
    setMeetingNotes("");
    setAttendees("");
  };

  const colors = result ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] : null;

  return (
    <div className="space-y-4">
      {/* Granola branding bar */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">G</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          Granola Meeting Notes Import
        </span>
      </div>

      {!result ? (
        <>
          {/* Attendees field */}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
              <Users className="w-3 h-3 inline mr-1" />
              Attendees (optional)
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Jane Doe, Mike Chen, Sara Kim…"
              className="w-full bg-transparent border border-vanta-border px-3 py-2 font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Meeting notes */}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
              <FileText className="w-3 h-3 inline mr-1" />
              Paste Granola meeting notes
            </label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Paste your Granola meeting notes here…&#10;&#10;Vanta will extract signals, decisions, action items, and classify the content automatically."
              className="w-full min-h-[160px] bg-transparent border border-vanta-border px-3 py-2 font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-y"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!meetingNotes.trim() || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Classifying…</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Import &amp; Classify</>
            )}
          </button>
        </>
      ) : colors ? (
        <div className={`border p-4 space-y-3 ${colors.bg} ${colors.border}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}>
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">· {result.priority}</span>
          </div>
          {result.suggestedTitle && (
            <p className="font-display text-[16px] text-foreground">{result.suggestedTitle}</p>
          )}
          <p className="font-sans text-[13px] text-foreground leading-relaxed">{result.summary}</p>

          {result.suggestedContacts && result.suggestedContacts.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-3 h-3 text-muted-foreground" />
              {result.suggestedContacts.map((c) => (
                <span key={c} className="font-mono text-[9px] px-2 py-0.5 border border-current/20 text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          )}

          {result.suggestedTags && result.suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.suggestedTags.map((tag) => (
                <span key={tag} className="font-mono text-[9px] px-2 py-0.5 bg-muted/30 text-muted-foreground border border-vanta-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleReset}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            + Import another
          </button>
        </div>
      ) : null}
    </div>
  );
}

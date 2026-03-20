import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SUGGESTED_PROMPTS = [
  "Summarize key decisions",
  "Who should I follow up with?",
  "What are the next steps?",
  "Extract action items",
];

interface AskVantaBarProps {
  noteText: string;
}

export default function AskVantaBar({ noteText }: AskVantaBarProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const askVanta = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("ask-capture", {
        body: { noteText, question: q.trim() },
      });
      if (error) throw error;
      setAnswer(data.answer || "No response.");
    } catch (e) {
      console.error("Ask Vanta error:", e);
      toast({
        title: "Couldn't get an answer",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askVanta(question);
  };

  const handleSuggestion = (prompt: string) => {
    setQuestion(prompt);
    askVanta(prompt);
  };

  return (
    <div className="border-t border-border px-4 py-3 bg-muted/10">
      {/* Answer display */}
      {answer && (
        <div className="mb-3 p-3 border border-primary/20 bg-primary/5 rounded-md">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">Vanta</span>
          </div>
          <p className="font-sans text-[13px] text-foreground leading-relaxed">{answer}</p>
        </div>
      )}

      {/* Suggested prompt pills */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSuggestion(p)}
            disabled={loading}
            className="font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Vanta anything about this capture…"
          className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </div>
  );
}

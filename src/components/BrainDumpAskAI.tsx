import { useState } from "react";
import { Sparkles, Send, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SUGGESTED_PROMPTS = [
  "Summarize my recent captures",
  "What decisions need attention?",
  "Who should I follow up with?",
  "Extract all action items",
  "What themes are emerging?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BrainDumpAskAIProps {
  /** Concatenated text of recent captures for context */
  captureContext: string;
}

export default function BrainDumpAskAI({ captureContext }: BrainDumpAskAIProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const askVanta = async (q: string) => {
    if (!q.trim() || loading) return;
    const userMsg: Message = { role: "user", content: q.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ask-capture", {
        body: { noteText: captureContext, question: q.trim() },
      });
      if (error) throw error;
      const assistantMsg: Message = { role: "assistant", content: data.answer || "No response." };
      setMessages((prev) => [...prev, assistantMsg]);
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

  return (
    <section className="border border-vanta-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-vanta-border">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Ask Vanta
        </p>
        <span className="font-mono text-[9px] text-muted-foreground ml-auto">
          Jamie-style AI · {messages.length > 0 ? `${messages.length} messages` : "Ask anything"}
        </span>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-[280px] overflow-y-auto px-5 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-5 h-5 bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 font-sans text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted/30 text-foreground border border-vanta-border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-5 h-5 bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              </div>
              <div className="px-3 py-2 bg-muted/30 border border-vanta-border">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="px-5 py-3 space-y-2">
          <p className="font-sans text-[12px] text-muted-foreground">
            Ask questions about your captures, find patterns, or get action items.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => askVanta(p)}
                disabled={loading || !captureContext}
                className="font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1.5 border border-vanta-border text-muted-foreground hover:text-foreground hover:border-vanta-accent-border transition-all disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-5 py-3 border-t border-vanta-border">
        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={captureContext ? "Ask about your captures…" : "Capture something first…"}
          className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={loading || !captureContext}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading || !captureContext}
          className="p-1.5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </section>
  );
}

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const InlineBrainDump = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: trimmed },
      });

      if (error) throw error;

      setText("");
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      toast.success(
        data?.classification?.signal_type
          ? `Captured as ${data.classification.signal_type}`
          : "Signal captured"
      );
    } catch (err) {
      console.error("Brain dump error:", err);
      toast.error("Failed to capture — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-3 border border-vanta-border bg-card px-4 py-3 transition-colors focus-within:border-primary/30">
        <Sparkles className="w-4 h-4 text-vanta-text-muted shrink-0" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What's on your mind? Drop a note, link, or thought…"
          disabled={loading}
          className="flex-1 bg-transparent font-sans text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none disabled:opacity-50"
        />
        {loading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
        {!loading && text.trim() && (
          <button
            onClick={handleSubmit}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineBrainDump;

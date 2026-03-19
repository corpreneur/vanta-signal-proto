import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SendMessageSheet({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = to.trim().length > 0 && message.trim().length > 0;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("linq-send", {
        body: { to: to.trim(), message: message.trim() },
      });
      if (error) throw error;
      toast.success("Message sent via Linq");
      onClose();
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Send Message
        </h3>
      </div>

      <Input
        placeholder="Recipient (phone number or name)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="font-mono text-sm"
      />

      <Textarea
        placeholder="Type your message…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="font-sans text-sm resize-none"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-[10px] uppercase tracking-wider">
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSend || sending}
          onClick={handleSend}
          className="font-mono text-[10px] uppercase tracking-wider gap-1.5"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send
        </Button>
      </div>
    </div>
  );
}

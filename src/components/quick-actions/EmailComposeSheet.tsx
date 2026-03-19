import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmailComposeSheet({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = to.trim().length > 0 && body.trim().length > 0;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("linq-send", {
        body: { to: to.trim(), message: subject ? `${subject}\n\n${body}` : body },
      });
      if (error) throw error;
      toast.success("Email drafted & sent");
      onClose();
    } catch (err) {
      toast.error("Failed to send: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Draft Email
        </h3>
      </div>

      <Input
        placeholder="To (email or name)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="font-mono text-sm"
      />
      <Input
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="font-mono text-sm"
      />
      <Textarea
        placeholder="Write your message…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
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

import { useState } from "react";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CalendarInviteSheet({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [attendees, setAttendees] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && date.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const startsAt = new Date(`${date}T${time}`).toISOString();
      const endsAt = new Date(new Date(`${date}T${time}`).getTime() + parseInt(duration) * 60000).toISOString();
      const attendeeList = attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .map((name) => ({ name, email: "" }));

      const { error } = await supabase.from("upcoming_meetings").insert({
        title: title.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        attendees: attendeeList,
      });
      if (error) throw error;
      toast.success("Meeting created");
      onClose();
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Calendar Invite
        </h3>
      </div>

      <Input
        placeholder="Meeting title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="font-mono text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="font-mono text-sm"
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">
          Duration (minutes)
        </label>
        <div className="flex gap-1.5">
          {["30", "60", "90"].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 font-mono text-[10px] border transition-colors ${
                duration === d
                  ? "border-foreground/30 bg-muted text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Attendees (comma separated)"
        value={attendees}
        onChange={(e) => setAttendees(e.target.value)}
        className="font-mono text-sm"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-[10px] uppercase tracking-wider">
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSave || saving}
          onClick={handleSave}
          className="font-mono text-[10px] uppercase tracking-wider gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Create
        </Button>
      </div>
    </div>
  );
}

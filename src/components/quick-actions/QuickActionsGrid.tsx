import { useState } from "react";
import {
  StickyNote, Mail, Calendar, Mic, MessageSquare, AlarmClock,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NoteCapture from "@/components/NoteCapture";
import VoiceMemoCapture from "@/components/VoiceMemoCapture";
import EmailComposeSheet from "./EmailComposeSheet";
import CalendarInviteSheet from "./CalendarInviteSheet";
import QuickReminderSheet from "./QuickReminderSheet";
import SendMessageSheet from "./SendMessageSheet";

type ActionId = "note" | "email" | "invite" | "voice" | "message" | "reminder";

const ACTIONS: { id: ActionId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "note", label: "New Note", icon: StickyNote, desc: "Capture a thought" },
  { id: "email", label: "Draft Email", icon: Mail, desc: "Compose & send" },
  { id: "invite", label: "Calendar Invite", icon: Calendar, desc: "Schedule a meeting" },
  { id: "voice", label: "Voice Memo", icon: Mic, desc: "Record & classify" },
  { id: "message", label: "Send Message", icon: MessageSquare, desc: "Linq / SMS" },
  { id: "reminder", label: "Set Reminder", icon: AlarmClock, desc: "Follow-up later" },
];

export default function QuickActionsGrid() {
  const [open, setOpen] = useState<ActionId | null>(null);

  const close = () => setOpen(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => setOpen(a.id)}
              className="group flex flex-col items-center gap-1.5 p-4 border border-border bg-card hover:border-foreground/20 hover:bg-muted transition-all duration-200 text-center"
            >
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground leading-tight">
                {a.label}
              </span>
              <span className="font-mono text-[8px] text-muted-foreground leading-tight hidden sm:block">
                {a.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Note Sheet */}
      <Sheet open={open === "note"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <NoteCapture inline onCapture={close} />
        </SheetContent>
      </Sheet>

      {/* Voice Sheet */}
      <Sheet open={open === "voice"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <VoiceMemoCapture onCaptured={close} />
        </SheetContent>
      </Sheet>

      {/* Email Sheet */}
      <Sheet open={open === "email"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <EmailComposeSheet onClose={close} />
        </SheetContent>
      </Sheet>

      {/* Calendar Invite Sheet */}
      <Sheet open={open === "invite"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <CalendarInviteSheet onClose={close} />
        </SheetContent>
      </Sheet>

      {/* Send Message Sheet */}
      <Sheet open={open === "message"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SendMessageSheet onClose={close} />
        </SheetContent>
      </Sheet>

      {/* Reminder Sheet */}
      <Sheet open={open === "reminder"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <QuickReminderSheet onClose={close} />
        </SheetContent>
      </Sheet>
    </>
  );
}

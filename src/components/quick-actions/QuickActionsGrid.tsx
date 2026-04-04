import { useState } from "react";
import {
  StickyNote, Mail, Calendar, Mic, MessageSquare, AlarmClock, Video,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NoteCapture from "@/components/NoteCapture";
import VoiceMemoCapture from "@/components/VoiceMemoCapture";
import EmailComposeSheet from "./EmailComposeSheet";
import CalendarInviteSheet from "./CalendarInviteSheet";
import QuickReminderSheet from "./QuickReminderSheet";

type ActionId = "note" | "email" | "invite" | "voice" | "reminder";

const ACTIONS: { id: ActionId | "message" | "zoom"; label: string; icon: React.ElementType; desc: string; comingSoon?: boolean }[] = [
  { id: "note", label: "Capture Note", icon: StickyNote, desc: "Drop in anything" },
  { id: "email", label: "Draft Email", icon: Mail, desc: "Compose & send" },
  { id: "invite", label: "Calendar Invite", icon: Calendar, desc: "Schedule a meeting" },
  { id: "voice", label: "Voice Memo", icon: Mic, desc: "Record & classify" },
  { id: "message", label: "Send Message", icon: MessageSquare, desc: "Opens Messages" },
  { id: "reminder", label: "Set Reminder", icon: AlarmClock, desc: "Follow-up later" },
  { id: "zoom", label: "Start Zoom", icon: Video, desc: "Launch meeting" },
];

export default function QuickActionsGrid() {
  const [open, setOpen] = useState<ActionId | null>(null);

  const close = () => setOpen(null);

  function handleTap(id: ActionId | "message" | "offers") {
    if (id === "message") {
      window.open("sms:", "_self");
      return;
    }
    if (id === "offers") return; // Coming soon
    setOpen(id as ActionId);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => handleTap(a.id)}
              disabled={a.comingSoon}
              className={`group flex flex-col items-center gap-1.5 p-4 border bg-card hover:border-foreground/20 hover:bg-muted transition-all duration-200 text-center relative ${
                a.comingSoon ? "border-dashed border-border opacity-60 cursor-default" : "border-border"
              }`}
            >
              {a.comingSoon && (
                <span className="absolute top-1.5 right-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                  Soon
                </span>
              )}
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
          <VoiceMemoCapture onCapture={close} />
        </SheetContent>
      </Sheet>

      {/* Email Picker Sheet */}
      <Sheet open={open === "email"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <EmailComposeSheet onClose={close} />
        </SheetContent>
      </Sheet>

      {/* Calendar Picker Sheet */}
      <Sheet open={open === "invite"} onOpenChange={(v) => !v && close()}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <CalendarInviteSheet onClose={close} />
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

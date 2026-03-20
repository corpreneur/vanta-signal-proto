import { Calendar } from "lucide-react";
import { PARTNER_LOGOS } from "@/components/PartnerLogos";

const CALENDAR_OPTIONS = [
  {
    label: "Apple Calendar",
    desc: "Default iOS calendar",
    handler: () => {
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "SUMMARY:New Event",
        "DTSTART:" + new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
        "DTEND:" + new Date(Date.now() + 7200000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "event.ics";
      a.click();
      URL.revokeObjectURL(url);
    },
    logoKey: "apple_calendar",
  },
  {
    label: "Google Calendar",
    desc: "Create event in Google",
    handler: () => {
      window.open("https://calendar.google.com/calendar/r/eventedit", "_blank");
    },
    logoKey: "google_calendar",
  },
  {
    label: "Outlook",
    desc: "Microsoft calendar",
    handler: () => {
      window.open("https://outlook.live.com/calendar/0/deeplink/compose", "_blank");
    },
    logoKey: "outlook_calendar",
  },
];

export default function CalendarInviteSheet({ onClose }: { onClose: () => void }) {
  function handlePick(option: (typeof CALENDAR_OPTIONS)[number]) {
    option.handler();
    onClose();
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Open Calendar In…
        </h3>
      </div>

      <div className="space-y-1.5">
        {CALENDAR_OPTIONS.map((opt) => {
          const Logo = PARTNER_LOGOS[opt.logoKey];
          return (
            <button
              key={opt.label}
              onClick={() => handlePick(opt)}
              className="w-full flex items-center gap-3 p-3.5 border border-border bg-card hover:border-foreground/20 hover:bg-muted transition-all duration-200 text-left"
            >
              {Logo && <Logo className="w-8 h-8 shrink-0" />}
              <div className="flex flex-col">
                <span className="font-mono text-[11px] uppercase tracking-wider text-foreground font-medium">
                  {opt.label}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface NotifGroup {
  title: string;
  items: NotifSetting[];
}

const INITIAL_GROUPS: NotifGroup[] = [
  {
    title: "Signal Alerts",
    items: [
      { id: "high_priority", label: "High-priority signals", description: "Notify when a signal is classified as high priority", enabled: true },
      { id: "new_intro", label: "New introductions", description: "Alert when an INTRO signal is captured from any channel", enabled: true },
      { id: "investment", label: "Investment signals", description: "Immediate notification for investment-related signals", enabled: true },
      { id: "noise_review", label: "Noise queue digest", description: "Daily summary of signals filtered to noise for review", enabled: false },
    ],
  },
  {
    title: "Relationship Health",
    items: [
      { id: "cooling_alert", label: "Cooling alerts", description: "Warn when a relationship strength drops below threshold", enabled: true },
      { id: "engagement_due", label: "Engagement due", description: "Remind when a scheduled engagement sequence is due", enabled: true },
      { id: "strength_milestone", label: "Strength milestones", description: "Celebrate when a contact reaches a new strength tier", enabled: false },
    ],
  },
  {
    title: "Meetings",
    items: [
      { id: "pre_brief", label: "Pre-meeting dossier", description: "Send briefing 30 min before a scheduled meeting", enabled: true },
      { id: "post_summary", label: "Post-meeting summary", description: "Recap and action items after a recorded meeting", enabled: true },
      { id: "calendar_conflict", label: "Calendar conflicts", description: "Alert when meetings overlap with signal-related tasks", enabled: false },
    ],
  },
  {
    title: "System",
    items: [
      { id: "weekly_digest", label: "Weekly intelligence digest", description: "Sunday summary of top signals, trends, and actions", enabled: true },
      { id: "sync_errors", label: "Sync errors", description: "Alert when a connected source fails to sync", enabled: true },
      { id: "product_updates", label: "Product updates", description: "New features, improvements, and release notes", enabled: false },
    ],
  },
];

const CHANNELS = [
  { id: "push", label: "Push Notifications", enabled: true },
  { id: "email", label: "Email", enabled: true },
  { id: "sms", label: "SMS", enabled: false },
  { id: "in_app", label: "In-App", enabled: true },
];

export default function NotificationPreferences() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [channels, setChannels] = useState(CHANNELS);
  const [saved, setSaved] = useState(false);

  const toggleItem = (groupIdx: number, itemId: string) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIdx ? g : {
          ...g,
          items: g.items.map((it) => (it.id === itemId ? { ...it, enabled: !it.enabled } : it)),
        }
      )
    );
  };

  const toggleChannel = (channelId: string) => {
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, enabled: !c.enabled } : c)));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Notification preferences saved.");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[600px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Dashboard
      </Link>

      <Motion>
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">
          Notification Preferences
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Choose what you want to be notified about
        </p>
      </Motion>

      {/* Delivery channels */}
      <Motion delay={40}>
        <div className="border border-border rounded-lg p-5 mb-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Delivery Channels</p>
          <div className="grid grid-cols-2 gap-3">
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between py-2">
                <span className="font-sans text-[13px] text-foreground">{ch.label}</span>
                <Switch checked={ch.enabled} onCheckedChange={() => toggleChannel(ch.id)} />
              </div>
            ))}
          </div>
        </div>
      </Motion>

      {/* Notification groups */}
      {groups.map((group, gi) => (
        <Motion key={group.title} delay={80 + gi * 40}>
          <div className="mb-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{group.title}</p>
            <div className="border border-border rounded-lg divide-y divide-border">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-sans text-[13px] font-medium text-foreground">{item.label}</p>
                    <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  <Switch checked={item.enabled} onCheckedChange={() => toggleItem(gi, item.id)} />
                </div>
              ))}
            </div>
          </div>
        </Motion>
      ))}

      {/* Save */}
      <Motion delay={280}>
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} className="gap-2">
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Saved" : "Save Preferences"}
          </Button>
        </div>
      </Motion>
    </div>
  );
}

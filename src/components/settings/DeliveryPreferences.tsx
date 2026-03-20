import { Bell, MessageSquare, Mail, Clock, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export default function DeliveryPreferences() {
  const { prefs, loading, updatePrefs } = useUserPreferences();

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-sm" />;

  const anyEnabled = prefs.delivery_push || prefs.delivery_sms || prefs.delivery_email;

  const channels = [
    prefs.delivery_push && "In-App Push",
    prefs.delivery_sms && "SMS",
    prefs.delivery_email && "Email",
  ].filter(Boolean);

  const save = async () => {
    await updatePrefs({
      delivery_push: prefs.delivery_push,
      delivery_sms: prefs.delivery_sms,
      delivery_email: prefs.delivery_email,
      delivery_email_address: prefs.delivery_email_address,
      delivery_time: prefs.delivery_time,
      delivery_timezone: prefs.delivery_timezone,
    });
    toast.success(
      anyEnabled
        ? `Preferences saved. Signal Brief will arrive at ${prefs.delivery_time} via ${channels.join(", ")}.`
        : "Preferences saved. All delivery channels disabled."
    );
  };

  const update = (patch: Partial<typeof prefs>) => {
    // Optimistic local update via the hook
    updatePrefs(patch);
  };

  return (
    <div>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-1 border-b border-vanta-border pb-2">
        Signal Delivery
      </h2>
      <p className="font-mono text-[11px] text-vanta-text-muted mb-6 mt-2">
        Choose how your daily Signal Brief reaches you.
      </p>

      <div className="space-y-1 mb-6">
        {/* Push */}
        <div className="flex items-center justify-between p-4 border border-vanta-border bg-vanta-bg-elevated">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-muted-foreground opacity-60" />
            <div>
              <p className="font-mono text-[12px] font-medium text-foreground">In-App Push Notification</p>
              <p className="font-mono text-[10px] text-vanta-text-muted">Alerts delivered to this device</p>
            </div>
          </div>
          <Switch checked={prefs.delivery_push} onCheckedChange={(v) => update({ delivery_push: v })} />
        </div>

        {/* SMS */}
        <div className="border border-vanta-border bg-vanta-bg-elevated">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground opacity-60" />
              <div>
                <p className="font-mono text-[12px] font-medium text-foreground">SMS</p>
                <p className="font-mono text-[10px] text-vanta-text-muted">Delivered to your Vanta Wireless number. No setup required.</p>
              </div>
            </div>
            <Switch checked={prefs.delivery_sms} onCheckedChange={(v) => update({ delivery_sms: v })} />
          </div>
          {prefs.delivery_sms && (
            <div className="px-4 pb-4 pt-0">
              <span className="font-mono text-[11px] text-muted-foreground">Number: ••••3821</span>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="border border-vanta-border bg-vanta-bg-elevated">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground opacity-60" />
              <div>
                <p className="font-mono text-[12px] font-medium text-foreground">Email</p>
                <p className="font-mono text-[10px] text-vanta-text-muted">Send to your email address</p>
              </div>
            </div>
            <Switch checked={prefs.delivery_email} onCheckedChange={(v) => update({ delivery_email: v })} />
          </div>
          {prefs.delivery_email && (
            <div className="px-4 pb-4 pt-0">
              <input
                type="email"
                value={prefs.delivery_email_address}
                onChange={(e) => update({ delivery_email_address: e.target.value })}
                placeholder="your@email.com"
                className="w-full bg-background border border-vanta-border px-3 py-2 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-vanta-accent/50 transition-colors rounded-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Time picker */}
      {anyEnabled && (
        <div className="border border-vanta-border bg-vanta-bg-elevated p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground opacity-60" />
            <p className="font-mono text-[12px] font-medium text-foreground">Deliver at</p>
          </div>
          <input
            type="time"
            value={prefs.delivery_time}
            onChange={(e) => update({ delivery_time: e.target.value })}
            className="bg-background border border-vanta-border px-3 py-2 font-mono text-[12px] text-foreground focus:outline-none focus:border-vanta-accent/50 transition-colors rounded-sm mb-2"
          />
          <p className="font-mono text-[10px] text-vanta-text-muted">
            Based on your location: {prefs.delivery_timezone.replace("_", " ")}
          </p>
        </div>
      )}

      <button
        onClick={save}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-vanta-accent text-vanta-bg font-mono text-[11px] uppercase tracking-widest hover:bg-vanta-accent/90 transition-colors"
      >
        <Save className="w-3.5 h-3.5" /> Save Delivery Preferences
      </button>
    </div>
  );
}

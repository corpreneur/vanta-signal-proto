import { useState, useEffect } from "react";
import { Bell, MessageSquare, Mail, Clock, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface DeliveryPrefs {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  deliveryTime: string;
  timezone: string;
}

const DEFAULT_PREFS: DeliveryPrefs = {
  pushEnabled: false,
  smsEnabled: false,
  emailEnabled: false,
  emailAddress: "",
  deliveryTime: "06:30",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export default function DeliveryPreferences() {
  const [prefs, setPrefs] = useState<DeliveryPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vanta_delivery_prefs");
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  const update = (patch: Partial<DeliveryPrefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const anyEnabled = prefs.pushEnabled || prefs.smsEnabled || prefs.emailEnabled;

  const channels = [
    prefs.pushEnabled && "In-App Push",
    prefs.smsEnabled && "SMS",
    prefs.emailEnabled && "Email",
  ].filter(Boolean);

  const save = () => {
    localStorage.setItem("vanta_delivery_prefs", JSON.stringify(prefs));
    toast.success(
      anyEnabled
        ? `Preferences saved. Signal Brief will arrive at ${prefs.deliveryTime} via ${channels.join(", ")}.`
        : "Preferences saved. All delivery channels disabled."
    );
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
          <Switch checked={prefs.pushEnabled} onCheckedChange={(v) => update({ pushEnabled: v })} />
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
            <Switch checked={prefs.smsEnabled} onCheckedChange={(v) => update({ smsEnabled: v })} />
          </div>
          {prefs.smsEnabled && (
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
            <Switch checked={prefs.emailEnabled} onCheckedChange={(v) => update({ emailEnabled: v })} />
          </div>
          {prefs.emailEnabled && (
            <div className="px-4 pb-4 pt-0">
              <input
                type="email"
                value={prefs.emailAddress}
                onChange={(e) => update({ emailAddress: e.target.value })}
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
            value={prefs.deliveryTime}
            onChange={(e) => update({ deliveryTime: e.target.value })}
            className="bg-background border border-vanta-border px-3 py-2 font-mono text-[12px] text-foreground focus:outline-none focus:border-vanta-accent/50 transition-colors rounded-sm mb-2"
          />
          <p className="font-mono text-[10px] text-vanta-text-muted">
            Based on your location: {prefs.timezone.replace("_", " ")}
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

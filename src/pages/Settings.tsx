import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Settings2, MessageSquare, Users, Bell, Shield } from "lucide-react";

interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

async function fetchSettings(): Promise<SettingRow[]> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("key");
  if (error) throw error;
  return (data || []) as SettingRow[];
}

// Known settings with metadata
const SETTING_META: Record<string, { label: string; description: string; icon: React.ElementType; section: string }> = {
  reply_persona: {
    label: "Reply Persona",
    description: "The system prompt that controls the tone, style, and behavior of AI auto-replies sent via Linq.",
    icon: MessageSquare,
    section: "AI & Automation",
  },
  group_autoreply_enabled: {
    label: "Group Chat Auto-Reply",
    description: "When enabled, the AI will automatically respond to messages in group chats. When disabled, group messages are still captured and classified but no reply is sent.",
    icon: Users,
    section: "AI & Automation",
  },
  digest_enabled: {
    label: "Daily Digest",
    description: "When enabled, a morning digest of the top 5 signals and overdue items is sent via iMessage at 7:00 AM CT.",
    icon: Bell,
    section: "Notifications",
  },
  digest_time: {
    label: "Digest Time",
    description: "The time of day (CT) to send the daily digest. Format: HH:MM (24h).",
    icon: Bell,
    section: "Notifications",
  },
};

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["system_settings"], queryFn: fetchSettings });

  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Sync fetched settings into local state
  useEffect(() => {
    if (settings) {
      const vals: Record<string, unknown> = {};
      settings.forEach((s) => { vals[s.key] = s.value; });
      setEditedValues(vals);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: value as any, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["system_settings"] });
      toast.success(`${SETTING_META[key]?.label || key} saved`);
    },
    onError: (err) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const handleSave = async (key: string) => {
    setSaving((p) => ({ ...p, [key]: true }));
    await saveMutation.mutateAsync({ key, value: editedValues[key] });
    setSaving((p) => ({ ...p, [key]: false }));
  };

  const handleRevert = (key: string) => {
    const original = settings?.find((s) => s.key === key);
    if (original) {
      setEditedValues((p) => ({ ...p, [key]: original.value }));
    }
  };

  const isDirty = (key: string) => {
    const original = settings?.find((s) => s.key === key);
    if (!original) return false;
    return JSON.stringify(editedValues[key]) !== JSON.stringify(original.value);
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">Loading settings…</div>
      </div>
    );
  }

  // Group settings by section
  const sections: Record<string, SettingRow[]> = {};
  (settings || []).forEach((s) => {
    const section = SETTING_META[s.key]?.section || "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(s);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-5 h-5 text-vanta-text-muted" />
          <h1 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
        <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">
          System configuration · AI behavior · Feature toggles
        </p>
      </div>

      {/* Settings sections */}
      <div className="space-y-10">
        {Object.entries(sections).map(([sectionName, sectionSettings]) => (
          <div key={sectionName}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-4 border-b border-vanta-border pb-2">
              {sectionName}
            </h2>
            <div className="space-y-6">
              {sectionSettings.map((setting) => {
                const meta = SETTING_META[setting.key];
                const Icon = meta?.icon || Shield;
                const isBoolean = typeof editedValues[setting.key] === "boolean";
                const isText = typeof editedValues[setting.key] === "string";
                const dirty = isDirty(setting.key);

                return (
                  <div
                    key={setting.key}
                    className={`border bg-vanta-bg-elevated p-5 md:p-6 transition-colors ${
                      dirty ? "border-vanta-accent/40" : "border-vanta-border"
                    }`}
                  >
                    {/* Setting header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 mt-0.5 text-vanta-text-muted shrink-0" />
                        <div>
                          <h3 className="font-mono text-sm font-medium text-foreground">
                            {meta?.label || setting.key}
                          </h3>
                          <p className="font-mono text-[11px] text-vanta-text-muted mt-1 leading-relaxed max-w-xl">
                            {meta?.description || `Configuration key: ${setting.key}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-vanta-text-low uppercase tracking-widest whitespace-nowrap">
                        {formatTimestamp(setting.updated_at)}
                      </span>
                    </div>

                    {/* Setting control */}
                    <div className="mt-4">
                      {isBoolean ? (
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={editedValues[setting.key] as boolean}
                            onCheckedChange={(checked) =>
                              setEditedValues((p) => ({ ...p, [setting.key]: checked }))
                            }
                          />
                          <span className="font-mono text-xs text-vanta-text-mid">
                            {editedValues[setting.key] ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      ) : isText ? (
                        <textarea
                          value={editedValues[setting.key] as string}
                          onChange={(e) =>
                            setEditedValues((p) => ({ ...p, [setting.key]: e.target.value }))
                          }
                          className="w-full min-h-[180px] bg-background border border-vanta-border p-4 font-mono text-xs text-foreground leading-relaxed resize-y focus:outline-none focus:border-vanta-accent/50 transition-colors"
                          spellCheck={false}
                        />
                      ) : (
                        <pre className="bg-background border border-vanta-border p-4 font-mono text-xs text-vanta-text-mid overflow-auto max-h-40">
                          {JSON.stringify(editedValues[setting.key], null, 2)}
                        </pre>
                      )}
                    </div>

                    {/* Actions */}
                    {dirty && (
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-vanta-border">
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={saving[setting.key]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vanta-accent text-vanta-bg font-mono text-[11px] uppercase tracking-widest hover:bg-vanta-accent/90 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          {saving[setting.key] ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => handleRevert(setting.key)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-vanta-border text-vanta-text-muted font-mono text-[11px] uppercase tracking-widest hover:text-foreground hover:border-vanta-border-mid transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revert
                        </button>
                        <span className="font-mono text-[9px] text-vanta-accent uppercase tracking-widest">
                          Unsaved changes
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-vanta-border">
        <p className="font-mono text-[9px] text-vanta-text-low uppercase tracking-widest">
          Settings are stored in system_settings and take effect immediately on save.
        </p>
      </div>
    </div>
  );
}

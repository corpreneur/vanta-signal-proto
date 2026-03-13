import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, RotateCcw, Settings2, MessageSquare, Users, Bell, Shield, Smartphone, Phone, Video, Mail, Calendar, Filter, SlidersHorizontal, ShieldCheck } from "lucide-react";
import UserModes from "./UserModes";
import NoiseQueue from "./NoiseQueue";
import ClassificationAudit from "./ClassificationAudit";

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

// Source channel definitions
const SOURCE_CHANNELS: Array<{
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}> = [
  { key: "source_linq_enabled", label: "Linq / iMessage", description: "SMS and iMessage signals via Linq", icon: Smartphone, iconColor: "text-vanta-accent opacity-60" },
  { key: "source_phone_enabled", label: "Phone", description: "Native phone call intelligence", icon: Phone, iconColor: "text-vanta-accent-phone opacity-60" },
  { key: "source_recall_enabled", label: "Zoom", description: "Meeting recordings and transcripts via Recall", icon: Video, iconColor: "text-vanta-accent-zoom opacity-60" },
  { key: "source_gmail_enabled", label: "Email", description: "Gmail inbox signal ingestion", icon: Mail, iconColor: "text-vanta-accent-teal opacity-60" },
  { key: "source_calendar_enabled", label: "Calendar", description: "Meeting briefs and scheduling intelligence", icon: Calendar, iconColor: "text-vanta-accent-amber opacity-60" },
];

const SOURCE_KEYS = new Set(SOURCE_CHANNELS.map((c) => c.key));

const TAB_MAP: Record<string, string> = { noise: "noise", modes: "modes", audit: "audit" };

export default function Settings() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = TAB_MAP[tabParam || ""] || "general";

  const { data: settings, isLoading } = useQuery({ queryKey: ["system_settings"], queryFn: fetchSettings });

  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

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
      toast.success(`${SETTING_META[key]?.label || SOURCE_CHANNELS.find((c) => c.key === key)?.label || key} saved`);
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

  const handleSourceToggle = async (key: string, checked: boolean) => {
    setEditedValues((p) => ({ ...p, [key]: checked }));
    setSaving((p) => ({ ...p, [key]: true }));
    await saveMutation.mutateAsync({ key, value: checked });
    setSaving((p) => ({ ...p, [key]: false }));
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const handleTabChange = (value: string) => {
    if (value === "general") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">Loading settings…</div>
      </div>
    );
  }

  const sections: Record<string, SettingRow[]> = {};
  (settings || []).forEach((s) => {
    if (SOURCE_KEYS.has(s.key)) return;
    const section = SETTING_META[s.key]?.section || "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(s);
  });

  const activeSources = SOURCE_CHANNELS.filter((c) => editedValues[c.key] === true).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-5 h-5 text-vanta-text-muted" />
          <h1 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
        <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">
          System configuration · AI behavior · Connected sources
        </p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start bg-vanta-bg border border-vanta-border mb-8">
          <TabsTrigger value="general" className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated">
            <Settings2 className="w-3.5 h-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="noise" className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated">
            <Filter className="w-3.5 h-3.5" />
            Noise Queue
          </TabsTrigger>
          <TabsTrigger value="modes" className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            User Modes
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <div className="space-y-10">
            {/* Connected Sources */}
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-1 border-b border-vanta-border pb-2">
                Connected Sources
              </h2>
              <p className="font-mono text-[11px] text-vanta-text-muted mb-4 mt-2">
                {activeSources} of {SOURCE_CHANNELS.length} channels active. Disabled sources are excluded from the Signal Feed.
              </p>
              <div className="space-y-1">
                {SOURCE_CHANNELS.map((channel) => {
                  const isActive = editedValues[channel.key] === true;
                  const Icon = channel.icon;
                  return (
                    <div
                      key={channel.key}
                      className={`flex items-center justify-between p-4 border transition-colors ${
                        isActive ? "border-vanta-border bg-vanta-bg-elevated" : "border-vanta-border/50 bg-vanta-bg opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${channel.iconColor}`} />
                        <div>
                          <p className="font-mono text-[12px] font-medium text-foreground">
                            {channel.label}
                          </p>
                          <p className="font-mono text-[10px] text-vanta-text-muted">
                            {channel.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[9px] uppercase tracking-widest ${
                          isActive ? "text-vanta-signal-green" : "text-vanta-text-muted"
                        }`}>
                          {saving[channel.key] ? "Saving…" : isActive ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => handleSourceToggle(channel.key, checked)}
                          disabled={saving[channel.key]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General settings sections */}
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

          <div className="mt-12 pt-6 border-t border-vanta-border">
            <p className="font-mono text-[9px] text-vanta-text-low uppercase tracking-widest">
              Settings are stored in system_settings and take effect immediately on save.
            </p>
          </div>
        </TabsContent>

        {/* Noise Queue Tab */}
        <TabsContent value="noise">
          <NoiseQueue />
        </TabsContent>

        {/* User Modes Tab */}
        <TabsContent value="modes">
          <UserModes />
        </TabsContent>
      </Tabs>
    </div>
  );
}

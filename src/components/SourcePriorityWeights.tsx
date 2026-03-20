import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";
import { Smartphone, Phone, Video, Mail, Calendar } from "lucide-react";

interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

const SOURCE_CHANNELS = [
  { key: "linq", label: "Linq / iMessage", icon: Smartphone, iconColor: "text-vanta-accent opacity-60" },
  { key: "phone", label: "Phone", icon: Phone, iconColor: "text-vanta-accent-phone opacity-60" },
  { key: "recall", label: "Zoom", icon: Video, iconColor: "text-vanta-accent-zoom opacity-60" },
  { key: "gmail", label: "Email", icon: Mail, iconColor: "text-vanta-accent-teal opacity-60" },
  { key: "calendar", label: "Calendar", icon: Calendar, iconColor: "text-vanta-accent-amber opacity-60" },
];

export default function SourcePriorityWeights() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["system_settings"],
    queryFn: async (): Promise<SettingRow[]> => {
      const { data, error } = await supabase.from("system_settings").select("*").order("key");
      if (error) throw error;
      return (data || []) as SettingRow[];
    },
  });

  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (settings) {
      const w: Record<string, number> = {};
      SOURCE_CHANNELS.forEach((ch) => {
        const key = `priority_weight_${ch.key}`;
        const row = settings.find((s) => s.key === key);
        w[ch.key] = typeof row?.value === "number" ? row.value : 1;
      });
      setWeights(w);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          { key, value: value as any, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_settings"] });
      toast.success("Weight updated");
    },
    onError: () => toast.error("Failed to save weight"),
  });

  const setWeight = (channelKey: string, w: number) => {
    setWeights((p) => ({ ...p, [channelKey]: w }));
    mutation.mutate({ key: `priority_weight_${channelKey}`, value: w });
  };

  return (
    <div>
      <Motion>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-1 border-b border-vanta-border pb-2">
          Source Priority Weights
        </h2>
        <p className="font-mono text-[11px] text-vanta-text-muted mb-4 mt-2">
          Higher weight = signals from this source appear higher in your feed. Default is 1.
        </p>
      </Motion>
      <div className="space-y-2">
        {SOURCE_CHANNELS.map((channel, i) => {
          const Icon = channel.icon;
          const currentWeight = weights[channel.key] ?? 1;
          return (
            <Motion key={channel.key} delay={40 + i * 20}>
              <div className="flex items-center justify-between p-3 border border-vanta-border bg-vanta-bg-elevated">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${channel.iconColor}`} />
                  <span className="font-mono text-[12px] text-foreground">{channel.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeight(channel.key, w)}
                      className={`w-7 h-7 font-mono text-[11px] border transition-colors ${
                        currentWeight === w
                          ? "border-vanta-accent text-vanta-accent bg-vanta-accent-faint"
                          : "border-vanta-border text-vanta-text-low hover:border-vanta-accent-border"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </Motion>
          );
        })}
      </div>
    </div>
  );
}

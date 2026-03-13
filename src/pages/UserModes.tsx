import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";
import { Zap, Briefcase, BellOff, Check } from "lucide-react";
import { useUserMode, type UserMode } from "@/hooks/use-user-mode";

interface ModeConfig {
  id: UserMode;
  label: string;
  description: string;
  icon: React.ElementType;
  traits: string[];
}

const MODES: ModeConfig[] = [
  {
    id: "creative",
    label: "Creative",
    description: "Full signal stream. All notifications active. FAB and Smart Note visible. Best for deep work sessions where context matters.",
    icon: Zap,
    traits: [
      "All signal types visible",
      "Notifications at full density",
      "FAB + Smart Note active",
      "No priority threshold filter",
    ],
  },
  {
    id: "executive",
    label: "Executive",
    description: "High-signal only. Surfaces intros, investments, and decisions. Suppresses context and noise. Ideal for busy days.",
    icon: Briefcase,
    traits: [
      "Only HIGH priority signals surfaced",
      "CONTEXT + NOISE suppressed",
      "Reduced notification frequency",
      "FAB visible, Smart Note minimised",
    ],
  },
  {
    id: "dnd",
    label: "Do Not Disturb",
    description: "Silences all notifications. Signals continue to capture in the background. Review when you're ready.",
    icon: BellOff,
    traits: [
      "All notifications silenced",
      "Signals captured silently",
      "FAB hidden",
      "Batch review on resume",
    ],
  },
];

export default function UserModes() {
  const queryClient = useQueryClient();
  const { mode: currentMode } = useUserMode();
  const [selected, setSelected] = useState<UserMode>("creative");

  useEffect(() => {
    if (currentMode) setSelected(currentMode);
  }, [currentMode]);

  const mutation = useMutation({
    mutationFn: async (mode: UserMode) => {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key: "user_mode", value: JSON.stringify(mode) as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-mode"] });
      toast.success(`Mode switched to ${MODES.find((m) => m.id === selected)?.label}`);
    },
    onError: () => toast.error("Failed to update mode"),
  });

  const isChanged = selected !== currentMode;

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-8 md:pt-12 pb-16">
      <Motion>
        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            User Modes
          </h1>
          <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
            Context-aware modes that adjust notification density, signal priority thresholds, and FAB behaviour.
          </p>
        </header>
      </Motion>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((mode, i) => {
          const Icon = mode.icon;
          const isActive = selected === mode.id;
          const isCurrent = currentMode === mode.id;

          return (
            <Motion key={mode.id} delay={60 + i * 40}>
              <button
                onClick={() => setSelected(mode.id)}
                className={`w-full text-left border p-5 transition-all ${
                  isActive
                    ? "border-foreground bg-vanta-bg-elevated"
                    : "border-vanta-border hover:border-vanta-border-mid bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-vanta-text-low"}`} />
                  <span className={`font-mono text-[13px] uppercase tracking-wider font-semibold ${isActive ? "text-foreground" : "text-vanta-text-low"}`}>
                    {mode.label}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-foreground border border-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className={`text-[12px] leading-relaxed mb-4 ${isActive ? "text-vanta-text-mid" : "text-vanta-text-low"}`}>
                  {mode.description}
                </p>
                <ul className="space-y-1.5">
                  {mode.traits.map((trait) => (
                    <li key={trait} className="flex items-start gap-2 font-mono text-[10px] text-vanta-text-low">
                      <Check className={`w-3 h-3 mt-0.5 shrink-0 ${isActive ? "text-foreground" : "text-vanta-text-muted"}`} />
                      {trait}
                    </li>
                  ))}
                </ul>
              </button>
            </Motion>
          );
        })}
      </div>

      {/* Save bar */}
      {isChanged && (
        <Motion delay={0}>
          <div className="mt-6 flex items-center justify-between p-4 border border-foreground bg-vanta-bg-elevated">
            <p className="font-mono text-[11px] text-foreground uppercase tracking-wider">
              Switch to <strong>{MODES.find((m) => m.id === selected)?.label}</strong> mode?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(currentMode || "creative")}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-vanta-text-low border border-vanta-border hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate(selected)}
                disabled={mutation.isPending}
                className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground bg-foreground hover:opacity-90 transition-opacity"
              >
                {mutation.isPending ? "Saving…" : "Activate"}
              </button>
            </div>
          </div>
        </Motion>
      )}
    </div>
  );
}

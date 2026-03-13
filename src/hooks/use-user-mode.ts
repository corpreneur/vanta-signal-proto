import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserMode = "creative" | "executive" | "dnd";

export function useUserMode() {
  const { data: mode = "creative" } = useQuery({
    queryKey: ["user-mode"],
    queryFn: async (): Promise<UserMode> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "user_mode")
        .maybeSingle();
      if (error || !data) return "creative";
      const val = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
      const cleaned = val.replace(/"/g, "");
      if (["creative", "executive", "dnd"].includes(cleaned)) return cleaned as UserMode;
      return "creative";
    },
    staleTime: 30_000,
  });

  return {
    mode,
    isExecutive: mode === "executive",
    isDnd: mode === "dnd",
    isCreative: mode === "creative",
  };
}

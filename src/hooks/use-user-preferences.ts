import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserContext {
  id: string;
  user_id: string;
  name: string;
  context_type: string;
  is_primary: boolean;
  created_at: string;
}

export interface UserPreferences {
  context_setup_complete: boolean;
  active_context_id: string | null;
  delivery_push: boolean;
  delivery_sms: boolean;
  delivery_email: boolean;
  delivery_email_address: string;
  delivery_time: string;
  delivery_timezone: string;
}

const DEFAULT_PREFS: UserPreferences = {
  context_setup_complete: false,
  active_context_id: null,
  delivery_push: false,
  delivery_sms: false,
  delivery_email: false,
  delivery_email_address: "",
  delivery_time: "06:30",
  delivery_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// Helper to query tables not yet in generated types
const db = () => supabase as any;

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data } = await db()
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (data) {
          setPrefs({
            context_setup_complete: data.context_setup_complete,
            active_context_id: data.active_context_id,
            delivery_push: data.delivery_push,
            delivery_sms: data.delivery_sms,
            delivery_email: data.delivery_email,
            delivery_email_address: data.delivery_email_address || "",
            delivery_time: data.delivery_time,
            delivery_timezone: data.delivery_timezone,
          });
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updatePrefs = useCallback(async (patch: Partial<UserPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPrefs = { ...prefs, ...patch };
    setPrefs(newPrefs);

    await db()
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        ...newPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  }, [prefs]);

  return { prefs, loading, updatePrefs };
}

export function useUserContexts() {
  const [contexts, setContexts] = useState<UserContext[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContexts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await db()
      .from("user_contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setContexts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContexts(); }, [fetchContexts]);

  const saveContexts = useCallback(async (
    drafts: { name: string; type: string; isPrimary: boolean }[]
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Delete old contexts
    await db().from("user_contexts").delete().eq("user_id", user.id);

    // Insert new
    const rows = drafts.map(d => ({
      user_id: user.id,
      name: d.name,
      context_type: d.type,
      is_primary: d.isPrimary,
    }));

    const { data } = await db()
      .from("user_contexts")
      .insert(rows)
      .select();

    if (data) {
      setContexts(data);
      const primaryCtx = data.find((c: any) => c.is_primary);

      // Upsert preferences
      await db()
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          context_setup_complete: true,
          active_context_id: primaryCtx?.id || data[0]?.id || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      return primaryCtx?.id || data[0]?.id || null;
    }
    return null;
  }, []);

  return { contexts, loading, saveContexts, refetch: fetchContexts };
}

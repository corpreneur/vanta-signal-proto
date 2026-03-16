import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target_name } = await req.json();
    if (!target_name) {
      return new Response(JSON.stringify({ error: "target_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find signals mentioning the target
    const { data: directSignals } = await supabase
      .from("signals")
      .select("sender, summary, signal_type, captured_at")
      .or(`sender.eq.${target_name},summary.ilike.%${target_name}%`)
      .order("captured_at", { ascending: false })
      .limit(20);

    // Find potential intermediaries — contacts who appear in signals that mention the target
    const intermediaries = new Set<string>();
    for (const s of (directSignals || [])) {
      if (s.sender !== target_name) intermediaries.add(s.sender);
    }

    // Also search for shared meeting attendees
    const { data: meetings } = await supabase
      .from("upcoming_meetings")
      .select("attendees, title")
      .limit(50);

    const sharedMeetingContacts: string[] = [];
    for (const m of (meetings || [])) {
      const attendees = m.attendees as Array<{ name?: string; email?: string }>;
      const hasTarget = attendees?.some((a) => a.name?.toLowerCase().includes(target_name.toLowerCase()));
      if (hasTarget) {
        for (const a of (attendees || [])) {
          if (a.name && !a.name.toLowerCase().includes(target_name.toLowerCase())) {
            sharedMeetingContacts.push(a.name);
            intermediaries.add(a.name);
          }
        }
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const context = (directSignals || []).map((s) => `${s.signal_type}: ${s.summary} (via ${s.sender})`).join("\n");

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a networking assistant. Draft a warm introduction request email. Be professional, concise (under 150 words), and reference shared context. Include a clear ask.`,
          },
          {
            role: "user",
            content: `I want to connect with: ${target_name}\n\nPotential intermediaries: ${[...intermediaries].join(", ") || "None found"}\nShared meetings: ${sharedMeetingContacts.join(", ") || "None"}\n\nContext:\n${context || "No direct signal history"}\n\nDraft an intro request email I can send to the best intermediary.`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI call failed: ${res.status}`);
    const data = await res.json();
    const draftEmail = data.choices?.[0]?.message?.content || "Unable to generate draft.";

    return new Response(JSON.stringify({
      target: target_name,
      intermediaries: [...intermediaries],
      shared_meetings: sharedMeetingContacts,
      draft_email: draftEmail,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intro-helper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
  riskLevel: string | null;
  dueDate: string | null;
  callPointer: string | null;
  suggestedTitle: string;
  suggestedTags: string[];
  suggestedContacts: string[];
  accelerators: string[];
  confidence: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a signal classification engine for a relationship-intelligence platform used by a senior executive.

Analyze the provided image (whiteboard photo, screenshot, business card, receipt, document, etc.) and classify it into exactly ONE signal type:
- INTRO: new person or warm introduction
- INSIGHT: market intelligence, trend, or strategic observation
- INVESTMENT: deal flow, capital allocation, or financial opportunity
- DECISION: commitment, decision point, or action item requiring follow-up
- CONTEXT: background information, relationship context, or reference material
- NOISE: irrelevant, spam, or low-value content

Also assign:
- priority: high, medium, or low
- riskLevel: low, medium, high, or critical (null if not applicable)
- dueDate: ISO date string (YYYY-MM-DD) if a deadline or due date is mentioned, otherwise null
- callPointer: a brief reference to who/what to follow up with, otherwise null
- summary: concise 1-sentence summary of what the image contains
- actionsTaken: 0-3 recommended next actions as short phrases
- suggestedTitle: a concise, descriptive title (3-8 words)
- suggestedTags: 2-5 topic/keyword tags
- suggestedContacts: names of people mentioned or visible. Empty array if none.
- accelerators: 2-5 specific actionable next steps parsed from the image content
- confidence: classification confidence (0.0 to 1.0)
- reasoning: 1-2 sentences explaining why you chose this classification`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "classify_signal",
    description: "Classify image content into a signal with smart metadata.",
    parameters: {
      type: "object",
      properties: {
        signalType: { type: "string", enum: ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"] },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        summary: { type: "string" },
        actionsTaken: { type: "array", items: { type: "string" } },
        riskLevel: { type: ["string", "null"], enum: ["low", "medium", "high", "critical", null] },
        dueDate: { type: ["string", "null"] },
        callPointer: { type: ["string", "null"] },
        suggestedTitle: { type: "string" },
        suggestedTags: { type: "array", items: { type: "string" } },
        suggestedContacts: { type: "array", items: { type: "string" } },
        accelerators: { type: "array", items: { type: "string" } },
        confidence: { type: "number" },
        reasoning: { type: "string" },
      },
      required: ["signalType", "priority", "summary", "actionsTaken", "riskLevel", "dueDate", "callPointer", "suggestedTitle", "suggestedTags", "suggestedContacts", "accelerators", "confidence", "reasoning"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both JSON (base64 data URL) and multipart form data
    let base64Image: string;
    let mimeType: string;
    let contextText: string | null = null;
    let imageName = "uploaded-image";
    let imageBytes: ArrayBuffer | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // JSON body with base64 data URL from the Processor tab
      const body = await req.json();
      const imageData: string | undefined = body.imageData || body.image;
      contextText = body.context || body.text || null;

      if (!imageData) {
        return new Response(JSON.stringify({ error: "Image data is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse data URL: data:image/png;base64,iVBOR...
      const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return new Response(JSON.stringify({ error: "Invalid image data. Expected a base64 data URL." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      mimeType = match[1];
      base64Image = match[2];
    } else {
      // Multipart form data (legacy path)
      const formData = await req.formData();
      const imageFile = formData.get("image") as File | null;
      contextText = formData.get("context") as string | null;

      if (!imageFile) {
        return new Response(JSON.stringify({ error: "Image file is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(imageFile.type)) {
        return new Response(JSON.stringify({ error: "Unsupported image format. Use JPEG, PNG, GIF, or WebP." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Max 10MB
      if (imageFile.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Image must be under 10MB" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      imageName = imageFile.name;
      imageBytes = await imageFile.arrayBuffer();
      base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));
      mimeType = imageFile.type;
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Build messages with image content
    const userContent: unknown[] = [];
    if (contextText?.trim()) {
      userContent.push({ type: "text", text: `Additional context from user: ${contextText.trim()}` });
    }
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64Image}` },
    });

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "classify_signal" } },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI vision error:", res.status, errText);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI vision failed: ${res.status}`);
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const classification = JSON.parse(toolCall.function.arguments) as Classification;

    // Upload image to storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert signal
    const sourceMessage = contextText?.trim()
      ? `[Image: ${imageName}] ${contextText.trim()}`
      : `[Image: ${imageName}]`;

    const { data: signal, error: insertError } = await supabase
      .from("signals")
      .insert({
        sender: "Brain Dump",
        source: "manual",
        source_message: sourceMessage.substring(0, 10_000),
        signal_type: classification.signalType,
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: classification.actionsTaken,
        status: "Captured",
        risk_level: classification.riskLevel || null,
        due_date: (classification.dueDate && classification.dueDate !== "null") ? classification.dueDate : null,
        call_pointer: (classification.callPointer && classification.callPointer !== "null") ? classification.callPointer : null,
        confidence_score: typeof classification.confidence === "number" ? classification.confidence : null,
        classification_reasoning: classification.reasoning || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save signal");
    }

    // Upload image to signal-attachments bucket (only if we have raw bytes)
    if (imageBytes) {
      const storagePath = `signal-${signal.id}/${Date.now()}-${imageName}`;
      const { error: uploadError } = await supabase.storage
        .from("signal-attachments")
        .upload(storagePath, imageBytes, { contentType: mimeType });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        // Non-fatal — signal was saved
      }
    }

    return new Response(JSON.stringify({ signal, classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brain-dump-image error:", e);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("brain-dump-image", e);
    const status = e instanceof Error && e.message.includes("429") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.1/cors";

async function getZoomAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ZOOM_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");

  if (!clientId || !clientSecret || !accountId) {
    throw new Error("Zoom OAuth credentials not configured");
  }

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom token request failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { meeting_id } = await req.json();
    if (!meeting_id) {
      return new Response(
        JSON.stringify({ error: "meeting_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the meeting to get zoom_meeting_id
    const { data: meeting, error: meetingErr } = await supabase
      .from("upcoming_meetings")
      .select("id, zoom_meeting_id, rtms_status")
      .eq("id", meeting_id)
      .single();

    if (meetingErr || !meeting) {
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!meeting.zoom_meeting_id) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "No zoom_meeting_id on this meeting" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (meeting.rtms_status === "streaming") {
      return new Response(
        JSON.stringify({ status: "already_streaming" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Zoom access token and start RTMS
    const accessToken = await getZoomAccessToken();

    const rtmsRes = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting.zoom_meeting_id}/rtms/start`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream_url: `${supabaseUrl}/functions/v1/rtms-webhook`,
        }),
      }
    );

    const rtmsBody = await rtmsRes.json();

    if (!rtmsRes.ok) {
      console.error("RTMS start failed:", rtmsBody);
      // Non-fatal: meeting still opens in Zoom, Recall.ai fallback works
      return new Response(
        JSON.stringify({ status: "rtms_unavailable", detail: rtmsBody }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update meeting with RTMS stream info
    await supabase
      .from("upcoming_meetings")
      .update({
        rtms_stream_id: rtmsBody.stream_id || null,
        rtms_status: "streaming",
      })
      .eq("id", meeting_id);

    return new Response(
      JSON.stringify({ status: "streaming", stream_id: rtmsBody.stream_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("start-rtms-stream error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

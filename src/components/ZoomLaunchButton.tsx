import { useState } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ZoomLaunchButtonProps {
  meetingId?: string | null;
  meetingUrl?: string | null;
  zoomMeetingId?: string | null;
  contactName?: string;
  variant?: "icon" | "button" | "compact";
  className?: string;
}

function buildZoomUrl(zoomMeetingId?: string | null, meetingUrl?: string | null): string {
  if (meetingUrl) return meetingUrl;
  if (zoomMeetingId) return `https://zoom.us/j/${zoomMeetingId}`;
  return "https://zoom.us/start/videomeeting";
}

export default function ZoomLaunchButton({
  meetingId,
  meetingUrl,
  zoomMeetingId,
  contactName,
  variant = "button",
  className = "",
}: ZoomLaunchButtonProps) {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    const url = buildZoomUrl(zoomMeetingId, meetingUrl);
    window.open(url, "_blank", "noopener,noreferrer");

    toast.success(
      contactName
        ? `Launching Zoom with ${contactName}`
        : "Launching Zoom meeting"
    );

    // Optionally trigger RTMS stream
    if (meetingId) {
      try {
        await supabase.functions.invoke("start-rtms-stream", {
          body: { meeting_id: meetingId },
        });
      } catch {
        // RTMS is best-effort; Recall.ai fallback handles it
      }
    }

    setLaunching(false);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleLaunch}
        disabled={launching}
        className={`text-vanta-accent-zoom hover:text-vanta-accent-zoom/80 transition-colors p-1 disabled:opacity-50 ${className}`}
        aria-label="Launch Zoom meeting"
      >
        <Video className="w-3.5 h-3.5" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleLaunch}
        disabled={launching}
        className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] border border-vanta-accent-zoom-border text-vanta-accent-zoom hover:bg-vanta-accent-zoom-faint transition-colors disabled:opacity-50 ${className}`}
        aria-label="Launch Zoom meeting"
      >
        <Video className="w-3 h-3" />
        Zoom
      </button>
    );
  }

  return (
    <button
      onClick={handleLaunch}
      disabled={launching}
      className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-vanta-accent-zoom-border text-vanta-accent-zoom hover:bg-vanta-accent-zoom-faint transition-colors disabled:opacity-50 ${className}`}
      aria-label="Launch Zoom meeting"
    >
      <Video className="w-3 h-3" />
      {zoomMeetingId || meetingUrl ? "Join Zoom" : "Start Zoom"}
    </button>
  );
}

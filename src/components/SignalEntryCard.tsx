import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown, Copy, Check, CheckCircle, Video, Phone,
  ArrowUpFromLine, Shield, CalendarClock, Pointer, Users,
  Bell, Calendar, Mail, FileOutput, Flag, Trash2, Pin, Clock,
  Image, Film, FileText, Mic, Paperclip, ExternalLink,
} from "lucide-react";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS, PHONE_CALL_TAGS, PHONE_TAG_LABELS } from "@/data/signals";
import { PARTNER_LOGOS } from "@/components/PartnerLogos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ContactContext } from "@/lib/contactStrength";
import { recencyLabel } from "@/lib/contactStrength";

/* ── Helpers ─────────────────────────────────────────────── */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDueDate(dateStr: string): { label: string; isOverdue: boolean } {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
  if (diffDays === 0) return { label: "Due today", isOverdue: true };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, isOverdue: false };
  return { label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), isOverdue: false };
}

/** Get the primary CTA label + action for a signal type */
function getPrimaryCTA(signal: Signal): { label: string; icon: React.ElementType; action: () => void } | null {
  if (signal.status === "Complete") return null;
  if (signal.signalType === "PHONE_CALL" || signal.source === "phone") {
    return { label: "Call Now", icon: Phone, action: () => window.open(`tel:`, "_blank") };
  }
  if (signal.signalType === "INTRO") {
    const subject = encodeURIComponent(`Re: Introduction, ${signal.sender}`);
    const body = encodeURIComponent(`Hi,\n\nFollowing up on the introduction from ${signal.sender}.\n\n${signal.summary}\n\nBest regards`);
    return { label: "Draft Reply", icon: Mail, action: () => window.open(`mailto:?subject=${subject}&body=${body}`, "_blank") };
  }
  if (signal.signalType === "MEETING") {
    return {
      label: "Follow Up", icon: Calendar, action: () => {
        const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); nextWeek.setHours(10, 0, 0, 0);
        const end = new Date(nextWeek); end.setMinutes(30);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow-up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(nextWeek)}/${fmt(end)}`, "_blank");
      }
    };
  }
  if (signal.signalType === "DECISION") {
    return {
      label: "Create Task", icon: FileOutput, action: () => {
        navigator.clipboard.writeText(`TASK: ${signal.summary}\nFrom: ${signal.sender}\nPriority: ${signal.priority}\nContext: ${signal.sourceMessage}`);
        toast.success("Decision exported as task to clipboard");
      }
    };
  }
  if (signal.signalType === "INVESTMENT") {
    return { label: "Flag Review", icon: Flag, action: () => {} };
  }
  return null;
}

/* ── URL detection for "Open in…" deep-links ── */

interface DetectedLink {
  label: string;
  url: string;
  color: string;
}

const LINK_PATTERNS: { pattern: RegExp; label: string; color: string }[] = [
  { pattern: /https?:\/\/([a-z0-9-]+\.)?salesforce\.com\/[^\s)">]+/gi, label: "Salesforce", color: "text-[hsl(210,80%,55%)]" },
  { pattern: /https?:\/\/app\.hubspot\.com\/[^\s)">]+/gi, label: "HubSpot", color: "text-[hsl(14,90%,55%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?pipedrive\.com\/[^\s)">]+/gi, label: "Pipedrive", color: "text-[hsl(145,60%,40%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?notion\.so\/[^\s)">]+/gi, label: "Notion", color: "text-foreground" },
  { pattern: /https?:\/\/docs\.google\.com\/[^\s)">]+/gi, label: "Google Docs", color: "text-[hsl(217,89%,55%)]" },
  { pattern: /https?:\/\/drive\.google\.com\/[^\s)">]+/gi, label: "Google Drive", color: "text-[hsl(217,89%,55%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/in\/[^\s)">]+/gi, label: "LinkedIn", color: "text-[hsl(210,80%,45%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/company\/[^\s)">]+/gi, label: "LinkedIn Co.", color: "text-[hsl(210,80%,45%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?slack\.com\/[^\s)">]+/gi, label: "Slack", color: "text-[hsl(330,60%,50%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?asana\.com\/[^\s)">]+/gi, label: "Asana", color: "text-[hsl(350,70%,55%)]" },
  { pattern: /https?:\/\/linear\.app\/[^\s)">]+/gi, label: "Linear", color: "text-[hsl(250,60%,60%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?atlassian\.net\/[^\s)">]+/gi, label: "Jira", color: "text-[hsl(210,80%,55%)]" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?figma\.com\/[^\s)">]+/gi, label: "Figma", color: "text-[hsl(340,70%,55%)]" },
  { pattern: /https?:\/\/github\.com\/[^\s)">]+/gi, label: "GitHub", color: "text-foreground" },
  { pattern: /https?:\/\/([a-z0-9-]+\.)?zoom\.us\/[^\s)">]+/gi, label: "Zoom", color: "text-vanta-accent-zoom" },
];

/** Fallback: catch any remaining URLs not matched by named patterns */
const GENERIC_URL_RE = /https?:\/\/[^\s)">\]]+/gi;

function extractDeepLinks(signal: Signal): DetectedLink[] {
  const texts: string[] = [signal.sourceMessage || ""];
  if (signal.rawPayload && typeof signal.rawPayload === "object") {
    texts.push(JSON.stringify(signal.rawPayload));
  }
  const haystack = texts.join(" ");

  const seen = new Set<string>();
  const links: DetectedLink[] = [];

  // Named patterns first
  for (const { pattern, label, color } of LINK_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(haystack)) !== null) {
      const url = m[0].replace(/[.,;:!?)]+$/, ""); // trim trailing punctuation
      if (!seen.has(url)) {
        seen.add(url);
        links.push({ label: `Open in ${label}`, url, color });
      }
    }
  }

  // Generic URLs (only those not already captured)
  GENERIC_URL_RE.lastIndex = 0;
  let gm: RegExpExecArray | null;
  while ((gm = GENERIC_URL_RE.exec(haystack)) !== null) {
    const url = gm[0].replace(/[.,;:!?)]+$/, "");
    if (!seen.has(url) && !url.includes("supabase.co") && !url.includes("lovable.")) {
      seen.add(url);
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        links.push({ label: `Open ${host}`, url, color: "text-muted-foreground" });
      } catch {
        // skip invalid URLs
      }
    }
  }

  return links;
}

/* ── Signal Weight badge styles (filled, high-contrast per Chunk DS) ── */

const WEIGHT_BADGE: Record<string, string> = {
  critical: "bg-vanta-signal-red text-white",
  high: "bg-vanta-signal-red text-white",
  medium: "bg-vanta-signal-yellow text-vanta-grey-900",
  low: "bg-vanta-grey-600 text-white",
};

/* ── Source indicator ── */

function SourceIndicator({ signal }: { signal: Signal }) {
  const logoKey = signal.source === "recall" ? "zoom" : signal.source === "fireflies" ? "fireflies" : signal.source === "otter" ? "otter" : null;
  const Logo = logoKey ? PARTNER_LOGOS[logoKey] : null;
  if (Logo) {
    const label = logoKey === "zoom" ? "Zoom" : logoKey === "fireflies" ? "Fireflies" : "Otter";
    return (
      <span className="inline-flex items-center gap-1.5">
        <Logo className="w-4 h-4" /> <span className="text-muted-foreground">{label}</span>
      </span>
    );
  }
  if (signal.source === "phone" || signal.signalType === "PHONE_CALL") {
    return (
      <span className="inline-flex items-center gap-1 text-vanta-accent-phone">
        <Phone className="w-3 h-3" /> Phone
      </span>
    );
  }
  if (signal.source === "gmail") {
    return (
      <span className="inline-flex items-center gap-1 text-vanta-text-low">
        <Mail className="w-3 h-3" /> Gmail
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">{signal.source}</span>
  );
}

/* ── Main component ──────────────────────────────────────── */

interface SignalEntryCardProps {
  signal: Signal;
  onClick?: () => void;
  showPromote?: boolean;
  contactContext?: ContactContext;
}

const SignalEntryCard = ({ signal, onClick, showPromote, contactContext }: SignalEntryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [snoozing, setSnoozing] = useState(false);
  const queryClient = useQueryClient();
  const colors = SIGNAL_TYPE_COLORS[signal.signalType];
  const cta = getPrimaryCTA(signal);
  const deepLinks = useMemo(() => extractDeepLinks(signal), [signal]);

  /* ── Actions ── */

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(signal.summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingReviewed(true);
    const { error } = await supabase.from("signals").update({ status: "Complete" as const }).eq("id", signal.id);
    setMarkingReviewed(false);
    if (error) { toast.error("Failed to complete"); } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["action-items-enhanced"] });
      toast.success("Marked complete");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("signals").delete().eq("id", signal.id);
    if (error) { toast.error("Failed to delete"); } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["action-items-enhanced"] });
      toast.success("Signal deleted");
    }
  };

  const handleSnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSnoozing(true);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const { error } = await supabase.from("signals").update({ due_date: tomorrow.toISOString().split("T")[0] }).eq("id", signal.id);
    setSnoozing(false);
    if (error) { toast.error("Failed to snooze"); } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Snoozed until tomorrow");
    }
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinning(true);
    const newPinned = !signal.pinned;
    const { error } = await supabase.from("signals").update({ pinned: newPinned }).eq("id", signal.id);
    setPinning(false);
    if (error) { toast.error("Failed to pin"); } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success(newPinned ? "Signal pinned" : "Signal unpinned");
    }
  };

  const handlePromote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoting(true);
    const { error } = await supabase.from("signals").update({ signal_type: "CONTEXT" as const }).eq("id", signal.id);
    setPromoting(false);
    if (error) { toast.error("Failed to promote signal"); } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Signal promoted to Context");
    }
  };

  const handleSetReminder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    setSettingReminder(true);
    try {
      const { error } = await supabase.functions.invoke("create-reminder", { body: { signal_id: signal.id, due_date: tomorrow.toISOString().split("T")[0] } });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Reminder set for tomorrow");
    } catch { toast.error("Failed to set reminder"); }
    setSettingReminder(false);
  };

  /* ── Attachment badges ── */
  const attachmentBadges = (() => {
    if (!signal.rawPayload || typeof signal.rawPayload !== "object") return null;
    const rp = signal.rawPayload as Record<string, unknown>;
    const attachments = rp._vanta_attachments as Array<{ type: string; url?: string; mime?: string }> | undefined;
    if (!attachments?.length) return null;
    const getIcon = (type: string, mime?: string) => {
      if (mime?.startsWith("image") || type === "image") return <Image className="w-3 h-3" />;
      if (mime?.startsWith("video") || type === "video") return <Film className="w-3 h-3" />;
      if (mime?.startsWith("audio") || type === "audio") return <Mic className="w-3 h-3" />;
      if (type === "file" || type === "document") return <FileText className="w-3 h-3" />;
      return <Paperclip className="w-3 h-3" />;
    };
    const groups: Record<string, number> = {};
    attachments.forEach((a) => {
      const label = mime2label(a.type, a.mime);
      groups[label] = (groups[label] || 0) + 1;
    });
    return Object.entries(groups).map(([label, count]) => (
      <span key={label} className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-vanta-text-muted">
        {getIcon(label.toLowerCase())} {label}{count > 1 ? ` ×${count}` : ""}
      </span>
    ));
  })();

  const isGroupChat = signal.rawPayload && typeof signal.rawPayload === "object" && (signal.rawPayload as Record<string, unknown>)._vanta_group_chat === true;

  return (
    <div className={`rounded-lg border transition-all hover:shadow-md min-w-0 overflow-hidden ${
      signal.pinned ? "border-primary/40 bg-primary/[0.03]" : "border-border bg-card"
    } ${signal.status === "Complete" ? "opacity-50" : ""}`}>

      {/* ── Main clickable area ── */}
      <div className="p-4 cursor-pointer" onClick={onClick}>

        {/* Line 1: Type chip · Source · Priority badge · Timestamp */}
        <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className={`px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border} border`}>
            {signal.signalType.replace("_", " ")}
          </span>
          <SourceIndicator signal={signal} />
          {isGroupChat && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" /> Group
            </span>
          )}

          {signal.riskLevel && (
            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${WEIGHT_BADGE[signal.riskLevel] || WEIGHT_BADGE.low}`}>
              {signal.riskLevel} weight
            </span>
          )}
          {signal.priority === "high" && !signal.riskLevel && (
            <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-destructive text-destructive-foreground">High</span>
          )}
          {signal.priority === "medium" && !signal.riskLevel && (
            <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-vanta-signal-yellow text-foreground">Medium</span>
          )}

          {signal.pinned && <Pin className="w-3 h-3 text-primary" />}
          {signal.status === "Complete" && <CheckCircle className="w-3 h-3 text-vanta-signal-green" />}

          <span className="ml-auto text-muted-foreground whitespace-nowrap">{formatTimestamp(signal.capturedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[15px] md:text-[16px] font-bold leading-snug text-foreground mb-1">
          {signal.summary}
        </h3>

        {/* Sender + context line */}
        <div className="flex items-center gap-2 flex-wrap text-[13px] text-muted-foreground mb-2">
          <Link
            to={`/contact/${encodeURIComponent(signal.sender)}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-primary transition-colors"
          >
            {signal.sender}
          </Link>

          {typeof signal.confidenceScore === "number" && (
            <span className={`font-mono text-[10px] ${
              signal.confidenceScore >= 0.85 ? "text-vanta-signal-green" :
              signal.confidenceScore >= 0.6 ? "text-vanta-signal-yellow" : "text-destructive"
            }`}>
              {Math.round(signal.confidenceScore * 100)}%
            </span>
          )}

          {signal.dueDate && (() => {
            const { label, isOverdue } = formatDueDate(signal.dueDate);
            return (
              <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${isOverdue ? "text-destructive" : ""}`}>
                <CalendarClock className="w-3 h-3" /> {label}
              </span>
            );
          })()}
        </div>

        {/* Source message (1 line) */}
        <p className="font-sans text-[13px] leading-relaxed text-muted-foreground line-clamp-1 mb-2">
          {signal.sourceMessage}
        </p>

        {/* Relationship context chip */}
        {contactContext && contactContext.signalCount > 1 && (
          <Link
            to={`/contact/${encodeURIComponent(signal.sender)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider border border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              contactContext.strengthLabel === "Strong" ? "bg-vanta-signal-green" :
              contactContext.strengthLabel === "Warm" ? "bg-vanta-signal-yellow" :
              contactContext.strengthLabel === "Cooling" ? "bg-vanta-signal-blue" : "bg-muted-foreground"
            }`} />
            {contactContext.strengthLabel} · {contactContext.signalCount} signals · {recencyLabel(contactContext.daysSinceLast)}
          </Link>
        )}

        {/* Phone tags */}
        {signal.signalType === "PHONE_CALL" && signal.actionsTaken.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {signal.actionsTaken
              .filter((a) => (PHONE_CALL_TAGS as readonly string[]).includes(a))
              .map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider border border-vanta-accent-phone-border text-vanta-accent-phone bg-vanta-accent-phone-faint">
                  {PHONE_TAG_LABELS[tag as keyof typeof PHONE_TAG_LABELS] || tag}
                </span>
              ))}
          </div>
        )}

        {/* Attachment badges */}
        {attachmentBadges && (
          <div className="flex items-center gap-2 mb-2">{attachmentBadges}</div>
        )}

        {/* ── Action bar ── */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 overflow-x-auto scrollbar-hide">
          {cta && (
            <button
              onClick={(e) => { e.stopPropagation(); cta.action(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <cta.icon className="w-3 h-3" />
              {cta.label}
            </button>
          )}

          {signal.status !== "Complete" && (
            <button onClick={handleMarkDone} disabled={markingReviewed}
              className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider text-vanta-signal-green border border-vanta-signal-green/30 hover:bg-vanta-signal-green/10 transition-colors disabled:opacity-50">
              <CheckCircle className="w-3 h-3" /> Done
            </button>
          )}

          {signal.status !== "Complete" && (
            <button onClick={handleSnooze} disabled={snoozing}
              className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 transition-colors disabled:opacity-50">
              <Clock className="w-3 h-3" /> Snooze
            </button>
          )}

          <button onClick={handlePin} disabled={pinning}
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider border transition-colors disabled:opacity-50 ${
              signal.pinned ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border hover:border-primary/30"
            }`}>
            <Pin className="w-3 h-3" /> {signal.pinned ? "Pinned" : "Pin"}
          </button>

          <button onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>

          {showPromote && (
            <button onClick={handlePromote} disabled={promoting}
              className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50">
              <ArrowUpFromLine className="w-3 h-3" /> {promoting ? "…" : "Promote"}
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 transition-colors ml-auto"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            More
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-border px-4 md:px-5 py-4 space-y-4 animate-fade-up">
          {/* Quick actions */}
          {signal.status !== "Complete" && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={handleSetReminder} disabled={settingReminder}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors disabled:opacity-50">
                <Bell className="w-3 h-3" /> {settingReminder ? "Setting…" : "Remind"}
              </button>
              <button onClick={(e) => {
                e.stopPropagation();
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
                const end = new Date(tomorrow); end.setMinutes(30);
                const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(tomorrow)}/${fmt(end)}`, "_blank");
              }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                <Calendar className="w-3 h-3" /> Cal Hold
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-wider text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}

          {/* Deep-link "Open in…" buttons */}
          {deepLinks.length > 0 && (
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Open In…</h4>
              <div className="flex flex-wrap gap-1.5">
                {deepLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-wider border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors ${link.color}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Raw message */}
          <div>
            <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Raw Message</h4>
            <div className="border-l-2 border-border pl-3">
              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">{signal.sourceMessage}</p>
            </div>
          </div>

          {/* Actions taken */}
          {signal.actionsTaken.length > 0 && (
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Actions Executed</h4>
              <div className="flex flex-wrap gap-1.5">
                {signal.actionsTaken.map((a) => (
                  <span key={a} className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">{formatAction(a)}</span>
                ))}
              </div>
            </div>
          )}

          {/* Call pointer */}
          {signal.callPointer && (
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Call Pointer</h4>
              <div className="flex items-center gap-1.5">
                <Pointer className="w-3 h-3 text-muted-foreground" />
                <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{signal.callPointer}</p>
              </div>
            </div>
          )}

          {/* Source context */}
          <div className="flex items-center gap-4">
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Source</h4>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{signal.source}</p>
            </div>
            {signal.linqMessageId && (
              <div>
                <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Message ID</h4>
                <p className="font-mono text-[10px] text-muted-foreground break-all">{signal.linqMessageId}</p>
              </div>
            )}
          </div>

          {/* View detail */}
          <button onClick={onClick}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md font-mono text-[10px] uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors">
            View Full Detail
          </button>
        </div>
      )}
    </div>
  );
};

function mime2label(type: string, mime?: string): string {
  if (mime?.startsWith("image") || type === "image") return "Image";
  if (mime?.startsWith("video") || type === "video") return "Video";
  if (mime?.startsWith("audio") || type === "audio") return "Audio";
  if (type === "file" || type === "document") return "File";
  return type;
}

export default SignalEntryCard;

import { MessageSquare, Phone, Video, Mail, Calendar, Activity, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ChannelConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
  settingKey: string;
  signalSource?: string;
  signalType?: string;
  href: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    key: "imessage",
    label: "iMessage",
    icon: MessageSquare,
    colorClass: "text-lime-400",
    bgClass: "bg-lime-400/10",
    borderClass: "border-lime-400/20",
    ringClass: "ring-lime-400/30",
    settingKey: "source_linq_enabled",
    signalSource: "linq",
    href: "/product/intro",
  },
  {
    key: "phone",
    label: "Phone",
    icon: Phone,
    colorClass: "text-[hsl(var(--vanta-accent-phone))]",
    bgClass: "bg-[hsl(var(--vanta-accent-phone-faint))]",
    borderClass: "border-[hsl(var(--vanta-accent-phone-border))]",
    ringClass: "ring-[hsl(var(--vanta-accent-phone)/0.3)]",
    settingKey: "source_phone_enabled",
    signalSource: "phone",
    href: "/product/phone-call",
  },
  {
    key: "zoom",
    label: "Zoom",
    icon: Video,
    colorClass: "text-[hsl(var(--vanta-accent-zoom))]",
    bgClass: "bg-[hsl(var(--vanta-accent-zoom-faint))]",
    borderClass: "border-[hsl(var(--vanta-accent-zoom-border))]",
    ringClass: "ring-[hsl(var(--vanta-accent-zoom)/0.3)]",
    settingKey: "source_zoom_enabled",
    signalSource: "recall",
    href: "/product/meeting",
  },
  {
    key: "email",
    label: "Email",
    icon: Mail,
    colorClass: "text-[hsl(var(--vanta-accent-teal))]",
    bgClass: "bg-[hsl(var(--vanta-accent-teal-faint))]",
    borderClass: "border-[hsl(var(--vanta-accent-teal-border))]",
    ringClass: "ring-[hsl(var(--vanta-accent-teal)/0.3)]",
    settingKey: "source_email_enabled",
    signalSource: "gmail",
    href: "/product/email",
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: Calendar,
    colorClass: "text-[hsl(var(--vanta-accent-amber))]",
    bgClass: "bg-[hsl(var(--vanta-accent-amber-faint))]",
    borderClass: "border-[hsl(var(--vanta-accent-amber-border))]",
    ringClass: "ring-[hsl(var(--vanta-accent-amber)/0.3)]",
    settingKey: "source_calendar_enabled",
    signalType: "MEETING",
    href: "/product/calendar",
  },
];

async function fetchSettings() {
  const { data } = await supabase.from("system_settings").select("key, value");
  const map: Record<string, boolean> = {};
  data?.forEach((r) => {
    map[r.key] = r.value === true || r.value === "true";
  });
  return map;
}

async function fetchSignalCounts() {
  const { data } = await supabase.from("signals").select("source, signal_type");
  const bySource: Record<string, number> = {};
  const byType: Record<string, number> = {};
  data?.forEach((s) => {
    bySource[s.source] = (bySource[s.source] || 0) + 1;
    byType[s.signal_type] = (byType[s.signal_type] || 0) + 1;
  });
  return { bySource, byType };
}

export default function Connectivity() {
  const { data: settings = {} } = useQuery({ queryKey: ["settings-conn"], queryFn: fetchSettings });
  const { data: counts } = useQuery({ queryKey: ["signal-counts"], queryFn: fetchSignalCounts });

  const totalSignals = counts ? Object.values(counts.bySource).reduce((a, b) => a + b, 0) : 0;
  const activeChannels = CHANNELS.filter((ch) => settings[ch.settingKey] !== false).length;

  return (
    <div className="max-w-[960px] mx-auto px-5 py-12 md:px-10 md:py-20">
      {/* Header */}
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent mb-1">
        Fab Five · Connectivity
      </p>
      <h1 className="font-display text-[clamp(28px,5vw,44px)] text-foreground mb-2 leading-tight">
        Connectivity Hub
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-vanta-text-low mb-10">
        Aggregate status across all channels
      </p>

      {/* Summary strip */}
      <div className="flex items-center gap-6 mb-10 p-4 border border-vanta-border bg-card">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-vanta-accent" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-vanta-text-low">Active Channels</p>
            <p className="font-display text-[28px] text-foreground leading-none">{activeChannels}<span className="text-vanta-text-low text-[16px]">/{CHANNELS.length}</span></p>
          </div>
        </div>
        <div className="w-px h-10 bg-vanta-border" />
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-vanta-text-low">Total Signals</p>
          <p className="font-display text-[28px] text-foreground leading-none">{totalSignals}</p>
        </div>
      </div>

      {/* Channel cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((ch) => {
          const enabled = settings[ch.settingKey] !== false;
          const count = ch.signalSource
            ? (counts?.bySource[ch.signalSource] || 0)
            : (counts?.byType[ch.signalType!] || 0);

          return (
            <Link
              key={ch.key}
              to={ch.href}
              className={`group relative p-5 border bg-card hover:bg-vanta-bg-elevated transition-all duration-200 ${ch.borderClass}`}
            >
              {/* Status dot */}
              <div className="absolute top-4 right-4">
                {enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--vanta-signal-green))]" />
                ) : (
                  <XCircle className="h-4 w-4 text-vanta-text-muted" />
                )}
              </div>

              {/* Icon */}
              <div className={`inline-flex items-center justify-center h-10 w-10 mb-4 ${ch.bgClass} border ${ch.borderClass} ring-1 ${ch.ringClass}`}>
                <ch.icon className={`h-5 w-5 ${ch.colorClass}`} />
              </div>

              {/* Label */}
              <p className="font-mono text-[12px] uppercase tracking-wider text-foreground mb-1">{ch.label}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-low mb-3">
                {enabled ? "Connected" : "Disconnected"}
              </p>

              {/* Signal count */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-vanta-text-low">Signals</p>
                  <p className={`font-display text-[24px] leading-none ${ch.colorClass}`}>{count}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-vanta-text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

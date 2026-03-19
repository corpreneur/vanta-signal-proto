import { MessageSquare, Phone, Video, Mail, Calendar, Activity, CheckCircle2, XCircle, ArrowRight, Radio, Smartphone, Signal, Layers, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Motion } from "@/components/ui/motion";

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

const MVNO_LAYERS = [
  {
    icon: Smartphone,
    label: "eSIM Provisioning",
    description: "Dedicated mobile number with carrier-grade voice & data",
    status: "Active",
  },
  {
    icon: Radio,
    label: "Network-Level Capture",
    description: "Call metadata, SMS routing & voicemail transcription at the carrier layer",
    status: "Active",
  },
  {
    icon: Signal,
    label: "AI Signal Processing",
    description: "Real-time classification of voice interactions into structured signals",
    status: "Active",
  },
  {
    icon: Layers,
    label: "Channel Aggregation",
    description: "Unified pipeline merging phone, iMessage, Zoom, email & calendar into one feed",
    status: "Active",
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
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-2 h-2 bg-vanta-accent"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Fab Five · Connectivity
            </p>
          </div>
        <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground mb-2">
          Connectivity Hub
        </h1>
        <p className="font-sans text-[15px] text-vanta-text-mid max-w-[600px] leading-relaxed mb-10">
          Vanta is an MVNO-first platform — a dedicated mobile number that captures every voice call, 
          text, and voicemail at the network level, then aggregates signals across all your communication 
          channels into a single intelligence feed.
        </p>
      </Motion>

      {/* MVNO Core Product */}
      <Motion delay={40}>
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-vanta-accent" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
              Core MVNO Product
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MVNO_LAYERS.map((layer, i) => (
              <div
                key={layer.label}
                className="relative border border-vanta-border bg-card p-5 group hover:border-vanta-accent-border/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-vanta-accent-faint border border-vanta-accent-border/30 shrink-0">
                    <layer.icon className="w-4 h-4 text-vanta-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-foreground">
                        {layer.label}
                      </p>
                      <span className="ml-auto font-mono text-[8px] uppercase tracking-widest text-vanta-signal-green">
                        {layer.status}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-vanta-text-low leading-relaxed">
                      {layer.description}
                    </p>
                  </div>
                </div>
                {/* Step number */}
                <span className="absolute top-2 right-3 font-mono text-[9px] text-vanta-text-muted/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Motion>

      {/* Summary strip */}
      <Motion delay={80}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-vanta-text-muted" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
            Channel Aggregation
          </p>
        </div>
        <div className="flex items-center gap-6 mb-8 p-4 border border-vanta-border bg-card">
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
      </Motion>

      {/* Channel cards */}
      <Motion delay={120}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
                <div className="absolute top-4 right-4">
                  {enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--vanta-signal-green))]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-vanta-text-muted" />
                  )}
                </div>

                <div className={`inline-flex items-center justify-center h-10 w-10 mb-4 ${ch.bgClass} border ${ch.borderClass} ring-1 ${ch.ringClass}`}>
                  <ch.icon className={`h-5 w-5 ${ch.colorClass}`} />
                </div>

                <p className="font-mono text-[12px] uppercase tracking-wider text-foreground mb-1">{ch.label}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-low mb-3">
                  {enabled ? "Connected" : "Disconnected"}
                </p>

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
      </Motion>
    </div>
  );
}

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Users, DollarSign, AlertCircle } from "lucide-react";

interface SignalBriefItemProps {
  icon: string;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendLabel?: string;
  forceLight?: boolean;
}

const trendColors = {
  up: { dark: "text-vanta-signal-green", light: "hsl(160 100% 30%)" },
  down: { dark: "text-destructive", light: "hsl(0 84% 50%)" },
  neutral: { dark: "text-muted-foreground", light: "hsl(0 0% 50%)" },
};

export default function SignalBriefItem({ icon, label, value, trend, trendLabel, forceLight }: SignalBriefItemProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = { Users, DollarSign, AlertCircle };
  const LucideIcon = iconMap[icon] || Minus;

  if (forceLight) {
    const trendColor = trendColors[trend].light;
    return (
      <div className="flex flex-col gap-1.5 px-3 py-2">
        <div className="flex items-center gap-2">
          <LucideIcon className="w-5 h-5 stroke-[1.5]" style={{ color: "hsl(0 0% 50%)" }} />
          <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "hsl(0 0% 50%)" }}>{label}</span>
        </div>
        <p className="font-display text-[18px] font-bold leading-none" style={{ color: "hsl(0 0% 0%)" }}>{value}</p>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
          {trendLabel && (
            <span className="font-mono text-[10px]" style={{ color: trendColor }}>{trendLabel}</span>
          )}
        </div>
      </div>
    );
  }

  const trendConfig = {
    up: { color: "text-vanta-signal-green" },
    down: { color: "text-destructive" },
    neutral: { color: "text-muted-foreground" },
  };
  const { color } = trendConfig[trend];

  return (
    <div className="flex-1 min-w-[100px] flex flex-col gap-1.5 px-3 py-2">
      <div className="flex items-center gap-2">
        <LucideIcon className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-[18px] font-bold text-foreground leading-none">{value}</p>
      <div className="flex items-center gap-1.5">
        <TrendIcon className={`w-3.5 h-3.5 ${color}`} />
        {trendLabel && (
          <span className={`font-mono text-[10px] ${color}`}>{trendLabel}</span>
        )}
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Users, DollarSign, AlertCircle } from "lucide-react";

interface SignalBriefItemProps {
  icon: string;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendLabel?: string;
}

const trendConfig = {
  up: { Icon: TrendingUp, color: "text-vanta-signal-green" },
  down: { Icon: TrendingDown, color: "text-destructive" },
  neutral: { Icon: Minus, color: "text-muted-foreground" },
};

export default function SignalBriefItem({ icon, label, value, trend, trendLabel }: SignalBriefItemProps) {
  const { Icon: TrendIcon, color } = trendConfig[trend];
  const LucideIcon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon] || Minus;

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

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Zap, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "/mo",
    icon: Zap,
    features: ["5 signal sources", "100 signals/mo", "Basic classification", "Email support"],
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/mo",
    icon: Sparkles,
    current: true,
    features: ["Unlimited sources", "5,000 signals/mo", "AI classification + briefs", "Cooling alerts", "Engagement sequences", "Priority support"],
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/30",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "/mo",
    icon: Crown,
    features: ["Everything in Pro", "Unlimited signals", "Custom workflows", "API access", "SSO & team roles", "Dedicated CSM"],
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
  },
];

const USAGE = [
  { label: "Signals processed", used: 2847, limit: 5000, unit: "" },
  { label: "AI classifications", used: 2614, limit: 5000, unit: "" },
  { label: "Pre-meeting briefs", used: 18, limit: 50, unit: "" },
  { label: "Storage used", used: 1.2, limit: 5, unit: "GB" },
];

export default function MyPlan() {
  const [currentPlan] = useState("pro");

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Dashboard
      </Link>

      <Motion>
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">My Plan</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Current billing cycle: Mar 1 – Mar 31, 2026
        </p>
      </Motion>

      {/* Usage meters */}
      <Motion delay={40}>
        <div className="border border-border rounded-lg p-5 mb-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Usage this period
          </p>
          <div className="grid grid-cols-2 gap-4">
            {USAGE.map((u) => {
              const pct = Math.min((u.used / u.limit) * 100, 100);
              return (
                <div key={u.label}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{u.label}</span>
                    <span className="font-mono text-[11px] text-foreground font-medium">
                      {u.used.toLocaleString()}{u.unit}/{u.limit.toLocaleString()}{u.unit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Motion>

      {/* Plan cards */}
      <Motion delay={80}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Choose your plan</p>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`border ${isCurrent ? plan.border : "border-border"} rounded-lg p-5 ${isCurrent ? plan.bg : ""} relative`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 bg-primary text-primary-foreground rounded-full">
                    Current
                  </span>
                )}
                <Icon className={`w-5 h-5 ${plan.color} mb-3`} />
                <h3 className="font-display text-lg text-foreground mb-1">{plan.name}</h3>
                <p className="mb-4">
                  <span className="font-display text-2xl text-foreground">{plan.price}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-sans text-[13px] text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (!isCurrent) toast.info(`Plan change to ${plan.name} — contact billing.`);
                  }}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </Motion>
    </div>
  );
}

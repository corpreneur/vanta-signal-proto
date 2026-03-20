import { Link } from "react-router-dom";
import { ArrowLeft, Download, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

const INVOICES = [
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$49.00", status: "paid", plan: "Pro" },
  { id: "INV-2026-002", date: "Feb 1, 2026", amount: "$49.00", status: "paid", plan: "Pro" },
  { id: "INV-2026-001", date: "Jan 1, 2026", amount: "$49.00", status: "paid", plan: "Pro" },
  { id: "INV-2025-012", date: "Dec 1, 2025", amount: "$49.00", status: "paid", plan: "Pro" },
  { id: "INV-2025-011", date: "Nov 1, 2025", amount: "$49.00", status: "paid", plan: "Pro" },
  { id: "INV-2025-010", date: "Oct 1, 2025", amount: "$0.00", status: "paid", plan: "Starter (Free)" },
  { id: "INV-2025-009", date: "Sep 1, 2025", amount: "$0.00", status: "paid", plan: "Starter (Free)" },
  { id: "INV-2025-008", date: "Aug 1, 2025", amount: "$0.00", status: "paid", plan: "Starter (Free)" },
];

const PAYMENT_METHOD = {
  brand: "Visa",
  last4: "4242",
  exp: "08/28",
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BillingHistory() {
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
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">
          Billing History
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Invoices and payment method
        </p>
      </Motion>

      {/* Payment method card */}
      <Motion delay={40}>
        <div className="border border-border rounded-lg p-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 rounded bg-muted/60 border border-border flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-foreground">
                {PAYMENT_METHOD.brand} ···· {PAYMENT_METHOD.last4}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">Expires {PAYMENT_METHOD.exp}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Payment method update — opening portal.")}>
            Update
          </Button>
        </div>
      </Motion>

      {/* Invoice table */}
      <Motion delay={80}>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Invoices</p>
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
            {["Invoice", "Date", "Amount", "Status", ""].map((h) => (
              <span key={h} className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{h}</span>
            ))}
          </div>
          {/* Rows */}
          {INVOICES.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors items-center"
            >
              <div>
                <span className="font-mono text-[12px] text-foreground">{inv.id}</span>
                <span className="font-mono text-[9px] text-muted-foreground ml-2">{inv.plan}</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{inv.date}</span>
              <span className="font-mono text-[12px] text-foreground font-medium">{inv.amount}</span>
              <span className={`inline-flex self-center px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider border rounded-full w-fit ${STATUS_STYLE[inv.status]}`}>
                {inv.status}
              </span>
              <button
                onClick={() => toast.info(`Downloading ${inv.id}...`)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Motion>

      <Motion delay={120}>
        <div className="flex justify-center mt-6">
          <Button variant="ghost" size="sm" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider" onClick={() => toast.info("Opening billing portal...")}>
            <ExternalLink className="w-3 h-3" />
            Open Full Billing Portal
          </Button>
        </div>
      </Motion>
    </div>
  );
}

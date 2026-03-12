import type { SignalType, SignalPriority } from "@/data/signals";

export interface FilterState {
  type: SignalType | "ALL";
  sender: string;
  priority: SignalPriority | "ALL";
  search: string;
}

interface SignalFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  senders: string[];
}

const SIGNAL_TYPES: (SignalType | "ALL")[] = [
  "ALL",
  "INTRO",
  "INSIGHT",
  "INVESTMENT",
  "DECISION",
  "CONTEXT",
];

const PRIORITIES: (SignalPriority | "ALL")[] = ["ALL", "high", "medium", "low"];

const SignalFilters = ({ filters, onChange, senders }: SignalFiltersProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
          Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Filter by keyword…"
          className="bg-vanta-bg-elevated border border-vanta-border text-vanta-text-mid font-mono text-[11px] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border w-full max-w-[480px] placeholder:text-vanta-text-muted"
        />
      </div>
      <div className="flex flex-wrap gap-3">
      {/* Signal Type */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
          Signal Type
        </label>
        <select
          value={filters.type}
          onChange={(e) =>
            onChange({ ...filters, type: e.target.value as SignalType | "ALL" })
          }
          className="bg-vanta-bg-elevated border border-vanta-border text-vanta-text-mid font-mono text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border appearance-none cursor-pointer min-w-[140px]"
        >
          {SIGNAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All Types" : t}
            </option>
          ))}
        </select>
      </div>

      {/* Sender */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
          Sender
        </label>
        <select
          value={filters.sender}
          onChange={(e) => onChange({ ...filters, sender: e.target.value })}
          className="bg-vanta-bg-elevated border border-vanta-border text-vanta-text-mid font-mono text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="ALL">All Senders</option>
          {senders.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
          Priority
        </label>
        <select
          value={filters.priority}
          onChange={(e) =>
            onChange({
              ...filters,
              priority: e.target.value as SignalPriority | "ALL",
            })
          }
          className="bg-vanta-bg-elevated border border-vanta-border text-vanta-text-mid font-mono text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 focus:outline-none focus:border-vanta-accent-border appearance-none cursor-pointer min-w-[140px]"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === "ALL" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SignalFilters;

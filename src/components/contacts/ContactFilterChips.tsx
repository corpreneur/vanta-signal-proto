import { X } from "lucide-react";
import { RELATIONSHIP_TYPES, RELATIONSHIP_LABELS } from "@/hooks/use-contact-profiles";

export type RecencyFilter = "all" | "7d" | "30d" | "90d" | "stale";

export interface ContactFilterState {
  relationshipType: string | null;
  recency: RecencyFilter;
}

const RECENCY_OPTIONS: { value: RecencyFilter; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "stale", label: "Stale (90d+)" },
];

interface Props {
  filters: ContactFilterState;
  onChange: (filters: ContactFilterState) => void;
  relationshipCounts?: Map<string, number>;
}

export const DEFAULT_CONTACT_FILTERS: ContactFilterState = {
  relationshipType: null,
  recency: "all",
};

export function applyContactFilters(
  contacts: { name: string; daysSinceLast: number }[],
  filters: ContactFilterState,
  profileMap: Map<string, { relationship_type: string }>
) {
  let list = contacts;

  if (filters.relationshipType) {
    list = list.filter((c) => {
      const p = profileMap.get(c.name);
      return p?.relationship_type === filters.relationshipType;
    });
  }

  if (filters.recency !== "all") {
    const bounds: Record<RecencyFilter, [number, number]> = {
      all: [0, Infinity],
      "7d": [0, 7],
      "30d": [0, 30],
      "90d": [0, 90],
      stale: [90, Infinity],
    };
    const [min, max] = bounds[filters.recency];
    list = list.filter((c) => c.daysSinceLast >= min && c.daysSinceLast <= max);
  }

  return list;
}

export default function ContactFilterChips({ filters, onChange, relationshipCounts }: Props) {
  const hasActiveFilter = filters.relationshipType || filters.recency !== "all";

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {/* Relationship type chips */}
      {RELATIONSHIP_TYPES.map((rt) => {
        const active = filters.relationshipType === rt;
        const count = relationshipCounts?.get(rt) || 0;
        return (
          <button
            key={rt}
            onClick={() => onChange({ ...filters, relationshipType: active ? null : rt })}
            className={`px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              active
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {RELATIONSHIP_LABELS[rt]}
            {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-4 bg-border mx-1" />

      {/* Recency chips */}
      {RECENCY_OPTIONS.map((opt) => {
        const active = filters.recency === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, recency: active ? "all" : opt.value })}
            className={`px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              active
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {opt.label}
          </button>
        );
      })}

      {/* Clear all */}
      {hasActiveFilter && (
        <button
          onClick={() => onChange(DEFAULT_CONTACT_FILTERS)}
          className="flex items-center gap-0.5 px-2 py-1 font-mono text-[9px] text-destructive hover:text-destructive/80 transition-colors"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}

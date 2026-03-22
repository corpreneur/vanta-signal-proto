import type { Signal, SignalType, SignalPriority } from "@/data/signals";
import type { FilterState } from "@/components/SignalFilters";

/** Check if a signal's due date is before today and not complete */
export function isOverdue(signal: Signal, today?: string): boolean {
  const t = today ?? new Date().toISOString().split("T")[0];
  return !!(signal.dueDate && signal.dueDate < t && signal.status !== "Complete");
}

/** Priority lens types */
export type PriorityLens = "all" | "time" | "money" | "urgency";

const TIME_TYPES: SignalType[] = ["MEETING", "PHONE_CALL", "DECISION"];
const MONEY_TYPES: SignalType[] = ["INVESTMENT", "INTRO", "INSIGHT"];

/** Filter signals for the main feed (excludes noise, applies lens + mode filters) */
export function filterFeedSignals(
  signals: Signal[],
  options: {
    isExecutive?: boolean;
    priorityLens?: PriorityLens;
    showQuickTasks?: boolean;
    showOverdueOnly?: boolean;
    today?: string;
  } = {}
): Signal[] {
  const {
    isExecutive = false,
    priorityLens = "all",
    showQuickTasks = false,
    showOverdueOnly = false,
    today = new Date().toISOString().split("T")[0],
  } = options;

  let items = signals.filter((s) => s.signalType !== "NOISE");

  if (isExecutive) {
    items = items.filter((s) => s.priority === "high");
  }

  if (priorityLens === "time") {
    items = items.filter((s) => TIME_TYPES.includes(s.signalType) || !!s.dueDate);
  } else if (priorityLens === "money") {
    items = items.filter((s) => MONEY_TYPES.includes(s.signalType));
  } else if (priorityLens === "urgency") {
    items = items.filter(
      (s) =>
        s.priority === "high" ||
        (s.dueDate && s.dueDate <= today) ||
        s.riskLevel === "high" ||
        s.riskLevel === "critical"
    );
  }

  if (showQuickTasks) {
    items = items.filter(
      (s) =>
        (s.priority === "low" || s.priority === "medium") &&
        (s.signalType === "CONTEXT" || s.signalType === "INTRO") &&
        s.summary.length < 120
    );
  }

  if (showOverdueOnly) {
    items = items.filter((s) => isOverdue(s, today));
  }

  return items;
}

/** Sort signals — overdue always bubble to top */
export function sortSignals(
  signals: Signal[],
  mode: "captured" | "due_date",
  today?: string
): Signal[] {
  const t = today ?? new Date().toISOString().split("T")[0];
  const copy = [...signals];

  if (mode === "due_date") {
    return copy.sort((a, b) => {
      const aO = isOverdue(a, t) ? 1 : 0;
      const bO = isOverdue(b, t) ? 1 : 0;
      if (bO !== aO) return bO - aO;
      if (!a.dueDate && !b.dueDate) return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  return copy.sort((a, b) => {
    const aO = isOverdue(a, t) ? 1 : 0;
    const bO = isOverdue(b, t) ? 1 : 0;
    if (bO !== aO) return bO - aO;
    return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
  });
}

/** Extract noise signals sorted by capturedAt desc */
export function getNoiseSignals(signals: Signal[]): Signal[] {
  return signals
    .filter((s) => s.signalType === "NOISE")
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
}

/** Apply FilterState (type, sender, priority, search) to a list of signals */
export function applyFilterState(signals: Signal[], filters: FilterState): Signal[] {
  let result = signals;

  if (filters.type !== "ALL") {
    result = result.filter((s) => s.signalType === filters.type);
  }

  if (filters.sender !== "ALL") {
    result = result.filter((s) => s.sender === filters.sender);
  }

  if (filters.priority !== "ALL") {
    result = result.filter((s) => s.priority === filters.priority);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.summary.toLowerCase().includes(q) ||
        s.sender.toLowerCase().includes(q) ||
        s.sourceMessage.toLowerCase().includes(q)
    );
  }

  return result;
}

/** Count overdue signals (non-noise) */
export function countOverdue(signals: Signal[], today?: string): number {
  const t = today ?? new Date().toISOString().split("T")[0];
  return signals.filter(
    (s) => s.signalType !== "NOISE" && isOverdue(s, t)
  ).length;
}

import { describe, it, expect } from "vitest";
import type { Signal } from "@/data/signals";
import type { FilterState } from "@/components/SignalFilters";
import {
  isOverdue,
  filterFeedSignals,
  sortSignals,
  getNoiseSignals,
  applyFilterState,
  countOverdue,
} from "../signalFilters";

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "s1",
    signalType: "INTRO",
    sender: "Alice",
    summary: "Test signal summary",
    sourceMessage: "Hello world",
    priority: "medium",
    capturedAt: "2026-03-22T10:00:00Z",
    actionsTaken: [],
    status: "Captured",
    source: "linq",
    ...overrides,
  };
}

const TODAY = "2026-03-22";

// ── isOverdue ──────────────────────────────────────────
describe("isOverdue", () => {
  it("returns true when dueDate is before today and not complete", () => {
    expect(isOverdue(makeSignal({ dueDate: "2026-03-20", status: "Captured" }), TODAY)).toBe(true);
  });

  it("returns false when dueDate is today", () => {
    expect(isOverdue(makeSignal({ dueDate: "2026-03-22" }), TODAY)).toBe(false);
  });

  it("returns false when status is Complete", () => {
    expect(isOverdue(makeSignal({ dueDate: "2026-03-20", status: "Complete" }), TODAY)).toBe(false);
  });

  it("returns false when no dueDate", () => {
    expect(isOverdue(makeSignal(), TODAY)).toBe(false);
  });
});

// ── filterFeedSignals ──────────────────────────────────
describe("filterFeedSignals", () => {
  const base: Signal[] = [
    makeSignal({ id: "1", signalType: "INTRO", priority: "high" }),
    makeSignal({ id: "2", signalType: "NOISE", priority: "low" }),
    makeSignal({ id: "3", signalType: "MEETING", priority: "medium", dueDate: "2026-03-25" }),
    makeSignal({ id: "4", signalType: "INVESTMENT", priority: "high" }),
    makeSignal({ id: "5", signalType: "CONTEXT", priority: "low", summary: "Short" }),
    makeSignal({ id: "6", signalType: "DECISION", priority: "high", dueDate: "2026-03-20", status: "Captured" }),
  ];

  it("excludes NOISE signals", () => {
    const result = filterFeedSignals(base);
    expect(result.every((s) => s.signalType !== "NOISE")).toBe(true);
  });

  it("executive mode shows only high priority", () => {
    const result = filterFeedSignals(base, { isExecutive: true });
    expect(result.every((s) => s.priority === "high")).toBe(true);
    expect(result.length).toBe(3); // ids 1, 4, 6
  });

  it("time lens filters to MEETING/PHONE_CALL/DECISION or has dueDate", () => {
    const result = filterFeedSignals(base, { priorityLens: "time" });
    for (const s of result) {
      const matchesType = ["MEETING", "PHONE_CALL", "DECISION"].includes(s.signalType);
      expect(matchesType || !!s.dueDate).toBe(true);
    }
  });

  it("money lens filters to INVESTMENT/INTRO/INSIGHT", () => {
    const result = filterFeedSignals(base, { priorityLens: "money" });
    for (const s of result) {
      expect(["INVESTMENT", "INTRO", "INSIGHT"]).toContain(s.signalType);
    }
  });

  it("urgency lens filters high priority, overdue, or high/critical risk", () => {
    const withRisk = [...base, makeSignal({ id: "7", signalType: "CONTEXT", priority: "low", riskLevel: "critical" })];
    const result = filterFeedSignals(withRisk, { priorityLens: "urgency", today: TODAY });
    expect(result.find((s) => s.id === "7")).toBeDefined(); // critical risk
    expect(result.find((s) => s.id === "1")).toBeDefined(); // high priority
    expect(result.find((s) => s.id === "6")).toBeDefined(); // overdue
  });

  it("quickTasks mode returns only short, low/medium CONTEXT or INTRO", () => {
    const result = filterFeedSignals(base, { showQuickTasks: true });
    for (const s of result) {
      expect(["low", "medium"]).toContain(s.priority);
      expect(["CONTEXT", "INTRO"]).toContain(s.signalType);
      expect(s.summary.length).toBeLessThan(120);
    }
  });

  it("showOverdueOnly filters to overdue signals", () => {
    const result = filterFeedSignals(base, { showOverdueOnly: true, today: TODAY });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("6");
  });
});

// ── sortSignals ────────────────────────────────────────
describe("sortSignals", () => {
  const signals: Signal[] = [
    makeSignal({ id: "old", capturedAt: "2026-03-20T10:00:00Z" }),
    makeSignal({ id: "new", capturedAt: "2026-03-22T10:00:00Z" }),
    makeSignal({ id: "overdue", capturedAt: "2026-03-21T10:00:00Z", dueDate: "2026-03-19", status: "Captured" }),
  ];

  it("captured mode: overdue first, then by capturedAt desc", () => {
    const sorted = sortSignals(signals, "captured", TODAY);
    expect(sorted[0].id).toBe("overdue");
    expect(sorted[1].id).toBe("new");
    expect(sorted[2].id).toBe("old");
  });

  it("due_date mode: overdue first, then by dueDate asc", () => {
    const withDue: Signal[] = [
      makeSignal({ id: "later", dueDate: "2026-03-25", capturedAt: "2026-03-22T10:00:00Z" }),
      makeSignal({ id: "sooner", dueDate: "2026-03-23", capturedAt: "2026-03-20T10:00:00Z" }),
      makeSignal({ id: "overdue", dueDate: "2026-03-19", status: "Captured", capturedAt: "2026-03-21T10:00:00Z" }),
    ];
    const sorted = sortSignals(withDue, "due_date", TODAY);
    expect(sorted[0].id).toBe("overdue");
    expect(sorted[1].id).toBe("sooner");
    expect(sorted[2].id).toBe("later");
  });

  it("signals without dueDate go last in due_date mode", () => {
    const mixed: Signal[] = [
      makeSignal({ id: "no-due", capturedAt: "2026-03-22T10:00:00Z" }),
      makeSignal({ id: "has-due", dueDate: "2026-03-25", capturedAt: "2026-03-20T10:00:00Z" }),
    ];
    const sorted = sortSignals(mixed, "due_date", TODAY);
    expect(sorted[0].id).toBe("has-due");
    expect(sorted[1].id).toBe("no-due");
  });

  it("does not mutate the original array", () => {
    const original = [...signals];
    sortSignals(signals, "captured", TODAY);
    expect(signals.map((s) => s.id)).toEqual(original.map((s) => s.id));
  });
});

// ── getNoiseSignals ────────────────────────────────────
describe("getNoiseSignals", () => {
  it("returns only NOISE signals sorted by capturedAt desc", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", signalType: "NOISE", capturedAt: "2026-03-20T10:00:00Z" }),
      makeSignal({ id: "2", signalType: "INTRO" }),
      makeSignal({ id: "3", signalType: "NOISE", capturedAt: "2026-03-22T10:00:00Z" }),
    ];
    const result = getNoiseSignals(signals);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("3");
    expect(result[1].id).toBe("1");
  });

  it("returns empty array if no noise", () => {
    expect(getNoiseSignals([makeSignal()])).toHaveLength(0);
  });
});

// ── applyFilterState ───────────────────────────────────
describe("applyFilterState", () => {
  const signals: Signal[] = [
    makeSignal({ id: "1", signalType: "INTRO", sender: "Alice", priority: "high", summary: "Important intro" }),
    makeSignal({ id: "2", signalType: "MEETING", sender: "Bob", priority: "low", summary: "Weekly standup" }),
    makeSignal({ id: "3", signalType: "INTRO", sender: "Alice", priority: "low", summary: "Coffee chat" }),
  ];

  const defaults: FilterState = { type: "ALL", sender: "ALL", priority: "ALL", search: "", chatMode: "ALL" };

  it("ALL filters return everything", () => {
    expect(applyFilterState(signals, defaults)).toHaveLength(3);
  });

  it("filters by type", () => {
    const result = applyFilterState(signals, { ...defaults, type: "MEETING" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by sender", () => {
    const result = applyFilterState(signals, { ...defaults, sender: "Bob" });
    expect(result).toHaveLength(1);
  });

  it("filters by priority", () => {
    const result = applyFilterState(signals, { ...defaults, priority: "high" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by search (case-insensitive)", () => {
    const result = applyFilterState(signals, { ...defaults, search: "coffee" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("search matches sender name", () => {
    const result = applyFilterState(signals, { ...defaults, search: "bob" });
    expect(result).toHaveLength(1);
  });

  it("combines multiple filters", () => {
    const result = applyFilterState(signals, { ...defaults, type: "INTRO", priority: "low" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
});

// ── countOverdue ───────────────────────────────────────
describe("countOverdue", () => {
  it("counts non-noise overdue signals", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", dueDate: "2026-03-20", status: "Captured" }),
      makeSignal({ id: "2", dueDate: "2026-03-20", status: "Complete" }),
      makeSignal({ id: "3", signalType: "NOISE", dueDate: "2026-03-20", status: "Captured" }),
      makeSignal({ id: "4", dueDate: "2026-03-25" }),
    ];
    expect(countOverdue(signals, TODAY)).toBe(1);
  });

  it("returns 0 when nothing is overdue", () => {
    expect(countOverdue([makeSignal()], TODAY)).toBe(0);
  });
});

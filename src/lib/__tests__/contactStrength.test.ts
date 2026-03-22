import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  daysBetween,
  recencyLabel,
  computeStrength,
  buildContactContextMap,
} from "../contactStrength";
import type { Signal } from "@/data/signals";

// Helper to create a signal with sensible defaults
function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "sig-1",
    signalType: "INTRO",
    sender: "Alice",
    summary: "Met at conference",
    sourceMessage: "Hello",
    priority: "medium",
    capturedAt: new Date().toISOString(),
    actionsTaken: [],
    status: "Captured",
    source: "linq",
    ...overrides,
  };
}

describe("daysBetween", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns 0 for today", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    expect(daysBetween("2026-03-22T06:00:00Z")).toBe(0);
  });

  it("returns correct days for past dates", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    expect(daysBetween("2026-03-15T12:00:00Z")).toBe(7);
  });

  it("returns 0 for future dates (clamped)", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    expect(daysBetween("2026-03-25T12:00:00Z")).toBe(0);
  });
});

describe("recencyLabel", () => {
  it('returns "Today" for 0 days', () => {
    expect(recencyLabel(0)).toBe("Today");
  });

  it('returns "Yesterday" for 1 day', () => {
    expect(recencyLabel(1)).toBe("Yesterday");
  });

  it("returns day format for 2-7 days", () => {
    expect(recencyLabel(3)).toBe("3d ago");
    expect(recencyLabel(7)).toBe("7d ago");
  });

  it("returns week format for 8-30 days", () => {
    expect(recencyLabel(14)).toBe("2w ago");
    expect(recencyLabel(28)).toBe("4w ago");
  });

  it("returns month format for 31+ days", () => {
    expect(recencyLabel(60)).toBe("2mo ago");
    expect(recencyLabel(90)).toBe("3mo ago");
  });
});

describe("computeStrength", () => {
  it("returns high strength for frequent recent high-priority contact", () => {
    const result = computeStrength({
      signalCount: 20,
      highPriority: 15,
      daysSinceLast: 0,
      sentimentAvg: 0.9,
      sourceDiversity: 4,
    });
    expect(result.strength).toBeGreaterThanOrEqual(75);
    expect(result.strengthLabel).toBe("Strong");
  });

  it("returns low strength for old single interaction", () => {
    const result = computeStrength({
      signalCount: 1,
      highPriority: 0,
      daysSinceLast: 120,
    });
    expect(result.strength).toBeLessThan(25);
    expect(result.strengthLabel).toBe("Cold");
  });

  it("clamps strength to 0-100 range", () => {
    const high = computeStrength({
      signalCount: 1000,
      highPriority: 1000,
      daysSinceLast: 0,
      sentimentAvg: 1,
      sourceDiversity: 10,
    });
    expect(high.strength).toBeLessThanOrEqual(100);

    const low = computeStrength({
      signalCount: 0,
      highPriority: 0,
      daysSinceLast: 9999,
    });
    expect(low.strength).toBeGreaterThanOrEqual(0);
  });

  it("labels Warm for mid-range strength", () => {
    const result = computeStrength({
      signalCount: 8,
      highPriority: 2,
      daysSinceLast: 5,
      sentimentAvg: 0.6,
      sourceDiversity: 2,
    });
    expect(result.strength).toBeGreaterThanOrEqual(50);
    expect(result.strengthLabel).toBe("Warm");
  });

  it("labels Cooling for 25-49 range", () => {
    const result = computeStrength({
      signalCount: 3,
      highPriority: 0,
      daysSinceLast: 20,
      sentimentAvg: 0.3,
      sourceDiversity: 1,
    });
    expect(result.strength).toBeGreaterThanOrEqual(25);
    expect(result.strength).toBeLessThan(50);
    expect(result.strengthLabel).toBe("Cooling");
  });

  it("uses defaults for optional params", () => {
    const result = computeStrength({
      signalCount: 5,
      highPriority: 1,
      daysSinceLast: 3,
    });
    expect(result.strength).toBeGreaterThan(0);
    expect(typeof result.strengthLabel).toBe("string");
  });
});

describe("buildContactContextMap", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns empty map for no signals", () => {
    const map = buildContactContextMap([]);
    expect(map.size).toBe(0);
  });

  it("groups signals by sender", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", capturedAt: "2026-03-22T10:00:00Z" }),
      makeSignal({ id: "2", sender: "Alice", capturedAt: "2026-03-21T10:00:00Z", priority: "high" }),
      makeSignal({ id: "3", sender: "Bob", capturedAt: "2026-03-20T10:00:00Z" }),
    ];
    const map = buildContactContextMap(signals);
    expect(map.size).toBe(2);
    expect(map.get("Alice")!.signalCount).toBe(2);
    expect(map.get("Alice")!.highPriority).toBe(1);
    expect(map.get("Bob")!.signalCount).toBe(1);
  });

  it("tracks interaction diversity (sources)", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", source: "linq", capturedAt: "2026-03-22T10:00:00Z" }),
      makeSignal({ id: "2", sender: "Alice", source: "gmail", capturedAt: "2026-03-21T10:00:00Z" }),
    ];
    const map = buildContactContextMap(signals);
    expect(map.get("Alice")!.interactionDiversity).toBe(2);
    expect(map.get("Alice")!.sources).toContain("linq");
    expect(map.get("Alice")!.sources).toContain("gmail");
  });

  it("computes sentiment from signal types", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", signalType: "INTRO", capturedAt: "2026-03-22T10:00:00Z" }),
      makeSignal({ id: "2", sender: "Alice", signalType: "NOISE", capturedAt: "2026-03-21T10:00:00Z" }),
    ];
    const map = buildContactContextMap(signals);
    // INTRO=1.0, NOISE=-0.2 → avg = 0.4
    expect(map.get("Alice")!.sentimentScore).toBeCloseTo(0.4, 1);
  });

  it("picks the most recent interaction date", () => {
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", capturedAt: "2026-03-10T10:00:00Z" }),
      makeSignal({ id: "2", sender: "Alice", capturedAt: "2026-03-20T10:00:00Z" }),
      makeSignal({ id: "3", sender: "Alice", capturedAt: "2026-03-15T10:00:00Z" }),
    ];
    const map = buildContactContextMap(signals);
    expect(map.get("Alice")!.lastInteraction).toBe("2026-03-20T10:00:00Z");
    expect(map.get("Alice")!.daysSinceLast).toBe(2);
  });
});

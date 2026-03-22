import { describe, it, expect } from "vitest";
import { mockSignals } from "@/data/mockSignals";
import type { Signal, SignalType, SignalPriority, SignalSource, SignalStatus } from "@/data/signals";
import { SIGNAL_TYPE_COLORS, PHONE_CALL_TAGS, PHONE_TAG_LABELS } from "@/data/signals";

const VALID_TYPES: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE", "MEETING", "PHONE_CALL"];
const VALID_PRIORITIES: SignalPriority[] = ["high", "medium", "low"];
const VALID_SOURCES: SignalSource[] = ["linq", "gmail", "manual", "recall", "phone", "fireflies", "otter"];
const VALID_STATUSES: SignalStatus[] = ["Captured", "In Progress", "Complete"];

describe("mockSignals data integrity", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(mockSignals)).toBe(true);
    expect(mockSignals.length).toBeGreaterThan(0);
  });

  it("every signal has a unique id", () => {
    const ids = mockSignals.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every signal has a valid signalType", () => {
    for (const s of mockSignals) {
      expect(VALID_TYPES).toContain(s.signalType);
    }
  });

  it("every signal has a valid priority", () => {
    for (const s of mockSignals) {
      expect(VALID_PRIORITIES).toContain(s.priority);
    }
  });

  it("every signal has a valid source", () => {
    for (const s of mockSignals) {
      expect(VALID_SOURCES).toContain(s.source);
    }
  });

  it("every signal has a valid status", () => {
    for (const s of mockSignals) {
      expect(VALID_STATUSES).toContain(s.status);
    }
  });

  it("capturedAt is a valid ISO date string", () => {
    for (const s of mockSignals) {
      const d = new Date(s.capturedAt);
      expect(d.getTime()).not.toBeNaN();
    }
  });

  it("actionsTaken is always an array", () => {
    for (const s of mockSignals) {
      expect(Array.isArray(s.actionsTaken)).toBe(true);
    }
  });

  it("sender and summary are non-empty strings", () => {
    for (const s of mockSignals) {
      expect(s.sender.length).toBeGreaterThan(0);
      expect(s.summary.length).toBeGreaterThan(0);
    }
  });

  it("dueDate, when present, is a valid date string", () => {
    const withDue = mockSignals.filter((s) => s.dueDate);
    expect(withDue.length).toBeGreaterThan(0);
    for (const s of withDue) {
      expect(new Date(s.dueDate!).getTime()).not.toBeNaN();
    }
  });

  it("riskLevel, when present, is one of the valid values", () => {
    const withRisk = mockSignals.filter((s) => s.riskLevel);
    expect(withRisk.length).toBeGreaterThan(0);
    for (const s of withRisk) {
      expect(["low", "medium", "high", "critical"]).toContain(s.riskLevel);
    }
  });
});

describe("SIGNAL_TYPE_COLORS", () => {
  it("has an entry for every signal type", () => {
    for (const type of VALID_TYPES) {
      expect(SIGNAL_TYPE_COLORS[type]).toBeDefined();
      expect(SIGNAL_TYPE_COLORS[type].text).toBeTruthy();
      expect(SIGNAL_TYPE_COLORS[type].bg).toBeTruthy();
      expect(SIGNAL_TYPE_COLORS[type].border).toBeTruthy();
    }
  });
});

describe("PHONE_CALL_TAGS", () => {
  it("has matching labels for every tag", () => {
    for (const tag of PHONE_CALL_TAGS) {
      expect(PHONE_TAG_LABELS[tag]).toBeTruthy();
    }
  });
});

describe("mockSignals relative date helper", () => {
  it("all capturedAt dates are in the past or very recent", () => {
    const now = Date.now();
    for (const s of mockSignals) {
      const diff = now - new Date(s.capturedAt).getTime();
      // Should be within the last 48 hours (most are within 30h)
      expect(diff).toBeGreaterThanOrEqual(-5000); // allow 5s clock drift
    }
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildGraph } from "../buildGraph";
import type { Signal } from "@/data/signals";

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "sig-1",
    signalType: "INTRO",
    sender: "Alice",
    summary: "test",
    sourceMessage: "test",
    priority: "medium",
    capturedAt: "2026-03-22T10:00:00Z",
    actionsTaken: [],
    status: "Captured",
    source: "linq",
    ...overrides,
  };
}

describe("buildGraph", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-03-22T12:00:00Z")); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns empty graph for no signals", () => {
    const { nodes, edges } = buildGraph([]);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it("creates one node per unique sender", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice" }),
      makeSignal({ id: "2", sender: "Alice", priority: "high" }),
      makeSignal({ id: "3", sender: "Bob" }),
    ];
    const { nodes } = buildGraph(signals);
    expect(nodes).toHaveLength(2);
    const alice = nodes.find(n => n.name === "Alice")!;
    expect(alice.signalCount).toBe(2);
    expect(alice.highPriority).toBe(1);
  });

  it("creates co-occurrence edges for same day+source", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", capturedAt: "2026-03-22T10:00:00Z", source: "linq" }),
      makeSignal({ id: "2", sender: "Bob", capturedAt: "2026-03-22T14:00:00Z", source: "linq" }),
    ];
    const { edges } = buildGraph(signals);
    expect(edges).toHaveLength(1);
    expect(edges[0].sharedSignalTypes).toContain("co-occurrence");
  });

  it("does NOT create edges for different days", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", capturedAt: "2026-03-22T10:00:00Z", source: "linq" }),
      makeSignal({ id: "2", sender: "Bob", capturedAt: "2026-03-21T10:00:00Z", source: "linq" }),
    ];
    const { edges } = buildGraph(signals);
    expect(edges).toHaveLength(0);
  });

  it("creates meeting co-attendance edges", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", meetingId: "m1" }),
      makeSignal({ id: "2", sender: "Bob", meetingId: "m1" }),
    ];
    const { edges } = buildGraph(signals);
    const meetingEdge = edges.find(e => e.sharedSignalTypes.includes("meeting"));
    expect(meetingEdge).toBeDefined();
  });

  it("caps nodes at 40", () => {
    const signals: Signal[] = Array.from({ length: 50 }, (_, i) =>
      makeSignal({ id: `s-${i}`, sender: `Contact-${i}` })
    );
    const { nodes } = buildGraph(signals);
    expect(nodes.length).toBeLessThanOrEqual(40);
  });

  it("sorts nodes by signalCount descending (top 40)", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Low" }),
      makeSignal({ id: "2", sender: "High" }),
      makeSignal({ id: "3", sender: "High" }),
      makeSignal({ id: "4", sender: "High" }),
    ];
    const { nodes } = buildGraph(signals);
    expect(nodes[0].name).toBe("High");
    expect(nodes[0].signalCount).toBe(3);
  });

  it("assigns dominant type and cluster", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", signalType: "MEETING" }),
      makeSignal({ id: "2", sender: "Alice", signalType: "MEETING" }),
      makeSignal({ id: "3", sender: "Alice", signalType: "INTRO" }),
    ];
    const { nodes } = buildGraph(signals);
    expect(nodes[0].dominantType).toBe("MEETING");
    expect(typeof nodes[0].cluster).toBe("number");
  });

  it("tracks sources on nodes", () => {
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", source: "linq" }),
      makeSignal({ id: "2", sender: "Alice", source: "gmail" }),
    ];
    const { nodes } = buildGraph(signals);
    expect(nodes[0].sources).toContain("linq");
    expect(nodes[0].sources).toContain("gmail");
  });

  it("accumulates edge weight for multiple co-occurrences", () => {
    // Two different source keys on same day = two co-occurrence hits
    const signals: Signal[] = [
      makeSignal({ id: "1", sender: "Alice", capturedAt: "2026-03-22T10:00:00Z", source: "linq" }),
      makeSignal({ id: "2", sender: "Bob", capturedAt: "2026-03-22T10:00:00Z", source: "linq" }),
      makeSignal({ id: "3", sender: "Alice", capturedAt: "2026-03-22T10:00:00Z", source: "gmail" }),
      makeSignal({ id: "4", sender: "Bob", capturedAt: "2026-03-22T10:00:00Z", source: "gmail" }),
    ];
    const { edges } = buildGraph(signals);
    expect(edges).toHaveLength(1);
    expect(edges[0].weight).toBe(2);
  });

  it("filters edges to only include nodes in the top-40 set", () => {
    // Create 41 contacts so one gets cut, then an edge referencing the cut contact
    const signals: Signal[] = [
      ...Array.from({ length: 41 }, (_, i) =>
        makeSignal({ id: `s-${i}`, sender: `C-${i}`, capturedAt: "2026-03-22T10:00:00Z", source: "linq" })
      ),
    ];
    const { nodes, edges } = buildGraph(signals);
    const nodeNames = new Set(nodes.map(n => n.name));
    for (const e of edges) {
      expect(nodeNames.has(e.source as string)).toBe(true);
      expect(nodeNames.has(e.target as string)).toBe(true);
    }
  });
});

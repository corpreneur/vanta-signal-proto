import type { Signal, SignalType } from "@/data/signals";
import type { GraphNode, GraphEdge } from "./types";

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

/** Build nodes and edges from signals. Edges connect contacts co-mentioned in the same signal window (same day + same source). */
export function buildGraph(signals: Signal[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // --- Nodes ---
  const nodeMap = new Map<string, {
    signalCount: number;
    highPriority: number;
    lastInteraction: string;
    sources: Set<string>;
    signalTypes: Record<string, number>;
    // For edge detection: group signals by day+source key
    signalKeys: Set<string>;
  }>();

  for (const s of signals) {
    const key = s.capturedAt.slice(0, 10) + "|" + s.source;
    const existing = nodeMap.get(s.sender);
    if (existing) {
      existing.signalCount++;
      if (s.priority === "high") existing.highPriority++;
      if (new Date(s.capturedAt) > new Date(existing.lastInteraction)) existing.lastInteraction = s.capturedAt;
      existing.sources.add(s.source);
      existing.signalTypes[s.signalType] = (existing.signalTypes[s.signalType] || 0) + 1;
      existing.signalKeys.add(key);
    } else {
      nodeMap.set(s.sender, {
        signalCount: 1,
        highPriority: s.priority === "high" ? 1 : 0,
        lastInteraction: s.capturedAt,
        sources: new Set([s.source]),
        signalTypes: { [s.signalType]: 1 },
        signalKeys: new Set([key]),
      });
    }
  }

  // Also build meeting co-attendance edges
  const meetingAttendees = new Map<string, Set<string>>();
  for (const s of signals) {
    if (s.meetingId) {
      const existing = meetingAttendees.get(s.meetingId);
      if (existing) existing.add(s.sender);
      else meetingAttendees.set(s.meetingId, new Set([s.sender]));
    }
  }

  // Build edge map
  const edgeMap = new Map<string, { weight: number; sharedTypes: Set<string> }>();

  const addEdge = (a: string, b: string, type: string) => {
    const key = [a, b].sort().join("|||");
    const existing = edgeMap.get(key);
    if (existing) {
      existing.weight++;
      existing.sharedTypes.add(type);
    } else {
      edgeMap.set(key, { weight: 1, sharedTypes: new Set([type]) });
    }
  };

  // Co-occurrence: contacts sharing the same day+source key
  const keyToContacts = new Map<string, string[]>();
  for (const [name, data] of nodeMap) {
    for (const k of data.signalKeys) {
      const list = keyToContacts.get(k);
      if (list) list.push(name);
      else keyToContacts.set(k, [name]);
    }
  }
  for (const [, contacts] of keyToContacts) {
    if (contacts.length < 2) continue;
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        addEdge(contacts[i], contacts[j], "co-occurrence");
      }
    }
  }

  // Meeting co-attendance
  for (const [, attendees] of meetingAttendees) {
    const arr = [...attendees];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        addEdge(arr[i], arr[j], "meeting");
      }
    }
  }

  // --- Cluster detection (simple: group by dominant signal type) ---
  const clusterTypes = [...new Set([...nodeMap.values()].map(n => {
    let max = 0, dom = "CONTEXT";
    for (const [type, count] of Object.entries(n.signalTypes)) {
      if (count > max) { max = count; dom = type; }
    }
    return dom;
  }))];

  const nodes: GraphNode[] = [...nodeMap.entries()]
    .sort((a, b) => b[1].signalCount - a[1].signalCount)
    .slice(0, 40) // cap at 40 for perf
    .map(([name, data]) => {
      let max = 0, dom: SignalType = "CONTEXT";
      for (const [type, count] of Object.entries(data.signalTypes)) {
        if (count > max) { max = count; dom = type as SignalType; }
      }
      return {
        id: name,
        name,
        signalCount: data.signalCount,
        highPriority: data.highPriority,
        lastInteraction: data.lastInteraction,
        daysSinceLast: daysBetween(data.lastInteraction),
        sources: [...data.sources],
        signalTypes: data.signalTypes,
        dominantType: dom,
        cluster: clusterTypes.indexOf(dom),
      };
    });

  const nodeNames = new Set(nodes.map(n => n.name));
  const edges: GraphEdge[] = [...edgeMap.entries()]
    .filter(([key]) => {
      const [a, b] = key.split("|||");
      return nodeNames.has(a) && nodeNames.has(b);
    })
    .map(([key, data]) => {
      const [a, b] = key.split("|||");
      return { source: a, target: b, weight: data.weight, sharedSignalTypes: [...data.sharedTypes] };
    });

  return { nodes, edges };
}

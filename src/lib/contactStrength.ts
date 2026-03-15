import type { Signal } from "@/data/signals";

export interface ContactContext {
  name: string;
  signalCount: number;
  highPriority: number;
  daysSinceLast: number;
  strength: number;
  strengthLabel: string;
  lastInteraction: string;
}

export function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function recencyLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  if (days <= 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function computeStrength(params: {
  signalCount: number;
  highPriority: number;
  daysSinceLast: number;
}): { strength: number; strengthLabel: string } {
  const { signalCount, highPriority, daysSinceLast } = params;

  // Frequency: log-scaled, capped contribution of 40
  const freqScore = Math.min(40, (Math.log2(signalCount + 1) / Math.log2(50)) * 40);

  // Recency: exponential decay, max 35
  const recencyScore = Math.max(0, 35 * Math.exp(-daysSinceLast / 14));

  // Priority weight: high-priority ratio, max 25
  const priorityRatio = signalCount > 0 ? highPriority / signalCount : 0;
  const priorityScore = priorityRatio * 25;

  const raw = Math.round(freqScore + recencyScore + priorityScore);
  const strength = Math.min(100, Math.max(0, raw));

  let strengthLabel = "Cold";
  if (strength >= 75) strengthLabel = "Strong";
  else if (strength >= 50) strengthLabel = "Warm";
  else if (strength >= 25) strengthLabel = "Cooling";

  return { strength, strengthLabel };
}

/** Build a contact context map from all signals */
export function buildContactContextMap(signals: Signal[]): Map<string, ContactContext> {
  const map = new Map<string, {
    name: string;
    signalCount: number;
    highPriority: number;
    lastInteraction: string;
  }>();

  for (const s of signals) {
    const existing = map.get(s.sender);
    if (!existing) {
      map.set(s.sender, {
        name: s.sender,
        signalCount: 1,
        highPriority: s.priority === "high" ? 1 : 0,
        lastInteraction: s.capturedAt,
      });
    } else {
      existing.signalCount++;
      if (s.priority === "high") existing.highPriority++;
      if (new Date(s.capturedAt) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = s.capturedAt;
      }
    }
  }

  const result = new Map<string, ContactContext>();
  for (const [name, data] of map) {
    const dsl = daysBetween(data.lastInteraction);
    const { strength, strengthLabel } = computeStrength({
      signalCount: data.signalCount,
      highPriority: data.highPriority,
      daysSinceLast: dsl,
    });
    result.set(name, {
      ...data,
      daysSinceLast: dsl,
      strength,
      strengthLabel,
    });
  }

  return result;
}

import type { Signal, SignalType } from "@/data/signals";

export interface ContactContext {
  name: string;
  signalCount: number;
  highPriority: number;
  daysSinceLast: number;
  strength: number;
  strengthLabel: string;
  lastInteraction: string;
  sentimentScore?: number;
  interactionDiversity?: number;
  sources?: string[];
  signalTypes?: string[];
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

// Sentiment mapping by signal type
const SENTIMENT_MAP: Record<string, number> = {
  INTRO: 1.0,
  INSIGHT: 0.7,
  INVESTMENT: 0.8,
  DECISION: 0.5,
  MEETING: 0.6,
  PHONE_CALL: 0.6,
  CONTEXT: 0.3,
  NOISE: -0.2,
};

/**
 * V2 Relationship Strength Scoring
 * Weights: Frequency 30, Recency 25, Priority 15, Sentiment 10, Diversity 10, Response Time 10
 */
export function computeStrength(params: {
  signalCount: number;
  highPriority: number;
  daysSinceLast: number;
  sentimentAvg?: number;
  sourceDiversity?: number;
}): { strength: number; strengthLabel: string } {
  const { signalCount, highPriority, daysSinceLast, sentimentAvg = 0.5, sourceDiversity = 1 } = params;

  // Frequency: log-scaled, capped contribution of 30
  const freqScore = Math.min(30, (Math.log2(signalCount + 1) / Math.log2(50)) * 30);

  // Recency: exponential decay, max 25
  const recencyScore = Math.max(0, 25 * Math.exp(-daysSinceLast / 14));

  // Priority weight: high-priority ratio, max 15
  const priorityRatio = signalCount > 0 ? highPriority / signalCount : 0;
  const priorityScore = priorityRatio * 15;

  // Sentiment: average sentiment across signal types, max 10
  const sentimentScore = Math.max(0, sentimentAvg * 10);

  // Interaction diversity: how many different sources, max 10
  const diversityScore = Math.min(10, sourceDiversity * 2.5);

  // Response time approximation: based on recency pattern, max 10
  const responseScore = Math.max(0, 10 * Math.exp(-daysSinceLast / 7));

  const raw = Math.round(freqScore + recencyScore + priorityScore + sentimentScore + diversityScore + responseScore);
  const strength = Math.min(100, Math.max(0, raw));

  let strengthLabel = "Cold";
  if (strength >= 75) strengthLabel = "Strong";
  else if (strength >= 50) strengthLabel = "Warm";
  else if (strength >= 25) strengthLabel = "Cooling";

  return { strength, strengthLabel };
}

/** Build a contact context map from all signals — V2 with sentiment + diversity */
export function buildContactContextMap(signals: Signal[]): Map<string, ContactContext> {
  const map = new Map<string, {
    name: string;
    signalCount: number;
    highPriority: number;
    lastInteraction: string;
    sentimentSum: number;
    sources: Set<string>;
    signalTypes: Set<string>;
  }>();

  for (const s of signals) {
    const existing = map.get(s.sender);
    const sentiment = SENTIMENT_MAP[s.signalType] ?? 0.5;
    if (!existing) {
      map.set(s.sender, {
        name: s.sender,
        signalCount: 1,
        highPriority: s.priority === "high" ? 1 : 0,
        lastInteraction: s.capturedAt,
        sentimentSum: sentiment,
        sources: new Set([s.source]),
        signalTypes: new Set([s.signalType]),
      });
    } else {
      existing.signalCount++;
      if (s.priority === "high") existing.highPriority++;
      existing.sentimentSum += sentiment;
      existing.sources.add(s.source);
      existing.signalTypes.add(s.signalType);
      if (new Date(s.capturedAt) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = s.capturedAt;
      }
    }
  }

  const result = new Map<string, ContactContext>();
  for (const [name, data] of map) {
    const dsl = daysBetween(data.lastInteraction);
    const sentimentAvg = data.signalCount > 0 ? data.sentimentSum / data.signalCount : 0.5;
    const { strength, strengthLabel } = computeStrength({
      signalCount: data.signalCount,
      highPriority: data.highPriority,
      daysSinceLast: dsl,
      sentimentAvg,
      sourceDiversity: data.sources.size,
    });
    result.set(name, {
      ...data,
      daysSinceLast: dsl,
      strength,
      strengthLabel,
      sentimentScore: sentimentAvg,
      interactionDiversity: data.sources.size,
      sources: [...data.sources],
      signalTypes: [...data.signalTypes],
    });
  }

  return result;
}

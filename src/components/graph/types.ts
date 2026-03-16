import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";
import type { Signal, SignalType } from "@/data/signals";

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  signalCount: number;
  highPriority: number;
  lastInteraction: string;
  daysSinceLast: number;
  sources: string[];
  signalTypes: Record<string, number>;
  dominantType: SignalType;
  cluster: number;
}

export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  weight: number;
  sharedSignalTypes: string[];
}

export interface FocusedNode {
  node: GraphNode;
  screenX: number;
  screenY: number;
}

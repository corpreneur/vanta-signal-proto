export interface GraphNode {
  id: string;
  name: string;
  signalCount: number;
  highPriority: number;
  lastInteraction: string;
  daysSinceLast: number;
  sources: string[];
  signalTypes: Record<string, number>;
  dominantType: string;
  cluster: number;
  // d3-force mutable fields
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  sharedSignalTypes: string[];
  index?: number;
}

export interface FocusedNode {
  node: GraphNode;
  screenX: number;
  screenY: number;
}

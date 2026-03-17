import { useRef, useEffect, useState, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { select } from "d3-selection";
import type { GraphNode, GraphEdge, FocusedNode } from "./types";
import type { SignalType } from "@/data/signals";

// Color mapping using CSS variable HSL values for canvas rendering
const TYPE_COLORS: Record<string, string> = {
  INTRO: "hsl(30, 4%, 55%)",
  INSIGHT: "hsl(210, 100%, 50%)",
  INVESTMENT: "hsl(45, 100%, 45%)",
  DECISION: "hsl(280, 60%, 55%)",
  CONTEXT: "hsl(0, 0%, 45%)",
  NOISE: "hsl(0, 0%, 55%)",
  MEETING: "hsl(170, 70%, 40%)",
  PHONE_CALL: "hsl(340, 82%, 50%)",
};

const RECENCY_COLORS: [number, string][] = [
  [2, "hsl(30, 10%, 25%)"],       // < 2d  — dark/strong
  [7, "hsl(170, 70%, 35%)"],      // < 7d  — teal
  [30, "hsl(43, 90%, 45%)"],      // < 30d — amber
  [Infinity, "hsl(0, 0%, 60%)"],  // 30d+  — muted
];

function getRecencyColor(days: number): string {
  for (const [threshold, color] of RECENCY_COLORS) {
    if (days <= threshold) return color;
  }
  return RECENCY_COLORS[RECENCY_COLORS.length - 1][1];
}

// Cluster center positions (spread around center)
const CLUSTER_CENTERS = [
  { x: -80, y: -60 },
  { x: 80, y: -60 },
  { x: 0, y: 80 },
  { x: -80, y: 60 },
  { x: 80, y: 60 },
  { x: 0, y: -80 },
  { x: -120, y: 0 },
  { x: 120, y: 0 },
];

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  onFocus: (f: FocusedNode | null) => void;
}

export default function ForceGraph({ nodes, edges, width, height, onFocus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const transformRef = useRef(zoomIdentity);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const maxSignals = Math.max(...nodes.map((n) => n.signalCount), 1);

  const nodeRadius = useCallback(
    (n: GraphNode) => 8 + (n.signalCount / maxSignals) * 18,
    [maxSignals]
  );

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const t = transformRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // Edges
    for (const e of edgesRef.current) {
      const src = e.source as GraphNode;
      const tgt = e.target as GraphNode;
      if (!src.x || !src.y || !tgt.x || !tgt.y) continue;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      const alpha = Math.min(0.6, 0.15 + e.weight * 0.1);
      ctx.strokeStyle = `hsla(0, 0%, 30%, ${alpha})`;
      ctx.lineWidth = Math.min(3, 0.8 + e.weight * 0.4);
      ctx.stroke();
    }

    // Nodes
    for (const n of nodesRef.current) {
      if (n.x == null || n.y == null) continue;
      const r = nodeRadius(n);
      const typeColor = TYPE_COLORS[n.dominantType] || TYPE_COLORS.CONTEXT;

      // Drop shadow
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Fill — solid with moderate opacity
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = typeColor.replace("hsl(", "hsla(").replace(")", ", 0.35)");
      ctx.fill();
      ctx.restore();

      // Border
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = typeColor.replace("hsl(", "hsla(").replace(")", ", 0.8)");
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Recency ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = getRecencyColor(n.daysSinceLast);
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Count label — dark for readability
      ctx.fillStyle = "hsl(0, 0%, 15%)";
      ctx.font = `bold ${Math.max(10, r * 0.75)}px 'DM Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n.signalCount), n.x, n.y);

      // Name label
      if (t.k > 0.8 || r > 16) {
        ctx.fillStyle = "hsl(0, 0%, 25%)";
        ctx.font = `600 ${Math.max(9, 11 / Math.max(t.k, 0.6))}px 'DM Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = n.name.length > 14 ? n.name.slice(0, 12) + "…" : n.name;
        ctx.fillText(label, n.x, n.y + r + 6);
      }
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = "hsla(0, 0%, 92%, 1)";
    ctx.fill();
    ctx.strokeStyle = "hsl(0, 0%, 60%)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "hsl(0, 0%, 20%)";
    ctx.font = "bold 9px 'DM Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOU", 0, 0);

    ctx.restore();
  }, [nodeRadius]);

  // Setup simulation
  useEffect(() => {
    if (!nodes.length) return;

    const clonedNodes = nodes.map((n) => ({ ...n, x: n.x, y: n.y }));
    const clonedEdges = edges.map((e) => ({ ...e }));
    nodesRef.current = clonedNodes;
    edgesRef.current = clonedEdges;

    const sim = forceSimulation<GraphNode>(clonedNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphEdge>(clonedEdges)
          .id((d) => d.id)
          .distance((e) => 100 - Math.min(60, e.weight * 10))
          .strength((e) => Math.min(0.5, 0.05 + e.weight * 0.05))
      )
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(0, 0).strength(0.05))
      .force("collide", forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 6))
      .force(
        "clusterX",
        forceX<GraphNode>().x((d) => CLUSTER_CENTERS[d.cluster % CLUSTER_CENTERS.length].x).strength(0.04)
      )
      .force(
        "clusterY",
        forceY<GraphNode>().y((d) => CLUSTER_CENTERS[d.cluster % CLUSTER_CENTERS.length].y).strength(0.04)
      )
      .alphaDecay(0.02)
      .on("tick", draw);

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges, draw, nodeRadius]);

  // Setup zoom + click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sel = select<HTMLCanvasElement, unknown>(canvas);

    const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        draw();
      });

    sel.call(zoomBehavior);

    // Initial transform to center
    sel.call(zoomBehavior.transform, zoomIdentity.translate(width / 2, height / 2));

    // Click detection
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      const mx = (event.clientX - rect.left - t.x) / t.k;
      const my = (event.clientY - rect.top - t.y) / t.k;

      let hit: GraphNode | null = null;
      for (const n of nodesRef.current) {
        if (n.x == null || n.y == null) continue;
        const dx = n.x - mx;
        const dy = n.y - my;
        if (Math.sqrt(dx * dx + dy * dy) <= nodeRadius(n) + 4) {
          hit = n;
          break;
        }
      }

      if (hit) {
        onFocus({
          node: hit,
          screenX: event.clientX - rect.left,
          screenY: event.clientY - rect.top,
        });
      } else {
        onFocus(null);
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
      sel.on(".zoom", null);
    };
  }, [width, height, draw, nodeRadius, onFocus]);

  // Resize canvas for DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    draw();
  }, [width, height, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full cursor-grab active:cursor-grabbing"
      style={{ width, height }}
    />
  );
}

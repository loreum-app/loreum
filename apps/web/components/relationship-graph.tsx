"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { EntityType, Relationship } from "@loreum/types";
import {
  ReactFlow,
  Background,
  Controls,
  BaseEdge,
  getStraightPath,
  useConnection,
  useInternalNode,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type EdgeMouseHandler,
  type EdgeProps,
  type ConnectionLineComponentProps,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import { GripVertical, ExternalLink } from "lucide-react";
import "@xyflow/react/dist/style.css";

// --- Types ---

const TYPE_COLORS: Record<EntityType, string> = {
  CHARACTER: "#6366f1",
  LOCATION: "#10b981",
  ORGANIZATION: "#f59e0b",
  ITEM: "#8b5cf6",
};

interface RelationshipGraphProps {
  relationships: Relationship[];
  projectSlug: string;
  onRelationshipClick?: (relationship: Relationship) => void;
  onConnect?: (sourceSlug: string, targetSlug: string) => void;
}

// --- Floating edge utils ---

interface InternalNodeLike {
  internals: { positionAbsolute: { x: number; y: number } };
  measured?: { width?: number; height?: number };
}

function getNodeCenter(node: InternalNodeLike) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width ?? 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height ?? 0) / 2,
  };
}

function getEdgeParams(source: InternalNodeLike, target: InternalNodeLike) {
  const sc = getNodeCenter(source);
  const tc = getNodeCenter(target);

  const sw = source.measured?.width ?? 0;
  const sh = source.measured?.height ?? 0;
  const tw = target.measured?.width ?? 0;
  const th = target.measured?.height ?? 0;

  // Find intersection point on source node border
  const s = getNodeIntersection(sc, tc, sw, sh);
  // Find intersection point on target node border
  const t = getNodeIntersection(tc, sc, tw, th);

  return { sx: s.x, sy: s.y, tx: t.x, ty: t.y };
}

function getNodeIntersection(
  nodeCenter: { x: number; y: number },
  targetCenter: { x: number; y: number },
  width: number,
  height: number,
) {
  const dx = targetCenter.x - nodeCenter.x;
  const dy = targetCenter.y - nodeCenter.y;
  const w = width / 2;
  const h = height / 2;

  if (dx === 0 && dy === 0) return { x: nodeCenter.x, y: nodeCenter.y };

  const slope = Math.abs(dy / dx);
  const nodeSlope = h / w;

  let x: number;
  let y: number;

  if (slope <= nodeSlope) {
    // Intersects left or right
    x = dx > 0 ? w : -w;
    y = (x * dy) / dx;
  } else {
    // Intersects top or bottom
    y = dy > 0 ? h : -h;
    x = (y * dx) / dy;
  }

  return { x: nodeCenter.x + x, y: nodeCenter.y + y };
}

// --- Floating edge component ---

function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
  const [path] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={style}
      label={label}
      labelStyle={labelStyle}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  );
}

// --- Connection line (while dragging) ---

function FloatingConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  const [path] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={1.5}
        d={path}
      />
    </g>
  );
}

// --- Custom node component ---

interface EntityNodeData {
  name: string;
  entityType: string;
  slug: string;
  projectSlug: string;
  color?: string;
}

function EntityNode({ id, data }: { id: string; data: EntityNodeData }) {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode?.id !== id;
  const router = useRouter();

  return (
    <div className="relative rounded-lg border bg-card shadow-sm min-w-[120px] flex items-stretch transition-colors hover:border-foreground/30">
      {/* Source handle — covers the whole node for drag-to-connect */}
      {!connection.inProgress && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            transform: "none",
            borderRadius: "0.5rem",
            opacity: 0,
            border: "none",
            cursor: "crosshair",
          }}
        />
      )}

      {/* Target handle — whole node is a drop target during connection */}
      {(!connection.inProgress || isTarget) && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectableStart={false}
          style={{
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            transform: "none",
            borderRadius: "0.5rem",
            opacity: 0,
            border: "none",
          }}
        />
      )}

      {/* Drag handle — move node */}
      <div className="drag-handle relative z-10 flex items-center px-1.5 cursor-grab active:cursor-grabbing border-r border-border/50">
        <GripVertical className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {/* Node content — not interactive, connection handle covers it */}
      <div className="px-2.5 py-2 flex-1 min-w-0 pointer-events-none">
        <div className="flex items-center gap-1.5">
          {data.color && (
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
          )}
          <span className="text-sm font-medium truncate">{data.name}</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {data.entityType}
        </p>
      </div>

      {/* Navigate button — sits above the handle layer */}
      <button
        className="relative z-10 flex items-center px-1.5 border-l border-border/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          const typeRoute: Record<string, string> = {
            CHARACTER: "characters",
            LOCATION: "locations",
            ORGANIZATION: "organizations",
          };
          const route =
            typeRoute[data.entityType] ?? data.entityType.toLowerCase();
          router.push(
            `/projects/${data.projectSlug}/entities/${route}/${data.slug}`,
          );
        }}
        title={`View ${data.name}`}
      >
        <ExternalLink className="h-3 w-3" />
      </button>

      {/* Visual indicator when this node is a drop target */}
      {isTarget && (
        <div className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none" />
      )}
    </div>
  );
}

const nodeTypes = { entity: EntityNode };
const edgeTypes = { floating: FloatingEdge };

export function RelationshipGraph({
  relationships,
  projectSlug,
  onRelationshipClick,
  onConnect: onConnectProp,
}: RelationshipGraphProps) {
  const [savedLayout, setSavedLayout] = useState<Record<
    string,
    { x: number; y: number }
  > | null>(null);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // Load saved layout on mount
  useEffect(() => {
    api<Record<string, { x: number; y: number }>>(
      `/projects/${projectSlug}/graph-layout`,
    )
      .then((layout) =>
        setSavedLayout(
          layout && Object.keys(layout).length > 0 ? layout : null,
        ),
      )
      .catch(() => setSavedLayout(null))
      .finally(() => setLayoutLoaded(true));
  }, [projectSlug]);

  const { initialNodes, initialEdges } = useMemo(() => {
    // Don't compute nodes until layout has loaded — prevents useState
    // from initializing with grid-default positions before saved layout arrives
    if (!layoutLoaded)
      return { initialNodes: [] as Node[], initialEdges: [] as Edge[] };

    const nodeMap = new Map<
      string,
      {
        slug: string;
        name: string;
        entityType: string;
        color: string;
        connections: number;
      }
    >();

    const edges: Edge[] = [];

    for (const rel of relationships) {
      const src = rel.sourceEntity;
      const tgt = rel.targetEntity;

      if (!nodeMap.has(src.slug)) {
        nodeMap.set(src.slug, {
          slug: src.slug,
          name: src.name,
          entityType: src.type,
          color: TYPE_COLORS[src.type as EntityType] ?? "#888",
          connections: 0,
        });
      }
      nodeMap.get(src.slug)!.connections++;

      if (!nodeMap.has(tgt.slug)) {
        nodeMap.set(tgt.slug, {
          slug: tgt.slug,
          name: tgt.name,
          entityType: tgt.type,
          color: TYPE_COLORS[tgt.type as EntityType] ?? "#888",
          connections: 0,
        });
      }
      nodeMap.get(tgt.slug)!.connections++;

      edges.push({
        id: rel.id,
        source: src.slug,
        target: tgt.slug,
        type: "floating",
        label: rel.label,
        style: { stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: 1.5 },
        labelStyle: { fill: "rgba(255, 255, 255, 0.6)", fontSize: 11 },
        labelBgStyle: { fill: "rgba(0, 0, 0, 0.5)" },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: rel.bidirectional
          ? undefined
          : {
              type: MarkerType.ArrowClosed,
              color: "rgba(255,255,255,0.3)",
              width: 16,
              height: 16,
            },
      });
    }

    // Use saved layout if available, otherwise grid
    const entries = Array.from(nodeMap.entries());
    const count = entries.length;
    const cols = Math.ceil(Math.sqrt(count));
    const spacingX = 220;
    const spacingY = 100;

    const nodes: Node[] = entries.map(([slug, data], i) => {
      const saved = savedLayout?.[slug];
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: slug,
        type: "entity",
        dragHandle: ".drag-handle",
        position: saved ?? {
          x: col * spacingX + 50,
          y: row * spacingY + 50,
        },
        data: {
          name: data.name,
          entityType: data.entityType,
          color: data.color,
          slug: data.slug,
          projectSlug,
        },
      };
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [relationships, savedLayout, layoutLoaded, projectSlug]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Sync edges when relationships change (add/delete)
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  // Sync nodes: keep dragged positions, add new nodes, remove deleted ones
  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));

      // For existing nodes, keep their current position (preserves drags)
      // For new nodes, use the initialNodes position
      // Remove nodes no longer in initialNodes
      return initialNodes.map((n) => {
        const existing = currentById.get(n.id);
        return existing ? { ...n, position: existing.position } : n;
      });
    });
  }, [initialNodes]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  // Save position of dragged node
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const patch = { [node.id]: { x: node.position.x, y: node.position.y } };
      api(`/projects/${projectSlug}/graph-layout`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }).catch(() => {});
    },
    [projectSlug],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (!onRelationshipClick) return;
      const rel = relationships.find((r) => r.id === edge.id);
      if (rel) onRelationshipClick(rel);
    },
    [relationships, onRelationshipClick],
  );

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (onConnectProp && connection.source && connection.target) {
        onConnectProp(connection.source, connection.target);
      }
    },
    [onConnectProp],
  );

  if (relationships.length === 0 || !layoutLoaded) return null;

  return (
    <div className="w-full rounded-lg border bg-card" style={{ height: 550 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="rgba(255, 255, 255, 0.03)" gap={20} />
        <Controls
          showInteractive={false}
          className="bg-card! border-border! shadow-none! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-muted!"
        />
      </ReactFlow>
    </div>
  );
}

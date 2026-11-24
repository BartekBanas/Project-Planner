import { KeyboardEvent, PointerEvent, useId, useMemo, useRef, useState } from 'react';
import { CpmEvent, CpmSolution } from './cpmTypes';

type Point = { x: number; y: number };
type GraphNode = CpmEvent & Point & { rank: number; radiusX: number };
type Drag = { id: number; origin: Point; node: Point };
type EventLinks = { targets: number[]; remaining: number; rank: number };

const nodeRadiusY = 22;
const graphPadding = 76;
const columnWidth = 216;
const rowHeight = 108;

function buildLayout({ events, activities }: CpmSolution) {
  const successors = new Map<number, EventLinks>(events.map(({ id }) => [id, { targets: [], remaining: 0, rank: 0 }]));

  for (const { sequence: [source, target] } of activities) {
    const from = successors.get(source);
    const to = successors.get(target);
    if (from && to) {
      from.targets.push(target);
      to.remaining += 1;
    }
  }

  const ready = events.filter(({ id }) => successors.get(id)?.remaining === 0).map(({ id }) => id);
  for (let index = 0; index < ready.length; index += 1) {
    const from = successors.get(ready[index]);
    if (!from) continue;
    for (const target of from.targets) {
      const to = successors.get(target);
      if (to) {
        to.rank = Math.max(to.rank, from.rank + 1);
        to.remaining -= 1;
        if (to.remaining === 0) {
          ready.push(target);
        }
      }
    }
  }

  const columns = new Map<number, CpmEvent[]>();
  for (const event of [...events].sort((left, right) => left.id - right.id)) {
    const rank = successors.get(event.id)?.rank ?? 0;
    const column = columns.get(rank) ?? [];
    column.push(event);
    columns.set(rank, column);
  }

  const finalRank = Math.max(0, ...columns.keys());
  const maxRows = Math.max(1, ...Array.from(columns.values(), (column) => column.length));
  const width = Math.max(560, finalRank * columnWidth + graphPadding * 2);
  const height = Math.max(256, (maxRows - 1) * rowHeight + graphPadding * 2);
  const step = (width - graphPadding * 2) / Math.max(1, finalRank);
  const nodes: GraphNode[] = [];

  for (const [rank, column] of columns) {
    column.forEach((event, row) => nodes.push({
      ...event,
      rank,
      x: finalRank ? graphPadding + rank * step : width / 2,
      y: height / 2 + (row - (column.length - 1) / 2) * rowHeight,
      radiusX: Math.max(22, String(event.id).length * 4 + 8),
    }));
  }

  return { height, nodes, width };
}

function edgePath(source: GraphNode, target: GraphNode) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  const sourceRadius = 1 / (Math.hypot(unitX / source.radiusX, unitY / nodeRadiusY) || 1);
  const targetRadius = 1 / (Math.hypot(unitX / target.radiusX, unitY / nodeRadiusY) || 1) + 5;
  const startX = source.x + unitX * sourceRadius;
  const startY = source.y + unitY * sourceRadius;
  const endX = target.x - unitX * targetRadius;
  const endY = target.y - unitY * targetRadius;
  const curve = (endX - startX) * 0.38;
  const lift = target.rank - source.rank > 1 ? 52 : 0;
  const controlY = [startY - lift, endY - lift];

  return {
    path: `M ${startX} ${startY} C ${startX + curve} ${controlY[0]}, ${endX - curve} ${controlY[1]}, ${endX} ${endY}`,
    labelX: (startX + endX) / 2,
    labelY: (startY + endY) / 2 - lift * 0.75 - 12,
  };
}

const arrowKeys: Record<string, Point> = {
  ArrowLeft: { x: -12, y: 0 },
  ArrowRight: { x: 12, y: 0 },
  ArrowUp: { x: 0, y: -12 },
  ArrowDown: { x: 0, y: 12 },
};

export default function CPMDiagram({ solution }: { solution: CpmSolution }) {
  const layout = useMemo(() => buildLayout(solution), [solution]);
  const diagramId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [positions, setPositions] = useState<Record<number, Point>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const nodes = layout.nodes.map((node) => ({ ...node, ...positions[node.id] }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes.find((node) => node.rank === 0);
  const arrows = solution.activities.flatMap((activity) => {
    const source = byId.get(activity.sequence[0]);
    const target = byId.get(activity.sequence[1]);
    return source && target ? [{ ...edgePath(source, target), activity }] : [];
  });
  const arrowId = `${diagramId}-arrow`;
  const criticalArrowId = `${diagramId}-critical-arrow`;

  function svgPoint(event: PointerEvent<SVGGElement>) {
    const transform = svg.current?.getScreenCTM();
    return transform && new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
  }

  function placeNode(id: number, point: Point) {
    setPositions((current) => ({
      ...current,
      [id]: {
        x: Math.max(56, Math.min(layout.width - 56, point.x)),
        y: Math.max(32, Math.min(layout.height - 32, point.y)),
      },
    }));
  }

  function startDrag(event: PointerEvent<SVGGElement>, node: GraphNode) {
    const origin = svgPoint(event);
    if (event.button === 0 && origin) {
      setSelectedId(node.id);
      drag.current = { id: node.id, origin, node };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function moveDrag(event: PointerEvent<SVGGElement>, id: number) {
    const currentDrag = drag.current;
    if (currentDrag?.id !== id) return;
    const point = svgPoint(event);
    if (point) {
      placeNode(id, {
        x: currentDrag.node.x + point.x - currentDrag.origin.x,
        y: currentDrag.node.y + point.y - currentDrag.origin.y,
      });
    }
  }

  function moveWithKeyboard(event: KeyboardEvent<SVGGElement>, node: GraphNode) {
    const offset = arrowKeys[event.key];
    if (!offset) return;
    event.preventDefault();
    placeNode(node.id, { x: node.x + offset.x, y: node.y + offset.y });
  }

  return (
    <figure className="cpm-diagram">
      <figcaption className="cpm-diagram-caption">
        <div className="cpm-diagram-legend">
          <span><i aria-hidden="true" /> Ścieżka krytyczna</span>
          <span><i aria-hidden="true" /> Pozostałe czynności</span>
        </div>
        {Object.keys(positions).length > 0 && (
          <button className="button" type="button" onClick={() => setPositions({})}>Przywróć układ</button>
        )}
      </figcaption>
      <div className="cpm-diagram-scroll" role="region" tabIndex={0} aria-label="Graf zależności">
        <svg
          ref={svg}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          aria-labelledby={`${diagramId}-title`}
          aria-describedby={`${diagramId}-description`}
        >
          <title id={`${diagramId}-title`}>Graf zależności między zdarzeniami</title>
          <desc id={`${diagramId}-description`}>Przeciągnij zdarzenie, aby je przesunąć, lub wybierz je i użyj klawiszy strzałek.</desc>
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 10 5 L 0 10 Z" className="cpm-edge-arrow" />
            </marker>
            <marker id={criticalArrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 10 5 L 0 10 Z" className="cpm-edge-arrow cpm-edge-arrow-critical" />
            </marker>
          </defs>
          <g aria-hidden="true">
            {arrows.map(({ path, activity }) => (
              <path
                key={activity.id}
                className={activity.critical ? 'cpm-edge cpm-edge-critical' : 'cpm-edge'}
                d={path}
                markerEnd={`url(#${activity.critical ? criticalArrowId : arrowId})`}
              />
            ))}
            {arrows.map(({ labelX, labelY, activity }) => (
              <text
                key={activity.id}
                className={activity.critical ? 'cpm-edge-label cpm-edge-label-critical' : 'cpm-edge-label'}
                x={labelX}
                y={labelY}
                textAnchor="middle"
              >
                <title>{activity.taskName} · {activity.duration}</title>
                {activity.taskName.length > 20 ? `${activity.taskName.slice(0, 19)}…` : activity.taskName} · {activity.duration}
              </text>
            ))}
          </g>
          {nodes.map((node) => (
            <g
              key={node.id}
              className={node.timeReserve === 0 ? 'cpm-graph-node cpm-graph-node-critical' : 'cpm-graph-node'}
              transform={`translate(${node.x}, ${node.y})`}
              tabIndex={0}
              role="group"
              aria-label={`Zdarzenie ${node.id}, najwcześniej ${node.earliestTime}, najpóźniej ${node.latestTime}, rezerwa ${node.timeReserve}`}
              data-selected={selectedNode?.id === node.id}
              onFocus={() => setSelectedId(node.id)}
              onPointerDown={(event) => startDrag(event, node)}
              onPointerMove={(event) => moveDrag(event, node.id)}
              onLostPointerCapture={() => { drag.current = null; }}
              onKeyDown={(event) => moveWithKeyboard(event, node)}
            >
              <title>Zdarzenie {node.id} · {node.earliestTime}–{node.latestTime}</title>
              <ellipse rx={node.radiusX} ry={nodeRadiusY} />
              <text textAnchor="middle" dominantBaseline="central" aria-hidden="true">{node.id}</text>
            </g>
          ))}
        </svg>
      </div>
      {selectedNode && (
        <dl className="cpm-node-details" aria-label="Terminy wybranego zdarzenia">
          <div><dt>Zdarzenie</dt><dd>{selectedNode.id}</dd></div>
          <div><dt>Najwcześniej</dt><dd>{selectedNode.earliestTime}</dd></div>
          <div><dt>Najpóźniej</dt><dd>{selectedNode.latestTime}</dd></div>
          <div><dt>Rezerwa</dt><dd>{selectedNode.timeReserve}</dd></div>
        </dl>
      )}
    </figure>
  );
}

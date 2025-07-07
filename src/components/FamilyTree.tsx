
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { User } from '@/lib/data';
import {
  findUserById,
  findParents,
  findChildren,
  findSiblings,
  findGrandparents,
} from '@/lib/data';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from './ui/button';

const nodeWidth = 180;
const nodeHeight = 70;
const horizontalSpacing = 40;
const verticalSpacing = 140;

// --- In-Law Helper ---
function findMaternalInLaws(centralUser: User, allUsers: User[]) {
  const { mother } = findParents(centralUser, allUsers);
  if (!mother) return { nana: null, nani: null, mama: [], masi: [] };

  const { father: nana, mother: nani } = findParents(mother, allUsers);
  const siblings = findSiblings(mother, allUsers);
  const mama = siblings.filter((u) => u.gender === 'male');
  const masi = siblings.filter((u) => u.gender === 'female');
  return { nana, nani, mama, masi };
}

// --- Custom Node Components ---
const PersonNode = ({ data, selected }: { data: any, selected: boolean }) => {
  const router = useRouter();

  const handleNodeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/tree/${data.user.id}`);
  };

  const borderClass = useMemo(() => {
    if (data.isCentral) return 'border-primary ring-2 ring-primary/30';
    if (data.user.gender === 'male') return 'border-sky-500';
    if (data.user.gender === 'female') return 'border-rose-500';
    return 'border-slate-300 dark:border-slate-700';
  }, [data.isCentral, data.user.gender]);

  return (
    <div
      onDoubleClick={handleNodeDoubleClick}
      title="Double-click to recenter tree"
      className={`flex items-center p-3 rounded-lg text-center transition-all duration-300 z-10 bg-white dark:bg-slate-900 border-2 shadow-md hover:shadow-lg cursor-pointer nodrag
        ${borderClass}
        ${selected ? 'ring-4 ring-accent' : ''}
      `}
      style={{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
    >
      <Image
        src={data.user.profilePictureUrl}
        alt={data.user.name}
        width={45}
        height={45}
        data-ai-hint="profile avatar"
        className="rounded-full border-2 border-slate-200 dark:border-slate-800 flex-shrink-0"
      />
      <div className="ml-3 text-left overflow-hidden">
        <p className="font-bold text-sm text-primary dark:text-primary-foreground truncate">
          {data.user.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {data.relationship}
        </p>
      </div>
    </div>
  );
};

const HubNode = () => (
  <div
    className="w-3 h-3 rounded-full bg-gray-400 border border-gray-600"
    style={{ margin: 'auto' }}
    title="Connector"
  />
);

// --- Layout Helper ---
const createLayout = (
  centralUser: User,
  allUsers: User[],
): { initialNodes: Node[]; initialEdges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedNodeIds = new Set<string>();

  const addNode = (
    user: User | null | undefined,
    data: object,
    position: { x: number; y: number },
    branch: 'central' | 'paternal' | 'maternal' | 'inlaws'
  ): User | null | undefined => {
    if (!user || addedNodeIds.has(user.id)) return user;
    nodes.push({
      id: user.id,
      type: 'person',
      position,
      data: { user, ...data, branch },
      draggable: true,
    });
    addedNodeIds.add(user.id);
    return user;
  };

  const addHubNode = (id: string, position: { x: number; y: number }) => {
    nodes.push({
      id,
      type: 'hub',
      position,
      style: { width: 12, height: 12, opacity: 1, zIndex: 2 },
      hidden: false,
      draggable: false,
      selectable: false,
    });
  };

  const addEdge = (
    source: string | undefined,
    target: string | undefined,
    options: Partial<Edge> = {},
  ) => {
    if (!source || !target) return;
    const defaultOptions = {
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--border))' },
      style: { strokeWidth: 1.5, stroke: 'hsl(var(--border))' },
      type: 'smoothstep',
    };
    edges.push({
      id: `e-${source}-${target}`,
      source,
      target,
      ...defaultOptions,
      ...options,
    });
  };

  const marriageEdgeOptions: Partial<Edge> = {
    type: 'default',
    markerEnd: undefined,
    style: { strokeWidth: 2, stroke: 'hsl(var(--accent))', strokeDasharray: '5,5' },
  };

  // --- Define People ---
  const spouse = findUserById(centralUser.spouseId, allUsers);
  const { father, mother } = findParents(centralUser, allUsers);
  const siblings = findSiblings(centralUser, allUsers);
  const children = findChildren(centralUser, allUsers);
  const {
    paternalGrandfather,
    paternalGrandmother,
    maternalGrandfather,
    maternalGrandmother,
  } = findGrandparents(centralUser, allUsers);
  const { nana, nani, mama, masi } = findMaternalInLaws(centralUser, allUsers);

  // --- Positions ---
  const centralPos = { x: 0, y: 0 };
  const spousePos = { x: centralPos.x + nodeWidth + horizontalSpacing, y: centralPos.y };
  const coupleCenterX = spouse
    ? centralPos.x + (nodeWidth + horizontalSpacing) / 2
    : centralPos.x + nodeWidth / 2;

  const parentY = centralPos.y - verticalSpacing;
  const fatherPos = { x: coupleCenterX - nodeWidth / 2 - horizontalSpacing / 2, y: parentY };
  const motherPos = { x: coupleCenterX + nodeWidth / 2 + horizontalSpacing / 2, y: parentY };

  const grandparentY = parentY - verticalSpacing;
  const pGrandfatherPos = { x: fatherPos.x - nodeWidth / 2 - horizontalSpacing / 2, y: grandparentY };
  const pGrandmotherPos = { x: fatherPos.x + nodeWidth / 2 + horizontalSpacing / 2, y: grandparentY };
  const mGrandfatherPos = { x: motherPos.x - nodeWidth / 2 - horizontalSpacing / 2, y: grandparentY };
  const mGrandmotherPos = { x: motherPos.x + nodeWidth / 2 + horizontalSpacing / 2, y: grandparentY };

  const inLawStartX = centralPos.x - 2 * (nodeWidth + horizontalSpacing);
  const inLawGrandparentY = parentY - verticalSpacing;
  const nanaPos = { x: inLawStartX, y: inLawGrandparentY };
  const naniPos = { x: inLawStartX + nodeWidth + horizontalSpacing, y: inLawGrandparentY };
  const uncleStartY = inLawGrandparentY + verticalSpacing;

  // --- Create Nodes ---
  addNode(centralUser, { relationship: 'Self', isCentral: true }, centralPos, 'central');
  addNode(spouse, { relationship: 'Spouse' }, spousePos, 'central');
  addNode(father, { relationship: 'Father' }, fatherPos, 'paternal');
  addNode(mother, { relationship: 'Mother' }, motherPos, 'maternal');
  addNode(paternalGrandfather, { relationship: 'Paternal Grandfather' }, pGrandfatherPos, 'paternal');
  addNode(paternalGrandmother, { relationship: 'Paternal Grandmother' }, pGrandmotherPos, 'paternal');
  addNode(maternalGrandfather, { relationship: 'Maternal Grandfather' }, mGrandfatherPos, 'maternal');
  addNode(maternalGrandmother, { relationship: 'Maternal Grandmother' }, mGrandmotherPos, 'maternal');

  const siblingX = centralPos.x - nodeWidth - horizontalSpacing;
  siblings.forEach((s, i) => addNode(s, { relationship: s.gender === 'male' ? 'Brother' : 'Sister' }, { x: siblingX, y: centralPos.y + i * (nodeHeight + 20) }, 'central'));

  if (children.length > 0) {
    const childrenTotalWidth = children.length * nodeWidth + (children.length - 1) * horizontalSpacing;
    const childrenStartX = coupleCenterX - childrenTotalWidth / 2;
    children.forEach((c, i) => addNode(c, { relationship: c.gender === 'male' ? 'Son' : 'Daughter' }, { x: childrenStartX + i * (nodeWidth + horizontalSpacing), y: centralPos.y + verticalSpacing }, 'central'));
  }

  addNode(nana, { relationship: 'Nana' }, nanaPos, 'inlaws');
  addNode(nani, { relationship: 'Nani' }, naniPos, 'inlaws');
  mama.forEach((u, i) => addNode(u, { relationship: 'Mama' }, { x: inLawStartX, y: uncleStartY + i * (nodeHeight + 20) }, 'inlaws'));
  masi.forEach((u, i) => addNode(u, { relationship: 'Masi' }, { x: inLawStartX + nodeWidth + horizontalSpacing, y: uncleStartY + i * (nodeHeight + 20) }, 'inlaws'));
  
  // --- Create Edges & Hubs ---
  if (spouse) addEdge(centralUser.id, spouse.id, marriageEdgeOptions);

  if (father && mother) {
    const parentHubId = `hub-${father.id}-${mother.id}`;
    addHubNode(parentHubId, { x: coupleCenterX, y: parentY + verticalSpacing / 2 });
    addEdge(father.id, parentHubId);
    addEdge(mother.id, parentHubId);
    addEdge(parentHubId, centralUser.id);
    siblings.forEach((s) => addEdge(parentHubId, s.id));
  } else {
    addEdge(father?.id, centralUser.id);
    addEdge(mother?.id, centralUser.id);
    siblings.forEach((s) => { addEdge(father?.id, s.id); addEdge(mother?.id, s.id); });
  }

  if (father) {
    addEdge(paternalGrandfather?.id, father.id);
    addEdge(paternalGrandmother?.id, father.id);
    if (paternalGrandfather && paternalGrandmother) addEdge(paternalGrandfather.id, paternalGrandmother.id, marriageEdgeOptions);
  }
  if (mother) {
    addEdge(maternalGrandfather?.id, mother.id);
    addEdge(maternalGrandmother?.id, mother.id);
    if (maternalGrandfather && maternalGrandmother) addEdge(maternalGrandfather.id, maternalGrandmother.id, marriageEdgeOptions);
  }

  if (children.length > 0) {
    const childrenHubId = `hub-${centralUser.id}`;
    addHubNode(childrenHubId, { x: coupleCenterX, y: centralPos.y + verticalSpacing / 2 });
    addEdge(centralUser.id, childrenHubId);
    if (spouse) addEdge(spouse.id, childrenHubId);
    children.forEach((child) => addEdge(childrenHubId, child.id));
  }

  if (nana && nani) addEdge(nana.id, nani.id, marriageEdgeOptions);
  if(mother) { addEdge(nana?.id, mother.id); addEdge(nani?.id, mother.id); }
  mama.forEach((u) => { addEdge(nana?.id, u.id); addEdge(nani?.id, u.id); });
  masi.forEach((u) => { addEdge(nana?.id, u.id); addEdge(nani?.id, u.id); });

  return { initialNodes: nodes, initialEdges: edges };
};

// --- Path-Finding Helper ---
function findPath(edges: Edge[], from: string, to: string): string[] {
  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);
  
  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (node === to) return path;

    const neighbors = edges.flatMap(e => {
        if (e.source === node && !visited.has(e.target)) return [e.target];
        if (e.target === node && !visited.has(e.source)) return [e.source];
        return [];
    });

    for(const neighbor of neighbors) {
        if(!visited.has(neighbor)) {
            visited.add(neighbor);
            const newPath = [...path, neighbor];
            queue.push(newPath);
        }
    }
  }
  return [];
}

// --- Main Component ---
export default function FamilyTree({ centralUser, allUsers }: { centralUser: User; allUsers: User[] }) {
  const [filter, setFilter] = useState<'all' | 'paternal' | 'maternal' | 'inlaws'>('all');
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { initialNodes, initialEdges } = createLayout(centralUser, allUsers);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setHighlightedEdgeIds(new Set());
  }, [centralUser, allUsers]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const path = findPath(edges, centralUser.id, node.id);
    const pathEdgeIds = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(
        (e) => (e.source === path[i] && e.target === path[i + 1]) || (e.target === path[i] && e.source === path[i + 1])
      );
      if (edge) pathEdgeIds.add(edge.id);
    }
    setHighlightedEdgeIds(pathEdgeIds);
  }, [centralUser.id, edges]);

  const nodeTypes = useMemo(() => ({
      person: (props: any) => <PersonNode {...props} selected={props.id === selectedNodeId} />,
      hub: HubNode,
    }), [selectedNodeId]);
  
  const nodesWithVisibility = useMemo(() => {
    if (filter === 'all') {
      return nodes.map((n) => ({ ...n, hidden: false }));
    }

    const { father, mother } = findParents(centralUser, allUsers);
    return nodes.map((n) => {
      const branch = n.data?.branch;
      let isVisible = false;

      // Hub nodes are always kept in the graph to maintain structure
      if (n.type === 'hub') {
        isVisible = true;
      } else if (branch === 'central') {
        isVisible = true;
      } else if (filter === 'paternal') {
        // Show paternal branch, and the mother to keep the connection logical
        isVisible = branch === 'paternal' || n.id === mother?.id;
      } else if (filter === 'maternal') {
        // Show maternal branch, and the father to keep the connection logical
        isVisible = branch === 'maternal' || n.id === father?.id;
      } else if (filter === 'inlaws') {
        // Show inlaws branch, and the mother to keep the connection logical
        isVisible = branch === 'inlaws' || n.id === mother?.id;
      }

      return { ...n, hidden: !isVisible };
    });
  }, [nodes, filter, centralUser, allUsers]);


  const edgesWithHighlight = useMemo(() => {
    const marriageEdgeIds = new Set(edges.filter(e => e.style?.stroke === 'hsl(var(--accent))').map(e => e.id));
    return edges.map((edge) => {
      const isHighlighted = highlightedEdgeIds.has(edge.id);
      const isMarriageEdge = marriageEdgeIds.has(edge.id);
      
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isHighlighted ? 'hsl(var(--ring))' : edge.style?.stroke,
          strokeWidth: isHighlighted ? 3 : edge.style?.strokeWidth,
        },
        zIndex: isHighlighted ? 10 : (isMarriageEdge ? 1 : 0),
      };
    });
  }, [edges, highlightedEdgeIds]);


  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button size="sm" variant={filter === 'paternal' ? 'default' : 'outline'} onClick={() => setFilter('paternal')}>Paternal</Button>
        <Button size="sm" variant={filter === 'maternal' ? 'default' : 'outline'} onClick={() => setFilter('maternal')}>Maternal</Button>
        <Button size="sm" variant={filter === 'inlaws' ? 'default' : 'outline'} onClick={() => setFilter('inlaws')}>In-Laws</Button>
      </div>
      <ReactFlow
        nodes={nodesWithVisibility}
        edges={edgesWithHighlight}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-50 dark:bg-slate-900/50"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

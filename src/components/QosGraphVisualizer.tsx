import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, RotateCcw, PlusCircle, Trash2, Sliders, Info, Zap, HelpCircle, ArrowRight, Save, Network
} from 'lucide-react';
import { GraphNode, GraphEdge, AlgorithmStep, QoSAlgorithm } from '../types';

// Default routing network
const INITIAL_NODES: GraphNode[] = [
  { id: '1', label: 'Client (A)', x: 80, y: 150 },
  { id: '2', label: 'Edge-Router (B)', x: 220, y: 70 },
  { id: '3', label: 'Core-East (C)', x: 220, y: 230 },
  { id: '4', label: 'Core-West (D)', x: 380, y: 70 },
  { id: '5', label: 'Edge-Local (E)', x: 380, y: 230 },
  { id: '6', label: 'Server (Z)', x: 520, y: 150 },
];

const INITIAL_EDGES: GraphEdge[] = [
  { id: 'e1-2', source: '1', target: '2', delay: 10, bandwidth: 100, cost: 5 },
  { id: 'e1-3', source: '1', target: '3', delay: 25, bandwidth: 40, cost: 2 },
  { id: 'e2-4', source: '2', target: '4', delay: 15, bandwidth: 80, cost: 4 },
  { id: 'e2-3', source: '2', target: '3', delay: 8, bandwidth: 20, cost: 1 },
  { id: 'e3-5', source: '3', target: '5', delay: 12, bandwidth: 50, cost: 3 },
  { id: 'e4-5', source: '4', target: '5', delay: 10, bandwidth: 30, cost: 2 },
  { id: 'e4-6', source: '4', target: '6', delay: 8, bandwidth: 100, cost: 6 },
  { id: 'e5-6', source: '5', target: '6', delay: 20, bandwidth: 80, cost: 3 },
];

export default function QosGraphVisualizer() {
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  
  // Selection
  const [selectedAlgo, setSelectedAlgo] = useState<QoSAlgorithm>('dijkstra');
  const [sourceNode, setSourceNode] = useState<string>('1');
  const [destNode, setDestNode] = useState<string>('6');
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Constraints for Multi-Constrained Path
  const [delayConstraint, setDelayConstraint] = useState<number>(35);
  const [bwConstraint, setBwConstraint] = useState<number>(50);

  // Drag state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Step-by-step state
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // New Node & Edge form
  const [newNodeLabel, setNewNodeLabel] = useState<string>('');
  const [newEdgeSource, setNewEdgeSource] = useState<string>('');
  const [newEdgeTarget, setNewEdgeTarget] = useState<string>('');
  const [newEdgeDelay, setNewEdgeDelay] = useState<number>(15);
  const [newEdgeBw, setNewEdgeBw] = useState<number>(100);
  const [newEdgeCost, setNewEdgeCost] = useState<number>(5);

  // Auto Reset algorithms on Graph metric edit
  const resetAlgorithm = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setSteps([]);
  };

  const handleSvgMouseDown = () => {
    // clear active selections
    setSelectedEdge(null);
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNodeId(id);
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Keep nodes within logical bounds
    const boundedX = Math.max(20, Math.min(rect.width - 20, x));
    const boundedY = Math.max(20, Math.min(rect.height - 20, y));

    setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: boundedX, y: boundedY } : n));
    resetAlgorithm();
  };

  const handleSvgMouseUp = () => {
    setDraggedNodeId(null);
  };

  // Run Algorithms & Compile Steps
  const compileSteps = () => {
    const computedSteps: AlgorithmStep[] = [];
    const nodeIdList = nodes.map(n => n.id);

    if (selectedAlgo === 'dijkstra') {
      // Shortest Delay Metric Dijkstra
      const dist: Record<string, number> = {};
      const prev: Record<string, string | null> = {};
      const visited: string[] = [];

      nodeIdList.forEach(id => {
        dist[id] = id === sourceNode ? 0 : Infinity;
        prev[id] = null;
      });

      computedSteps.push({
        visited: [],
        currentNode: null,
        distances: { ...dist },
        bandwidths: {},
        predecessors: { ...prev },
        explanation: `Initialize dijkstra's execution. Source Node is A. All other nodes labeled infinity delay.`
      });

      const unvisited = [...nodeIdList];

      while (unvisited.length > 0) {
        // Find node in unvisited with min dist
        unvisited.sort((a, b) => dist[a] - dist[b]);
        const current = unvisited[0];

        if (dist[current] === Infinity) {
          computedSteps.push({
            visited: [...visited],
            currentNode: null,
            distances: { ...dist },
            bandwidths: {},
            predecessors: { ...prev },
            explanation: `Remaining nodes are unreachable. Dijkstra execution complete.`
          });
          break;
        }

        unvisited.shift();
        visited.push(current);

        computedSteps.push({
          visited: [...visited],
          currentNode: current,
          distances: { ...dist },
          bandwidths: {},
          predecessors: { ...prev },
          explanation: `Selecting node with minimal temporary delay label: Node ${nodes.find(n => n.id === current)?.label}.`
        });

        if (current === destNode) {
          computedSteps.push({
            visited: [...visited],
            currentNode: current,
            distances: { ...dist },
            bandwidths: {},
            predecessors: { ...prev },
            explanation: `Destination ${nodes.find(n => n.id === destNode)?.label} reached successfully. Shortest path is traced.`
          });
          break;
        }

        // Relaxation
        const neighbors = edges.filter(e => e.source === current || e.target === current);
        neighbors.forEach(edge => {
          const neighbor = edge.source === current ? edge.target : edge.source;
          if (unvisited.includes(neighbor)) {
            const alt = dist[current] + edge.delay;
            const updated = alt < dist[neighbor];
            
            if (updated) {
              dist[neighbor] = alt;
              prev[neighbor] = current;
            }

            computedSteps.push({
              visited: [...visited],
              currentNode: current,
              distances: { ...dist },
              bandwidths: {},
              predecessors: { ...prev },
              activeEdge: edge.id,
              explanation: `Relaxing edge between node ${nodes.find(n => n.id === current)?.label} and ${nodes.find(n => n.id === neighbor)?.label}. Custom computed total path delay: ${alt}ms. ${updated ? 'Updated shorter label.' : 'Kept current label.'}`
            });
          }
        });
      }

      setSteps(computedSteps);
      setCurrentStepIndex(0);

    } else if (selectedAlgo === 'widest-path') {
      // Bottleneck Bandwidth Dijkstra Maximize
      const bw: Record<string, number> = {};
      const prev: Record<string, string | null> = {};
      const visited: string[] = [];

      nodeIdList.forEach(id => {
        bw[id] = id === sourceNode ? Infinity : -1;
        prev[id] = null;
      });

      computedSteps.push({
        visited: [],
        currentNode: null,
        distances: {},
        bandwidths: { ...bw },
        predecessors: { ...prev },
        explanation: `Initialize Widest Path optimization. Source Node has infinite capacity. All others are 0.`
      });

      const unvisited = [...nodeIdList];

      while (unvisited.length > 0) {
        // Select node with largest capacity
        unvisited.sort((a, b) => bw[b] - bw[a]);
        const current = unvisited[0];

        if (bw[current] === -1) {
          computedSteps.push({
            visited: [...visited],
            currentNode: null,
            distances: {},
            bandwidths: { ...bw },
            predecessors: { ...prev },
            explanation: `No active path with bandwidth capacity left.`
          });
          break;
        }

        unvisited.shift();
        visited.push(current);

        computedSteps.push({
          visited: [...visited],
          currentNode: current,
          distances: {},
          bandwidths: { ...bw },
          predecessors: { ...prev },
          explanation: `Extracting Node ${nodes.find(n => n.id === current)?.label} possessing maximum bottleneck width: ${bw[current]} Mbps.`
        });

        const neighbors = edges.filter(e => e.source === current || e.target === current);
        neighbors.forEach(edge => {
          const neighbor = edge.source === current ? edge.target : edge.source;
          if (unvisited.includes(neighbor)) {
            // New bottleneck is the min of current bottleneck and edge bandwidth
            const possibleBw = Math.min(bw[current], edge.bandwidth);
            const updated = possibleBw > bw[neighbor];
            if (updated) {
              bw[neighbor] = possibleBw;
              prev[neighbor] = current;
            }

            computedSteps.push({
              visited: [...visited],
              currentNode: current,
              distances: {},
              bandwidths: { ...bw },
              predecessors: { ...prev },
              activeEdge: edge.id,
              explanation: `Checking neighbor node ${nodes.find(n => n.id === neighbor)?.label}. Edge width is ${edge.bandwidth} Mbps. Candidate bottleneck limit: min(${bw[current]} Mbps, ${edge.bandwidth} Mbps) = ${possibleBw} Mbps. ${updated ? "New widest routing set." : "Kept previous route."}`
            });
          }
        });
      }

      setSteps(computedSteps);
      setCurrentStepIndex(0);

    } else if (selectedAlgo === 'multi-constrained') {
      // Find a standard valid path delay <= delayConstraint AND bandwidth >= bwConstraint
      const pathList: string[][] = [];
      const visitedNodes: string[] = [];
      
      const findAllPaths = (curr: string, dest: string, currentPath: string[]) => {
        visitedNodes.push(curr);
        const nextPath = [...currentPath, curr];

        if (curr === dest) {
          pathList.push(nextPath);
        } else {
          const neighbors = edges.filter(e => e.source === curr || e.target === curr);
          neighbors.forEach(edge => {
            const neighbor = edge.source === curr ? edge.target : edge.source;
            if (!visitedNodes.includes(neighbor)) {
              findAllPaths(neighbor, dest, nextPath);
            }
          });
        }
        
        const idx = visitedNodes.indexOf(curr);
        if (idx > -1) visitedNodes.splice(idx, 1);
      };

      findAllPaths(sourceNode, destNode, []);

      // Filter paths according to constraint evaluation
      const mappedPaths = pathList.map(path => {
        let totalDelay = 0;
        let bottleneckBw = Infinity;
        let totalCost = 0;

        for (let i = 0; i < path.length - 1; i++) {
          const u = path[i];
          const v = path[i+1];
          const edge = edges.find(e => (e.source === u && e.target === v) || (e.source === v && e.target === u));
          if (edge) {
            totalDelay += edge.delay;
            bottleneckBw = Math.min(bottleneckBw, edge.bandwidth);
            totalCost += edge.cost;
          }
        }
        return { path, totalDelay, bottleneckBw, totalCost };
      });

      const validPaths = mappedPaths.filter(p => p.totalDelay <= delayConstraint && p.bottleneckBw >= bwConstraint);

      computedSteps.push({
        visited: [sourceNode],
        currentNode: sourceNode,
        distances: { [destNode]: delayConstraint },
        bandwidths: { [destNode]: bwConstraint },
        predecessors: {},
        explanation: `Evaluate Multi-Constrained constraints: Find a path where Latency <= ${delayConstraint}ms AND Bandwidth >= ${bwConstraint} Mbps. Found ${mappedPaths.length} academic paths.`
      });

      mappedPaths.forEach((p, idx) => {
        const isValid = p.totalDelay <= delayConstraint && p.bottleneckBw >= bwConstraint;
        computedSteps.push({
          visited: p.path,
          currentNode: null,
          distances: { [destNode]: p.totalDelay },
          bandwidths: { [destNode]: p.bottleneckBw },
          predecessors: {},
          explanation: `Analyzing candidate path: [${p.path.map(nId => nodes.find(n => n.id === nId)?.label.split(' ')[0]).join(' ➜ ')}]. Delay = ${p.totalDelay}ms, Bottleneck = ${p.bottleneckBw} Mbps. ${isValid ? 'COMPLIANT! Graph markers updated.' : 'REJECTED: Constraint Violation.'}`
        });
      });

      setSteps(computedSteps);
      setCurrentStepIndex(0);

    } else if (selectedAlgo === 'mst') {
      // Prim's Minimum Spanning Tree visualizer
      const parent: Record<string, string | null> = {};
      const key: Record<string, number> = {};
      const mstSet: string[] = [];

      nodeIdList.forEach(id => {
        key[id] = id === sourceNode ? 0 : Infinity;
        parent[id] = null;
      });

      computedSteps.push({
        visited: [],
        currentNode: null,
        distances: { ...key },
        bandwidths: {},
        predecessors: { ...parent },
        explanation: `Prim's Spanning Tree initialization. Starting with node ${nodes.find(n => n.id === sourceNode)?.label} costing 0.`
      });

      for (let count = 0; count < nodes.length; count++) {
        // Find Node with min key not in MST
        const eligibleNodes = nodeIdList.filter(id => !mstSet.includes(id));
        if (eligibleNodes.length === 0) break;
        eligibleNodes.sort((a, b) => key[a] - key[b]);
        const u = eligibleNodes[0];

        if (key[u] === Infinity) {
          computedSteps.push({
            visited: [...mstSet],
            currentNode: null,
            distances: { ...key },
            bandwidths: {},
            predecessors: { ...parent },
            explanation: `Disconnected component encountered. MST is partially complete.`
          });
          break;
        }

        mstSet.push(u);

        computedSteps.push({
          visited: [...mstSet],
          currentNode: u,
          distances: { ...key },
          bandwidths: {},
          predecessors: { ...parent },
          explanation: `Extracting node with minimal connectivity cost: Node ${nodes.find(n => n.id === u)?.label}.`
        });

        const neighbors = edges.filter(e => e.source === u || e.target === u);
        neighbors.forEach(edge => {
          const v = edge.source === u ? edge.target : edge.source;
          if (!mstSet.includes(v) && edge.cost < key[v]) {
            parent[v] = u;
            key[v] = edge.cost;

            computedSteps.push({
              visited: [...mstSet],
              currentNode: u,
              distances: { ...key },
              bandwidths: {},
              predecessors: { ...parent },
              activeEdge: edge.id,
              explanation: `Updating neighbor ${nodes.find(n => n.id === v)?.label}. Current Link Cost ${edge.cost} is cheaper than its current key value.`
            });
          }
        });
      }

      setSteps(computedSteps);
      setCurrentStepIndex(0);
    }
  };

  // Run automatically when dependencies change or algorithm changes
  useEffect(() => {
    compileSteps();
  }, [selectedAlgo, sourceNode, destNode, delayConstraint, bwConstraint, edges, nodes]);

  // Stepper timeline
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    
    const token = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(token);
  }, [isPlaying, steps]);

  // Derive active paths/predecessors for highlighted layout
  const stepState = useMemo(() => {
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return {
        visited: [],
        current: null,
        distances: {},
        bandwidths: {},
        predecessors: {},
        explanation: 'Click "Play Steps" or move slider to witness Routing iterations.',
        activeEdgeId: undefined,
      };
    }
    return {
      visited: steps[currentStepIndex].visited,
      current: steps[currentStepIndex].currentNode,
      distances: steps[currentStepIndex].distances,
      bandwidths: steps[currentStepIndex].bandwidths,
      predecessors: steps[currentStepIndex].predecessors,
      explanation: steps[currentStepIndex].explanation,
      activeEdgeId: steps[currentStepIndex].activeEdge,
    };
  }, [steps, currentStepIndex]);

  // Re-trace solution path from parents
  const solvedPathEdges = useMemo(() => {
    const pathEdgesSet = new Set<string>();
    
    if (selectedAlgo === 'multi-constrained') {
      // In MCP tab, the steps visited visualizes the compliant selected path directly
      if (stepState.explanation.includes('COMPLIANT')) {
        for (let i = 0; i < stepState.visited.length - 1; i++) {
          const u = stepState.visited[i];
          const v = stepState.visited[i+1];
          const edge = edges.find(e => (e.source === u && e.target === v) || (e.source === v && e.target === u));
          if (edge) pathEdgesSet.add(edge.id);
        }
      }
      return pathEdgesSet;
    }

    if (selectedAlgo === 'mst') {
      // Trace all links where parent is assigned
      Object.entries(stepState.predecessors).forEach(([vId, uId]) => {
        if (uId) {
          const edge = edges.find(e => (e.source === vId && e.target === uId) || (e.source === uId && e.target === vId));
          if (edge) pathEdgesSet.add(edge.id);
        }
      });
      return pathEdgesSet;
    }

    // Dijkstra / Widest paths: Trace from dest back to source
    let temp = destNode;
    let limit = 0; // Prevent infinite routing loop
    while (temp !== sourceNode && limit < 15) {
      const parentId = stepState.predecessors[temp];
      if (!parentId) break;
      const edge = edges.find(e => (e.source === temp && e.target === parentId) || (e.source === parentId && e.target === temp));
      if (edge) {
        pathEdgesSet.add(edge.id);
      }
      temp = parentId;
      limit++;
    }
    return pathEdgesSet;
  }, [stepState, selectedAlgo, edges, destNode, sourceNode]);

  // UI Event: Add Node
  const addNewNode = () => {
    if (!newNodeLabel.trim()) return;
    const newId = String(nodes.length + 1);
    const nodeObj: GraphNode = {
      id: newId,
      label: newNodeLabel,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 150
    };
    setNodes([...nodes, nodeObj]);
    setNewNodeLabel('');
    resetAlgorithm();
  };

  // UI Event: Add Edge
  const addNewEdge = () => {
    if (!newEdgeSource || !newEdgeTarget || newEdgeSource === newEdgeTarget) return;
    const edgeId = `e${newEdgeSource}-${newEdgeTarget}`;
    
    // Check duplication
    const duplicate = edges.some(e => 
      (e.source === newEdgeSource && e.target === newEdgeTarget) || 
      (e.source === newEdgeTarget && e.target === newEdgeSource)
    );
    if (duplicate) return;

    const edgeObj: GraphEdge = {
      id: edgeId,
      source: newEdgeSource,
      target: newEdgeTarget,
      delay: newEdgeDelay,
      bandwidth: newEdgeBw,
      cost: newEdgeCost
    };

    setEdges([...edges, edgeObj]);
    resetAlgorithm();
  };

  // UI Event: Delete selected edge
  const deleteEdge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(prev => prev.filter(edge => edge.id !== id));
    setSelectedEdge(null);
    resetAlgorithm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1 py-1">
      {/* Visual Canvas and Config Columns */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl relative text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <Network className="h-5 w-5 text-blue-400 animate-pulse" />
              <span>Interactive Topology Workspace</span>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl text-xs gap-1 border border-slate-850">
              <button 
                id="btn-algo-dijkstra"
                onClick={() => { setSelectedAlgo('dijkstra'); resetAlgorithm(); }}
                className={`px-2.5 py-1.5 font-medium rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
                  selectedAlgo === 'dijkstra' ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dijkstra (Delay)
              </button>
              <button 
                id="btn-algo-widest"
                onClick={() => { setSelectedAlgo('widest-path'); resetAlgorithm(); }}
                className={`px-2.5 py-1.5 font-medium rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
                  selectedAlgo === 'widest-path' ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Widest Path (Bw)
              </button>
              <button 
                id="btn-algo-mcp"
                onClick={() => { setSelectedAlgo('multi-constrained'); resetAlgorithm(); }}
                className={`px-2.5 py-1.5 font-medium rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
                  selectedAlgo === 'multi-constrained' ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Multi-Constrained
              </button>
              <button 
                id="btn-algo-mst"
                onClick={() => { setSelectedAlgo('mst'); resetAlgorithm(); }}
                className={`px-2.5 py-1.5 font-medium rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
                  selectedAlgo === 'mst' ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cost MST
              </button>
            </div>
          </div>

          {/* Interactive Network Graph */}
          <div className="relative w-full overflow-hidden bg-slate-950 border border-slate-850 rounded-2xl h-[380px] user-select-none">
            <svg
              ref={svgRef}
              className="w-full h-full cursor-crosshair animate-fade-in"
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseDown={handleSvgMouseDown}
            >
              {/* Markers for direct lines */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                </marker>
              </defs>

              {/* Render edges */}
              {edges.map((edge) => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;

                const isResultEdge = solvedPathEdges.has(edge.id);
                const isActiveHop = stepState.activeEdgeId === edge.id;
                
                // Edge line styles
                let strokeColor = '#334155';
                let strokeWidth = 2;
                let strokeDash = undefined;

                if (isActiveHop) {
                  strokeColor = '#f43f5e'; // current checking edge is rose-500
                  strokeWidth = 3;
                } else if (isResultEdge) {
                  strokeColor = '#10b981'; // Green active path flow
                  strokeWidth = 4;
                }

                // Midpoint for numeric weight positioning
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                return (
                  <g key={edge.id} className="group cursor-pointer">
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdge(edge);
                      }}
                      className="transition-all duration-300 hover:stroke-blue-500 hover:stroke-[3.5]"
                    />
                    
                    {/* Badge container for edge latency / bw numbers */}
                    <foreignObject
                      x={midX - 35}
                      y={midY - 18}
                      width="70"
                      height="36"
                      className="pointer-events-none select-none"
                    >
                      <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 shadow-xl rounded-md px-1 py-0.5 text-[8px] font-mono leading-none scale-90">
                        <span className="text-rose-400 font-bold">{edge.delay}ms</span>
                        <span className="text-blue-400 font-bold">{edge.bandwidth}M</span>
                        <span className="text-slate-400">{edge.cost}$</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelectedSource = sourceNode === node.id;
                const isSelectedDest = destNode === node.id;
                const isCurrentEvaluating = stepState.current === node.id;
                const isVisited = stepState.visited.includes(node.id);

                let badgeColor = 'bg-slate-900 border-slate-800 text-slate-300';
                if (isSelectedSource) {
                  badgeColor = 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]';
                } else if (isSelectedDest) {
                  badgeColor = 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                } else if (isCurrentEvaluating) {
                  badgeColor = 'bg-rose-950 border-rose-500 text-rose-300 border-2 ring-4 ring-rose-950/40';
                } else if (isVisited) {
                  badgeColor = 'bg-slate-900 border-blue-600/50 text-blue-300 border-2';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    className="cursor-move select-none"
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  >
                    <circle
                      r="22"
                      className="fill-slate-900 stroke-slate-800 shadow-sm hover:stroke-blue-500 hover:r-[23] transition-all"
                    />
                    <foreignObject
                      x="-50"
                      y="-12"
                      width="100"
                      height="24"
                      className="pointer-events-none"
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold text-center border truncate max-w-[90px] ${badgeColor}`}>
                           {node.label}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* Quick Helper Floating Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 p-2 text-[10px] rounded-lg shadow-xl font-sans space-y-1 text-slate-300">
              <div className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span> <span>A (Source router)</span></div>
              <div className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> <span>Z (Destination node)</span></div>
              <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-800 stroke-0">Drag nodes to rearrange network canvas layout.</p>
            </div>
          </div>

          {/* Stepper Timeline Navigation */}
          <div className="mt-4 p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <button
                id="btn-trigger-steps-play"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 flex items-center space-x-2 text-xs font-semibold cursor-pointer transition-all"
              >
                <Play className={`h-3.5 w-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                <span>{isPlaying ? 'Pause Run' : 'Play Steps'}</span>
              </button>
              
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-mono">Step {currentStepIndex + 1} / {steps.length || 1}</span>
                <button
                  id="btn-algo-steps-reset"
                  onClick={() => setCurrentStepIndex(0)}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg text-xs hover:cursor-pointer transition-all"
                  title="Reset Algorithm to Step 1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Step Selection Slider */}
            <input 
              id="steps-range-slider"
              type="range"
              min={0}
              max={Math.max(0, steps.length - 1)}
              value={currentStepIndex >= 0 ? currentStepIndex : 0}
              onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
              disabled={steps.length === 0}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-hidden"
            />

            {/* Written Guide for current step */}
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-850 min-h-[50px] flex items-start space-x-2 text-xs leading-relaxed text-slate-355">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{stepState.explanation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Config and Multi-Constrained Routing Settings */}
      <div className="lg:col-span-1 space-y-6">
        {/* Source / Destination selection */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 text-slate-200">
          <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-1 pb-1 border-b border-slate-800">
            <Sliders className="h-5 w-5 text-blue-400" />
            <span className="font-sans text-sm">Path Optimizer Settings</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-src-node" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide mb-1">Source Node</label>
              <select 
                id="select-src-node"
                value={sourceNode} 
                onChange={(e) => { setSourceNode(e.target.value); resetAlgorithm(); }}
                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-300 py-2 px-2.5 rounded-xl font-mono focus:outline-hidden focus:border-blue-500"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="select-dest-node" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide mb-1">Destination Node</label>
              <select 
                id="select-dest-node"
                value={destNode} 
                onChange={(e) => { setDestNode(e.target.value); resetAlgorithm(); }}
                className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-300 py-2 px-2.5 rounded-xl font-mono focus:outline-hidden focus:border-blue-500"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Constraints for MCP */}
          {selectedAlgo === 'multi-constrained' && (
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5">
              <h4 className="text-xs font-semibold text-blue-400 flex items-center space-x-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                <span>QoS Optimization Filters</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-mono mb-1 text-slate-400">
                    <span>Delay Limit (ms):</span>
                    <span className="font-bold text-slate-200">{delayConstraint}ms</span>
                  </div>
                  <input 
                    id="delay-constraint-slider"
                    type="range" 
                    min={15} 
                    max={80} 
                    value={delayConstraint} 
                    onChange={(e) => { setDelayConstraint(Number(e.target.value)); resetAlgorithm(); }}
                    className="w-full accent-blue-500 focus:outline-hidden cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono mb-1 text-slate-400">
                    <span>Bandwidth Req (Mbps):</span>
                    <span className="font-bold text-blue-400">{bwConstraint} Mbps</span>
                  </div>
                  <input 
                    id="bw-constraint-slider"
                    type="range" 
                    min={20} 
                    max={120} 
                    value={bwConstraint} 
                    onChange={(e) => { setBwConstraint(Number(e.target.value)); resetAlgorithm(); }}
                    className="w-full accent-indigo-600 focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected Edge Editor */}
          {selectedEdge ? (
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Configure Selected Segment</span>
                <button
                  id="btn-edge-delete-direct"
                  onClick={(e) => deleteEdge(selectedEdge.id, e)}
                  className="text-rose-400 hover:text-rose-300 h-6 w-6 hover:bg-rose-950/40 rounded flex items-center justify-center transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label htmlFor="input-seg-delay" className="block text-[10px] text-slate-450 uppercase tracking-wide">Segment Delay (ms)</label>
                  <input
                    id="input-seg-delay"
                    type="number"
                    value={selectedEdge.delay}
                    onChange={(e) => {
                      const lat = Number(e.target.value);
                      setEdges(prev => prev.map(edge => edge.id === selectedEdge.id ? { ...edge, delay: lat } : edge));
                      setSelectedEdge(prev => prev ? { ...prev, delay: lat } : null);
                      resetAlgorithm();
                    }}
                    className="w-full bg-slate-900 border border-slate-800 mt-1 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-seg-bw" className="block text-[10px] text-slate-450 uppercase tracking-wide">Segment Bandwidth (Mbps)</label>
                  <input
                    id="input-seg-bw"
                    type="number"
                    value={selectedEdge.bandwidth}
                    onChange={(e) => {
                      const bw = Number(e.target.value);
                      setEdges(prev => prev.map(edge => edge.id === selectedEdge.id ? { ...edge, bandwidth: bw } : edge));
                      setSelectedEdge(prev => prev ? { ...prev, bandwidth: bw } : null);
                      resetAlgorithm();
                    }}
                    className="w-full bg-slate-900 border border-slate-800 mt-1 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-seg-cost" className="block text-[10px] text-slate-450 uppercase tracking-wide">Segment Cost ($)</label>
                  <input
                    id="input-seg-cost"
                    type="number"
                    value={selectedEdge.cost}
                    onChange={(e) => {
                      const cst = Number(e.target.value);
                      setEdges(prev => prev.map(edge => edge.id === selectedEdge.id ? { ...edge, cost: cst } : edge));
                      setSelectedEdge(prev => prev ? { ...prev, cost: cst } : null);
                      resetAlgorithm();
                    }}
                    className="w-full bg-slate-900 border border-slate-800 mt-1 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/40 border border-dashed border-slate-850 text-center rounded-xl">
              <span className="text-[11px] leading-relaxed text-slate-450">
                Click on any network edge line to adjust delay, bandwidth, or cost parameters in real-time.
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Topology Creator Form (Nodes and Edges) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 text-slate-200">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2.5 pb-1 border-b border-slate-800">
            <PlusCircle className="h-4 w-4 text-blue-450" />
            <span>Customize Graph Topology</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-4 pt-1 text-xs">
            {/* Add Node form */}
            <div className="space-y-2 border-b border-slate-850 pb-3">
              <label htmlFor="input-add-node-label" className="font-semibold text-slate-300 block">Add Sensor Entity Node</label>
              <div className="flex space-x-2">
                <input
                  id="input-add-node-label"
                  type="text"
                  placeholder="e.g. Gateway (G)"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 px-3 py-1.5 font-sans bg-slate-950 text-slate-200 placeholder-slate-650 focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  id="btn-add-node-submit"
                  onClick={addNewNode}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-lg cursor-pointer transition-colors duration-300 shadow-md"
                >
                  Create
                </button>
              </div>
            </div>

            {/* Add Edge Form */}
            <div className="space-y-3">
              <span className="font-semibold text-slate-300 block">Form Link Connection (Edge)</span>
              <div>
                <label htmlFor="select-link-from" className="block text-[9px] text-slate-500 font-bold uppercase mb-1">From Node</label>
                <select
                  id="select-link-from"
                  value={newEdgeSource}
                  onChange={(e) => setNewEdgeSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 font-mono select-none focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Select origin</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              
              <div>
                <label htmlFor="select-link-to" className="block text-[9px] text-slate-500 font-bold uppercase mb-1">To Node</label>
                <select
                  id="select-link-to"
                  value={newEdgeTarget}
                  onChange={(e) => setNewEdgeTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 font-mono select-none focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Select target</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="input-link-delay" className="block text-[9px] text-slate-500 font-bold uppercase mb-0.5">Delay (ms)</label>
                  <input
                    id="input-link-delay"
                    type="number"
                    value={newEdgeDelay}
                    onChange={(e) => setNewEdgeDelay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-link-bw" className="block text-[9px] text-slate-500 font-bold uppercase mb-0.5">Bw (Mbps)</label>
                  <input
                    id="input-link-bw"
                    type="number"
                    value={newEdgeBw}
                    onChange={(e) => setNewEdgeBw(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="input-link-cost" className="block text-[9px] text-slate-500 font-bold uppercase mb-0.5">Cost ($)</label>
                  <input
                    id="input-link-cost"
                    type="number"
                    value={newEdgeCost}
                    onChange={(e) => setNewEdgeCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                id="btn-add-edge-submit"
                onClick={addNewEdge}
                className="w-full bg-blue-600/15 border border-blue-500/25 text-blue-450 hover:bg-blue-600/25 hover:text-blue-300 font-semibold py-2 rounded-lg mt-1 cursor-pointer transition-all active:scale-[0.99]"
              >
                Add Connector Edge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

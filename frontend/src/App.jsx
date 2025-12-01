import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, MousePointer, Move, Settings, Info, Save, Upload, Trash2, ArrowRight, Activity, Zap, CheckCircle } from 'lucide-react';

// --- Utility Classes & Functions ---

// Priority Queue for A*, Best-First, etc.
class PriorityQueue {
  constructor(comparator = (a, b) => a.val < b.val) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() { return this._heap.length; }
  isEmpty() { return this.size() === 0; }
  peek() { return this._heap[0]; }
  push(value) {
    this._heap.push(value);
    this._siftUp();
  }
  pop() {
    const top = this.peek();
    const bottom = this._heap.pop();
    if (this.size() > 0) {
      this._heap[0] = bottom;
      this._siftDown();
    }
    return top;
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > 0) {
      const parent = ((node + 1) >>> 1) - 1;
      if (this._comparator(this._heap[node], this._heap[parent])) {
        [this._heap[parent], this._heap[node]] = [this._heap[node], this._heap[parent]];
        node = parent;
      } else break;
    }
  }
  _siftDown() {
    let node = 0;
    while ((node + 1) * 2 <= this.size()) {
      let left = (node + 1) * 2 - 1;
      let right = (node + 1) * 2;
      let swap = left;
      if (right < this.size() && this._comparator(this._heap[right], this._heap[left])) {
        swap = right;
      }
      if (this._comparator(this._heap[swap], this._heap[node])) {
        [this._heap[node], this._heap[swap]] = [this._heap[swap], this._heap[node]];
        node = swap;
      } else break;
    }
  }
}

const calculateDistance = (nodeA, nodeB) => {
  if (!nodeA || !nodeB) return 0;
  return Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
};

// --- Main Component ---

export default function GraphSearchDashboard() {
  // -- State --
  
  // Graph Data
  const [nodes, setNodes] = useState([
    { id: 'A', x: 100, y: 300, label: 'A' },
    { id: 'B', x: 250, y: 150, label: 'B' },
    { id: 'C', x: 250, y: 450, label: 'C' },
    { id: 'D', x: 450, y: 150, label: 'D' },
    { id: 'E', x: 450, y: 450, label: 'E' },
    { id: 'G', x: 600, y: 300, label: 'G' }, 
  ]);
  const [edges, setEdges] = useState([
    { source: 'A', target: 'B', weight: 4 },
    { source: 'A', target: 'C', weight: 3 },
    { source: 'B', target: 'D', weight: 2 },
    { source: 'B', target: 'E', weight: 5 },
    { source: 'C', target: 'E', weight: 1 },
    { source: 'D', target: 'G', weight: 4 },
    { source: 'E', target: 'G', weight: 2 },
  ]);

  // Settings & Params
  const [algorithm, setAlgorithm] = useState('A*');
  const [startNodeId, setStartNodeId] = useState('A');
  const [goalNodeId, setGoalNodeId] = useState('G');
  const [parameters, setParameters] = useState({
    depthLimit: 3,
    beamWidth: 2,
    speed: 500
  });

  // Execution State
  const [history, setHistory] = useState([]); 
  const [stepIndex, setStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [executionStats, setExecutionStats] = useState(null);

  // Editor/Interaction State
  const [mode, setMode] = useState('move'); // move, addNode, addEdge, setStart, setGoal
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [tempEdgeSource, setTempEdgeSource] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);

  const canvasRef = useRef(null);

  // --- Logic: Run Algorithm ---

  const generateSteps = () => {
    // Basic validation
    const startNode = nodes.find(n => n.id === startNodeId);
    const goalNode = nodes.find(n => n.id === goalNodeId);
    if (!startNode || !goalNode) return;

    const steps = [];
    let path = null;
    let visitedOrder = [];
    
    const log = (current, open, closed, pathFound = null, explanation = "") => {
      // Create deep copies for visualization snapshot
      const openSnapshot = open.map(n => ({ 
        id: n.id, 
        val: n.f !== undefined ? `f:${n.f.toFixed(1)}` : (n.cost !== undefined ? `c:${n.cost}` : '')
      }));
      
      steps.push({
        current: current ? current.id : null,
        open: openSnapshot,
        closed: Array.from(closed),
        path: pathFound,
        explanation
      });
    };

    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.source].push({ target: e.target, weight: e.weight });
    });

    try {
      if (algorithm === 'BFS') {
        const queue = [{ id: startNodeId, parent: null }];
        const visited = new Set();
        visited.add(startNodeId);
        log(null, queue, visited, null, "Initialize Queue with Start Node.");

        while (queue.length > 0) {
          const curr = queue.shift();
          visitedOrder.push(curr.id);
          log(nodes.find(n=>n.id===curr.id), queue, visited, null, `Visiting ${curr.id}. Checking neighbors...`);

          if (curr.id === goalNodeId) {
            path = constructPath(curr);
            log(nodes.find(n=>n.id===curr.id), [], visited, path, "Goal Reached!");
            break;
          }

          const neighbors = adj[curr.id] || [];
          for (let edge of neighbors) {
            if (!visited.has(edge.target)) {
              visited.add(edge.target);
              queue.push({ id: edge.target, parent: curr });
            }
          }
        }
      } 
      else if (algorithm === 'DFS') {
        const stack = [{ id: startNodeId, parent: null }];
        const visited = new Set();
        log(null, stack, visited, null, "Initialize Stack with Start Node.");

        while (stack.length > 0) {
          const curr = stack.pop();
          if (!visited.has(curr.id)) {
            visited.add(curr.id);
            visitedOrder.push(curr.id);
            log(nodes.find(n=>n.id===curr.id), stack, visited, null, `Popped ${curr.id}. Visiting...`);

            if (curr.id === goalNodeId) {
              path = constructPath(curr);
              log(nodes.find(n=>n.id===curr.id), [], visited, path, "Goal Reached!");
              break;
            }

            const neighbors = adj[curr.id] || [];
            // Push reverse for visual consistency
            for (let i = neighbors.length - 1; i >= 0; i--) {
              const edge = neighbors[i];
              if (!visited.has(edge.target)) {
                stack.push({ id: edge.target, parent: curr });
              }
            }
          }
        }
      }
      else if (algorithm === 'A*' || algorithm === 'Best First' || algorithm === 'Branch & Bound') {
        const openList = new PriorityQueue((a, b) => a.f < b.f);
        const startH = calculateDistance(startNode, goalNode);
        
        let initF = 0;
        if (algorithm === 'A*') initF = 0 + startH;
        else if (algorithm === 'Best First') initF = startH;
        else if (algorithm === 'Branch & Bound') initF = 0;

        openList.push({ id: startNodeId, parent: null, g: 0, h: startH, f: initF });
        const closed = new Set();
        const gScores = { [startNodeId]: 0 };

        log(null, openList._heap, closed, null, `Init Priority Queue. Start f=${initF.toFixed(1)}`);

        while (!openList.isEmpty()) {
          const curr = openList.pop();
          if (closed.has(curr.id)) continue;
          
          closed.add(curr.id);
          visitedOrder.push(curr.id);
          log(nodes.find(n=>n.id===curr.id), openList._heap, closed, null, `Expand ${curr.id} (f=${curr.f.toFixed(1)}).`);

          if (curr.id === goalNodeId) {
            path = constructPath(curr);
            log(nodes.find(n=>n.id===curr.id), [], closed, path, "Goal Reached!");
            break;
          }

          const neighbors = adj[curr.id] || [];
          for (let edge of neighbors) {
            if (closed.has(edge.target)) continue;

            const tentativeG = curr.g + edge.weight;
            const neighborNode = nodes.find(n => n.id === edge.target);
            const h = calculateDistance(neighborNode, goalNode);
            
            let f = 0;
            if (algorithm === 'A*') f = tentativeG + h;
            else if (algorithm === 'Best First') f = h;
            else if (algorithm === 'Branch & Bound') f = tentativeG;

            if (tentativeG < (gScores[edge.target] ?? Infinity)) {
                gScores[edge.target] = tentativeG;
                openList.push({ id: edge.target, parent: curr, g: tentativeG, h, f });
            }
          }
        }
      }
      // ... Add other algorithms (Beam, Hill, DLS) following similar pattern ...
      // For brevity in this static version, we stick to the main 3-4 distinct types.
      
    } catch (e) { console.error(e); }

    setHistory(steps);
    setStepIndex(0);
    setExecutionStats({
      visitedCount: visitedOrder.length,
      pathCost: path ? path.length - 1 : 0,
      path: path ? path : []
    });
    setIsPlaying(true);
  };

  const constructPath = (nodeWrapper) => {
    const path = [];
    let curr = nodeWrapper;
    while (curr) {
      path.unshift(curr.id);
      curr = curr.parent;
    }
    return path;
  };

  // --- Animation Loop ---
  useEffect(() => {
    let interval;
    if (isPlaying && history.length > 0 && stepIndex < history.length - 1) {
      interval = setInterval(() => {
        setStepIndex(prev => prev + 1);
      }, parameters.speed);
    } else if (stepIndex >= history.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, stepIndex, history, parameters.speed]);


  // --- Canvas Interaction Handlers ---

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);
    
    // Check if clicked on a node
    const clickedNode = nodes.find(n => {
        return Math.sqrt(Math.pow(pos.x - n.x, 2) + Math.pow(pos.y - n.y, 2)) < 20;
    });

    if (mode === 'addNode' && !clickedNode) {
        const newId = String.fromCharCode(65 + nodes.length); // A, B, C...
        setNodes([...nodes, { id: newId, x: pos.x, y: pos.y, label: newId }]);
        return;
    }

    if (clickedNode) {
        if (mode === 'move') {
            setDraggingNodeId(clickedNode.id);
            setSelectedNodeId(clickedNode.id);
        } else if (mode === 'addEdge') {
            if (!tempEdgeSource) {
                setTempEdgeSource(clickedNode.id);
            } else {
                // Add edge
                if (tempEdgeSource !== clickedNode.id) {
                    setEdges([...edges, { source: tempEdgeSource, target: clickedNode.id, weight: 1 }]);
                }
                setTempEdgeSource(null);
            }
        } else if (mode === 'setStart') {
            setStartNodeId(clickedNode.id);
        } else if (mode === 'setGoal') {
            setGoalNodeId(clickedNode.id);
        } else if (mode === 'delete') {
            setNodes(nodes.filter(n => n.id !== clickedNode.id));
            setEdges(edges.filter(e => e.source !== clickedNode.id && e.target !== clickedNode.id));
        }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (draggingNodeId && mode === 'move') {
        const pos = getMousePos(e);
        setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, x: pos.x, y: pos.y } : n));
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  // --- Drawing Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Edges
    edges.forEach(edge => {
      const n1 = nodes.find(n => n.id === edge.source);
      const n2 = nodes.find(n => n.id === edge.target);
      if (n1 && n2) {
        let color = '#4b5563'; 
        let lineWidth = 2;

        // Path Highlighting
        const currentStep = history[stepIndex];
        if (currentStep && currentStep.path) {
            const idx1 = currentStep.path.indexOf(n1.id);
            const idx2 = currentStep.path.indexOf(n2.id);
            if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
                color = '#10b981'; // Success Path
                lineWidth = 4;
            }
        }
        
        // Draw Line/Arrow
        const headlen = 10;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const angle = Math.atan2(dy, dx);
        const r = 20; 
        const startX = n1.x + r * Math.cos(angle);
        const startY = n1.y + r * Math.sin(angle);
        const endX = n2.x - r * Math.cos(angle);
        const endY = n2.y - r * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fillStyle = color;
        ctx.fill();

        // Weight Label
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        ctx.fillStyle = '#1f2937'; 
        ctx.beginPath();
        ctx.arc(midX, midY, 9, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.weight, midX, midY);
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#1f2937';
      
      const currentStep = history[stepIndex];
      let strokeColor = '#4b5563'; // Default border
      let lineWidth = 2;

      // Special Roles
      if (node.id === startNodeId) strokeColor = '#22c55e'; // Green
      else if (node.id === goalNodeId) strokeColor = '#ef4444'; // Red
      
      // Algorithm State
      if (currentStep) {
          if (currentStep.current === node.id) {
              ctx.fillStyle = '#eab308'; // Active Yellow
              strokeColor = '#facc15';
          } else if (currentStep.closed.includes(node.id)) {
              ctx.fillStyle = '#ef4444'; // Visited Red/Pinkish
              strokeColor = '#f87171';
          } else if (currentStep.open.some(n => n.id === node.id)) {
              ctx.fillStyle = '#3b82f6'; // Frontier Blue
              strokeColor = '#60a5fa';
          }

          if (currentStep.path && currentStep.path.includes(node.id)) {
              ctx.fillStyle = '#10b981'; // Final Path Green
              strokeColor = '#34d399';
          }
      }

      // Selection State
      if (node.id === selectedNodeId) {
          lineWidth = 4;
          strokeColor = '#f472b6'; // Pink select
      }
      if (node.id === tempEdgeSource) {
          lineWidth = 4;
          strokeColor = '#a855f7'; // Purple connect source
      }

      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      // Heuristic overlay (optional)
      if (algorithm === 'A*' || algorithm === 'Best First') {
          const h = Math.round(calculateDistance(node, nodes.find(n => n.id === goalNodeId)));
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px sans-serif';
          ctx.fillText(`h:${h}`, node.x, node.y + 32);
      }
    });

  }, [nodes, edges, history, stepIndex, selectedNodeId, tempEdgeSource, startNodeId, goalNodeId, algorithm]);


  // --- UI Render ---

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-gray-100 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
            <Activity className="text-blue-500" />
            <h1 className="text-lg font-bold tracking-wide">Graph<span className="text-blue-500">Search</span> Viz</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Start Node</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Goal Node</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Frontier</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Current</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Controls */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
            
            {/* Algorithm Selection */}
            <div className="p-5 border-b border-gray-700">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Algorithm</h2>
                <select 
                    value={algorithm} 
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:border-blue-500 outline-none transition-colors"
                >
                    <option value="A*">A* Search</option>
                    <option value="BFS">Breadth-First Search (BFS)</option>
                    <option value="DFS">Depth-First Search (DFS)</option>
                    <option value="Best First">Best-First Search</option>
                    <option value="Branch & Bound">Branch & Bound</option>
                </select>
                
                <div className="mt-4 space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-400">Speed (ms)</label>
                        <input 
                            type="range" min="50" max="1000" step="50"
                            value={parameters.speed}
                            onChange={(e) => setParameters({...parameters, speed: Number(e.target.value)})}
                            className="w-24 accent-blue-500"
                        />
                     </div>
                </div>
            </div>

            {/* Editor Tools */}
            <div className="p-5 border-b border-gray-700 flex-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Graph Builder</h2>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => setMode('move')}
                        className={`p-2 rounded flex flex-col items-center gap-1 text-xs border ${mode === 'move' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                    >
                        <Move size={16} /> Move
                    </button>
                    <button 
                        onClick={() => setMode('addNode')}
                        className={`p-2 rounded flex flex-col items-center gap-1 text-xs border ${mode === 'addNode' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                    >
                        <Plus size={16} /> Add Node
                    </button>
                    <button 
                        onClick={() => setMode('addEdge')}
                        className={`p-2 rounded flex flex-col items-center gap-1 text-xs border ${mode === 'addEdge' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                    >
                        <ArrowRight size={16} /> Add Edge
                    </button>
                    <button 
                        onClick={() => setMode('delete')}
                        className={`p-2 rounded flex flex-col items-center gap-1 text-xs border ${mode === 'delete' ? 'bg-red-600 border-red-500 text-white' : 'border-gray-600 hover:bg-gray-700 text-gray-300'}`}
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>

                <div className="space-y-2">
                    <button 
                        onClick={() => setMode('setStart')}
                        className={`w-full p-2 text-left text-xs rounded border flex items-center gap-2 ${mode === 'setStart' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Set Start Node
                    </button>
                    <button 
                        onClick={() => setMode('setGoal')}
                        className={`w-full p-2 text-left text-xs rounded border flex items-center gap-2 ${mode === 'setGoal' ? 'border-red-500 bg-red-900/30 text-red-400' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Set Goal Node
                    </button>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="p-5">
                <button 
                    onClick={generateSteps}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-md font-bold shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 mb-3"
                >
                    <Zap size={18} /> Run Search
                </button>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-medium flex justify-center items-center"
                    >
                        {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                    </button>
                    <button 
                        onClick={() => { setStepIndex(0); setIsPlaying(false); }}
                        className="px-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center items-center"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
        </div>

        {/* Middle Panel: Visual Canvas */}
        <div className="flex-1 bg-gray-900 relative flex flex-col">
            <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-400 border border-gray-700 pointer-events-none">
                Mode: <span className="text-white font-bold uppercase">{mode}</span>
            </div>
            
            <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="flex-1 w-full h-full cursor-crosshair touch-none"
            />

            {/* Timeline Slider */}
            {history.length > 0 && (
                 <div className="h-12 bg-gray-800 border-t border-gray-700 px-4 flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-400 w-12 text-right">Step {stepIndex + 1}/{history.length}</span>
                    <input 
                        type="range"
                        min="0" max={history.length - 1}
                        value={stepIndex}
                        onChange={(e) => {
                             setStepIndex(parseInt(e.target.value));
                             setIsPlaying(false);
                        }}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-500"
                    />
                 </div>
            )}
        </div>

        {/* Right Panel: Explanations */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            
            {/* Stats Summary */}
            <div className="p-5 border-b border-gray-700 bg-gray-800/50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Execution Summary</h2>
                {executionStats ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-xs text-gray-400">Visited</div>
                            <div className="text-lg font-bold text-white">{executionStats.visitedCount} nodes</div>
                        </div>
                        <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-xs text-gray-400">Path Cost</div>
                            <div className="text-lg font-bold text-green-400">{executionStats.pathCost}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500 italic text-center py-2">Run algorithm to see stats</div>
                )}
            </div>

            {/* Current Step Detail */}
            <div className="flex-1 overflow-y-auto p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={14} /> Step Log
                </h2>
                
                {history[stepIndex] ? (
                    <div className="space-y-4">
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-md">
                            <p className="text-sm text-blue-100 font-medium mb-1">Current Action:</p>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {history[stepIndex].explanation}
                            </p>
                        </div>

                        {/* Lists Visualization */}
                        <div>
                            <div className="text-xs text-gray-500 mb-1 flex justify-between">
                                <span>Frontier / Open List</span>
                                <span>{history[stepIndex].open.length} items</span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                {history[stepIndex].open.map((n, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-600/20 border border-blue-500/40 rounded text-xs text-blue-300">
                                        {n.id} <span className="opacity-50 text-[10px]">{n.val}</span>
                                    </span>
                                ))}
                                {history[stepIndex].open.length === 0 && <span className="text-xs text-gray-600">Empty</span>}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 mb-1">Visited / Closed List</div>
                            <div className="flex flex-wrap gap-1">
                                {history[stepIndex].closed.map((id, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-600/20 border border-red-500/40 rounded text-xs text-red-300">
                                        {id}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {history[stepIndex].path && (
                            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
                                <div className="flex items-center gap-2 text-green-400 font-bold text-sm mb-1">
                                    <CheckCircle size={14} /> Path Found!
                                </div>
                                <div className="text-xs text-green-200 break-words">
                                    {history[stepIndex].path.join(' → ')}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-600 text-sm mt-10">
                        Ready to run. <br/>Press "Run Search".
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
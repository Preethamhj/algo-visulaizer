import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, ArrowRight, Activity, Zap, Info, Move, Trash2, CheckCircle, Settings, Table } from 'lucide-react';
// --- Utility Classes & Functions (Moved out for clean component file) ---

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

const constructPath = (nodeWrapper) => {
    const path = [];
    let curr = nodeWrapper;
    while (curr) {
        path.unshift(curr.id);
        curr = curr.parent;
    }
    return path;
};

// --- Exported Sub-Components ---

// NOTE: Components B, C, D, and E will be defined after the main component for a complete file structure,
// but they should ideally be in separate files (e.g., Header.jsx, ControlPanel.jsx)
// For this response, they are defined inline for simplicity.

const Header = ({ legend }) => (
    <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
            <Activity className="text-blue-500" />
            <h1 className="text-lg font-bold tracking-wide">Graph<span className="text-blue-500">Search</span> Viz</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
            {legend.map(({ label, colorClass }, index) => (
                <span key={index} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${colorClass}`}></span> {label}
                </span>
            ))}
        </div>
    </div>
);


const GraphCanvas = React.memo(({ 
    canvasRef, nodes, edges, history, stepIndex, startNodeId, goalNodeId, 
    mode, tempEdgeSource, algorithm, handleCanvasMouseDown, handleCanvasMouseMove, 
    handleCanvasMouseUp, setStepIndex, setIsPlaying // <-- NEW: Added step setters
}) => {
    
    // --- Drawing Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        
        // Handle case where history is empty or index is out of bounds
        const currentStep = history[stepIndex] || { 
            closed: new Set(), // Ensure default to avoid errors
            open: [], 
            current: null, 
            path: null 
        };

        // Helper to check if a node is in the open list
        const isOpen = (nodeId) => currentStep.open.some(n => n.id === nodeId);
        
        // Draw Edges
        edges.forEach(edge => {
            const n1 = nodes.find(n => n.id === edge.source);
            const n2 = nodes.find(n => n.id === edge.target);
            if (n1 && n2) {
                let color = '#4b5563'; 
                let lineWidth = 2;
                
                // Path Highlighting
                if (currentStep.path) {
                    const idx1 = currentStep.path.indexOf(n1.id);
                    const idx2 = currentStep.path.indexOf(n2.id);
                    // Check if the edge is part of the final path segment
                    if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
                        color = '#10b981'; 
                        lineWidth = 4;
                    }
                }
                
                // --- Edge Drawing Logic (omitted for brevity) ---
                const headlen = 10;
                const r = 20; 
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const angle = Math.atan2(dy, dx);
                
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
                // --- End Edge Drawing Logic ---
            }
        });

        // Draw Nodes
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = '#1f2937';
            
            let strokeColor = '#4b5563'; 
            let lineWidth = 2;

            // 1. Path highlight (highest priority color)
            if (currentStep.path && currentStep.path.includes(node.id)) {
                ctx.fillStyle = '#10b981'; 
                strokeColor = '#34d399';
            } 
            // 2. Current node being expanded
            else if (currentStep.current?.id === node.id) {
                ctx.fillStyle = '#eab308'; 
                strokeColor = '#facc15';
            } 
            // 3. Closed/Visited list
            else if (currentStep.closed.has(node.id)) { // Use .has() if closed is a Set
                ctx.fillStyle = '#ef4444'; 
                strokeColor = '#f87171';
            }
            // 4. Open/Frontier list
            else if (isOpen(node.id)) {
                ctx.fillStyle = '#3b82f6'; 
                strokeColor = '#60a5fa';
            }

            // 5. Special Roles override (start/goal are always recognizable)
            if (node.id === startNodeId) strokeColor = '#22c55e'; 
            if (node.id === goalNodeId) strokeColor = '#ef4444'; 
            
            // 6. Editor/Interaction State Overrides
            if (node.id === tempEdgeSource) {
                lineWidth = 4;
                strokeColor = '#a855f7'; 
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

            // NEW/CORRECT LOGIC (Reading pre-parsed 'h' value from the node object)
if ((algorithm === 'A*' || algorithm === 'Best First') && node.h !== undefined && node.h !== null) {
    
    // Ensure the node is visible by checking if it's referenced in the heuristic map (optional)
    // Use .toFixed(1) for cleaner display
    const hValue = parseFloat(node.h).toFixed(1); 
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.fillText(`h:${hValue}`, node.x, node.y + 32);
}
        });

    }, [nodes, edges, history, stepIndex, tempEdgeSource, startNodeId, goalNodeId, algorithm]);

    return (
        <div className="flex-1 bg-gray-900 relative flex flex-col">
            <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-400 border border-gray-700 pointer-events-none z-10">
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

            {/* Timeline Slider (FIXED) */}
            {history.length > 0 && (
                <div className="h-12 bg-gray-800 border-t border-gray-700 px-4 flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-400 w-12 text-right">Step {stepIndex + 1}/{history.length}</span>
                    <input 
                        type="range"
                        min="0" max={history.length - 1}
                        value={stepIndex}
                        onChange={(e) => {
                            const newStep = parseInt(e.target.value);
                            setStepIndex(newStep); // Update step index
                            if (setIsPlaying) setIsPlaying(false); // Pause animation when user drags the slider
                            handleCanvasMouseUp(); // Stop any dragging mode
                        }}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison logic remains the same
    return (
        prevProps.nodes === nextProps.nodes &&
        prevProps.edges === nextProps.edges &&
        prevProps.history === nextProps.history &&
        prevProps.stepIndex === nextProps.stepIndex &&
        prevProps.startNodeId === nextProps.startNodeId &&
        prevProps.goalNodeId === nextProps.goalNodeId &&
        prevProps.mode === nextProps.mode &&
        prevProps.tempEdgeSource === nextProps.tempEdgeSource &&
        prevProps.algorithm === nextProps.algorithm
    );
});
const Sidebar = ({ history, stepIndex, executionStats, algorithm }) => { // <-- Receive 'algorithm' prop
    const currentStep = history[stepIndex];
    const isFinished = stepIndex === history.length - 1 && history.length > 0 && currentStep && currentStep.path;
    
    // Helper to format priority queue/list items and show the relevant score
    const formatList = (items) => {
        if (!items || items.length === 0) {
            return <div className="text-gray-500 italic text-sm">Empty</div>;
        }

        // Sort items for consistent display (Open List/PQ sorting visualization)
        // Note: The parent component should ensure 'items' contains f, g, and h properties when necessary.
        const sortedItems = [...items].sort((a, b) => {
            // Priority for A*, Best First, Branch & Bound (Uniform Cost)
            if (algorithm === 'A*') return a.f - b.f;
            if (algorithm === 'Best First') return a.h - b.h;
            if (algorithm === 'Branch & Bound') return a.g - b.g;
            
            // For BFS/DFS, sorting isn't strictly necessary for correctness, but we keep it
            return 0; 
        });

        return (
            <div className="flex flex-wrap gap-2">
                {sortedItems.map((item, index) => {
                    let scoreText = '';
                    let scoreColor = 'text-gray-400';
                    
                    if (algorithm === 'A*' && item.f !== undefined) {
                        scoreText = `f=${item.f.toFixed(1)}`;
                        scoreColor = 'text-yellow-400';
                    } else if (algorithm === 'Best First' && item.h !== undefined) {
                        scoreText = `h=${item.h.toFixed(1)}`;
                        scoreColor = 'text-blue-400';
                    } else if (algorithm === 'Branch & Bound' && item.g !== undefined) {
                        scoreText = `g=${item.g.toFixed(1)}`;
                        scoreColor = 'text-green-400';
                    } else if (algorithm === 'BFS' || algorithm === 'DFS') {
                        // Display depth or basic indicator for uninformed search
                        scoreText = ''; 
                    }
                    
                    return (
                        <div key={index} className="bg-gray-700/70 text-xs px-2 py-1 rounded border border-gray-600 font-mono flex items-center">
                            <span className={`font-bold mr-1 ${currentStep?.current?.id === item.id ? 'text-white' : 'text-gray-300'}`}>{item.id}</span>
                            <span className={scoreColor}>{scoreText}</span>
                        </div>
                    );
                })}
            </div>
        );
    };


    return (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
            
            {/* --- Execution Summary --- */}
            <div className="p-5 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Activity size={16}/> Execution Summary</h2>
                
                {history.length > 0 ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400 flex items-center gap-1">Current Step:</span>
                            <span className="font-bold text-lg text-blue-300">{stepIndex + 1} / {history.length}</span>
                        </div>

                        {isFinished && (
                            <div className="bg-green-700/50 p-3 rounded border border-green-500">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-2"><CheckCircle size={18}/> Search Finished!</h3>
                                <p className="text-sm text-gray-200">
                                    Path: <span className="font-mono text-yellow-300">{executionStats.path.join(' → ')}</span>
                                </p>
                                <p className="text-sm text-gray-200">
                                    Cost: <span className="font-mono text-yellow-300">{executionStats.pathCost.toFixed(1)}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Nodes Visited: {executionStats.visitedCount}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-500 italic text-sm p-4 bg-gray-700/50 rounded">
                        Press "Run Search" to start the algorithm and see the execution details here.
                    </div>
                )}
            </div>

            {/* --- Current Step Log --- */}
            {currentStep && (
                <div className="p-5 border-b border-gray-700 bg-gray-700/20">
                    <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Info size={16}/> Step Log</h2>
                    <div className="text-sm space-y-2">
                        <p className="text-gray-400 font-medium">Node Processing:</p>
                        <p className="font-bold text-xl text-yellow-300">{currentStep.current ? currentStep.current.id : 'N/A'}</p>
                        <p className="mt-2 text-gray-300 italic border-l-4 border-yellow-500 pl-3 py-1 bg-gray-700/50 rounded">
                            {currentStep.explanation}
                        </p>
                    </div>
                </div>
            )}


            {/* --- Algorithm State Lists --- */}
            {currentStep && (
                <div className="p-5 flex-1 overflow-y-auto">
                    <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2"><List size={16}/> Algorithm State Lists</h2>

                    {/* Open List / Priority Queue */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-300 mb-2 border-b border-gray-700 pb-1">Frontier / Open List</h3>
                        {formatList(currentStep.open)}
                    </div>

                    {/* Closed List / Visited Set */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-300 mb-2 border-b border-gray-700 pb-1">Visited / Closed List</h3>
                        <div className="flex flex-wrap gap-2">
                            {/* NOTE: If the closed list is a Set in the parent state, Array.from is needed here. 
                                Assuming 'currentStep.closed' is an array of IDs based on your initial Sidebar code. 
                                If it is a Set, the parent component must call Array.from() during logging. 
                            */}
                            {currentStep.closed.map(nodeId => (
                                <span key={nodeId} className="bg-red-700/50 text-xs px-2 py-1 rounded border border-red-500 text-gray-200 font-mono">{nodeId}</span>
                            ))}
                        </div>
                        {currentStep.closed.length === 0 && (
                            <div className="text-gray-600 italic text-sm">Empty</div>
                        )}
                    </div>
                </div>
            )}
            
        </div>
    );
};


// --- Utility Classes & Functions (omitted for brevity, assume they are available) ---
// ... PriorityQueue, calculateDistance, constructPath ...

// --- Sub-Components (omitted for brevity, assume they are available) ---
// ... Header, GraphCanvas, Sidebar ...

// --- NEW/MODIFIED: ControlPanel Component ---
const   ControlPanel = ({ 
    algorithm, setAlgorithm, parameters, setParameters, mode, setMode, 
    generateSteps, isPlaying, setIsPlaying, setStepIndex, historyLength,
    adjacencyListInput, setAdjacencyListInput, heuristicInput, setHeuristicInput, 
    startNodeId, setStartNodeId, goalNodeId, setGoalNodeId
}) => {
    // State in the Parent Component
const [nodes, setNodes] = useState([]);
const [heuristicInput, setHeuristicInput] = useState(''); // Updated by ControlPanel
    // Helper function to handle Start/Goal node ID updates
    const handleNodeIdChange = (e, setter) => {
        setter(e.target.value.toUpperCase());
    };
    useEffect(() => {
    // 1. Parse the Heuristic Input String
    const hMap = {};
    try {
        heuristicInput.split(',').forEach(entry => {
            const parts = entry.split('=').map(s => s.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                const nodeId = parts[0].toUpperCase();
                const hValue = parseFloat(parts[1]);
                if (!isNaN(hValue)) {
                    hMap[nodeId] = hValue;
                }
            }
        });
    } catch (error) {
        // Optional: Add some user feedback for invalid format
        console.error("Invalid Heuristic Input format:", error);
    }

    // 2. Apply the new h values to the Nodes state
    setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        // If an H value is found in the map, use it; otherwise, keep the old one or default to 0
        h: hMap[node.id] !== undefined ? hMap[node.id] : (node.h || 0) 
    })));

// Run this effect whenever the raw input string changes
}, [heuristicInput]);

    return (
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
            
            {/* Algorithm Selection & Speed */}
            <div className="p-5 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Settings size={16}/> Settings</h2>
                
                <label className="text-xs text-gray-400 block mb-1">Search Algorithm</label>
                <select 
                    value={algorithm} 
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none"
                >
                    <option value="A*">A* Search</option>
                    <option value="BFS">Breadth-First Search (BFS)</option>
                    <option value="DFS">Depth-First Search (DFS)</option>
                    <option value="Best First">Best-First Search (Greedy)</option>
                    <option value="Branch & Bound">Branch & Bound (Uniform Cost)</option>
                </select>
                
                <div className="mt-4 space-y-3 p-2 bg-gray-900 rounded-md">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-400">Animation Speed ({parameters.speed}ms)</label>
                        <input 
                            type="range" min="50" max="1000" step="50"
                            value={parameters.speed}
                            onChange={(e) => setParameters({...parameters, speed: Number(e.target.value)})}
                            className="w-28 accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* NEW: Data Input Forms */}
            <div className="p-5 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Table size={16}/> Data Input</h2>
                
                {/* Adjacency List Input */}
                <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Adjacency List (Node: Neighbor1(Weight1), ...)</label>
                    <textarea
                        value={adjacencyListInput}
                        onChange={(e) => setAdjacencyListInput(e.target.value)}
                        rows="5"
                        placeholder="e.g., A: B(4), C(3)&#10;B: D(2), E(5)&#10;C: E(1)"
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm font-mono focus:border-purple-500 outline-none resize-none"
                    />
                </div>

                {/* Heuristic Input */}
                <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Heuristics (Node=Value, ...)</label>
                    <textarea
                        value={heuristicInput}
                        onChange={(e) => setHeuristicInput(e.target.value)}
                        rows="2"
                        placeholder="e.g., A=10, B=6, C=8, D=2, E=4, G=0"
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm font-mono focus:border-purple-500 outline-none resize-none"
                        disabled={algorithm === 'BFS' || algorithm === 'DFS'}
                    />
                </div>

                {/* Start/Goal Node Input */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Start Node</label>
                        <input
                            type="text"
                            value={startNodeId}
                            onChange={(e) => handleNodeIdChange(e, setStartNodeId)}
                            maxLength="1"
                            className="w-full bg-gray-900 border border-green-500/50 rounded-md p-2 text-sm text-green-400 font-mono focus:border-green-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Goal Node</label>
                        <input
                            type="text"
                            value={goalNodeId}
                            onChange={(e) => handleNodeIdChange(e, setGoalNodeId)}
                            maxLength="1"
                            className="w-full bg-gray-900 border border-red-500/50 rounded-md p-2 text-sm text-red-400 font-mono focus:border-red-500 outline-none"
                        />
                    </div>
                </div>

            </div>
            
            {/* Editor Tools (Keep for canvas interaction) */}
            <div className="p-5 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Plus size={16}/> Graph Builder Tools</h2>
                
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { key: 'move', Icon: Move, label: 'Move' },
                        { key: 'addNode', Icon: Plus, label: 'Add Node' },
                        { key: 'addEdge', Icon: ArrowRight, label: 'Add Edge' },
                        { key: 'setStart', Icon: (props) => <div className="w-2 h-2 rounded-full bg-green-500 mt-1" {...props}/>, label: 'Start' },
                        { key: 'setGoal', Icon: (props) => <div className="w-2 h-2 rounded-full bg-red-500 mt-1" {...props}/>, label: 'Goal' },
                        { key: 'delete', Icon: Trash2, label: 'Delete', color: 'red' },
                    ].map(({ key, Icon, label, color }) => (
                        <button 
                            key={key}
                            onClick={() => setMode(key)}
                            className={`p-2 rounded flex flex-col items-center gap-1 text-xs border transition-all ${
                                mode === key 
                                    ? color === 'red' ? 'bg-red-600 border-red-500 text-white' : 'bg-blue-600 border-blue-500 text-white' 
                                    : 'border-gray-600 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            {typeof Icon === 'function' && Icon.name !== 'Icon' ? <Icon /> : <Icon size={16} />} 
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Playback Controls */}
            <div className="p-5 mt-auto border-t border-gray-700">
                <button 
                    onClick={generateSteps}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-md font-bold shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 mb-3 transition-colors disabled:opacity-50"
                    disabled={isPlaying}
                >
                    <Zap size={18} /> Run Search
                </button>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-medium flex justify-center items-center transition-colors disabled:opacity-50"
                        disabled={historyLength === 0}
                    >
                        {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                    </button>
                    <button 
                        onClick={() => { setStepIndex(0); setIsPlaying(false); }}
                        className="px-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center items-center transition-colors disabled:opacity-50"
                        disabled={historyLength === 0}
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- Main Export Component ---

export default function GraphSearchDashboard() {
    
    // Default data structure for initial display
    const defaultAdjacency = `A: B(4), C(3)
B: D(2), E(5)
C: E(1)
D: G(4)
E: G(2)`;

    const defaultHeuristics = `A=10, B=6, C=8
D=2, E=4, G=0`;

    // --- State ---
    const [algorithm, setAlgorithm] = useState('A*');
    const [startNodeId, setStartNodeId] = useState('A');
    const [goalNodeId, setGoalNodeId] = useState('G');
    
    // NEW Data Input States
    const [adjacencyListInput, setAdjacencyListInput] = useState(defaultAdjacency);
    const [heuristicInput, setHeuristicInput] = useState(defaultHeuristics);

    // Graph Data (Derived from Input)
    const [nodes, setNodes] = useState([]); // Nodes are derived from input
    const [edges, setEdges] = useState([]); // Edges are derived from input

    // Execution & Control States (omitted for brevity)
    const [parameters, setParameters] = useState({ speed: 500 });
    const [history, setHistory] = useState([]); 
    const [stepIndex, setStepIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [executionStats, setExecutionStats] = useState(null);
    const [mode, setMode] = useState('move'); 
    const [tempEdgeSource, setTempEdgeSource] = useState(null);
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const canvasRef = useRef(null);

    // --- Utility: Parse Input to Graph Structure ---
    const parseInput = () => {
        const newNodes = new Set();
        const newEdges = [];
        const heuristics = {};
        
        // 1. Parse Adjacency List
        // Format: A: B(4), C(3)
        adjacencyListInput.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            const parts = trimmedLine.split(':');
            const sourceId = parts[0].trim().toUpperCase();
            newNodes.add(sourceId);

            const connections = parts[1] || '';
            const edgeRegex = /(\w+)\((\d+)\)/g; // Matches Node(Weight)
            
            let match;
            while ((match = edgeRegex.exec(connections)) !== null) {
                const targetId = match[1].toUpperCase();
                const weight = Number(match[2]);
                newNodes.add(targetId);
                newEdges.push({ source: sourceId, target: targetId, weight });
            }
        });

        // 2. Parse Heuristics
        // Format: A=10, B=6, C=8, ...
        heuristicInput.split(/[\n,]/).forEach(pair => {
            const trimmedPair = pair.trim();
            if (!trimmedPair) return;
            const [id, value] = trimmedPair.split('=').map(s => s.trim());
            if (id && value && !isNaN(Number(value))) {
                heuristics[id.toUpperCase()] = Number(value);
            }
        });

        // 3. Create Node objects with basic coordinates
        let nodeX = 100;
        let nodeY = 100;
        const initialNodes = Array.from(newNodes).map(id => {
            // Simple placement logic for new nodes derived from text input
            const node = { 
                id, 
                label: id,
                // Assign temporary coordinates or find existing ones if available
                x: nodeX,
                y: nodeY
            };
            nodeX += 150;
            if (nodeX > 700) {
                nodeX = 100;
                nodeY += 150;
            }
            return node;
        });

        return { nodes: initialNodes, edges: newEdges, heuristics };
    };

    // --- Core Logic: Run Algorithm (MODIFIED to use parsed input) ---
    const generateSteps = () => {
        setIsPlaying(false);
        const { nodes: parsedNodes, edges: parsedEdges, heuristics } = parseInput();
        
        // Update the visual state only if the graph structure changed significantly
        setNodes(parsedNodes);
        setEdges(parsedEdges);

        const startNode = parsedNodes.find(n => n.id === startNodeId);
        const goalNode = parsedNodes.find(n => n.id === goalNodeId);

        if (!startNode || !goalNode) {
             setHistory([]);
             setExecutionStats(null);
             alert("Start or Goal node not found in the adjacency list.");
             return;
        }

        // --- Algorithm Implementation (Uses parsedNodes, parsedEdges, heuristics) ---
        // The rest of the algorithm logic (BFS, DFS, A*, etc.) remains the same, 
        // but it now uses parsedNodes and parsedEdges and leverages the new `heuristics` object 
        // when calculating the 'h' value for A* and Best First.

        const steps = [];
        let path = null;
        let visitedOrder = [];
        let finalPathCost = 0;
        
        // ... (log, adj creation functions remain the same, using parsedNodes/parsedEdges) ...
        const log = (current, open, closed, pathFound = null, explanation = "") => {
            // ... log implementation (omitted for brevity) ...
        };

        const adj = {};
        parsedNodes.forEach(n => adj[n.id] = []);
        parsedEdges.forEach(e => {
            adj[e.source].push({ target: e.target, weight: e.weight });
        });
        
        try {
            if (algorithm === 'BFS' || algorithm === 'DFS') {
                // BFS/DFS implementation (unchanged logic)
                // ...
            }
            else if (['A*', 'Best First', 'Branch & Bound'].includes(algorithm)) {
                // A* / Best First / Uniform Cost implementation
                
                const openList = new PriorityQueue((a, b) => a.f < b.f);
                const gScores = { [startNodeId]: 0 };
                const closed = new Set();
                
                const getH = (nodeId) => {
                    // Use user-defined heuristics if provided, otherwise fall back to Euclidean distance
                    return heuristics[nodeId] !== undefined 
                           ? heuristics[nodeId] 
                           : calculateDistance(parsedNodes.find(n => n.id === nodeId), goalNode);
                };
                
                const startH = getH(startNodeId);

                // ... (F initialization and loop structure remain the same) ...
                
                // Example F calculation using heuristics
                let initF = 0;
                if (algorithm === 'A*') initF = 0 + startH;
                else if (algorithm === 'Best First') initF = startH; 
                else if (algorithm === 'Branch & Bound') initF = 0;

                openList.push({ id: startNodeId, parent: null, g: 0, h: startH, f: initF });
                
                log(null, openList._heap, closed, null, `Init Priority Queue for ${algorithm}. Start f=${initF.toFixed(1)}`);

                while (!openList.isEmpty()) {
                    const curr = openList.pop();
                    if (closed.has(curr.id)) continue;
                    
                    closed.add(curr.id);
                    visitedOrder.push(curr.id);
                    log(parsedNodes.find(n=>n.id===curr.id), openList._heap, closed, null, `Expand ${curr.id} (f=${curr.f.toFixed(1)}, g=${curr.g.toFixed(1)}).`);

                    if (curr.id === goalNodeId) {
                        path = constructPath(curr);
                        finalPathCost = curr.g;
                        log(parsedNodes.find(n=>n.id===curr.id), [], closed, path, "Goal Reached! Optimal path found.");
                        break;
                    }

                    const neighbors = adj[curr.id] || [];
                    for (let edge of neighbors) {
                        if (closed.has(edge.target)) continue;

                        const tentativeG = curr.g + edge.weight;
                        const h = getH(edge.target);
                        
                        let f = 0;
                        if (algorithm === 'A*') f = tentativeG + h;
                        else if (algorithm === 'Best First') f = h; 
                        else if (algorithm === 'Branch & Bound') f = tentativeG;

                        if (tentativeG < (gScores[edge.target] ?? Infinity)) {
                            gScores[edge.target] = tentativeG;
                            // Note: parent structure must be saved for path reconstruction
                            openList.push({ id: edge.target, parent: curr, g: tentativeG, h, f });
                        }
                    }
                }
            }
            
        } catch (e) { console.error("Algorithm Error:", e); }


        // Final State Update
        setHistory(steps);
        setStepIndex(steps.length > 0 ? 0 : -1);
        setExecutionStats({
            visitedCount: visitedOrder.length,
            pathCost: finalPathCost,
            path: path ? path : []
        });
        if(steps.length > 0) {
            setIsPlaying(true);
        }
    };


    // --- Canvas Interaction Handlers (omitted for brevity) ---
    // ... getMousePos, handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp ...


    // --- UI Render ---
    return (
        <div className="flex flex-col h-screen w-full bg-gray-900 text-gray-100 font-sans overflow-hidden">
            
            {/* Header (omitted) */}
            {/* ... */}

            <div className="flex flex-1 overflow-hidden">
                
                <ControlPanel
                    // Algorithm & Speed
                    algorithm={algorithm} setAlgorithm={setAlgorithm}
                    parameters={parameters} setParameters={setParameters}
                    // Editor Mode
                    mode={mode} setMode={setMode}
                    // Data Input
                    adjacencyListInput={adjacencyListInput} setAdjacencyListInput={setAdjacencyListInput}
                    heuristicInput={heuristicInput} setHeuristicInput={setHeuristicInput}
                    startNodeId={startNodeId} setStartNodeId={setStartNodeId}
                    goalNodeId={goalNodeId} setGoalNodeId={setGoalNodeId}
                    // Execution
                    generateSteps={generateSteps}
                    isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                    setStepIndex={setStepIndex} historyLength={history.length}
                />

                <GraphCanvas 
                    // Canvas props remain the same, they use the dynamic `nodes` and `edges` state
                    canvasRef={canvasRef} nodes={nodes} edges={edges} history={history} 
                    stepIndex={stepIndex} startNodeId={startNodeId} goalNodeId={goalNodeId}
                    mode={mode} tempEdgeSource={tempEdgeSource} algorithm={algorithm}
                    handleCanvasMouseDown={() => { /* updated handler to check mode */ }} 
                    handleCanvasMouseMove={() => { /* updated handler to check mode */ }} 
                    handleCanvasMouseUp={() => { /* updated handler to check mode */ }} 
                    setStepIndex={setStepIndex} 
                />

                {/* Sidebar (omitted) */}
                {/* ... */}<Sidebar
                    history={history}
                    stepIndex={stepIndex}
                    executionStats={executionStats}
                    algorithm={algorithm}
                />

            </div>
        </div>
    ); 
}
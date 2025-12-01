import React from "react";
import AdjacencyMatrixInput from "./AdjacencyMatrixInput";
import HeuristicInput from "./HeuristicInput";

export default function SidebarControls({
  algorithm,
  setAlgorithm,
  nodeCount,
  setNodeCount,
  matrix,
  setMatrix,
  heuristics,
  setHeuristics,
  run
}) {
  return (
    <div className="w-80 bg-[#121215] border-r border-gray-800 overflow-y-auto p-5">
      
      {/* Algorithm Selector */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Algorithm
        </h2>

        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="w-full bg-[#1b1b1f] border border-gray-700 rounded px-3 py-2 text-sm text-white 
                     focus:border-blue-500 outline-none shadow-inner"
        >
          {/* VALUES BELOW MUST MATCH BACKEND ENDPOINT NAMES */}
          <option value="a-star">A* Search</option>
          <option value="bfs">Breadth-First Search (BFS)</option>
          <option value="dfs">Depth-First Search (DFS)</option>
          <option value="best-first">Best-First Search</option>
          <option value="branch-and-bound">Branch & Bound</option>
          <option value="beam">Beam Search</option>
          <option value="hill">Hill Climbing</option>
          <option value="dls">Depth-Limited Search (DLS)</option>
        </select>
      </div>

      {/* Node Count */}
      <div className="mb-6">
        <label className="text-xs text-gray-400 block mb-1">Node Count</label>
        <input
          type="number"
          min={2}
          max={40}
          value={nodeCount}
          onChange={(e) => setNodeCount(Number(e.target.value))}
          className="w-full bg-[#1b1b1f] border border-gray-700 rounded px-3 py-2 text-sm text-white"
        />
      </div>

      {/* Matrix */}
      <AdjacencyMatrixInput nodeCount={nodeCount} matrix={matrix} setMatrix={setMatrix} />

      {/* Heuristic */}
      <HeuristicInput heuristics={heuristics} setHeuristics={setHeuristics} />

      {/* Run Button */}
      <button
        onClick={run}
        className="w-full bg-blue-600 hover:bg-blue-500 py-3 mt-4 rounded-md shadow-lg text-white font-bold tracking-wide transition"
      >
        Run Algorithm
      </button>
    </div>
  );
}

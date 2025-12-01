import React, { useState, useEffect } from "react";
import SidebarControls from "../components/SidebarControls";
import GraphCanvas from "../components/GraphCanvas";
import useAlgorithmRunner from "../hooks/useAlgorithmRunner";
import HeaderBar from "../components/HeaderBar";
import StatsPanel from "../components/StatsPanel";
import StepSidebar from "../components/StepSidebar";

export default function GraphSearchDashboard() {
  const [algorithm, setAlgorithm] = useState("A*");
  const [nodeCount, setNodeCount] = useState(4);
  const [matrix, setMatrix] = useState([]);
  const [heuristics, setHeuristics] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [nodes, setNodes] = useState([]);
const [edges, setEdges] = useState([]);  const { steps, stats, execute } = useAlgorithmRunner();

  // initialize matrix + heuristics
  useEffect(() => {
    const m = Array.from({ length: nodeCount }, () =>
      Array(nodeCount).fill("")
    );
    setMatrix(m);

    const h = {};
    for (let i = 0; i < nodeCount; i++) {
      h[String.fromCharCode(65 + i)] = "";
    }
    setHeuristics(h);
  }, [nodeCount]);

 const runSearch = async () => {
  const finalNodes = [];
  const finalEdges = [];

  // Nodes A, B, C...
  for (let i = 0; i < nodeCount; i++) {
    finalNodes.push({
      id: String.fromCharCode(65 + i)
    });
  }

  // Edges from matrix
  for (let r = 0; r < nodeCount; r++) {
    for (let c = 0; c < nodeCount; c++) {
      const w = Number(matrix[r][c]);
      if (!isNaN(w) && w > 0) {
        finalEdges.push({
          from: String.fromCharCode(65 + r),
          to: String.fromCharCode(65 + c),
          weight: w
        });
      }
    }
  }

  // Backend payload
  const payload = {
    nodes: finalNodes.map(n => n.id),
    edges: finalEdges,
    directed: true,
    weighted: true,
    start: "A",
    goal: String.fromCharCode(65 + nodeCount - 1),
    params: { heuristic: heuristics }
  };

  // ❗ FIX HERE
  const ok = await execute(algorithm, payload);

  if (ok) {
    setStepIndex(0);
    setNodes(finalNodes);
    setEdges(finalEdges);
  }
};



  return (
    <div className="flex flex-col h-screen">
      
      <HeaderBar />

      <div className="flex flex-1">
        
        <SidebarControls
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          nodeCount={nodeCount}
          setNodeCount={setNodeCount}
          matrix={matrix}
          setMatrix={setMatrix}
          heuristics={heuristics}
          setHeuristics={setHeuristics}
          run={runSearch}
        />

      <GraphCanvas
  nodes={nodes}
  edges={edges}
  steps={steps}
  stepIndex={stepIndex}
    finalPath={stats?.finalPath}
/>



        <div className="w-64 bg-[#121215] border-l border-gray-800 p-4">
       <StepSidebar
  steps={steps}
  stepIndex={stepIndex}
  setStepIndex={setStepIndex}
/>



          <StatsPanel stats={stats} />
          <button
  onClick={runSearch}
  className="bg-blue-600 text-white px-4 py-2 rounded shadow"
>
  Run Algorithm
</button>

        </div>
      </div>

    </div>
  );
}

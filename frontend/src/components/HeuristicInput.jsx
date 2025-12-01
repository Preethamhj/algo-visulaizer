import React from "react";

export default function HeuristicInput({ heuristics, setHeuristics }) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-2">Heuristics (A*, Best-First)</h3>
      {Object.keys(heuristics).map((k) => (
        <div key={k} className="flex gap-2 mb-1">
          <label className="w-6 text-white">{k}</label>
          <input
            className="flex-1 p-1 bg-gray-800 text-white"
            value={heuristics[k]}
            onChange={(e) =>
              setHeuristics({ ...heuristics, [k]: e.target.value })
            }
          />
        </div>
      ))}
    </div>
  );
}

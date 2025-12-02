import React from "react";

export default function StepSidebar({ steps, stepIndex, setStepIndex }) {
  return (
<div className="w-80 glass neon-border p-4 backdrop-blur-xl">

      <h2 className="text-sm font-bold mb-3">Steps</h2>

      <div className="space-y-2">

        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => setStepIndex(i)}
            className={`p-3 rounded-md border cursor-pointer transition
              ${stepIndex === i ? "border-blue-500 bg-blue-900/30" : "border-gray-700 bg-gray-800"}
            `}
          >
            <div className="text-xs text-gray-400">Step {i + 1}</div>

            <div className="text-white text-sm font-semibold">
              Current: {s.currentNode || "-"}
            </div>

            <div className="text-xs mt-2 text-gray-300">
              <strong className="text-blue-400">Open:</strong> {s.openList?.join(", ") || "empty"}
            </div>

            <div className="text-xs text-gray-300">
              <strong className="text-red-400">Closed:</strong> {s.closedList?.join(", ") || "empty"}
            </div>

            {s.explanation && (
              <div className="glass p-3 mb-3 rounded-md border border-[#00eaff33] hover:border-[#00eaffaa] transition">

                {s.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

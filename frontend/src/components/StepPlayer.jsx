export default function StepPlayer({ steps, stepIndex, setStepIndex }) {
  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="bg-[#141416] p-4 rounded-lg border border-gray-700">
      <h2 className="text-sm font-bold mb-3">Playback</h2>

      <div className="flex gap-2">
        <button onClick={prev} className="px-3 py-1 bg-gray-800 rounded">
          ← Prev
        </button>
        <button onClick={next} className="px-3 py-1 bg-gray-800 rounded">
          Next →
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={steps.length - 1}
        value={stepIndex}
        onChange={(e) => setStepIndex(Number(e.target.value))}
        className="w-full mt-4 accent-blue-500"
      />

      <div className="text-xs mt-2 text-gray-400">
        Step {stepIndex + 1} / {steps.length}
      </div>
    </div>
  );
}

export default function StatsPanel({ stats }) {
  if (!stats) {
    return (
      <div className="text-gray-600 text-xs mt-6">
        Run algorithm to see stats
      </div>
    );
  }

  return (
    <div className="bg-[#1b1b1f] mt-6 p-4 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-sm font-bold text-white mb-2">Execution Summary</h2>

      <div className="text-xs space-y-2">
        <div>Visited Nodes: <span className="text-blue-400">{stats.visitedCount}</span></div>
        <div>Cost: <span className="text-green-400">{stats.cost}</span></div>
        <div>Final Path:</div>
        <pre className="bg-black/30 p-2 rounded text-gray-300">
{stats.finalPath?.join(" → ")}
        </pre>
      </div>
    </div>
  );
}
    
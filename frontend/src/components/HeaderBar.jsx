export default function HeaderBar() {
  return (
<div className="h-14 glass neon-border flex items-center px-6 uppercase tracking-wider text-[#00eaff]">
      <h1 className="text-xl font-bold tracking-wide text-white">
        Graph<span className="text-blue-500">Search</span> Visualizer
      </h1>

      <div className="text-xs text-gray-400">
        Powered by MERN • Step-by-Step Algorithm Visualizer
      </div>
    </div>
  );
}

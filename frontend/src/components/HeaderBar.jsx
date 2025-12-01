export default function HeaderBar() {
  return (
    <div className="h-14 bg-[#131316]/90 backdrop-blur border-b border-gray-700 flex items-center px-6 justify-between shadow-lg">
      <h1 className="text-xl font-bold tracking-wide text-white">
        Graph<span className="text-blue-500">Search</span> Visualizer
      </h1>

      <div className="text-xs text-gray-400">
        Powered by MERN • Step-by-Step Algorithm Visualizer
      </div>
    </div>
  );
}

// /server/controllers/bestFirstController.js
// Greedy Best-First: prioritized solely by heuristic h(n)
module.exports.run = function runBestFirst(req, res) {
  try {
    console.log("Best-First Search controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, start, goal, params = {} } = body;
    const heur = params.heuristic || {};
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      const w = e.weight != null ? e.weight : 1;
      adj[e.from].push({ to: e.to, weight: w });
      if (!directed) adj[e.to].push({ to: e.from, weight: w });
    });

    class PQ {
      constructor(){ this.arr = []; }
      push(node){ this.arr.push(node); this.arr.sort((a,b)=> (heur[a]||0) - (heur[b]||0)); }
      pop(){ return this.arr.shift(); }
      isEmpty(){ return this.arr.length===0; }
      toList(){ return this.arr.slice(); }
    }

    const open = new PQ();
    const parent = {};
    const visited = new Set();
    open.push(start);

    const steps = [];
    let stepIdx = 0;
    while(!open.isEmpty()) {
      const cur = open.pop();
      if (visited.has(cur)) continue;
      visited.add(cur);
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: cur,
        openList: open.toList(),
        closedList: Array.from(visited).filter(n=>n!==cur),
        explanation: `Expanding ${cur} prioritized by heuristic h=${heur[cur]||0}`
      });
      if (cur === goal) break;
      for (const nb of adj[cur] || []) {
        if (!visited.has(nb.to)) {
          parent[nb.to] = cur;
          open.push(nb.to);
        }
      }
    }

    const finalPath = [];
    if (visited.has(goal)) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur===start) break; cur = parent[cur]; }
    }
    return res.json({ visitedOrder: Array.from(visited), finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

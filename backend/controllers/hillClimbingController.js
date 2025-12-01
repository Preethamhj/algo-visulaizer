// /server/controllers/hillClimbingController.js
// Greedy local search that moves to best neighbor by heuristic. Needs params.heuristic map.
module.exports.run = function runHillClimbing(req, res) {
  try {
    console.log("Hill Climbing controller invoked");
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

    const steps = [];
    let stepIdx = 0;
    const visited = new Set();
    const path = [start];
    visited.add(start);
    let current = start;
    let stuck = false;

    while(!stuck) {
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: current,
        openList: adj[current].map(n=>n.to),
        closedList: Array.from(visited),
        explanation: `At ${current}. Selecting neighbor with lowest heuristic value.`
      });
      if (current === goal) break;
      const neighbors = adj[current].filter(n=>!visited.has(n.to));
      if (neighbors.length === 0) { stuck = true; break; }
      // pick neighbor with minimum heuristic
      neighbors.sort((a,b)=> (heur[a.to] || 0) - (heur[b.to] || 0));
      const best = neighbors[0].to;
      if ((heur[best] || 0) >= (heur[current] || 0)) { // no improvement
        stuck = true; break;
      }
      visited.add(best);
      path.push(best);
      current = best;
    }

    const finalPath = (current === goal) ? path : [];
    return res.json({ visitedOrder: Array.from(visited), finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

// /server/controllers/beamSearchController.js
// Beam Search: breadth-level expansion keeping top-k nodes by heuristic each level
module.exports.run = function runBeamSearch(req, res) {
  try {
    console.log("Beam Search controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, start, goal, params = {} } = body;
    const beamWidth = params.beamWidth != null ? params.beamWidth : 2;
    const heur = params.heuristic || {};
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      const w = e.weight != null ? e.weight : 1;
      adj[e.from].push({ to: e.to, weight: w });
      if (!directed) adj[e.to].push({ to: e.from, weight: w });
    });

    let currentLevel = [start];
    const parent = {};
    const visited = new Set([start]);
    const steps = [];
    let stepIdx = 0;
    let found = false;

    while(currentLevel.length && !found) {
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: null,
        openList: currentLevel.slice(),
        closedList: Array.from(visited),
        explanation: `Expanding level with nodes ${currentLevel.join(", ")} and keeping top ${beamWidth} by heuristic`
      });

      // generate successors
      const successors = [];
      for (const node of currentLevel) {
        for (const nb of adj[node] || []) {
          if (!visited.has(nb.to)) {
            successors.push({ parent: node, node: nb.to, h: heur[nb.to] || 0 });
          }
        }
      }
      if (successors.length===0) break;
      // pick top-k successors by heuristic (smallest)
      successors.sort((a,b)=> a.h - b.h);
      const chosen = [];
      for (let i=0;i<Math.min(beamWidth, successors.length);i++) {
        const s = successors[i];
        if (!visited.has(s.node)) {
          visited.add(s.node);
          parent[s.node] = s.parent;
          chosen.push(s.node);
          if (s.node === goal) { found = true; break; }
        }
      }
      currentLevel = chosen;
    }

    const finalPath = [];
    if (visited.has(goal)) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur===start) break; cur = parent[cur]; }
    }

    return res.json({ visitedOrder: Array.from(visited), finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

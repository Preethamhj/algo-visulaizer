// /server/controllers/dfsController.js
module.exports.run = function runDFS(req, res) {
  try {
    console.log("DFS controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, start, goal } = body;
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      adj[e.from].push(e.to);
      if (!directed) adj[e.to].push(e.from);
    });

    const visited = new Set();
    const parent = {};
    const steps = [];
    let stepIdx = 0;
    const stack = [start];

    while(stack.length) {
      const cur = stack.pop();
      if (visited.has(cur)) continue;
      visited.add(cur);
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: cur,
        openList: [...stack],
        closedList: Array.from(visited).filter(n=>n!==cur),
        explanation: `Popped ${cur} from stack and visiting it`
      });
      if (cur === goal) break;
      // push neighbors in reverse to keep deterministic order if desired
      const neighbors = adj[cur] || [];
      for (let i=neighbors.length-1;i>=0;i--) {
        const nb = neighbors[i];
        if (!visited.has(nb)) { parent[nb]=cur; stack.push(nb); }
      }
    }

    const finalPath = [];
    if (visited.has(goal)) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur===start) break; cur = parent[cur]; }
    }
    const visitedOrder = steps.map(s=>s.currentNode);
    return res.json({ visitedOrder, finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

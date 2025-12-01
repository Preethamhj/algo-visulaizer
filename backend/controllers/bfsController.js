// /server/controllers/bfsController.js
module.exports.run = function runBFS(req, res) {
  try {
    console.log("BFS controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, start, goal } = body;
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      adj[e.from].push(e.to);
      if (!directed) adj[e.to].push(e.from);
    });

    const queue = [start];
    const visited = new Set([start]);
    const parent = {};
    const steps = [];
    let stepIdx = 0;

    while(queue.length) {
      const cur = queue.shift();
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: cur,
        openList: [...queue],
        closedList: Array.from(visited).filter(n=>n!==cur),
        explanation: `Visiting ${cur} and enqueueing unvisited neighbors`
      });
      if (cur === goal) break;
      for (const nb of adj[cur] || []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          parent[nb] = cur;
          queue.push(nb);
        }
      }
    }

    const finalPath = [];
    if (visited.has(goal)) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur === start) break; cur = parent[cur]; }
    }
    const visitedOrder = steps.map(s=>s.currentNode);
    return res.json({ visitedOrder, finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

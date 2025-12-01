// /server/controllers/dlsController.js
module.exports.run = function runDLS(req, res) {
  try {
    console.log("DLS controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, start, goal, params = {} } = body;
    const depthLimit = params.depthLimit != null ? params.depthLimit : 3;
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      adj[e.from].push(e.to);
      if (!directed) adj[e.to].push(e.from);
    });

    const steps = [];
    let stepIdx = 0;
    const parent = {};
    let found = false;

    function dfs(node, depth) {
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: node,
        openList: [], // DLS is recursive - open list omitted or could show call stack
        closedList: [],
        explanation: `Visiting ${node} at depth ${depth}`
      });
      if (node === goal) { found = true; return true; }
      if (depth >= depthLimit) return false;
      for (const nb of adj[node] || []) {
        if (found) return true;
        if (!parent[nb]) parent[nb] = node;
        if (dfs(nb, depth+1)) return true;
      }
      return false;
    }

    parent[start] = null;
    dfs(start, 0);

    const finalPath = [];
    if (found) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur===start) break; cur = parent[cur]; }
    }

    const visitedOrder = steps.map(s=>s.currentNode);
    return res.json({ visitedOrder, finalPath, cost: null, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

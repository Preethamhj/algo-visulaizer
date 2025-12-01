// /server/controllers/branchAndBoundController.js
// Branch and Bound implemented as Uniform Cost Search (Dijkstra-like)
module.exports.run = function runBranchAndBound(req, res) {
  try {
    console.log("Branch and Bound controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, weighted = true, start, goal } = body;
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    const adj = {}; nodes.forEach(n=> adj[n]=[]);
    edges.forEach(e=>{
      const w = weighted ? (e.weight != null ? e.weight : 1) : 1;
      adj[e.from].push({ to: e.to, weight: w });
      if (!directed) adj[e.to].push({ to: e.from, weight: w });
    });

    class PQ {
      constructor(){ this.arr = []; }
      push(item){ this.arr.push(item); this.arr.sort((a,b)=> a.cost - b.cost); }
      pop(){ return this.arr.shift(); }
      isEmpty(){ return this.arr.length===0; }
      toList(){ return this.arr.map(i=>i.node); }
    }

    const open = new PQ();
    const costSoFar = {}; nodes.forEach(n=> costSoFar[n]=Infinity);
    const parent = {};
    const steps = [];
    let stepIdx = 0;

    costSoFar[start] = 0;
    open.push({ node: start, cost: 0 });

    const closed = new Set();

    while(!open.isEmpty()) {
      const cur = open.pop();
      const n = cur.node;
      // if seen with higher cost, skip
      if (cur.cost > costSoFar[n]) continue;
      stepIdx++;
      steps.push({
        step: stepIdx,
        currentNode: n,
        openList: open.toList(),
        closedList: Array.from(closed),
        explanation: `Expanding ${n} with current bound cost=${cur.cost}`
      });

      if (n === goal) break;
      closed.add(n);

      for (const edge of adj[n]) {
        const nb = edge.to;
        const newCost = costSoFar[n] + edge.weight;
        if (newCost < costSoFar[nb]) {
          costSoFar[nb] = newCost;
          parent[nb] = n;
          open.push({ node: nb, cost: newCost });
        }
      }
    }

    const finalPath = [];
    let finalCost = null;
    if (costSoFar[goal] !== Infinity) {
      finalCost = costSoFar[goal];
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur===start) break; cur = parent[cur]; }
    }

    const visitedOrder = steps.map(s=>s.currentNode);
    return res.json({ visitedOrder, finalPath, cost: finalCost, steps });
  } catch(err){ return res.status(500).json({ error: err.message }); }
};

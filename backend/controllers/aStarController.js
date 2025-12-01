// /server/controllers/aStarController.js
// A* Search controller - expects optional heuristic function in params.heuristic as an object mapping node->value
// If params.heuristic not provided, defaults to 0 (behaves like Dijkstra if weighted true).
module.exports.run = function runAstar(req, res) {
  try {
    console.log("A* Search controller invoked");
    const body = req.body || {};
    const { nodes = [], edges = [], directed = false, weighted = false, start, goal, params = {} } = body;
    if (!start || !goal) return res.status(400).json({ error: "start and goal required" });

    // build adjacency list (neighbors: [{to, weight}])
    const adj = {};
    nodes.forEach(n => adj[n] = []);
    edges.forEach(e => {
      const w = weighted ? (e.weight != null ? e.weight : 1) : 1;
      adj[e.from].push({ to: e.to, weight: w });
      if (!directed) adj[e.to].push({ to: e.from, weight: w });
    });

    // heuristic: either map provided or function that returns 0
    const heurMap = params.heuristic || {};
    const h = (n) => (heurMap[n] != null ? heurMap[n] : 0);

    // Priority queue by f = g + h
    class PQ {
      constructor(){ this.arr = []; }
      push(item){ this.arr.push(item); this.arr.sort((a,b)=>a.f - b.f); }
      pop(){ return this.arr.shift(); }
      isEmpty(){ return this.arr.length === 0; }
      toList(){ return this.arr.map(i=>i.node); }
    }

    const open = new PQ();
    const cameFrom = {}; // node -> parent
    const gScore = {}; nodes.forEach(n=> gScore[n]=Infinity);
    const closedSet = new Set();
    const steps = [];
    let stepIdx = 0;

    gScore[start] = 0;
    open.push({ node: start, f: gScore[start] + h(start), g: gScore[start] });

    while(!open.isEmpty()) {
      const current = open.pop();
      const curNode = current.node;
      stepIdx++;
      // snapshot lists
      steps.push({
        step: stepIdx,
        currentNode: curNode,
        openList: open.toList(),
        closedList: Array.from(closedSet),
        explanation: `Expanding ${curNode} with g=${gScore[curNode]} and h=${h(curNode)}`
      });

      if (curNode === goal) break;
      closedSet.add(curNode);

      for (const edge of adj[curNode]) {
        const neighbor = edge.to;
        if (closedSet.has(neighbor)) continue;
        const tentativeG = gScore[curNode] + edge.weight;
        if (tentativeG < gScore[neighbor]) {
          cameFrom[neighbor] = curNode;
          gScore[neighbor] = tentativeG;
          open.push({ node: neighbor, f: tentativeG + h(neighbor), g: tentativeG });
        }
      }
    }

    // reconstruct path if exists
    const finalPath = [];
    let cost = null;
    if (gScore[goal] !== Infinity) {
      let cur = goal;
      while(cur) { finalPath.unshift(cur); if (cur === start) break; cur = cameFrom[cur]; }
      cost = gScore[goal];
    }

    const visitedOrder = steps.map(s=>s.currentNode);
    return res.json({ visitedOrder, finalPath, cost, steps });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

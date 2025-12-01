// src/api/algorithms.js
import axios from "axios";

const BASE_URL = "http://localhost:8000/api/run";

// canonical map: frontend names (many variants) -> backend endpoint
const CANONICAL_MAP = {
  // A*
  "a*": "a-star",
  "a-star": "a-star",
  "a* search": "a-star",
  "a star": "a-star",
  "a-star search": "a-star",

  // BFS
  "bfs": "bfs",
  "breadth-first": "bfs",
  "breadth-first search": "bfs",
  "breadth first": "bfs",

  // DFS
  "dfs": "dfs",
  "depth-first": "dfs",
  "depth-first search": "dfs",
  "depth first": "dfs",

  // Best-first
  "best-first": "best-first",
  "best first": "best-first",
  "greedy": "best-first",

  // Branch & Bound
  "branch-and-bound": "branch-and-bound",
  "branch and bound": "branch-and-bound",

  // Beam
  "beam": "beam",
  "beam search": "beam",

  // Hill
  "hill": "hill",
  "hill climbing": "hill",

  // DLS
  "dls": "dls",
  "depth-limited": "dls",
  "depth limited": "dls"
};

// helper normalizer
function normalizeAlgName(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  // try direct lookup
  if (CANONICAL_MAP[s]) return CANONICAL_MAP[s];
  // remove punctuation and multiple spaces
  const cleaned = s.replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim();
  if (CANONICAL_MAP[cleaned]) return CANONICAL_MAP[cleaned];
  // fallback: try dashified
  const dash = cleaned.replace(/\s+/g, "-");
  if (CANONICAL_MAP[dash]) return CANONICAL_MAP[dash];
  // last fallback: return raw as-lower (use only if already matches endpoint)
  return s;
}

export async function runAlgorithm(algorithm, payload) {
  const endpointKey = normalizeAlgName(algorithm);

  // final endpoint
  const endpoint = `${BASE_URL}/${endpointKey}`;

  // debug log — remove in production if you like
  console.debug("[runAlgorithm] algorithm:", algorithm, "-> endpoint:", endpoint);

  // axios post
  const response = await axios.post(endpoint, payload);
  return response.data;
}

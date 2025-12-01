import { useState } from "react";
import { runAlgorithm } from "../api/algorithms";

export default function useAlgorithmRunner() {
  const [steps, setSteps] = useState([]);
  const [stats, setStats] = useState(null);

  const execute = async (algo, graphPayload) => {
    try {
      const result = await runAlgorithm(algo, graphPayload);

      setSteps(result.steps || []);
      setStats({
        visitedCount: result.visitedCount,
        finalPath: result.finalPath,
        cost: result.cost
      });

      return true;
    } catch (err) {
      console.error("Execution error:", err);
      return false;
    }
  };

  return { steps, stats, execute };
}

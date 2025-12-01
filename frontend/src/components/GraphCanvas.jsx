import React, { useRef, useEffect, useState } from "react";

export default function GraphCanvas({ nodes, edges, steps, stepIndex }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const step = steps[stepIndex] || {};

  const [size, setSize] = useState({ width: 900, height: 600 });

  // Resize canvas automatically to fit container
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;

      setSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Auto-scaling helpers
  const getRadius = (count, w, h) => {
    const base = Math.min(w, h) / 2.3;
    if (count <= 5) return base;
    if (count <= 10) return base * 0.8;
    if (count <= 20) return base * 0.65;
    if (count <= 30) return base * 0.5;
    if (count <= 40) return base * 0.4;
    return base * 0.35;
  };

  const getNodeRadius = (count) =>
    count <= 6 ? 25 : count <= 12 ? 20 : count <= 20 ? 15 : 12;

  const getStroke = (count) =>
    count <= 10 ? 3 : count <= 20 ? 2 : 1.5;

  // Auto-layout nodes
  const layoutNodes = (n) => {
    const radius = getRadius(n.length, size.width, size.height);
    const angleStep = (2 * Math.PI) / n.length;

    return n.map((node, idx) => ({
      ...node,
      x: size.width / 2 + radius * Math.cos(idx * angleStep),
      y: size.height / 2 + radius * Math.sin(idx * angleStep),
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size.width, size.height);

    const laidOut = layoutNodes(nodes);
    const nodeRadius = getNodeRadius(nodes.length);
    const strokeWidth = getStroke(nodes.length);

    const drawArrow = (sx, sy, ex, ey) => {
      const angle = Math.atan2(ey - sy, ex - sx);
      const head = 10;

      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - head * Math.cos(angle - Math.PI / 6), ey - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ex - head * Math.cos(angle + Math.PI / 6), ey - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    // Edges
    edges.forEach((e) => {
      const from = laidOut.find((n) => n.id === e.from || n.id === e.source);
      const to = laidOut.find((n) => n.id === e.to || n.id === e.target);
      if (!from || !to) return;

      ctx.strokeStyle = "#4caf50";
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      drawArrow(from.x, from.y, to.x, to.y);
    });

    // Nodes
    laidOut.forEach((node) => {
      ctx.beginPath();

      let fill = "#1f2937", border = "#4b5563";

      if (node.id === step.currentNode) {
        fill = "#facc15";
        border = "#fbbf24";
      } else if (step.closedList?.includes(node.id)) {
        fill = "#ef4444";
        border = "#f87171";
      } else if (step.openList?.includes(node.id)) {
        fill = "#3b82f6";
        border = "#60a5fa";
      }

      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = border;
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = `${nodeRadius}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, node.x, node.y);
    });
  }, [nodes, edges, steps, stepIndex, size]);

  return (
    <div ref={containerRef} className="flex-1 h-full w-full">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="rounded-lg bg-[#141416]"
      />
    </div>
  );
}

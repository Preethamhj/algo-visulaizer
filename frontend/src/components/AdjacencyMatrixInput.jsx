import React from "react";

export default function AdjacencyMatrixInput({ nodeCount, matrix, setMatrix }) {
  const updateCell = (r, c, val) => {
    const m = [...matrix];
    m[r][c] = val;
    setMatrix(m);
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-2">Adjacency Matrix</h3>
      <table className="border text-xs">
        <tbody>
          {matrix.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border p-1">
                  <input
                    className="w-10 text-center bg-gray-800 text-white"
                    value={cell}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

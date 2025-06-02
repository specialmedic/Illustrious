import React, { useRef } from "react";
import { Molecule, Atom, Bond } from "../model";

export interface MoleculeCanvasProps {
  molecule: Molecule;
  mode?: string;
  onCanvasClick: (x: number, y: number) => void;
  onAtomMouseDown?: (atomId: string, x: number, y: number) => void;
  onAtomMouseUp?: (atomId: string, x: number, y: number) => void;
  onCanvasMouseMove?: (x: number, y: number) => void;
  onCanvasMouseUp?: (x: number, y: number) => void;
  dragStartAtomId?: string | null;
  dragPos?: { x: number, y: number } | null;
}

const MoleculeCanvas: React.FC<MoleculeCanvasProps> = ({
  molecule,
  mode,
  onCanvasClick,
  onAtomMouseDown,
  onAtomMouseUp,
  onCanvasMouseMove,
  onCanvasMouseUp,
  dragStartAtomId,
  dragPos
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  function getRelativeCoords(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  return (
    <svg
      ref={svgRef}
      width="800"
      height="600"
      style={{ border: "1px solid #ccc", cursor: dragStartAtomId ? "crosshair" : "default" }}
      onClick={e => {
        if (!dragStartAtomId) {
          const { x, y } = getRelativeCoords(e);
          onCanvasClick(x, y);
        }
      }}
      onMouseMove={e => {
        if (onCanvasMouseMove) {
          const { x, y } = getRelativeCoords(e);
          onCanvasMouseMove(x, y);
        }
      }}
      onMouseUp={e => {
        if (onCanvasMouseUp) {
          const { x, y } = getRelativeCoords(e);
          onCanvasMouseUp(x, y);
        }
      }}
    >
      {Object.values(molecule.bonds).map((bond: Bond) => {
        const a1 = molecule.atoms[bond.beginAtomId];
        const a2 = molecule.atoms[bond.endAtomId];
        return (
          <line
            key={bond.id}
            x1={a1.x}
            y1={a1.y}
            x2={a2.x}
            y2={a2.y}
            stroke="black"
            strokeWidth={bond.order * 2}
          />
        );
      })}
      {/* Drag preview (only in atom mode) */}
      {mode === "atom" && dragStartAtomId && dragPos && (() => {
        const a1 = molecule.atoms[dragStartAtomId];
        return (
          <line
            x1={a1.x}
            y1={a1.y}
            x2={dragPos.x}
            y2={dragPos.y}
            stroke="gray"
            strokeDasharray="4 3"
            strokeWidth={2}
          />
        );
      })()}
      {Object.values(molecule.atoms).map((atom: Atom) => (
        <g
          key={atom.id}
          onMouseDown={e => {
            if (onAtomMouseDown) {
              const { x, y } = getRelativeCoords(e as any);
              onAtomMouseDown(atom.id, x, y);
              e.stopPropagation();
            }
          }}
          onMouseUp={e => {
            if (onAtomMouseUp) {
              const { x, y } = getRelativeCoords(e as any);
              onAtomMouseUp(atom.id, x, y);
              e.stopPropagation();
            }
          }}
        >
          <circle cx={atom.x} cy={atom.y} r={10} fill="white" stroke="black" />
          <text x={atom.x} y={atom.y + 4} textAnchor="middle">{atom.element}</text>
        </g>
      ))}
    </svg>
  );
};

export default MoleculeCanvas;
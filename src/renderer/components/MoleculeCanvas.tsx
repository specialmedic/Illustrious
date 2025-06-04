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

// ...all your rendering/label logic unchanged...

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
      {/* ... bond rendering code ... */}
      {/* ... drag preview ... */}
      {(Object.values(molecule.atoms) as Atom[]).map((atom: Atom) => (
        <g
          key={atom.id}
          onMouseDown={e => {
            if (onAtomMouseDown) {
              const { x, y } = getRelativeCoords(e as any);
              onAtomMouseDown(atom.id, x, y);
              e.stopPropagation(); // <-- THIS IS IMPORTANT
            }
          }}
          onMouseUp={e => {
            if (onAtomMouseUp) {
              const { x, y } = getRelativeCoords(e as any);
              onAtomMouseUp(atom.id, x, y);
              e.stopPropagation(); // <-- THIS IS IMPORTANT
            }
          }}
          style={{ cursor: "pointer" }}
        >
          {/* ... atom label rendering ... */}
        </g>
      ))}
    </svg>
  );
};

export default MoleculeCanvas;
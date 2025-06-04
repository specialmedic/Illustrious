import React, { useRef } from "react";
import { Molecule, Atom, Bond, BondOrder } from "../model";

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

const CLICK_RADIUS = 12;

function getAtomBondCount(atom: Atom, molecule: Molecule): number {
  return Object.values(molecule.bonds as Record<string, Bond>).reduce(
    (sum, b) =>
      b.beginAtomId === atom.id || b.endAtomId === atom.id ? sum + b.order : sum,
    0
  );
}

function renderBondLines(a1: Atom, a2: Atom, order: BondOrder): JSX.Element[] {
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const len = Math.hypot(dx, dy) || 1;
  const offsetX = (-dy / len) * 4;
  const offsetY = (dx / len) * 4;

  const lines: JSX.Element[] = [];
  const baseProps = { stroke: 'black', strokeWidth: 2 };

  if (order === 1) {
    lines.push(
      <line key="s" x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} {...baseProps} />
    );
  } else if (order === 2) {
    lines.push(
      <line
        key="d1"
        x1={a1.x + offsetX}
        y1={a1.y + offsetY}
        x2={a2.x + offsetX}
        y2={a2.y + offsetY}
        {...baseProps}
      />
    );
    lines.push(
      <line
        key="d2"
        x1={a1.x - offsetX}
        y1={a1.y - offsetY}
        x2={a2.x - offsetX}
        y2={a2.y - offsetY}
        {...baseProps}
      />
    );
  } else {
    lines.push(
      <line
        key="t1"
        x1={a1.x + offsetX}
        y1={a1.y + offsetY}
        x2={a2.x + offsetX}
        y2={a2.y + offsetY}
        {...baseProps}
      />
    );
    lines.push(
      <line key="t2" x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} {...baseProps} />
    );
    lines.push(
      <line
        key="t3"
        x1={a1.x - offsetX}
        y1={a1.y - offsetY}
        x2={a2.x - offsetX}
        y2={a2.y - offsetY}
        {...baseProps}
      />
    );
  }

  return lines;
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
{/* Draw bonds as lines */}
{Object.values(molecule.bonds).map((bond: Bond) => {
  const a1 = molecule.atoms[bond.beginAtomId];
  const a2 = molecule.atoms[bond.endAtomId];
  if (!a1 || !a2) return null;
  return renderBondLines(a1, a2, bond.order);
})}

{/* Drag preview for bond drawing */}
{mode === "atom" && dragStartAtomId && dragPos && (() => {
  const a1 = molecule.atoms[dragStartAtomId];
  if (!a1) return null;
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

{(Object.values(molecule.atoms) as Atom[]).map((atom: Atom) => {
  const isCarbon = atom.element === "C" || atom.element === "c";
  const isNitrogen = atom.element === "N" || atom.element === "n";
  const isHydrogenAtom = atom.element === "H" || atom.element === "h";
  const bondCount = getAtomBondCount(atom, molecule);

  return (
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
      onClick={e => {
        // Prevent canvas click from firing when making bonds
        e.stopPropagation();
      }}
      style={{ cursor: "pointer" }}
    >
      {/* Transparent clickable region for all atoms */}
      <circle
        cx={atom.x}
        cy={atom.y}
        r={CLICK_RADIUS}
        fill="transparent"
        stroke="none"
        pointerEvents="all"
      />
      {/* Unbonded carbon = methyl group (show as CH₃, no circle) */}
      {isCarbon && bondCount === 0 && (
        <text x={atom.x} y={atom.y + 7} textAnchor="middle" fontSize="22" fontFamily="sans-serif">
          {"CH"}
          <tspan fontSize="14" baselineShift="sub">3</tspan>
        </text>
      )}
      {/* Nitrogen with explicit hydrogens, auto-flipping if needed */}
      {isNitrogen && (() => {
        const numH = Math.max(0, 3 - bondCount);

        if (numH === 0) {
          return (
            <text x={atom.x} y={atom.y + 7} textAnchor="middle" fontSize="22" fontFamily="sans-serif" fill="#003399">
              N
            </text>
          );
        }

        // Check angles to flip H/N if there's a likely intersection
        const bondAngles = (Object.values(molecule.bonds) as Bond[])
          .filter(b => b.beginAtomId === atom.id || b.endAtomId === atom.id)
          .map(b => {
            const otherId = b.beginAtomId === atom.id ? b.endAtomId : b.beginAtomId;
            const other = molecule.atoms[otherId];
            if (!other) return null;
            return Math.atan2(other.y - atom.y, other.x - atom.x);
          })
          .filter(a => a !== null) as number[];

        const preferred = 0;
        const labelWedge = Math.PI / 4;

        let flip = false;
        for (const angle of bondAngles) {
          let delta = Math.atan2(Math.sin(angle - preferred), Math.cos(angle - preferred));
          if (Math.abs(delta) < labelWedge) {
            flip = true;
            break;
          }
        }

        if (numH === 1) {
          return (
            <text x={atom.x} y={atom.y + 7} textAnchor="middle" fontSize="22" fontFamily="sans-serif" fill="#003399">
              {flip ? "HN" : "NH"}
            </text>
          );
        }

        if (flip) {
          // H₂N, H₃N
          return (
            <text x={atom.x} y={atom.y + 7} textAnchor="middle" fontSize="22" fontFamily="sans-serif" fill="#003399">
              H<tspan fontSize="14" baselineShift="sub">{numH}</tspan>N
            </text>
          );
        } else {
          // NH₂, NH₃
          return (
            <text x={atom.x} y={atom.y + 7} textAnchor="middle" fontSize="22" fontFamily="sans-serif" fill="#003399">
              N
              H<tspan fontSize="14" baselineShift="sub">{numH}</tspan>
            </text>
          );
        }
      })()}
      {isHydrogenAtom && (
        <text
          x={atom.x}
          y={atom.y + 7}
          textAnchor="middle"
          fontSize="22"
          fontFamily="sans-serif"
        >
          H
        </text>
      )}
      {!isCarbon && !isNitrogen && !isHydrogenAtom && (
        <text
          x={atom.x}
          y={atom.y + 7}
          textAnchor="middle"
          fontSize="22"
          fontFamily="sans-serif"
        >
          {atom.element}
        </text>
      )}
    </g>
  );
})}
</svg>
  );
};

export default MoleculeCanvas;
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

function getAtomBondCount(atom: Atom, molecule: Molecule) {
  return Object.values(molecule.bonds).filter(
    (bond) => (bond as Bond).beginAtomId === atom.id || (bond as Bond).endAtomId === atom.id
  ).length;
}

// Utility to get all adjacent bonds (other than the given bond) for a particular atom
function getAdjacentBonds(atom: Atom, excludeBondId: string, molecule: Molecule): Bond[] {
  return Object.values(molecule.bonds).filter(
    (bond) =>
      bond.id !== excludeBondId &&
      (bond.beginAtomId === atom.id || bond.endAtomId === atom.id)
  ) as Bond[];
}

// Helper to compute the smaller angle side (the "inside") for a double bond
function getInsideOffsetDirection(
  a1: Atom,
  a2: Atom,
  bondId: string,
  molecule: Molecule
): number {
  // Try to find the adjacent bond at a1 and a2 that gives the smallest angle
  // The inside is where the smaller angle (usually ~120°) is
  const mainDx = a2.x - a1.x;
  const mainDy = a2.y - a1.y;
  const mainAngle = Math.atan2(mainDy, mainDx);

  let minDelta = Math.PI;
  let insideSign = 1; // +1 or -1 for normal direction

  [a1, a2].forEach((atom, idx) => {
    const adj = getAdjacentBonds(atom, bondId, molecule);
    adj.forEach(bond => {
      const otherId = bond.beginAtomId === atom.id ? bond.endAtomId : bond.beginAtomId;
      const otherAtom = molecule.atoms[otherId];
      if (!otherAtom) return;
      const vecDx = otherAtom.x - atom.x;
      const vecDy = otherAtom.y - atom.y;
      const vecAngle = Math.atan2(vecDy, vecDx);

      // angle between this bond and main bond, mapped to [0, PI]
      let delta = Math.abs(((vecAngle - mainAngle + Math.PI) % (2 * Math.PI)) - Math.PI);
      if (delta < minDelta) {
        minDelta = delta;
        // If the other atom is to the left of the main bond from a1->a2, sign is -1; otherwise +1
        // Normal vector for main bond is (-dy, dx)
        const nx = -mainDy;
        const ny = mainDx;
        const ox = otherAtom.x - ((idx === 0) ? a1.x : a2.x);
        const oy = otherAtom.y - ((idx === 0) ? a1.y : a2.y);
        // dot product to determine side
        const dot = nx * ox + ny * oy;
        insideSign = dot > 0 ? 1 : -1;
      }
    });
  });
  return insideSign;
}

const CLICK_RADIUS = 18;
const BOND_OFFSET = 6; // Offset in pixels for double/triple bonds
const SHORT_BOND_FRAC = 0.7; // Fraction of full length for the short lines

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

  function renderBondLines(a1: Atom, a2: Atom, order: number, bond: Bond) {
    const dx = a2.x - a1.x;
    const dy = a2.y - a1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return null;

    // Main direction (unit vector)
    const ux = dx / length;
    const uy = dy / length;
    // Normal (perpendicular, unit)
    const nx = -uy;
    const ny = ux;

    const lines = [];

    // Single bond: just the main line
    lines.push(
      <line
        key={bond.id + "_main"}
        x1={a1.x}
        y1={a1.y}
        x2={a2.x}
        y2={a2.y}
        stroke="black"
        strokeWidth={2}
      />
    );

    if (order === 2) {
      // Place a shorter line on the "inside" (smaller angle)
      const insideSign = getInsideOffsetDirection(a1, a2, bond.id, molecule);
      const offset = BOND_OFFSET * insideSign;

      // Make the short line start/end at 15% and 85% of the main line
      const fracStart = 0.15;
      const fracEnd = 0.85;
      const sx = a1.x + dx * fracStart + nx * offset;
      const sy = a1.y + dy * fracStart + ny * offset;
      const ex = a1.x + dx * fracEnd + nx * offset;
      const ey = a1.y + dy * fracEnd + ny * offset;

      lines.push(
        <line
          key={bond.id + "_db_short"}
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          stroke="black"
          strokeWidth={2}
        />
      );
    }

    if (order === 3) {
      // Place two short lines symmetrically on both sides (linear triple bond)
      const offset1 = BOND_OFFSET;
      const offset2 = -BOND_OFFSET;
      const fracStart = 0.15;
      const fracEnd = 0.85;

      // First short line (side 1)
      lines.push(
        <line
          key={bond.id + "_tb_short1"}
          x1={a1.x + dx * fracStart + nx * offset1}
          y1={a1.y + dy * fracStart + ny * offset1}
          x2={a1.x + dx * fracEnd + nx * offset1}
          y2={a1.y + dy * fracEnd + ny * offset1}
          stroke="black"
          strokeWidth={2}
        />
      );
      // Second short line (side 2)
      lines.push(
        <line
          key={bond.id + "_tb_short2"}
          x1={a1.x + dx * fracStart + nx * offset2}
          y1={a1.y + dy * fracStart + ny * offset2}
          x2={a1.x + dx * fracEnd + nx * offset2}
          y2={a1.y + dy * fracEnd + ny * offset2}
          stroke="black"
          strokeWidth={2}
        />
      );
    }

    return lines;
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
        return renderBondLines(a1, a2, bond.order, bond);
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

      {/* Atom rendering (labels, clickable overlays) */}
      {Object.values(molecule.atoms).map((atom: Atom) => {
        const isCarbon = atom.element === "C" || atom.element === "c";
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
                <tspan baselineShift="sub" fontSize="14">3</tspan>
              </text>
            )}
            {/* Show explicit label and circle for heteroatoms */}
            {!isCarbon && (
              <>
                <circle cx={atom.x} cy={atom.y} r={10} fill="white" stroke="black" />
                <text x={atom.x} y={atom.y + 4} textAnchor="middle" fontSize="17" fontFamily="sans-serif">
                  {atom.element}
                </text>
              </>
            )}
            {/* For carbons with bonds, don't draw anything except invisible clickable region */}
          </g>
        );
      })}
    </svg>
  );
};

export default MoleculeCanvas;
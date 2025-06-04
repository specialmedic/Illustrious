import React, { useState } from "react";
import MoleculeCanvas from "./components/MoleculeCanvas";
import Toolbar from "./components/Toolbar";
import { Molecule, Atom, Bond } from "./model";

const BOND_TYPES = ["single", "double", "triple", "wedge", "dash"] as const;
type BondType = typeof BOND_TYPES[number];
const RING_TYPES = ["cyclopentane", "cyclohexane", "benzene"] as const;
type RingType = typeof RING_TYPES[number];

const MAX_VALENCE: Record<string, number> = {
  C: 4, N: 3, O: 2, S: 2, P: 3,
  Cl: 1, Br: 1, I: 1, F: 1, H: 1,
};
const BOND_LENGTH = 40;

function getAtomValence(atomId: string, molecule: Molecule): number {
  return Object.values(molecule.bonds as Record<string, Bond>)
    .filter((bond: Bond) => bond.beginAtomId === atomId || bond.endAtomId === atomId)
    .reduce((sum, bond) => sum + bond.order, 0);
}

function getNextBondAngle(atom: Atom, molecule: Molecule): number {
  const bonds = Object.values(molecule.bonds).filter(
    (b) => b.beginAtomId === atom.id || b.endAtomId === atom.id
  ) as Bond[];
  if (bonds.length === 0) return 0; // Default to horizontal (right)

  const existingAngles = bonds.map(b => {
    const otherId = b.beginAtomId === atom.id ? b.endAtomId : b.beginAtomId;
    const other = molecule.atoms[otherId];
    return other ? Math.atan2(other.y - atom.y, other.x - atom.x) : 0;
  });

  // Special case for a single existing bond: grow at ~120° to create zig-zag
  if (existingAngles.length === 1) {
    const base = existingAngles[0];
    const offset = (2 * Math.PI) / 3; // 120°
    const candidate1 = base + offset;
    const candidate2 = base - offset;
    // Choose the option that gives larger vertical component for nicer zig-zag
    return Math.abs(Math.sin(candidate1)) > Math.abs(Math.sin(candidate2))
      ? candidate1
      : candidate2;
  }

  // Otherwise, find the angle that maximizes distance from existing bonds
  let bestAngle = 0;
  let bestDist = -1;
  for (let a = 0; a < 2 * Math.PI; a += 0.01) {
    let minDist = Infinity;
    for (const used of existingAngles) {
      const diff = Math.abs(Math.atan2(Math.sin(a - used), Math.cos(a - used)));
      if (diff < minDist) minDist = diff;
    }
    if (minDist > bestDist) {
      bestDist = minDist;
      bestAngle = a;
    }
  }
  return bestAngle;
}

const App: React.FC = () => {
  const [molecule, setMolecule] = useState<Molecule>({ atoms: {}, bonds: {} });
  const [element, setElement] = useState<string>("C");
  const [bondType, setBondType] = useState<BondType>("single");
  const [dragStartAtomId, setDragStartAtomId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);

  // Free-field click: add an atom
  function handleCanvasClick(x: number, y: number) {
    // Only add if not currently finishing an atom click (see below)
    // This is now guaranteed by stopPropagation in MoleculeCanvas
    const id = "atom_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    setMolecule(prev => ({
      ...prev,
      atoms: { ...prev.atoms, [id]: { id, x, y, element } }
    }));
  }

  // Click on carbon: grow chain!
  function handleAtomMouseUp(atomId: string, x: number, y: number) {
    const atom = molecule.atoms[atomId];
    if (!atom) return;

    if ((atom.element === "C" || atom.element === "c") && (element === "C" || element === "c")) {
      // Valence check
      const currValence = getAtomValence(atom.id, molecule);
      const maxValence = MAX_VALENCE[atom.element] || 4;
      if (currValence >= maxValence) return;

      // Use getNextBondAngle for smart growth
      const angle = getNextBondAngle(atom, molecule);
      const newX = atom.x + Math.cos(angle) * BOND_LENGTH;
      const newY = atom.y + Math.sin(angle) * BOND_LENGTH;

      const newId = "atom_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const newAtom: Atom = { id: newId, x: newX, y: newY, element: "C" };

      const bondId = "bond_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const newBond: Bond = {
        id: bondId,
        beginAtomId: atom.id,
        endAtomId: newId,
        order: bondType === "single" ? 1 : bondType === "double" ? 2 : bondType === "triple" ? 3 : 1,
      };

      setMolecule(prev => ({
        atoms: { ...prev.atoms, [newId]: newAtom },
        bonds: { ...prev.bonds, [bondId]: newBond }
      }));
    }

    setDragStartAtomId(null);
    setDragPos(null);
  }

  function handleAtomMouseDown(atomId: string, x: number, y: number) {
    setDragStartAtomId(atomId);
    setDragPos({ x, y });
  }

  function handleCanvasMouseMove(x: number, y: number) {
    if (dragStartAtomId) setDragPos({ x, y });
  }

  function handleCanvasMouseUp(x: number, y: number) {
    setDragStartAtomId(null);
    setDragPos(null);
  }

  function handleRingAdd(type: RingType) {
    alert(`Ring template "${type}" to be implemented!`);
  }

  return (
    <div className="app-container" style={{ position: "relative", minHeight: 640 }}>
      <Toolbar
        currentElement={element}
        onElementChange={setElement}
        currentBond={bondType}
        onBondTypeChange={setBondType}
        onRingAdd={handleRingAdd}
      />
      <MoleculeCanvas
        molecule={molecule}
        mode="atom"
        onCanvasClick={handleCanvasClick}
        onAtomMouseDown={handleAtomMouseDown}
        onAtomMouseUp={handleAtomMouseUp}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
        dragStartAtomId={dragStartAtomId}
        dragPos={dragPos}
      />
    </div>
  );
};

export default App;
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

  // If only one bond, extend in opposite direction (straight chain)
  if (bonds.length === 1) {
    const otherId = bonds[0].beginAtomId === atom.id ? bonds[0].endAtomId : bonds[0].beginAtomId;
    const otherAtom = molecule.atoms[otherId];
    if (!otherAtom) return 0;
    return Math.atan2(atom.y - otherAtom.y, atom.x - otherAtom.x);
  }
  // If more than one bond, find a free "spoke" at 120° intervals
  const angles = bonds.map(bond => {
    const otherId = bond.beginAtomId === atom.id ? bond.endAtomId : bond.beginAtomId;
    const otherAtom = molecule.atoms[otherId];
    return otherAtom ? Math.atan2(otherAtom.y - atom.y, otherAtom.x - atom.x) : 0;
  });
  // Find the largest gap between angles (naive, but works for typical use)
  let bestAngle = 0;
  let maxGap = 0;
  const sortedAngles = angles.slice().sort((a, b) => a - b);
  for (let i = 0; i < sortedAngles.length; ++i) {
    const a1 = sortedAngles[i];
    const a2 = sortedAngles[(i + 1) % sortedAngles.length] + (i + 1 === sortedAngles.length ? 2 * Math.PI : 0);
    let diff = a2 - a1;
    if (diff > maxGap) {
      maxGap = diff;
      bestAngle = a1 + diff / 2;
    }
  }
  return bestAngle % (2 * Math.PI);
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
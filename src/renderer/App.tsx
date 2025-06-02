import React, { useState } from "react";
import MoleculeCanvas from "./components/MoleculeCanvas";
import Toolbar, { Mode } from "./components/Toolbar";
import { Molecule, Atom, Bond, BondOrder } from "./model";

const MAX_VALENCE: Record<string, number> = {
  'C': 4, 'N': 3, 'O': 2, 'S': 2, 'P': 3,
  'Cl': 1, 'Br': 1, 'I': 1, 'F': 1, 'H': 1,
};

const BOND_LENGTH = 40;
const DRAG_CLICK_THRESHOLD = 5;

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getAtomValence(atomId: string, molecule: Molecule): number {
  return Object.values(molecule.bonds as Record<string, Bond>)
    .filter((bond: Bond) => bond.beginAtomId === atomId || bond.endAtomId === atomId)
    .reduce((sum, bond) => sum + bond.order, 0);
}

function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

function getOrderedBondAngle(atom: Atom, molecule: Molecule): number {
  const connectedBonds = (Object.values(molecule.bonds) as Bond[]).filter(
    bond => bond.beginAtomId === atom.id || bond.endAtomId === atom.id
  );
  if (connectedBonds.length === 0) return 0;
  const refBond = connectedBonds[0];
  const otherId = refBond.beginAtomId === atom.id ? refBond.endAtomId : refBond.beginAtomId;
  const otherAtom = molecule.atoms[otherId];
  if (!otherAtom) return 0;
  const refAngle = Math.atan2(otherAtom.y - atom.y, otherAtom.x - atom.x);
  const angleOffsets = [0, 120, 240, 60];
  const n = connectedBonds.length;
  if (n >= angleOffsets.length) {
    return refAngle + degToRad((60 * (n + 1)) % 360);
  }
  return refAngle + degToRad(angleOffsets[n]);
}

const App: React.FC = () => {
  const [molecule, setMolecule] = useState<Molecule>({ atoms: {}, bonds: {} });
  const [mode, setMode] = useState<Mode>("atom");
  const [element, setElement] = useState<string>("C");
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);

  // For click-and-drag bond/atom creation
  const [dragStartAtomId, setDragStartAtomId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);
  // For click vs drag discrimination
  const [mouseDownAtom, setMouseDownAtom] = useState<{ atomId: string, x: number, y: number } | null>(null);
  // Suppress canvas click after any drag event, even if unsuccessful
  const [wasDrag, setWasDrag] = useState(false);

  function clearDragState() {
    setMouseDownAtom(null);
    setDragStartAtomId(null);
    setDragPos(null);
  }

  const handleCanvasClick = (x: number, y: number) => {
    if (wasDrag) {
      setWasDrag(false);
      return;
    }
    if (mode === "atom") {
      if (dragStartAtomId) return;
      const growRadius = 18;
      const clickedAtom = Object.values(molecule.atoms as Record<string, Atom>).find(atom => {
        const dx = atom.x - x;
        const dy = atom.y - y;
        return Math.hypot(dx, dy) < growRadius;
      });
      if (!clickedAtom) {
        const id = generateId("atom");
        const newAtom: Atom = { id, x, y, element };
        setMolecule(prev => ({
          atoms: { ...prev.atoms, [id]: newAtom },
          bonds: { ...prev.bonds }
        }));
        return;
      }
      // Do not handle "clicked atom" here—handled in atom mouse up!
    }
    if (mode === "erase") {
      const atomRadius = 16;
      const atomToErase = Object.values(molecule.atoms as Record<string, Atom>).find(atom => {
        const dx = atom.x - x;
        const dy = atom.y - y;
        return Math.hypot(dx, dy) < atomRadius;
      });
      if (atomToErase) {
        const updatedAtoms = { ...molecule.atoms };
        delete updatedAtoms[atomToErase.id];
        const updatedBonds = Object.fromEntries(
          Object.entries(molecule.bonds).filter(([, bond]) =>
            (bond as Bond).beginAtomId !== atomToErase.id && (bond as Bond).endAtomId !== atomToErase.id
          )
        );
        setMolecule({ atoms: updatedAtoms, bonds: updatedBonds });
        return;
      }
      const bondLineRadius = 8;
      const bondToErase = (Object.values(molecule.bonds) as Bond[]).find(bond => {
        const a1 = molecule.atoms[bond.beginAtomId];
        const a2 = molecule.atoms[bond.endAtomId];
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const lengthSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((x - a1.x) * dx + (y - a1.y) * dy) / lengthSq));
        const projX = a1.x + t * dx;
        const projY = a1.y + t * dy;
        const dist = Math.hypot(x - projX, y - projY);
        return dist < bondLineRadius;
      });
      if (bondToErase) {
        const updatedBonds = { ...molecule.bonds };
        delete updatedBonds[bondToErase.id];
        setMolecule(prev => ({
          atoms: { ...prev.atoms },
          bonds: updatedBonds
        }));
      }
      return;
    }
  };

  function handleAtomMouseDown(atomId: string, x: number, y: number) {
    if (mode === "atom") {
      setMouseDownAtom({ atomId, x, y });
      setDragStartAtomId(atomId);
      setDragPos({ x, y });
    }
  }

  function handleAtomMouseUp(atomId: string, x: number, y: number) {
    if (mode === "atom" && mouseDownAtom && mouseDownAtom.atomId === atomId) {
      const dx = x - mouseDownAtom.x;
      const dy = y - mouseDownAtom.y;
      if (Math.hypot(dx, dy) <= DRAG_CLICK_THRESHOLD) {
        const clickedAtom = molecule.atoms[atomId];
        const currValence = getAtomValence(clickedAtom.id, molecule);
        const maxValence = MAX_VALENCE[clickedAtom.element] || 4;
        if (currValence + bondOrder > maxValence) {
          clearDragState();
          return;
        }
        const angle = getOrderedBondAngle(clickedAtom, molecule);
        const newX = clickedAtom.x + Math.cos(angle) * BOND_LENGTH;
        const newY = clickedAtom.y + Math.sin(angle) * BOND_LENGTH;
        const newId = generateId("atom");
        const newAtom: Atom = { id: newId, x: newX, y: newY, element };
        const bondId = generateId("bond");
        const newBond: Bond = {
          id: bondId,
          beginAtomId: clickedAtom.id,
          endAtomId: newId,
          order: bondOrder
        };
        setMolecule(prev => ({
          atoms: { ...prev.atoms, [newId]: newAtom },
          bonds: { ...prev.bonds, [bondId]: newBond }
        }));
      }
    }
    clearDragState();
  }

  function handleCanvasMouseMove(x: number, y: number) {
    if (dragStartAtomId && mode === "atom") setDragPos({ x, y });
  }

  function handleCanvasMouseUp(x: number, y: number) {
    if (dragStartAtomId && mode === "atom") {
      setWasDrag(true); // Always set, no matter what!
      const originAtom = molecule.atoms[dragStartAtomId];
      if (!originAtom) {
        clearDragState();
        return;
      }
      const currValence = getAtomValence(originAtom.id, molecule);
      const maxVal = MAX_VALENCE[originAtom.element] || 4;
      if (currValence + bondOrder > maxVal) {
        clearDragState();
        return;
      }
      const dx = x - originAtom.x;
      const dy = y - originAtom.y;
      if (
        mouseDownAtom &&
        mouseDownAtom.atomId === dragStartAtomId &&
        Math.hypot(mouseDownAtom.x - x, mouseDownAtom.y - y) <= DRAG_CLICK_THRESHOLD
      ) {
        clearDragState();
        return;
      }
      // Check if released near another atom (excluding origin)
      const targetAtom = Object.values(molecule.atoms as Record<string, Atom>).find((atom) => {
        if (atom.id === dragStartAtomId) return false;
        const dxa = atom.x - x;
        const dya = atom.y - y;
        return Math.hypot(dxa, dya) < 18;
      });
      if (targetAtom) {
        // Bond to another atom (if not already bonded, valence checked for both)
        const alreadyBonded = Object.values(molecule.bonds as Record<string, Bond>).some(
          (bond) =>
            (bond.beginAtomId === dragStartAtomId && bond.endAtomId === targetAtom.id) ||
            (bond.endAtomId === dragStartAtomId && bond.beginAtomId === targetAtom.id)
        );
        const val2 = getAtomValence(targetAtom.id, molecule);
        const maxVal2 = MAX_VALENCE[targetAtom.element] || 4;
        if (
          !alreadyBonded &&
          currValence + bondOrder <= maxVal &&
          val2 + bondOrder <= maxVal2
        ) {
          const bondId = generateId("bond");
          const newBond: Bond = {
            id: bondId,
            beginAtomId: dragStartAtomId,
            endAtomId: targetAtom.id,
            order: bondOrder,
          };
          setMolecule((prev) => ({
            atoms: { ...prev.atoms },
            bonds: { ...prev.bonds, [bondId]: newBond },
          }));
        }
      } else {
        // Add a new atom at fixed length and angle from origin atom (valence already checked)
        const angle = Math.atan2(dy, dx);
        const newX = originAtom.x + Math.cos(angle) * BOND_LENGTH;
        const newY = originAtom.y + Math.sin(angle) * BOND_LENGTH;
        const newId = generateId("atom");
        const newAtom: Atom = { id: newId, x: newX, y: newY, element };
        const bondId = generateId("bond");
        const newBond: Bond = {
          id: bondId,
          beginAtomId: dragStartAtomId,
          endAtomId: newId,
          order: bondOrder,
        };
        setMolecule((prev) => ({
          atoms: { ...prev.atoms, [newId]: newAtom },
          bonds: { ...prev.bonds, [bondId]: newBond },
        }));
      }
    }
    clearDragState();
  }

  return (
    <div className="app-container">
      <Toolbar
        currentMode={mode}
        onChangeMode={setMode}
        onElementChange={setElement}
        onBondOrderChange={(order: number) => setBondOrder(order as BondOrder)}
      />
      <MoleculeCanvas
        molecule={molecule}
        mode={mode}
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
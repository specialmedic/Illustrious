export interface Atom {
  id: string;
  x: number;
  y: number;
  element: string;
}

export type BondOrder = 1 | 2 | 3;

export interface Bond {
  id: string;
  beginAtomId: string;
  endAtomId: string;
  order: BondOrder;
}

export interface Molecule {
  atoms: Record<string, Atom>;
  bonds: Record<string, Bond>;
}
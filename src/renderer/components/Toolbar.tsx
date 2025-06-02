import React from "react";

export type Mode = "select" | "atom" | "bond" | "erase";

interface ToolbarProps {
  currentMode: Mode;
  onChangeMode: (mode: Mode) => void;
  onElementChange: (element: string) => void;
  onBondOrderChange: (order: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentMode,
  onChangeMode,
  onElementChange,
  onBondOrderChange,
}) => (
  <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
    <button
      onClick={() => onChangeMode("select")}
      style={{ background: currentMode === "select" ? '#ddd' : 'white', padding: '5px 10px', border: '1px solid #ccc' }}
    >Select</button>
    <button
      onClick={() => onChangeMode("atom")}
      style={{ background: currentMode === "atom" ? '#ddd' : 'white', padding: '5px 10px', border: '1px solid #ccc' }}
    >Atom</button>
    <select onChange={e => onElementChange(e.target.value)} style={{ padding: '5px', border: '1px solid #ccc' }}>
      {["C", "N", "O", "S", "P", "Cl", "Br", "I", "F", "H"].map(el => (
        <option key={el} value={el}>{el}</option>
      ))}
    </select>
    <button
      onClick={() => onChangeMode("bond")}
      style={{ background: currentMode === "bond" ? '#ddd' : 'white', padding: '5px 10px', border: '1px solid #ccc' }}
    >Bond</button>
    <select onChange={e => onBondOrderChange(parseInt(e.target.value, 10))} style={{ padding: '5px', border: '1px solid #ccc' }}>
      <option value="1">Single</option>
      <option value="2">Double</option>
      <option value="3">Triple</option>
    </select>
    <button
      onClick={() => onChangeMode("erase")}
      style={{ background: currentMode === "erase" ? '#ddd' : 'white', padding: '5px 10px', border: '1px solid #ccc' }}
    >Erase</button>
  </div>
);

export default Toolbar;
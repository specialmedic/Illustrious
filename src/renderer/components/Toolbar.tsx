import React, { useState, useRef, useEffect } from "react";

const ATOM_COLORS: Record<string, string> = {
  H: "#000",
  C: "#222",
  N: "#1560bd",
  O: "#d7263d",
  F: "#e75480",
  Cl: "#39d353",
  Br: "#a0522d",
  I: "#800080",
  S: "#ffe066",
};
const ATOM_LABELS = ["C", "H", "O", "N", "Cl", "Br", "I", "F", "S"] as const;

type BondType = "single" | "double" | "triple" | "wedge" | "dash";
type RingType = "cyclopentane" | "cyclohexane" | "benzene";

export interface ToolbarProps {
  currentElement: string;
  onElementChange: (element: string) => void;
  currentBond: BondType;
  onBondTypeChange: (bond: BondType) => void;
  onRingAdd: (type: RingType) => void;
}

const bondIcons: Record<BondType, JSX.Element> = {
  single: (
    <svg width={30} height={18}><line x1={5} y1={9} x2={25} y2={9} stroke="black" strokeWidth={2}/></svg>
  ),
  double: (
    <svg width={30} height={18}>
      <line x1={5} y1={7} x2={25} y2={7} stroke="black" strokeWidth={2}/>
      <line x1={5} y1={11} x2={25} y2={11} stroke="black" strokeWidth={2}/>
    </svg>
  ),
  triple: (
    <svg width={30} height={18}>
      <line x1={5} y1={6} x2={25} y2={6} stroke="black" strokeWidth={2}/>
      <line x1={5} y1={9} x2={25} y2={9} stroke="black" strokeWidth={2}/>
      <line x1={5} y1={12} x2={25} y2={12} stroke="black" strokeWidth={2}/>
    </svg>
  ),
  wedge: (
    <svg width={30} height={18}>
      <polygon points="5,15 25,9 5,3" fill="#444" />
    </svg>
  ),
  dash: (
    <svg width={30} height={18}>
      <line x1={5} y1={9} x2={25} y2={9} stroke="black" strokeWidth={2} strokeDasharray="3,3"/>
    </svg>
  ),
};

const ringIcons: Record<RingType, JSX.Element> = {
  cyclopentane: (
    <svg width={32} height={32} viewBox="0 0 32 32">
      <polygon points="16,6 28,13 23,26 9,26 4,13" fill="none" stroke="#555" strokeWidth={2}/>
    </svg>
  ),
  cyclohexane: (
    <svg width={32} height={32} viewBox="0 0 32 32">
      <polygon points="8,10 16,4 24,10 24,22 16,28 8,22" fill="none" stroke="#555" strokeWidth={2}/>
    </svg>
  ),
  benzene: (
    <svg width={32} height={32} viewBox="0 0 32 32">
      <polygon points="8,10 16,4 24,10 24,22 16,28 8,22" fill="none" stroke="#555" strokeWidth={2}/>
      <circle cx={16} cy={16} r={7} fill="none" stroke="#bbb" strokeWidth={2}/>
    </svg>
  ),
};

const Toolbar: React.FC<ToolbarProps> = ({
  currentElement,
  onElementChange,
  currentBond,
  onBondTypeChange,
  onRingAdd,
}) => {
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const style: React.CSSProperties = {
    position: "absolute",
    left: position.x,
    top: position.y,
    zIndex: 99,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
    padding: "18px 20px 14px 20px",
    minWidth: 240,
    userSelect: "none",
    cursor: dragging ? "grabbing" : "default",
    transition: dragging ? "none" : "box-shadow 0.2s",
    pointerEvents: "auto",
  };

  return (
    <div style={style}>
      {/* Drag handle */}
      <div
        style={{
          height: 16,
          cursor: "grab",
          margin: "-10px 0 8px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#bbb",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
      >
        <span style={{
          fontSize: 20,
          letterSpacing: 2,
          fontFamily: "monospace"
        }}>⋮⋮⋮</span>
      </div>
      {/* Ring templates */}
      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        {(["cyclopentane", "cyclohexane", "benzene"] as RingType[]).map(type =>
          <button
            key={type}
            onClick={() => onRingAdd(type)}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              padding: 3,
              cursor: "pointer",
              outline: "none"
            }}
            title={type}
          >
            {ringIcons[type]}
          </button>
        )}
      </div>
      {/* Bond selectors */}
      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        {(["single", "double", "triple", "wedge", "dash"] as BondType[]).map(type =>
          <button
            key={type}
            onClick={() => onBondTypeChange(type)}
            style={{
              background: currentBond === type ? "#e3e6ef" : "#f8fafc",
              border: currentBond === type ? "2px solid #5572d3" : "1.5px solid #ddd",
              borderRadius: 8,
              padding: 1,
              cursor: "pointer",
              outline: "none"
            }}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
          >
            {bondIcons[type]}
          </button>
        )}
      </div>
      {/* Atom selectors */}
      <div style={{ display: "flex", gap: 10 }}>
        {ATOM_LABELS.map(el => (
          <button
            key={el}
            onClick={() => onElementChange(el)}
            style={{
              background: currentElement === el ? "#e3e6ef" : "#f8fafc",
              border: currentElement === el ? "2px solid #5572d3" : "1.5px solid #ddd",
              borderRadius: 8,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none"
            }}
            title={el}
          >
            <span style={{
              color: ATOM_COLORS[el],
              fontWeight: 700,
              fontSize: 19,
              fontFamily: "sans-serif"
            }}>{el}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
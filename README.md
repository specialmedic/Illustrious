# Illustrious

*A simple molecular drawing desktop app, built with Electron and React.*

---

## Features

- **Click-to-grow and click-and-drag** for rapid molecule sketching (like ChemDraw or MarvinSketch)
- **Atoms and bonds:** Add carbons (C), heteroatoms (N, O, S, P, Cl, Br, I, F, H, etc.)
- **Smart bond angles:** Automatic bond geometry when click-to-grow employed, fixed bond length, and implicit hydrogens
- **Valence enforcement:** No overfilled atoms; valence logic for every element
- **Bond preview & eraser tool**
- **Modern, cross-platform desktop app**—no browser required!

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [VS Code](https://code.visualstudio.com/) or your preferred editor

---

### Installation

1. **Download or Clone This Project**
    - If you have a ZIP: Extract it. I only sent this to Lukie, and it was a .zip so...yeah extract the .zip.

2. **Open the folder in VS Code.**  
   *(You can skip this step if not using VS Code.)*

3. **Install dependencies:**  
    ```bash
    npm install
    ```

4. **Run the app:**  
    ```bash
    npm start
    ```

5. **Electron should open the molecule editor window!**

---

### Usage

- **Add atom:** Click the canvas to place a new atom.
- **Grow chain:** Click an existing atom to add a new atom bonded at the correct angle.
- **Click-and-drag:** From an atom, drag in any direction to create a bond of fixed length and set the angle interactively.
- **Change element:** Use the toolbar to pick a different atom type (C, N, O, etc.).
- **Erase:** Switch to "Erase" mode and click on atoms or bonds to remove them.
- **Bond order:** Use the toolbar to select single, double, or triple bonds.

**Note:**  
- No atom or bond is created if the valence of the atom would be exceeded.
- The app enforces smart geometric angles and implicit hydrogens for clean, textbook-style drawings.

---

## Development

- Main React components are in `/src/renderer/`
- Electron main process in `/src/main/`
- Toolbar, canvas, and event logic are in `/src/renderer/components/`
- Styles are in `styles.css` (edit as you like!)

**To restart after code changes:**  
```bash
npm start
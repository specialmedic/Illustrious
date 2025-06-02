import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

function initializeRoot() {
  return ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
}
function renderApp(root: ReactDOM.Root) {
  root.render(<App />);
}
const root = initializeRoot();
renderApp(root);
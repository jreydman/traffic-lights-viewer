import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@src/assets/styles/index.css";
import App from "@src/App.tsx";
import "maplibre-gl/dist/maplibre-gl.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

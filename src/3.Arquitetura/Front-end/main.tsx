import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@Front-end/index.css";
import App from "@Front-end/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

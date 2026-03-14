import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "./context/ConfirmContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfirmProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { fontSize: "14px" } }}
      />
    </ConfirmProvider>
  </StrictMode>
);

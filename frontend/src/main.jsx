// ShopiWebApp/frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const CLI_ID = import.meta.env.VITE_CLIENT_ID;

// Debug logging
console.log("Environment check:", {
  VITE_CLIENT_ID: CLI_ID,
  NODE_ENV: import.meta.env.MODE,
  allEnvVars: import.meta.env,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLI_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);

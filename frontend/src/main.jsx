// ShopiWebApp/frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from 'idb-keyval';

const CLI_ID = import.meta.env.VITE_CLIENT_ID;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data "fresh" for 24 hours so it won't auto-refetch
      staleTime: 1000 * 60 * 60 * 24,
      // Keep data in the storage for 7 days
      gcTime: 1000 * 60 * 60 * 24 * 7,
    }
  }
});

const indexedDbPersister = {
  persistClient: async (client) => {
    await set('react-query-cache', client);
  },
  restoreClient: async () => {
    return await get('react-query-cache');
  },
  removeClient: async () => {
    await del('react-query-cache');
  }
}

// Debug logging
console.log("Environment check:", {
  VITE_CLIENT_ID: CLI_ID,
  NODE_ENV: import.meta.env.MODE,
  allEnvVars: import.meta.env,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: indexedDbPersister }}>
      <GoogleOAuthProvider clientId={CLI_ID}>
        <App />
      </GoogleOAuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);

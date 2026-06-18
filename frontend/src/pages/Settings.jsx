import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/dashboard/AppShell";
import SettingsPage from "../components/settings/SettingsPage";
import { authenticatedFetch, ensureValidSession } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Settings() {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [carts, setCarts] = useState([]);
  const [selectedCartId, setSelectedCartId] = useState(null);

  const fetchCarts = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts`);
      const data = await response.json();
      setCarts(data);
      setSelectedCartId((prev) => prev || data?.[0]?.id || null);
    } catch (error) {
      console.error("Error fetching carts:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hasSession = await ensureValidSession();
      if (cancelled) return;

      if (!hasSession) {
        navigate("/login", { replace: true });
        return;
      }

      await fetchCarts();
      if (!cancelled) setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, fetchCarts]);

  const handleCartSelect = async (cartId) => {
    try {
      await authenticatedFetch(`${API_URL}/api/carts/selectCart`, {
        method: "POST",
        body: JSON.stringify({ cartId }),
      });
    } catch (error) {
      console.error("Error selecting cart:", error);
    }
    navigate("/home");
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f6f0]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFBC42] border-t-transparent" />
      </div>
    );
  }

  const sidebarProps = {
    carts,
    selectedCartId,
    onCartSelect: handleCartSelect,
    onCartsChanged: fetchCarts,
  };

  return (
    <AppShell sidebarProps={sidebarProps}>
      <SettingsPage />
    </AppShell>
  );
}

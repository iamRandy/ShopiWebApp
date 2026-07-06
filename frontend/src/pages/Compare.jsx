import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppShell from "../components/dashboard/AppShell";
import SelectedProductsGrid from "../components/compare/SelectedProductsGrid";
import PriceComparisonChart from "../components/compare/PriceComparisonChart";
import { authenticatedFetch, ensureValidSession } from "../utils/api";
import { formatItemCount } from "../utils/product";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Compare() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionReady, setSessionReady] = useState(false);
  const [carts, setCarts] = useState([]);
  const [selectedCartId, setSelectedCartId] = useState(null);
  const [comparedProducts, setComparedProducts] = useState(location.state?.products ?? []);

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

  if (comparedProducts.length === 0) {
    return (
      <AppShell sidebarProps={sidebarProps}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-stone-500 dark:text-stone-400">
            No products selected for comparison.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#c47f00] hover:underline dark:text-[#FFBC42]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell sidebarProps={sidebarProps}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/home"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-[var(--color-text-primary)] dark:text-stone-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Compare Products
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">
          {formatItemCount(comparedProducts.length)} selected
        </p>

        <PriceComparisonChart products={comparedProducts} />

        <SelectedProductsGrid
          products={comparedProducts}
          onRemove={(id) =>
            setComparedProducts((prev) => prev.filter((p) => p.id !== id))
          }
          onClear={() => navigate("/home")}
        />
      </div>
    </AppShell>
  );
}

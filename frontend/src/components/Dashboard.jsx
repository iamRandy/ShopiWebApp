import ProductArea from "./ProductArea";
import CartArea from "./CartArea";
import AveeLoader from "./AveeLoader";
import * as Icons from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { authenticatedFetch } from "../utils/api";
import { motion } from "framer-motion";

function formatProductCount(count) {
  if (count === 0) return "No products yet";
  if (count === 1) return "1 product";
  return `${count} products`;
}

const Dashboard = () => {
  const [carts, setCarts] = useState([]);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedCartObj, setSelectedCartObj] = useState(null);
  const [selectedCartProducts, setSelectedCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartSwitching, setCartSwitching] = useState(false);

  useEffect(() => {
    const fetchCarts = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await authenticatedFetch(`${API_URL}/api/carts`);
        const data = await response.json();
        setCarts(data);
        setSelectedCart(data?.[0]?.id || null);
        setSelectedCartObj(data?.[0] || null);
        setSelectedCartProducts(data?.[0]?.products || []);
      } catch (error) {
        console.error("Error fetching carts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCarts();
  }, []);

  const handleProductUpdated = (productId, updates) => {
    const updateProducts = (products) =>
      products.map((p) => (p.id === productId ? { ...p, ...updates } : p));

    setSelectedCartProducts((prev) => updateProducts(prev));
    setCarts((prev) =>
      prev.map((cart) =>
        cart.id === selectedCart
          ? { ...cart, products: updateProducts(cart.products || []) }
          : cart
      )
    );
    setSelectedCartObj((prev) =>
      prev ? { ...prev, products: updateProducts(prev.products || []) } : prev
    );
  };

  const cartSelected = async (cartId) => {
    setSelectedCart(cartId);
    const cartFromList = carts.find((c) => c.id === cartId);
    if (cartFromList) {
      setSelectedCartObj(cartFromList);
    }

    setCartSwitching(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/selectCart`,
        {
          method: "POST",
          body: JSON.stringify({ cartId }),
        }
      );
      const data = await response.json();
      setSelectedCartObj(data);
      setSelectedCartProducts(data?.products || []);
    } catch (error) {
      console.error("Error selecting cart:", error);
    } finally {
      setCartSwitching(false);
    }
  };

  const activeCart =
    selectedCartObj || carts.find((c) => c.id === selectedCart) || null;

  const cartTitle = activeCart?.name || "Unnamed cart";

  const productCount = useMemo(() => {
    if (selectedCartProducts?.length !== undefined) {
      return selectedCartProducts.length;
    }
    return activeCart?.products?.length ?? 0;
  }, [selectedCartProducts, activeCart]);

  const cartSubtitle = formatProductCount(productCount);

  return (
    <div className="relative px-3 pt-[4.5rem] pb-8 sm:px-4 md:px-6 md:pt-20 md:pb-10 lg:px-9">
      <div className="relative text-black">
        <div className="absolute right-0 top-0 flex h-[60px] items-center justify-start">
          <motion.button
            className="m-0 bg-transparent p-0"
            onClick={() => setHideSidebar((prev) => !prev)}
          />
        </div>

        <div className="mb-6 text-black md:mb-8 md:grid md:grid-cols-6 md:gap-4">
          {!hideSidebar && (
            <div className="hidden md:col-span-1 md:block" aria-hidden />
          )}
          <div className="flex min-w-0 flex-col items-start gap-1 md:col-span-5">
            <p className="text-2xl font-bold tracking-wide sm:text-3xl md:text-4xl">
              {cartTitle}
            </p>
            {/* Future: cart description can replace or sit below product count */}
            <p className="text-sm text-stone-500 sm:text-base md:text-stone-400">
              {cartSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:grid md:grid-cols-6 md:gap-6 lg:gap-8">
        {!hideSidebar && !loading && (
          <div className="scrollbar-minimal flex flex-row gap-2 overflow-x-auto pb-1 md:col-span-1 md:flex-col md:overflow-x-visible md:overflow-y-visible md:pb-0">
            <CartArea
              carts={carts}
              selectedCart={selectedCart}
              cartSelected={cartSelected}
            />
          </div>
        )}
        <div
          className={
            hideSidebar || loading
              ? "relative min-w-0 md:col-span-6"
              : "relative min-w-0 md:col-span-5"
          }
        >
          {loading ? (
            <AveeLoader message="Loading cart…" />
          ) : (
            <>
              {selectedCartProducts && (
                <ProductArea
                  products={selectedCartProducts}
                  cartId={selectedCart}
                  hideSidebar={hideSidebar}
                  onProductUpdated={handleProductUpdated}
                />
              )}
              {cartSwitching && (
                <AveeLoader message="Loading cart…" overlay />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

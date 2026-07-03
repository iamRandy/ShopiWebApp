import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { authenticatedFetch } from "../utils/api";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  sortProducts,
} from "../utils/product";
import AveeLoader from "./AveeLoader";
import ProductModal from "./productModal/ProductModal";
import AppShell from "./dashboard/AppShell";
import ProductToolbar from "./dashboard/ProductToolbar";
import ProductGridView from "./dashboard/ProductGridView";
import ProductListView from "./dashboard/ProductListView";
import FilterModal from "./dashboard/FilterModal";
import Pagination from "./dashboard/Pagination";
import ShareCartModal from "./dashboard/ShareCartModal";
import useCartRoom from "../hooks/useCartRoom";
import useSharedCartEvents from "../hooks/useSharedCartEvents";
import {
  useProductFilters,
  countActiveFilters,
  DEFAULT_FILTERS,
} from "./dashboard/useProductFilters";
import { usePagination } from "./dashboard/usePagination";
import { VIEW_MODE_KEY, GRID_PAGE_SIZE, LIST_PAGE_SIZE } from "./dashboard/constants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getInitialViewMode() {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "list" || stored === "grid") return stored;
  } catch {
    /* ignore */
  }
  return "grid";
}

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [carts, setCarts] = useState([]);
  const [sharedCarts, setSharedCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedCartObj, setSelectedCartObj] = useState(null);
  const [selectedCartProducts, setSelectedCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartSwitching, setCartSwitching] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [accessRevoked, setAccessRevoked] = useState(false);

  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  const selectedCartRef = useRef(selectedCart);
  selectedCartRef.current = selectedCart;

  const fetchCarts = useCallback(async (preserveSelection = false) => {
    if (!preserveSelection) setLoading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts`);
      const data = await response.json();
      setCarts(data);

      const cartIdToKeep = selectedCartRef.current;
      if (preserveSelection && cartIdToKeep) {
        const current = data.find((c) => c.id === cartIdToKeep);
        if (current) {
          setSelectedCartObj(current);
          setSelectedCartProducts(current.products || []);
          return;
        }
      }

      setSelectedCart(data?.[0]?.id || null);
      setSelectedCartObj(data?.[0] || null);
      setSelectedCartProducts(data?.[0]?.products || []);
    } catch (error) {
      console.error("Error fetching carts:", error);
    } finally {
      if (!preserveSelection) setLoading(false);
    }
  }, []);

  const fetchSharedCarts = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/shared-carts`);
      const data = await response.json();
      setSharedCarts(data);
    } catch (error) {
      console.error("Error fetching shared carts:", error);
    }
  }, []);

  useEffect(() => {
    fetchCarts();
    fetchSharedCarts();
  }, [fetchCarts, fetchSharedCarts]);

  // A cart deep-linked via ?cart=<id> (e.g. after accepting a share invite) gets selected once.
  useEffect(() => {
    const deepLinkedCartId = searchParams.get("cart");
    if (!deepLinkedCartId) return;
    cartSelected(deepLinkedCartId);
    const next = new URLSearchParams(searchParams);
    next.delete("cart");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    if (cartId === selectedCartRef.current) return;

    setAccessRevoked(false);
    setSelectedCart(cartId);
    setFilters(DEFAULT_FILTERS);
    const cartFromList = carts.find((c) => c.id === cartId);
    if (cartFromList) {
      setSelectedCartObj(cartFromList);
      setSelectedCartProducts(cartFromList.products || []);
    }

    setCartSwitching(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts/${cartId}`);
      if (!response.ok) throw new Error("Failed to load cart");
      const data = await response.json();
      setSelectedCartObj(data);
      setSelectedCartProducts(data?.products || []);
      setCarts((prev) =>
        prev.map((cart) => (cart.id === cartId ? { ...cart, ...data } : cart))
      );
    } catch (error) {
      console.error("Error selecting cart:", error);
    } finally {
      setCartSwitching(false);
    }
  };

  const handleShareClick = () => setShareModalOpen(true);

  const handleCloseShareModal = (result) => {
    setShareModalOpen(false);
    if (result?.ownershipTransferred) {
      fetchCarts(true);
      fetchSharedCarts();
    }
  };

  const handleSharedCartSelect = (sharedCart) => {
    cartSelected(sharedCart.cartId);
  };

  const handleLeaveSharedCart = async (cartId) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/shared-carts/${cartId}/leave`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to leave shared cart");
      setSharedCarts((prev) => prev.filter((c) => c.cartId !== cartId));
      if (selectedCartRef.current === cartId) {
        setSelectedCart(carts?.[0]?.id || null);
        setSelectedCartObj(carts?.[0] || null);
        setSelectedCartProducts(carts?.[0]?.products || []);
      }
    } catch (error) {
      console.error("Error leaving shared cart:", error);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const handleFavoriteToggle = async (product, isFavorite) => {
    if (!selectedCart || favoriteLoadingId) return;

    setFavoriteLoadingId(product.id);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${selectedCart}/products/${product.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isFavorite }),
        }
      );
      if (response.ok) {
        handleProductUpdated(product.id, { isFavorite });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct({
      productName: getProductDisplayName(product),
      productImg:
        product.image || "https://via.placeholder.com/300x300?text=No+Image",
      productPrice: getFormattedProductPrice(product),
      productId: product.id,
      productUrl: product.url,
      productDescription: product.description,
      productNote: product.note,
      productNickname: product.nickname,
      originalTitle: product.title || "Unknown Product",
      productHostname: product.hostname,
      productIsFavorite: Boolean(product.isFavorite),
      productSavedAt: product.savedAt,
    });
    setIsModalOpen(true);
  };

  const handleModalProductUpdated = (productId, updates) => {
    handleProductUpdated(productId, updates);
    setSelectedProduct((prev) => {
      if (!prev || prev.productId !== productId) return prev;
      const next = { ...prev };
      if (updates.nickname !== undefined) {
        const nickname = updates.nickname?.trim() || "";
        next.productNickname = nickname || undefined;
        next.productName = nickname || prev.originalTitle;
      }
      if (updates.note !== undefined) next.productNote = updates.note;
      if (updates.isFavorite !== undefined) next.productIsFavorite = updates.isFavorite;
      return next;
    });
  };

  const handleProductDelete = () => {
    window.location.reload();
  };

  const activeCart =
    selectedCartObj || carts.find((c) => c.id === selectedCart) || null;
  const cartTitle = activeCart?.name || "Unnamed cart";
  const rawProducts = selectedCartProducts ?? [];
  const isOwnedCart = Boolean(activeCart) && (!activeCart.myRole || activeCart.myRole === "owner");
  const canEditCart = isOwnedCart || activeCart?.myRole === "edit";
  const canShare = isOwnedCart;
  const activeCartOwnerSub = activeCart?.ownerSub || localStorage.getItem("userSub");

  useCartRoom(activeCartOwnerSub, selectedCart);
  useSharedCartEvents({
    "product:updated": ({ cartId, productId, product }) => {
      if (cartId !== selectedCartRef.current) return;
      handleProductUpdated(productId, product);
    },
    "product:deleted": ({ cartId, productId }) => {
      if (cartId !== selectedCartRef.current) return;
      setSelectedCartProducts((prev) => prev.filter((p) => p.id !== productId));
      setCarts((prev) =>
        prev.map((cart) =>
          cart.id === cartId
            ? { ...cart, products: (cart.products || []).filter((p) => p.id !== productId) }
            : cart
        )
      );
    },
    "cart:renamed": ({ cartId, name, icon, color }) => {
      const patch = (cart) => (cart.id === cartId ? { ...cart, name, icon, color } : cart);
      setCarts((prev) => prev.map(patch));
      setSelectedCartObj((prev) => (prev?.id === cartId ? { ...prev, name, icon, color } : prev));
      setSharedCarts((prev) =>
        prev.map((c) => (c.cartId === cartId ? { ...c, cartName: name, cartIcon: icon, cartColor: color } : c))
      );
    },
    "cart:deleted": ({ cartId }) => {
      setCarts((prev) => prev.filter((c) => c.id !== cartId));
      setSharedCarts((prev) => prev.filter((c) => c.cartId !== cartId));
      if (selectedCartRef.current === cartId) {
        setSelectedCart(null);
        setSelectedCartObj(null);
        setSelectedCartProducts([]);
        fetchCarts(false);
      }
    },
    "collaborator:removed": ({ cartId, sub }) => {
      const mySub = localStorage.getItem("userSub");
      setSharedCarts((prev) => prev.filter((c) => c.cartId !== cartId || sub !== mySub));
      if (sub === mySub && selectedCartRef.current === cartId) {
        setAccessRevoked(true);
      }
    },
    "cart:ownershipTransferred": () => {
      fetchCarts(true);
      fetchSharedCarts();
    },
  });

  const filteredProducts = useProductFilters(rawProducts, filters);
  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts),
    [filteredProducts]
  );
  const { page, setPage, totalPages, pageItems, hasNext, hasPrev } =
    usePagination(sortedProducts, pageSize);

  const storeOptions = useMemo(() => {
    const hosts = new Set();
    rawProducts.forEach((p) => {
      if (p.hostname) hosts.add(p.hostname);
    });
    return [...hosts].sort();
  }, [rawProducts]);

  const activeFilterCount = countActiveFilters(filters);
  const showEmptyCart = !loading && rawProducts.length === 0;

  const sidebarProps = {
    carts,
    selectedCartId: selectedCart,
    onCartSelect: cartSelected,
    onCartsChanged: () => fetchCarts(true),
    sharedCarts,
    onSharedCartSelect: handleSharedCartSelect,
    onLeaveSharedCart: handleLeaveSharedCart,
  };

  return (
    <AppShell sidebarProps={sidebarProps}>
      <div className="relative flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <AveeLoader message="Loading cart…" />
        ) : (
          <>
            <ProductToolbar
              title={cartTitle}
              itemCount={rawProducts.length}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onFilterOpen={() => setFilterModalOpen(true)}
              activeFilterCount={activeFilterCount}
              canShare={canShare}
              onShareClick={handleShareClick}
            />

            {accessRevoked && (
              <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                You no longer have access to this cart.
              </div>
            )}

            <div className="flex-1">
              {showEmptyCart ? (
                <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-[var(--color-bg-surface)]/50 p-8 text-center dark:border-stone-700">
                  <p className="text-stone-500 dark:text-stone-400">
                    No products saved yet. Use the extension to save some products!
                  </p>
                  <a
                    href="https://chromewebstore.google.com/detail/chaos-cart-saver/bjofoogkolnnpldckgedhdeekajhnpcb?authuser=0&hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm font-semibold text-[#c47f00] hover:underline dark:text-[#FFBC42]"
                  >
                    Need help?
                  </a>
                </div>
              ) : viewMode === "grid" ? (
                <ProductGridView
                  products={pageItems}
                  onFavoriteToggle={canEditCart ? handleFavoriteToggle : undefined}
                  onOpen={openProductModal}
                  favoriteLoadingId={favoriteLoadingId}
                />
              ) : (
                <ProductListView
                  products={pageItems}
                  onFavoriteToggle={canEditCart ? handleFavoriteToggle : undefined}
                  onOpen={openProductModal}
                  onMenu={openProductModal}
                  favoriteLoadingId={favoriteLoadingId}
                />
              )}
            </div>

            {!showEmptyCart && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            )}
          </>
        )}

        {cartSwitching && <AveeLoader message="Loading cart…" overlay />}

        <FilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          filters={filters}
          onApply={setFilters}
          storeOptions={storeOptions}
        />

        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          productName={selectedProduct?.productName}
          productImg={selectedProduct?.productImg}
          productPrice={selectedProduct?.productPrice}
          productId={selectedProduct?.productId}
          productUrl={selectedProduct?.productUrl}
          productDescription={selectedProduct?.productDescription}
          productNote={selectedProduct?.productNote}
          productNickname={selectedProduct?.productNickname}
          productHostname={selectedProduct?.productHostname}
          productIsFavorite={selectedProduct?.productIsFavorite}
          productSavedAt={selectedProduct?.productSavedAt}
          originalTitle={selectedProduct?.originalTitle}
          cartId={selectedCart}
          onDelete={handleProductDelete}
          onProductUpdated={handleModalProductUpdated}
        />

        <ShareCartModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          cart={activeCart}
        />
      </div>
    </AppShell>
  );
};

export default Dashboard;

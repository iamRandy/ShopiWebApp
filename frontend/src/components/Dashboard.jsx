import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedCartObj, setSelectedCartObj] = useState(null);
  const [selectedCartProducts, setSelectedCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartSwitching, setCartSwitching] = useState(false);

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

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

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

    setSelectedCart(cartId);
    setFilters(DEFAULT_FILTERS);
    const cartFromList = carts.find((c) => c.id === cartId);
    if (cartFromList) {
      setSelectedCartObj(cartFromList);
      setSelectedCartProducts(cartFromList.products || []);
    }

    setCartSwitching(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts/selectCart`, {
        method: "POST",
        body: JSON.stringify({ cartId }),
      });
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
            />

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
                  onFavoriteToggle={handleFavoriteToggle}
                  onOpen={openProductModal}
                  favoriteLoadingId={favoriteLoadingId}
                />
              ) : (
                <ProductListView
                  products={pageItems}
                  onFavoriteToggle={handleFavoriteToggle}
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
      </div>
    </AppShell>
  );
};

export default Dashboard;

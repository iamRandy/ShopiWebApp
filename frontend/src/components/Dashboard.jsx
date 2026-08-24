import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authenticatedFetch } from "../utils/api";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  getProductNumericPrice,
  formatProductPrice,
  sortProducts,
} from "../utils/product";
import AveeLoader from "./AveeLoader";
import ConfirmModal from "./ConfirmModal";
import ProductModal from "./productModal/ProductModal";
import AppShell from "./dashboard/AppShell";
import ProductToolbar from "./dashboard/ProductToolbar";
import CartBannerHeader from "./dashboard/CartBannerHeader";
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
import { buildTagLabelLookup } from "../utils/tags";
import { usePagination } from "./dashboard/usePagination";
import {
  VIEW_MODE_KEY,
  GRID_PAGE_SIZE,
  LIST_PAGE_SIZE,
  MAX_COMPARE_PRODUCTS,
} from "./dashboard/constants";

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
  const navigate = useNavigate();
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
  const [compareIds, setCompareIds] = useState(() => new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [quickDeleteTarget, setQuickDeleteTarget] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Session-only flags for products whose price changed after a background rescan —
  // never persisted, cleared on cart switch or reload. productId -> { previousPrice }
  const [priceAlerts, setPriceAlerts] = useState(() => new Map());

  // Bumped only when the user explicitly turns the page, to let the frozen sort order
  // (favorites-first, etc.) catch up without reshuffling the page they're currently on.
  const [resortNonce, setResortNonce] = useState(0);
  const [canonicalTags, setCanonicalTags] = useState([]);

  const selectedCartRef = useRef(selectedCart);
  selectedCartRef.current = selectedCart;

  // Tracks which product ids we've already asked the backend to rescan this session,
  // so flipping pages/filters back and forth doesn't keep re-requesting the same ones.
  const rescanRequestedRef = useRef(new Set());

  const fetchCarts = useCallback(async (preserveSelection = false) => {
    if (!preserveSelection) setLoading(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts`);
      const data = await response.json();
      setCarts(data);

      // Something has already claimed a selection by the time this resolves —
      // either a previous selection we're meant to preserve, or a ?cart=<id>
      // deep link applied synchronously by the effect below (which sets
      // selectedCart immediately, before any network round-trip, so the ref
      // already reflects it here regardless of which fetch wins the race).
      // Never clobber that with the default "first cart" pick.
      const cartIdToKeep = selectedCartRef.current;
      if (cartIdToKeep) {
        const current = data.find((c) => c.id === cartIdToKeep);
        if (current) {
          setSelectedCartObj(current);
          setSelectedCartProducts(current.products || []);
          return;
        }
        if (!preserveSelection) {
          // Not among the owned carts we just fetched (e.g. a shared-cart deep
          // link) — leave it alone rather than overwriting it with the default.
          return;
        }
        // preserveSelection was requested but that cart no longer exists
        // (e.g. it was deleted) — fall through to the default below.
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

  const fetchTags = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/tags`);
      const data = await response.json();
      setCanonicalTags(data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, []);

  useEffect(() => {
    fetchCarts();
    fetchSharedCarts();
    fetchTags();
  }, [fetchCarts, fetchSharedCarts, fetchTags]);

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

  useEffect(() => {
    setCompareIds(new Set());
  }, [selectedCart]);

  const toggleCompareSelect = (productId) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else if (next.size < MAX_COMPARE_PRODUCTS) {
        next.add(productId);
      }
      return next;
    });
  };

  const selectAllOnPage = (productIds) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      for (const id of productIds) {
        if (next.size >= MAX_COMPARE_PRODUCTS) break;
        next.add(id);
      }
      return next;
    });
  };

  const clearCompareSelection = () => setCompareIds(new Set());

  const handleCompareNow = () => {
    const products = selectedCartProducts.filter((p) => compareIds.has(p.id));
    navigate(`/home/compare?cart=${selectedCart}`, { state: { products } });
  };

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

  const handleProductRescanned = (cartId, productId, previousPrice, product) => {
    if (cartId !== selectedCartRef.current) return;
    handleProductUpdated(productId, product);
    setPriceAlerts((prev) => {
      const next = new Map(prev);
      next.set(productId, { previousPrice });
      return next;
    });
  };

  const removeProductsFromState = (cartId, idsToRemove) => {
    const idSet = idsToRemove instanceof Set ? idsToRemove : new Set(idsToRemove);
    const stripProducts = (products) => (products || []).filter((p) => !idSet.has(p.id));

    if (cartId === selectedCartRef.current) {
      setSelectedCartProducts((prev) => stripProducts(prev));
      setSelectedCartObj((prev) => (prev ? { ...prev, products: stripProducts(prev.products) } : prev));
    }
    setCarts((prev) =>
      prev.map((cart) => (cart.id === cartId ? { ...cart, products: stripProducts(cart.products) } : cart))
    );
    setCompareIds((prev) => {
      if (![...idSet].some((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      idSet.forEach((id) => next.delete(id));
      return next;
    });
    setPriceAlerts((prev) => {
      if (![...idSet].some((id) => prev.has(id))) return prev;
      const next = new Map(prev);
      idSet.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleQuickDelete = (product) => {
    if (deletingId || !selectedCart) return;
    setQuickDeleteTarget(product);
  };

  const confirmQuickDelete = async () => {
    const product = quickDeleteTarget;
    if (!product || deletingId || !selectedCart) return;

    setDeletingId(product.id);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${selectedCart}/products/${product.id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        removeProductsFromState(selectedCart, [product.id]);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeletingId(null);
      setQuickDeleteTarget(null);
    }
  };

  const handleDeleteSelected = () => {
    if (isBulkDeleting || compareIds.size === 0 || !selectedCart) return;
    setBulkDeleteConfirmOpen(true);
  };

  const confirmDeleteSelected = async () => {
    if (isBulkDeleting || compareIds.size === 0 || !selectedCart) return;
    const ids = [...compareIds];

    setIsBulkDeleting(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts/${selectedCart}/products`, {
        method: "DELETE",
        body: JSON.stringify({ productIds: ids }),
      });
      if (response.ok) {
        removeProductsFromState(selectedCart, ids);
      } else {
        const errorData = await response.json().catch(() => ({}));
        window.alert(errorData.error || "Failed to delete the selected items. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting selected products:", error);
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const cartSelected = async (cartId) => {
    if (cartId === selectedCartRef.current) return;

    setAccessRevoked(false);
    setSelectedCart(cartId);
    setFilters(DEFAULT_FILTERS);
    setPriceAlerts(new Map());
    setPage(1);
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

  // Quietly re-fetches whatever cart is currently open, merging fresh field values in place
  // (same shape as a socket "product:updated" push) without resetting filters/page/selection.
  // Production has no real-time socket layer (see frontend/api/*.js), so a collaborator's
  // edit to a shared cart would otherwise only show up on your next full cart switch — this
  // catches it sooner, on the common "switched tabs and came back" case.
  const refreshSelectedCart = useCallback(async () => {
    const cartId = selectedCartRef.current;
    if (!cartId) return;
    try {
      const response = await authenticatedFetch(`${API_URL}/api/carts/${cartId}`);
      if (!response.ok) return;
      const data = await response.json();
      if (cartId !== selectedCartRef.current) return; // switched carts while this was in flight
      setSelectedCartObj(data);
      setSelectedCartProducts(data?.products || []);
      setCarts((prev) => prev.map((cart) => (cart.id === cartId ? { ...cart, ...data } : cart)));
    } catch (error) {
      console.error("Error refreshing cart:", error);
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSelectedCart();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refreshSelectedCart]);

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
      const response = await authenticatedFetch(`${API_URL}/api/shared-carts`, {
        method: "DELETE",
        body: JSON.stringify({ cartId }),
      });
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
      productPriceValue: getProductNumericPrice(product),
      productId: product.id,
      productUrl: product.url,
      productDescription: product.description,
      productNote: product.note,
      productNickname: product.nickname,
      originalTitle: product.title || "Unknown Product",
      productHostname: product.hostname,
      productIsFavorite: Boolean(product.isFavorite),
      productSavedAt: product.savedAt,
      productTags: product.tags || [],
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
      if (updates.price !== undefined) {
        next.productPriceValue = updates.price;
        next.productPrice = formatProductPrice(updates.price, updates.currency || "$");
      }
      if (updates.tags !== undefined) next.productTags = updates.tags;
      return next;
    });
  };

  const handleProductDelete = (productId) => {
    if (!selectedCart) return;
    removeProductsFromState(selectedCart, [productId]);
  };

  const activeCart =
    selectedCartObj || carts.find((c) => c.id === selectedCart) || null;
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
    "product:rescanned": ({ cartId, productId, previousPrice, product }) => {
      handleProductRescanned(cartId, productId, previousPrice, product);
    },
    "product:deleted": ({ cartId, productId }) => {
      removeProductsFromState(cartId, [productId]);
    },
    "products:deleted": ({ cartId, productIds }) => {
      removeProductsFromState(cartId, productIds || []);
    },
    "cart:renamed": ({ cartId, name, icon, color, bannerType, bannerGradient }) => {
      const patch = (cart) =>
        cart.id === cartId ? { ...cart, name, icon, color, bannerType, bannerGradient } : cart;
      setCarts((prev) => prev.map(patch));
      setSelectedCartObj((prev) =>
        prev?.id === cartId ? { ...prev, name, icon, color, bannerType, bannerGradient } : prev
      );
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

  // A stable signature of which product ids are visible (order-independent) — unlike
  // filteredProducts itself, this only changes when the visible SET changes (add/remove,
  // a filter edit), not when a field on an already-visible product mutates in place.
  const filteredProductIdsKey = useMemo(
    () => filteredProducts.map((p) => p.id).join("|"),
    [filteredProducts]
  );

  // Freezes display ORDER against in-place field mutations (favoriting, a background price
  // rescan, ...) so the grid/list doesn't visibly reshuffle while the user's still looking at
  // it. Order only refreshes when the visible set of products actually changes, or the user
  // explicitly turns the page (resortNonce, bumped from the Pagination handler below) or
  // switches carts (which is itself always a set change, already covered). Product DATA
  // stays live either way — only the position is frozen.
  const sortedProductIds = useMemo(
    () => sortProducts(filteredProducts).map((p) => p.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredProductIdsKey, resortNonce]
  );
  const sortedProducts = useMemo(() => {
    const byId = new Map(filteredProducts.map((p) => [p.id, p]));
    return sortedProductIds.map((id) => byId.get(id)).filter(Boolean);
  }, [sortedProductIds, filteredProducts]);

  const { page, setPage, totalPages, pageItems, hasNext, hasPrev } =
    usePagination(sortedProducts, pageSize);
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setResortNonce((n) => n + 1);
  };

  // Silently ask the backend to refresh prices for whatever's actually on screen right
  // now (not the whole cart) whenever that set changes — cart open, page turn, filter/sort
  // change. The backend itself decides which of these are actually stale (>= 2 weeks since
  // last check); this just avoids re-asking for ids we already asked about this session.
  const visiblePageProductIds = useMemo(() => pageItems.map((p) => p.id), [pageItems]);
  useEffect(() => {
    if (!selectedCart || visiblePageProductIds.length === 0) return;

    const requested = rescanRequestedRef.current;
    const idsToRequest = visiblePageProductIds.filter((id) => !requested.has(id));
    if (idsToRequest.length === 0) return;

    idsToRequest.forEach((id) => requested.add(id));
    const cartId = selectedCart;
    authenticatedFetch(`${API_URL}/api/carts/${cartId}/products/rescan`, {
      method: "POST",
      body: JSON.stringify({ productIds: idsToRequest }),
    })
      .then((response) => response.json())
      .then((data) => {
        // The Vercel deployment's rescan endpoint scrapes synchronously (no background
        // process / socket push there — see frontend/api/carts/[cartId]/products/rescan.js)
        // and returns any price changes directly; apply them here. The always-on Express
        // dev backend instead pushes these via the "product:rescanned" socket event, so
        // this is a harmless no-op there since `updates` comes back empty.
        (data?.updates || []).forEach((update) => {
          handleProductRescanned(cartId, update.productId, update.previousPrice, { price: update.price });
        });
      })
      .catch((error) => console.error("Error requesting price rescan:", error));
    // handleProductRescanned is intentionally omitted — it's redefined every render, and
    // this effect should only re-fire when the cart or visible product set actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCart, visiblePageProductIds]);

  const storeOptions = useMemo(() => {
    const hosts = new Set();
    rawProducts.forEach((p) => {
      if (p.hostname) hosts.add(p.hostname);
    });
    return [...hosts].sort();
  }, [rawProducts]);

  const tagLabelBySlug = useMemo(() => buildTagLabelLookup(canonicalTags), [canonicalTags]);

  const tagOptions = useMemo(() => {
    const seen = new Set();
    rawProducts.forEach((p) => {
      (p.tags || []).forEach((t) => seen.add(t));
    });
    return [...seen]
      .map((tag) => ({ value: tag, label: tagLabelBySlug.get(tag) || tag }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rawProducts, tagLabelBySlug]);

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
      <div className="relative flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
            <AveeLoader message="Loading cart…" />
          </div>
        ) : (
          <>
            <CartBannerHeader
              cart={activeCart}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              canShare={canShare}
              onShareClick={handleShareClick}
            />

            <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-8">
              <ProductToolbar
                onFilterOpen={() => setFilterModalOpen(true)}
                activeFilterCount={activeFilterCount}
                compareCount={compareIds.size}
                maxCompare={MAX_COMPARE_PRODUCTS}
                onCompareNow={handleCompareNow}
                onClearCompare={clearCompareSelection}
                onDeleteSelected={canEditCart ? handleDeleteSelected : undefined}
                isDeletingSelected={isBulkDeleting}
                showingCount={pageItems.length}
                totalCount={sortedProducts.length}
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
                    selectedIds={compareIds}
                    onToggleSelect={toggleCompareSelect}
                    onSelectAllPage={() => selectAllOnPage(pageItems.map((p) => p.id))}
                    selectLimitReached={compareIds.size >= MAX_COMPARE_PRODUCTS}
                    onQuickDelete={canEditCart ? handleQuickDelete : undefined}
                    deletingId={deletingId}
                    priceAlerts={priceAlerts}
                    tagLabelBySlug={tagLabelBySlug}
                  />
                ) : (
                  <ProductListView
                    products={pageItems}
                    onFavoriteToggle={canEditCart ? handleFavoriteToggle : undefined}
                    onOpen={openProductModal}
                    onMenu={openProductModal}
                    favoriteLoadingId={favoriteLoadingId}
                    selectedIds={compareIds}
                    onToggleSelect={toggleCompareSelect}
                    onSelectAllPage={() => selectAllOnPage(pageItems.map((p) => p.id))}
                    selectLimitReached={compareIds.size >= MAX_COMPARE_PRODUCTS}
                    onQuickDelete={canEditCart ? handleQuickDelete : undefined}
                    deletingId={deletingId}
                    priceAlerts={priceAlerts}
                    tagLabelBySlug={tagLabelBySlug}
                  />
                )}
              </div>

              {!showEmptyCart && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                />
              )}
            </div>
          </>
        )}

        {cartSwitching && <AveeLoader message="Loading cart…" overlay />}

        <FilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          filters={filters}
          onApply={setFilters}
          storeOptions={storeOptions}
          tagOptions={tagOptions}
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
          productPriceValue={selectedProduct?.productPriceValue}
          productId={selectedProduct?.productId}
          productUrl={selectedProduct?.productUrl}
          productDescription={selectedProduct?.productDescription}
          productNote={selectedProduct?.productNote}
          productNickname={selectedProduct?.productNickname}
          productHostname={selectedProduct?.productHostname}
          productIsFavorite={selectedProduct?.productIsFavorite}
          productSavedAt={selectedProduct?.productSavedAt}
          productTags={selectedProduct?.productTags}
          originalTitle={selectedProduct?.originalTitle}
          cartId={selectedCart}
          tagLabelBySlug={tagLabelBySlug}
          onDelete={handleProductDelete}
          onProductUpdated={handleModalProductUpdated}
        />

        <ConfirmModal
          isOpen={Boolean(quickDeleteTarget)}
          title="Delete this item?"
          message={
            quickDeleteTarget
              ? `"${getProductDisplayName(quickDeleteTarget)}" will be removed from this cart.`
              : ""
          }
          confirmLabel="Delete"
          confirmingLabel="Deleting…"
          danger
          isConfirming={Boolean(deletingId)}
          onConfirm={confirmQuickDelete}
          onCancel={() => setQuickDeleteTarget(null)}
        />

        <ConfirmModal
          isOpen={bulkDeleteConfirmOpen}
          title={`Delete ${compareIds.size} item${compareIds.size > 1 ? "s" : ""}?`}
          message="These items will be removed from this cart. This cannot be undone."
          confirmLabel="Delete"
          confirmingLabel="Deleting…"
          danger
          isConfirming={isBulkDeleting}
          onConfirm={confirmDeleteSelected}
          onCancel={() => setBulkDeleteConfirmOpen(false)}
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

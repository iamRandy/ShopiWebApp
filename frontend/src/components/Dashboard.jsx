import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { authenticatedFetch } from "../utils/api";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  getProductNumericPrice,
  formatProductPrice,
  sortProducts,
  applyCustomOrder,
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
import MoveToCartModal from "./dashboard/MoveToCartModal";
import PageDropIndicator from "./dashboard/PageDropIndicator";
import useCartRoom from "../hooks/useCartRoom";
import useSharedCartEvents from "../hooks/useSharedCartEvents";
import { useToast } from "../context/ToastContext";
import {
  useProductFilters,
  countActiveFilters,
  getActiveFilterChips,
  removeFilterChip,
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

// How close (in px) a dragged card's edge needs to get to the product area's own edge
// before the "move to next/previous page" indicator arms.
const EDGE_THRESHOLD_PX = 48;

// Lightweight preview rendered under the cursor/finger while a product card is being
// dragged (DragOverlay content). Deliberately not the real GridProductCard/ListProductRow —
// those already register their own useSortable(product.id) for the card underneath, and
// rendering the same component a second time here would double-register that id.
function DragPreviewCard({ product }) {
  const name = getProductDisplayName(product);
  const price = getFormattedProductPrice(product);
  const image = product.image || "https://via.placeholder.com/80x80?text=No+Image";
  return (
    <div className="flex w-56 items-center gap-2.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-2 shadow-[4px_4px_0_var(--color-shadow)]">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-stone-800 dark:text-stone-100">{name}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{price}</p>
      </div>
    </div>
  );
}

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
  const toast = useToast();
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
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveSingleProductId, setMoveSingleProductId] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  const [activeDragProduct, setActiveDragProduct] = useState(null);
  const [nearRightEdge, setNearRightEdge] = useState(false);
  const [nearLeftEdge, setNearLeftEdge] = useState(false);
  const nearRightEdgeRef = useRef(false);
  const nearLeftEdgeRef = useRef(false);
  // The content wrapper to the right of the sidebar — its left edge IS the sidebar
  // boundary, which is what the "move to previous page" gesture is measured against.
  const contentAreaRef = useRef(null);
  // Cached once per drag (onDragStart) rather than read on every onDragMove — getBoundingClientRect()
  // forces a layout reflow, and drag-move fires on every pointer move, so recomputing it that often
  // is a real source of jank, especially on mobile.
  const contentAreaRectRef = useRef(null);

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

  // Product(s) leaving the currently-open cart via a move look identical to a delete from
  // this cart's point of view, so this just delegates to the existing helper.
  const handleMoveOut = (cartId, ids) => {
    removeProductsFromState(cartId, ids);
  };

  // Unlike removeProductsFromState, this always patches the matching `carts` entry (so
  // sidebar item-counts stay accurate for carts that aren't currently open) and only
  // additionally splices into the live view when the destination happens to be open.
  const handleMoveIn = (destinationCartId, products) => {
    setCarts((prev) =>
      prev.map((cart) =>
        cart.id === destinationCartId
          ? { ...cart, products: [...(cart.products || []), ...products] }
          : cart
      )
    );
    if (destinationCartId === selectedCartRef.current) {
      setSelectedCartProducts((prev) => [...prev, ...products]);
      setSelectedCartObj((prev) =>
        prev ? { ...prev, products: [...(prev.products || []), ...products] } : prev
      );
    }
  };

  // Optimistically applies (or rolls back) a new custom product order for a cart, both in
  // the `carts` list (sidebar counts etc.) and, if it's the currently open cart, `selectedCartObj`.
  const patchCartProductOrder = (cartId, productOrder) => {
    setCarts((prev) => prev.map((c) => (c.id === cartId ? { ...c, productOrder } : c)));
    setSelectedCartObj((prev) => (prev?.id === cartId ? { ...prev, productOrder } : prev));
  };

  const openMoveModal = (productId = null) => {
    setMoveSingleProductId(productId);
    setMoveModalOpen(true);
  };

  // Shared by the "Move to..." modal's confirm button and dragging a product onto a
  // sidebar cart — both just need to fire the request and patch local state, they differ
  // only in what happens around the call (modal close vs. nothing).
  const moveProducts = async (ids, destinationCartId) => {
    if (ids.length === 0 || !selectedCart) return undefined;

    setIsMoving(true);
    try {
      const isSingle = ids.length === 1;
      const url = isSingle
        ? `${API_URL}/api/carts/${selectedCart}/products/${ids[0]}`
        : `${API_URL}/api/carts/${selectedCart}/products`;
      const body = isSingle
        ? { action: "move", destinationCartId }
        : { action: "move", productIds: ids, destinationCartId };

      const response = await authenticatedFetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to move item(s)");
      }
      const data = await response.json();
      const movedProducts = isSingle ? [data.product] : data.movedProducts || [];
      const movedIds = movedProducts.map((p) => p.id);

      handleMoveOut(selectedCart, movedIds);
      handleMoveIn(destinationCartId, movedProducts);
      toast.push(`Moved ${movedIds.length} item${movedIds.length > 1 ? "s" : ""}.`, "success");
      return movedProducts;
    } catch (error) {
      console.error("Error moving product(s):", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return undefined;
      }
      toast.push(error.message || "Failed to move item(s). Please try again.", "error");
      throw error;
    } finally {
      setIsMoving(false);
    }
  };

  const confirmMove = async (destinationCartId) => {
    const ids = moveSingleProductId ? [moveSingleProductId] : [...compareIds];
    const isSingle = Boolean(moveSingleProductId);
    const movedProducts = await moveProducts(ids, destinationCartId);
    if (isSingle && movedProducts) {
      setIsModalOpen(false);
      setSelectedProduct(null);
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
      productLastManualCheckAt: product.lastManualPriceCheckAt || null,
      productPriceBeforeManualCheck:
        product.priceBeforeManualCheck !== undefined && product.priceBeforeManualCheck !== null
          ? Number(product.priceBeforeManualCheck)
          : null,
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
      if (updates.lastManualPriceCheckAt !== undefined) {
        next.productLastManualCheckAt = updates.lastManualPriceCheckAt;
      }
      if (updates.priceBeforeManualCheck !== undefined) {
        next.productPriceBeforeManualCheck = updates.priceBeforeManualCheck;
      }
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
    "product:moved": ({ cartId, productId }) => {
      removeProductsFromState(cartId, [productId]);
    },
    "products:moved": ({ cartId, productIds }) => {
      removeProductsFromState(cartId, productIds || []);
    },
    "product:movedIn": ({ cartId, product }) => {
      handleMoveIn(cartId, [product]);
    },
    "products:movedIn": ({ cartId, products }) => {
      handleMoveIn(cartId, products || []);
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
    "cart:productsReordered": ({ cartId, productOrder }) => {
      patchCartProductOrder(cartId, productOrder);
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
  const productOrderKey = useMemo(
    () => (activeCart?.productOrder || []).join("|"),
    [activeCart?.productOrder]
  );
  const sortedProductIds = useMemo(
    () =>
      (activeCart?.productOrder?.length
        ? applyCustomOrder(filteredProducts, activeCart.productOrder)
        : sortProducts(filteredProducts)
      ).map((p) => p.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredProductIdsKey, resortNonce, productOrderKey]
  );
  const sortedProducts = useMemo(() => {
    const byId = new Map(filteredProducts.map((p) => [p.id, p]));
    return sortedProductIds.map((id) => byId.get(id)).filter(Boolean);
  }, [sortedProductIds, filteredProducts]);

  const cartTotal = useMemo(
    () =>
      rawProducts.reduce((sum, p) => {
        const value = getProductNumericPrice(p);
        return value !== null ? sum + value : sum;
      }, 0),
    [rawProducts]
  );
  const selectedTotal = useMemo(() => {
    if (compareIds.size === 0) return null;
    return rawProducts.reduce((sum, p) => {
      if (!compareIds.has(p.id)) return sum;
      const value = getProductNumericPrice(p);
      return value !== null ? sum + value : sum;
    }, 0);
  }, [rawProducts, compareIds]);

  const { page, setPage, totalPages, pageItems, hasNext, hasPrev } =
    usePagination(sortedProducts, pageSize);
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setResortNonce((n) => n + 1);
  };

  const handleProductDragStart = (event) => {
    const product = pageItems.find((p) => p.id === event.active.id);
    setActiveDragProduct(product || null);
    // Read once per drag rather than on every move — see the ref's declaration comment.
    contentAreaRectRef.current = contentAreaRef.current?.getBoundingClientRect() || null;
  };

  const handleProductDragMove = (event) => {
    const containerRect = contentAreaRectRef.current;
    const draggedRect = event.active?.rect?.current?.translated;
    const hasRects = Boolean(containerRect && draggedRect);

    const isNearRight =
      hasNext && hasRects && draggedRect.right > containerRect.right - EDGE_THRESHOLD_PX;
    if (isNearRight !== nearRightEdgeRef.current) {
      nearRightEdgeRef.current = isNearRight;
      setNearRightEdge(isNearRight);
    }

    // Arms only once the dragged card actually crosses the sidebar boundary (the content
    // area's left edge), not a threshold inside the content — per design, the previous-page
    // gesture is "drag it over to the sidebar".
    const isNearLeft = hasPrev && hasRects && draggedRect.left < containerRect.left;
    if (isNearLeft !== nearLeftEdgeRef.current) {
      nearLeftEdgeRef.current = isNearLeft;
      setNearLeftEdge(isNearLeft);
    }
  };

  const handleProductDragEnd = ({ active, over }) => {
    const draggedId = active.id;
    const wasNearRightEdge = nearRightEdgeRef.current;
    const wasNearLeftEdge = nearLeftEdgeRef.current;
    setActiveDragProduct(null);
    nearRightEdgeRef.current = false;
    nearLeftEdgeRef.current = false;
    setNearRightEdge(false);
    setNearLeftEdge(false);
    if (!canEditCart) return;

    // Dropped on a cart in the sidebar — move it there instead of reordering.
    if (over?.data?.current?.type === "cart") {
      const destinationCartId = over.data.current.cartId;
      if (destinationCartId && destinationCartId !== selectedCart) {
        moveProducts([draggedId], destinationCartId);
      }
      return;
    }

    // A same-page reorder needs a real drop target, but a paging drag doesn't — the user
    // may well release past the last card, over the (pointer-events-none) page indicator
    // itself, or anywhere else with nothing directly underneath.
    if (!over && !wasNearRightEdge && !wasNearLeftEdge) return;

    // "Reorder within the page", "drag to next page", and "drag to previous page" all
    // reduce to the same operation: insert the dragged id at a computed index in the full
    // (unpaginated) order array.
    const fullOrder = activeCart?.productOrder?.length
      ? [...activeCart.productOrder]
      : sortProducts(rawProducts).map((p) => p.id);

    // For the paging cases, the insertion side must account for the dragged item's own
    // removal shifting its neighbor: dragging FORWARD (dragged sits before the next page's
    // current first item, so removing it shifts that neighbor up into this page) means
    // inserting AFTER the neighbor to land as the next page's new first item; dragging
    // BACKWARD (no shift — dragged sits after the previous page's last item) means
    // inserting BEFORE the neighbor to take over its last-of-previous-page slot.
    let neighborId;
    let placeBefore;
    if (wasNearRightEdge && hasNext) {
      neighborId = sortedProducts[page * pageSize]?.id;
      placeBefore = false;
    } else if (wasNearLeftEdge && hasPrev) {
      neighborId = sortedProducts[(page - 1) * pageSize - 1]?.id;
      placeBefore = true;
    } else {
      if (!over) return;
      const visibleIds = pageItems.map((p) => p.id);
      const oldIndex = visibleIds.indexOf(draggedId);
      const newIndex = visibleIds.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newVisibleOrder = arrayMove(visibleIds, oldIndex, newIndex);
      const pos = newVisibleOrder.indexOf(draggedId);
      if (pos > 0) {
        neighborId = newVisibleOrder[pos - 1];
        placeBefore = false;
      } else {
        neighborId = newVisibleOrder[pos + 1];
        placeBefore = true;
      }
    }
    if (!neighborId) return;

    const withoutDragged = fullOrder.filter((id) => id !== draggedId);
    const neighborIndex = withoutDragged.indexOf(neighborId);
    const insertAt =
      neighborIndex === -1 ? withoutDragged.length : placeBefore ? neighborIndex : neighborIndex + 1;
    withoutDragged.splice(insertAt, 0, draggedId);

    patchCartProductOrder(selectedCart, withoutDragged);
    authenticatedFetch(`${API_URL}/api/carts/${selectedCart}`, {
      method: "PATCH",
      body: JSON.stringify({ productOrder: withoutDragged }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
      })
      .catch(() => {
        patchCartProductOrder(selectedCart, fullOrder);
        toast.push("Failed to save new order. Please try again.", "error");
      });
  };

  const dnd = {
    onDragStart: handleProductDragStart,
    onDragMove: handleProductDragMove,
    onDragEnd: handleProductDragEnd,
    dragOverlayContent: activeDragProduct ? <DragPreviewCard product={activeDragProduct} /> : null,
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
  const filterChips = useMemo(
    () => getActiveFilterChips(filters, tagLabelBySlug),
    [filters, tagLabelBySlug]
  );
  const handleRemoveFilterChip = (chipId) =>
    setFilters((prev) => removeFilterChip(prev, chipId));
  const showEmptyCart = !loading && rawProducts.length === 0;

  const sidebarProps = {
    carts,
    selectedCartId: selectedCart,
    onCartSelect: cartSelected,
    onCartsChanged: () => fetchCarts(true),
    sharedCarts,
    onSharedCartSelect: handleSharedCartSelect,
    onLeaveSharedCart: handleLeaveSharedCart,
    dragSourceCartId: selectedCart,
  };

  return (
    <AppShell sidebarProps={sidebarProps} dnd={dnd}>
      <div className="relative flex min-h-0 flex-1 flex-col" ref={contentAreaRef}>
        <PageDropIndicator side="left" label="Move to previous page?" visible={nearLeftEdge && hasPrev} />
        <PageDropIndicator side="right" label="Move to next page?" visible={nearRightEdge && hasNext} />
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
                filterChips={filterChips}
                onRemoveFilterChip={handleRemoveFilterChip}
                compareCount={compareIds.size}
                maxCompare={MAX_COMPARE_PRODUCTS}
                onCompareNow={handleCompareNow}
                onClearCompare={clearCompareSelection}
                onDeleteSelected={canEditCart ? handleDeleteSelected : undefined}
                isDeletingSelected={isBulkDeleting}
                onMoveSelected={canEditCart ? () => openMoveModal(null) : undefined}
                isMovingSelected={isMoving}
                onSelectAllPage={() => selectAllOnPage(pageItems.map((p) => p.id))}
                showingCount={pageItems.length}
                totalCount={sortedProducts.length}
                cartTotal={cartTotal}
                selectedTotal={selectedTotal}
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
                    cartId={selectedCart}
                    onPriceChecked={handleProductUpdated}
                    dragEnabled={canEditCart}
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
                    dragEnabled={canEditCart}
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
          productLastManualCheckAt={selectedProduct?.productLastManualCheckAt}
          productPriceBeforeManualCheck={selectedProduct?.productPriceBeforeManualCheck}
          originalTitle={selectedProduct?.originalTitle}
          cartId={selectedCart}
          tagLabelBySlug={tagLabelBySlug}
          onDelete={handleProductDelete}
          onProductUpdated={handleModalProductUpdated}
          onMoveRequested={
            canEditCart ? () => openMoveModal(selectedProduct?.productId) : undefined
          }
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

        <MoveToCartModal
          isOpen={moveModalOpen}
          onClose={() => {
            setMoveModalOpen(false);
            setMoveSingleProductId(null);
          }}
          carts={carts}
          sharedCarts={sharedCarts}
          sourceCartId={selectedCart}
          productCount={moveSingleProductId ? 1 : compareIds.size}
          onConfirm={confirmMove}
        />
      </div>
    </AppShell>
  );
};

export default Dashboard;

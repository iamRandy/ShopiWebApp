import { useState, useEffect, useMemo, useRef } from "react";
import { X, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import ModalPortal from "./ModalPortal";
import {
  POPULAR_CART_ICONS,
  getCartIcon,
  formatCartIconLabel,
  searchCartIcons,
} from "../utils/cartIcons";
import {
  BANNER_GRADIENTS,
  PRESET_BANNER_COLORS,
  getCartBannerBackground,
  getCartBannerTone,
} from "../utils/cartBanners";

function GradientOptionButton({ gradient, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`flex aspect-square items-center justify-center rounded-xl border-2 transition-all ${
        selected
          ? "border-[#FFBC42]"
          : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
      }`}
      style={{ background: gradient.css }}
      onClick={onSelect}
      aria-label={gradient.label}
      aria-pressed={selected}
      title={gradient.label}
    />
  );
}

function IconOptionButton({ iconName, selected, onSelect, className = "" }) {
  return (
    <button
      type="button"
      className={`flex aspect-square items-center justify-center rounded-xl border transition-all ${
        selected
          ? "border-[#FFBC42] bg-[#FFBC42]/15 text-stone-900 dark:text-stone-50"
          : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-white dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:bg-stone-700"
      } ${className}`}
      onClick={onSelect}
      aria-label={formatCartIconLabel(iconName)}
      aria-pressed={selected}
      title={formatCartIconLabel(iconName)}
    >
      {getCartIcon(iconName, { className: "h-5 w-5" })}
    </button>
  );
}

function CartSidebarRow({
  icon,
  name,
  onNameChange,
  placeholder,
  itemCount,
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-[var(--color-bg-app-alt)] px-3 py-2.5 focus-within:border-[#FFBC42] focus-within:ring-2 focus-within:ring-[#FFBC42]/25 dark:border-stone-700">
        <span className="shrink-0 text-stone-700 dark:text-stone-300">
          {getCartIcon(icon, { className: "h-5 w-5" })}
        </span>
        <input
          type="text"
          name="cartName"
          value={name}
          onChange={onNameChange}
          placeholder={placeholder}
          maxLength={20}
          autoComplete="off"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-100"
        />
        <span className="shrink-0 text-xs font-medium tabular-nums text-stone-400">
          {itemCount}
        </span>
      </div>
      <p className="mt-1 text-right text-xs text-stone-400">{name.length}/20</p>
    </div>
  );
}

const CartModal = ({
  isOpen,
  onClose,
  isEditMode = false,
  cartData = null,
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartName, setCartName] = useState("");
  const [cartIcon, setCartIcon] = useState("ShoppingCart");
  const [cartColor, setCartColor] = useState("#000000");
  const [bannerType, setBannerType] = useState("color");
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS[0].key);
  const [iconQuery, setIconQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const carouselRef = useRef(null);

  const bannerTone = useMemo(
    () => getCartBannerTone({ color: cartColor, bannerType, bannerGradient }),
    [cartColor, bannerType, bannerGradient]
  );
  const bannerContentColor = bannerTone === "dark" ? "text-[#1a1a1a]" : "text-white";

  const trimmedQuery = iconQuery.trim();
  const searchResults = trimmedQuery ? searchCartIcons(iconQuery) : null;
  const popularIcons = useMemo(
    () =>
      POPULAR_CART_ICONS.includes(cartIcon)
        ? POPULAR_CART_ICONS
        : [cartIcon, ...POPULAR_CART_ICONS],
    [cartIcon]
  );

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 168, behavior: "smooth" });
  };

  const originalName = cartData?.name?.trim() || "";
  const itemCount = isEditMode ? (cartData?.products?.length ?? 0) : 0;
  const namePlaceholder = isEditMode
    ? originalName || "Cart name"
    : "e.g. Wishlist, Gifts, Deals";

  useEffect(() => {
    if (!isOpen) return;
    setStatus(null);
    setIconQuery("");
    if (isEditMode && cartData) {
      setCartName("");
      setCartIcon(cartData.icon || "ShoppingCart");
      setCartColor(cartData.color || "#000000");
      setBannerType(cartData.bannerType || "color");
      setBannerGradient(cartData.bannerGradient || BANNER_GRADIENTS[0].key);
    } else {
      setCartName("");
      setCartIcon("ShoppingCart");
      setCartColor("#000000");
      setBannerType("color");
      setBannerGradient(BANNER_GRADIENTS[0].key);
    }
  }, [isOpen, isEditMode, cartData]);

  if (!isOpen) return null;

  const handleDeleteCart = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCart = async () => {
    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${cartData.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus(
          "Failed to delete cart: " +
            (errorData.error || errorData.message || "Unknown error")
        );
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting cart:", error);
      setShowDeleteConfirm(false);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setStatus("Failed to delete cart. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resolvedName = cartName.trim() || (isEditMode ? originalName : "");
    if (!resolvedName) {
      setStatus("Please enter a name for your cart.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const url = isEditMode
      ? `${API_URL}/api/carts/${cartData.id}`
      : `${API_URL}/api/carts`;

    try {
      const response = await authenticatedFetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resolvedName,
          icon: cartIcon,
          color: cartColor,
          bannerType,
          bannerGradient: bannerType === "gradient" ? bannerGradient : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Request failed");
      }

      onClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} cart:`,
        error
      );
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setStatus(
        `Failed to ${isEditMode ? "update" : "create"} cart. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={handleBackdropClick}
      >
        <div
          className="flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-[var(--color-bg-surface)] shadow-xl sm:rounded-2xl dark:border-stone-700"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
            <h2
              id="cart-modal-title"
              className="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              {isEditMode ? "Edit cart" : "New cart"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-stone-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="scrollbar-minimal min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  Sidebar preview
                </p>
                <CartSidebarRow
                  icon={cartIcon}
                  name={cartName}
                  onNameChange={(e) => setCartName(e.target.value)}
                  placeholder={namePlaceholder}
                  itemCount={itemCount}
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Icon
                </span>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={iconQuery}
                    onChange={(e) => setIconQuery(e.target.value)}
                    placeholder="Search 1,600+ icons…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-stone-200 bg-[var(--color-bg-app-alt)] py-2 pl-8 pr-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-[#FFBC42] focus:ring-2 focus:ring-[#FFBC42]/25 dark:border-stone-700 dark:text-stone-100"
                  />
                </div>

                {searchResults === null ? (
                  <div>
                    <p className="mb-1.5 text-xs text-stone-400">
                      Preset Icons
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => scrollCarousel(-1)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800 dark:border-stone-700 dark:hover:border-stone-600 dark:hover:text-stone-200"
                        aria-label="Scroll icons left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div
                        ref={carouselRef}
                        className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth py-1 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {popularIcons.map((iconName) => (
                          <IconOptionButton
                            key={iconName}
                            iconName={iconName}
                            selected={cartIcon === iconName}
                            onSelect={() => setCartIcon(iconName)}
                            className="h-12 w-12 shrink-0"
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollCarousel(1)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800 dark:border-stone-700 dark:hover:border-stone-600 dark:hover:text-stone-200"
                        aria-label="Scroll icons right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {searchResults.map((iconName) => (
                      <IconOptionButton
                        key={iconName}
                        iconName={iconName}
                        selected={cartIcon === iconName}
                        onSelect={() => setCartIcon(iconName)}
                      />
                    ))}
                    {searchResults.length === 0 && (
                      <p className="col-span-6 py-6 text-center text-sm text-stone-400">
                        No icons found for &ldquo;{trimmedQuery}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Banner
                </span>

                <div
                  className="relative mb-3 flex h-16 items-center gap-2 overflow-hidden rounded-xl px-3"
                  style={{
                    background: getCartBannerBackground({
                      color: cartColor,
                      bannerType,
                      bannerGradient,
                    }),
                  }}
                >
                  {bannerTone === "light" && <div className="absolute inset-0 bg-black/30" />}
                  <span className={`relative shrink-0 ${bannerContentColor}`}>
                    {getCartIcon(cartIcon, { className: "h-5 w-5" })}
                  </span>
                  <span className={`relative truncate text-sm font-bold ${bannerContentColor}`}>
                    {cartName.trim() || namePlaceholder}
                  </span>
                </div>

                <div className="mb-3 flex overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setBannerType("color")}
                    aria-pressed={bannerType === "color"}
                    className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                      bannerType === "color"
                        ? "bg-[#FFBC42]/40 text-stone-900 dark:text-stone-50"
                        : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-white/5"
                    }`}
                  >
                    Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerType("gradient")}
                    aria-pressed={bannerType === "gradient"}
                    className={`flex-1 border-l border-stone-200 py-1.5 text-sm font-medium transition-colors dark:border-stone-700 ${
                      bannerType === "gradient"
                        ? "bg-[#FFBC42]/40 text-stone-900 dark:text-stone-50"
                        : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-white/5"
                    }`}
                  >
                    Gradient
                  </button>
                </div>

                {bannerType === "color" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={cartColor}
                      onChange={(e) => setCartColor(e.target.value)}
                      aria-label="Custom banner color"
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-stone-200 bg-transparent p-0.5 dark:border-stone-700"
                    />
                    {PRESET_BANNER_COLORS.map((presetColor) => {
                      const isSelected = cartColor.toLowerCase() === presetColor.toLowerCase();
                      const isNearWhite = presetColor.toLowerCase() === "#ffffff";
                      return (
                        <button
                          key={presetColor}
                          type="button"
                          onClick={() => setCartColor(presetColor)}
                          aria-label={`Use color ${presetColor}`}
                          aria-pressed={isSelected}
                          className={`h-8 w-8 shrink-0 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-[#FFBC42]"
                              : isNearWhite
                                ? "border-stone-300 hover:border-stone-400 dark:border-stone-600"
                                : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
                          }`}
                          style={{ backgroundColor: presetColor }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_GRADIENTS.map((gradient) => (
                      <GradientOptionButton
                        key={gradient.key}
                        gradient={gradient}
                        selected={bannerGradient === gradient.key}
                        onSelect={() => setBannerGradient(gradient.key)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {status && (
                <p
                  className={`rounded-lg px-3 py-2 text-center text-sm ${
                    status.includes("Failed")
                      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                  role="alert"
                >
                  {status}
                </p>
              )}
            </div>

            <div className="shrink-0 space-y-2 border-t border-stone-100 px-5 py-4 dark:border-stone-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving…"
                  : isEditMode
                    ? "Save changes"
                    : "Create cart"}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDeleteCart}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete cart
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>

    <ConfirmModal
      isOpen={showDeleteConfirm}
      title="Delete this cart?"
      message={`"${originalName || "This cart"}" and everything in it will be permanently deleted.`}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      danger
      isConfirming={isSubmitting}
      onConfirm={confirmDeleteCart}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
};

export default CartModal;

import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { getCartIcon } from "../../utils/cartIcons";
import { getCartBannerBackground, getCartBannerTone } from "../../utils/cartBanners";
import ConfirmModal from "../ConfirmModal";

export default function CartSidebarItem({
  cart,
  selected,
  onSelect,
  onEdit,
  onLeave,
  variant = "owned",
  collapsed = false,
  dropDisabled = false,
}) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const count = cart.products?.length ?? 0;
  const cartName = cart.name || "Unnamed Cart";
  const isShared = variant === "shared";

  const { setNodeRef, isOver } = useDroppable({
    id: `cart-${cart.id}`,
    data: { type: "cart", cartId: cart.id },
    disabled: dropDisabled,
  });
  const showDropHighlight = isOver && !dropDisabled;

  // Selected state borrows the cart's own banner (color or gradient) so the sidebar
  // highlight matches the banner shown once that cart is open, instead of a fixed brand color.
  const bannerBackground = selected ? getCartBannerBackground(cart) : null;
  const bannerTone = selected ? getCartBannerTone(cart) : null;
  const contentColorClass = selected
    ? bannerTone === "dark"
      ? "text-[#1a1a1a]"
      : "text-white"
    : "text-stone-700 dark:text-stone-300";

  const handleTrailingClick = (e) => {
    e.stopPropagation();
    if (isShared) {
      setShowLeaveConfirm(true);
    } else {
      onEdit(cart);
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onLeave(cart.id);
  };

  const trailingTitle = isShared ? "Leave shared cart" : "Edit cart";
  const trailingAriaLabel = isShared ? `Leave ${cartName}` : `Edit ${cartName}`;

  const leaveConfirmModal = (
    <ConfirmModal
      isOpen={showLeaveConfirm}
      title="Leave this shared cart?"
      message={`You'll lose access to "${cartName}". You can rejoin if someone shares the link with you again.`}
      confirmLabel="Leave"
      danger
      onConfirm={confirmLeave}
      onCancel={() => setShowLeaveConfirm(false)}
    />
  );

  if (collapsed) {
    return (
      <div ref={setNodeRef} className="group relative w-full">
        <button
          type="button"
          onClick={() => onSelect(cart.id)}
          title={`${cartName} (${count})`}
          aria-label={`${cartName}, ${count} items`}
          style={selected ? { background: bannerBackground } : undefined}
          className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 p-2.5 transition-all ${
            showDropHighlight
              ? "border-dashed border-[#FFBC42] bg-[#FFBC42]/10"
              : selected
                ? "border-[var(--color-border-strong)] shadow-[3px_3px_0_var(--color-shadow)]"
                : "border-transparent bg-transparent hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface)]/80"
          }`}
        >
          {selected && bannerTone === "light" && (
            <span className="absolute inset-0 bg-black/30" />
          )}
          <span className={`relative ${contentColorClass}`}>
            {getCartIcon(cart.icon, { className: "h-5 w-5" }) || (
              <ShoppingCart className="h-5 w-5" />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={handleTrailingClick}
          className="absolute right-0.5 top-0.5 flex rounded-full bg-[var(--color-bg-surface)] p-0.5 text-stone-600 opacity-0 shadow-sm transition-opacity hover:text-[var(--color-text-primary)] group-hover:opacity-100 dark:text-stone-400"
          title={trailingTitle}
          aria-label={trailingAriaLabel}
        >
          {isShared ? <X className="h-3.5 w-3.5" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </button>
        {leaveConfirmModal}
      </div>
    );
  }

  return (
    <>
    <div
      ref={setNodeRef}
      style={selected ? { background: bannerBackground } : undefined}
      className={`group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl border-2 px-3 py-2.5 transition-all ${
        showDropHighlight
          ? "border-dashed border-[#FFBC42] bg-[#FFBC42]/10"
          : selected
            ? "border-[var(--color-border-strong)] shadow-[3px_3px_0_var(--color-shadow)]"
            : "border-transparent bg-transparent hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface)]/80"
      }`}
      onClick={() => onSelect(cart.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(cart.id);
        }
      }}
    >
      {selected && bannerTone === "light" && (
        <span className="absolute inset-0 bg-black/30" />
      )}
      <span className={`relative flex-shrink-0 ${contentColorClass}`}>
        {getCartIcon(cart.icon, { className: "h-5 w-5" }) || (
          <ShoppingCart className="h-5 w-5" />
        )}
      </span>
      <span
        className={`relative min-w-0 flex-1 truncate text-sm font-semibold ${
          selected ? contentColorClass : "text-[var(--color-text-primary)]"
        }`}
      >
        {cartName}
      </span>
      {!isShared && (
        <span
          className={`text-xs font-bold tabular-nums text-stone-500 transition-opacity dark:text-stone-400 ${
            selected ? "opacity-0" : "opacity-100 group-hover:opacity-0"
          }`}
        >
          {count}
        </span>
      )}
      <button
        type="button"
        onClick={handleTrailingClick}
        className={`absolute right-1 top-1/2 flex -translate-y-1/2 rounded-full bg-[var(--color-bg-surface)] p-1 text-stone-600 shadow-sm transition-opacity hover:text-[var(--color-text-primary)] group-hover:opacity-100 dark:text-stone-400 ${
          selected ? "opacity-100" : "opacity-0"
        }`}
        title={trailingTitle}
      >
        {isShared ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
      </button>
    </div>
    {leaveConfirmModal}
    </>
  );
}

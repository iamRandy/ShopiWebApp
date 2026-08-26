import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import ModalPortal from "../ModalPortal";
import { getCartIcon } from "../../utils/cartIcons";

export default function MoveToCartModal({
  isOpen,
  onClose,
  carts,
  sharedCarts,
  sourceCartId,
  productCount = 1,
  onConfirm,
}) {
  const [selectedDestId, setSelectedDestId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDestId(null);
    }
  }, [isOpen]);

  const eligibleCarts = useMemo(() => {
    const owned = (carts || [])
      .filter((c) => c.id !== sourceCartId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        itemCount: c.products?.length ?? 0,
        kind: "owned",
      }));
    const shared = (sharedCarts || [])
      .filter((c) => c.role === "edit" && c.cartId !== sourceCartId)
      .map((c) => ({
        id: c.cartId,
        name: c.cartName,
        icon: c.cartIcon,
        kind: "shared",
        ownerName: c.ownerName,
      }));
    return [...owned, ...shared];
  }, [carts, sharedCarts, sourceCartId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  const handleConfirm = async () => {
    if (!selectedDestId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedDestId);
      onClose({ moved: true });
    } catch {
      // Failure feedback is surfaced via a toast by the caller (see Dashboard.jsx's
      // confirmMove) — keep the modal open so the user can retry or pick another cart.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-[var(--color-bg-surface)] shadow-xl sm:rounded-2xl dark:border-stone-700"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-to-cart-modal-title"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
            <h2
              id="move-to-cart-modal-title"
              className="truncate text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              Move {productCount > 1 ? `${productCount} items` : "item"} to…
            </h2>
            <button
              type="button"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-stone-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="scrollbar-minimal min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-5">
            {eligibleCarts.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">
                No other carts available to move to. Create another cart, or ask for edit access
                to a shared one.
              </p>
            ) : (
              eligibleCarts.map((cart) => (
                <button
                  key={cart.id}
                  type="button"
                  onClick={() => setSelectedDestId(cart.id)}
                  disabled={isSubmitting}
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedDestId === cart.id
                      ? "border-[#FFBC42] bg-[#FFBC42]/10"
                      : "border-stone-200 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {getCartIcon(cart.icon, { className: "h-4 w-4" })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                      {cart.name}
                    </p>
                    <p className="truncate text-xs text-stone-400">
                      {cart.kind === "shared"
                        ? `Shared by ${cart.ownerName || "someone"}`
                        : `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </button>
              ))
            )}

          </div>

          {eligibleCarts.length > 0 && (
            <div className="shrink-0 border-t border-stone-100 px-5 py-3.5 dark:border-stone-800">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDestId || isSubmitting}
                className="w-full rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Moving…" : "Move here"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

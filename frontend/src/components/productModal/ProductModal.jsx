import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Check, Copy, ExternalLink, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { getAffiliateLink } from "../../utils/affiliate";
import { formatRelativeAdded } from "../../utils/product";
import { authenticatedFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import usePriceCheck from "../../hooks/usePriceCheck";
import ConfirmModal from "../ConfirmModal";
import ModalPortal from "../ModalPortal";
import ProductImage from "../ProductImage";
import FavoriteHeartButton from "../FavoriteHeartButton";
import ExpandableText from "./ExpandableText";
import ProductEditForm from "./ProductEditForm";
import TagCarousel from "../tags/TagCarousel";

const PRICE_CHECK_COLORS = { up: "#dc2626", down: "#16a34a", same: "#2563eb" };

const ProductModal = ({
  isOpen,
  onClose,
  productName,
  productImg,
  productPrice,
  productPriceValue,
  productId,
  productUrl,
  productDescription,
  productNote,
  productNickname,
  productHostname,
  productIsFavorite,
  productSavedAt,
  productTags,
  productLastManualCheckAt,
  productPriceBeforeManualCheck,
  originalTitle,
  cartId,
  tagLabelBySlug,
  onDelete,
  onProductUpdated,
}) => {
  const navigate = useNavigate();
  const { isChecking: isCheckingPrice, checkErrorReason: priceCheckErrorReason, checkPrice } = usePriceCheck({
    cartId,
    product: {
      id: productId,
      url: productUrl,
      price: productPriceValue,
      lastManualPriceCheckAt: productLastManualCheckAt,
      priceBeforeManualCheck: productPriceBeforeManualCheck,
    },
    onUpdated: onProductUpdated,
  });
  const priceControls = useAnimation();
  const priceRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [tags, setTags] = useState(productTags || []);
  const [tagsError, setTagsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showOriginalDescription, setShowOriginalDescription] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimeoutRef = useRef(null);

  const trimmedNote = productNote?.trim() || "";
  const trimmedDescription = productDescription?.trim() || "";
  const hasNote = Boolean(trimmedNote);
  const hasDescription = Boolean(trimmedDescription);

  useEffect(() => {
    if (isOpen) {
      setNicknameInput(productNickname || "");
      setNoteInput(productNote || "");
      setPriceInput(
        productPriceValue !== null && productPriceValue !== undefined
          ? String(productPriceValue)
          : ""
      );
      setIsEditing(false);
      setTags(productTags || []);
      setTagsError(null);
      setSaveError(null);
      setDeleteError(null);
      setShowOriginalDescription(false);
      setCopyFeedback(false);
    }
  }, [isOpen, productNickname, productNote, productPriceValue, productTags, productId]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const showOriginalTitle =
    originalTitle?.trim() && originalTitle.trim() !== productName?.trim();

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/products/${productId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        onDelete(productId);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDeleteError(errorData.error || "Failed to delete product");
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setShowDeleteConfirm(false);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setDeleteError("Failed to delete product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVisitProduct = () => {
    if (productUrl) {
      window.open(getAffiliateLink(productUrl), "_blank", "noopener,noreferrer");
    }
  };

  const playPriceCheckAnimation = (direction) => {
    const baseColor = priceRef.current ? getComputedStyle(priceRef.current).color : undefined;
    const flash = PRICE_CHECK_COLORS[direction] || PRICE_CHECK_COLORS.same;
    priceControls.start({
      scale: [1, 1.18, 0.98, 1.05, 1],
      y: [0, 0, -8, 2, 0],
      color: [baseColor, baseColor, flash, flash, baseColor],
      transition: { duration: 0.7, times: [0, 0.15, 0.4, 0.7, 1], ease: "easeOut" },
    });
  };

  const handleRefreshPrice = async () => {
    if (busy) return;
    const result = await checkPrice();
    if (result) playPriceCheckAnimation(result.direction);
  };

  const handleCopyLink = async () => {
    if (!productUrl) return;
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopyFeedback(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Clipboard permission denied/unavailable — nothing useful to show the user.
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSaving && !isDeleting) {
      onClose();
    }
  };

  const patchProduct = async (body) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await authenticatedFetch(
      `${API_URL}/api/carts/${cartId}/products/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save changes");
    }

    return response.json();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    const trimmedPrice = priceInput.trim();
    const numericPrice = Number(trimmedPrice);
    if (!trimmedPrice || Number.isNaN(numericPrice) || numericPrice < 0) {
      setSaveError("Enter a valid price.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const data = await patchProduct({
        nickname: nicknameInput,
        note: noteInput,
        price: numericPrice,
      });
      onProductUpdated?.(productId, {
        nickname: data.product?.nickname,
        note: data.product?.note,
        price: data.product?.price,
        currency: data.product?.currency,
      });
      setIsEditing(false);
      setShowOriginalDescription(false);
    } catch (error) {
      console.error("Error updating product:", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setSaveError(error.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (isFavoriteSaving) return;
    setIsFavoriteSaving(true);

    try {
      const data = await patchProduct({ isFavorite: !productIsFavorite });
      onProductUpdated?.(productId, { isFavorite: data.product?.isFavorite });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
      }
    } finally {
      setIsFavoriteSaving(false);
    }
  };

  const updateTags = async (nextTags, previousTags) => {
    setTags(nextTags);
    setTagsError(null);
    try {
      const data = await patchProduct({ tags: nextTags });
      onProductUpdated?.(productId, { tags: data.product?.tags });
    } catch (error) {
      console.error("Error updating tags:", error);
      setTags(previousTags);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setTagsError("Failed to update tags. Please try again.");
    }
  };

  const handleAddTag = (tagValue) => {
    if (tags.includes(tagValue) || tags.length >= 10) return;
    updateTags([...tags, tagValue], tags);
  };

  const handleRemoveTag = (tagValue) => {
    updateTags(
      tags.filter((t) => t !== tagValue),
      tags
    );
  };

  const busy = isSaving || isDeleting;
  const viewingOriginal = hasNote && showOriginalDescription;

  const renderDetails = () => {
    if (isEditing) {
      return (
        <ProductEditForm
          nicknameInput={nicknameInput}
          onNicknameChange={(e) => setNicknameInput(e.target.value)}
          originalTitle={originalTitle}
          priceInput={priceInput}
          onPriceChange={(e) => setPriceInput(e.target.value)}
          noteInput={noteInput}
          onNoteChange={(e) => setNoteInput(e.target.value)}
          saveError={saveError}
          isSaving={isSaving}
          onSubmit={handleSaveEdit}
          onCancel={() => {
            setNicknameInput(productNickname || "");
            setNoteInput(productNote || "");
            setPriceInput(
              productPriceValue !== null && productPriceValue !== undefined
                ? String(productPriceValue)
                : ""
            );
            setSaveError(null);
            setIsEditing(false);
          }}
        />
      );
    }

    return (
      <>
        <div className="inline-flex max-w-full items-start gap-0.5">
          <ExpandableText
            text={productName}
            limit={90}
            as="h3"
            className="inline text-lg font-semibold leading-snug text-stone-900 dark:text-stone-50"
          />
        </div>

        {showOriginalTitle && (
          <p className="mt-0.5 line-clamp-1 text-sm text-stone-500 dark:text-stone-400">
            Original: <span className="text-stone-700 dark:text-stone-300">{originalTitle}</span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <motion.span
            ref={priceRef}
            animate={priceControls}
            className="inline-block text-lg font-semibold text-stone-900 dark:text-stone-50"
          >
            {productPrice}
          </motion.span>
          {productSavedAt && (
            <span className="text-sm text-stone-400">
              · Saved {formatRelativeAdded(productSavedAt)}
            </span>
          )}
        </div>

        {priceCheckErrorReason === "blocked" && (
          <p className="mt-1 text-sm text-stone-400">
            {productHostname || "This site"} blocks automated price checks — visit the page and
            update the price manually.
          </p>
        )}
        {priceCheckErrorReason === "error" && (
          <p className="mt-1 text-sm text-stone-400">Could not check price. Try again shortly.</p>
        )}

        <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
          {viewingOriginal ? (
            <>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Original description
              </p>
              <ExpandableText
                text={trimmedDescription}
                limit={140}
                className="text-sm leading-relaxed text-stone-600 dark:text-stone-300"
              />
              {hasNote && (
                <button
                  type="button"
                  onClick={() => setShowOriginalDescription(false)}
                  className="mt-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  View note
                </button>
              )}
            </>
          ) : hasNote ? (
            <>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Note
              </p>
              <ExpandableText
                text={trimmedNote}
                limit={140}
                className="text-sm leading-relaxed text-stone-600 dark:text-stone-300"
              />
              {hasDescription && (
                <button
                  type="button"
                  onClick={() => setShowOriginalDescription(true)}
                  className="mt-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  View original description
                </button>
              )}
            </>
          ) : hasDescription ? (
            <>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Description
              </p>
              <ExpandableText
                text={trimmedDescription}
                limit={140}
                className="text-sm leading-relaxed text-stone-600 dark:text-stone-300"
              />
            </>
          ) : (
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Note
            </p>
          )}
        </div>
      </>
    );
  };

  return (
    <>
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={handleBackdropClick}
      >
        <div
          className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-[var(--color-bg-surface)] shadow-xl sm:rounded-3xl dark:border-stone-700"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-3 dark:border-stone-800">
            <h2
              id="product-modal-title"
              className="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              Product details
            </h2>
            <div className="flex items-center gap-1">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setNicknameInput(productNickname || "");
                    setNoteInput(productNote || "");
                    setPriceInput(
                      productPriceValue !== null && productPriceValue !== undefined
                        ? String(productPriceValue)
                        : ""
                    );
                    setSaveError(null);
                    setIsEditing(true);
                  }}
                  disabled={busy}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-stone-200"
                  aria-label="Edit product"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-stone-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-stone-100 px-5 py-3 dark:border-stone-800">
            <TagCarousel
              tags={tags}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              maxTags={10}
              tagLabelBySlug={tagLabelBySlug}
            />
            {tagsError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-300" role="alert">
                {tagsError}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-stone-800">
              <ProductImage
                src={productImg}
                alt={productName}
                className="absolute inset-0 h-full w-full"
              />

              {productHostname && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                  <span className="absolute bottom-2.5 left-3 max-w-[calc(100%-3.5rem)] truncate rounded-md bg-white/85 px-2 py-0.5 text-[11px] font-medium text-stone-600 backdrop-blur-sm">
                    {productHostname}
                  </span>
                </>
              )}

              <FavoriteHeartButton
                isFavorite={productIsFavorite}
                isLoading={isFavoriteSaving}
                onToggle={handleToggleFavorite}
                buttonClassName="right-3 top-3 h-9 w-9"
                iconActiveClassName="h-[19px] w-[19px]"
                iconInactiveClassName="h-4 w-4"
                ariaLabelOn="Remove from favorites"
                ariaLabelOff="Add to favorites"
              />
            </div>

            <div className="px-5 py-4">{renderDetails()}</div>
          </div>

          {deleteError && (
            <p
              className="mx-5 mb-3 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {deleteError}
            </p>
          )}

          {!isEditing && (
            <div className="shrink-0 space-y-2 border-t border-stone-100 px-5 py-3.5 dark:border-stone-800">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={handleVisitProduct}
                  disabled={!productUrl || busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFBC42] px-4 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Visit product
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!productUrl || busy}
                  title="Copy link"
                  aria-label="Copy product link"
                  className="flex items-center justify-center rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-3.5 text-stone-700 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-200"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copyFeedback ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRefreshPrice}
                  disabled={!productUrl || busy || isCheckingPrice}
                  title="Check current price"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isCheckingPrice ? "animate-spin" : ""}`}
                    strokeWidth={2}
                  />
                  {isCheckingPrice ? "Checking…" : "Refresh price"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>

    <ConfirmModal
      isOpen={showDeleteConfirm}
      title="Delete this item?"
      message={`"${productName || "This product"}" will be removed from this cart.`}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      danger
      isConfirming={isDeleting}
      onConfirm={confirmDelete}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
};

export default ProductModal;

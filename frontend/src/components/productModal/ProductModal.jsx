import { useEffect, useState } from "react";
import { ExternalLink, Heart, Trash2, X } from "lucide-react";
import { getAffiliateLink } from "../../utils/affiliate";
import { formatRelativeAdded } from "../../utils/product";
import { authenticatedFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import ModalPortal from "../ModalPortal";
import ProductImage from "../ProductImage";
import ExpandableText from "./ExpandableText";
import ProductNicknameForm from "./ProductNicknameForm";
import ProductNoteForm from "./ProductNoteForm";
import PencilIconPopover from "./PencilIconPopover";

const ProductModal = ({
  isOpen,
  onClose,
  productName,
  productImg,
  productPrice,
  productId,
  productUrl,
  productDescription,
  productNote,
  productNickname,
  productHostname,
  productIsFavorite,
  productSavedAt,
  originalTitle,
  cartId,
  onDelete,
  onProductUpdated,
}) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showOriginalDescription, setShowOriginalDescription] = useState(false);

  const trimmedNote = productNote?.trim() || "";
  const trimmedDescription = productDescription?.trim() || "";
  const hasNote = Boolean(trimmedNote);
  const hasDescription = Boolean(trimmedDescription);

  useEffect(() => {
    if (isOpen) {
      setNicknameInput(productNickname || "");
      setNoteInput(productNote || "");
      setEditMode(null);
      setSaveError(null);
      setDeleteError(null);
      setShowOriginalDescription(false);
    }
  }, [isOpen, productNickname, productNote, productId]);

  if (!isOpen) return null;

  const showOriginalTitle =
    originalTitle?.trim() &&
    originalTitle.trim() !== productName?.trim() &&
    editMode !== "nickname";

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/products/${productId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onDelete();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDeleteError(errorData.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
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

  const handleSaveNickname = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const data = await patchProduct({ nickname: nicknameInput });
      onProductUpdated?.(productId, {
        nickname: data.product?.nickname,
        note: data.product?.note,
      });
      setEditMode(null);
    } catch (error) {
      console.error("Error updating product:", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setSaveError(error.message || "Failed to save nickname. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const data = await patchProduct({ note: noteInput });
      onProductUpdated?.(productId, { note: data.product?.note });
      setEditMode(null);
      setShowOriginalDescription(false);
    } catch (error) {
      console.error("Error updating product note:", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setSaveError(error.message || "Failed to save note. Please try again.");
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

  const busy = isSaving || isDeleting;
  const viewingOriginal = hasNote && showOriginalDescription;

  const renderDetails = () => {
    if (editMode === "nickname") {
      return (
        <ProductNicknameForm
          nicknameInput={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
          originalTitle={originalTitle}
          saveError={saveError}
          isSaving={isSaving}
          onSubmit={handleSaveNickname}
          onCancel={() => {
            setNicknameInput(productNickname || "");
            setSaveError(null);
            setEditMode(null);
          }}
        />
      );
    }

    if (editMode === "note") {
      return (
        <ProductNoteForm
          noteInput={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          saveError={saveError}
          isSaving={isSaving}
          onSubmit={handleSaveNote}
          onCancel={() => {
            setNoteInput(productNote || "");
            setSaveError(null);
            setEditMode(null);
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
          <PencilIconPopover
            label="Rename item?"
            onClick={() => {
              setNicknameInput(productNickname || "");
              setSaveError(null);
              setEditMode("nickname");
            }}
          />
        </div>

        {showOriginalTitle && (
          <p className="mt-0.5 line-clamp-1 text-sm text-stone-500 dark:text-stone-400">
            Original: <span className="text-stone-700 dark:text-stone-300">{originalTitle}</span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            {productPrice}
          </span>
          {productSavedAt && (
            <span className="text-sm text-stone-400">
              · Saved {formatRelativeAdded(productSavedAt)}
            </span>
          )}
        </div>

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
              <div className="mb-1 flex items-center gap-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Note
                </p>
                <PencilIconPopover
                  label="Edit note?"
                  onClick={() => {
                    setNoteInput(trimmedNote);
                    setSaveError(null);
                    setEditMode("note");
                  }}
                />
              </div>
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
              <div className="mb-1 flex items-center gap-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  Description
                </p>
                <PencilIconPopover
                  label="Add note?"
                  onClick={() => {
                    setNoteInput("");
                    setSaveError(null);
                    setEditMode("note");
                  }}
                />
              </div>
              <ExpandableText
                text={trimmedDescription}
                limit={140}
                className="text-sm leading-relaxed text-stone-600 dark:text-stone-300"
              />
            </>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Note
              </p>
              <PencilIconPopover
                label="Add note?"
                onClick={() => {
                  setNoteInput("");
                  setSaveError(null);
                  setEditMode("note");
                }}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
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

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isFavoriteSaving}
                aria-label={
                  productIsFavorite ? "Remove from favorites" : "Add to favorites"
                }
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-[#FFBC42] backdrop-blur-sm transition-colors hover:bg-black/55 disabled:opacity-60"
              >
                <Heart
                  className={`transition-all duration-200 ${
                    productIsFavorite ? "h-[19px] w-[19px]" : "h-4 w-4"
                  }`}
                  fill={productIsFavorite ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
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

          {!editMode && (
            <div className="shrink-0 space-y-2 border-t border-stone-100 px-5 py-3.5 dark:border-stone-800">
              <button
                type="button"
                onClick={handleVisitProduct}
                disabled={!productUrl || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFBC42] px-4 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Visit product
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={isFavoriteSaving}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    productIsFavorite
                      ? "border-[#FFBC42]/60 bg-[#FFBC42]/10 text-stone-900 dark:text-stone-50"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5"
                  }`}
                >
                  <Heart
                    className="h-4 w-4"
                    fill={productIsFavorite ? "currentColor" : "none"}
                    strokeWidth={2}
                  />
                  {productIsFavorite ? "Favorited" : "Favorite"}
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
  );
};

export default ProductModal;

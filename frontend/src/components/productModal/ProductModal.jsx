import { useEffect, useState } from "react";
import { ExternalLink, Trash2, X } from "lucide-react";
import { getAffiliateLink } from "../../utils/affiliate";
import { authenticatedFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import ModalPortal from "../ModalPortal";
import ExpandableText from "./ExpandableText";
import ProductModalImage from "./ProductModalImage";
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

  const busy = isSaving || isDeleting;
  const viewingOriginal = hasNote && showOriginalDescription;

  const renderBodySection = () => {
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
        <div className="flex gap-3.5">
          <ProductModalImage
            src={productImg}
            alt={productName}
            className="h-20 w-20 sm:h-24 sm:w-24"
          />

          <div className="min-w-0 flex-1 space-y-1">
            {productHostname && (
              <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                {productHostname}
              </span>
            )}

            <p className="text-base font-semibold text-stone-900 sm:text-lg">
              {productPrice}
            </p>

            <div className="inline-flex max-w-full items-start gap-0">
              <ExpandableText
                text={productName}
                limit={72}
                as="h3"
                className="inline text-sm font-semibold text-stone-900 sm:text-base"
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
              <p className="line-clamp-1 text-xs text-stone-500 sm:text-sm">
                Original:{" "}
                <span className="text-stone-700">{originalTitle}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-stone-100 pt-3">
          {viewingOriginal ? (
            <>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                Original description
              </p>
              <ExpandableText
                text={trimmedDescription}
                limit={100}
                className="text-sm text-stone-600"
              />
              {hasNote && (
                <button
                  type="button"
                  onClick={() => setShowOriginalDescription(false)}
                  className="mt-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800"
                >
                  View note
                </button>
              )}
            </>
          ) : hasNote ? (
            <>
              <div className="mb-1 flex items-center gap-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
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
                limit={100}
                className="text-sm text-stone-600"
              />
              {hasDescription && (
                <button
                  type="button"
                  onClick={() => setShowOriginalDescription(true)}
                  className="mt-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800"
                >
                  View original description
                </button>
              )}
            </>
          ) : hasDescription ? (
            <>
              <div className="mb-1 flex items-center gap-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
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
                limit={100}
                className="text-sm text-stone-600"
              />
            </>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
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
          className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-3">
            <h2
              id="product-modal-title"
              className="text-lg font-semibold text-stone-900"
            >
              Product details
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-4">{renderBodySection()}</div>

          {deleteError && (
            <p
              className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              {deleteError}
            </p>
          )}

          {!editMode && (
            <div className="shrink-0 space-y-1.5 border-t border-stone-100 px-5 py-3">
              <button
                type="button"
                onClick={handleVisitProduct}
                disabled={!productUrl || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Visit product
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting…" : "Delete product"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default ProductModal;

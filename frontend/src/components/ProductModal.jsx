import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getAffiliateLink } from "../utils/affiliate";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ProductModal = ({
  isOpen,
  onClose,
  productName,
  productImg,
  productPrice,
  productId,
  productUrl,
  productDescription,
  productNickname,
  originalTitle,
  cartId,
  onDelete,
  onProductUpdated,
}) => {
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setNicknameInput(productNickname || "");
      setIsEditing(false);
      setSaveError(null);
    }
  }, [isOpen, productNickname, productId]);

  if (!isOpen) return null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
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
          const errorData = await response.json();
          alert("Failed to delete product: " + errorData.error);
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
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleVisitProduct = () => {
    if (productUrl) {
      window.open(getAffiliateLink(productUrl), "_blank");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleStartEdit = () => {
    setNicknameInput(productNickname || "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setNicknameInput(productNickname || "");
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSaveNickname = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/products/${productId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ nickname: nicknameInput }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        onProductUpdated?.(productId, { nickname: data.product?.nickname });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || "Failed to save nickname");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }
      setSaveError("Failed to save nickname. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const showOriginalTitle =
    originalTitle?.trim() &&
    originalTitle.trim() !== productName?.trim();

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.8)] bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[70vh] overflow-y-auto overflow-x-hidden shadow-2xl">
        <div className="relative p-4">
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
            title="Close"
          >
            <X className="w-[28px] h-[28px]" />
          </button>
          <div className="absolute top-3 right-3 flex gap-2">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-xl text-sm transition-colors duration-200"
                title="Edit nickname"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm transition-colors duration-200"
              title="Delete product"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              <img
                src={productImg || "https://via.placeholder.com/300x300?text=No+Image"}
                alt={productName}
                className="w-full max-w-80 h-80 object-contain rounded-xl md:w-80"
              />
            </div>
            <div className="flex-1 space-y-4 min-w-0">
              {isEditing ? (
                <form onSubmit={handleSaveNickname} className="space-y-3">
                  <div>
                    <label htmlFor="product-nickname" className="block font-semibold text-gray-700 mb-1">
                      Nickname
                    </label>
                    <input
                      id="product-nickname"
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder='e.g. "Birthday Gift"'
                      maxLength={80}
                      autoFocus
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to use the original product name.
                    </p>
                    {originalTitle && (
                      <p className="mt-2 text-sm text-gray-500">
                        Original: <span className="text-gray-700">{originalTitle}</span>
                      </p>
                    )}
                  </div>
                  {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={isSaving} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium">
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-800 break-words">
                    {productName.length > 110 && !isTitleExpanded ? productName.substring(0, 110) + "..." : productName}
                    {productName.length > 110 && (
                      <span onClick={() => setIsTitleExpanded(!isTitleExpanded)} className="ml-2 text-blue-500 hover:text-blue-600 font-medium cursor-pointer text-base">
                        {isTitleExpanded ? "see less" : "see more"}
                      </span>
                    )}
                  </h3>
                  {showOriginalTitle && (
                    <p className="text-sm text-gray-500">
                      Original: <span className="text-gray-600">{originalTitle}</span>
                    </p>
                  )}
                </>
              )}
              <div className="text-xl font-semibold text-green-600">{productPrice}</div>
              {productDescription && !isEditing && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 leading-relaxed break-words">
                    {productDescription.length > 165 && !isDescriptionExpanded ? productDescription.substring(0, 165) + "..." : productDescription}
                    {productDescription.length > 165 && (
                      <span onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="ml-2 text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                        {isDescriptionExpanded ? "see less" : "see more"}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {!isEditing && (
                <div className="mt-6">
                  <button onClick={handleVisitProduct} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold">
                    Visit Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

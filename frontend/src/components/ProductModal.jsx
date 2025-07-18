import React, { useState } from "react";
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
  onDelete,
}) => {
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await authenticatedFetch(`${API_URL}/api/products`, {
          method: "DELETE",
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          onDelete();
          onClose(); // Close modal after successful deletion
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
      const affiliateUrl = getAffiliateLink(productUrl);
      window.open(affiliateUrl, "_blank");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[70vh] overflow-y-auto overflow-x-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-4">
          {/* X button in top left */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
            title="Close"
          >
            ×
          </button>

          {/* Edit and Delete buttons in top right */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-xl text-sm transition-colors duration-200"
              title="Edit product (coming soon)"
              disabled
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm transition-colors duration-200"
              title="Delete product"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              <img
                src={
                  productImg ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }
                alt={productName}
                className="w-full max-w-80 h-80 object-contain rounded-xl md:w-80"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <h3 className="text-2xl font-bold text-gray-800 break-words">
                {productName.length > 110 && !isTitleExpanded
                  ? productName.substring(0, 110) + "..."
                  : productName}
                {productName.length > 110 && (
                  <span
                    onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                    className="ml-2 text-blue-500 hover:text-blue-600 font-medium cursor-pointer text-base"
                  >
                    {isTitleExpanded ? "see less" : "see more"}
                  </span>
                )}
              </h3>

              <div className="text-xl font-semibold text-green-600">
                {productPrice}
              </div>

              {productDescription && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 leading-relaxed break-words">
                    {productDescription.length > 165 && !isDescriptionExpanded
                      ? productDescription.substring(0, 165) + "..."
                      : productDescription}
                    {productDescription.length > 165 && (
                      <span
                        onClick={() =>
                          setIsDescriptionExpanded(!isDescriptionExpanded)
                        }
                        className="ml-2 text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                      >
                        {isDescriptionExpanded ? "see less" : "see more"}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Visit Product Button */}
              <div className="mt-6">
                <button
                  onClick={handleVisitProduct}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                >
                  Visit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

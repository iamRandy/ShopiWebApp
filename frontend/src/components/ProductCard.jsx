import React from "react";
import { X } from "lucide-react";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ProductCard = ({
  productName,
  productImg,
  productPrice,
  productId,
  productUrl,
  productDescription,
  onDelete,
  onProductClick,
  hostname,
}) => {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent triggering the product link
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await authenticatedFetch(`${API_URL}/api/products`, {
          method: "DELETE",
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          // Call the parent component's onDelete callback to refresh the list
          onDelete();
        } else {
          const errorData = await response.json();
          alert("Failed to delete product: " + errorData.error);
        }
      } catch (error) {
        console.error("Error deleting product:", error);

        // If it's an authentication error, redirect to login instead of showing error
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

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick({
        productName,
        productImg,
        productPrice,
        productId,
        productUrl,
        productDescription,
      });
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-full rounded-lg overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative flex justify-center items-center rounded flex-grow">
          {/* Delete button in top right */}
          {/* <button
            onClick={handleDelete}
            className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors duration-200 text-xs"
            title="Delete product"
          >
            <X className="w-[28px] h-[28px] text-white" />
          </button> */}

          <div className="hover:translate-y-[-2px] transition-transform duration-200 w-full">
            <img
              alt="product image"
              src={productImg}
              className="hover:shadow-lg transition-shadow duration-200 w-full h-[300px] object-cover rounded-xl"
            />
          </div>
        </div>
        {/* Info bar as a separate flex item */}
        <div className="text-black w-full h-12 flex gap-2 justify-between items-center p-1">
          <div className="flex flex-col">
            <span className="text-xs line-clamp-1">{productName}</span>
            <span className="text-xs text-stone-400 line-clamp-1">
              {hostname}
            </span>
          </div>
          <span className="text-xs whitespace-nowrap">{productPrice}</span>
        </div>
      </div>
    </>
  );
};

export default ProductCard;

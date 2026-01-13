import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ProductArea = ({ products = [], cartId, hideSidebar }) => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductDelete = () => {
    // Reload the page to refresh the cart and products
    window.location.reload();
  };

  const handleProductClick = (productData) => {
    setSelectedProduct(productData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (products.length === 0) {
    return (
      <div className="relative p-3 flex flex-col justify-center items-center h-full">
        <div className="text-gray-500">
          No products saved yet. Use the extension to save some products!
        </div>
        <a
          href="http://localhost:5173/"
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          Need help?
        </a>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="rounded-lg h-[630px] overflow-y-auto">
          <div
            className={`grid ${
              hideSidebar
                ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            } gap-5`}
          >
            {/* Products are now stored directly in carts */}
            {products.map((product) => (
              <ProductCard
                key={product.id}
                productName={product.title || "Unknown Product"}
                productImg={
                  product.image ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }
                productPrice={
                  product.price
                    ? `${product.currency || "$"}${product.price}`
                    : "Price not available"
                }
                productId={product.id}
                productUrl={product.url}
                productDescription={product.description}
                cartId={cartId}
                onDelete={handleProductDelete}
                onProductClick={handleProductClick}
                hostname={product.hostname}
              />
            ))}
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        productName={selectedProduct?.productName}
        productImg={selectedProduct?.productImg}
        productPrice={selectedProduct?.productPrice}
        productId={selectedProduct?.productId}
        productUrl={selectedProduct?.productUrl}
        productDescription={selectedProduct?.productDescription}
        cartId={cartId}
        onDelete={handleProductDelete}
      />
    </>
  );
};

export default ProductArea;

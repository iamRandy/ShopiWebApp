import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ProductArea = ({ productIds }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    console.log("fetching products", productIds);
    try {
      // fetch products by their id from the selected cart
      const response = await authenticatedFetch(
        "http://localhost:3000/api/products/batch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      console.log("products", data);
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);

      // If it's an authentication error, redirect to login instead of showing error
      if (
        err.message === "No authentication token found" ||
        err.message === "Authentication failed"
      ) {
        navigate("/login");
        return;
      }

      setError("Failed to load products");
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetchProducts();
  }, [productIds]);

  const handleProductDelete = () => {
    // Refresh the products list after deletion
    setLoading(true);
    fetchProducts();
  };

  const handleProductClick = (productData) => {
    setSelectedProduct(productData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="p-3 flex justify-center items-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

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
        <div className="border rounded-lg h-[720px] overflow-y-auto bg-white">
          <div className="p-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(208px, 208px))' }}>
            {/* fetch products by their id from the selected cart */}
            {products.map((product) => (
              <ProductCard
                key={product.id}
                productName={product.title || "Unknown Product"}
                productImg={product.image || "https://via.placeholder.com/300x300?text=No+Image"}
                productPrice={product.price ? `${product.currency || "$"}${product.price}` : "Price not available"}
                productId={product.id}
                productUrl={product.url}
                productDescription={product.description}
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
        onDelete={handleProductDelete}
      />
    </>
  );
};

export default ProductArea;

import React, { useState } from "react";
import { getAffiliateLink } from "../utils/affiliate";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const CartModal = ({
  isOpen,
  onClose,
  getIconByName,
}) => {
  const navigate = useNavigate();
  const [ status, setStatus ] = useState(null);
  const [ cartName, setCartName ] = useState("");
  const [ cartIcon, setCartIcon ] = useState("ShoppingCart");
  const [ cartColor, setCartColor ] = useState("#000000");

  const ICON_OPTIONS = [
    "ShoppingCart", "Globe", "Heart", "Star", "Gift", "Banana", "Book", "Camera", "Car", "Clock", "Cloud", "Coffee", "DollarSign", "Home", "Key", "Music", "Phone", "Plane", "Smile", "User"
  ];

  if (!isOpen) return null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await authenticatedFetch(
          "http://localhost:3000/api/products",
          {
            method: "DELETE",
            body: JSON.stringify({ productId }),
          }
        );

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCreateCart = () => {
    setStatus("Creating cart...");
  }

  const handleSubmit = (e) => {
    if (cartName.length === 0 || cartIcon === "") {
      setStatus("Must fill out all fields.");
      return;
    }

    e.preventDefault();
    authenticatedFetch("http://localhost:3000/api/carts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: cartName, icon: cartIcon }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("cart created", data);
        setStatus("Cart created!");
        setTimeout(() => {
          setStatus(null);
          window.location.reload();          
        }, 3000)
      })
      .catch((error) => {
        console.error("Error creating cart:", error);
      });
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex flex-row justify-center items-center gap-10 z-50 p-4"
      onClick={handleBackdropClick}
    >
        <div className="col-span-1 flex flex-col gap-4 items-center justify-center w-[300px] min-h-[100px]">
            <p className="text-2xl font-bold">PREVIEW</p>
            <div 
            style={{ backgroundColor: cartColor }}
            className="rounded-3xl rounded-l-none w-full max-h-[70vh] overflow-y-auto shadow-2xl p-4 flex flex-row items-center justify-end gap-3">
                <p className="text-2xl font-bold">{getIconByName(cartIcon, { className: "w-[28px] h-[28px]" })}</p>
                <p className="text-2xl font-bold text-nowrap">{(cartName || "Unnamed Cart")}</p>
            </div>
        </div>

        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[70vh] overflow-y-auto shadow-2xl col-span-5">
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

            <div className="flex justify-center items-center">
                <h2 className="text-2xl font-bold text-black">Create a New Cart</h2>
            </div>
            </div>

            {/* Content */}
            <div className="p-6 text-black">
                <div className="flex flex-col md:flex-row gap-4 relative">

                    {status !== null &&
                      <div className="absolute w-full flex justify-center">
                      <p className="text-blue-500 italic">*{status}</p>
                    </div>}
                    {/* Cart Info */}
                    <form onSubmit={handleSubmit} className="flex-1">
                    <h3 className="text-lg font-semibold">Cart Name</h3>
                    <input
                      required
                      type="text"
                      name="cartName"
                      placeholder="Cart Name"
                      className="bg-white w-full p-2 border border-gray-300 rounded-md"
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      maxLength={20}
                    />
                    <div className="text-xs text-gray-500 text-right">{cartName.length}/20</div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Choose an Icon</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {ICON_OPTIONS.map((iconName) => (
                          <button
                            type="button"
                            key={iconName}
                            className={`p-2 rounded-lg border ${cartIcon === iconName ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'} flex items-center justify-center`}
                            onClick={() => setCartIcon(iconName)}
                            aria-label={iconName}
                          >
                            {getIconByName(iconName, { className: "w-6 h-6" })}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleCreateCart} type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Create Cart</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CartModal;

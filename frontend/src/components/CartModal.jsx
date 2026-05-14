import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getAffiliateLink } from "../utils/affiliate";
import { authenticatedFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

const CartModal = ({
  isOpen,
  onClose,
  getIconByName,
  isEditMode = false,
  cartData = null,
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [cartName, setCartName] = useState("");
  const [cartIcon, setCartIcon] = useState("ShoppingCart");
  const [cartColor, setCartColor] = useState("#000000");

  const ICON_OPTIONS = [
    "ShoppingCart",
    "Globe",
    "Heart",
    "Star",
    "Gift",
    "Banana",
    "Book",
    "Camera",
    "Car",
    "Clock",
    "Cloud",
    "Coffee",
    "DollarSign",
    "Home",
    "Key",
    "Music",
    "Phone",
    "Plane",
    "Smile",
    "User",
  ];

  // Pre-populate form fields if in edit mode
  useEffect(() => {
    if (isEditMode && cartData) {
      setCartName(cartData.name || "");
      setCartIcon(cartData.icon || "ShoppingCart");
      setCartColor(cartData.color || "#000000");
    } else {
      setCartName("");
      setCartIcon("ShoppingCart");
      setCartColor("#000000");
    }
  }, [isEditMode, cartData]);

  if (!isOpen) return null;

  const handleDeleteCart = async (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this cart? This action cannot be undone."
      )
    ) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        console.log(`attempting to hit: ${API_URL}/api/carts/${cartData.id}`)
        const response = await authenticatedFetch(
          `${API_URL}/api/carts/${cartData.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setStatus("Cart deleted successfully!");
          setTimeout(() => {
            setStatus(null);
            onClose();
            window.location.reload();
          }, 1500);
        } else {
          console.log("response was not okay");
          try {
            const errorData = await response.json();
            console.log("json response");
            setStatus("Failed to delete cart: " + (errorData.error || errorData.message || "Unknown error"));
          } catch (jsonError) {
            // If response is not JSON, use status text
            console.log("non json response:", response);
            console.log("jsonError:", jsonError);
            setStatus(`Failed to delete cart: ${response.status} ${response.statusText}`);
          }
        }
      } catch (error) {
        console.error("Error deleting cart:", error);

        if (
          error.message === "No authentication token found" ||
          error.message === "Authentication failed"
        ) {
          navigate("/login");
          return;
        }

        setStatus("Failed to delete cart. Please try again.");
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartName.length === 0 || cartIcon === "") {
      setStatus("Please enter a name for your cart.");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const url = isEditMode
      ? `${API_URL}/api/carts/${cartData.id}`
      : `${API_URL}/api/carts`;

    const method = isEditMode ? "PUT" : "POST";

    authenticatedFetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: cartName,
        icon: cartIcon,
        color: cartColor,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(isEditMode ? "cart updated" : "cart created", data);
        setStatus(isEditMode ? "Cart updated!" : "Cart created!");
        setTimeout(() => {
          setStatus(null);
          onClose();
          window.location.reload();
        }, 1500);
      })
      .catch((error) => {
        console.error(
          `Error ${isEditMode ? "updating" : "creating"} cart:`,
          error
        );
        setStatus(
          `Failed to ${
            isEditMode ? "update" : "create"
          } cart. Please try again.`
        );
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/80 p-0 pb-[env(safe-area-inset-bottom,0px)] sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="flex w-full max-w-4xl flex-col gap-3 p-3 sm:max-h-[min(90vh,100dvh-1rem)] sm:flex-row sm:items-start sm:justify-center sm:gap-6 md:gap-8"
      >
        {/* Preview — compact tab on desktop; full-width strip on mobile */}
        <div className="flex w-full shrink-0 flex-col items-center gap-2 sm:w-auto md:min-w-[260px] md:max-w-[300px]">
          <p className="text-sm font-bold tracking-wide text-white/90 sm:text-base md:text-lg">
            PREVIEW
          </p>
          <div
            style={{ backgroundColor: "#FFBC42" }}
            className="flex h-auto w-full max-w-md shrink-0 flex-row items-center justify-end gap-2 rounded-2xl rounded-l-none p-3 shadow-2xl sm:max-w-none sm:p-4"
          >
            <span className="text-xl font-bold sm:text-2xl">
              {getIconByName(cartIcon, {
                className: "h-7 w-7 sm:h-7 sm:w-7 md:h-7 md:w-7",
              })}
            </span>
            <p className="min-w-0 flex-1 truncate text-right text-lg font-bold sm:text-xl md:text-2xl">
              {cartName || "Unnamed Cart"}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(90vh,100dvh-1rem)] sm:rounded-3xl">
          {/* Header */}
          <div className="relative shrink-0 border-b border-stone-100 p-3 pt-12 sm:p-4 sm:pt-14">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 sm:left-4 sm:top-4"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex justify-center px-2">
              <h2 className="text-center text-xl font-bold text-black sm:text-2xl">
                {isEditMode ? "Edit Cart" : "Create a New Cart"}
              </h2>
            </div>
          </div>

          <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto p-4 text-black sm:p-6">
            <div className="relative flex flex-col gap-4">
              {status !== null && (
                <div className="flex justify-center">
                  <p className="text-center text-sm italic text-[#FFBC42] sm:text-base">
                    {status}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-1 text-base font-semibold sm:text-lg">
                    Cart Name
                  </h3>
                  <input
                    type="text"
                    name="cartName"
                    placeholder="Cart Name"
                    className="w-full rounded-md border border-gray-300 bg-white p-3 text-base outline-none ring-offset-2 focus:ring-2 focus:ring-[#FFBC42]/60"
                    value={cartName}
                    onChange={(e) => setCartName(e.target.value)}
                    maxLength={20}
                    autoComplete="off"
                  />
                  <div className="mt-1 text-right text-xs text-gray-500">
                    {cartName.length}/20
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-base font-semibold sm:text-lg">
                    Choose an Icon
                  </h4>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {ICON_OPTIONS.map((iconName) => (
                      <button
                        type="button"
                        key={iconName}
                        className={`flex min-h-[44px] min-w-0 items-center justify-center rounded-lg border p-2 transition-colors active:scale-[0.98] ${
                          cartIcon === iconName
                            ? "border-blue-500 bg-blue-100"
                            : "border-gray-200 bg-white hover:bg-stone-50"
                        }`}
                        onClick={() => setCartIcon(iconName)}
                        aria-label={iconName}
                      >
                        {getIconByName(iconName, {
                          className: "h-6 w-6 sm:h-6 sm:w-6",
                        })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <button
                    type="submit"
                    className="min-h-[48px] flex-1 rounded-md bg-[#FFBC42] px-4 py-3 text-base font-medium text-white hover:bg-[#f7ad3e] sm:flex-none sm:px-6"
                  >
                    {isEditMode ? "Save Changes" : "Create Cart"}
                  </button>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleDeleteCart}
                      className="min-h-[48px] flex-1 rounded-md bg-red-500 px-4 py-3 text-base font-medium text-white hover:bg-red-600 sm:flex-none sm:px-6"
                    >
                      Delete Cart
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;

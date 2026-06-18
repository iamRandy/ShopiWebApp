import { Plus, ShoppingCart } from "lucide-react";
import CartTab from "./CartTab";
import CartModal from "./CartModal";
import { useState } from "react";
import { getCartIcon } from "../utils/cartIcons";

const CartArea = ({ carts, selectedCart, cartSelected }) => {
  const [error, setError] = useState(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cartBeingEdited, setCartBeingEdited] = useState(null);

  const handleCartSelect = (cartId) => {
    if (cartId === "addCart") {
      setIsEditMode(false);
      setCartBeingEdited(null);
      setIsCartModalOpen(true);
    } else {
      cartSelected(cartId);
    }
  };

  const handleCartEdit = (cartId) => {
    const cartToEdit = carts.find((cart) => cart.id === cartId);
    if (cartToEdit) {
      setIsEditMode(true);
      setCartBeingEdited(cartToEdit);
      setIsCartModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsCartModalOpen(false);
    setIsEditMode(false);
    setCartBeingEdited(null);
  };

  if (error) {
    return (
      <div className="w-full">
        <p className="w-full text-center text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* first cart is selected by default */}
      {carts.map((cart) => (
        <CartTab
          key={cart.id}
          cartId={cart.id}
          title={cart.name || "Unnamed Cart"}
          icon={
            getCartIcon(cart.icon, { className: "w-[28px] h-[28px]" }) || (
              <ShoppingCart className="w-[28px] h-[28px]" />
            )
          }
          selected={selectedCart === cart.id}
          handleCartSelect={handleCartSelect}
          handleCartEdit={handleCartEdit}
        />
      ))}

      {/* -- Add Cart Button -- */}
      <CartTab
        cartId="addCart"
        title="add cart"
        icon={<Plus className="w-[28px] h-[28px]" color="#57382a" />}
        selected={selectedCart === "addCart"}
        handleCartSelect={handleCartSelect}
        handleCartEdit={() => {}} // No edit functionality for add cart button
      />

      {isCartModalOpen && (
        <CartModal
          isOpen={isCartModalOpen}
          onClose={handleCloseModal}
          isEditMode={isEditMode}
          cartData={cartBeingEdited}
        />
      )}
    </>
  );
};

export default CartArea;

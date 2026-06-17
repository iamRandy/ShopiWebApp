import { useState } from "react";
import { Cog, Plus, ShoppingCart } from "lucide-react";
import CartSidebarItem from "./CartSidebarItem";
import UserFooter from "./UserFooter";
import CartModal from "../CartModal";
import * as Icons from "lucide-react";

function getIconByName(name, props) {
  const LucideIcon = Icons[name];
  return LucideIcon ? (
    <LucideIcon {...props} />
  ) : (
    <ShoppingCart {...props} />
  );
}

export default function DashboardSidebar({
  carts = [],
  selectedCartId,
  onCartSelect,
  onCartsChanged,
}) {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartBeingEdited, setCartBeingEdited] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleAddCart = () => {
    setIsEditMode(false);
    setCartBeingEdited(null);
    setIsCartModalOpen(true);
  };

  const handleEditCart = (cart) => {
    setIsEditMode(true);
    setCartBeingEdited(cart);
    setIsCartModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCartModalOpen(false);
    setIsEditMode(false);
    setCartBeingEdited(null);
    onCartsChanged?.();
  };

  return (
    <aside className="flex h-full min-h-[100dvh] w-full flex-col border-r-2 border-stone-200 bg-[#faf8f4] px-4 py-5 md:w-64 md:shrink-0 lg:w-72">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/images/Avee.png"
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="truncate text-lg font-extrabold tracking-tight text-black">
            Chaos
          </span>
        </div>
        <button
          type="button"
          title="Settings"
          onClick={() => {}}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          <Cog className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-stone-600">Your Carts</h2>
        <button
          type="button"
          onClick={handleAddCart}
          title="Add cart"
          className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {carts.map((cart) => (
          <CartSidebarItem
            key={cart.id}
            cart={cart}
            selected={selectedCartId === cart.id}
            onSelect={onCartSelect}
            onEdit={handleEditCart}
          />
        ))}
      </nav>

      <UserFooter />

      {isCartModalOpen && (
        <CartModal
          getIconByName={getIconByName}
          isOpen={isCartModalOpen}
          onClose={handleCloseModal}
          isEditMode={isEditMode}
          cartData={cartBeingEdited}
        />
      )}
    </aside>
  );
}

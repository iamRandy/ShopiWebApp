import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cog, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import CartSidebarItem from "./CartSidebarItem";
import UserFooter from "./UserFooter";
import CartModal from "../CartModal";

export default function DashboardSidebar({
  carts = [],
  selectedCartId,
  onCartSelect,
  onCartsChanged,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
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
    <aside
      className={`flex h-full min-h-[100dvh] w-full flex-col border-r-2 border-stone-200 bg-[#faf8f4] py-5 transition-[padding] duration-200 ${
        collapsed ? "items-center px-2" : "px-4"
      }`}
    >
      <div
        className={`mb-6 flex w-full items-center gap-2 ${
          collapsed ? "flex-col" : "justify-between"
        }`}
      >
        <div
          className={`flex min-w-0 items-center ${
            collapsed ? "justify-center" : "gap-2"
          }`}
        >
          <img
            src="/images/Avee.png"
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="truncate text-lg font-extrabold tracking-tight text-black">
              Chaos
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-1 ${
            collapsed ? "flex-col" : "shrink-0"
          }`}
        >
          <button
            type="button"
            title="Settings"
            onClick={() => navigate("/home/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            <Cog className="h-4 w-4" strokeWidth={2.25} />
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" strokeWidth={2.25} />
              ) : (
                <PanelLeftClose className="h-4 w-4" strokeWidth={2.25} />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`mb-3 flex w-full items-center gap-2 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <h2 className="text-sm font-bold text-stone-600">Your Carts</h2>
        )}
        <button
          type="button"
          onClick={handleAddCart}
          title="Add cart"
          className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <nav
        className={`flex w-full flex-1 flex-col gap-1 overflow-y-auto ${
          collapsed ? "items-center pr-0" : "pr-1"
        }`}
      >
        {carts.map((cart) => (
          <CartSidebarItem
            key={cart.id}
            cart={cart}
            selected={selectedCartId === cart.id}
            onSelect={onCartSelect}
            onEdit={handleEditCart}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <UserFooter collapsed={collapsed} />

      {isCartModalOpen && (
        <CartModal
          isOpen={isCartModalOpen}
          onClose={handleCloseModal}
          isEditMode={isEditMode}
          cartData={cartBeingEdited}
        />
      )}
    </aside>
  );
}

import { MoreHorizontal } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { getCartIcon } from "../../utils/cartIcons";

export default function CartSidebarItem({
  cart,
  selected,
  onSelect,
  onEdit,
  collapsed = false,
}) {
  const count = cart.products?.length ?? 0;
  const cartName = cart.name || "Unnamed Cart";

  if (collapsed) {
    return (
      <div className="group relative w-full">
        <button
          type="button"
          onClick={() => onSelect(cart.id)}
          title={`${cartName} (${count})`}
          aria-label={`${cartName}, ${count} items`}
          className={`flex w-full items-center justify-center rounded-xl border-2 p-2.5 transition-all ${
            selected
              ? "border-black bg-[#FFBC42]/30 shadow-[3px_3px_0_#000]"
              : "border-transparent bg-transparent hover:border-stone-200 hover:bg-white/80"
          }`}
        >
          <span className="text-stone-700">
            {getCartIcon(cart.icon, { className: "h-5 w-5" }) || (
              <ShoppingCart className="h-5 w-5" />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cart);
          }}
          className="absolute -right-0.5 -top-0.5 flex rounded-full bg-white p-0.5 text-stone-600 opacity-0 shadow-sm transition-opacity hover:text-black group-hover:opacity-100"
          title="Edit cart"
          aria-label={`Edit ${cartName}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
        selected
          ? "border-black bg-[#FFBC42]/30 shadow-[3px_3px_0_#000]"
          : "border-transparent bg-transparent hover:border-stone-200 hover:bg-white/80"
      }`}
      onClick={() => onSelect(cart.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(cart.id);
        }
      }}
    >
      <span className="flex-shrink-0 text-stone-700">
        {getCartIcon(cart.icon, { className: "h-5 w-5" }) || (
          <ShoppingCart className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-black">
        {cartName}
      </span>
      <span className="text-xs font-bold tabular-nums text-stone-500">{count}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(cart);
        }}
        className="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-full bg-white p-1 text-stone-600 opacity-0 shadow-sm transition-opacity hover:text-black group-hover:opacity-100"
        title="Edit cart"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

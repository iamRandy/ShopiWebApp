import { MoreHorizontal } from "lucide-react";
import * as Icons from "lucide-react";
import { ShoppingCart } from "lucide-react";

function getIconByName(name, props) {
  const LucideIcon = Icons[name];
  return LucideIcon ? (
    <LucideIcon {...props} />
  ) : (
    <ShoppingCart {...props} />
  );
}

export default function CartSidebarItem({
  cart,
  selected,
  onSelect,
  onEdit,
}) {
  const count = cart.products?.length ?? 0;

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
        {getIconByName(cart.icon, { className: "h-5 w-5" }) || (
          <ShoppingCart className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-black">
        {cart.name || "Unnamed Cart"}
      </span>
      <span className="text-xs font-bold tabular-nums text-stone-500">{count}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(cart);
        }}
        className="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-full bg-white p-1 text-stone-500 opacity-0 shadow-sm transition-opacity hover:text-black group-hover:opacity-100"
        title="Edit cart"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

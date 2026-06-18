import { memo } from "react";
import { Gift, Heart, ShoppingBag, Shirt } from "lucide-react";

const CARTS = [
  { name: "Wishlist", icon: Heart, selected: true },
  { name: "Gifts", icon: Gift, selected: false },
  { name: "Wardrobe", icon: Shirt, selected: false },
  { name: "Deals", icon: ShoppingBag, selected: false },
];

const PRODUCTS = [
  { name: "Silk scarf", price: "$48", swatch: "from-rose-100 to-pink-50" },
  { name: "Leather tote", price: "$129", swatch: "from-amber-100 to-yellow-50" },
  { name: "Gold hoops", price: "$32", swatch: "from-orange-100 to-amber-50" },
  { name: "Candle set", price: "$24", swatch: "from-stone-200 to-stone-100" },
];

function DemoCartItem({ cart }) {
  const Icon = cart.icon;

  return (
    <div
      className={`flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1.5 ${
        cart.selected
          ? "border-2 border-black bg-white shadow-[2px_2px_0_#FFBC42]"
          : "border border-transparent opacity-70"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-[#faf8f4]">
        <Icon className="h-3 w-3 text-[#b45309]" strokeWidth={2.25} />
      </span>
      {!cart.selected ? null : (
        <span className="truncate text-[8px] font-semibold text-black">{cart.name}</span>
      )}
    </div>
  );
}

function OnePlaceStatic() {
  return (
    <div className="flex h-full w-full bg-[#f8f6f0]">
      <div className="flex w-[30%] flex-col gap-1 border-r-2 border-stone-200 bg-[#faf8f4] px-1.5 py-2">
        <div className="mb-1 flex items-center gap-1 px-0.5">
          <img src="/images/Avee.png" alt="" className="h-4 w-4 object-contain" />
          <span className="text-[8px] font-extrabold text-black">Chaos</span>
        </div>
        {CARTS.map((cart) => (
          <DemoCartItem key={cart.name} cart={cart} />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2">
        <div className="mb-2">
          <p className="truncate text-[10px] font-bold text-black">Wishlist</p>
          <p className="text-[8px] text-stone-500">4 saved items</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="overflow-hidden rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]"
            >
              <div
                className={`flex h-12 items-center justify-center bg-gradient-to-br ${product.swatch}`}
              />
              <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                <p className="truncate text-[7px] font-semibold text-black">{product.name}</p>
                <span className="shrink-0 text-[7px] font-bold">{product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(OnePlaceStatic);

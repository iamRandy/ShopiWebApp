import { memo } from "react";
import { ShoppingCart, Heart, Gift, Headphones, Coffee, Lamp } from "lucide-react";
import DemoProductCard from "../DemoProductCard";

const CARTS = [
  { name: "Wishlist", icon: Heart },
  { name: "Gifts", icon: Gift },
  { name: "Deals", icon: ShoppingCart },
];

const PRODUCTS = [
  {
    productName: "Wireless earbuds",
    icon: Headphones,
    productPrice: "$24.99",
    hostname: "amazon.com",
  },
  {
    productName: "Ceramic mug set",
    icon: Coffee,
    productPrice: "$18.50",
    hostname: "target.com",
  },
  {
    productName: "Desk lamp",
    icon: Lamp,
    productPrice: "$34.00",
    hostname: "walmart.com",
  },
];

function DemoCartTab({ cart, selected }) {
  const Icon = cart.icon;

  return (
    <div
      className={`flex h-[30px] w-full shrink-0 items-center justify-end gap-1.5 rounded-none rounded-r-md border-r-[3px] bg-white pl-2 pr-2.5 text-black shadow-sm md:h-[34px] ${
        selected ? "border-[#FFBC42] opacity-100" : "border-black opacity-25"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      <span className="truncate text-[9px] font-semibold md:text-[10px]">
        {cart.name}
      </span>
    </div>
  );
}

function OnePlaceStatic() {
  return (
    <div className="flex h-full w-full bg-[#f8f6f0]">
      <div className="flex w-[34%] flex-col justify-start gap-1.5 border-r border-stone-200/80 py-3 pl-0 pr-1 pt-2">
        {CARTS.map((cart, index) => (
          <DemoCartTab key={cart.name} cart={cart} selected={index === 0} />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <div className="mb-2">
          <p className="truncate text-xs font-bold tracking-wide">Wishlist</p>
          <p className="text-[9px] text-stone-500">3 products</p>
        </div>

        <div className="grid grid-cols-2 content-start gap-1.5">
          {PRODUCTS.map((product) => (
            <DemoProductCard
              key={product.productName}
              productName={product.productName}
              icon={product.icon}
              productPrice={product.productPrice}
              hostname={product.hostname}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(OnePlaceStatic);

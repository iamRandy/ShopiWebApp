import { createElement } from "react";
import * as Icons from "lucide-react";
import { ShoppingCart } from "lucide-react";

/** Curated icons for cart picker (30). Stored on cart as string keys. */
export const CART_ICON_OPTIONS = [
  "ShoppingCart",
  "ShoppingBag",
  "ShoppingBasket",
  "Heart",
  "Star",
  "Bookmark",
  "Gift",
  "Sparkles",
  "Tag",
  "Percent",
  "Home",
  "Shirt",
  "Gem",
  "Baby",
  "UtensilsCrossed",
  "Laptop",
  "Gamepad2",
  "Dumbbell",
  "Palette",
  "Plane",
  "Car",
  "PawPrint",
  "BookOpen",
  "Music",
  "Camera",
  "Flower2",
  "Coffee",
  "Apple",
  "Briefcase",
  "Wallet",
];

/** Resolve icons from older cart records (hidden from picker). */
const LEGACY_CART_ICONS = {
  Globe: Icons.Globe,
  Banana: Icons.Banana,
  Book: Icons.Book,
  Clock: Icons.Clock,
  Cloud: Icons.Cloud,
  DollarSign: Icons.DollarSign,
  Key: Icons.Key,
  Phone: Icons.Phone,
  Smile: Icons.Smile,
  User: Icons.User,
};

export function getCartIconComponent(name) {
  if (!name) return ShoppingCart;
  return Icons[name] || LEGACY_CART_ICONS[name] || ShoppingCart;
}

export function getCartIcon(name, props = {}) {
  return createElement(getCartIconComponent(name), props);
}

export function formatCartIconLabel(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1")
    .trim();
}

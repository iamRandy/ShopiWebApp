import { createElement } from "react";
import * as Icons from "lucide-react";
import { ShoppingCart } from "lucide-react";

/** Popular, shopping-relevant icons shown in the picker carousel by default. */
export const POPULAR_CART_ICONS = [
  "ShoppingCart",
  "ShoppingBag",
  "ShoppingBasket",
  "Heart",
  "Star",
  "Gift",
  "Tag",
  "BadgePercent",
  "Wallet",
  "CreditCard",
  "Receipt",
  "Truck",
  "Store",
  "Sparkles",
  "Gem",
  "Coins",
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

function isIconComponent(value) {
  return typeof value === "object" && value !== null && typeof value.render === "function";
}

// lucide-react re-exports every icon under a couple of names (a "Lucide"
// prefixed alias and an "Icon" suffixed alias). Prefer the plain PascalCase
// name so the picker doesn't show the same icon twice under different labels.
function pickPreferredName(names) {
  return names.slice().sort((a, b) => {
    const aAlias = a.startsWith("Lucide");
    const bAlias = b.startsWith("Lucide");
    if (aAlias !== bAlias) return aAlias ? 1 : -1;
    const aSuffixed = a.endsWith("Icon") && a !== "Icon";
    const bSuffixed = b.endsWith("Icon") && b !== "Icon";
    if (aSuffixed !== bSuffixed) return aSuffixed ? 1 : -1;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  })[0];
}

/** Every icon lucide-react ships, deduped to one canonical name each (~1600). */
export const ALL_ICON_NAMES = (() => {
  const groups = new Map();
  for (const name of Object.keys(Icons)) {
    if (name === "Icon" || !isIconComponent(Icons[name])) continue;
    const component = Icons[name];
    if (!groups.has(component)) groups.set(component, []);
    groups.get(component).push(name);
  }
  return [...groups.values()]
    .map(pickPreferredName)
    .sort((a, b) => a.localeCompare(b));
})();

/** Search the full icon set by label. Returns [] for a blank query. */
export function searchCartIcons(query, limit = 60) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const matches = [];
  for (const name of ALL_ICON_NAMES) {
    if (formatCartIconLabel(name).toLowerCase().includes(trimmed)) {
      matches.push(name);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

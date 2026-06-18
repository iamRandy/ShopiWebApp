import { Bookmark, Heart, LayoutGrid } from "lucide-react";
import AnyStoreStatic from "./demos/AnyStoreStatic";
import OnePlaceStatic from "./demos/OnePlaceStatic";
import FavoritesNotesStatic from "./demos/FavoritesNotesStatic";

export const SELLING_POINTS = [
  {
    id: 1,
    title: "Save from any store",
    subtitle: "One click on any product page — no copy-paste.",
    icon: Bookmark,
    accent: "from-amber-100 to-orange-50",
    tilt: "-rotate-2",
    Demo: AnyStoreStatic,
  },
  {
    id: 2,
    title: "Carts for every mood",
    subtitle: "Wishlists, gifts, wardrobe, deals — keep finds separated.",
    icon: LayoutGrid,
    accent: "from-yellow-50 to-amber-100",
    tilt: "rotate-1",
    Demo: OnePlaceStatic,
  },
  {
    id: 3,
    title: "Favorites & notes",
    subtitle: "Star must-haves, jot why you loved it, filter when you're ready.",
    icon: Heart,
    accent: "from-orange-50 to-amber-50",
    tilt: "rotate-2",
    Demo: FavoritesNotesStatic,
  },
];

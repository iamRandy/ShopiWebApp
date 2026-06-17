import { Globe, Layers, Sparkles } from "lucide-react";
import AnyStoreStatic from "./demos/AnyStoreStatic";
import OnePlaceStatic from "./demos/OnePlaceStatic";
import SuperEasyStatic from "./demos/SuperEasyStatic";

export const SELLING_POINTS = [
  {
    id: 1,
    title: "Any Store",
    subtitle: "Go to any website and save!",
    icon: Globe,
    accent: "from-amber-100 to-orange-50",
    tilt: "-rotate-2",
    Demo: AnyStoreStatic,
  },
  {
    id: 2,
    title: "One Place",
    subtitle: "Guaranteed lost proof!",
    icon: Layers,
    accent: "from-yellow-50 to-amber-100",
    tilt: "rotate-1",
    Demo: OnePlaceStatic,
  },
  {
    id: 3,
    title: "Super Easy",
    subtitle: "Skill requirement: NONE!",
    icon: Sparkles,
    accent: "from-orange-50 to-amber-50",
    tilt: "rotate-2",
    Demo: SuperEasyStatic,
  },
];

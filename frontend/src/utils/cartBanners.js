export const DEFAULT_BANNER_COLOR = "#000000";

// Dark, readable text/icon color used on light banner backgrounds. Fixed rather than
// theme-aware (site light/dark mode) because what matters here is the banner's own
// chosen background color, not the app's color scheme.
const DARK_CONTENT_COLOR = "#1a1a1a";

function buildGradientCss(stops) {
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

// A warm-leaning pastel palette — soft, high-lightness hues (peach/coral/honey/rose/sand)
// rather than the saturated, muddier tones this started with. Each gradient keeps its
// stops as a plain array (not just the built CSS string) so we can sample them for
// text-contrast decisions in getCartBannerTone().
const GRADIENT_DEFS = [
  { key: "peach", label: "Peach", stops: ["#FFD8B8", "#FFB199"] },
  { key: "blush", label: "Blush", stops: ["#FADCE0", "#F3B8BE"] },
  { key: "honey", label: "Honey", stops: ["#FCE8A8", "#F6C177"] },
  { key: "coral", label: "Coral", stops: ["#FFB199", "#FF8FA3"] },
  { key: "terracotta", label: "Terracotta", stops: ["#E8A688", "#D68A66"] },
  { key: "apricot", label: "Apricot", stops: ["#FFD8B8", "#FFF0D9"] },
  { key: "dustyrose", label: "Dusty Rose", stops: ["#E3AEB0", "#D3969B"] },
  { key: "sand", label: "Sand", stops: ["#E8D2AE", "#D9BB8C"] },
];

export const BANNER_GRADIENTS = GRADIENT_DEFS.map((g) => ({
  ...g,
  css: buildGradientCss(g.stops),
}));

// A warm spectrum (red through pink) plus the two neutrals, for the solid-color picker.
export const PRESET_BANNER_COLORS = [
  "#F65356",
  "#FB8066",
  "#FEA671",
  "#FEC979",
  "#FEEA80",
  "#D7E586",
  "#A5DE94",
  "#5DAAD8",
  "#8187C7",
  "#C56BBA",
  "#000000",
  "#FFFFFF",
];

export function getBannerGradient(key) {
  return BANNER_GRADIENTS.find((g) => g.key === key);
}

export function getCartBannerBackground(cart) {
  if (cart?.bannerType === "gradient") {
    const gradient = getBannerGradient(cart.bannerGradient);
    if (gradient) return gradient.css;
  }
  return cart?.color || DEFAULT_BANNER_COLOR;
}

function hexToRgb(hex) {
  let clean = (hex || "").replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }) {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBannerRepresentativeHexes(cart) {
  if (cart?.bannerType === "gradient") {
    const gradient = getBannerGradient(cart.bannerGradient);
    if (gradient?.stops?.length) return gradient.stops;
  }
  return [cart?.color || DEFAULT_BANNER_COLOR];
}

/**
 * Picks whichever of light (white) or dark text/icon content reads better against
 * the cart's actual chosen banner (solid color, or a gradient's stops averaged
 * together), via WCAG contrast ratio rather than a fixed light/dark color list —
 * so it works for the curated presets and any custom color a user picks.
 */
export function getCartBannerTone(cart) {
  const rgbs = getBannerRepresentativeHexes(cart).map(hexToRgb);
  const avg = {
    r: rgbs.reduce((sum, c) => sum + c.r, 0) / rgbs.length,
    g: rgbs.reduce((sum, c) => sum + c.g, 0) / rgbs.length,
    b: rgbs.reduce((sum, c) => sum + c.b, 0) / rgbs.length,
  };
  const bgLuminance = relativeLuminance(avg);
  const whiteRatio = contrastRatio(bgLuminance, 1);
  const darkRatio = contrastRatio(bgLuminance, relativeLuminance(hexToRgb(DARK_CONTENT_COLOR)));
  return darkRatio > whiteRatio ? "dark" : "light";
}

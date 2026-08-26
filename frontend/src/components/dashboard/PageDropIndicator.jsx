/**
 * Slide-in "move to next/previous page?" bar shown while a product drag nears a page edge.
 * Positioned absolutely, so it must be rendered inside a `relative` ancestor that spans the
 * product content area — the left bar then emerges from the sidebar boundary (not the
 * viewport edge) and the right bar from the content's right edge. Opacity is part of the
 * hidden state on purpose: a bar translated exactly 100% off-screen still paints its
 * offset box-shadow into view as a thin sliver otherwise.
 */
export default function PageDropIndicator({ side, visible, label }) {
  const isLeft = side === "left";
  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-40 -translate-y-1/2 bg-[#FFBC42] px-2 py-4 text-xs font-bold text-black transition-all duration-200 ${
        isLeft ? "left-0 rounded-r-xl" : "right-0 rounded-l-xl"
      } ${
        visible
          ? "translate-x-0 opacity-100 shadow-[3px_3px_0_var(--color-shadow)]"
          : `opacity-0 ${isLeft ? "-translate-x-full" : "translate-x-full"}`
      }`}
    >
      <span className={`block [writing-mode:vertical-rl] ${isLeft ? "rotate-180" : ""}`}>
        {label}
      </span>
    </div>
  );
}

import { memo, useRef } from "react";
import AddressBar from "./AddressBar";
import DemoViewport from "./DemoViewport";
import TypewriterAddressBar from "./TypewriterAddressBar";
import { useInView } from "./useInView";

function BrowserChrome({ children, compact, viewportHeight }) {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const defaultCompactHeight = "h-[200px]";
  const heightClass = viewportHeight ?? (compact ? defaultCompactHeight : undefined);

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden bg-white ${
        compact ? "" : "rounded-2xl border-2 border-black shadow-[6px_6px_0_#FFBC42]"
      }`}
    >
      <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="min-w-0 flex-1">
          <TypewriterAddressBar enabled={inView} />
        </div>
      </div>
      <DemoViewport className="bg-stone-50" heightClass={heightClass}>
        {children}
      </DemoViewport>
    </div>
  );
}

function BrowserFrame({
  typedUrl = "",
  children,
  className = "",
  compact = false,
  viewportHeight,
  useTypewriter = false,
}) {
  if (useTypewriter) {
    return (
      <div className={className}>
        <BrowserChrome compact={compact} viewportHeight={viewportHeight}>
          {children}
        </BrowserChrome>
      </div>
    );
  }

  const defaultCompactHeight = "h-[200px]";
  const heightClass = viewportHeight ?? (compact ? defaultCompactHeight : undefined);

  return (
    <div
      className={`overflow-hidden bg-white ${
        compact
          ? ""
          : "rounded-2xl border-2 border-black shadow-[6px_6px_0_#FFBC42]"
      } ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="min-w-0 flex-1">
          <AddressBar typedText={typedUrl} />
        </div>
      </div>
      <DemoViewport className="bg-stone-50" heightClass={heightClass}>
        {children}
      </DemoViewport>
    </div>
  );
}

export default memo(BrowserFrame);

import { memo } from "react";
import BrowserFrame from "../BrowserFrame";
import { ExtensionWidget } from "../ExtensionPanel";

function ProductPageSkeleton() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-stone-100 to-stone-50 p-3">
      <div className="flex h-full gap-2.5">
        <div className="h-full w-[44%] rounded-lg border border-stone-200 bg-stone-200/80" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-3 w-[85%] rounded bg-stone-300" />
          <div className="h-2 w-[55%] rounded bg-stone-200" />
          <div className="mt-1 flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-200" />
          </div>
          <div className="mt-1 h-5 w-[38%] rounded-md bg-amber-200/90" />
          <div className="mt-2 space-y-1.5">
            <div className="h-2 w-full rounded bg-stone-100" />
            <div className="h-2 w-[92%] rounded bg-stone-100" />
            <div className="h-2 w-[78%] rounded bg-stone-100" />
          </div>
          <div className="mt-auto h-8 w-[42%] rounded-md bg-stone-300" />
        </div>
      </div>
    </div>
  );
}

function AnyStoreStatic() {
  return (
    <div className="flex h-full w-full items-start justify-center overflow-hidden pt-1 [contain:paint]">
      <div className="origin-top scale-[0.68] sm:scale-[0.74]">
        <div className="w-[340px]">
          <BrowserFrame compact useTypewriter>
            <ProductPageSkeleton />
            <ExtensionWidget
              tabVisible
              tabSlide={1}
              tabWiggle
              panelWidth={0}
              panelMode="main"
            />
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}

export default memo(AnyStoreStatic);

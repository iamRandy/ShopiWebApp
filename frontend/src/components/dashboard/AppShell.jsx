import { useState } from "react";
import { Menu, X } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

export default function AppShell({ children, sidebarProps }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#f8f6f0]">
      <div className="hidden md:flex md:h-[100dvh] md:shrink-0 md:sticky md:top-0">
        <DashboardSidebar {...sidebarProps} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-[min(18rem,85vw)] shadow-xl">
            <DashboardSidebar
              {...sidebarProps}
              onCartsChanged={() => {
                sidebarProps.onCartsChanged?.();
                setDrawerOpen(false);
              }}
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b-2 border-stone-200 bg-[#faf8f4] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

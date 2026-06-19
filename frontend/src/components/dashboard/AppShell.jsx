import { useState } from "react";
import { Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { SIDEBAR_COLLAPSED_KEY } from "./constants";

function getInitialSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AppShell({ children, sidebarProps }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const desktopSidebarProps = {
    ...sidebarProps,
    collapsed: sidebarCollapsed,
    onToggleCollapse: toggleSidebarCollapsed,
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#f8f6f0]">
      <div
        className={`relative z-10 hidden shrink-0 transition-[width] duration-200 ease-out md:sticky md:top-0 md:block md:h-[100dvh] ${
          sidebarCollapsed ? "md:w-16" : "md:w-64 lg:w-72"
        }`}
      >
        <DashboardSidebar {...desktopSidebarProps} />
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
              collapsed={false}
              isMobileDrawer
              onMobileClose={() => setDrawerOpen(false)}
              onCartsChanged={() => {
                sidebarProps.onCartsChanged?.();
                setDrawerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b-2 border-stone-200 bg-[#faf8f4] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000]"
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

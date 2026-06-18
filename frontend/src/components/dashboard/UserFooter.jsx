import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { logout } from "../../utils/api";
import { clearExtensionStorage } from "../../utils/extension";
import { APP_VERSION } from "./constants";

export default function UserFooter({ collapsed = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || "Username"
  );

  useEffect(() => {
    const syncName = () => {
      setUserName(localStorage.getItem("userName") || "Username");
    };
    window.addEventListener("profile-updated", syncName);
    return () => window.removeEventListener("profile-updated", syncName);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await clearExtensionStorage();
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/login");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative mt-auto w-full border-t-2 border-stone-200 pt-4 ${
        collapsed ? "flex flex-col items-center" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        title={collapsed ? userName : undefined}
        className={`flex items-center rounded-lg py-2 text-left text-black transition-colors hover:bg-stone-100 ${
          collapsed ? "justify-center px-2" : "w-full gap-2 px-2"
        }`}
      >
        <User className="h-5 w-5 shrink-0 text-stone-600" strokeWidth={2} />
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-black">{userName}</span>
        )}
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_#FFBC42] ${
            collapsed ? "left-0 min-w-[10rem]" : "left-0 right-0"
          }`}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      )}

      {!collapsed && (
        <p className="mt-3 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          CHAOS_WEB {APP_VERSION}
        </p>
      )}
    </div>
  );
}

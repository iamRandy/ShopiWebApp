import { User, Blocks, BadgeQuestionMark, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { logout } from "../utils/api";

// NavBar component
const NavBar = ({ isLanding }) => {
  // --- State and hooks ---
  const navigate = useNavigate();
  const authToken = localStorage.getItem("authToken");
  const isAuthenticated = !!authToken;
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isUserHover, setIsUserHover] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Handlers ---
  const clearExtensionStorage = () => {
    const EXT_ID = import.meta.env.VITE_EXTENSION_ID;
    if (window.chrome?.runtime?.sendMessage && EXT_ID) {
      window.chrome.runtime.sendMessage(
        EXT_ID,
        { type: "CLEAR_STORAGE" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Extension storage clear error:", chrome.runtime.lastError);
          }
        }
      );
    }
  };

  const handleLogin = () => navigate("/login");

  const handleLogout = async () => {
    try {
      clearExtensionStorage();
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/login");
    }
  };

  // --- Render ---
  return (
    <motion.nav
      initial={{ width: isLanding ? "95%" : "100%" }}
      className={`${isLanding ? "top-3" : "top-0"} text-black fixed left-0 right-0 z-50 h-fit mx-auto`}
      animate={{ width: isScrolled && !isHovering && isLanding ? "140px" : isLanding ? "95%" : "100%" }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div
        className={`${isLanding ? "rounded-full border border-stone-500/20 backdrop-blur-lg" : ""} relative flex w-full items-center justify-between bg-white/10 p-4 px-10 shadow-lg gap-10 h-16`}
      >
        {/* Left side: Logo */}
        <div className={`flex ${isLanding ? "absolute" : "justify-between"} items-center gap-3 w-fit`}>
          <a id="logo_text" href={isLanding ? "#" : ""} className="text-2xl font-bold">
            shopi
          </a>
        </div>

        {!isLanding && (
          <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center gap-10">
            {/* TODO: Other pages */}
            {/* <a className="text-lg flex gap-1 items-center special_links cursor-pointer">
              Carts
            </a>
            <a className="text-lg flex gap-1 items-center special_links cursor-pointer">
              Explore
            </a>
            <a className="text-lg flex gap-1 items-center special_links cursor-pointer">
              Pick
            </a> */}
          </div>
        )}

        {/* Center/Right: Navigation links and user actions */}
        <AnimatePresence>
          {(!isScrolled || isHovering) && (
            <>
              {/* Landing page navigation */}
              {isLanding && (
                <motion.div
                  className="flex flex-1 justify-center md:gap-10 sm:gap-5 lg:gap-10 items-center whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                >
                  <a href="#features" className="text-lg flex gap-1 items-center special_links">
                    <Cog className="w-5 h-5" />
                    Key Features
                  </a>
                  <a href="#how-it-works" className="text-lg flex gap-1 items-center special_links">
                    <Blocks className="w-5 h-5" />
                    How it works
                  </a>
                  <a href="#how-it-works" className="text-lg flex gap-1 items-center special_links">
                    <BadgeQuestionMark className="w-5 h-5" />
                    FAQs
                  </a>
                </motion.div>
              )}

              {/* Authenticated user navigation */}
              {!isLanding && (
                <motion.div
                  className="w-fit flex justify-end whitespace-nowrap"
                  initial={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -10 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                >
                  <div
                    className="flex gap-3 items-center"
                    onMouseEnter={() => setIsUserHover(true)}
                    onMouseLeave={() => setIsUserHover(false)}
                  >
                    <User className="w-5 h-5" />
                    <AnimatePresence>
                      {isAuthenticated && (
                        <motion.div
                          className="text-sm overflow-hidden whitespace-nowrap"
                          initial={{ width: 0 }}
                          animate={isUserHover ? { width: "auto" } : { width: 0 }}
                          exit={{ width: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
                        >
                          <div className="font-medium">{userName}</div>
                          <div className="text-xs text-gray-500">{userEmail}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      style={{ backgroundColor: "#FFBC42", color: "#57382a" }}
                      className="text-sm px-3 py-1 rounded"
                    >
                      Logout
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      style={{ backgroundColor: "#FFBC42" }}
                      className="text-sm px-3 py-1 rounded"
                    >
                      Login
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default NavBar;

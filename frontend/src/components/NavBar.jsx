import { User, Blocks, BadgeQuestionMark, HeartPlus, Menu, X, Cog } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { logout } from "../utils/api";

// NavBar component
const NavBar = ({ isLanding }) => {
  // --- State and hooks ---
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = localStorage.getItem("authToken");
  const isAuthenticated = !!authToken;
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isUserHover, setIsUserHover] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine scroll direction
      setIsScrollingUp(currentScrollY < lastScrollY);
      setIsScrolled(currentScrollY > 10);
      setLastScrollY(currentScrollY);
    };

    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize(); // Check initial size
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [lastScrollY]);

  // --- Handlers ---
  // Clears extension storage. Primary path is the content-script bridge so it
  // works for ANY installation ID (including unpacked dev installs whose IDs
  // don't match the hardcoded production ID). External messaging is tried in
  // parallel as a backup if the content script isn't present on the page.
  const clearExtensionStorage = async () => {
    return new Promise((resolve) => {
      const TIMEOUT_MS = 1500;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onResponse);
        resolve();
      };

      const onResponse = (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.type !== "SHOPI_EXT_RESPONSE") return;
        const msg = data?.response?.message;
        if (msg === "Storage cleared successfully" || data?.response?.ok) {
          finish();
        }
      };
      window.addEventListener("message", onResponse);

      // Primary: content-script bridge (no extension ID needed)
      window.postMessage(
        { type: "SHOPI_CLEAR_STORAGE", payload: { type: "CLEAR_STORAGE" } },
        "*"
      );

      // Backup: external messaging in case content script isn't injected
      const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
      const CHROME_EXT_ID =
        import.meta.env.VITE_EXTENSION_ID || "kihghmelfnfgbkbeiebkgconkmgboilg";

      const tryExternal = (extId, label) => {
        if (!window.chrome?.runtime?.sendMessage) return;
        try {
          window.chrome.runtime.sendMessage(
            extId,
            { type: "CLEAR_STORAGE" },
            (response) => {
              if (chrome.runtime.lastError) {
                return;
              }
              if (response?.ok) finish();
            }
          );
        } catch {
          // External messaging unavailable; content-script bridge or timeout applies
        }
      };
      tryExternal(FIREFOX_EXT_ID, "firefox");
      tryExternal(CHROME_EXT_ID, "chrome");

      // Hard timeout so logout never blocks indefinitely if no extension is
      // installed at all. Subsequent focus/storage events on the web app will
      // self-heal via the content script if needed.
      setTimeout(() => finish(), TIMEOUT_MS);
    });
  };

  const handleLogin = () => {
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await clearExtensionStorage();
      await logout();
      navigate("/login");
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/login");
      setIsMobileMenuOpen(false);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
  };

  const scrollToSectionWhenReady = (sectionId) => {
    let attempts = 0;
    const maxAttempts = 45;
    const tick = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (attempts++ < maxAttempts) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  const handleLandingSectionClick = (sectionId) => (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate(`/#${sectionId}`);
    scrollToSectionWhenReady(sectionId);
  };

  // --- Render ---

  return (
    <>
      <nav
        className={`
          left-0 right-0 text-black fixed ${
            isLanding ? "top-3 mx-4" : "top-0 mx-0 w-full"
          } ${isMobileMenuOpen ? "z-30" : "z-50"} h-fit
        `}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div
          className={`${
            isLanding
              ? "rounded-full border border-stone-500/20 backdrop-blur-lg bg-white/10 shadow-lg"
              : "border-b border-stone-200/90 bg-white/95 shadow-sm backdrop-blur-md"
          } relative flex items-center justify-between gap-3 sm:gap-6 md:gap-10 px-4 sm:px-5 md:px-6 py-3 min-h-16
        `}>
          {/* Left side: Logo */}
          <div className="relative flex flex-1 min-w-0 items-center h-full">
            <motion.a
              id="logo_text"
              href="/"
              className="text-xl sm:text-2xl font-bold flex items-center gap-2 absolute"
              onClick={handleLogoClick}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <AnimatePresence>
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  src="/images/Avee.png"
                  alt="Shopi Logo"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </AnimatePresence>
              Chaos
            </motion.a>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && !isLanding && (
            <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center gap-10">
              {/* TODO: Other pages */}
            </div>
          )}

          {/* Desktop Navigation Links and User Actions */}
          {!isMobile && (
                <>
                  {/* Landing page navigation */}
                  {isLanding && (
                    <div
                      className="flex flex-1 justify-center gap-5 lg:gap-10 items-center whitespace-nowrap"
                    >
                      <a
                        href="/#features"
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLandingSectionClick("features")}
                      >
                        <HeartPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                        Save
                      </a>
                      <a
                        href="/#how-it-works"
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLandingSectionClick("how-it-works")}
                      >
                        <Blocks className="w-4 h-4 lg:w-5 lg:h-5" />
                        Organize
                      </a>
                      <a
                        href=""
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLogin}
                      >
                        <BadgeQuestionMark className="w-4 h-4 lg:w-5 lg:h-5" />
                        Get started
                      </a>
                    </div>
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
                        <User className="w-4 h-4 lg:w-5 lg:h-5" />
                        <AnimatePresence>
                          {isAuthenticated && (
                            <motion.div
                              className="text-sm overflow-hidden whitespace-nowrap"
                              initial={{ width: 0, paddingRight: 0 }}
                              animate={
                                isUserHover
                                  ? { width: "auto", paddingRight: 8 }
                                  : { width: 0, paddingRight: 0 }
                              }
                              exit={{ width: 0, paddingRight: 0 }}
                              transition={
                                isUserHover
                                  ? {
                                      duration: 0.3,
                                      ease: "easeInOut",
                                      delay: 0.2,
                                    }
                                  : {
                                      duration: 0.3,
                                      ease: "easeInOut",
                                      delay: 0,
                                    }
                              }
                            >
                              <div className="font-medium">{userName}</div>
                              <div className="text-xs text-gray-500">
                                {userEmail}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {isAuthenticated ? (
                        <button
                          onClick={handleLogout}
                          style={{
                            backgroundColor: "#FFBC42",
                            color: "#57382a",
                          }}
                          className="text-sm px-3 py-1 rounded ml-3"
                        >
                          Logout
                        </button>
                      ) : (
                        <button
                          onClick={handleLogin}
                          style={{ backgroundColor: "#FFBC42" }}
                          className="text-sm px-3 py-1 rounded ml-3"
                        >
                          Login
                        </button>
                      )}
                    </motion.div>
                  )}
                </>
          )}

          {/* Mobile Hamburger Menu Button */}
          {isMobile && (
            <motion.button
              onClick={handleMobileMenuToggle}
              className="shrink-0 p-2 rounded-lg hover:bg-stone-100/80 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleMobileMenuToggle}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white/95 backdrop-blur-lg shadow-2xl p-6 pb-10"
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img
                  src="/images/Avee.png"
                  alt="Shopi Logo"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold">Chaos</span>
              </div>
              <button
                onClick={handleMobileMenuToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex flex-col gap-6">
              {/* Landing page navigation */}
              {isLanding && (
                <>
                  <a
                    href="/#features"
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLandingSectionClick("features")}
                  >
                    <Cog className="w-5 h-5" />
                    Key Features
                  </a>
                  <a
                    href="/#how-it-works"
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLandingSectionClick("how-it-works")}
                  >
                    <Blocks className="w-5 h-5" />
                    How it works
                  </a>
                  <a
                    href=""
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLogin}
                  >
                    <BadgeQuestionMark className="w-4 h-4 lg:w-5 lg:h-5" />
                    Get started
                  </a>
                </>
              )}

              {/* User Info and Actions */}
              {!isLanding && (
                <div className="border-t pt-6">
                  {isAuthenticated && (
                    <div className="flex gap-3 items-center p-3 rounded-lg bg-gray-50 mb-4">
                      <User className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{userName}</div>
                        <div className="text-sm text-gray-500">{userEmail}</div>
                      </div>
                    </div>
                  )}
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      style={{ backgroundColor: "#FFBC42", color: "#57382a" }}
                      className="w-full text-lg px-4 py-3 rounded-lg font-medium"
                    >
                      Logout
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      style={{ backgroundColor: "#FFBC42" }}
                      className="w-full text-lg px-4 py-3 rounded-lg font-medium cursor-pointer"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;

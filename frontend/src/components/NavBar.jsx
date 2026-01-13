import { User, Blocks, BadgeQuestionMark, Cog, Menu, X } from "lucide-react";
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
  const clearExtensionStorage = async () => {
    return new Promise((resolve) => {
      const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
      const CHROME_EXT_ID =
        import.meta.env.VITE_EXTENSION_ID || "kihghmelfnfgbkbeiebkgconkmgboilg";

      const message = { type: "CLEAR_STORAGE" };

      // Chrome-style messaging available?
      if (window.chrome?.runtime?.sendMessage) {
        // Try Firefox first
        try {
          window.chrome.runtime.sendMessage(FIREFOX_EXT_ID, message, () => {
            if (chrome.runtime.lastError) {
              // Try Chrome if Firefox failed
              window.chrome.runtime.sendMessage(CHROME_EXT_ID, message, () => {
                if (chrome.runtime.lastError) {
                  console.log("No compatible extension found");
                } else {
                  console.log("Chrome extension storage cleared");
                }
                resolve(); // <-- still resolve so logout continues
              });
            } else {
              console.log("Firefox extension storage cleared");
              resolve();
            }
          });
        } catch (err) {
          console.log("Error messaging Firefox extension, trying Chrome...");
          window.chrome.runtime.sendMessage(CHROME_EXT_ID, message, () => {
            console.log("Chrome extension storage cleared");
            resolve();
          });
        }
      } else {
        // Fallback (Firefox via window.postMessage)
        window.postMessage(
          { type: "SHOPI_CLEAR_STORAGE", payload: message },
          "*"
        );
        console.log("Sent clear storage via postMessage");
        // There's no callback here so just resolve immediately
        resolve();
      }
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

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // --- Render ---
  const isCollapsed =
    isScrolled && !isScrollingUp && !isHovering && isLanding && !isMobile;

  return (
    <>
      <motion.nav
        initial={{ width: isLanding ? "95%" : "100%" }}
        className={`
          ${isLanding ? "top-3" : "top-0"}
          text-black fixed left-0 right-0 ${
            isMobileMenuOpen ? "z-30" : "z-50"
          } h-fit mx-auto
          ${isCollapsed ? "flex justify-center items-center" : ""}
        `}
        animate={{
          width:
            isScrolled &&
            !isScrollingUp &&
            !isHovering &&
            isLanding &&
            !isMobile
              ? "10%"
              : isLanding
              ? "95%"
              : "100%",
        }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div
          className={`${
            isLanding
              ? "rounded-full border border-stone-500/20 backdrop-blur-lg"
              : ""
          } relative flex w-full items-center justify-between bg-white/10 shadow-lg gap-4 sm:gap-10 p-4 px-4 sm:px-10 h-16
        `}
        >
          {/* Left side: Logo */}
          <div className="relative flex items-center w-full h-full">
            <motion.a
              id="logo_text"
              href={isLanding ? "#" : ""}
              className="text-xl sm:text-2xl font-bold flex items-center gap-2 absolute"
              onClick={handleLinkClick}
              animate={{
                left: isCollapsed ? "50%" : "0%",
                x: isCollapsed ? "-50%" : "0%",
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    src="/images/Avee.png"
                    alt="Shopi Logo"
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                )}
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
            <AnimatePresence>
              {(!isScrolled || isScrollingUp || isHovering) && (
                <>
                  {/* Landing page navigation */}
                  {isLanding && (
                    <motion.div
                      className="flex flex-1 justify-center gap-5 lg:gap-10 items-center whitespace-nowrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      <a
                        href="#features"
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLinkClick}
                      >
                        <Cog className="w-4 h-4 lg:w-5 lg:h-5" />
                        Key Features
                      </a>
                      <a
                        href="#how-it-works"
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLinkClick}
                      >
                        <Blocks className="w-4 h-4 lg:w-5 lg:h-5" />
                        How it works
                      </a>
                      <a
                        href="#how-it-works"
                        className="text-base lg:text-lg flex gap-1 items-center special_links"
                        onClick={handleLinkClick}
                      >
                        <BadgeQuestionMark className="w-4 h-4 lg:w-5 lg:h-5" />
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
            </AnimatePresence>
          )}

          {/* Mobile Hamburger Menu Button */}
          {isMobile && !isCollapsed && (
            <motion.button
              onClick={handleMobileMenuToggle}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
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
      </motion.nav>

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
            className="fixed top-0 right-0 z-50 w-80 h-full bg-white/95 backdrop-blur-lg shadow-2xl p-6"
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
                    href="#features"
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Cog className="w-5 h-5" />
                    Key Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Blocks className="w-5 h-5" />
                    How it works
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-lg flex gap-3 items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <BadgeQuestionMark className="w-5 h-5" />
                    FAQs
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
                      className="w-full text-lg px-4 py-3 rounded-lg font-medium"
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

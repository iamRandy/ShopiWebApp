// ShopiWebApp/frontend/src/App.jsx
import ReactDOM from "react-dom/client";
import { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import SharedCart from "./pages/SharedCart";
import Support from "./pages/Support";

/**
 * SPA navigations keep window scrollY. Reset to top on each location update.
 * On `/` only, skip when a hash is present so NavBar can scroll to #features / #how-it-works.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (pathname === "/" && hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        {/* The App Store listing's Support URL. */}
        <Route path="/support" element={<Support />} />
        {/* A cart someone shared by link. Opens in the iOS app when it's installed. */}
        <Route path="/shared/:shareId" element={<SharedCart />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

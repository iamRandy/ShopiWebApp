// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ensureValidSession } from "../utils/api";

// Support both Firefox and Chrome extension IDs
const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
const CHROME_EXT_ID = import.meta.env.VITE_EXTENSION_ID || "kihghmelfnfgbkbeiebkgconkmgboilg";

const getCandidateExtensionIds = () => {
  const extensionIdFromUrl = new URLSearchParams(window.location.search).get(
    "extId"
  );
  const extensionIdFromEnv = import.meta.env.VITE_EXTENSION_ID;
  return [
    extensionIdFromUrl,
    extensionIdFromEnv,
    CHROME_EXT_ID,
    FIREFOX_EXT_ID,
  ].filter(Boolean);
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function StyledGoogleSignIn({ onSuccess, onError }) {
  return (
    <div className="group relative mx-auto w-full max-w-[280px]">
      <div
        className="pointer-events-none flex w-full items-center justify-center gap-3 rounded-full border-2 border-black bg-[var(--primary-btncolor)] px-6 py-3.5 text-base font-bold text-black shadow-[4px_4px_0_#000] transition-shadow group-hover:shadow-[2px_2px_0_#000] group-active:shadow-none"
        aria-hidden
      >
        <GoogleIcon />
        Continue with Google
      </div>
      <div className="absolute inset-0 overflow-hidden opacity-[0.01]">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          size="large"
          text="continue_with"
          shape="pill"
          width="280"
        />
      </div>
    </div>
  );
}

function GhostAvee({ className, animate }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      animate={animate}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <img
        src="/images/Avee.png"
        alt=""
        className="h-full w-full object-contain opacity-[0.12] md:opacity-[0.14]"
      />
    </motion.div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hasSession = await ensureValidSession();
      if (cancelled) return;

      if (hasSession) {
        navigate("/home", { replace: true });
        return;
      }

      setSessionChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      // Store initial user data (will be replaced by server tokens)
      localStorage.setItem("userSub", decoded.sub);
      localStorage.setItem("userEmail", decoded.email);
      localStorage.setItem("userName", decoded.name);

      loginSuccess(credentialResponse, decoded.sub, decoded.name);
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  };

  function loginSuccess(cRes, sub, name) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      fetch(`${API_URL}/api/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cRes.credential }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          // Store the new JWT tokens
          if (data.accessToken && data.refreshToken) {
            localStorage.setItem("authToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            await sendUserInfoToExtension(
              sub,
              name,
              data.accessToken,
              data.refreshToken
            );

            // Wait a moment to ensure message is sent
            await new Promise((resolve) => setTimeout(resolve, 500));

            window.location.href = "/home";
          }
        })
        .catch((error) => {
          console.error("Error trying to fetch login data:", error);
        });
    } catch (e) {
      console.error("Error during login success", e);
    }
  }

  const sendUserInfoToExtension = async (
    userSub,
    userName,
    accessToken,
    refreshToken
  ) => {
    const message = {
      type: "SET_USER_INFO",
      name: userName,
      sub: userSub,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    try {
      // Chrome approach: Use chrome.runtime.sendMessage with extension ID
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.sendMessage
      ) {
        const sendToExtension = async (extId) => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage(extId, message, () => {
              if (chrome.runtime.lastError) {
                resolve(false);
              } else {
                resolve(true);
              }
            });
          });
        };

        const extensionIds = getCandidateExtensionIds();
        let didSync = false;

        for (const extId of extensionIds) {
          // Label by value so logs show exactly what was attempted.
          const success = await sendToExtension(extId, extId);
          if (success) {
            didSync = true;
            break;
          }
        }

        if (!didSync) {
          console.warn(
            "Could not reach any extension ID during login sync:",
            extensionIds
          );
        }
      }
      // Firefox/Safari approach: Use window.postMessage to communicate with content script
      else {
        return new Promise((resolve) => {
          const handleResponse = (event) => {
            if (event.data && event.data.type === "SHOPI_EXT_RESPONSE") {
              window.removeEventListener("message", handleResponse);
              resolve();
            }
          };

          window.addEventListener("message", handleResponse);

          window.postMessage(
            {
              type: "SHOPI_SET_USER_INFO",
              payload: message,
            },
            "*"
          );

          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            resolve();
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Extension communication error:", error);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-[#f8f6f0] via-[#fef6eb] to-[#f8f6f0] text-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFBC42] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#f8f6f0] via-[#fef6eb] to-[#f8f6f0] text-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(255,188,66,0.14),transparent_70%)]"
        aria-hidden
      />

      <GhostAvee
        className="left-[-12%] top-[8%] h-[42vh] w-[42vh] rotate-[18deg] md:left-[-6%] md:top-[12%] md:h-[50vh] md:w-[50vh]"
        animate={{ y: [0, -18, 0], rotate: [18, 14, 18] }}
      />
      <GhostAvee
        className="right-[-12%] bottom-[6%] h-[40vh] w-[40vh] -rotate-[16deg] md:right-[-5%] md:bottom-[10%] md:h-[48vh] md:w-[48vh]"
        animate={{ y: [0, 16, 0], rotate: [-16, -12, -16] }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md rounded-3xl border-2 border-black bg-white p-8 shadow-[8px_8px_0_#FFBC42] md:p-10"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#FFBC42]">
            <Sparkles className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
            Welcome back
          </span>

          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Get started with{" "}
            <span className="relative inline-block">
              <span className="relative z-10 font-extrabold underline decoration-[#FFBC42] decoration-[5px] underline-offset-4">
                Chaos
              </span>
              <span
                className="absolute -bottom-1 left-0 right-0 -z-0 h-2.5 rounded-sm bg-[#FFBC42]/40"
                aria-hidden
              />
            </span>
          </h1>

          <p className="mt-3 text-sm font-medium leading-relaxed text-primary-dark sm:text-base">
            Sign in to save, organize, and shop stress-free.
          </p>

          <div className="mt-8">
            <StyledGoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google login failed")}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="special_links inline-flex items-center gap-2 text-sm font-semibold text-stone-700 transition-colors hover:text-black"
            >
            <ArrowLeft className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      <div className="flex h-screen w-full items-center justify-center bg-gray-200 text-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFBC42] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen text-black bg-gray-200">
      <div className="relative flex items-center justify-center md:justify-start w-full h-full overflow-hidden">
        <div
          id="image-container"
          className="z-[1] w-1/2 h-full absolute rotate-[20deg] translate-x-[5%] -translate-y-1/2 opacity-10"
        >
          <img
            src="/images/Avee.png"
            alt="Avee"
            className="w-full h-full object-contain"
          />
        </div>
        <div
          id="image-container"
          className="z-[1] w-1/2 h-full absolute -rotate-[20deg] translate-x-[98%] translate-y-1/2 opacity-10"
        >
          <img
            src="/images/Avee.png"
            alt="Avee"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="z-[2] flex flex-col justify-center bg-white shadow-xl absolute p-8 items-center rounded-lg md:items-start w-3/4 md:w-1/3 md:h-full md:text-start md:rounded-tr-lg md:rounded-br-lg">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-800 text-center md:text-start md:text-4xl"
          >
            {/*  */}
            <span className="hidden md:inline">
              Get started with Chaos
              <p className="mb-5 text-stone-500 text-sm font-medium md:text-base">
                Get ready to experience stress-free shopping 😎
              </p>
            </span>
            <span className="w-full md:hidden">
              Sign in
              <p className="mb-5 text-stone-500 text-sm font-medium md:text-base">
                Stress-free shopping with Chaos
              </p>
            </span>
          </motion.h2>

          <div className="w-fit">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google login failed")}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

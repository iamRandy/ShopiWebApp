// ShopiWebApp/frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Dashboard from "../components/Dashboard";
import { ensureValidSession } from "../utils/api";

// Support both Firefox and Chrome extension IDs
const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
const CHROME_EXT_ID = "kihghmelfnfgbkbeiebkgconkmgboilg";

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

const Home = () => {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncToExtension = async () => {
      try {
        const userSub = localStorage.getItem("userSub");
        const userName = localStorage.getItem("userName");
        const authToken = localStorage.getItem("authToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!userSub || !userName) {
          // Try to decode from token
          const decoded = jwtDecode(authToken);
          const sub = decoded.sub;
          const name = decoded.name;

          if (sub && name) {
            localStorage.setItem("userSub", sub);
            localStorage.setItem("userName", name);
            await sendUserInfoToExtension(sub, name, authToken, refreshToken);
          }
        } else {
          await sendUserInfoToExtension(
            userSub,
            userName,
            authToken,
            refreshToken
          );
        }
      } catch (error) {
        console.error("Error syncing to extension:", error);
      }
    };

    (async () => {
      const hasSession = await ensureValidSession();
      if (cancelled) return;

      if (!hasSession) {
        navigate("/login", { replace: true });
        return;
      }

      await syncToExtension();
      if (!cancelled) setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
          const success = await sendToExtension(extId, extId);
          if (success) {
            didSync = true;
            break;
          }
        }

        if (!didSync) {
          console.warn(
            "Could not reach any extension ID during home sync:",
            extensionIds
          );
        }
      } else {
        // Fallback to postMessage for Firefox
        window.postMessage(
          {
            type: "SHOPI_SET_USER_INFO",
            payload: message,
          },
          "*"
        );
      }
    } catch (error) {
      console.error("Extension sync error:", error);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f6f0]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFBC42] border-t-transparent" />
      </div>
    );
  }

  return <Dashboard />;
};

export default Home;

// ShopiWebApp/frontend/src/pages/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/NavBar";
import Dashboard from "../components/Dashboard";

// Support both Firefox and Chrome extension IDs
const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
const CHROME_EXT_ID = "kihghmelfnfgbkbeiebkgconkmgboilg";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
      return;
    }

    // Sync user info to extension on page load
    const syncToExtension = async () => {
      try {
        const userSub = localStorage.getItem("userSub");
        const userName = localStorage.getItem("userName");
        const authToken = localStorage.getItem("authToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!userSub || !userName) {
          // Try to decode from token
          const decoded = jwtDecode(token);
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
        console.log("Error syncing to extension:", error);
      }
    };

    syncToExtension();
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
        console.log("Syncing user info to extension...");

        const sendToExtension = async (extId, label) => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage(extId, message, () => {
              if (chrome.runtime.lastError) {
                console.log(`${label} extension not reachable`);
                resolve(false);
              } else {
                console.log(`✅ Synced user info to ${label} extension`);
                resolve(true);
              }
            });
          });
        };

        // Try both extension IDs
        await sendToExtension(FIREFOX_EXT_ID, "Firefox");
        await sendToExtension(CHROME_EXT_ID, "Chrome");
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
      console.log("Extension sync error:", error.message);
    }
  };

  return (
    <>
      <div className="h-full overflow-hidden">
        <Navbar />
        <Dashboard />
      </div>
    </>
  );
};

export default Home;

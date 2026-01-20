// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

// Support both Firefox and Chrome extension IDs
const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
const CHROME_EXT_ID = import.meta.env.VITE_EXTENSION_ID || "kihghmelfnfgbkbeiebkgconkmgboilg";

console.log("Extension IDs configured:", {
  firefox: FIREFOX_EXT_ID,
  chrome: CHROME_EXT_ID,
  fromEnv: import.meta.env.VITE_EXTENSION_ID,
});

const Login = () => {
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (token && refreshToken) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.exp < currentTime) {
          console.log("Found expired access token, but refresh token exists");
          // Don't clear tokens here - let the API utility handle refresh
          navigate("/home");
        } else {
          console.log("Token is valid, redirecting to home");
          navigate("/home");
        }
      } catch (error) {
        console.log("Invalid token, clearing...", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userSub");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
      }
    }
  }, [navigate]);

  const handleGoogleSuccess = (credentialResponse) => {
    console.log("JWT credential response:", credentialResponse);

    try {
      const decoded = jwtDecode(credentialResponse.credential);

      // Store initial user data (will be replaced by server tokens)
      localStorage.setItem("userSub", decoded.sub);
      localStorage.setItem("userEmail", decoded.email);
      localStorage.setItem("userName", decoded.name);

      loginSuccess(credentialResponse, decoded.sub, decoded.name);
      console.log("JWT decoded successfully.");
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

            console.log("Stored access and refresh tokens");

            // Send user info to extension and wait for it to complete
            console.log("About to send user info to extension...");
            await sendUserInfoToExtension(
              sub,
              name,
              data.accessToken,
              data.refreshToken
            );

            // Wait a moment to ensure message is sent
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Navigate after extension message is sent
            console.log("Navigating to /home...");
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
    console.log("sendUserInfoToExtension called with:", {
      userSub,
      userName,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    console.log("Browser APIs available:", {
      hasChrome: typeof chrome !== "undefined",
      hasChromeRuntime: typeof chrome !== "undefined" && !!chrome.runtime,
      hasChromeSendMessage:
        typeof chrome !== "undefined" && !!chrome.runtime?.sendMessage,
    });

    console.log(
      `Extension IDs: Firefox=${FIREFOX_EXT_ID}, Chrome=${CHROME_EXT_ID}`
    );

    const message = {
      type: "SET_USER_INFO",
      name: userName,
      sub: userSub,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    console.log("Message to send:", message);

    try {
      // Chrome approach: Use chrome.runtime.sendMessage with extension ID
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.sendMessage
      ) {
        console.log("Using Chrome API for extension communication");

        const sendToExtension = async (extId, label) => {
          return new Promise((resolve) => {
            console.log(`Trying to send to ${label} extension:`, extId);
            chrome.runtime.sendMessage(extId, message, (response) => {
              if (chrome.runtime.lastError) {
                console.log(
                  `${label} extension with id ${extId} not found:`,
                  chrome.runtime.lastError.message
                );
                resolve(false);
              } else {
                console.log(
                  `Successfully sent user info to ${label} extension`,
                  response
                );
                resolve(true);
              }
            });
          });
        };

        // Try Firefox first, then Chrome
        try {
          await sendToExtension(FIREFOX_EXT_ID, "Firefox");
        } catch (error) {
          // User is most likely not using FireFox, try Chrome
          await sendToExtension(CHROME_EXT_ID, "Chrome");
        }
      }
      // Firefox/Safari approach: Use window.postMessage to communicate with content script
      else {
        console.log(
          "🔍 Using postMessage API for extension communication (Firefox/Safari)"
        );

        return new Promise((resolve) => {
          // Listen for response from content script
          const handleResponse = (event) => {
            if (event.data && event.data.type === "SHOPI_EXT_RESPONSE") {
              console.log("✅ Received response from extension:", event.data);
              window.removeEventListener("message", handleResponse);
              resolve();
            }
          };

          window.addEventListener("message", handleResponse);

          // Send message to content script via window.postMessage
          window.postMessage(
            {
              type: "SHOPI_SET_USER_INFO",
              payload: message,
            },
            "*"
          );

          console.log("📨 Sent postMessage to content script");

          // Timeout after 2 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            console.log("⏱️ Extension message timeout");
            resolve();
          }, 2000);
        });
      }
    } catch (error) {
      console.log("❌ Extension communication error:", error.message);
    }
  };

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
              onError={() => console.log("Login failed")}
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

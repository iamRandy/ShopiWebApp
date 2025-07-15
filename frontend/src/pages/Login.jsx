// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const EXT_ID = import.meta.env.VITE_EXTENSION_ID;

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
      console.log("Decoded user data:", decoded);

      // Send user info to extension
      sendUserInfoToExtension({ sub: decoded.sub, name: decoded.name });

      // Store initial user data (will be replaced by server tokens)
      localStorage.setItem("userSub", decoded.sub);
      localStorage.setItem("userEmail", decoded.email);
      localStorage.setItem("userName", decoded.name);

      loginSuccess(credentialResponse);
      console.log("login successful??");
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  };

  function loginSuccess(cRes) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      fetch(`${API_URL}/api/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cRes.credential }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Login response:", data);

          // Store the new JWT tokens
          if (data.accessToken && data.refreshToken) {
            localStorage.setItem("authToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            console.log("Stored access and refresh tokens");

            // TODO: navigate to home page IFF user is not coming from extension
            return;
            navigate("/home");
          }
        })
        .catch((error) => {
          console.error("Error trying to fetch login data:", error);
        });
    } catch (e) {
      console.error("Error during login success", e);
    }
  }

  const sendUserInfoToExtension = ({ userSub, userName }) => {
    // Send message to extension using chrome.runtime.sendMessage with extension ID
    // var data = { type: "SET_USER_INFO", sub: userSub, name: userName }
    // window.postMessage(data, "*");

    if (chrome && chrome.runtime && EXT_ID) {
      console.log(
        "Sending message to extension via chrome.runtime.sendMessage"
      );
      chrome.runtime.sendMessage(
        EXT_ID,
        { type: "SET_USER_INFO", userSub, userName },
        (response) => {
          console.log("response from setuserinfo:", response);
          if (chrome.runtime.lastError) {
            console.error(
              "Extension communication error:",
              chrome.runtime.lastError
            );
          } else {
            console.log("Successfully sent user info to extension");
          }
        }
      );
    } else {
      console.error("Cannot send message to extension:", {
        chrome: !!window.chrome,
        runtime: !!window.chrome?.runtime,
        sendMessage: !!window.chrome?.runtime?.sendMessage,
        EXT_ID: EXT_ID,
      });
    }
  };

  return (
    <div className="w-full h-screen flex text-center text-black justify-center items-center bg-gray-200">
      <div className="relative w-full h-full overflow-hidden">
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

        <div className="z-[2] border w-fit h-fit rounded-lg p-8 flex flex-col justify-center items-center gap-6 bg-white shadow-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <motion.h3
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-800"
          >
            Sign up / Log in
          </motion.h3>

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
  );
};

export default Login;

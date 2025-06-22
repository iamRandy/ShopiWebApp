// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const EXT_ID = import.meta.env.VITE_EXTENSION_ID;

const Login = () => {
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("User already authenticated, redirecting to home");
      navigate("/home");
    }
  }, [navigate]);

  const login = useGoogleLogin({
    onSuccess: (credentialResponse) => {
      console.log(credentialResponse);
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded user data:", decoded);
      console.log("Extension ID:", EXT_ID);
      
      // Send userSub to extension
      sendUserSubToExtension(decoded.sub);
      
      // Store JWT token for authentication
      localStorage.setItem('authToken', credentialResponse.credential);
      localStorage.setItem('userSub', decoded.sub);
      localStorage.setItem('userEmail', decoded.email);
      localStorage.setItem('userName', decoded.name);
      console.log(decoded);
      loginSuccess(credentialResponse);
      navigate('/home');
    },
    onError: () => console.log("login failed"),
  });

  function loginSuccess(cRes) {
    try {
      fetch("http://localhost:3000/api/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cRes.credential }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.error("Error trying to fetch login data:", error);
        });
    } catch (e) {
      console.error("Error during login success", e);
    }
  }

  const sendUserSubToExtension = (userSub) => {
    console.log("Sending userSub to extension:", userSub);
    console.log("Extension ID:", EXT_ID);
    
    // Send message to extension using chrome.runtime.sendMessage with extension ID
    if (window.chrome?.runtime?.sendMessage && EXT_ID) {
      console.log("Sending message to extension via chrome.runtime.sendMessage");
      window.chrome.runtime.sendMessage(
        EXT_ID,
        { type: "SET_SUB", sub: userSub },
        (response) => {
          console.log("Extension response:", response);
          if (chrome.runtime.lastError) {
            console.error("Extension communication error:", chrome.runtime.lastError);
          } else {
            console.log("Successfully sent userSub to extension");
          }
        }
      );
    } else {
      console.error("Cannot send message to extension:", {
        chrome: !!window.chrome,
        runtime: !!window.chrome?.runtime,
        sendMessage: !!window.chrome?.runtime?.sendMessage,
        EXT_ID: EXT_ID
      });
    }
  };

  return (
    <div className="w-full h-screen flex text-center text-black justify-center items-center bg-gray-200">
      <div className="border w-fit h-fit rounded-lg p-8 flex flex-col justify-center items-center gap-6 bg-white shadow-xl">
        <motion.h3 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-800"
        >
          Sign up / Log in
        </motion.h3>
        
        <motion.button
          onClick={() => login()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            background: [
              "linear-gradient(white, white) padding-box, linear-gradient(0deg, #f59e0b, rgb(186, 78, 0)) border-box",
              "linear-gradient(white, white) padding-box, linear-gradient(90deg, #f59e0b,rgb(186, 78, 0)) border-box",
              "linear-gradient(white, white) padding-box, linear-gradient(180deg, #f59e0b, rgb(186, 78, 0)) border-box",
              "linear-gradient(white, white) padding-box, linear-gradient(270deg, #f59e0b, rgb(186, 78, 0)) border-box",
              "linear-gradient(white, white) padding-box, linear-gradient(360deg, #f59e0b, rgb(186, 78, 0)) border-box",
            ]
          }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
          style={{
            border: '2px solid transparent'
          }}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative"
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="w-6 h-6"
          />
          <span className="font-semibold">Sign in with Google</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Login;
